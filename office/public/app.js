// (Sidebar lama sudah diganti menu ikon di top HUD, tidak perlu toggle show/hide lagi.)

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
  // Jam (dipakai di top HUD dan elemen tersembunyi lama)
  const now = new Date();
  const t = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const lt = document.getElementById("liveTime"); if (lt) lt.textContent = t;

  // Stats ringkas (dipakai halaman lain kalau perlu; BLOKIR & Aksi utama sudah di top HUD)
  const c = currentCompany();
  const sr = document.getElementById("sideRoadmap"); if (sr) sr.textContent = c ? `${c.roadmapProgress}%` : "—";
  const sp = document.getElementById("sidePlan"); if (sp) sp.textContent = c ? `${c.planCount} / ${c.qaReports}` : "—";
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
  if (status === "kerja") return '<span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">KERJA</span>';
  if (status === "rapat") return '<span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">RAPAT</span>';
  return '<span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">ISTIRAHAT</span>';
}
// Model per peran (dari Pengaturan) -> label singkat buat badge kartu tim
let modelPeranMap = {};
async function loadModelPeranMap() {
  try { modelPeranMap = (await (await fetch("/api/model-peran")).json()).peran || {}; } catch { modelPeranMap = {}; }
}
loadModelPeranMap();
setInterval(loadModelPeranMap, 30000);
function modelBadge(type) {
  const m = modelPeranMap[type];
  if (!m || (!m.model && !m.effort)) return "Bawaan";
  return [m.model, m.effort].filter(Boolean).join(" · ");
}

function renderAgents() {
  const grid = document.getElementById("agentGrid");
  const subtitle = document.getElementById("agentSubtitle");
  const c = currentCompany();
  grid.innerHTML = "";

  if (!c || !c.agents || !c.agents.length) {
    grid.innerHTML = `
      <div class="empty col-span-full text-sm text-slate-400 text-center py-6">
        <strong class="block text-slate-600 mb-1">Belum ada aktivitas tercatat</strong>
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
    const summary  = escapeHtml((a.lastSummary || "Belum ada aktivitas").slice(0, 90));

    const card = document.createElement("div");
    card.className = "bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition";
    card.style.borderTop = `3px solid ${color}`;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0" style="background:${color}">${initials}</span>
            <span class="text-[11px] font-bold text-slate-800 truncate">${escapeHtml(a.nickname || a.type)}</span>
          </div>
          ${statusBadge(a.status)}
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1 gap-1">
          <span class="truncate">${escapeHtml(a.role)}</span>
          <span class="text-[11px] bg-slate-100 text-slate-600 px-1 rounded font-mono shrink-0">${escapeHtml(modelBadge(a.type))}</span>
        </div>
        <p class="text-[11px] text-slate-700 font-medium truncate mb-2 leading-tight" title="${summary}">${summary}</p>
      </div>
      <div class="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
        ${a.actions} aksi · ${a.sessions} sesi · ${fmtTime(a.lastTs)}
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
  Object.entries(pages).forEach(([t, id]) => { const el = document.getElementById(id); if (el) el.classList.toggle("active", t === tab); });
  // Overview = layout 3 kolom biasa (bukan lagi mekanisme .page.active lama). Halaman
  // lain menimpa layar penuh lewat #pageWrap.
  // Set lewat inline style (bukan class) supaya tidak pernah bentrok cascade dengan class Tailwind lain.
  const ov = document.getElementById("pageOverview");
  if (ov) ov.style.display = tab === "overview" ? "" : "none";
  const wrap = document.getElementById("pageWrap");
  if (wrap) wrap.classList.toggle("hidden", tab === "overview");
  document.querySelectorAll(".nav-icon").forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("active", on);
    b.classList.toggle("text-slate-500", !on);
  });
  window.dispatchEvent(new Event("resize")); // kantor 3D perlu tahu kalau container berubah
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
// -------------------------------------------------------------------
// BAR STATISTIK ATAS (data asli semua perusahaan, bukan taksiran)
// -------------------------------------------------------------------
let jadwalCache = [];
async function loadJadwalCache() {
  try { jadwalCache = (await (await fetch("/api/jadwal")).json()).jadwal || []; } catch { jadwalCache = []; }
}
function jadwalBerikutnya() {
  if (!jadwalCache.length) return "—";
  const now = new Date();
  let terbaik = null;
  for (const t of jadwalCache) {
    if (!t.aktif) continue;
    const [hh, mm] = String(t.jam || "").split(":").map(Number);
    if (Number.isNaN(hh)) continue;
    for (let d = 0; d < 8; d++) {
      const target = new Date(now); target.setDate(now.getDate() + d); target.setHours(hh, mm || 0, 0, 0);
      if (target <= now) continue;
      if (!t.hari.includes(target.getDay())) continue;
      if (!terbaik || target < terbaik.target) terbaik = { target, id: t.id };
      break;
    }
  }
  if (!terbaik) return "—";
  const beda = Math.round((terbaik.target - now) / 60000);
  const kapan = beda < 60 ? `${beda}m lagi` : beda < 24 * 60 ? `${terbaik.target.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : terbaik.target.toLocaleDateString("id-ID", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  return `${terbaik.id} · ${kapan}`;
}
function renderTopStats() {
  document.getElementById("tsJadwal").textContent = jadwalBerikutnya();
  if (!state) return;
  const aksi = state.companies.reduce((n, c) => n + (c.usage?.todayActions || 0), 0);
  const sesi = state.companies.reduce((n, c) => n + c.agents.filter((a) => a.status === "kerja").length, 0);
  const blokir = state.companies.reduce((n, c) => n + (c.keputusanTertahan || 0), 0);
  document.getElementById("tsAksi").textContent = aksi;
  document.getElementById("tsSesi").textContent = sesi;
  document.getElementById("tsBlokir").textContent = blokir;
}
setInterval(() => {
  const el = document.getElementById("tsJam");
  if (el) el.textContent = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}, 1000);
loadJadwalCache().then(() => { if (typeof renderCronPanel === "function") renderCronPanel(); });
setInterval(() => loadJadwalCache().then(() => { if (typeof renderCronPanel === "function") renderCronPanel(); }), 30000);

function render() {
  renderSidebar();
  renderQuota();
  updateOffice();
  renderAgents();
  renderTopStats();

  if (activeTab === "overview")  renderBacklogPanel();
  if (activeTab === "roadmap")   renderTabRoadmap();
  if (activeTab === "keputusan") renderTabKeputusan();
  if (activeTab === "output")    renderTabOutput();
  if (activeTab === "bukti")     renderTabBukti();
}

// -------------------------------------------------------------------
// AKTIVITAS LANGSUNG (kolom kiri Overview) -> /api/activity
// -------------------------------------------------------------------
let activityData = [], activityFilter = "semua", backlogLoadedFor = null;
async function loadActivity() {
  try { activityData = await (await fetch("/api/activity")).json(); } catch { activityData = []; }
  renderActivity();
}
function renderActivity() {
  const feedEl = document.getElementById("activityFeed"), filterEl = document.getElementById("activityFilters");
  if (!feedEl) return;
  const orang = [...new Map(activityData.map((a) => [a.nickname, a])).values()];
  filterEl.innerHTML = `<span class="activity-filter${activityFilter === "semua" ? " on" : ""}" data-f="semua">Semua</span>` +
    orang.map((o) => `<span class="activity-filter${activityFilter === o.nickname ? " on" : ""}" data-f="${escapeHtml(o.nickname)}" style="--c:${o.color}">${escapeHtml(o.nickname)}</span>`).join("");
  const list = activityFilter === "semua" ? activityData : activityData.filter((a) => a.nickname === activityFilter);
  feedEl.innerHTML = list.length ? list.slice(0, 40).map((a) => `
    <div class="activity-item">
      <div class="activity-avatar" style="background:${a.color}">${escapeHtml((a.nickname || "?").slice(0, 2).toUpperCase())}</div>
      <div class="activity-body">
        <div class="activity-row-top"><span><b>${escapeHtml(a.nickname)}</b> <span class="activity-tool">· ${escapeHtml(a.tool)}</span></span><span class="activity-time">${fmtTime(a.ts)}</span></div>
        <div>${escapeHtml(a.summary)}</div>
      </div>
    </div>`).join("") : `<div class="backlog-empty">Belum ada aktivitas tercatat.</div>`;
}
document.getElementById("activityFilters")?.addEventListener("click", (e) => {
  const f = e.target.closest("[data-f]"); if (!f) return;
  activityFilter = f.dataset.f; renderActivity();
});
loadActivity();
setInterval(loadActivity, 4000);

// -------------------------------------------------------------------
// BACKLOG & KEPUTUSAN (kolom kanan Overview)
// -------------------------------------------------------------------
function renderCronPanel() {
  const el = document.getElementById("panelCron"); if (!el) return;
  const rutin = jadwalCache.filter((t) => t.aktif);
  document.getElementById("cronCount").textContent = rutin.length;
  el.innerHTML = rutin.length ? rutin.map((t) => `
    <div class="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
      <div><div class="font-bold text-slate-800 text-[11.5px]">${escapeHtml(t.id)}</div><div class="text-[11.5px] text-slate-400">${t.executor === "agy" ? "Antigravity" : "Claude"}${t.diam ? " · senyap" : ""}</div></div>
      <span class="font-mono font-bold text-slate-700 text-xs">${escapeHtml(t.jam)}</span>
    </div>`).join("") : `<div class="backlog-empty text-slate-400 text-xs py-2">Belum ada jadwal aktif.</div>`;
}
document.getElementById("tabBacklogBtn")?.addEventListener("click", () => {
  document.getElementById("tabBacklogBtn").className = "font-bold text-slate-900 border-b-2 border-slate-900 pb-1";
  document.getElementById("tabCronBtn").className = "font-medium text-slate-400 hover:text-slate-700 pb-1";
  document.getElementById("panelBacklog").classList.remove("hidden");
  document.getElementById("panelCron").classList.add("hidden");
});
document.getElementById("tabCronBtn")?.addEventListener("click", () => {
  document.getElementById("tabCronBtn").className = "font-bold text-slate-900 border-b-2 border-slate-900 pb-1";
  document.getElementById("tabBacklogBtn").className = "font-medium text-slate-400 hover:text-slate-700 pb-1";
  document.getElementById("panelCron").classList.remove("hidden");
  document.getElementById("panelBacklog").classList.add("hidden");
  renderCronPanel();
});

async function renderBacklogPanel() {
  const elK = document.getElementById("panelKeputusan"), elB = document.getElementById("panelBacklog");
  if (!elK || !elB || !activeCompany) return;
  if (backlogLoadedFor === activeCompany) return;
  backlogLoadedFor = activeCompany;
  try {
    const [kep, bl] = await Promise.all([
      fetch(`/api/company/${activeCompany}/keputusan`).then((r) => r.json()),
      fetch(`/api/company/${activeCompany}/backlog`).then((r) => r.json()),
    ]);
    const kepOpen = kep.rows.filter((r) => /blokir/i.test(Object.values(r).join(" ")) && !/dijawab|disetujui|selesai|dihentikan|ditolak/i.test(r.Status || ""));
    const blOpen = bl.rows.filter((r) => !/dihentikan|ditolak|selesai/i.test(r.Status || ""));
    document.getElementById("panelKeputusanCount").textContent = kepOpen.length;
    document.getElementById("panelBacklogCount").textContent = blOpen.length;
    document.getElementById("tsBlokirCard").classList.toggle("animate-pulse", kepOpen.length > 0);

    elK.innerHTML = kepOpen.length ? kepOpen.map((r) => `
      <div class="bg-white rounded-lg p-2 border border-rose-200/90 shadow-sm">
        <div class="flex items-start justify-between gap-1 mb-1">
          <span class="text-[11.5px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">${escapeHtml(r.ID || "BLOKIR")}</span>
        </div>
        <p class="text-[11.5px] font-semibold text-slate-800 leading-tight">${escapeHtml(r.Pertanyaan || Object.values(r).join(" · "))}</p>
        ${r.Rekomendasi ? `<p class="text-[11.5px] text-slate-500 mt-1 mb-2">Rekomendasi: ${escapeHtml(r.Rekomendasi)}</p>` : ""}
        <div class="flex items-center gap-1.5 mt-1.5">
          <button class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1 rounded transition btn-setuju" data-id="${escapeHtml(r.ID || "")}" data-rek="${escapeHtml(r.Rekomendasi || "")}">Setujui rekomendasi</button>
          <button class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-1 rounded transition btn-diskusi" data-id="${escapeHtml(r.ID || "")}">Jawab sendiri</button>
        </div>
      </div>`).join("") : `<div class="text-[11.5px] text-slate-400 py-2">Tidak ada yang menunggu.</div>`;

    elB.innerHTML = blOpen.length ? blOpen.map((r) => `
      <label class="flex items-center justify-between gap-1.5"><span class="text-slate-700 truncate">${escapeHtml(r.Item || Object.values(r).join(" · "))}</span><span class="text-[11px] text-slate-400 shrink-0">${escapeHtml(r.Status || "")}</span></label>`).join("") : `<div class="text-slate-400 py-2">Backlog kosong.</div>`;

    // Tombol Setujui: kirim command asli ke antrean (jawaban = rekomendasi tertulis)
    elK.querySelectorAll(".btn-setuju").forEach((b) => b.addEventListener("click", () => {
      sendCommand(`${activeCompany}: ${b.dataset.id} disetujui${b.dataset.rek ? " -> " + b.dataset.rek : ""}, tandai Dijawab di KEPUTUSAN.md`, activeCompany);
    }));
    // Tombol Jawab sendiri: isi kotak perintah, CEO yang lengkapi lalu Kirim manual
    elK.querySelectorAll(".btn-diskusi").forEach((b) => b.addEventListener("click", () => {
      const input = document.getElementById("cmdText");
      input.value = `${activeCompany}: ${b.dataset.id}: `;
      input.focus();
    }));
  } catch {
    elK.innerHTML = elB.innerHTML = `<div class="text-slate-400 py-2">Gagal memuat.</div>`;
  }
}
// Pindah perusahaan -> muat ulang panel
setInterval(() => { if (activeTab === "overview") { renderBacklogPanel(); if (!document.getElementById("panelCron").classList.contains("hidden")) renderCronPanel(); } }, 800);

// -------------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------------
document.querySelectorAll(".nav-icon[data-tab]").forEach((btn) => {
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
    const sum = document.getElementById("cmdSummary");
    if (sum) {
      const antre = list.filter((j) => j.status === "antre").length;
      const jalan = list.filter((j) => j.status === "jalan").length;
      const selesai = list.filter((j) => j.status === "selesai").length;
      sum.textContent = `${antre} antre, ${jalan} jalan, ${selesai} selesai`;
    }
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
document.getElementById("cmdCompany")?.addEventListener("change", (e) => {
  e.target.dataset.touched = "1";
  if (e.target.value) { activeCompany = e.target.value; backlogLoadedFor = null; render(); }
});
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
