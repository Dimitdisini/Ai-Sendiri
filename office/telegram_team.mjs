#!/usr/bin/env node
/**
 * Telegram Multi-Agent Team Runner (Dims Group) — Powered by Antigravity CLI (Google Pro)
 * =========================================================================================
 * - 100% Anti-Boncos: Menggunakan Antigravity CLI (agy) flat-rate Google Pro.
 * - Tanpa API Key berbayar per-token.
 * - Persona: Kai (Chief of Staff), Bima (Software Architect), Dewi (Lead Project Manager).
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
const AGY_BIN = "/Users/haimac/.local/bin/agy";

const seenMessages = new Set();
setInterval(() => {
  if (seenMessages.size > 2000) seenMessages.clear();
}, 60 * 60 * 1000);

// Panggil Otak Antigravity Google Pro (0 Rupiah Biaya Token!)
function runAgy(systemRole, userPrompt) {
  return new Promise((resolve) => {
    const fullPrompt = `${systemRole}\n\nInstruksi format: Jawab dengan santai, ramah, to-the-point, dan ringkas (maksimal 2-3 baris). Jangan gunakan bahasa kaku korporat atau emoji berlebihan.\n\nPesan dari Mas Dimitri: "${userPrompt}"`;
    
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
  return tgCall(KAI_TOKEN, "sendMessage", {
    chat_id: chatId,
    text,
    reply_to_message_id: replyToMessageId || undefined,
  });
}

async function sendBima(chatId, text, replyToMessageId = null) {
  console.log(`[Bima] ${text.replace(/\n/g, " ")}`);
  return tgCall(BIMA_TOKEN, "sendMessage", {
    chat_id: chatId,
    text,
    reply_to_message_id: replyToMessageId || undefined,
  });
}

async function sendDewi(chatId, text, replyToMessageId = null) {
  console.log(`[Dewi] ${text.replace(/\n/g, " ")}`);
  return tgCall(DEWI_TOKEN, "sendMessage", {
    chat_id: chatId,
    text,
    reply_to_message_id: replyToMessageId || undefined,
  });
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
      await sendKai(chatId, `Halo Mas ${sender}! Tim Dims Group (Kai, Bima, Dewi) sudah online bertenaga Google Pro Antigravity. Siap standby!`);
    }
    return;
  }

  if (!text) return;
  console.log(`\n📩 [Telegram Masuk] ${sender}: "${text}" (via ${botRecipient || 'unknown'})`);
  const lower = text.toLowerCase();

  // Sapaan Cepat
  if (/^(halo|pagi|siang|sore|malam|oi|tes|test|hai|hey|wkwk|haha)/i.test(lower) || lower === "halo tim") {
    await sendKai(chatId, `Halo Mas ${sender}! Ada agenda atau proyek baru yang mau kita bahas?`, msgId);
    await new Promise(r => setTimeout(r, 800));
    await sendDewi(chatId, `Halo Mas Dim! Semua sprint dan timeline proyek aman terpantau.`);
    await new Promise(r => setTimeout(r, 800));
    await sendBima(chatId, `Halo Mas Dim! Sistem teknis & server Antigravity standby.`);
    return;
  }

  // Jika cuma mention Dewi atau chat langsung ke bot Dewi
  if (lower.includes("@dewi") || lower.startsWith("dewi") || botRecipient === "dewi") {
    const roleDewi = `Kamu adalah Dewi, Lead Project Manager di Dims Group. Karaktermu: lugas, terorganisir, fokus ke timeline, deadline, sprint tiket, dan deliverable klien. Panggil 'Mas Dim' atau 'Mas Dimitri'. Jawab ringkas 2-3 baris.`;
    const resp = await runAgy(roleDewi, text);
    await sendDewi(chatId, resp, msgId);
    return;
  }

  // Jika cuma mention Bima atau chat langsung ke bot Bima
  if (lower.includes("@bima") || lower.startsWith("bima") || botRecipient === "bima") {
    const roleBima = `Kamu adalah Bima, Lead Software Architect & Tech di Dims Group. Karaktermu: pragmatis, teliti, paham koding/API/database, anti-overengineering. Panggil dengan 'Mas Dim' atau 'Mas Dimitri'. Jawab ringkas 2-3 baris.`;
    const resp = await runAgy(roleBima, text);
    await sendBima(chatId, resp, msgId);
    return;
  }

  // Jika cuma mention Kai atau chat langsung ke bot Kai
  if (lower.includes("@kai") || lower.startsWith("kai") || botRecipient === "kai") {
    const roleKai = `Kamu adalah Kai, Chief of Staff & Orkestrator di Dims Group. Karaktermu: taktis, teratur, menyederhanakan masalah, melindungi waktu CEO. Panggil dengan 'Mas Dim' atau 'Mas Dimitri'. Jawab ringkas 2-3 baris.`;
    const resp = await runAgy(roleKai, text);
    await sendKai(chatId, resp, msgId);
    return;
  }

  // Diskusi Umum di Grup: Kolaborasi Bertiga (Kai -> Dewi -> Bima)
  const roleKai = `Kamu adalah Kai, Chief of Staff Dims Group. Analisis pesan Mas Dimitri dari sudut pandang prioritas, agenda, dan koordinasi tim. Panggil 'Mas Dim'. Jawab 2 baris singkat.`;
  const kaiResp = await runAgy(roleKai, text);
  await sendKai(chatId, kaiResp, msgId);

  await new Promise(r => setTimeout(r, 1200));

  const roleDewi = `Kamu adalah Dewi, Lead Project Manager Dims Group. Melanjutkan poin Kai, berikan tanggapan singkat soal timeline, pembagian task, atau milestone proyek. Panggil 'Mas Dim'. Jawab 2 baris singkat.`;
  const dewiResp = await runAgy(roleDewi, text);
  await sendDewi(chatId, dewiResp);

  await new Promise(r => setTimeout(r, 1200));

  const roleBima = `Kamu adalah Bima, Lead Software Architect Dims Group. Melanjutkan poin Kai dan Dewi, berikan tanggapan dari sudut pandang arsitektur teknis atau eksekusi simpelnya. Panggil 'Mas Dim'. Jawab 2 baris singkat.`;
  const bimaResp = await runAgy(roleBima, text);
  await sendBima(chatId, bimaResp);
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
console.log("🚀 Dims Group Telegram Multi-Agent Runner v4.0");
console.log("• Brain Engine: Google Pro Antigravity (agy CLI)");
console.log("• Biaya Token: Rp 0,- (Flat Google Pro Subscription)");
console.log("• Active Personas: Kai (CoS), Bima (Architect), Dewi (Lead PM)");
console.log("==================================================");

startBotPoller(KAI_TOKEN, "kai");
startBotPoller(BIMA_TOKEN, "bima");
startBotPoller(DEWI_TOKEN, "dewi");
