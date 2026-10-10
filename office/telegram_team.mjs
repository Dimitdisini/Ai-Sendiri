#!/usr/bin/env node
/**
 * Telegram Multi-Agent Team Runner (Dimitri HQ) — Powered by Antigravity CLI (Google Pro)
 * =========================================================================================
 * - 100% Anti-Boncos: Menggunakan Antigravity CLI (agy) flat-rate Google Pro.
 * - Tanpa API Key berbayar per-token (Rp 0,-).
 * - Skuad 5 Bot: Kai (CoS), Tari (Lead BA), Bima (Architect & n8n), Naya (Growth Marketer), Dewi (Lead PM & QA).
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const OFFICE_DIR = fileURLToPath(new URL(".", import.meta.url));
const ENV_FILE = join(OFFICE_DIR, ".env");

function loadEnv() {
  if (!existsSync(ENV_FILE)) return;
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const KAI_TOKEN = process.env.TELEGRAM_BOT_TOKEN_KAI;
const BIMA_TOKEN = process.env.TELEGRAM_BOT_TOKEN_BIMA;
const DEWI_TOKEN = process.env.TELEGRAM_BOT_TOKEN_DEWI;
const TARI_TOKEN = process.env.TELEGRAM_BOT_TOKEN_TARI;
const NAYA_TOKEN = process.env.TELEGRAM_BOT_TOKEN_NAYA;

const AGY_BIN = "/Users/haimac/.local/bin/agy";

const seenMessages = new Set();
setInterval(() => {
  if (seenMessages.size > 2000) seenMessages.clear();
}, 60 * 60 * 1000);

// Panggil Otak Antigravity Google Pro (0 Rupiah Biaya Token!)
function runAgy(systemRole, userPrompt) {
  return new Promise((resolve) => {
    const fullPrompt = `${systemRole}\n\nInstruksi format: Jawab dengan santai, ramah, to-the-point, dan ringkas (maksimal 2-3 baris). Jangan gunakan bahasa kaku korporat atau emoji berlebihan (tanpa emoji robot/bintang AI).\n\nPesan dari Mas Dimitri: "${userPrompt}"`;
    
    const child = spawn(AGY_BIN, [
      "-p", fullPrompt,
      "--output-format", "text",
      "--dangerously-skip-permissions"
    ], {
      cwd: "/Users/haimac/Dimitri Ahmad/Dokumen Dimitri",
      env: process.env
    });

    let out = "", err = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("close", () => {
      let result = out.trim() || err.trim();
      result = result.replace(/^.*(?:Anthropic|Google|Model).*$/gim, "").trim();
      resolve(result || "Siap Mas Dim, perintah dicatat!");
    });
    child.on("error", () => {
      resolve("Siap Mas Dim, sistem standby.");
    });
  });
}

async function tgCall(token, method, payload) {
  if (!token) return { ok: false, error: "Token not found" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendKai(chatId, text, replyToMessageId = null) {
  console.log(`[Kai] ${text.replace(/\n/g, " ")}`);
  return tgCall(KAI_TOKEN, "sendMessage", { chat_id: chatId, text, reply_to_message_id: replyToMessageId || undefined });
}

async function sendBima(chatId, text, replyToMessageId = null) {
  console.log(`[Bima] ${text.replace(/\n/g, " ")}`);
  return tgCall(BIMA_TOKEN, "sendMessage", { chat_id: chatId, text, reply_to_message_id: replyToMessageId || undefined });
}

async function sendDewi(chatId, text, replyToMessageId = null) {
  console.log(`[Dewi] ${text.replace(/\n/g, " ")}`);
  return tgCall(DEWI_TOKEN, "sendMessage", { chat_id: chatId, text, reply_to_message_id: replyToMessageId || undefined });
}

async function sendTari(chatId, text, replyToMessageId = null) {
  console.log(`[Tari] ${text.replace(/\n/g, " ")}`);
  return tgCall(TARI_TOKEN, "sendMessage", { chat_id: chatId, text, reply_to_message_id: replyToMessageId || undefined });
}

async function sendNaya(chatId, text, replyToMessageId = null) {
  console.log(`[Naya] ${text.replace(/\n/g, " ")}`);
  return tgCall(NAYA_TOKEN, "sendMessage", { chat_id: chatId, text, reply_to_message_id: replyToMessageId || undefined });
}

async function handleIncomingMessage(msg, botRecipient = null) {
  const msgKey = `${msg.chat.id}:${msg.message_id}`;
  if (seenMessages.has(msgKey)) return;
  seenMessages.add(msgKey);

  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const sender = msg.from.first_name || "Mas Dim";
  const msgId = msg.message_id;

  if (msg.new_chat_members && msg.new_chat_members.length) {
    if (msg.new_chat_members.some(m => m.is_bot)) {
      await sendKai(chatId, `Halo Mas ${sender}! Tim Dimitri HQ (Kai, Tari, Bima, Naya, Dewi) sudah online bertenaga Google Pro Antigravity. Siap standby!`);
    }
    return;
  }

  if (!text) return;
  console.log(`\n📩 [Telegram Masuk] ${sender}: "${text}" (via ${botRecipient || 'unknown'})`);
  const lower = text.toLowerCase();

  // Sapaan Cepat
  if (/^(halo|pagi|siang|sore|malam|oi|tes|test|hai|hey|wkwk|haha)/i.test(lower) || lower === "halo tim") {
    await sendKai(chatId, `Halo Mas ${sender}! Tim Dimitri HQ standby. Ada agenda atau proyek baru dari 4 pilar yang mau kita bahas?`, msgId);
    await new Promise(r => setTimeout(r, 600));
    await sendTari(chatId, `Halo Mas Dim! BA practice Xavortree siap bedah PRD/BRD klien.`);
    await new Promise(r => setTimeout(r, 600));
    await sendBima(chatId, `Halo Mas Dim! Arsitektur server, Docker VPS & n8n standby.`);
    await new Promise(r => setTimeout(r, 600));
    await sendNaya(chatId, `Halo Mas Dim! Copywriting & strategi konten siap.`);
    await new Promise(r => setTimeout(r, 600));
    await sendDewi(chatId, `Halo Mas Dim! QA gatekeeper dan timeline sprint terpantau aman.`);
    return;
  }

  // Mention / Direct Chat ke TARI
  if (lower.includes("@tari") || lower.startsWith("tari") || botRecipient === "tari") {
    const roleTari = `Kamu adalah Tari, Lead Business Analyst di PT Xavortree Digital Solution. Karaktermu: analitis, teliti pada kebutuhan bisnis, fokus ke BRD/PRD Dual-View, alur proses AS-IS ke TO-BE, dan matriks 5 pertanyaan klien. Panggil 'Mas Dim' atau 'Mas Dimitri'. Jawab ringkas 2-3 baris.`;
    const resp = await runAgy(roleTari, text);
    await sendTari(chatId, resp, msgId);
    return;
  }

  // Mention / Direct Chat ke NAYA
  if (lower.includes("@naya") || lower.startsWith("naya") || botRecipient === "naya") {
    const roleNaya = `Kamu adalah Naya, Growth Marketer di Dimitri HQ (Fleek & Kirei 3D). Karaktermu: kreatif, persuasif, paham hook audio-visual TikTok/Reels BTS art toys Pop Mart, pesan WABA Meta, dan SEO marketplace. Bebas emoji robot AI. Panggil 'Mas Dim' atau 'Mas Dimitri'. Jawab ringkas 2-3 baris.`;
    const resp = await runAgy(roleNaya, text);
    await sendNaya(chatId, resp, msgId);
    return;
  }

  // Mention / Direct Chat ke DEWI
  if (lower.includes("@dewi") || lower.startsWith("dewi") || botRecipient === "dewi") {
    const roleDewi = `Kamu adalah Dewi, Lead QA & Project Manager di Dimitri HQ. Karaktermu: lugas, terorganisir, strict gatekeeper (kriteria penerimaan PASS/FAIL), fokus ke timeline sprint. Panggil 'Mas Dim' atau 'Mas Dimitri'. Jawab ringkas 2-3 baris.`;
    const resp = await runAgy(roleDewi, text);
    await sendDewi(chatId, resp, msgId);
    return;
  }

  // Mention / Direct Chat ke BIMA
  if (lower.includes("@bima") || lower.startsWith("bima") || botRecipient === "bima") {
    const roleBima = `Kamu adalah Bima, Lead Technology Architect & AI Workflow Lead di Dimitri HQ (Fleek & Xavortree). Karaktermu: pragmatis, paham Next.js/Docker VPS, automasi n8n, anti-overengineering. Panggil 'Mas Dim' atau 'Mas Dimitri'. Jawab ringkas 2-3 baris.`;
    const resp = await runAgy(roleBima, text);
    await sendBima(chatId, resp, msgId);
    return;
  }

  // Mention / Direct Chat ke KAI
  if (lower.includes("@kai") || lower.startsWith("kai") || botRecipient === "kai") {
    const roleKai = `Kamu adalah Kai, Chief of Staff & Orkestrator di Dimitri HQ. Karaktermu: taktis, teratur, menyederhanakan masalah ke 4 pilar (Xavortree, Fleek, Kirei 3D, Dims Lab), melindungi waktu CEO. Panggil 'Mas Dim' atau 'Mas Dimitri'. Jawab ringkas 2-3 baris.`;
    const resp = await runAgy(roleKai, text);
    await sendKai(chatId, resp, msgId);
    return;
  }

  // Diskusi Umum di Grup: Kolaborasi Taktis (Kai memetakan, lalu Bima/Tari menanggapi)
  const roleKai = `Kamu adalah Kai, Chief of Staff Dimitri HQ. Analisis pesan Mas Dimitri dari sudut pandang prioritas 4 pilar (Xavortree, Fleek, Kirei 3D, Dims Lab). Panggil 'Mas Dim'. Jawab 2 baris singkat.`;
  const kaiResp = await runAgy(roleKai, text);
  await sendKai(chatId, kaiResp, msgId);
}

// Multi-bot Polling Runner
function startBotPoller(token, name) {
  if (!token) return;
  let offset = 0;
  (async function loop() {
    while (true) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`);
        if (res.ok) {
          const data = await res.json();
          for (const update of data.result || []) {
            offset = update.update_id + 1;
            if (update.message) {
              await handleIncomingMessage(update.message, name);
            }
          }
        }
      } catch (err) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  })();
  console.log(`🤖 Bot Poller online: ${name}`);
}

console.log("==================================================");
console.log("🚀 Dimitri HQ Telegram Multi-Agent Runner v5.0");
console.log("• Brain Engine: Google Pro Antigravity (agy CLI)");
console.log("• Biaya Token: Rp 0,- (Flat Google Pro Subscription)");
console.log("• Active Personas: Kai (CoS), Tari (BA), Bima (Architect), Naya (Growth), Dewi (QA)");
console.log("==================================================");

startBotPoller(KAI_TOKEN, "kai");
startBotPoller(TARI_TOKEN, "tari");
startBotPoller(BIMA_TOKEN, "bima");
startBotPoller(NAYA_TOKEN, "naya");
startBotPoller(DEWI_TOKEN, "dewi");
