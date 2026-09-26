let state = null;
let roster = {};
let activeCompany = null;
let activeTab = "overview";

fetch("/api/roster").then((r) => r.json()).then((r) => (roster = r)).catch(() => {});

async function fetchState() {
  try {
    const res = await fetch("/api/state");
    state = await res.json();
    if (!activeCompany && state.companies.length) activeCompany = state.companies[0].slug;
    render();
  } catch (e) {
    console.warn("fetchState gagal:", e);
  }
}

function fmtTime(ts) {
  if (!ts) return "—";
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin}m lalu`;
  const h = Math.round(diffMin / 60);
  return `${h}j lalu`;
}

function currentCompany() {
  return (state && state.companies.find((c) => c.slug === activeCompany)) || null;
}

// -------------------------------------------------------------------
// SIDEBAR: jam, company list, stats bawah
// -------------------------------------------------------------------
function renderSidebar() {
  // Jam
  const now = new Date();
  document.getElementById("liveTime").textContent =
    now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Company list
  const el = document.getElementById("companyList");
  if (state && state.companies) {
    const sig = state.companies.map((c) => c.slug).join("|");
    if (el.dataset.sig !== sig) {
      el.innerHTML = "";
      const colors = ["#6b4f3a", "#3d6b52", "#2563eb", "#9333ea", "#dc2626"];
      state.companies.forEach((c, i) => {
        const btn = document.createElement("button");
        btn.className = "company-item" + (c.slug === activeCompany ? " active" : "");
        btn.dataset.slug = c.slug;
        btn.innerHTML = `<span class="company-dot" style="background:${colors[i % colors.length]}"></span>${c.name}`;
        btn.onclick = () => { activeCompany = c.slug; render(); };
        el.appendChild(btn);
      });
      el.dataset.sig = sig;
    } else {
      [...el.children].forEach((b) => b.classList.toggle("active", b.dataset.slug === activeCompany));
    }
  }

  // Stats bawah sidebar
  const c = currentCompany();
  document.getElementById("sideRoadmap").textContent = c ? `${c.roadmapProgress}%` : "—";
  document.getElementById("sidePlan").textContent    = c ? `${c.planCount} / ${c.qaReports}` : "—";
  document.getElementById("sideBlokir").textContent  = c ? (c.keputusanTertahan || 0) : "—";
  const u = c && c.usage;
  document.getElementById("sideUsage").textContent = u ? `${u.todayActions} / ${u.weekActions}` : "—";
}

// -------------------------------------------------------------------
// QUOTA BANNER
// -------------------------------------------------------------------
function renderQuota() {
  if (!state) return;
  const q = state.quota || { status: "ok" };
  const banner = document.getElementById("quotaBanner");
  if (q.status === "ok") { banner.style.display = "none"; return; }
  const jam = q.resumeAt ? new Date(q.resumeAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
  banner.className = "quota-banner" + (q.status === "error" ? " error" : "");
  banner.textContent = q.status === "habis"
    ? `Tim istirahat — kuota langganan habis sejak ${fmtTime(q.since)}. Perkiraan lanjut ±${jam}.`
    : `Giliran terakhir gagal karena error API (${fmtTime(q.since)}): ${q.message}. Tim menunggu perintah berikutnya.`;
  banner.style.display = "block";
}

// -------------------------------------------------------------------
// AGENT GRID
// -------------------------------------------------------------------
function statusBadge(status) {
  if (status === "kerja")     return '<span class="agent-status-badge badge-kerja">Kerja</span>';
  if (status === "rapat")     return '<span class="agent-status-badge badge-rapat">Rapat</span>';
  return                              '<span class="agent-status-badge badge-istirahat">Istirahat</span>';
}

function renderAgents() {
  const grid = document.getElementById("agentGrid");
  const subtitle = document.getElementById("agentSubtitle");
  const c = currentCompany();
  grid.innerHTML = "";

  if (!c || !c.agents || !c.agents.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <strong>Belum ada aktivitas tercatat</strong>
        Buka sesi Claude Code di folder companies/${c ? c.slug : "…"} dan jalankan /kickoff.
      </div>`;
    subtitle.textContent = "—";
    return;
  }

  const kerja = c.agents.filter(a => a.status === "kerja").length;
  const total  = c.agents.length;
  subtitle.textContent = `${kerja} dari ${total} agen aktif`;

  for (const a of c.agents) {
    const info   = roster[a.type] || {};
    const color  = a.color || info.color || "#78726a";
    const initials = (a.nickname || a.type).slice(0, 2).toUpperCase();
    const summary  = (a.lastSummary || "Belum ada aktivitas").replace(/</g, "&lt;").slice(0, 120);

    const card = document.createElement("div");
    card.className = "agent-card";
    card.style.setProperty("--card-color", color);
    card.style.cssText += `border-top: 3px solid ${color}`;

    card.innerHTML = `
      <div class="agent-card-head">
        <div class="agent-avatar" style="background:${color}">${initials}</div>
        <div class="agent-info">
          <div class="agent-name">${a.nickname || a.type}</div>
          <div class="agent-role">${a.role}</div>
        </div>
        ${statusBadge(a.status)}
      </div>
      <div class="agent-summary">${summary}</div>
      <div class="agent-meta">
        <span>${a.actions} aksi</span>
        <span>${a.sessions} sesi</span>
        <span>${fmtTime(a.lastTs)}</span>
      </div>`;
    grid.appendChild(card);
  }
}

// -------------------------------------------------------------------
// OFFICE CANVAS update
// -------------------------------------------------------------------
function updateOffice() {
  const c = currentCompany();
  const q = (state && state.quota) || { status: "ok" };
  if (window.office && c) {
    window.office.update(c.agents, roster, {
      name: c.name,
      roadmapProgress: c.roadmapProgress,
      planCount: c.planCount,
      qaReports: c.qaReports,
      blokir: c.keputusanTertahan,
      team: c.team,
      quota: q,
      meeting: c.meeting || { active: false },
    });
  }
}

// -------------------------------------------------------------------
// TABS & PAGES
// -------------------------------------------------------------------
function showPage(tab) {
  const pages = { overview: "pageOverview", roadmap: "pageRoadmap", keputusan: "pageKeputusan", output: "pageOutput", bukti: "pageBukti", pengaturan: "pagePengaturan" };
  if (tab === "pengaturan") loadConfig();
  Object.values(pages).forEach((id) => { const el = document.getElementById(id); if (el) el.classList.remove("active"); });
  const target = document.getElementById(pages[tab]);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
}

// Roadmap
async function renderTabRoadmap() {
  const el = document.getElementById("tabRoadmap");
  const label = document.getElementById("roadmapCompanyLabel");
  if (!activeCompany) { el.innerHTML = ""; return; }
  if (label) label.textContent = currentCompany()?.name || "";
  try {
    const data = await (await fetch(`/api/company/${activeCompany}/roadmap`)).json();
    el.innerHTML = data.rows.length ? renderDataTable(data) : `<div class="empty"><strong>Roadmap belum ada</strong>planning/ROADMAP.md masih kosong.</div>`;
  } catch { el.innerHTML = `<div class="empty">Gagal memuat roadmap.</div>`; }
}

// Keputusan
async function renderTabKeputusan() {
  const el = document.getElementById("tabKeputusan");
  const label = document.getElementById("keputusanCompanyLabel");
  if (!activeCompany) { el.innerHTML = ""; return; }
  if (label) label.textContent = currentCompany()?.name || "";
  try {
    const data = await (await fetch(`/api/company/${activeCompany}/keputusan`)).json();
    el.innerHTML = data.rows.length ? renderDataTable(data) : `<div class="empty"><strong>Belum ada keputusan</strong>KEPUTUSAN.md masih kosong.</div>`;
  } catch { el.innerHTML = `<div class="empty">Gagal memuat keputusan.</div>`; }
}

// Output
async function renderTabOutput() {
  const el = document.getElementById("tabOutput");
  if (!activeCompany) { el.innerHTML = ""; return; }
  try {
    const files = await (await fetch(`/api/company/${activeCompany}/output`)).json();
    if (!files.length) { el.innerHTML = `<div class="empty"><strong>Belum ada dokumen</strong>Mulai /kickoff untuk menghasilkan dokumen pertama.</div>`; return; }
    el.innerHTML = `<ul class="file-list">${files.map((f) =>
      `<li class="file-item"><span class="file-path">${f.path}</span><span class="file-time">${fmtTime(f.mtime)}</span></li>`
    ).join("")}</ul>`;
  } catch { el.innerHTML = `<div class="empty">Gagal memuat output.</div>`; }
}

// Bukti QA
async function renderTabBukti() {
  const el = document.getElementById("tabBukti");
  if (!activeCompany) { el.innerHTML = ""; return; }
  try {
    const files = await (await fetch(`/api/company/${activeCompany}/bukti`)).json();
    if (!files.length) { el.innerHTML = `<div class="empty"><strong>Belum ada bukti QA</strong>Screenshot akan muncul di sini setelah QA dijalankan.</div>`; return; }
    el.innerHTML = `<div class="bukti-grid">${files.map((f) => `<img src="${f.url}" loading="lazy" alt="bukti QA" />`).join("")}</div>`;
  } catch { el.innerHTML = `<div class="empty">Gagal memuat bukti QA.</div>`; }
}

// -------------------------------------------------------------------
// RENDER TABEL (helper)
// -------------------------------------------------------------------
function renderDataTable(data) {
  const STATUS_KATA = /selesai|done|✅|100%/i;
  const BLOKIR_KATA = /blokir|menunggu|tertahan/i;

  const head = data.headers.map((h) => `<th>${h}</th>`).join("");
  const rows = data.rows.map((r) => {
    const cells = data.headers.map((h) => {
      let val = (r[h] || "").replace(/</g, "&lt;");
      // chip status
      if (/status|kondisi/i.test(h)) {
        if (STATUS_KATA.test(val)) val = `<span class="chip chip-done">${val}</span>`;
        else if (BLOKIR_KATA.test(val)) val = `<span class="chip chip-blokir">${val}</span>`;
        else if (val) val = `<span class="chip chip-pending">${val}</span>`;
      }
      return `<td>${val}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

// -------------------------------------------------------------------
// RENDER UTAMA
// -------------------------------------------------------------------
function render() {
  renderSidebar();
  renderQuota();
  updateOffice();
  renderAgents();

  if (activeTab === "roadmap")   renderTabRoadmap();
  if (activeTab === "keputusan") renderTabKeputusan();
  if (activeTab === "output")    renderTabOutput();
  if (activeTab === "bukti")     renderTabBukti();
}

// -------------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------------
document.querySelectorAll(".nav-item[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    showPage(activeTab);
    render();
  });
});

// Jam berjalan setiap detik tanpa fetch ulang
setInterval(() => {
  const el = document.getElementById("liveTime");
  if (el) el.textContent = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}, 1000);

// State refresh setiap 5 detik
fetchState();
setInterval(fetchState, 5000);

// SSE untuk update real-time
try {
  const es = new EventSource("/events");
  es.onmessage = () => fetchState();
} catch { /* polling tetap jalan */ }

// -------------------------------------------------------------------
// KOTAK PERINTAH -> /api/command (Orkestrator via claude -p)
// -------------------------------------------------------------------
const CMD_LABEL = { antre: "antre", jalan: "jalan", selesai: "selesai", gagal: "gagal", dihentikan: "dihentikan", dibatalkan: "dibatalkan", terhenti: "terhenti" };
function getToken(forcePrompt) {
  let t = "";
  try { t = localStorage.getItem("office-token") || ""; } catch { /* abaikan */ }
  if (!t || forcePrompt) {
    t = (window.prompt("Masukkan kunci akses (OFFICE_TOKEN di file office/.env):", "") || "").trim();
    if (t) { try { localStorage.setItem("office-token", t); } catch { /* abaikan */ } }
  }
  return t;
}
function escapeHtml(s) { return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function renderCompanySelect() {
  const sel = document.getElementById("cmdCompany"); if (!sel || !state) return;
  const sig = state.companies.map((c) => c.slug).join("|");
  if (sel.dataset.sig !== sig) {
    sel.innerHTML = `<option value="">Semua</option>` + state.companies.map((c) => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`).join("");
    sel.dataset.sig = sig;
  }
  if (!sel.dataset.touched && activeCompany) sel.value = activeCompany;
}
async function loadCommands() {
  try {
    const list = await (await fetch("/api/commands")).json();
    const el = document.getElementById("cmdList"); if (!el) return;
    el.innerHTML = list.slice(0, 5).map((j) => {
      const dur = j.ended && j.started ? ` · ${Math.round((j.ended - j.started) / 1000)} dtk` : "";
      const open = j.status === "jalan" || (j.ended && Date.now() - j.ended < 120000) ? " open" : "";
      const stop = j.status === "jalan" || j.status === "antre" ? `<button class="cmd-stop" data-id="${j.id}">Hentikan</button>` : "";
      return `<details class="cmd-item"${open}><summary><span class="cmd-st st-${j.status}">${CMD_LABEL[j.status] || j.status}</span><span class="cmd-q">${escapeHtml(j.text)}</span><span class="cmd-meta">${j.company ? escapeHtml(j.company) + " · " : ""}${fmtTime(j.created)}${dur}</span>${stop}</summary><pre class="cmd-out">${escapeHtml(j.output || (j.status === "antre" ? "Menunggu giliran..." : "Orkestrator sedang bekerja..."))}</pre></details>`;
    }).join("") || `<div class="cmd-empty">Belum ada perintah dari dashboard.</div>`;
  } catch { /* server mungkin sedang restart */ }
}
async function sendCommand(text, company, retried) {
  const token = getToken(false); if (!token) return;
  const res = await fetch("/api/command", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ text, company }) });
  if (res.status === 401 && !retried) { getToken(true); return sendCommand(text, company, true); }
  if (!res.ok) { const e = await res.json().catch(() => ({})); alert("Gagal mengirim: " + (e.error || res.status)); return; }
  document.getElementById("cmdText").value = "";
  loadCommands();
}
document.getElementById("cmdForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = document.getElementById("cmdText").value.trim(); if (!text) return;
  sendCommand(text, document.getElementById("cmdCompany").value || null);
});
document.getElementById("cmdCompany")?.addEventListener("change", (e) => { e.target.dataset.touched = "1"; });
document.getElementById("cmdList")?.addEventListener("click", async (e) => {
  const b = e.target.closest(".cmd-stop"); if (!b) return;
  e.preventDefault();
  const token = getToken(false); if (!token) return;
  await fetch(`/api/command/${b.dataset.id}/stop`, { method: "POST", headers: { Authorization: "Bearer " + token } });
  loadCommands();
});
loadCommands();
setInterval(() => { renderCompanySelect(); loadCommands(); }, 3000);

// -------------------------------------------------------------------
// PENGATURAN PERUSAHAAN -> /api/company/:slug/config
// -------------------------------------------------------------------
let cfgLoadedFor = null;
async function loadConfig(force) {
  if (!activeCompany || (!force && cfgLoadedFor === activeCompany)) return;
  const cfg = await (await fetch(`/api/company/${activeCompany}/config`)).json();
  cfgLoadedFor = activeCompany;
  document.getElementById("cfgCompanyLabel").textContent = `${cfg.name} · companies/${cfg.slug}`;
  const nameField = `<label class="cfg-field"><span>Nama tampilan</span><input data-name value="${escapeHtml(cfg.name)}"></label>`;
  document.getElementById("cfgProfile").innerHTML = nameField + cfg.profile.map((p, i) =>
    `<label class="cfg-field${p.value.length > 60 ? " cfg-wide" : ""}"><span>${escapeHtml(p.key)}</span><input data-key="${escapeHtml(p.key)}" value="${escapeHtml(p.value)}"></label>`).join("");
  const on = new Set(cfg.team.roles);
  document.getElementById("cfgRoles").innerHTML = Object.entries(cfg.roster).map(([id, r]) => {
    const lock = id === "orchestrator";
    return `<label class="cfg-role${on.has(id) ? " on" : ""}" style="--c:${r.color}"><input type="checkbox" value="${id}" ${on.has(id) ? "checked" : ""} ${lock ? "disabled" : ""}><b>${escapeHtml(r.nickname)}</b><span>${escapeHtml(r.role)}</span></label>`;
  }).join("");
  document.getElementById("cfgNotes").value = cfg.team.notes || "";
  document.getElementById("cfgMsg").textContent = cfg.team.configured ? "" : "Belum pernah diatur: semua peran dianggap aktif.";
}
document.getElementById("cfgRoles")?.addEventListener("change", (e) => { const l = e.target.closest(".cfg-role"); if (l) l.classList.toggle("on", e.target.checked); });
document.getElementById("cfgForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: document.querySelector("#cfgProfile [data-name]").value,
    profile: [...document.querySelectorAll("#cfgProfile [data-key]")].map((i) => ({ key: i.dataset.key, value: i.value })),
    roles: [...document.querySelectorAll("#cfgRoles input:checked")].map((i) => i.value),
    notes: document.getElementById("cfgNotes").value,
  };
  const send = (token) => fetch(`/api/company/${activeCompany}/config`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(body) });
  let res = await send(getToken(false));
  if (res.status === 401) res = await send(getToken(true));
  const msg = document.getElementById("cfgMsg");
  if (res.ok) { msg.textContent = "Tersimpan. Tim memakai formasi ini mulai perintah berikutnya."; cfgLoadedFor = null; fetchState(); }
  else msg.textContent = "Gagal menyimpan (" + res.status + ")";
});
// Pindah perusahaan di sidebar saat halaman pengaturan terbuka -> muat ulang
setInterval(() => { if (document.getElementById("pagePengaturan")?.classList.contains("active") && cfgLoadedFor !== activeCompany) loadConfig(); }, 800);

// -------------------------------------------------------------------
// MODEL PER PERAN (global, semua perusahaan) -> /api/model-peran
// -------------------------------------------------------------------
let modelPeranLoaded = false;
async function loadModelPeran() {
  if (modelPeranLoaded) return;
  modelPeranLoaded = true;
  const [data, roster] = await Promise.all([
    fetch("/api/model-peran").then((r) => r.json()),
    fetch("/api/roster").then((r) => r.json()),
  ]);
  const opsiModel = (dipilih) => `<option value="">(bawaan)</option>` + data.pilihanModel.map((m) => `<option value="${m}" ${m === dipilih ? "selected" : ""}>${m}</option>`).join("");
  const opsiEffort = (dipilih) => `<option value="">(bawaan)</option>` + data.pilihanEffort.map((e) => `<option value="${e}" ${e === dipilih ? "selected" : ""}>${e}</option>`).join("");
  const peranList = Object.keys(roster).filter((id) => id !== "orchestrator" && id !== "peneliti-nonaktif");
  document.getElementById("modelPeranList").innerHTML = peranList.map((id) => {
    const r = roster[id], cur = data.peran[id] || {};
    return `<div class="cfg-field" data-peran="${id}"><span><b>${escapeHtml(r.nickname)}</b> · ${escapeHtml(r.role)}</span>
      <select data-model>${opsiModel(cur.model)}</select>
      <select data-effort style="margin-top:4px">${opsiEffort(cur.effort)}</select></div>`;
  }).join("");
}
document.getElementById("modelPeranSave")?.addEventListener("click", async () => {
  const body = {};
  document.querySelectorAll("#modelPeranList [data-peran]").forEach((el) => {
    const peran = el.dataset.peran;
    const model = el.querySelector("[data-model]").value;
    const effort = el.querySelector("[data-effort]").value;
    if (model || effort) body[peran] = { model: model || null, effort: effort || null };
  });
  const send = (token) => fetch("/api/model-peran", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(body) });
  let res = await send(getToken(false));
  if (res.status === 401) res = await send(getToken(true));
  const msg = document.getElementById("modelPeranMsg");
  msg.textContent = res.ok ? "Tersimpan. Berlaku mulai tugas berikutnya." : "Gagal menyimpan (" + res.status + ")";
});
setInterval(() => { if (document.getElementById("pagePengaturan")?.classList.contains("active")) loadModelPeran(); }, 800);
