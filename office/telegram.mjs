#!/usr/bin/env node
// Jembatan Telegram untuk Team Dimitri. Tanpa dependency: long polling ke API Telegram.
// - Pesan teks dari CEO (chat id yang diizinkan) -> dijalankan sebagai perintah ke Orkestrator lewat `claude -p`.
// - /status -> ringkasan dari dashboard lokal.
// - Pantau planning/KEPUTUSAN.md semua perusahaan: item BLOKIR baru berstatus Menunggu -> notifikasi.
//
// Env wajib: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// Env opsional: OFFICE_URL (default http://localhost:4545), CLAUDE_BIN (default claude), CLAUDE_SAFE=1 (tanpa bypass izin)

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const OFFICE_DIR = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(OFFICE_DIR, "..");
const DATA_DIR = join(OFFICE_DIR, "data");
const SEEN_FILE = join(DATA_DIR, "telegram-seen.json");

// Muat office/.env kalau ada (KEY=VALUE per baris), tanpa menimpa env yang sudah diset di shell
const ENV_FILE = join(OFFICE_DIR, ".env");
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || "");
const OFFICE_URL = process.env.OFFICE_URL || "http://localhost:4545";
const CLAUDE_BIN = process.env.CLAUDE_BIN || (existsSync(join(homedir(), ".local/bin/claude")) ? join(homedir(), ".local/bin/claude") : "claude");
const SAFE = process.env.CLAUDE_SAFE === "1";

if (!TOKEN || !CHAT_ID) {
  console.error("Butuh TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID. Contoh:\n  TELEGRAM_BOT_TOKEN=123:abc TELEGRAM_CHAT_ID=99999 node office/telegram.mjs");
  process.exit(1);
}
mkdirSync(DATA_DIR, { recursive: true });
const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method, body) {
  const res = await fetch(`${API}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}
async function send(text) {
  // Telegram batas 4096 karakter per pesan
  for (let i = 0; i < text.length; i += 3900) {
    const r = await tg("sendMessage", { chat_id: CHAT_ID, text: text.slice(i, i + 3900) });
    if (!r.ok) console.error(`Gagal kirim ke chat ${CHAT_ID}: ${r.description || JSON.stringify(r)}${/chat not found/i.test(r.description || "") ? " -> tekan Start di bot dulu, atau chat id salah" : ""}`);
  }
}

let busy = false;
function runClaude(prompt) {
  return new Promise((resolve) => {
    const args = ["-p", prompt, "--output-format", "text"];
    if (!SAFE) args.push("--dangerously-skip-permissions");
    const child = spawn(CLAUDE_BIN, args, { cwd: ROOT, env: process.env });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolve({ code, out: out.trim(), err: err.trim() }));
    child.on("error", (e) => resolve({ code: -1, out: "", err: String(e) }));
  });
}

async function handleMessage(text) {
  if (text === "/start" || text === "/help") {
    return send("Team Dimitri siap. Kirim perintah biasa (misal: /kickoff xavortree: ...), atau /status untuk ringkasan.");
  }
  if (text === "/status") {
    try {
      const s = await (await fetch(`${OFFICE_URL}/api/state`)).json();
      const lines = s.companies.map((c) => `${c.name}: roadmap ${c.roadmapProgress}%, ${c.planCount} plan, ${c.qaReports} QA, ${c.keputusanTertahan} BLOKIR, ${c.agents.filter((a) => a.status === "kerja").length} agen kerja`);
      const q = s.quota && s.quota.status !== "ok" ? `\nKuota: ${s.quota.status} sejak ${new Date(s.quota.since).toLocaleTimeString("id-ID")}` : "";
      return send(lines.join("\n") + q);
    } catch (e) {
      return send("Dashboard tidak bisa dihubungi. Pastikan `node office/server.mjs` jalan.");
    }
  }
  if (busy) return send("Masih mengerjakan perintah sebelumnya. Tunggu sebentar.");
  busy = true;
  await send("Diterima. Orkestrator mulai bekerja...");
  const prompt = `Perintah dari CEO lewat Telegram. Jalankan sesuai CLAUDE.md. Jawab ringkas, maksimal 15 baris, tanpa markdown tabel.\n\n${text}`;
  const r = await runClaude(prompt);
  busy = false;
  if (r.code !== 0 && !r.out) return send(`Gagal menjalankan claude (kode ${r.code}).\n${r.err.slice(0, 800)}`);
  return send(r.out || "(tidak ada keluaran)");
}

// ---- Pantau BLOKIR baru ----
function loadSeen() { try { return JSON.parse(readFileSync(SEEN_FILE, "utf8")); } catch { return {}; } }
function saveSeen(s) { writeFileSync(SEEN_FILE, JSON.stringify(s)); }
function scanBlokir() {
  const companiesDir = join(ROOT, "companies");
  if (!existsSync(companiesDir)) return [];
  const found = [];
  for (const slug of readdirSync(companiesDir)) {
    const f = join(companiesDir, slug, "planning", "KEPUTUSAN.md");
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      if (!line.startsWith("|") || !/blokir/i.test(line) || !/menunggu/i.test(line)) continue;
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      found.push({ key: `${slug}:${cells[0]}`, slug, id: cells[0], q: cells[2] || "", rec: cells[4] || "" });
    }
  }
  return found;
}
async function notifyBlokir() {
  const seen = loadSeen();
  const items = scanBlokir().filter((i) => !seen[i.key]);
  if (!items.length) return;
  const text = "Butuh keputusanmu:\n" + items.map((i) => `• [${i.slug}] ${i.id}: ${i.q}\n  Rekomendasi: ${i.rec}`).join("\n");
  await send(text);
  for (const i of items) seen[i.key] = Date.now();
  saveSeen(seen);
}

// ---- Loop utama ----
let offset = 0;
async function poll() {
  try {
    const r = await tg("getUpdates", { offset, timeout: 25, allowed_updates: ["message"] });
    for (const u of r.result || []) {
      offset = u.update_id + 1;
      const m = u.message;
      if (!m || !m.text) continue;
      console.log(`Pesan masuk dari chat ${m.chat.id} (${m.chat.first_name || m.chat.title || "?"}): ${m.text.slice(0, 60)}`);
      if (String(m.chat.id) !== CHAT_ID) { await tg("sendMessage", { chat_id: m.chat.id, text: "Bot ini privat." }); continue; }
      handleMessage(m.text.trim()).catch((e) => send(`Error: ${String(e).slice(0, 300)}`));
    }
  } catch (e) {
    console.error("poll error:", String(e).slice(0, 200));
    await new Promise((r) => setTimeout(r, 3000));
  }
  setImmediate(poll);
}
console.log(`Telegram bridge aktif. Claude: ${CLAUDE_BIN}${SAFE ? " (mode aman, tanpa bypass izin)" : ""}`);
send("Team Dimitri online. Kirim /status untuk ringkasan, atau perintah langsung seperti: /kickoff xavortree: ...").catch(() => {});
poll();
setInterval(() => notifyBlokir().catch(() => {}), 60 * 1000);
notifyBlokir().catch(() => {});
