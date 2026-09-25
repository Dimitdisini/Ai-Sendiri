// Kantor isometrik Team Dimitri — versi 2.0
// Kanvas 1200×640. Karakter lebih besar, meja lebih jelas, warna lebih warm.
// Menerima data dari app.js lewat window.office.update(agents, roster, meta).
(function () {
  const canvas = document.getElementById("officeCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const W = canvas.width;   // 1200
  const H = canvas.height;  // 640

  // --- Grid isometrik ---
  const TW = 72, TH = 36;
  const GRID_W = 18, GRID_H = 10;
  // Titik asal: tengah atas grid
  const OX = W / 2;
  const OY = 180;

  const WALL_H   = 160;
  const GLASS_H  = 100;
  // Batas ruang rapat (kanan atas) dan break area (kanan bawah)
  const MEET_X   = 11.5;
  const MEET_Y   = 5.5;

  // --- Posisi meja kerja (grid) ---
  const SEATS = {
    "business-analyst": { x: 1.5, y: 1.2 },
    pm:                 { x: 3.8, y: 1.2 },
    analyst:            { x: 6.1, y: 1.2 },
    "ai-engineer":      { x: 8.4, y: 1.2 },
    backend:            { x: 1.5, y: 4.2 },
    frontend:           { x: 3.8, y: 4.2 },
    data:               { x: 6.1, y: 4.2 },
    devops:             { x: 8.4, y: 4.2 },
    qa:                 { x: 2.0, y: 7.4 },
    "chief-of-staff":   { x: 4.6, y: 7.4 },
    orchestrator:       { x: 7.6, y: 7.4 },
  };

  const MEETING_SEATS = [
    { x: 12.2, y: 2.4 }, // kepala meja
    { x: 13.2, y: 1.3 }, { x: 14.4, y: 1.3 }, { x: 15.6, y: 1.3 },
    { x: 13.2, y: 3.7 }, { x: 14.4, y: 3.7 }, { x: 15.6, y: 3.7 },
    { x: 16.8, y: 2.0 }, { x: 16.8, y: 3.2 },
  ];

  const BREAK_SPOTS = [
    { x: 12.6, y: 8.0 }, { x: 13.6, y: 8.0 }, { x: 14.6, y: 8.0 },
    { x: 15.8, y: 7.0 }, { x: 11.6, y: 7.2 }, { x: 12.6, y: 6.8 },
    { x: 13.6, y: 6.8 }, { x: 14.6, y: 6.8 }, { x: 16.4, y: 8.2 },
    { x: 11.4, y: 8.6 }, { x: 15.6, y: 8.4 },
  ];

  const CHATTER = [
    "Ngopi dulu...", "Nunggu keputusan CEO", "Rehat sebentar",
    "QA tadi ketat banget", "Plan berikutnya apa ya?", "Kopi kedua",
  ];
  const MEETING_CHATTER = [
    "Masuk ASUMSI atau BLOKIR?", "Rekomendasiku opsi A",
    "AC-nya harus bisa diuji", "Tanya CEO yang ini", "Setuju, catat di notulen",
  ];

  let roster = {};
  let agents = {};
  let meta   = { roadmapProgress: 0, planCount: 0, qaReports: 0, name: "", meeting: { active: false }, quota: { status: "ok" } };
  const actors = {};
  let lastFrame = performance.now();

  // --- Utilities ---
  function iso(gx, gy) {
    return {
      x: OX + (gx - gy) * (TW / 2),
      y: OY + (gx + gy) * (TH / 2),
    };
  }

  function shade(hex, f) {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, ((n >> 16) & 255) * f);
    const g = Math.min(255, ((n >>  8) & 255) * f);
    const b = Math.min(255,  (n        & 255) * f);
    return `rgb(${r|0},${g|0},${b|0})`;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function diamond(gx, gy, fill, stroke) {
    const p = iso(gx, gy);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + TW / 2, p.y + TH / 2);
    ctx.lineTo(p.x, p.y + TH);
    ctx.lineTo(p.x - TW / 2, p.y + TH / 2);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  function box(gx, gy, w, d, h, color, lift = 0) {
    const a = iso(gx,     gy),     b = iso(gx + w, gy);
    const c = iso(gx + w, gy + d), dd= iso(gx,     gy + d);
    const ly = -h - lift;
    // top face
    ctx.fillStyle = shade(color, 1.1);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + ly); ctx.lineTo(b.x, b.y + ly);
    ctx.lineTo(c.x, c.y + ly); ctx.lineTo(dd.x, dd.y + ly);
    ctx.closePath(); ctx.fill();
    // left face
    ctx.fillStyle = shade(color, 0.78);
    ctx.beginPath();
    ctx.moveTo(dd.x, dd.y + ly); ctx.lineTo(c.x, c.y + ly);
    ctx.lineTo(c.x, c.y - lift); ctx.lineTo(dd.x, dd.y - lift);
    ctx.closePath(); ctx.fill();
    // right face
    ctx.fillStyle = shade(color, 0.62);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + ly); ctx.lineTo(b.x, b.y + ly);
    ctx.lineTo(b.x, b.y - lift); ctx.lineTo(c.x, c.y - lift);
    ctx.closePath(); ctx.fill();
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wallPanel(ax, ay, bx, by, top, bottom, fill, stroke) {
    const p = iso(ax, ay), q = iso(bx, by);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - top);   ctx.lineTo(q.x, q.y - top);
    ctx.lineTo(q.x, q.y - bottom); ctx.lineTo(p.x, p.y - bottom);
    ctx.closePath(); ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // --- Gambar Ruangan ---
  function drawRoom(t) {
    ctx.clearRect(0, 0, W, H);

    const tl = iso(0,       0);
    const tr = iso(GRID_W,  0);
    const bl = iso(0,       GRID_H);

    // Dinding belakang kanan
    ctx.fillStyle = "#ede5d4";
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y - WALL_H);
    ctx.lineTo(tr.x, tr.y - WALL_H);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.closePath(); ctx.fill();

    // Dinding kiri
    ctx.fillStyle = "#e4dccb";
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y - WALL_H);
    ctx.lineTo(bl.x, bl.y - WALL_H);
    ctx.lineTo(bl.x, bl.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.closePath(); ctx.fill();

    // Jendela besar dinding belakang kanan
    for (const x0 of [2.0, 6.2]) {
      wallPanel(x0, 0, x0 + 2.8, 0, 138, 52, "#c8e8f5", "#ffffff88");
      // lis jendela
      const pw = iso(x0, 0), qw = iso(x0 + 2.8, 0);
      ctx.strokeStyle = "#ffffffcc";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lerp(pw.x, qw.x, 0.5), pw.y - 138);
      ctx.lineTo(lerp(pw.x, qw.x, 0.5), pw.y - 52);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pw.x, lerp(pw.y - 138, pw.y - 52, 0.5));
      ctx.lineTo(qw.x, lerp(qw.y - 138, qw.y - 52, 0.5));
      ctx.stroke();
    }

    // Papan Roadmap di dinding kiri
    wallPanel(1.2, 6.2, 1.2, 1.8, 138, 48, "#fffff8", "#b0a898");
    const wb = iso(1.2, 6.2);
    ctx.save();
    ctx.translate(wb.x, wb.y - 138);
    ctx.transform(1, -0.5, 0, 1, 0, 0);
    ctx.fillStyle = "#44403c";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.fillText("Roadmap " + (meta.name || ""), 10, 18);
    // progress bar background
    ctx.fillStyle = "#e8e2d6";
    ctx.fillRect(10, 28, 130, 9);
    // progress bar fill
    ctx.fillStyle = "#6b4f3a";
    ctx.fillRect(10, 28, 1.3 * Math.min(100, meta.roadmapProgress), 9);
    ctx.fillStyle = "#78726a";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText(`${meta.roadmapProgress}%  ·  ${meta.planCount} plan  ·  ${meta.qaReports} QA`, 10, 52);
    ctx.fillStyle = (meta.blokir || 0) > 0 ? "#9b1c1c" : "#3d6b52";
    ctx.fillText(`BLOKIR: ${meta.blokir || 0}`, 10, 67);
    ctx.restore();

    // Papan Ruang Rapat di dinding kiri atas
    wallPanel(13.2, 0, 17.0, 0, 138, 52, "#fffff8", "#b0a898");
    const mb = iso(13.2, 0);
    ctx.save();
    ctx.translate(mb.x, mb.y - 138);
    ctx.transform(1, 0.5, 0, 1, 0, 0);
    ctx.fillStyle = "#44403c";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.fillText("Ruang Rapat", 10, 18);
    ctx.font = "11px -apple-system, sans-serif";
    const rapat = meta.meeting && meta.meeting.active;
    ctx.fillStyle = rapat ? "#9b1c1c" : "#78726a";
    ctx.fillText(rapat ? ("● " + (meta.meeting.title || "Sedang rapat")) : "○ Kosong", 10, 38, 128);
    if (rapat && meta.meeting.participants) {
      ctx.fillStyle = "#44403c";
      ctx.fillText(`${meta.meeting.participants.length} peserta`, 10, 54);
    }
    ctx.restore();

    // Jam dinding
    const ck = iso(GRID_W - 0.8, 0);
    ctx.fillStyle = "#fffff8";
    ctx.beginPath(); ctx.arc(ck.x, ck.y - 118, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#b0a898"; ctx.lineWidth = 1.5; ctx.stroke();
    const now = new Date();
    const hh = now.getHours() % 12, mm = now.getMinutes();
    const hAngle = (hh + mm / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const mAngle = mm / 60 * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = "#44403c"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(ck.x, ck.y - 118); ctx.lineTo(ck.x + 8 * Math.cos(hAngle), ck.y - 118 + 8 * Math.sin(hAngle)); ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(ck.x, ck.y - 118); ctx.lineTo(ck.x + 12 * Math.cos(mAngle), ck.y - 118 + 12 * Math.sin(mAngle)); ctx.stroke();
    ctx.lineCap = "butt";

    // Lantai
    for (let gy = 0; gy < GRID_H; gy++) {
      for (let gx = 0; gx < GRID_W; gx++) {
        const inMeet  = gx >= MEET_X && gy <  MEET_Y;
        const inBreak = gx >= MEET_X && gy >= MEET_Y;
        let fill, stroke;
        if (inMeet) {
          fill   = (gx + gy) % 2 ? "#dcd6ee" : "#d0c9e4";
          stroke = "#c8c0dc";
        } else if (inBreak) {
          fill   = (gx + gy) % 2 ? "#cad8c0" : "#bed0b2";
          stroke = "#b2c6a8";
        } else {
          fill   = (gx + gy) % 2 ? "#e9d9b8" : "#e0ce9e";
          stroke = "#d4be8a";
        }
        diamond(gx, gy, fill, stroke);
      }
    }
  }

  // Dinding kaca ruang rapat
  function drawGlassX() {
    wallPanel(MEET_X, 0, MEET_X, MEET_Y - 1.0, GLASS_H, 0, "rgba(180,220,248,0.28)", "rgba(255,255,255,0.85)");
  }
  function drawGlassY() {
    wallPanel(MEET_X, MEET_Y, GRID_W, MEET_Y, GLASS_H, 0, "rgba(180,220,248,0.28)", "rgba(255,255,255,0.85)");
  }

  // Meja kerja
  function drawDesk(type, seat, working, t) {
    const big = type === "orchestrator";
    const w = big ? 1.8 : 1.3, d = 0.75;
    // Meja kayu warm
    box(seat.x - w / 2, seat.y - d / 2, w, d, 24, "#c4956a");
    const m = iso(seat.x, seat.y - 0.1);
    // Monitor
    ctx.fillStyle = "#2c2826";
    ctx.fillRect(m.x - 16, m.y - 52, 32, 20);
    ctx.fillStyle = working ? (Math.sin(t / 200) > 0.2 ? "#7ed4fb" : "#5bb8e8") : "#3d3632";
    ctx.fillRect(m.x - 14, m.y - 50, 28, 16);
    // Stand monitor
    ctx.fillStyle = "#2c2826";
    ctx.fillRect(m.x - 2, m.y - 32, 4, 7);
    // Keyboard kecil
    ctx.fillStyle = "#4a403a";
    ctx.fillRect(m.x - 12, m.y - 26, 24, 6);

    // Monitor kedua untuk Orkestrator
    if (big) {
      ctx.fillStyle = "#2c2826";
      ctx.fillRect(m.x + 20, m.y - 50, 24, 18);
      ctx.fillStyle = working ? "#a5f3fc" : "#3d3632";
      ctx.fillRect(m.x + 22, m.y - 48, 20, 14);
    }

    // Label nama peran di bawah meja
    const label = (roster[type] && roster[type].role) || type;
    ctx.font = "bold 10px -apple-system, sans-serif";
    const tw = ctx.measureText(label).width + 12;
    const lp = iso(seat.x, seat.y + d / 2 + 0.1);
    ctx.fillStyle = "#1a1814cc";
    rr(lp.x - tw / 2, lp.y - 16, tw, 12, 4);
    ctx.fill();
    ctx.fillStyle = "#f7f4ef";
    ctx.fillText(label, lp.x - tw / 2 + 6, lp.y - 7);
  }

  // Meja rapat
  function drawMeetingTable() {
    box(12.6, 2.1, 3.8, 1.4, 22, "#9c7a5a");
    // Kursi rapat
    for (const s of MEETING_SEATS.slice(0, 7)) {
      box(s.x - 0.22, s.y - 0.22, 0.44, 0.44, 10, "#5a4f48");
    }
    // Gelas di meja
    const g1 = iso(13.5, 2.8);
    ctx.fillStyle = "#e8e2d6"; ctx.fillRect(g1.x - 3, g1.y - 30, 6, 9);
    ctx.fillStyle = "#b8d4e8"; ctx.fillRect(g1.x - 2, g1.y - 29, 4, 4);
  }

  // Sudut break
  function drawBreakArea() {
    // Sofa/kursi
    box(12.2, 8.5, 3.2, 0.8, 16, "#7a8fa8");
    box(12.2, 8.4, 3.2, 0.2, 34, "#6a7f98", 0);
    // Meja kopi
    box(15.8, 6.8, 0.8, 0.8, 28, "#9c7a5a");
    box(15.9, 6.9, 0.6, 0.6, 14, "#3d3632", 28);
    // Tanaman sudut
    plant(11.2, 9.4);
  }

  // Tanaman
  function plant(gx, gy) {
    box(gx, gy, 0.5, 0.5, 14, "#8c6d1f");
    const p = iso(gx + 0.25, gy + 0.25);
    ctx.fillStyle = "#3d6b52";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(
        p.x + Math.cos(i * 1.05) * 9,
        p.y - 22 + Math.sin(i * 1.05) * 4,
        10, 6, i * 0.5, 0, Math.PI * 2
      );
      ctx.fill();
    }
    // Batang
    ctx.fillStyle = "#5a8a5a";
    ctx.fillRect(p.x - 1, p.y - 14, 2, 8);
  }

  // Karakter agen
  function drawActor(a, type, t) {
    const info = roster[type] || { color: "#78726a", nickname: type, role: type };
    const color = info.color || "#78726a";
    const p = iso(a.x, a.y);

    // Animasi bob
    const bob = a.mode === "kerja"
      ? Math.sin(t / 140) * 2
      : a.mode === "jalan"
        ? Math.abs(Math.sin(t / 90)) * 4
        : 0;

    // Bayangan
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 16, 14, 5, 0, 0, Math.PI * 2); ctx.fill();

    const seated  = a.mode === "kerja" || a.mode === "diam" || a.mode === "rapat";
    const bodyH   = seated ? 18 : 24;

    // Badan
    ctx.fillStyle = a.active ? color : "#a89e94";
    rr(p.x - 10, p.y - bodyH - bob, 20, bodyH + 4, 6);
    ctx.fill();

    // Lengan kerja (mengetik)
    if (a.mode === "kerja") {
      ctx.fillStyle = "#f0d5b8";
      const armY = p.y - 14 - bob;
      ctx.fillRect(p.x - 14, armY + Math.sin(t / 90) * 2, 6, 5);
      ctx.fillRect(p.x + 8,  armY - Math.sin(t / 90) * 2, 6, 5);
    }

    // Cangkir kopi (istirahat)
    if (a.mode === "istirahat") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(p.x + 9, p.y - 16, 7, 9);
      ctx.fillStyle = "#7c5c38";
      ctx.fillRect(p.x + 10, p.y - 15, 5, 3);
    }

    // Laptop (rapat)
    if (a.mode === "rapat") {
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(p.x - 14, p.y - 14, 8, 10);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(p.x - 13, p.y - 12, 6, 1);
      ctx.fillRect(p.x - 13, p.y - 10, 6, 1);
    }

    // Kepala
    ctx.fillStyle = "#f0d5b8";
    rr(p.x - 9, p.y - bodyH - 18 - bob, 18, 17, 6);
    ctx.fill();

    // Rambut
    ctx.fillStyle = "#2c2826";
    rr(p.x - 9, p.y - bodyH - 18 - bob, 18, 7, 4);
    ctx.fill();

    // Mata
    ctx.fillStyle = "#1a1814";
    ctx.fillRect(p.x - 5, p.y - bodyH - 9 - bob, 2, 2);
    ctx.fillRect(p.x + 3, p.y - bodyH - 9 - bob, 2, 2);

    // Label nama
    const nm = (info.nickname || type);
    ctx.font = "bold 11px -apple-system, sans-serif";
    const tw = ctx.measureText(nm).width + 14;
    const ly = p.y - bodyH - 38 - bob;
    ctx.fillStyle = a.active ? color : "#a89e94";
    rr(p.x - tw / 2, ly, tw, 16, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(nm, p.x - tw / 2 + 7, ly + 11);

    // Gelembung chat
    if (a.bubble && t < a.bubbleUntil) {
      ctx.font = "10px -apple-system, sans-serif";
      const bw = Math.min(190, ctx.measureText(a.bubble).width + 16);
      const bx = p.x - bw / 2;
      const by = p.y - bodyH - 66 - bob;
      ctx.fillStyle = "#fffff8";
      rr(bx, by, bw, 20, 8); ctx.fill();
      ctx.strokeStyle = "#e8e2d6"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#44403c";
      ctx.fillText(a.bubble, bx + 8, by + 14, bw - 16);
      // Ekor gelembung
      ctx.fillStyle = "#fffff8";
      ctx.beginPath();
      ctx.moveTo(p.x - 4, by + 20);
      ctx.lineTo(p.x + 4, by + 20);
      ctx.lineTo(p.x, by + 26);
      ctx.closePath(); ctx.fill();
    }
  }

  // --- Logic pergerakan aktor ---
  function step(dt, t) {
    const quotaOut  = meta.quota && meta.quota.status !== "ok";
    const meeting   = meta.meeting && meta.meeting.active ? meta.meeting : null;
    const participants = meeting ? (meeting.participants || []) : [];

    Object.keys(SEATS).forEach((type, i) => {
      const seat = SEATS[type];
      if (!actors[type]) {
        actors[type] = {
          x: seat.x, y: seat.y + 0.6,
          tx: seat.x, ty: seat.y + 0.6,
          mode: "diam", bubble: "", bubbleUntil: 0,
          active: false,
          nextChat: t + 3000 + i * 1200,
        };
      }
      const a  = actors[type];
      const ag = agents[type];
      a.active = !!ag;

      const inMeeting = !quotaOut && meeting && participants.includes(type);
      const wantWork  = !quotaOut && !inMeeting && ag && ag.status === "kerja";
      const wantBreak = ag && (ag.status === "istirahat" || quotaOut) && !inMeeting;
      let goal = "diam";

      if (inMeeting) {
        const si = MEETING_SEATS[Math.min(participants.indexOf(type), MEETING_SEATS.length - 1)];
        a.tx = si.x; a.ty = si.y; goal = "rapat";
      } else if (wantWork) {
        a.tx = seat.x; a.ty = seat.y + 0.6; goal = "kerja";
      } else if (wantBreak) {
        const bs = BREAK_SPOTS[i % BREAK_SPOTS.length];
        a.tx = bs.x; a.ty = bs.y; goal = "istirahat";
      } else {
        a.tx = seat.x; a.ty = seat.y + 0.6;
      }

      const dx = a.tx - a.x, dy = a.ty - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.04) {
        const sp = 1.8 * dt / 1000;
        a.x += (dx / dist) * Math.min(sp, dist);
        a.y += (dy / dist) * Math.min(sp, dist);
        a.mode = "jalan";
      } else {
        a.mode = goal;
      }

      // Gelembung teks
      if (quotaOut && ag && t > a.bubbleUntil) {
        a.bubble = "Kuota habis, ngopi dulu...";
        a.bubbleUntil = t + 5000; a.nextChat = t + 12000;
      } else if (a.mode === "rapat" && t > a.nextChat) {
        a.bubble = (ag && ag.status === "kerja" && ag.lastSummary)
          ? ag.lastSummary.slice(0, 36)
          : MEETING_CHATTER[(i + Math.floor(t / 9000)) % MEETING_CHATTER.length];
        a.bubbleUntil = t + 4500; a.nextChat = t + 7000 + Math.random() * 5000;
      } else if (wantWork && ag.lastSummary && t > a.bubbleUntil) {
        a.bubble = ag.lastSummary.slice(0, 36);
        a.bubbleUntil = t + 6000;
      } else if (wantBreak && !quotaOut && t > a.nextChat) {
        a.bubble = CHATTER[(i + Math.floor(t / 10000)) % CHATTER.length];
        a.bubbleUntil = t + 4000; a.nextChat = t + 9000 + Math.random() * 5000;
      }
    });
  }

  // --- Frame utama ---
  function frame(t) {
    const dt = Math.min(100, t - lastFrame);
    lastFrame = t;
    step(dt, t);
    drawRoom(t);

    // Kumpulkan semua objek, sort by depth (painter's algorithm)
    const items = [];
    Object.keys(SEATS).forEach((type) => {
      const seat = SEATS[type];
      const working = agents[type] && agents[type].status === "kerja";
      items.push({ depth: seat.x + seat.y, draw: () => drawDesk(type, seat, working, t) });
      const a = actors[type];
      if (a) items.push({ depth: a.x + a.y + 0.01, draw: () => drawActor(a, type, t) });
    });

    items.push({ depth: MEET_X + MEET_Y / 2,         draw: drawGlassX });
    items.push({ depth: (MEET_X + GRID_W) / 2 + MEET_Y, draw: drawGlassY });
    items.push({ depth: 14.5 + 2.8,                  draw: drawMeetingTable });
    items.push({ depth: 14.0 + 8.5,                  draw: drawBreakArea });
    items.push({ depth: 0.6  + 9.4,                  draw: () => plant(0.6, 9.4) });
    items.push({ depth: 10.0 + 0.6,                  draw: () => plant(10.0, 0.6) });
    items.push({ depth: 17.0 + 9.4,                  draw: () => plant(17.0, 9.4) });
    items.push({ depth: 17.0 + 0.4,                  draw: () => plant(17.0, 0.4) });

    items.sort((p, q) => p.depth - q.depth).forEach((it) => it.draw());

    requestAnimationFrame(frame);
  }

  // --- API publik ---
  window.office = {
    update(list, rosterIn, metaIn) {
      window.office._last = [list, rosterIn, metaIn];
      roster = rosterIn || roster;
      agents = {};
      (list || []).forEach((a) => (agents[a.type] = a));
      meta = metaIn || meta;
    },
  };

  requestAnimationFrame(frame);
})();
