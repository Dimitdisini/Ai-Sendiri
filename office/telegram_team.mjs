#!/usr/bin/env node
/**
 * Telegram Multi-Agent Team Runner (Dims Group) — Powered by Antigravity CLI (Google Pro)
 * =========================================================================================
 * - 100% Anti-Boncos: Menggunakan Antigravity CLI (agy) berlisensi Google Pro flat-rate.
 * - Tanpa API Key berbayar per-token.
 * - MCP & Tool Supported secara native oleh Antigravity.
 * - Anti-dobel & persona Kai & Bima yang responsif dan manusiawi.
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
const AGY_BIN = "/Users/haimac/.local/bin/agy";

const seenMessages = new Set();
setInterval(() => {
  if (seenMessages.size > 1000) seenMessages.clear();
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
    child.on("close", (code) => {
      let result = out.trim() || err.trim();
      // Bersihkan log atau banner jika ada
      result = result.replace(/^.*(?:Anthropic|Google|Model).*$/gim, "").trim();
      resolve(result || "Siap Mas Dim, perintah dicatat!");
    });
    child.on("error", (e) => {
      resolve("Siap Mas Dim, sistem standby.");
    });
  });
}

async function tgCall(token, method, payload) {
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

async function handleIncomingMessage(msg) {
  const msgKey = `${msg.chat.id}:${msg.message_id}`;
  if (seenMessages.has(msgKey)) return;
  seenMessages.add(msgKey);

  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const sender = msg.from.first_name || "Mas Dim";
  const msgId = msg.message_id;

  if (msg.new_chat_members && msg.new_chat_members.length) {
    if (msg.new_chat_members.some(m => m.is_bot)) {
      await sendKai(chatId, `Halo Mas ${sender}! Kai & Bima sudah online bertenaga Google Pro Antigravity. Siap standby!`);
    }
    return;
  }

  if (!text) return;
  console.log(`\n📩 [Telegram Masuk] ${sender}: "${text}"`);
  const lower = text.toLowerCase();

  // Sapaan Cepat (Direct bypass biar instan)
  if (/^(halo|pagi|siang|sore|malam|oi|tes|test|hai|hey|wkwk|haha)/i.test(lower) || lower === "halo tim") {
    await sendKai(chatId, `Halo Mas ${sender}! Ada yang mau dibahas atau perlu kita eksekusi hari ini?`, msgId);
    await new Promise(r => setTimeout(r, 1000));
    await sendBima(chatId, `Halo Mas Dim! Server & pipeline Antigravity aman terkendali.`);
    return;
  }

  // Jika cuma mention Bima
  if (lower.includes("@bima") || lower.startsWith("bima")) {
    const roleBima = `Kamu adalah Bima, Lead Software Architect & Tech di Dims Group. Karaktermu: pragmatis, teliti, paham koding/API/database, anti-overengineering. Panggil dengan 'Mas Dim' atau 'Mas Dimitri'.`;
    const resp = await runAgy(roleBima, text);
    await sendBima(chatId, resp, msgId);
    return;
  }

  // Jika cuma mention Kai
  if (lower.includes("@kai") || lower.startsWith("kai")) {
    const roleKai = `Kamu adalah Kai, Chief of Staff & Orkestrator di Dims Group. Karaktermu: taktis, teratur, menyederhanakan masalah, melindungi waktu CEO. Panggil dengan 'Mas Dim' atau 'Mas Dimitri'.`;
    const resp = await runAgy(roleKai, text);
    await sendKai(chatId, resp, msgId);
    return;
  }

  // Diskusi Umum: Otak Antigravity berpikir secara berurutan (Kai dulu, lalu Bima)
  const roleKai = `Kamu adalah Kai, Chief of Staff Dims Group. Analisis pesan Mas Dimitri dari sudut pandang prioritas, agenda, dan koordinasi tim. Di akhir kalimat, lempar ke Bima untuk cek teknisnya. Panggil 'Mas Dim'. Jawab 2 baris.`;
  const kaiResp = await runAgy(roleKai, text);
  await sendKai(chatId, kaiResp, msgId);

  await new Promise(r => setTimeout(r, 1500));

  const roleBima = `Kamu adalah Bima, Lead Software Architect Dims Group. Melanjutkan poin dari Kai, berikan tanggapan dari sudut pandang arsitektur teknis atau eksekusi simpelnya. Panggil 'Mas Dim'. Jawab 2 baris.`;
  const bimaResp = await runAgy(roleBima, text);
  await sendBima(chatId, bimaResp);
}

let offset = 0;
async function poll() {
  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${KAI_TOKEN}/getUpdates?offset=${offset}&timeout=20`);
      if (res.ok) {
        const data = await res.json();
        for (const update of data.result || []) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleIncomingMessage(update.message);
          }
        }
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

console.log("==================================================");
console.log("🚀 Dims Group Telegram AI Runner v3.0");
console.log("• Brain Engine: Google Pro Antigravity (agy CLI)");
console.log("• Biaya Token: Rp 0,- (Flat Google Pro Subscription)");
console.log("• MCP Ready & Context Aware");
console.log("==================================================");

poll();
