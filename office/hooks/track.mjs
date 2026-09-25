#!/usr/bin/env node
// Hook receiver kantor AI. Dipanggil oleh Claude Code lewat .claude/settings.json.
// Tugas: baca event dari stdin, ubah jadi satu baris JSON ringkas, tambahkan ke office/data/events.jsonl.
// Prinsip: JANGAN PERNAH gagal atau lambat — hook ini tidak boleh menghambat sesi Claude Code.

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const OFFICE_DIR = dirname(dirname(fileURLToPath(import.meta.url))); // .../office
const PROJECT_DIR = dirname(OFFICE_DIR);
const DATA_DIR = join(OFFICE_DIR, "data");
const EVENTS_FILE = join(DATA_DIR, "events.jsonl");

function readStdin() {
  return new Promise((resolve) => {
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (buf += c));
    process.stdin.on("end", () => resolve(buf));
    process.stdin.on("error", () => resolve(buf));
    // Jaga-jaga kalau stdin tidak pernah "end" (jarang terjadi tapi hook wajib cepat selesai)
    setTimeout(() => resolve(buf), 800);
  });
}

function companySlugFromCwd(cwd) {
  if (!cwd) return null;
  const rel = relative(PROJECT_DIR, cwd);
  if (!rel || rel.startsWith("..")) return null;
  const parts = rel.split(sep);
  if (parts[0] === "companies" && parts[1]) return parts[1];
  return null;
}

// Deteksi perusahaan dari file atau perintah yang disentuh tool, misal ".../companies/xavortree/docs/..."
function companySlugFromToolInput(input) {
  if (!input) return null;
  const text = [input.file_path, input.path, input.command, input.pattern, input.prompt].filter(Boolean).join(" ");
  const m = text.match(/companies\/([a-z0-9._-]+)/i);
  return m ? m[1] : null;
}

// File yang disentuh: dari file_path untuk tool file, atau dari path pertama di perintah Bash (mis. cat > .../FD.md)
function fileFromToolInput(name, input) {
  if (!input) return null;
  if (input.file_path || input.path) return input.file_path || input.path;
  if (name === "Bash" && input.command) {
    const m = input.command.match(/["']?((?:\/|\.\/)?[^\s"'>|;&]*(?:companies|hq)\/[^\s"'>|;&]+\.md)["']?/);
    return m ? m[1] : null;
  }
  return null;
}
// Apakah tool ini menulis file? Write/Edit jelas; Bash dianggap menulis bila ada redirect (>) atau tee ke file itu.
function wroteFromToolInput(name, input) {
  if (name === "Write" || name === "Edit" || name === "MultiEdit") return true;
  if (name === "Bash" && input && input.command) return /(^|[\s;&|])(cat|echo|printf|tee)\b[^\n]*?(>|\btee\b)/.test(input.command) || /\bsed -i\b/.test(input.command);
  return false;
}

function summarizeTool(name, input) {
  if (!input) return name || "";
  try {
    if (name === "Write" || name === "Edit" || name === "Read") return `${name}: ${input.file_path || ""}`;
    if (name === "Bash") return `Bash: ${(input.command || "").slice(0, 80)}`;
    if (name === "Task" || name === "Agent") return `Task: ${(input.description || input.prompt || "").slice(0, 80)}`;
  } catch {
    /* abaikan, fallback di bawah */
  }
  return name || "";
}

async function main() {
  const raw = await readStdin();
  let evt = {};
  try {
    evt = JSON.parse(raw || "{}");
  } catch {
    return; // input rusak, jangan crash — cukup abaikan event ini
  }

  const MAIN_SESSION_HOOKS = new Set(["SessionStart", "UserPromptSubmit", "Stop", "StopFailure"]);
  const isFailure = evt.hook_event_name === "StopFailure";
  const failureText = isFailure ? String(evt.error || evt.reason || evt.message || "API error").slice(0, 160) : "";

  const record = {
    ts: Date.now(),
    hook: evt.hook_event_name || "unknown",
    session_id: evt.session_id || null,
    // Tanpa agent_id berarti ini sesi utama = Orkestrator, apa pun hook-nya
    agent_type: evt.agent_type || (MAIN_SESSION_HOOKS.has(evt.hook_event_name) || !evt.agent_id ? "orchestrator" : null),
    agent_id: evt.agent_id || null,
    company: companySlugFromToolInput(evt.tool_input) || companySlugFromCwd(evt.cwd),
    file: fileFromToolInput(evt.tool_name, evt.tool_input),
    wrote: wroteFromToolInput(evt.tool_name, evt.tool_input),
    cwd: evt.cwd || null,
    tool: evt.tool_name || null,
    summary: isFailure ? `Gagal: ${failureText}` : summarizeTool(evt.tool_name, evt.tool_input),
  };

  try {
    mkdirSync(DATA_DIR, { recursive: true });
    appendFileSync(EVENTS_FILE, JSON.stringify(record) + "\n");
  } catch {
    /* jangan pernah membuat hook gagal karena masalah tulis file */
  }
}

main();
