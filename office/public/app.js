let state = null;
let roster = {};
let activeCompany = null;
let activeTab = "roadmap";

fetch("/api/roster").then((r) => r.json()).then((r) => (roster = r)).catch(() => {});

async function fetchState() {
  const res = await fetch("/api/state");
  state = await res.json();
  if (!activeCompany && state.companies.length) activeCompany = state.companies[0].slug;
  render();
}

function updateOffice() {
  const c = currentCompany();
  const q = state.quota || { status: "ok" };
  if (window.office && c) window.office.update(c.agents, roster, { name: c.name, roadmapProgress: c.roadmapProgress, planCount: c.planCount, qaReports: c.qaReports, blokir: c.keputusanTertahan, quota: q, meeting: c.meeting || { active: false } });
  const banner = document.getElementById("quotaBanner");
  if (q.status === "ok") {
    banner.style.display = "none";
    return;
  }
  const jam = new Date(q.resumeAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  banner.className = "quota-banner" + (q.status === "error" ? " error" : "");
  banner.textContent = q.status === "habis"
    ? `Tim istirahat: kuota langganan habis sejak ${fmtTime(q.since)}. Perkiraan lanjut sekitar pukul ${jam}.`
    : `Giliran terakhir gagal karena error API (${fmtTime(q.since)}): ${q.message}. Tim menunggu perintah berikutnya.`;
  banner.style.display = "block";
}

function fmtTime(ts) {
  if (!ts) return "belum ada aktivitas";
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const h = Math.round(diffMin / 60);
  return `${h} jam lalu`;
}

function currentCompany() {
  return state.companies.find((c) => c.slug === activeCompany) || null;
}

function renderTopbar() {
  document.getElementById("liveTime").textContent = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const tabsEl = document.getElementById("companyTabs");
  // Bangun tombol hanya saat daftar perusahaan berubah, supaya klik tidak terganggu refresh 5 detik
  const signature = state.companies.map((c) => c.slug).join("|");
  if (tabsEl.dataset.signature !== signature) {
    tabsEl.innerHTML = "";
    for (const c of state.companies) {
      const b = document.createElement("button");
      b.textContent = c.name;
      b.dataset.slug = c.slug;
      b.onclick = () => { activeCompany = c.slug; render(); };
      tabsEl.appendChild(b);
    }
    tabsEl.dataset.signature = signature;
  }
  for (const b of tabsEl.children) b.className = b.dataset.slug === activeCompany ? "active" : "";
  const c = currentCompany();
  document.getElementById("roadmapPct").textContent = c ? `${c.roadmapProgress}%` : "-";
  document.getElementById("planCount").textContent = c ? `${c.planCount} / ${c.qaReports}` : "-";
  document.getElementById("blokirCount").textContent = c ? c.keputusanTertahan : "-";
}

function renderAgents() {
  const grid = document.getElementById("agentGrid");
  const c = currentCompany();
  grid.innerHTML = "";
  if (!c || !c.agents.length) {
    grid.innerHTML = '<div class="empty">Belum ada aktivitas agen tercatat untuk perusahaan ini. Buka sesi Claude Code di folder companies/' + (c ? c.slug : "...") + ' dan jalankan /kickoff.</div>';
    return;
  }
  for (const a of c.agents) {
    const div = document.createElement("div");
    div.className = "agent-card";
    div.style.borderTop = `3px solid ${a.color}`;
    div.innerHTML = `
      <div class="head">
        <span class="dot ${a.status}"></span>
        <span class="name">${a.nickname}</span>
        <span class="role">· ${a.role}</span>
      </div>
      <div class="summary">${a.lastSummary || "Belum ada aktivitas"}</div>
      <div class="meta">
        <span>${a.actions} aksi</span>
        <span>${a.sessions} sesi</span>
        <span>${fmtTime(a.lastTs)}</span>
      </div>`;
    grid.appendChild(div);
  }
}

async function renderTabRoadmap() {
  const el = document.getElementById("tabRoadmap");
  if (!activeCompany) return (el.innerHTML = "");
  const data = await (await fetch(`/api/company/${activeCompany}/roadmap`)).json();
  if (!data.rows.length) return (el.innerHTML = '<div class="empty">ROADMAP.md masih kosong.</div>');
  el.innerHTML = renderTable(data);
}
async function renderTabKeputusan() {
  const el = document.getElementById("tabKeputusan");
  if (!activeCompany) return (el.innerHTML = "");
  const data = await (await fetch(`/api/company/${activeCompany}/keputusan`)).json();
  if (!data.rows.length) return (el.innerHTML = '<div class="empty">Belum ada keputusan tercatat.</div>');
  el.innerHTML = renderTable(data);
}
async function renderTabOutput() {
  const el = document.getElementById("tabOutput");
  if (!activeCompany) return (el.innerHTML = "");
  const files = await (await fetch(`/api/company/${activeCompany}/output`)).json();
  if (!files.length) return (el.innerHTML = '<div class="empty">Belum ada dokumen dibuat.</div>');
  el.innerHTML = `<ul class="file-list">${files.map((f) => `<li><span>${f.path}</span><span class="t">${fmtTime(f.mtime)}</span></li>`).join("")}</ul>`;
}
async function renderTabBukti() {
  const el = document.getElementById("tabBukti");
  if (!activeCompany) return (el.innerHTML = "");
  const files = await (await fetch(`/api/company/${activeCompany}/bukti`)).json();
  if (!files.length) return (el.innerHTML = '<div class="empty">Belum ada bukti screenshot QA.</div>');
  el.innerHTML = `<div class="bukti-grid">${files.map((f) => `<img src="${f.url}" loading="lazy" />`).join("")}</div>`;
}

function renderTable(data) {
  const head = data.headers.map((h) => `<th>${h}</th>`).join("");
  const rows = data.rows.map((r) => `<tr>${data.headers.map((h) => `<td>${(r[h] || "").replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function render() {
  renderTopbar();
  updateOffice();
  renderAgents();
  document.getElementById("tabRoadmap").style.display = activeTab === "roadmap" ? "block" : "none";
  document.getElementById("tabKeputusan").style.display = activeTab === "keputusan" ? "block" : "none";
  document.getElementById("tabOutput").style.display = activeTab === "output" ? "block" : "none";
  document.getElementById("tabBukti").style.display = activeTab === "bukti" ? "block" : "none";
  if (activeTab === "roadmap") renderTabRoadmap();
  if (activeTab === "keputusan") renderTabKeputusan();
  if (activeTab === "output") renderTabOutput();
  if (activeTab === "bukti") renderTabBukti();
}

document.getElementById("tabs").addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  activeTab = e.target.dataset.tab;
  [...document.getElementById("tabs").children].forEach((b) => b.classList.toggle("active", b === e.target));
  render();
});

fetchState();
setInterval(fetchState, 5000);

try {
  const es = new EventSource("/events");
  es.onmessage = () => fetchState();
} catch {
  /* SSE opsional; polling 5 detik tetap jalan */
}
