// office/team_manager.mjs
// Modul untuk manajemen tim dinamis (Core Squad + Self-Hiring) & feed event Kantor AI
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = fileURLToPath(new URL(".", import.meta.url));
const ROSTER_FILE = join(DIR, "roster.json");
const EVENTS_FILE = join(DIR, "data", "events.jsonl");

export function loadRoster() {
  try {
    return JSON.parse(readFileSync(ROSTER_FILE, "utf8"));
  } catch {
    return {};
  }
}

export function hireAgent({ slug, role, nickname, color, status = "active", company = null }) {
  const roster = loadRoster();
  const colors = ["#0891b2", "#16a34a", "#9333ea", "#ea580c", "#ca8a04", "#2563eb", "#dc2626"];
  const assignedColor = color || colors[Object.keys(roster).length % colors.length];

  roster[slug] = {
    role,
    nickname,
    color: assignedColor,
    status,
    hiredAt: new Date().toISOString()
  };

  writeFileSync(ROSTER_FILE, JSON.stringify(roster, null, 2) + "\n");

  // Catat event rekrutmen ke live feed
  logEvent({
    agent_type: "orchestrator",
    company: company || "hq",
    tool: "Hire",
    summary: `Merekrut ${nickname} (${role}) untuk memperkuat tim`,
    status: "kerja"
  });

  return roster[slug];
}

export function logEvent({ agent_type, company = "hq", tool = "Action", summary = "", status = "kerja" }) {
  const hook = status === "istirahat" ? "SubagentStop" : "PostToolUse";
  const rec = {
    ts: Date.now(),
    hook,
    session_id: "antigravity-main",
    agent_type: agent_slug(agent_type),
    agent_id: `ag-${agent_type}`,
    company,
    tool,
    summary,
    wrote: tool.includes("Write") || tool.includes("Edit")
  };

  try {
    appendFileSync(EVENTS_FILE, JSON.stringify(rec) + "\n");
  } catch (err) {
    console.error("Gagal mencatat event:", err.message);
  }
}

function agent_slug(str) {
  return String(str || "orchestrator").toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

// CLI runner bila dipanggil dari command line
if (process.argv[2] === "hire") {
  const [,, slug, role, nickname, company] = process.argv;
  if (!slug || !role || !nickname) {
    console.log("Usage: node team_manager.mjs hire <slug> <role> <nickname> [company]");
    process.exit(1);
  }
  const result = hireAgent({ slug, role, nickname, company });
  console.log(`Sukses merekrut:`, result);
} else if (process.argv[2] === "log") {
  const agent_type = process.argv[3];
  const summary = process.argv[4] || "";
  const company = process.argv[5] || "hq";
  const tool = process.argv[6] || "Action";
  logEvent({ agent_type, summary, company, tool });
  console.log(`Event dicatat untuk ${agent_type}: ${summary}`);
}
