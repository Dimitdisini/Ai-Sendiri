#!/usr/bin/env node
// Server dashboard Kantor AI. Hampir tanpa dependency eksternal — cukup `node office/server.mjs`.
// Baca office/data/events.jsonl (ditulis oleh hooks) + folder companies/*/planning/ untuk menyusun state,
// lalu sajikan lewat REST API + Server-Sent Events ke office/public/index.html.
// Eksekutor tugas: pakai Claude Agent SDK (API langsung, ANTHROPIC_API_KEY) kalau tersedia,
// fallback ke CLI Claude Code kalau belum. Lihat EXECUTOR di bawah.

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { homedir } from "node:os";
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, statSync, watch, mkdirSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = process.env.OFFICE_PORT ? Number(process.env.OFFICE_PORT) : 4545;
const OFFICE_DIR = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(OFFICE_DIR, "..");
const COMPANIES_DIR = join(ROOT, "companies");
const DATA_DIR = join(OFFICE_DIR, "data");
const EVENTS_FILE = process.env.OFFICE_EVENTS || join(DATA_DIR, "events.jsonl"); // OFFICE_EVENTS: file lain untuk uji
const PUBLIC_DIR = join(OFFICE_DIR, "public");

mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(EVENTS_FILE)) writeFileSync(EVENTS_FILE, "");

// ---------- Konfigurasi dari office/.env (tanpa menimpa env shell) ----------
const ENV_FILE = join(OFFICE_DIR, ".env");
function loadEnv() {
  if (!existsSync(ENV_FILE)) return;
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
// Kunci akses untuk endpoint yang bisa menjalankan perintah atau menulis event. Dibuat otomatis sekali.
if (!process.env.OFFICE_TOKEN) {
  const tok = randomBytes(18).toString("base64url");
  appendFileSync(ENV_FILE, (existsSync(ENV_FILE) && !readFileSync(ENV_FILE, "utf8").endsWith("\n") ? "\n" : "") + "OFFICE_TOKEN=" + tok + "\n", { mode: 0o600 });
  process.env.OFFICE_TOKEN = tok;
  console.log("Kunci akses baru dibuat di office/.env (OFFICE_TOKEN).");
}
const TOKEN = process.env.OFFICE_TOKEN;
const HOST = process.env.OFFICE_HOST || "127.0.0.1"; // default hanya dari laptop ini; akses HP lewat tailscale serve
const CLAUDE_BIN = process.env.CLAUDE_BIN || (existsSync(join(homedir(), ".local/bin/claude")) ? join(homedir(), ".local/bin/claude") : "claude");
const AGY_BIN = process.env.AGY_BIN || (existsSync(join(homedir(), ".local/bin/agy")) ? join(homedir(), ".local/bin/agy") : "agy");
const COMMANDS_FILE = join(DATA_DIR, "commands.jsonl");

let roster = {};
try {
  roster = JSON.parse(readFileSync(join(OFFICE_DIR, "roster.json"), "utf8"));
} catch {
  roster = {};
}

// ---------- Parsing bantu ----------

function readMarkdownTable(path) {
  if (!existsSync(path)) return { headers: [], rows: [] };
  const lines = readFileSync(path, "utf8").split("\n");
  const tableLines = lines.filter((l) => l.trim().startsWith("|"));
  if (tableLines.length < 2) return { headers: [], rows: [] };
  const splitRow = (l) =>
    l
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  const headers = splitRow(tableLines[0]);
  const rows = [];
  for (let i = 2; i < tableLines.length; i++) {
    const cells = splitRow(tableLines[i]);
    if (cells.every((c) => c === "")) continue;
    const row = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] || ""));
    rows.push(row);
  }
  return { headers, rows };
}

function roadmapProgress(rows) {
  if (!rows.length) return 0;
  const done = rows.filter((r) => /selesai|100%|done/i.test(Object.values(r).join(" "))).length;
  return Math.round((done / rows.length) * 100);
}

function walkFiles(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const name of readdirSync(cur)) {
      if (name === ".gitkeep") continue;
      const full = join(cur, name);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else if (!exts || exts.includes(extname(name).toLowerCase())) {
        out.push({ path: full, rel: relative(COMPANIES_DIR, full), mtime: st.mtimeMs });
      }
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

function listCompanies() {
  if (!existsSync(COMPANIES_DIR)) return [];
  return readdirSync(COMPANIES_DIR).filter((n) => statSync(join(COMPANIES_DIR, n)).isDirectory());
}

function companyMeta(slug) {
  const claudeMd = join(COMPANIES_DIR, slug, "CLAUDE.md");
  let name = slug;
  if (existsSync(claudeMd)) {
    const first = readFileSync(claudeMd, "utf8").split("\n")[0] || "";
    const m = first.match(/^#\s*(.+?)\s*—/);
    if (m) name = m[1];
  }
  return { slug, name };
}

// ---------- State dari events.jsonl (di-replay penuh tiap request state; file kecil, cukup cepat) ----------

function loadEvents() {
  if (!existsSync(EVENTS_FILE)) return [];
  const raw = readFileSync(EVENTS_FILE, "utf8").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

const IDLE_AFTER_MS = 10 * 60 * 1000; // istirahat kalau tidak ada event 10 menit

// Kalau subagen dipanggil dengan tipe generik (misal dari aplikasi desktop), tebak perannya dari file yang ditulis.
const GENERIC_TYPES = new Set(["general-purpose", "subagent", "claude", "Explore", "Plan"]);
function inferRoleFromFile(file) {
  if (!file) return null;
  const f = file.replace(/\\/g, "/");
  if (/\/BRD\.md$/i.test(f)) return "business-analyst";
  if (/\/(PRD|TIMELINE|CHANGE-\d+|BACKLOG)\.md$/i.test(f)) return "pm";
  if (/\/(FD|TDD|ANALISIS[^/]*)\.md$/i.test(f) || /\/planning\/plans\//.test(f) || /\/docs\/riset\//.test(f)) return "analyst";
  if (/\/(AI-SPEC|EVAL-REPORT)\.md$/i.test(f)) return "ai-engineer";
  if (/\/planning\/qa\//.test(f)) return "qa";
  if (/\/hq\/(jurnal|briefings)\//.test(f)) return "chief-of-staff";
  return null;
}

// Pemakaian kasar per perusahaan: jumlah aksi (Pre/PostToolUse) dan sesi unik, hari ini & 7 hari.
// Ini BUKAN biaya token asli (kita tidak menghitung token), tapi cukup untuk lihat perusahaan mana
// yang paling sibuk dan kapan lonjakan aktivitas terjadi.
function computeUsage() {
  const events = loadEvents();
  const now = Date.now(), dayMs = 24 * 60 * 60 * 1000;
  const byCompany = new Map(); // slug -> { todayActions, weekActions, todaySessions:Set, weekSessions:Set }
  for (const e of events) {
    if (e.hook !== "PreToolUse" && e.hook !== "PostToolUse") continue;
    const slug = e.company || "hq";
    if (!byCompany.has(slug)) byCompany.set(slug, { todayActions: 0, weekActions: 0, todaySessions: new Set(), weekSessions: new Set() });
    const b = byCompany.get(slug);
    const age = now - (e.ts || 0);
    if (age <= 7 * dayMs) { b.weekActions++; if (e.session_id) b.weekSessions.add(e.session_id); }
    if (age <= dayMs) { b.todayActions++; if (e.session_id) b.todaySessions.add(e.session_id); }
  }
  const out = {};
  for (const [slug, b] of byCompany) out[slug] = { todayActions: b.todayActions, weekActions: b.weekActions, todaySessions: b.todaySessions.size, weekSessions: b.weekSessions.size };
  return out;
}

function computeAgentState() {
  const events = loadEvents();
  const agents = new Map(); // key: company|agent_type
  const sticky = new Map(); // agent_id atau session -> { company, role } terakhir yang diketahui
  for (const e of events) {
    const id = e.agent_id || `s:${e.session_id}`;
    const known = sticky.get(id) || {};
    let company = e.company || known.company || "hq";
    let type = e.agent_type || (e.hook === "SubagentStart" ? "subagent" : null);
    if (!type) continue;
    // Tebak peran hanya dari file yang DITULIS, bukan yang dibaca (membaca BRD bukan berarti dia Business Analyst)
    const wrote = e.wrote === true || e.tool === "Write" || e.tool === "Edit" || e.tool === "MultiEdit";
    if (GENERIC_TYPES.has(type)) type = (wrote && inferRoleFromFile(e.file)) || known.role || type;
    sticky.set(id, { company, role: GENERIC_TYPES.has(type) ? known.role : type });
    // Pindahkan riwayat dari kunci generik ke peran yang baru diketahui, supaya hitungan aksi tidak terpecah
    if (!GENERIC_TYPES.has(type) && e.agent_type && GENERIC_TYPES.has(e.agent_type)) {
      for (const oldKey of [`${company}|${e.agent_type}`, `hq|${e.agent_type}`]) {
        const old = agents.get(oldKey);
        if (old && old.ownerId === id) {
          agents.delete(oldKey);
          const newKey = `${company}|${type}`;
          if (!agents.has(newKey)) { old.key = newKey; old.company = company; old.type = type; agents.set(newKey, old); }
          else { const t = agents.get(newKey); t.actions += old.actions; old.sessions.forEach((s) => t.sessions.add(s)); }
        }
      }
    }
    const key = `${company}|${type}`;
    if (!agents.has(key)) {
      agents.set(key, {
        key,
        company,
        type,
        ownerId: id,
        actions: 0,
        sessions: new Set(),
        lastSummary: "",
        lastTs: 0,
        working: false,
      });
    }
    const a = agents.get(key);
    if (e.session_id) a.sessions.add(e.session_id);
    if (e.hook === "PreToolUse" || e.hook === "PostToolUse") a.actions += 1;
    // Mulai kerja: subagen dipanggil, CEO mengirim prompt, atau ada tool dipakai. Selesai: subagen berhenti atau giliran utama selesai.
    if (e.hook === "SubagentStart" || e.hook === "UserPromptSubmit" || e.hook === "PreToolUse") a.working = true;
    if (e.hook === "SubagentStop" || e.hook === "Stop" || e.hook === "StopFailure") a.working = false;
    if (e.summary) a.lastSummary = e.summary;
    a.lastTs = Math.max(a.lastTs, e.ts || 0);
  }
  const now = Date.now();
  return [...agents.values()].map((a) => {
    const meta = roster[a.type] || { role: a.type, nickname: a.type, color: "#64748b" };
    const idle = now - a.lastTs > IDLE_AFTER_MS;
    return {
      company: a.company,
      type: a.type,
      role: meta.role,
      nickname: meta.nickname,
      color: meta.color,
      status: a.working && !idle ? "kerja" : "istirahat",
      lastSummary: a.lastSummary,
      lastTs: a.lastTs,
      actions: a.actions,
      sessions: a.sessions.size,
    };
  });
}

// Feed aktivitas kronologis per orang (dipakai kolom "Aktivitas langsung" di dashboard).
// Pakai pelacakan peran "sticky" yang sama dengan computeAgentState, supaya nama yang muncul
// di feed konsisten dengan kartu Tim Aktif (bukan cuma label generik "general-purpose").
function computeActivityFeed(limit = 60) {
  const events = loadEvents();
  const sticky = new Map();
  const feed = [];
  for (const e of events) {
    const id = e.agent_id || `s:${e.session_id}`;
    const known = sticky.get(id) || {};
    const company = e.company || known.company || null;
    let type = e.agent_type || (e.hook === "SubagentStart" ? "subagent" : null);
    if (!type) continue;
    const wrote = e.wrote === true || e.tool === "Write" || e.tool === "Edit" || e.tool === "MultiEdit";
    if (GENERIC_TYPES.has(type)) type = (wrote && inferRoleFromFile(e.file)) || known.role || type;
    sticky.set(id, { company, role: GENERIC_TYPES.has(type) ? known.role : type });
    if (e.hook !== "PostToolUse" || !e.summary) continue;
    const meta = roster[type] || { role: type, nickname: type, color: "#64748b" };
    feed.push({ ts: e.ts, company, type, role: meta.role, nickname: meta.nickname, color: meta.color, tool: e.tool, summary: e.summary.slice(0, 140) });
  }
  return feed.slice(-limit).reverse();
}

// Rapat: aktif kalau ada notulen di meetings/ yang baru ditulis, atau minimal 2 peran subagen aktif dalam jendela pendek.
const MEETING_WINDOW_MS = 12 * 60 * 1000;
function computeMeeting(slug, agents) {
  const events = loadEvents();
  const now = Date.now();
  let notulen = null;
  for (const e of events) {
    if (e.company !== slug) continue;
    if (e.wrote && e.file && /\/meetings\/[^/]+\.md$/.test(e.file) && now - e.ts < MEETING_WINDOW_MS) notulen = e;
  }
  const activeRoles = agents.filter((a) => a.status === "kerja" && a.type !== "orchestrator" && !GENERIC_TYPES.has(a.type)).map((a) => a.type);
  const active = !!notulen || activeRoles.length >= 2;
  if (!active) return { active: false };
  let title = "Koordinasi tim";
  if (notulen) {
    const m = notulen.file.match(/\/meetings\/\d{4}-\d{2}-\d{2}-([a-z]+)-?(.*)\.md$/i);
    if (m) title = `${m[1]}${m[2] ? " · " + m[2] : ""}`;
  }
  const participants = [...new Set(["orchestrator", ...activeRoles, ...agents.filter((a) => now - a.lastTs < 3 * 60 * 1000 && !GENERIC_TYPES.has(a.type)).map((a) => a.type)])];
  return { active: true, title, participants };
}

// Kesadaran kuota: kalau giliran terakhir gagal karena API (StopFailure) dan belum ada aktivitas sukses setelahnya,
// anggap tim sedang tertahan. Jendela kuota langganan Claude = 5 jam, jadi tampilkan perkiraan pulihnya.
const QUOTA_WINDOW_MS = 5 * 60 * 60 * 1000;
function computeQuota() {
  const events = loadEvents();
  let lastFail = null;
  let lastOkAfterFail = false;
  for (const e of events) {
    if (e.hook === "StopFailure") {
      lastFail = e;
      lastOkAfterFail = false;
    } else if (lastFail && (e.hook === "PostToolUse" || e.hook === "Stop") && e.ts > lastFail.ts) {
      lastOkAfterFail = true;
    }
  }
  if (!lastFail || lastOkAfterFail) return { status: "ok" };
  const age = Date.now() - lastFail.ts;
  if (age > QUOTA_WINDOW_MS) return { status: "ok" };
  const isRateLimit = /rate|limit|quota|usage|429|overloaded|kuota/i.test(lastFail.summary || "");
  return {
    status: isRateLimit ? "habis" : "error",
    since: lastFail.ts,
    resumeAt: lastFail.ts + QUOTA_WINDOW_MS,
    message: lastFail.summary || "",
  };
}

// ---------- HTTP ----------

const sseClients = new Set();

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(body);
}

function serveStatic(req, res, urlPath) {
  const safePath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = extname(filePath);
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
  res.writeHead(200, { "Content-Type": (types[ext] || "application/octet-stream") + "; charset=utf-8" });
  res.end(readFileSync(filePath));
}

function serveEvidence(req, res, urlPath) {
  // /files/<company>/<...> -> companies/<company>/planning/qa/bukti/<...>
  const parts = decodeURIComponent(urlPath).split("/").filter(Boolean); // ["files","<company>", ...]
  const company = parts[1];
  const rest = parts.slice(2).join("/");
  const filePath = join(COMPANIES_DIR, company, "planning", "qa", "bukti", rest);
  const bukiRoot = join(COMPANIES_DIR, company, "planning", "qa", "bukti");
  if (!filePath.startsWith(bukiRoot) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = extname(filePath);
  const types = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  res.end(readFileSync(filePath));
}

// ---------- Konfigurasi per perusahaan: formasi (team.json) + profil (baris "- Kunci: nilai" di CLAUDE.md) ----------
function allRoles() { try { roster = JSON.parse(readFileSync(join(OFFICE_DIR, "roster.json"), "utf8")); } catch { /* pakai lama */ } return Object.keys(roster); }
function readTeam(slug) {
  const f = join(COMPANIES_DIR, slug, "team.json");
  try { const t = JSON.parse(readFileSync(f, "utf8")); const r = (t.roles || []).filter((x) => roster[x]); if (!r.includes("orchestrator")) r.unshift("orchestrator"); return { roles: r, notes: t.notes || "", configured: true }; }
  catch { return { roles: allRoles(), notes: "", configured: false }; }
}
function readProfile(slug) {
  const f = join(COMPANIES_DIR, slug, "CLAUDE.md");
  if (!existsSync(f)) return [];
  return readFileSync(f, "utf8").split("\n").map((l) => l.match(/^- ([^:]{2,80}):\s?(.*)$/)).filter(Boolean).map((m) => ({ key: m[1].trim(), value: m[2] }));
}
function writeProfile(slug, fields, name) {
  const f = join(COMPANIES_DIR, slug, "CLAUDE.md");
  if (!existsSync(f)) return;
  const map = new Map(fields.map((x) => [String(x.key), String(x.value ?? "").replace(/[\r\n]+/g, " ").slice(0, 600)]));
  const lines = readFileSync(f, "utf8").split("\n").map((l, i) => {
    const m = l.match(/^- ([^:]{2,80}):\s?(.*)$/);
    if (m && map.has(m[1].trim())) return `- ${m[1].trim()}: ${map.get(m[1].trim())}`;
    if (i === 0 && name) return `# ${String(name).replace(/[\r\n#]/g, "").slice(0, 80)} — Konteks`;
    return l;
  });
  writeFileSync(f, lines.join("\n"));
}

function authorized(req) {
  const h = req.headers.authorization || "";
  if (!/^Bearer\s+/i.test(h)) return false;
  const got = Buffer.from(h.replace(/^Bearer\s+/i, "")), want = Buffer.from(TOKEN);
  return got.length === want.length && timingSafeEqual(got, want);
}
// Basic Auth di depan SELURUH server (halaman, gambar, API baca) — bukan cuma perintah tulis.
// Perlu ini karena dashboard bisa diakses lewat tunnel publik (Cloudflare dll), jadi tampilan
// baca-baca (riwayat perintah, roster tim) tidak boleh terbuka tanpa kunci sama sekali.
// Username bebas (browser tetap minta diisi), password = OFFICE_TOKEN.
// authorized() (Bearer, dipakai dashboard/Telegram) DAN basicAuthOk() (Basic, dipakai browser
// biasa) dua-duanya sah untuk endpoint yang tadinya hanya cek authorized() — lihat masukAman().
function basicAuthOk(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Basic ")) return false;
  let user = "", pass = "";
  try { [user, pass] = Buffer.from(h.slice(6), "base64").toString("utf8").split(":"); } catch { return false; }
  const got = Buffer.from(pass || ""), want = Buffer.from(TOKEN);
  return got.length === want.length && timingSafeEqual(got, want);
}
function masukAman(req) { return authorized(req) || basicAuthOk(req); }
function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let buf = ""; req.setEncoding("utf8");
    req.on("data", (c) => { buf += c; if (buf.length > limit) { reject(new Error("terlalu besar")); req.destroy(); } });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch { reject(new Error("JSON tidak valid")); } });
    req.on("error", reject);
  });
}

// ---------- Perintah dari dashboard -> Orkestrator (claude -p), satu per satu ----------
const jobs = [];
let running = null;
function loadJobs() {
  if (!existsSync(COMMANDS_FILE)) return;
  const last = new Map();
  for (const l of readFileSync(COMMANDS_FILE, "utf8").trim().split("\n")) { try { const j = JSON.parse(l); last.set(j.id, j); } catch { /* lewati */ } }
  for (const j of last.values()) { if (j.status === "jalan" || j.status === "antre") j.status = "terhenti"; jobs.push(j); }
}
loadJobs();
async function notifyTelegram(text) {
  const tok = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!tok || !chat) return;
  try {
    for (let i = 0; i < text.length; i += 3900) {
      await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: text.slice(i, i + 3900) }),
      });
    }
  } catch { /* Telegram opsional, jangan sampai gagal di sini menghentikan job */ }
}

function saveJob(j) { appendFileSync(COMMANDS_FILE, JSON.stringify(j) + "\n"); }

// EXECUTOR: "api" pakai Claude Agent SDK langsung (butuh ANTHROPIC_API_KEY di office/.env,
// tidak butuh aplikasi Claude Code sama sekali). "cli" pakai binary `claude` (perlu app/login).
// Pilih otomatis: ada ANTHROPIC_API_KEY -> "api", kalau tidak -> "cli" (lama, tetap didukung).
const EXECUTOR = process.env.CLAUDE_EXECUTOR || (process.env.ANTHROPIC_API_KEY ? "api" : "cli");
let sdkQuery = null;
if (EXECUTOR === "api") {
  try { ({ query: sdkQuery } = await import("@anthropic-ai/claude-agent-sdk")); }
  catch (e) { console.error("Gagal memuat @anthropic-ai/claude-agent-sdk, fallback ke CLI:", e.message); }
}

// ---------- Eksekutor Antigravity CLI (agy) — pakai langganan Google Pro, bukan Claude ----------
// agy tidak mengenal format .claude/agents/*.md, jadi kita baca sendiri file peran itu dan
// tempelkan sebagai instruksi peran di depan prompt. Estafet multi-peran (kerja malam) juga
// diorkestrasi manual di sini (panggil agy berkali-kali per peran), bukan lewat Task tool bawaan.
function bacaAgen(peranSlug) {
  const p = join(ROOT, ".claude", "agents", `${peranSlug}.md`);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8").replace(/^---[\s\S]*?---\n/, "").trim();
}

// Pengaturan model per peran (dipilih CEO lewat dashboard). Cuma dipakai kalau eksekutor tugas
// itu "agy" — CLI/API punya model bawaan sendiri. { "<peran>": { "model": "...", "effort": "..." } }
const MODEL_PERAN_FILE = join(DATA_DIR, "model-peran.json");
const DAFTAR_MODEL_AGY = [
  "gemini-3.8-flash-low", "gemini-3.8-flash-medium", "gemini-3.8-flash-high",
  "gemini-3.7-flash-low", "gemini-3.7-flash-medium", "gemini-3.7-flash-high",
  "gemini-3.6-flash-low", "gemini-3.6-flash-medium", "gemini-3.6-flash-high",
  "gemini-3.1-pro-low", "gemini-3.1-pro-high",
  "claude-sonnet-4-6", "claude-opus-4-6-thinking", "gpt-oss-120b-medium",
];
function bacaModelPeran() { try { return JSON.parse(readFileSync(MODEL_PERAN_FILE, "utf8")); } catch { return {}; } }
function modelUntukPeran(peranSlug) {
  const m = bacaModelPeran()[peranSlug];
  return m && typeof m === "object" ? { model: m.model || null, effort: m.effort || null } : { model: null, effort: null };
}
function jalankanAgy(promptText, { timeoutMs = 20 * 60 * 1000, onChild = null, effort = null, model = null } = {}) {
  return new Promise((resolve) => {
    const args = ["-p", promptText, "--output-format", "text", "--dangerously-skip-permissions"];
    if (effort) args.push("--effort", effort);
    if (model) args.push("--model", model);
    const child = spawn(AGY_BIN, args, { cwd: ROOT, env: process.env });
    if (onChild) onChild(child);
    let out = "", err = "";
    const t = setTimeout(() => { try { child.kill("SIGTERM"); } catch { /* abaikan */ } }, timeoutMs);
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("close", (code) => { clearTimeout(t); resolve({ ok: code === 0, out: out.trim(), err: err.trim() }); });
    child.on("error", (e) => { clearTimeout(t); resolve({ ok: false, out: out.trim(), err: String(e) }); });
  });
}
function jalankanViaAgy(j) {
  running = j;
  jalankanAgy(buatPrompt(j), { onChild: (c) => { j._child = c; j.pid = c.pid; }, effort: j.effort, model: j.model })
    .then((r) => selesaikanJob(j, r.out, r.err, r.ok ? 0 : 1));
}

// Baca header plan "Perusahaan: .. | Modul: .. | Status: .. | Pemilik: .." -> { status, pemilik }
function bacaHeaderPlan(isi) {
  const baris = isi.split("\n").find((l) => l.includes("Status:")) || "";
  const status = (baris.match(/Status:\s*([^|]+)/) || [, ""])[1].trim();
  const pemilik = (baris.match(/Pemilik:\s*([^|]+)/) || [, ""])[1].trim().toLowerCase().replace(/\s+/g, "-");
  return { status, pemilik };
}
function cariPlanSiap(maksPerPerusahaan = 2) {
  const hasil = [];
  for (const slug of listCompanies()) {
    const dir = join(COMPANIES_DIR, slug, "planning", "plans");
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
    let ambil = 0;
    for (const f of files) {
      if (ambil >= maksPerPerusahaan) break;
      const path = join(dir, f);
      const isi = readFileSync(path, "utf8");
      const { status, pemilik } = bacaHeaderPlan(isi);
      if (status === "Siap" && pemilik) { hasil.push({ company: slug, file: f, path, pemilik }); ambil++; }
    }
  }
  return hasil;
}
async function jalankanKerjaMalamAgy(j) {
  running = j;
  const plans = cariPlanSiap(2);
  if (plans.length === 0) { selesaikanJob(j, "tidak ada plan siap", "", 0); return; }
  const ringkasan = [];
  for (const p of plans) {
    if (j.status !== "jalan") { ringkasan.push("Dihentikan dari dashboard."); break; }
    const peranMd = bacaAgen(p.pemilik);
    if (!peranMd) { ringkasan.push(`${p.company}/${p.file}: peran "${p.pemilik}" tidak ditemukan di .claude/agents/, dilewati.`); continue; }
    let verdict = "FAIL", ronde = 0;
    while (ronde < 3 && verdict !== "PASS") {
      ronde++;
      if (j.status !== "jalan") break; // dihentikan dari dashboard
      const rDev = await jalankanAgy(`${peranMd}\n\n---\nKerja malam tanpa CEO, ronde ${ronde}. Perusahaan: ${p.company}. Kerjakan plan companies/${p.company}/planning/plans/${p.file} sampai tuntas sesuai acceptance criteria-nya. Tulis progress/handback di file plan itu sendiri. Jangan menyentuh folder perusahaan lain, jangan deploy produksi, jangan kirim email/pesan. Jawab akhir maksimal 5 baris.`, { onChild: (c) => { j._child = c; j.pid = c.pid; }, ...modelUntukPeran(p.pemilik) });
      if (j.status !== "jalan") break;
      const qaMd = bacaAgen("qa");
      const rQa = await jalankanAgy(`${qaMd}\n\n---\nKerja malam tanpa CEO, ronde ${ronde}. Perusahaan: ${p.company}. Uji plan companies/${p.company}/planning/plans/${p.file} terhadap acceptance criteria. Tulis planning/qa/${p.file.replace(".md", "")}-qa-r${ronde}.md dari templates/QA-REPORT.md. WAJIB akhiri jawabanmu persis dengan salah satu: "VERDICT: PASS" atau "VERDICT: FAIL".`, { onChild: (c) => { j._child = c; j.pid = c.pid; }, ...modelUntukPeran("qa") });
      verdict = /VERDICT:\s*PASS/i.test(rQa.out) ? "PASS" : "FAIL";
      if (!rDev.ok || !rQa.ok) { ringkasan.push(`${p.company}/${p.file}: error teknis ronde ${ronde} (dev ok=${rDev.ok}, qa ok=${rQa.ok}).`); break; }
    }
    ringkasan.push(`${p.company}/${p.file} (pemilik ${p.pemilik}): ${verdict} setelah ${ronde} ronde.`);
  }
  selesaikanJob(j, ringkasan.join("\n"), "", 0);
}

function buatPrompt(j) {
  const where = j.company ? `Perusahaan: ${j.company} (folder companies/${j.company}/). ` : "";
  return j.origin === "jadwal"
    ? `Tugas terjadwal Kantor AI (${j.jadwalId}), dijalankan otomatis tanpa CEO. ${where}Jalankan sesuai CLAUDE.md.\n\n${j.text}`
    : `Perintah dari CEO lewat dashboard Kantor AI. ${where}Jalankan sesuai CLAUDE.md. Jawab ringkas maksimal 15 baris, tanpa tabel markdown.\n\n${j.text}`;
}

function selesaikanJob(j, out, err, code) {
  if (j.status === "jalan") j.status = code === 0 ? "selesai" : "gagal";
  j.ended = Date.now(); j.output = (out.trim() || err.trim() || "(tidak ada keluaran)").slice(-6000); delete j.pid;
  saveJob(j); running = null; broadcast(); nextJob();
  const label = j.status === "selesai" ? "✅" : j.status === "dihentikan" ? "⏹" : "❌";
  if (!j.diam) notifyTelegram(`${label} ${j.origin === "jadwal" ? "Jadwal " + j.jadwalId : "Perintah"}${j.company ? " (" + j.company + ")" : ""}: ${j.origin === "jadwal" ? "" : j.text}

${j.output}`);
}

async function jalankanViaApi(j) {
  let out = "", err = "";
  try {
    const q = sdkQuery({
      prompt: buatPrompt(j),
      options: { cwd: ROOT, permissionMode: "bypassPermissions" },
    });
    j._child = { kill: () => q.interrupt?.() };
    for await (const msg of q) {
      if (msg.type === "assistant") {
        for (const block of msg.message?.content || []) {
          if (block.type === "text") { out += block.text; j.output = out.slice(-6000); }
        }
      } else if (msg.type === "result") {
        if (msg.subtype !== "success") err += msg.subtype + (msg.error ? `: ${msg.error}` : "");
        if (msg.result && !out) out = msg.result;
      }
    }
    selesaikanJob(j, out, err, err ? 1 : 0);
  } catch (e) {
    selesaikanJob(j, out, String(e?.message || e), 1);
  }
}

function jalankanViaCli(j) {
  const prompt = buatPrompt(j);
  const args = ["-p", prompt, "--output-format", "text"];
  if (process.env.CLAUDE_SAFE !== "1") args.push("--dangerously-skip-permissions");
  const child = spawn(CLAUDE_BIN, args, { cwd: ROOT, env: process.env });
  j.pid = child.pid;
  let out = "", err = "";
  child.stdout.on("data", (d) => { out += d; j.output = out.slice(-6000); });
  child.stderr.on("data", (d) => { err += d; });
  child.on("close", (code) => selesaikanJob(j, out, err, code));
  child.on("error", (e) => selesaikanJob(j, out, String(e), -1));
  j._child = child;
}

function nextJob() {
  if (running) return;
  const j = jobs.find((x) => x.status === "antre"); if (!j) return;
  running = j; j.status = "jalan"; j.started = Date.now(); saveJob(j); broadcast();
  if (j.jadwalId === "kerja-malam" && j.executor === "agy") { jalankanKerjaMalamAgy(j); return; }
  if (j.executor === "agy") { jalankanViaAgy(j); return; }
  if (EXECUTOR === "api" && sdkQuery) jalankanViaApi(j); else jalankanViaCli(j);
}
function enqueueJob({ text, company = null, origin = "manual", jadwalId = null, diam = false, executor = null, effort = null, model = null }) {
  const j = { id: randomBytes(6).toString("hex"), text, company, origin, jadwalId, diam, executor, effort, model, status: "antre", created: Date.now(), output: "" };
  jobs.push(j); saveJob(j); nextJob(); broadcast();
  return j;
}

// ---------- Penjadwal lokal (menggantikan Scheduled Tasks aplikasi Claude) ----------
// Jalan di dalam server ini (dikelola launchd), jadi tidak butuh aplikasi Claude terbuka.
// Tugas masuk ke antrean yang SAMA dengan Telegram dan dashboard, jadi tidak pernah bentrok.
// Kalau Mac tidur saat jadwal, tugas dikejar begitu bangun, asal telatnya kurang dari 3 jam.
const JADWAL_FILE = join(OFFICE_DIR, "jadwal.json");
const JADWAL_STATE = join(DATA_DIR, "jadwal-state.json");
const JADWAL_TELAT_MAKS_MS = 3 * 60 * 60 * 1000;
function bacaJadwal() { try { return JSON.parse(readFileSync(JADWAL_FILE, "utf8")); } catch { return []; } }
function bacaState() { try { return JSON.parse(readFileSync(JADWAL_STATE, "utf8")); } catch { return {}; } }
function tanggalLokal(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function cekJadwal() {
  const now = new Date(), hari = tanggalLokal(now), state = bacaState();
  let ubah = false;
  for (const t of bacaJadwal()) {
    if (!t.aktif || !Array.isArray(t.hari) || !t.hari.includes(now.getDay())) continue;
    if (state[t.id] && state[t.id].tanggal === hari) continue;
    const [hh, mm] = String(t.jam || "").split(":").map(Number);
    if (Number.isNaN(hh)) continue;
    const target = new Date(now); target.setHours(hh, mm || 0, 0, 0);
    const telat = now - target;
    if (telat < 0) continue;
    if (telat > JADWAL_TELAT_MAKS_MS) { state[t.id] = { tanggal: hari, status: "terlewat", ts: Date.now() }; ubah = true; continue; }
    if (jobs.some((x) => x.jadwalId === t.id && (x.status === "antre" || x.status === "jalan"))) continue;
    const j = enqueueJob({ text: t.perintah, company: t.perusahaan || null, origin: "jadwal", jadwalId: t.id, diam: !!t.diam, executor: t.executor || null, effort: t.effort || null, model: t.model || null });
    state[t.id] = { tanggal: hari, status: telat > 5 * 60 * 1000 ? "dikejar (telat " + Math.round(telat / 60000) + " menit)" : "tepat waktu", job: j.id, ts: Date.now() };
    ubah = true;
  }
  if (ubah) writeFileSync(JADWAL_STATE, JSON.stringify(state, null, 2));
}
setInterval(cekJadwal, 30 * 1000);
setTimeout(cekJadwal, 5000);

function publicJob(j) { const { _child, ...rest } = j; return rest; }

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  // Gerbang login di depan semuanya. Selalu wajib, dari mana pun — termasuk dari Mac ini sendiri —
  // karena kalau dibuka lewat link tunnel publik, semua koneksi kelihatan datang dari Mac ini juga
  // (tunnelnya nyambung ke server ini secara lokal), jadi tidak bisa dibedakan mana yang aman.
  // Browser akan mengingat login ini sendiri setelah pertama kali diisi, jadi tidak akan ditanya terus.
  if (!masukAman(req)) {
    res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Kantor AI"', "Content-Type": "text/plain" });
    res.end("Butuh login. Password = OFFICE_TOKEN di office/.env, username bebas.");
    return;
  }

  if (path === "/api/auth" && req.method === "GET") { sendJSON(res, authorized(req) ? 200 : 401, { ok: authorized(req) }); return; }

  if (path === "/api/jadwal" && req.method === "GET") { sendJSON(res, 200, { jadwal: bacaJadwal().map(({ perintah, ...r }) => r), status: bacaState() }); return; }

  if (path === "/api/commands" && req.method === "GET") { sendJSON(res, 200, jobs.slice(-20).reverse().map(publicJob)); return; }

  const mGetJob = path.match(/^\/api\/command\/([a-f0-9]+)$/);
  if (mGetJob && req.method === "GET") {
    const j = jobs.find((x) => x.id === mGetJob[1]);
    if (!j) { sendJSON(res, 404, { error: "tidak ada" }); return; }
    sendJSON(res, 200, publicJob(j)); return;
  }

  if (path === "/api/command" && req.method === "POST") {
    if (!masukAman(req)) { sendJSON(res, 401, { error: "Kunci akses salah atau belum diisi" }); return; }
    let body; try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: String(e.message) }); return; }
    const text = String(body.text || "").trim().slice(0, 4000);
    if (!text) { sendJSON(res, 400, { error: "Perintah kosong" }); return; }
    const company = body.company && /^[a-z0-9._-]+$/i.test(body.company) && existsSync(join(COMPANIES_DIR, body.company)) ? body.company : null;
    const executor = body.executor === "agy" ? "agy" : null;
    const effort = ["low", "medium", "high", "max"].includes(body.effort) ? body.effort : null;
    const model = typeof body.model === "string" && /^[a-z0-9.-]{1,40}$/i.test(body.model) ? body.model : null;
    const j = enqueueJob({ text, company, origin: "manual", executor, effort, model });
    sendJSON(res, 200, publicJob(j)); return;
  }

  const mStop = path.match(/^\/api\/command\/([a-f0-9]+)\/stop$/);
  if (mStop && req.method === "POST") {
    if (!masukAman(req)) { sendJSON(res, 401, { error: "Kunci akses salah" }); return; }
    const j = jobs.find((x) => x.id === mStop[1]);
    if (!j) { sendJSON(res, 404, { error: "tidak ada" }); return; }
    if (j.status === "antre") { j.status = "dibatalkan"; saveJob(j); }
    else if (j.status === "jalan" && j._child) { j.status = "dihentikan"; j._child.kill("SIGTERM"); }
    broadcast(); sendJSON(res, 200, publicJob(j)); return;
  }

  // Event dari tool lain (Antigravity, Codex, skrip). Format sama dengan hooks.
  if (path === "/api/event" && req.method === "POST") {
    if (!masukAman(req)) { sendJSON(res, 401, { error: "Kunci akses salah" }); return; }
    let b; try { b = await readBody(req); } catch (e) { sendJSON(res, 400, { error: String(e.message) }); return; }
    const type = String(b.agent_type || b.role || "").trim();
    if (!/^[a-z0-9-]{2,40}$/.test(type)) { sendJSON(res, 400, { error: "agent_type wajib, huruf kecil dan tanda minus, misal backend" }); return; }
    const HOOKS = new Set(["SubagentStart", "PreToolUse", "PostToolUse", "SubagentStop"]);
    const status = String(b.status || "").toLowerCase();
    const hook = HOOKS.has(b.hook) ? b.hook : status === "selesai" || status === "istirahat" ? "SubagentStop" : "PreToolUse";
    const company = b.company && /^[a-z0-9._-]+$/i.test(b.company) ? b.company : null;
    const rec = { ts: Date.now(), hook, session_id: String(b.session || "ext-" + (b.source || "luar")).slice(0, 60), agent_type: type, agent_id: "ext-" + type, company, cwd: null, tool: String(b.tool || b.source || "External").slice(0, 40), summary: String(b.summary || "").slice(0, 200), source: String(b.source || "luar").slice(0, 40) };
    appendFileSync(EVENTS_FILE, JSON.stringify(rec) + "\n");
    sendJSON(res, 200, { ok: true }); return;
  }

  const mCfg = path.match(/^\/api\/company\/([a-z0-9._-]+)\/config$/i);
  if (mCfg) {
    const slug = mCfg[1];
    if (!existsSync(join(COMPANIES_DIR, slug))) { sendJSON(res, 404, { error: "perusahaan tidak ada" }); return; }
    if (req.method === "GET") { sendJSON(res, 200, { slug, name: companyMeta(slug).name, team: readTeam(slug), profile: readProfile(slug), roster }); return; }
    if (req.method === "POST") {
      if (!masukAman(req)) { sendJSON(res, 401, { error: "Kunci akses salah atau belum diisi" }); return; }
      let b; try { b = await readBody(req); } catch (e) { sendJSON(res, 400, { error: String(e.message) }); return; }
      const roles = [...new Set(["orchestrator", ...(Array.isArray(b.roles) ? b.roles : [])])].filter((r) => roster[r]);
      writeFileSync(join(COMPANIES_DIR, slug, "team.json"), JSON.stringify({ roles, notes: String(b.notes || "").slice(0, 2000), updated: new Date().toISOString() }, null, 2) + "\n");
      if (Array.isArray(b.profile)) writeProfile(slug, b.profile, b.name);
      broadcast(); sendJSON(res, 200, { ok: true, team: readTeam(slug), profile: readProfile(slug) }); return;
    }
  }

  if (path === "/api/model-peran" && req.method === "GET") {
    sendJSON(res, 200, { peran: bacaModelPeran(), pilihanModel: DAFTAR_MODEL_AGY, pilihanEffort: ["low", "medium", "high", "max"] }); return;
  }
  if (path === "/api/model-peran" && req.method === "POST") {
    if (!masukAman(req)) { sendJSON(res, 401, { error: "Kunci akses salah" }); return; }
    let body; try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: String(e.message) }); return; }
    const bersih = {};
    for (const [peran, v] of Object.entries(body || {})) {
      if (!/^[a-z-]+$/.test(peran) || typeof v !== "object" || !v) continue;
      const model = DAFTAR_MODEL_AGY.includes(v.model) ? v.model : null;
      const effort = ["low", "medium", "high", "max"].includes(v.effort) ? v.effort : null;
      if (model || effort) bersih[peran] = { model, effort };
    }
    writeFileSync(MODEL_PERAN_FILE, JSON.stringify(bersih, null, 2) + "\n");
    sendJSON(res, 200, { ok: true, peran: bersih }); return;
  }

  if (path === "/api/activity" && req.method === "GET") {
    sendJSON(res, 200, computeActivityFeed(80)); return;
  }

  if (path === "/api/roster") {
    // Baca ulang tiap request supaya ganti nama/warna di roster.json langsung terlihat tanpa restart
    try {
      roster = JSON.parse(readFileSync(join(OFFICE_DIR, "roster.json"), "utf8"));
    } catch {
      /* pakai roster yang sudah ada */
    }
    sendJSON(res, 200, roster);
    return;
  }

  if (path === "/api/state") {
    const usageBySlug = computeUsage();
    const companies = listCompanies().map((slug) => {
      const meta = companyMeta(slug);
      const planningDir = join(COMPANIES_DIR, slug, "planning");
      const roadmap = readMarkdownTable(join(planningDir, "ROADMAP.md"));
      const backlog = readMarkdownTable(join(planningDir, "BACKLOG.md"));
      const keputusan = readMarkdownTable(join(planningDir, "KEPUTUSAN.md"));
      const plans = readdirSync(join(planningDir, "plans")).filter((f) => f.endsWith(".md"));
      const qaFiles = walkFiles(join(planningDir, "qa"), [".md"]);
      const agents = computeAgentState().filter((a) => a.company === slug);
      return {
        slug,
        name: meta.name,
        meeting: computeMeeting(slug, agents),
        roadmapProgress: roadmapProgress(roadmap.rows),
        roadmapRows: roadmap.rows.length,
        backlogOpen: backlog.rows.length,
        keputusanTertahan: keputusan.rows.filter((r) => /blokir/i.test(Object.values(r).join(" ")) && !/dijawab|disetujui|selesai|dihentikan|ditolak/i.test(r.Status || "")).length,
        planCount: plans.length,
        qaReports: qaFiles.length,
        team: readTeam(slug).roles,
        usage: usageBySlug[slug] || { todayActions: 0, weekActions: 0, todaySessions: 0, weekSessions: 0 },
        agents,
      };
    });
    // Perusahaan yang paling aktif tampil pertama, supaya tab default bukan sekadar urutan abjad
    companies.sort((a, b) => (b.agents.length + b.roadmapRows) - (a.agents.length + a.roadmapRows) || a.name.localeCompare(b.name));
    sendJSON(res, 200, { now: Date.now(), hq: { jurnalDir: "hq/jurnal" }, quota: computeQuota(), companies });
    return;
  }

  const m = path.match(/^\/api\/company\/([^/]+)\/(roadmap|keputusan|backlog)$/);
  if (m) {
    const [, slug, kind] = m;
    const planningDir = join(COMPANIES_DIR, slug, "planning");
    const fileMap = { roadmap: "ROADMAP.md", keputusan: "KEPUTUSAN.md", backlog: "BACKLOG.md" };
    sendJSON(res, 200, readMarkdownTable(join(planningDir, fileMap[kind])));
    return;
  }

  const mo = path.match(/^\/api\/company\/([^/]+)\/output$/);
  if (mo) {
    const slug = mo[1];
    const files = [
      ...walkFiles(join(COMPANIES_DIR, slug, "docs"), [".md"]),
      ...walkFiles(join(COMPANIES_DIR, slug, "planning", "plans"), [".md"]),
      ...walkFiles(join(COMPANIES_DIR, slug, "meetings"), [".md"]),
    ]
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 40)
      .map((f) => ({ path: relative(join(COMPANIES_DIR, slug), f.path), mtime: f.mtime }));
    sendJSON(res, 200, files);
    return;
  }

  const mb = path.match(/^\/api\/company\/([^/]+)\/bukti$/);
  if (mb) {
    const slug = mb[1];
    const files = walkFiles(join(COMPANIES_DIR, slug, "planning", "qa", "bukti"), [".png", ".jpg", ".jpeg", ".webp"]).map((f) => ({
      url: `/files/${slug}/${relative(join(COMPANIES_DIR, slug, "planning", "qa", "bukti"), f.path)}`,
      mtime: f.mtime,
    }));
    sendJSON(res, 200, files.slice(0, 60));
    return;
  }

  if (path === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write("retry: 2000\n\n");
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  if (path.startsWith("/files/")) {
    serveEvidence(req, res, path);
    return;
  }

  serveStatic(req, res, path);
});

function broadcast() { for (const client of sseClients) { try { client.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`); } catch { sseClients.delete(client); } } }

// Broadcast tiap kali events.jsonl bertambah baris (debounce ringan)
let lastSize = existsSync(EVENTS_FILE) ? statSync(EVENTS_FILE).size : 0;
watch(DATA_DIR, { persistent: true }, (eventType, filename) => {
  if (filename !== "events.jsonl") return;
  const size = existsSync(EVENTS_FILE) ? statSync(EVENTS_FILE).size : 0;
  if (size === lastSize) return;
  lastSize = size;
  for (const client of sseClients) {
    try {
      client.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} sudah dipakai. Kemungkinan server dashboard lama masih jalan di tab terminal lain.`);
    console.error(`Cara cek dan matikan:  lsof -nP -iTCP:${PORT} -sTCP:LISTEN   lalu   kill <PID>`);
    console.error(`Atau jalankan di port lain:  OFFICE_PORT=4546 node office/server.mjs`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  console.log(`Kantor AI dashboard: http://localhost:${PORT}  (mendengar di ${HOST})`);
  console.log(`Membaca perusahaan dari: ${COMPANIES_DIR}`);
});
