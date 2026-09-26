#!/usr/bin/env node
// Jembatan Telegram untuk Team Dimitri. Tanpa dependency: long polling ke API Telegram.
// - Pesan teks dari CEO (chat id yang diizinkan) -> dikirim ke antrean perintah server (SATU antrean
//   yang sama dengan kotak perintah dashboard, lihat office/server.mjs /api/command). Hasilnya dikirim
//   balik ke Telegram oleh server sendiri (notifyTelegram), bukan oleh file ini.
// - /status -> ringkasan dari dashboard lokal.
// - Pantau planning/KEPUTUSAN.md semua perusahaan: item BLOKIR baru berstatus Menunggu -> notifikasi.
//
// Env wajib: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, OFFICE_TOKEN (biasanya sudah ada di office/.env)
// Env opsional: OFFICE_URL (default http://localhost:4545)

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

if (!process.env.OFFICE_TOKEN) console.error("Peringatan: OFFICE_TOKEN kosong di office/.env — perintah dari Telegram akan ditolak server.");
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

// Perintah yang butuh detail (perusahaan + isi). Ketuk dari menu Telegram langsung terkirim TANPA
// detail, jadi kalau bare (tanpa apa-apa setelahnya) kita balik tanya dulu, bukan langsung diproses.
const CMD_PROMPTS = {
  kickoff: "Project baru. Sebutkan perusahaannya (xavortree / fleek-project) dan deskripsi projectnya.\nContoh: xavortree: sistem absensi karyawan",
  ide: "Eksplorasi ide. Sebutkan perusahaannya dan topik/ide yang mau dipikirkan.\nContoh: fleek-project: SaaS billing otomatis",
  event: "Insiden/permintaan mendadak. Sebutkan perusahaannya dan apa yang terjadi.\nContoh: xavortree: klien komplain dashboard lambat",
  revisi: "Ubah scope/desain/timeline. Sebutkan perusahaannya dan apa yang mau diubah.\nContoh: xavortree: geser target rilis ke Desember",
  review: "Review mingguan. Sebutkan perusahaan mana yang mau direview.\nContoh: xavortree",
  rilis: "Cek kesiapan rilis. Sebutkan perusahaan dan versi/milestone-nya.\nContoh: xavortree: MS0",
  riset: "Riset singkat. Sebutkan perusahaannya dan pertanyaan risetnya.\nContoh: xavortree: bandingkan broker MQTT gratisan",
  catat: "Catat pelajaran jadi SOP. Tulis pelajarannya dalam satu-dua kalimat.\nContoh: jangan deploy hari Jumat sore, rollback susah kalau ada masalah",
};
const PENDING_TTL_MS = 5 * 60 * 1000;
let pending = null; // { command, askedAt }

async function handleMessage(text) {
  // Lanjutan dari command bare yang tadi ditanya detailnya
  if (pending && Date.now() - pending.askedAt < PENDING_TTL_MS && !text.startsWith("/")) {
    const cmd = pending.command;
    pending = null;
    return handleMessage(`/${cmd} ${text}`);
  }
  if (pending && Date.now() - pending.askedAt >= PENDING_TTL_MS) pending = null;

  if (text === "/start" || text === "/help") {
    return send("Team Dimitri siap. Ketuk perintah dari menu / atau ketik manual (misal: /kickoff xavortree: ...). /status untuk ringkasan.");
  }
  if (text === "/status" || text === "/antrean") {
    try {
      const s = await (await fetch(`${OFFICE_URL}/api/state`)).json();
      const lines = s.companies.map((c) => `${c.name}: roadmap ${c.roadmapProgress}%, ${c.planCount} plan, ${c.qaReports} QA, ${c.keputusanTertahan} BLOKIR, ${c.agents.filter((a) => a.status === "kerja").length} agen kerja`);
      const q = s.quota && s.quota.status !== "ok" ? `\nKuota: ${s.quota.status} sejak ${new Date(s.quota.since).toLocaleTimeString("id-ID")}` : "";
      const antrean = await ringkasanAntrean();
      return send(lines.join("\n") + q + "\n\n" + antrean);
    } catch (e) {
      return send("Dashboard tidak bisa dihubungi. Pastikan `node office/server.mjs` jalan.");
    }
  }
  // Command bare dari menu (misal cuma "/kickoff", tanpa detail) -> tanya dulu, jangan langsung kirim
  const bare = text.match(/^\/([a-z-]+)\s*$/i);
  if (bare && CMD_PROMPTS[bare[1].toLowerCase()]) {
    pending = { command: bare[1].toLowerCase(), askedAt: Date.now() };
    return send(CMD_PROMPTS[bare[1].toLowerCase()] + "\n\n(Balas pesan ini dengan detailnya, atau ketik /batal untuk membatalkan.)");
  }
  if (text === "/batal" && pending) { pending = null; return send("Dibatalkan."); }

  try {
    const subRes = await fetch(`${OFFICE_URL}/api/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OFFICE_TOKEN },
      body: JSON.stringify({ text }),
    });
    if (!subRes.ok) { const e = await subRes.json().catch(() => ({})); return send("Gagal mengirim ke antrean: " + (e.error || subRes.status)); }
    const job = await subRes.json();
    await send("Diterima, masuk antrean.\n" + (await ringkasanAntrean()) + "\nKetik /antrean kapan saja buat cek progres.");
    // Poll status; hasil akhirnya tetap dikirim server via notifyTelegram, ini hanya jaga-jaga kalau server gagal kirim
    for (let i = 0; i < 300; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const cur = await (await fetch(`${OFFICE_URL}/api/command/${job.id}`)).json().catch(() => null);
      if (cur && cur.status !== "antre" && cur.status !== "jalan") return; // server sudah mengirim hasil
    }
  } catch (e) {
    return send("Dashboard tidak bisa dihubungi. Pastikan `node office/server.mjs` jalan.\n" + String(e).slice(0, 200));
  }
}

// Ringkasan antrean: tugas yang sedang jalan (sudah berapa lama) + berapa yang masih menunggu
async function ringkasanAntrean() {
  try {
    const list = await (await fetch(`${OFFICE_URL}/api/commands`)).json();
    const jalan = list.find((j) => j.status === "jalan");
    const antre = list.filter((j) => j.status === "antre").length;
    if (!jalan) return antre > 0 ? `Ada ${antre} tugas menunggu, tidak ada yang sedang jalan (aneh, biasanya jalan sendiri).` : "Tidak ada tugas yang sedang jalan.";
    const detik = Math.round((Date.now() - (jalan.started || Date.now())) / 1000);
    const durasi = detik < 60 ? `${detik} detik` : `${Math.round(detik / 60)} menit`;
    const label = jalan.origin === "jadwal" ? `jadwal ${jalan.jadwalId}` : (jalan.text || "").slice(0, 60);
    return `Sedang jalan (${jalan.executor || "cli"}, ${durasi}): ${label}${antre > 0 ? `\n${antre} tugas lain menunggu giliran.` : ""}`;
  } catch {
    return "Tidak bisa mengecek antrean saat ini.";
  }
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

// ---- Kirim laporan pagi / rekap malam dari jurnal ----
// Chief of Staff menulis hq/jurnal/YYYY-MM-DD.md. Bot ini mengirim blok "### Untuk CEO" dari tiap bagian
// "## Pagi" / "## Malam" yang baru, sekali saja. Agent tidak perlu memegang token Telegram.
const JURNAL_DIR = join(ROOT, "hq", "jurnal");
function jurnalSections(file) {
  const text = readFileSync(file, "utf8");
  const out = [];
  for (const [name, label] of [["Pagi", "☀️ Laporan pagi"], ["Malam", "🌙 Rekap malam"]]) {
    const m = text.match(new RegExp(`^## ${name}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
    if (!m) continue;
    const u = m[1].match(/^### Untuk CEO[^\n]*\n([\s\S]*?)(?=^### |(?![\s\S]))/m);
    const body = (u ? u[1] : "").trim();
    if (!body || /<[^>]+>/.test(body)) continue; // belum diisi (masih placeholder template)
    out.push({ name, label, body });
  }
  return out;
}
async function notifyJurnal() {
  if (!existsSync(JURNAL_DIR)) return;
  const seen = loadSeen();
  const files = readdirSync(JURNAL_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().slice(-2);
  for (const f of files) {
    const date = f.replace(".md", "");
    for (const s of jurnalSections(join(JURNAL_DIR, f))) {
      const key = `jurnal:${date}:${s.name}`;
      if (seen[key]) continue;
      await send(`${s.label} — ${date}\n\n${s.body}\n\n(detail: hq/jurnal/${f})`);
      seen[key] = Date.now();
      saveSeen(seen);
    }
  }
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
console.log(`Telegram bridge aktif. Perintah diteruskan ke antrean server di ${OFFICE_URL}.`);
send("Team Dimitri online. Kirim /status untuk ringkasan, atau perintah langsung seperti: /kickoff xavortree: ...").catch(() => {});
poll();
setInterval(() => notifyBlokir().catch(() => {}), 60 * 1000);
notifyBlokir().catch(() => {});
setInterval(() => notifyJurnal().catch((e) => console.error("jurnal:", String(e).slice(0, 200))), 60 * 1000);
notifyJurnal().catch(() => {});
