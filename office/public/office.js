// Kantor isometrik Team Dimitri: ruang kerja, ruang rapat kaca, sudut istirahat. Digambar di <canvas>, tanpa library.
// Menerima data dari app.js lewat window.office.update(agents, roster, meta).
(function () {
  const canvas = document.getElementById("officeCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const TW = 64, TH = 32;
  const GRID_W = 17, GRID_H = 10;
  const ORIGIN = { x: 385, y: 150 };
  const W = canvas.width, H = canvas.height;
  const WALL_H = 150, GLASS_H = 92;
  const MEET_X = 10.5, MEET_Y = 5.6; // batas ruang rapat: x >= MEET_X dan y <= MEET_Y

  // Meja kerja per peran (grid). Orkestrator meja besar.
  const SEATS = {
    "business-analyst": { x: 2, y: 1.6 }, pm: { x: 4, y: 1.6 }, analyst: { x: 6, y: 1.6 }, "ai-engineer": { x: 8, y: 1.6 },
    backend: { x: 2, y: 4.6 }, frontend: { x: 4, y: 4.6 }, data: { x: 6, y: 4.6 }, devops: { x: 8, y: 4.6 },
    qa: { x: 2, y: 7.6 }, "chief-of-staff": { x: 4, y: 7.6 },
    orchestrator: { x: 7.2, y: 7.6 },
  };
  // Kursi meja rapat: kepala meja untuk Orkestrator, lalu sisi atas dan bawah
  const MEETING_SEATS = [{ x: 11.6, y: 2.65 }, { x: 12.6, y: 1.45 }, { x: 13.7, y: 1.45 }, { x: 14.8, y: 1.45 }, { x: 12.6, y: 3.95 }, { x: 13.7, y: 3.95 }, { x: 14.8, y: 3.95 }, { x: 16.1, y: 2.0 }, { x: 16.1, y: 3.3 }];
  // Sudut istirahat
  const BREAK_SPOTS = [{ x: 12.4, y: 8.3 }, { x: 13.4, y: 8.3 }, { x: 14.4, y: 8.3 }, { x: 15.6, y: 7.3 }, { x: 11.4, y: 7.4 }, { x: 12.4, y: 7.1 }, { x: 13.4, y: 7.1 }, { x: 14.4, y: 7.1 }, { x: 16.2, y: 8.4 }, { x: 11.2, y: 8.7 }, { x: 15.4, y: 8.6 }];
  const CHATTER = ["Ngopi dulu ☕", "Nunggu keputusan CEO", "Rehat bentar", "Tadi QA-nya ketat banget", "Plan berikutnya apa ya?", "Kopi kedua nih", "Main sama kucing kantor 🐈"];
  const MEETING_CHATTER = ["Setuju, catat di notulen", "Itu masuk ASUMSI atau BLOKIR?", "Rekomendasiku opsi A", "Acceptance criteria-nya harus bisa diuji", "Tanya CEO dulu yang ini"];

  let roster = {};
  let agents = {};
  let meta = { roadmapProgress: 0, planCount: 0, qaReports: 0, name: "", meeting: { active: false } };
  const actors = {};
  let lastFrame = performance.now();

  function iso(gx, gy) { return { x: ORIGIN.x + (gx - gy) * (TW / 2), y: ORIGIN.y + (gx + gy) * (TH / 2) }; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) * f), g = Math.min(255, ((n >> 8) & 255) * f), b = Math.min(255, (n & 255) * f);
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function diamond(gx, gy, fill, stroke) {
    const p = iso(gx, gy);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + TW / 2, p.y + TH / 2); ctx.lineTo(p.x, p.y + TH); ctx.lineTo(p.x - TW / 2, p.y + TH / 2); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function box(gx, gy, w, d, h, color, lift = 0) {
    const a = iso(gx, gy), b = iso(gx + w, gy), c = iso(gx + w, gy + d), dd = iso(gx, gy + d);
    const ly = -h - lift;
    ctx.fillStyle = shade(color, 1.08);
    ctx.beginPath(); ctx.moveTo(a.x, a.y + ly); ctx.lineTo(b.x, b.y + ly); ctx.lineTo(c.x, c.y + ly); ctx.lineTo(dd.x, dd.y + ly); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(color, 0.8);
    ctx.beginPath(); ctx.moveTo(dd.x, dd.y + ly); ctx.lineTo(c.x, c.y + ly); ctx.lineTo(c.x, c.y - lift); ctx.lineTo(dd.x, dd.y - lift); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(color, 0.65);
    ctx.beginPath(); ctx.moveTo(c.x, c.y + ly); ctx.lineTo(b.x, b.y + ly); ctx.lineTo(b.x, b.y - lift); ctx.lineTo(c.x, c.y - lift); ctx.closePath(); ctx.fill();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  // Panel vertikal mengikuti dinding (dari titik grid a ke b), tinggi h, posisi dari lantai
  function wallPanel(ax, ay, bx, by, top, bottom, fill, stroke) {
    const p = iso(ax, ay), q = iso(bx, by);
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.moveTo(p.x, p.y - top); ctx.lineTo(q.x, q.y - top); ctx.lineTo(q.x, q.y - bottom); ctx.lineTo(p.x, p.y - bottom); ctx.closePath(); ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  function drawRoom(t) {
    ctx.clearRect(0, 0, W, H);
    const tl = iso(0, 0), tr = iso(GRID_W, 0), bl = iso(0, GRID_H);
    ctx.fillStyle = "#e9e4d8";
    ctx.beginPath(); ctx.moveTo(tl.x, tl.y - WALL_H); ctx.lineTo(tr.x, tr.y - WALL_H); ctx.lineTo(tr.x, tr.y); ctx.lineTo(tl.x, tl.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#dfd9cb";
    ctx.beginPath(); ctx.moveTo(tl.x, tl.y - WALL_H); ctx.lineTo(bl.x, bl.y - WALL_H); ctx.lineTo(bl.x, bl.y); ctx.lineTo(tl.x, tl.y); ctx.closePath(); ctx.fill();
    // jendela ruang kerja (dinding belakang)
    for (const x0 of [1.5, 5.5]) wallPanel(x0, 0, x0 + 2.6, 0, 125, 55, "#bfe3f5", "#ffffff");
    // papan roadmap di dinding kiri
    wallPanel(1, 6.5, 1, 1.5, 125, 50, "#ffffff", "#9a9a9a");
    const wb = iso(1, 6.5);
    ctx.save(); ctx.translate(wb.x, wb.y - 125); ctx.transform(1, -0.5, 0, 1, 0, 0);
    ctx.fillStyle = "#1f2430"; ctx.font = "bold 12px sans-serif"; ctx.fillText("Roadmap " + (meta.name || ""), 8, 16);
    ctx.fillStyle = "#e5e7eb"; ctx.fillRect(8, 24, 120, 8); ctx.fillStyle = "#7c3aed"; ctx.fillRect(8, 24, 1.2 * meta.roadmapProgress, 8);
    ctx.fillStyle = "#374151"; ctx.font = "11px sans-serif";
    ctx.fillText(meta.roadmapProgress + "% · " + meta.planCount + " plan · " + meta.qaReports + " QA", 8, 46);
    ctx.fillText("Tertahan: " + (meta.blokir || 0) + " BLOKIR", 8, 60);
    ctx.restore();
    // papan ruang rapat di dinding belakang kanan
    wallPanel(12.6, 0, 16.4, 0, 128, 58, "#ffffff", "#9a9a9a");
    const mb = iso(12.6, 0);
    ctx.save(); ctx.translate(mb.x, mb.y - 128); ctx.transform(1, 0.5, 0, 1, 0, 0);
    ctx.fillStyle = "#1f2430"; ctx.font = "bold 12px sans-serif"; ctx.fillText("Ruang Rapat", 8, 16);
    ctx.font = "11px sans-serif"; ctx.fillStyle = meta.meeting && meta.meeting.active ? "#b91c1c" : "#6b7280";
    ctx.fillText(meta.meeting && meta.meeting.active ? "● Sedang rapat: " + (meta.meeting.title || "") : "○ Kosong", 8, 34, 118);
    if (meta.meeting && meta.meeting.active) { ctx.fillStyle = "#374151"; ctx.fillText((meta.meeting.participants || []).length + " peserta", 8, 50); }
    ctx.restore();
    // lantai
    for (let gy = 0; gy < GRID_H; gy++) for (let gx = 0; gx < GRID_W; gx++) {
      const meeting = gx >= MEET_X && gy < MEET_Y, rest = gx >= MEET_X && gy >= MEET_Y;
      const c = meeting ? ((gx + gy) % 2 ? "#d7d2e8" : "#cdc7e0") : rest ? ((gx + gy) % 2 ? "#c9d6c1" : "#bccbb3") : ((gx + gy) % 2 ? "#e6cfa9" : "#dfc59c");
      diamond(gx, gy, c, meeting ? "#c2bbd8" : rest ? "#b4c3aa" : "#d4b98f");
    }
    // jam dinding
    const ck = iso(GRID_W - 1.2, 0);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ck.x, ck.y - 110, 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#333"; ctx.lineWidth = 2; ctx.stroke();
    const now = new Date(), hh = now.getHours() % 12, mm = now.getMinutes();
    ctx.beginPath(); ctx.moveTo(ck.x, ck.y - 110); ctx.lineTo(ck.x + 7 * Math.sin((hh + mm / 60) / 12 * Math.PI * 2), ck.y - 110 - 7 * Math.cos((hh + mm / 60) / 12 * Math.PI * 2)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ck.x, ck.y - 110); ctx.lineTo(ck.x + 10 * Math.sin(mm / 60 * Math.PI * 2), ck.y - 110 - 10 * Math.cos(mm / 60 * Math.PI * 2)); ctx.stroke();
  }

  // Dinding kaca ruang rapat: dua panel, dengan celah pintu di sisi kiri bawah
  function drawGlassX() { wallPanel(MEET_X, 0, MEET_X, MEET_Y - 1.3, GLASS_H, 0, "rgba(170,215,240,0.35)", "rgba(255,255,255,0.9)"); }
  function drawGlassY() { wallPanel(MEET_X, MEET_Y, GRID_W, MEET_Y, GLASS_H, 0, "rgba(170,215,240,0.35)", "rgba(255,255,255,0.9)"); }

  function drawDesk(type, seat, working, t) {
    const big = type === "orchestrator";
    const w = big ? 1.6 : 1.2, d = 0.7;
    box(seat.x - w / 2, seat.y - d / 2, w, d, 22, "#b98a5a");
    const m = iso(seat.x, seat.y - 0.05);
    ctx.fillStyle = "#2b2f3a"; ctx.fillRect(m.x - 14, m.y - 48, 28, 18);
    ctx.fillStyle = working ? (Math.sin(t / 150) > 0 ? "#7dd3fc" : "#67c3ee") : "#3b4252"; ctx.fillRect(m.x - 12, m.y - 46, 24, 14);
    ctx.fillStyle = "#2b2f3a"; ctx.fillRect(m.x - 2, m.y - 30, 4, 6);
    if (big) { ctx.fillStyle = "#2b2f3a"; ctx.fillRect(m.x + 18, m.y - 44, 22, 14); ctx.fillStyle = working ? "#a5f3fc" : "#3b4252"; ctx.fillRect(m.x + 20, m.y - 42, 18, 10); }
    const label = (roster[type] && roster[type].role) || type;
    ctx.font = "10px sans-serif"; const tw = ctx.measureText(label).width + 10;
    const lp = iso(seat.x, seat.y + d / 2 + 0.05);
    ctx.fillStyle = "#1f2430"; roundRect(lp.x - tw / 2, lp.y - 18, tw, 13, 4); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(label, lp.x - tw / 2 + 5, lp.y - 8);
  }

  function drawMeetingTable() {
    box(12.1, 2.05, 3.5, 1.25, 20, "#8d6e63");
    // kursi kecil di sekeliling
    for (const s of MEETING_SEATS.slice(0, 7)) box(s.x - 0.2, s.y - 0.2, 0.4, 0.4, 8, "#4b5563");
    // laptop dan gelas di meja
    const c1 = iso(13.0, 2.6), c2 = iso(14.6, 2.6);
    ctx.fillStyle = "#374151"; ctx.fillRect(c1.x - 8, c1.y - 30, 16, 10); ctx.fillStyle = "#e5e7eb"; ctx.fillRect(c2.x - 3, c2.y - 30, 6, 8);
  }
  function drawBreakArea() {
    box(12, 8.6, 3, 0.7, 14, "#6b7fa3"); box(12, 8.5, 3, 0.25, 30, "#5d7094");
    box(15.5, 6.6, 0.7, 0.7, 26, "#8d6e63"); box(15.65, 6.75, 0.4, 0.4, 16, "#374151", 26);
    const cat = iso(11.2, 9.3);
    ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.ellipse(cat.x, cat.y + 8, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cat.x + 8, cat.y + 5, 4, 0, Math.PI * 2); ctx.fill();
  }
  function plant(gx, gy) {
    box(gx, gy, 0.45, 0.45, 12, "#a16207");
    const p = iso(gx + 0.22, gy + 0.22); ctx.fillStyle = "#16a34a";
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(p.x + Math.cos(i * 1.26) * 8, p.y - 18 + Math.sin(i * 1.26) * 4, 9, 5, i * 0.6, 0, Math.PI * 2); ctx.fill(); }
  }

  function drawActor(a, type, t) {
    const info = roster[type] || { color: "#64748b", nickname: type, role: type };
    const p = iso(a.x, a.y);
    const bob = a.mode === "kerja" ? Math.sin(t / 120) * 1.5 : a.mode === "jalan" ? Math.abs(Math.sin(t / 90)) * 3 : 0;
    ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 14, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    const seated = a.mode === "kerja" || a.mode === "diam" || a.mode === "rapat";
    const bodyH = seated ? 16 : 22;
    ctx.fillStyle = a.active ? info.color : "#9ca3af"; roundRect(p.x - 9, p.y - bodyH - bob, 18, bodyH + 4, 5); ctx.fill();
    if (a.mode === "kerja") { ctx.fillStyle = "#f5d0b5"; ctx.fillRect(p.x - 11, p.y - 12 - bob + Math.sin(t / 80) * 2, 5, 4); ctx.fillRect(p.x + 6, p.y - 12 - bob - Math.sin(t / 80) * 2, 5, 4); }
    if (a.mode === "istirahat") { ctx.fillStyle = "#fff"; ctx.fillRect(p.x + 8, p.y - 14, 6, 8); ctx.fillStyle = "#6b3e26"; ctx.fillRect(p.x + 9, p.y - 13, 4, 2); }
    if (a.mode === "rapat") { ctx.fillStyle = "#fef3c7"; ctx.fillRect(p.x - 12, p.y - 13, 7, 9); ctx.fillStyle = "#92400e"; ctx.fillRect(p.x - 11, p.y - 11, 5, 1); ctx.fillRect(p.x - 11, p.y - 8, 5, 1); }
    ctx.fillStyle = "#f5d0b5"; roundRect(p.x - 8, p.y - bodyH - 16 - bob, 16, 15, 5); ctx.fill();
    ctx.fillStyle = "#2b2b2b"; roundRect(p.x - 8, p.y - bodyH - 16 - bob, 16, 6, 4); ctx.fill();
    ctx.fillStyle = "#1f2430"; ctx.fillRect(p.x - 4, p.y - bodyH - 8 - bob, 2, 2); ctx.fillRect(p.x + 2, p.y - bodyH - 8 - bob, 2, 2);
    const nm = info.nickname + " · " + (info.role || type);
    ctx.font = "bold 10px sans-serif"; const tw = ctx.measureText(nm).width + 12;
    ctx.fillStyle = a.active ? info.color : "#9ca3af"; roundRect(p.x - tw / 2, p.y - bodyH - 36 - bob, tw, 14, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(nm, p.x - tw / 2 + 6, p.y - bodyH - 26 - bob);
    if (a.bubble && t < a.bubbleUntil) {
      ctx.font = "10px sans-serif"; const bw = Math.min(200, ctx.measureText(a.bubble).width + 14);
      const bx = p.x - bw / 2, by = p.y - bodyH - 62 - bob;
      ctx.fillStyle = "#fff"; roundRect(bx, by, bw, 18, 8); ctx.fill(); ctx.strokeStyle = "#d1d5db"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#1f2430"; ctx.fillText(a.bubble, bx + 7, by + 12, bw - 14);
    }
  }

  function step(dt, t) {
    const quotaOut = meta.quota && meta.quota.status !== "ok";
    const meeting = meta.meeting && meta.meeting.active ? meta.meeting : null;
    const participants = meeting ? (meeting.participants || []) : [];
    Object.keys(SEATS).forEach((type, i) => {
      const seat = SEATS[type];
      if (!actors[type]) actors[type] = { x: seat.x, y: seat.y + 0.55, tx: seat.x, ty: seat.y + 0.55, mode: "diam", bubble: "", bubbleUntil: 0, active: false, nextChat: t + 3000 + i * 1500 };
      const a = actors[type], ag = agents[type];
      a.active = !!ag;
      const inMeeting = !quotaOut && meeting && participants.includes(type);
      const wantWork = !quotaOut && !inMeeting && ag && ag.status === "kerja";
      const wantBreak = ag && (ag.status === "istirahat" || quotaOut) && !inMeeting;
      let goal = "diam";
      if (inMeeting) { const s = MEETING_SEATS[Math.min(participants.indexOf(type), MEETING_SEATS.length - 1)]; a.tx = s.x; a.ty = s.y; goal = "rapat"; }
      else if (wantWork) { a.tx = seat.x; a.ty = seat.y + 0.55; goal = "kerja"; }
      else if (wantBreak) { const s = BREAK_SPOTS[i % BREAK_SPOTS.length]; a.tx = s.x; a.ty = s.y; goal = "istirahat"; }
      else { a.tx = seat.x; a.ty = seat.y + 0.55; }
      const dx = a.tx - a.x, dy = a.ty - a.y, dist = Math.hypot(dx, dy);
      if (dist > 0.03) { const sp = 1.6 * dt / 1000; a.x += (dx / dist) * Math.min(sp, dist); a.y += (dy / dist) * Math.min(sp, dist); a.mode = "jalan"; }
      else a.mode = goal;
      if (quotaOut && ag && t > a.bubbleUntil) { a.bubble = meta.quota.status === "habis" ? "Kuota habis, ngopi dulu ☕" : "API error, nunggu perintah"; a.bubbleUntil = t + 5000; a.nextChat = t + 12000; }
      else if (a.mode === "rapat" && t > a.nextChat) { a.bubble = ag && ag.status === "kerja" && ag.lastSummary ? ag.lastSummary.slice(0, 38) : MEETING_CHATTER[(i + Math.floor(t / 9000)) % MEETING_CHATTER.length]; a.bubbleUntil = t + 4500; a.nextChat = t + 7000 + Math.random() * 6000; }
      else if (wantWork && ag.lastSummary && t > a.bubbleUntil) { a.bubble = ag.lastSummary.slice(0, 38); a.bubbleUntil = t + 6000; }
      else if (wantBreak && !quotaOut && t > a.nextChat) { a.bubble = CHATTER[(i + Math.floor(t / 10000)) % CHATTER.length]; a.bubbleUntil = t + 4000; a.nextChat = t + 9000 + Math.random() * 6000; }
    });
  }

  function frame(t) {
    const dt = Math.min(100, t - lastFrame); lastFrame = t;
    step(dt, t);
    drawRoom(t);
    const items = [];
    Object.keys(SEATS).forEach((type) => {
      const seat = SEATS[type];
      items.push({ depth: seat.x + seat.y, draw: () => drawDesk(type, seat, agents[type] && agents[type].status === "kerja", t) });
      const a = actors[type]; if (a) items.push({ depth: a.x + a.y + 0.01, draw: () => drawActor(a, type, t) });
    });
    items.push({ depth: MEET_X + MEET_Y / 2, draw: drawGlassX });
    items.push({ depth: (MEET_X + GRID_W) / 2 + MEET_Y, draw: drawGlassY });
    items.push({ depth: 13.85 + 2.7, draw: drawMeetingTable });
    items.push({ depth: 13.5 + 8.6, draw: drawBreakArea });
    items.push({ depth: 0.8 + 9.2, draw: () => plant(0.8, 9.2) });
    items.push({ depth: 9.6 + 0.6, draw: () => plant(9.6, 0.6) });
    items.push({ depth: 16.2 + 9.2, draw: () => plant(16.2, 9.2) });
    items.push({ depth: 16.3 + 0.5, draw: () => plant(16.3, 0.5) });
    items.sort((p, q) => p.depth - q.depth).forEach((it) => it.draw());
    requestAnimationFrame(frame);
  }

  window.office = {
    update(list, rosterIn, metaIn) {
      roster = rosterIn || roster;
      agents = {}; (list || []).forEach((a) => (agents[a.type] = a));
      meta = metaIn || meta;
    },
  };
  requestAnimationFrame(frame);
})();
