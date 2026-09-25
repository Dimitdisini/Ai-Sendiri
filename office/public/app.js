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
      quota: q,
      meeting: c.meeting || { active: false },
    });
  }
}

// -------------------------------------------------------------------
// TABS & PAGES
// -------------------------------------------------------------------
function showPage(tab) {
  const pages = { overview: "pageOverview", roadmap: "pageRoadmap", keputusan: "pageKeputusan", output: "pageOutput", bukti: "pageBukti" };
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
