// Kantor isometrik Team Dimitri — Unified Multi-Disciplinary Studios
// 1 Gedung Terpadu: Executive Boardroom, Software Lab, & 3D Hardware Studio
(function () {
  const canvas = document.getElementById("officeCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const W = canvas.width;   // 1200
  const H = canvas.height;  // 640

  // --- Grid isometrik ---
  const TW = 72, TH = 36;
  const GRID_W = 18, GRID_H = 10;
  const OX = W / 2;
  const OY = 180;

  const WALL_H   = 160;
  const GLASS_H  = 100;
  const MEET_X   = 11.5;
  const MEET_Y   = 5.5;

  // --- Posisi meja kerja dinamis per peran ---
  const SEATS = {
    orchestrator: { x: 8.5, y: 7.2, room: "boardroom" },
    architect:    { x: 3.5, y: 2.2, room: "software-lab" },
    maker3d:      { x: 3.5, y: 7.2, room: "maker-lab" }
  };

  const MEETING_SEATS = [
    { x: 12.2, y: 2.4 },
    { x: 13.2, y: 1.3 }, { x: 14.4, y: 1.3 }, { x: 15.6, y: 1.3 },
    { x: 13.2, y: 3.7 }, { x: 14.4, y: 3.7 }, { x: 15.6, y: 3.7 },
    { x: 16.8, y: 2.0 }, { x: 16.8, y: 3.2 },
  ];

  const BREAK_SPOTS = [
    { x: 12.6, y: 8.0 }, { x: 13.6, y: 8.0 }, { x: 14.6, y: 8.0 },
    { x: 15.8, y: 7.0 }, { x: 11.6, y: 7.2 }, { x: 12.6, y: 6.8 },
  ];

  // Obrolan dinamis sesuai Soul agen
  const SOUL_CHATTER = {
    orchestrator: [
      "Jadwal & milestone on-track.",
      "Kopi hitam dulu sambil cek checklist.",
      "Izin lapor, 1 blocker menunggu CEO.",
      "Simpan dokumen final ke Google Drive.",
      "Format ke CEO maks 10 baris."
    ],
    architect: [
      "Arsitektur modular siap di-scale.",
      "Hindari over-engineering, buat simpel.",
      "Lagi review schema database SaaS.",
      "Cek integrasi backend telemetry.",
      "Teh pekat biar fokus debugging."
    ],
    maker3d: [
      "Overhang 45° aman, minim support.",
      "Toleransi snap-fit 0.35mm presisi.",
      "Ganti spool filamen PLA matte pastel.",
      "Nozzle 0.4mm Bambu Lab jalan mulus.",
      "Hitung estimasi: 38 gram, Rp 19.000."
    ]
  };

  const MEETING_CHATTER = [
    "Masuk ASUMSI atau butuh BLOKIR CEO?",
    "Rekomendasi teknis kita opsi A.",
    "Pastikan acceptance criteria teruji.",
    "Sinkronkan ke folder Drive yang tepat.",
    "Catat di notulen executive."
  ];

  let roster = {};
  let agents = {};
  let meta   = { roadmapProgress: 0, planCount: 0, qaReports: 0, name: "", meeting: { active: false }, quota: { status: "ok" } };
  const actors = {};
  let lastFrame = performance.now();

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
    ctx.fillStyle = shade(color, 1.1);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + ly); ctx.lineTo(b.x, b.y + ly);
    ctx.lineTo(c.x, c.y + ly); ctx.lineTo(dd.x, dd.y + ly);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = shade(color, 0.78);
    ctx.beginPath();
    ctx.moveTo(dd.x, dd.y + ly); ctx.lineTo(c.x, c.y + ly);
    ctx.lineTo(c.x, c.y - lift); ctx.lineTo(dd.x, dd.y - lift);
    ctx.closePath(); ctx.fill();

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

  // --- Gambar Ruangan Terpadu ---
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

    // Jendela besar di Software Lab
    wallPanel(1.5, 0, 4.5, 0, 138, 52, "#c8e8f5", "#ffffff88");
    // Jendela di Executive Area
    wallPanel(7.0, 0, 10.0, 0, 138, 52, "#c8e8f5", "#ffffff88");

    // Papan Roadmap di dinding kiri
    wallPanel(0.8, 4.8, 0.8, 1.2, 138, 48, "#fffff8", "#b0a898");
    const wb = iso(0.8, 4.8);
    ctx.save();
    ctx.translate(wb.x, wb.y - 138);
    ctx.transform(1, -0.5, 0, 1, 0, 0);
    ctx.fillStyle = "#44403c";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.fillText("Team Dimitri HQ", 10, 18);
    ctx.fillStyle = "#e8e2d6";
    ctx.fillRect(10, 28, 130, 9);
    ctx.fillStyle = "#6b4f3a";
    ctx.fillRect(10, 28, 1.3 * Math.min(100, meta.roadmapProgress), 9);
    ctx.fillStyle = "#78726a";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText(`${meta.roadmapProgress}% · Unified Studios`, 10, 52);
    ctx.restore();

    // Papan Ruang Rapat
    wallPanel(13.2, 0, 17.0, 0, 138, 52, "#fffff8", "#b0a898");
    const mb = iso(13.2, 0);
    ctx.save();
    ctx.translate(mb.x, mb.y - 138);
    ctx.transform(1, 0.5, 0, 1, 0, 0);
    ctx.fillStyle = "#44403c";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.fillText("Executive Boardroom", 10, 18);
    ctx.font = "11px -apple-system, sans-serif";
    const rapat = meta.meeting && meta.meeting.active;
    ctx.fillStyle = rapat ? "#9b1c1c" : "#78726a";
    ctx.fillText(rapat ? ("● " + (meta.meeting.title || "Sedang Rapat")) : "○ Ready", 10, 38, 128);
    ctx.restore();

    // Lantai dengan zona warna:
    // - Software Lab (Kiri Atas): Biru slate lembut
    // - 3D Studio (Kiri Bawah): Amber/kayu hangat
    // - Executive & Boardroom (Kanan): Netral / lavender lembut
    for (let gy = 0; gy < GRID_H; gy++) {
      for (let gx = 0; gx < GRID_W; gx++) {
        const inMeet  = gx >= MEET_X && gy <  MEET_Y;
        const in3D    = gx <  MEET_X && gy >= 5.0;
        const inSoft  = gx <  MEET_X && gy <  5.0;
        let fill, stroke;

        if (inMeet) {
          fill   = (gx + gy) % 2 ? "#dcd6ee" : "#d0c9e4";
          stroke = "#c8c0dc";
        } else if (in3D) {
          fill   = (gx + gy) % 2 ? "#f3e5d0" : "#ebd9bf";
          stroke = "#dfcaa8";
        } else if (inSoft) {
          fill   = (gx + gy) % 2 ? "#e2eaf0" : "#d5e0e8";
          stroke = "#c6d4de";
        } else {
          fill   = (gx + gy) % 2 ? "#e9d9b8" : "#e0ce9e";
          stroke = "#d4be8a";
        }
        diamond(gx, gy, fill, stroke);
      }
    }

    // Label Studio di Lantai
    drawFloorLabel(2.5, 1.0, "💻 Software & Analytics Lab", "#475569");
    drawFloorLabel(2.5, 6.0, "🖨️ 3D & Hardware Studio", "#92400e");
    drawFloorLabel(9.0, 6.0, "🏛️ Executive Desk", "#5b21b6");
  }

  function drawFloorLabel(gx, gy, text, color) {
    const p = iso(gx, gy);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.transform(1, 0.5, -1, 0.5, 0, 0);
    ctx.fillStyle = color;
    ctx.font = "bold 11px -apple-system, sans-serif";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function drawGlassX() {
    wallPanel(MEET_X, 0, MEET_X, MEET_Y - 1.0, GLASS_H, 0, "rgba(180,220,248,0.28)", "rgba(255,255,255,0.85)");
  }
  function drawGlassY() {
    wallPanel(MEET_X, MEET_Y, GRID_W, MEET_Y, GLASS_H, 0, "rgba(180,220,248,0.28)", "rgba(255,255,255,0.85)");
  }

  // Meja Kerja Khusus
  function drawDesk(type, seat, working, t) {
    const is3D = type === "maker3d";
    const isBoss = type === "orchestrator";
    const w = isBoss ? 1.8 : 1.4, d = 0.8;
    const tableColor = is3D ? "#a77148" : isBoss ? "#5c4033" : "#6f8294";

    box(seat.x - w / 2, seat.y - d / 2, w, d, 24, tableColor);
    const m = iso(seat.x, seat.y - 0.1);

    // Kalau di Studio 3D (Reno): Ada Printer 3D di samping meja!
    if (is3D) {
      // 3D Printer Bambu Lab mini
      box(seat.x + 0.8, seat.y - 0.2, 0.6, 0.6, 26, "#1e293b"); // Chasis
      const pp = iso(seat.x + 1.1, seat.y + 0.1);
      ctx.fillStyle = "#38bdf8"; // Layar printer
      ctx.fillRect(pp.x - 6, pp.y - 48, 12, 6);
      // Spool filamen jingga di atas
      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.arc(pp.x, pp.y - 56, 5, 0, Math.PI * 2); ctx.fill();
    }

    // Monitor Komputer
    ctx.fillStyle = "#2c2826";
    ctx.fillRect(m.x - 14, m.y - 52, 28, 18);
    ctx.fillStyle = working ? (Math.sin(t / 200) > 0.2 ? "#7ed4fb" : "#5bb8e8") : "#3d3632";
    ctx.fillRect(m.x - 12, m.y - 50, 24, 14);

    if (isBoss) {
      // Monitor kedua untuk Kai
      ctx.fillStyle = "#2c2826";
      ctx.fillRect(m.x + 18, m.y - 50, 22, 16);
      ctx.fillStyle = working ? "#a5f3fc" : "#3d3632";
      ctx.fillRect(m.x + 20, m.y - 48, 18, 12);
    }

    // Label peran
    const label = (roster[type] && roster[type].nickname) || type;
    ctx.font = "bold 10px -apple-system, sans-serif";
    const tw = ctx.measureText(label).width + 12;
    const lp = iso(seat.x, seat.y + d / 2 + 0.1);
    ctx.fillStyle = "#1a1814cc";
    rr(lp.x - tw / 2, lp.y - 16, tw, 12, 4);
    ctx.fill();
    ctx.fillStyle = "#f7f4ef";
    ctx.fillText(label, lp.x - tw / 2 + 6, lp.y - 7);
  }

  function drawMeetingTable() {
    box(12.6, 2.1, 3.8, 1.4, 22, "#9c7a5a");
    for (const s of MEETING_SEATS.slice(0, 6)) {
      box(s.x - 0.22, s.y - 0.22, 0.44, 0.44, 10, "#5a4f48");
    }
  }

  function drawBreakArea() {
    box(12.2, 8.5, 3.2, 0.8, 16, "#7a8fa8");
    box(15.8, 6.8, 0.8, 0.8, 28, "#9c7a5a");
  }

  function plant(gx, gy) {
    box(gx, gy, 0.5, 0.5, 14, "#8c6d1f");
    const p = iso(gx + 0.25, gy + 0.25);
    ctx.fillStyle = "#3d6b52";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(p.x + Math.cos(i * 1.05) * 9, p.y - 22 + Math.sin(i * 1.05) * 4, 10, 6, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawActor(a, type, t) {
    const info = roster[type] || { color: "#78726a", nickname: type, role: type };
    const color = info.color || "#78726a";
    const p = iso(a.x, a.y);

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

    // Lengan
    if (a.mode === "kerja") {
      ctx.fillStyle = "#f0d5b8";
      const armY = p.y - 14 - bob;
      ctx.fillRect(p.x - 14, armY + Math.sin(t / 90) * 2, 6, 5);
      ctx.fillRect(p.x + 8,  armY - Math.sin(t / 90) * 2, 6, 5);
    }

    // Kepala
    ctx.fillStyle = "#f0d5b8";
    rr(p.x - 9, p.y - bodyH - 18 - bob, 18, 17, 6);
    ctx.fill();

    // Rambut
    ctx.fillStyle = type === "maker3d" ? "#92400e" : type === "orchestrator" ? "#1e293b" : "#334155";
    rr(p.x - 9, p.y - bodyH - 18 - bob, 18, 7, 4);
    ctx.fill();

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
      const bw = Math.min(210, ctx.measureText(a.bubble).width + 16);
      const bx = p.x - bw / 2;
      const by = p.y - bodyH - 66 - bob;
      ctx.fillStyle = "#fffff8";
      rr(bx, by, bw, 20, 8); ctx.fill();
      ctx.strokeStyle = "#e8e2d6"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#44403c";
      ctx.fillText(a.bubble, bx + 8, by + 14, bw - 16);
    }
  }

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
          nextChat: t + 2500 + i * 1500,
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

      // Dialog Soul
      const chList = SOUL_CHATTER[type] || SOUL_CHATTER.orchestrator;
      if (a.mode === "rapat" && t > a.nextChat) {
        a.bubble = (ag && ag.status === "kerja" && ag.lastSummary)
          ? ag.lastSummary.slice(0, 36)
          : MEETING_CHATTER[Math.floor(Math.random() * MEETING_CHATTER.length)];
        a.bubbleUntil = t + 4500; a.nextChat = t + 7000 + Math.random() * 5000;
      } else if (wantWork && ag.lastSummary && t > a.bubbleUntil) {
        a.bubble = ag.lastSummary.slice(0, 36);
        a.bubbleUntil = t + 6000;
      } else if (t > a.nextChat) {
        a.bubble = chList[Math.floor(Math.random() * chList.length)];
        a.bubbleUntil = t + 4000; a.nextChat = t + 9000 + Math.random() * 6000;
      }
    });
  }

  function frame(t) {
    const dt = Math.min(100, t - lastFrame);
    lastFrame = t;
    step(dt, t);
    drawRoom(t);

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

    items.sort((p, q) => p.depth - q.depth).forEach((it) => it.draw());

    requestAnimationFrame(frame);
  }

  window.office = {
    update(list, rosterIn, metaIn) {
      roster = rosterIn || roster;
      agents = {};
      (list || []).forEach((a) => (agents[a.type] = a));
      meta = metaIn || meta;
    },
  };

  requestAnimationFrame(frame);
})();
