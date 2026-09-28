// Kantor 3D Team Dimitri — v2 "interior sungguhan".
// Semua benda dan orang dibangun prosedural dengan ukuran nyata (meter), tanpa file model,
// supaya posisi, arah, dan tinggi duduk bisa dikendalikan presisi.
// API tetap: window.office.update(agents, roster, meta). Debug: window.office3d.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const container = document.getElementById("office3d");
const legacyCanvas = document.getElementById("officeCanvas");
if (!container) throw new Error("#office3d tidak ada");
const STUDIO = !!window.OFFICE_STUDIO;

// =====================================================================
// RUANG: x -9..9 (kanan = dinding kanan), z -6..6 (belakang = dinding jendela)
// =====================================================================
const X0 = -9, X1 = 9, Z0 = -6, Z1 = 6, WALL_H = 3.0, WALL_T = 0.16;
const fwd = (ry) => ({ x: Math.sin(ry), z: Math.cos(ry) }); // arah hadap orang/kursi pada rotasi ry

// =====================================================================
// SCENE / RENDERER / KAMERA
// =====================================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(27, 16 / 9, 0.1, 200);
const CAM_HOME = new THREE.Vector3(-18.5, 19.5, 20.5);
camera.position.copy(CAM_HOME);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
Object.assign(labelRenderer.domElement.style, { position: "absolute", top: "0", left: "0", pointerEvents: "none" });
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.3, 0, 0.3);
controls.enablePan = false;
controls.enableDamping = true;
controls.minDistance = 10; controls.maxDistance = 42;
controls.minPolarAngle = 0.45; controls.maxPolarAngle = 1.2;
controls.minAzimuthAngle = -1.45; controls.maxAzimuthAngle = -0.05;

function resize() {
  const w = container.clientWidth || 900;
  const h = STUDIO ? container.clientHeight || window.innerHeight : Math.round(w * 0.56);
  if (!STUDIO) container.style.height = h + "px";
  container.classList.toggle("o3d-compact", w < 1100); container.classList.toggle("o3d-tiny", w < 760);
  renderer.setSize(w, h); labelRenderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
// Kontainer bisa berubah ukuran bukan cuma karena window resize (mis. layout kolom berubah,
// sidebar disembunyikan, konten sebelahnya selesai dimuat) — pantau langsung ukurannya sendiri.
let resizeRaf = null;
new ResizeObserver(() => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(resize);
}).observe(container);

// =====================================================================
// MATERIAL & GEOMETRI BANTU
// =====================================================================
const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + "|" + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts }));
  return matCache.get(key);
}
const M = {
  walnut: mat(0x5a3b28, { roughness: 0.55 }),
  oak: mat(0x9c7350, { roughness: 0.6 }),
  black: mat(0x1c1e23, { roughness: 0.45, metalness: 0.35 }),
  charcoal: mat(0x2b2e35, { roughness: 0.85 }),
  steel: mat(0xaeb5bf, { roughness: 0.28, metalness: 0.85 }),
  white: mat(0xefede8, { roughness: 0.55 }),
  stone: mat(0xd8d4cc, { roughness: 0.35 }),
  leafA: mat(0x2e7a47, { roughness: 0.9, flatShading: true }),
  leafB: mat(0x46a35f, { roughness: 0.9, flatShading: true }),
  pot: mat(0x34363c, { roughness: 0.8 }),
  terracotta: mat(0xb0674a, { roughness: 0.9 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe7f5, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  eye: mat(0x16181d, { roughness: 0.3 }),
};
const geoCache = new Map();
function rbox(w, h, d, r = 0.02) {
  const key = `rb${w}|${h}|${d}|${r}`;
  if (!geoCache.has(key)) geoCache.set(key, new RoundedBoxGeometry(w, h, d, 2, Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001))));
  return geoCache.get(key);
}
function bx(w, h, d) { const k = `b${w}|${h}|${d}`; if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d)); return geoCache.get(k); }
function cyl(rt, rb, h, s = 16) { const k = `c${rt}|${rb}|${h}|${s}`; if (!geoCache.has(k)) geoCache.set(k, new THREE.CylinderGeometry(rt, rb, h, s)); return geoCache.get(k); }
function sph(r, s = 14) { const k = `s${r}|${s}`; if (!geoCache.has(k)) geoCache.set(k, new THREE.SphereGeometry(r, s, Math.max(8, s - 4))); return geoCache.get(k); }
function cap(r, l) { const k = `k${r}|${l}`; if (!geoCache.has(k)) geoCache.set(k, new THREE.CapsuleGeometry(r, l, 4, 10)); return geoCache.get(k); }

function add(parent, geo, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, shadow = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m); return m;
}
function grp(parent, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || scene).add(g); return g;
}
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// =====================================================================
// TEKSTUR (lantai, jendela, layar)
// =====================================================================
const floorTex = canvasTex(1024, 1024, (c, w, h) => {
  const r = rng(7), rows = 16, rh = h / rows;
  for (let j = 0; j < rows; j++) {
    let x = -r() * 400;
    while (x < w) {
      const len = 260 + r() * 300, v = 0.85 + r() * 0.25;
      c.fillStyle = `rgb(${(152 * v) | 0},${(108 * v) | 0},${(72 * v) | 0})`;
      c.fillRect(x, j * rh, len, rh);
      c.strokeStyle = "rgba(60,35,20,0.18)"; c.lineWidth = 1;
      for (let g = 0; g < 4; g++) { c.beginPath(); const gy = j * rh + 8 + r() * (rh - 16); c.moveTo(x, gy); c.bezierCurveTo(x + len * 0.3, gy + 4, x + len * 0.6, gy - 4, x + len, gy); c.stroke(); }
      c.fillStyle = "rgba(40,24,14,0.55)"; c.fillRect(x, j * rh, 2, rh);
      x += len;
    }
    c.fillStyle = "rgba(40,24,14,0.6)"; c.fillRect(0, j * rh, w, 2);
  }
}, true);
floorTex.repeat.set(18 / 2.6, 12 / 2.6);

const tileTex = canvasTex(512, 512, (c, w, h) => {
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { c.fillStyle = (i + j) % 2 ? "#dcdad4" : "#eceae5"; c.fillRect(i * 128, j * 128, 128, 128); }
  c.strokeStyle = "#b9b6ae"; c.lineWidth = 3;
  for (let k = 0; k <= 4; k++) { c.beginPath(); c.moveTo(k * 128, 0); c.lineTo(k * 128, h); c.stroke(); c.beginPath(); c.moveTo(0, k * 128); c.lineTo(w, k * 128); c.stroke(); }
}, true);
tileTex.repeat.set(4 / 1.6, 3.4 / 1.6);

const rugTex = canvasTex(512, 384, (c, w, h) => {
  c.fillStyle = "#c9b79c"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#8a6f52"; c.lineWidth = 10; c.strokeRect(22, 22, w - 44, h - 44);
  c.strokeStyle = "#a88a68"; c.lineWidth = 4; c.strokeRect(46, 46, w - 92, h - 92);
  const r = rng(3); for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(90,70,50,${r() * 0.08})`; c.fillRect(r() * w, r() * h, 2, 2); }
});

function skyline(night) {
  return canvasTex(1024, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    if (night) { g.addColorStop(0, "#070d24"); g.addColorStop(0.6, "#1a2352"); g.addColorStop(1, "#2c2a55"); }
    else { g.addColorStop(0, "#7fb8f0"); g.addColorStop(0.7, "#cfe6fb"); g.addColorStop(1, "#eef6fd"); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = rng(night ? 11 : 12);
    if (night) {
      for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; c.fillRect(r() * w, r() * h * 0.45, 1.5, 1.5); }
      c.fillStyle = "#f4f1dc"; c.beginPath(); c.arc(w * 0.82, h * 0.18, 22, 0, Math.PI * 2); c.fill();
    } else {
      c.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < 5; i++) { const cx = r() * w, cy = 40 + r() * 120; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(cx + k * 22, cy + (k % 2) * 6, 20 + r() * 10, 0, Math.PI * 2); c.fill(); } }
    }
    for (const layer of [0, 1]) {
      let x = 0;
      while (x < w) {
        const bw = 40 + r() * 70, bh = (layer ? 160 : 230) + r() * (layer ? 140 : 180);
        c.fillStyle = night ? (layer ? "#141a33" : "#0d1226") : (layer ? "#9fb3c8" : "#7d93aa");
        c.fillRect(x, h - bh, bw - 4, bh);
        for (let wy = h - bh + 10; wy < h - 8; wy += 14) for (let wx = x + 6; wx < x + bw - 12; wx += 11) {
          if (r() < (night ? 0.45 : 0.15)) { c.fillStyle = night ? (r() < 0.8 ? "#ffd98a" : "#bfe4ff") : "#5c7089"; c.fillRect(wx, wy, 6, 8); }
        }
        x += bw;
      }
    }
  });
}
const winNight = skyline(true), winDay = skyline(false);

function screenTex(kind, seed) {
  const r = rng(seed);
  return canvasTex(512, 320, (c, w, h) => {
    if (kind === "code" || kind === "test") {
      c.fillStyle = "#0d1117"; c.fillRect(0, 0, w, h);
      const pal = ["#7dd3fc", "#c4b5fd", "#86efac", "#fca5a5", "#fde68a", "#e5e7eb"];
      for (let y = 10; y < h; y += 16) {
        c.fillStyle = "#3b4252"; c.fillRect(8, y, 14, 6);
        if (kind === "test") { c.fillStyle = r() < 0.85 ? "#4ade80" : "#fbbf24"; c.fillRect(32, y, 8, 8); c.fillStyle = "#cbd5e1"; c.fillRect(46, y + 1, 120 + r() * 220, 5); continue; }
        let x = 32 + ((r() * 4) | 0) * 18;
        const n = 1 + ((r() * 4) | 0);
        for (let k = 0; k < n && x < w - 20; k++) { const tw = 20 + r() * 90; c.fillStyle = pal[(r() * pal.length) | 0]; c.fillRect(x, y, tw, 6); x += tw + 8; }
      }
    } else if (kind === "doc") {
      c.fillStyle = "#f8fafc"; c.fillRect(0, 0, w, h); c.fillStyle = "#e2e8f0"; c.fillRect(0, 0, w, 26);
      c.fillStyle = "#2563eb"; c.fillRect(28, 44, 200, 12);
      for (let y = 70; y < h - 10; y += 14) { c.fillStyle = r() < 0.12 ? "#94a3b8" : "#cbd5e1"; c.fillRect(28, y, 140 + r() * 320, 6); }
    } else if (kind === "chart" || kind === "dash") {
      c.fillStyle = "#0f172a"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#1e293b"; for (let i = 0; i < 3; i++) c.fillRect(16 + i * 164, 14, 150, 50);
      c.fillStyle = "#e2e8f0"; for (let i = 0; i < 3; i++) c.fillRect(28 + i * 164, 30, 50 + r() * 40, 12);
      c.fillStyle = "#1e293b"; c.fillRect(16, 78, 300, 228); c.fillRect(326, 78, 170, 228);
      for (let i = 0; i < 10; i++) { const bh = 30 + r() * 150; c.fillStyle = i % 3 ? "#38bdf8" : "#a78bfa"; c.fillRect(32 + i * 27, 290 - bh, 16, bh); }
      c.strokeStyle = "#4ade80"; c.lineWidth = 3; c.beginPath();
      for (let i = 0; i < 8; i++) { const px = 338 + i * 20, py = 260 - r() * 150; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
    } else if (kind === "lock") {
      const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#0f172a"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(255,255,255,0.75)"; c.font = "bold 44px sans-serif"; c.textAlign = "center"; c.fillText("☕", w / 2, h / 2 - 6);
      c.font = "20px sans-serif"; c.fillText("istirahat", w / 2, h / 2 + 30);
    } else if (kind === "arcade") {
      c.fillStyle = "#050816"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { c.fillStyle = ["#f472b6", "#22d3ee", "#facc15", "#4ade80"][i % 4]; c.fillRect(r() * w, r() * h, 10, 10); }
      c.fillStyle = "#facc15"; c.font = "bold 40px monospace"; c.textAlign = "center"; c.fillText("GAME ON", w / 2, h / 2);
    }
  }, kind === "code" || kind === "test");
}
const lockTex = screenTex("lock", 1);

// =====================================================================
// PETA HALANGAN + A* (orang berjalan di lorong, tidak menembus meja)
// =====================================================================
const CELL = 0.2, GW = Math.round((X1 - X0) / CELL), GH = Math.round((Z1 - Z0) / CELL);
const blocked = new Uint8Array(GW * GH);
function block(xa, za, xb, zb, pad = 0.22) {
  const x0 = Math.min(xa, xb) - pad, x1 = Math.max(xa, xb) + pad, z0 = Math.min(za, zb) - pad, z1 = Math.max(za, zb) + pad;
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const cx = X0 + (i + 0.5) * CELL, cz = Z0 + (j + 0.5) * CELL;
    if (cx >= x0 && cx <= x1 && cz >= z0 && cz <= z1) blocked[j * GW + i] = 1;
  }
}
function blockC(x, z, w, d, pad) { block(x - w / 2, z - d / 2, x + w / 2, z + d / 2, pad); }
const ci = (x) => Math.max(0, Math.min(GW - 1, Math.floor((x - X0) / CELL)));
const cj = (z) => Math.max(0, Math.min(GH - 1, Math.floor((z - Z0) / CELL)));
const isFree = (i, j) => i >= 0 && j >= 0 && i < GW && j < GH && !blocked[j * GW + i];
function nearestFree(i, j) {
  if (isFree(i, j)) return [i, j];
  for (let r = 1; r < 10; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (isFree(i + di, j + dj)) return [i + di, j + dj];
  return [i, j];
}
function astar(sx, sz, gx, gz) {
  const [si, sj] = nearestFree(ci(sx), cj(sz)), [gi, gj] = nearestFree(ci(gx), cj(gz));
  const N = GW * GH, g = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [];
  const push = (n, f) => { heap.push([f, n]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } }
    return top;
  };
  const h = (i, j) => { const dx = Math.abs(i - gi), dz = Math.abs(j - gj); return dx + dz + (1.414 - 2) * Math.min(dx, dz); };
  const s = sj * GW + si, goal = gj * GW + gi;
  g[s] = 0; push(s, h(si, sj));
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  while (heap.length) {
    const [, n] = pop(); if (closed[n]) continue; closed[n] = 1;
    if (n === goal) break;
    const i = n % GW, j = (n / GW) | 0;
    for (const [di, dj, c] of dirs) {
      const ni = i + di, nj = j + dj;
      if (!isFree(ni, nj)) continue;
      if (di && dj && (!isFree(i + di, j) || !isFree(i, j + dj))) continue;
      const nn = nj * GW + ni, ng = g[n] + c;
      if (ng < g[nn]) { g[nn] = ng; came[nn] = n; push(nn, ng + h(ni, nj)); }
    }
  }
  if (came[goal] === -1 && goal !== s) return [[gx, gz]];
  const pts = [];
  for (let n = goal; n !== -1; n = came[n]) pts.push([X0 + ((n % GW) + 0.5) * CELL, Z0 + (((n / GW) | 0) + 0.5) * CELL]);
  pts.reverse();
  const los = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.ceil(d / (CELL * 0.5)); for (let q = 1; q < k; q++) { const t = q / k; if (!isFree(ci(a[0] + (b[0] - a[0]) * t), cj(a[1] + (b[1] - a[1]) * t))) return false; } return true; };
  const out = [pts[0]]; let anchor = 0;
  for (let k = 2; k < pts.length; k++) if (!los(pts[anchor], pts[k])) { out.push(pts[k - 1]); anchor = k - 1; }
  if (pts.length > 1) out.push(pts[pts.length - 1]);
  return out;
}

// =====================================================================
// TITIK (SPOT): meja, kursi rapat, tempat istirahat
// =====================================================================
const SPOTS = {};
function spot(id, x, z, ry, pose, seatH, ax, az) {
  const f = fwd(ry);
  SPOTS[id] = { id, x, z, ry, pose, seatH, ax: ax ?? x - f.x * 0.7, az: az ?? z - f.z * 0.7 };
  return SPOTS[id];
}
// Meja 3 Studio Terpadu Team Dimitri
spot("desk:architect", -5.8, -3.4, Math.PI, "desk", 0.47);    // Ruangan Fleek Project (Software Studio)
spot("desk:maker3d", -5.8, 1.8, Math.PI, "desk", 0.47);       // Ruangan Xavortree (3D & IoT Lab)
spot("desk:orchestrator", 0.5, -0.6, Math.PI, "desk", 0.47);  // Meja Komando Kai (Chief of Staff & Gatekeeper)

const MEET_T = { x: 6.3, z: 3.1 };
const MEET_IDS = ["meet:0"];
spot("meet:0", 8.35, 1.3, -Math.PI / 2, "present", 0, 8.35, 0.95);
[5.2, 6.3, 7.4].forEach((x, i) => { spot(`meet:${1 + i}`, x, 2.05, 0, "meet", 0.47, x, 1.4); MEET_IDS.push(`meet:${1 + i}`); });
[5.2, 6.3, 7.4].forEach((x, i) => { spot(`meet:${4 + i}`, x, 4.15, Math.PI, "meet", 0.47, x, 4.8); MEET_IDS.push(`meet:${4 + i}`); });
spot("meet:7", 4.25, 3.1, Math.PI / 2, "meet", 0.47, 4.2, 1.45); MEET_IDS.push("meet:7");

// Spot Istirahat Bersih: Terpusat di Executive Lounge Tengah & Coffee Bar Pantry
const REST_IDS = [];
const rest = (...a) => { REST_IDS.push(a[0]); return spot(...a); };
rest("rest:sofa1", 0.2, 3.2, 0, "sofa", 0.44, 0.2, 4.0);
rest("rest:sofa2", 0.8, 3.2, 0, "sofa", 0.44, 0.8, 4.0);
rest("rest:sofa3", 1.4, 3.2, 0, "sofa", 0.44, 1.4, 4.0);
rest("rest:coffee", 5.8, -4.75, Math.PI, "mug", 0, 5.8, -4.1);
rest("rest:stool1", 6.35, -3.3, Math.atan2(0.55, -0.45), "stool", 0.74);
rest("rest:stool2", 7.25, -3.3, Math.atan2(-0.55, -0.45), "stool", 0.74);
rest("rest:window", 8.3, -4.0, Math.PI / 2, "mug", 0, 7.65, -4.0);

// =====================================================================
// LAMPU & TEMA
// =====================================================================
const hemi = new THREE.HemisphereLight(0xffffff, 0xcdbf9f, 1.0); scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff1dc, 1.6);
key.position.set(-7, 16, 9); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
Object.assign(key.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 45 });
scene.add(key);
const lamps = [];
function lampLight(x, y, z, intensity = 7, dist = 6, color = 0xffc98a) {
  const l = new THREE.PointLight(color, 0, dist, 2); l.position.set(x, y, z); l.userData.night = intensity; scene.add(l); lamps.push(l); return l;
}
const wallMats = [mat(0xe9e3d8, { roughness: 0.95 }), mat(0xdcd5c8, { roughness: 0.95 })];
const windowMats = [];
const glowMats = [];
function glowMat(color, day = 0.6, night = 1.8) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: day, roughness: 0.4 });
  m.userData = { day, night }; glowMats.push(m); return m;
}
const THEMES = {
  day: { bg: 0xeee8dc, wall: [0xe9e3d8, 0xddd6c9], hemi: [0xffffff, 0xcdbf9f, 1.05], key: 1.7, keyColor: 0xfff1dc, exposure: 1.0, win: winDay, lamp: 0.15 },
  night: { bg: 0x0d1424, wall: [0x4a566b, 0x404b5e], hemi: [0xb4c3e8, 0x3a3140, 0.95], key: 1.15, keyColor: 0xffe6c8, exposure: 1.3, win: winNight, lamp: 1 },
};
let themeChoice = "auto";
try { themeChoice = localStorage.getItem("office3d-theme") || "auto"; } catch { /* abaikan */ }
function currentTheme() { if (themeChoice !== "auto") return themeChoice; const h = new Date().getHours(); return h >= 18 || h < 6 ? "night" : "day"; }
let appliedTheme = null;
function applyTheme() {
  const name = currentTheme(); if (name === appliedTheme) return; appliedTheme = name;
  const T = THEMES[name];
  scene.background = new THREE.Color(T.bg);
  wallMats[0].color.set(T.wall[0]); wallMats[1].color.set(T.wall[1]);
  hemi.color.set(T.hemi[0]); hemi.groundColor.set(T.hemi[1]); hemi.intensity = T.hemi[2];
  key.intensity = T.key; key.color.set(T.keyColor);
  renderer.toneMappingExposure = T.exposure;
  for (const l of lamps) l.intensity = l.userData.night * T.lamp;
  for (const m of windowMats) { m.map = T.win; m.needsUpdate = true; }
  for (const m of glowMats) m.emissiveIntensity = name === "night" ? m.userData.night : m.userData.day;
  document.querySelectorAll(".theme3d button").forEach((b) => b.classList.toggle("on", b.dataset.t === themeChoice));
}

// =====================================================================
// RUANGAN: lantai, dinding, jendela, kaca meeting
// =====================================================================
function floorPlane(x0, z0, x1, z1, material, y = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), material);
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m); return m;
}
function buildRoom() {
  add(scene, bx(X1 - X0 + 0.3, 0.2, Z1 - Z0 + 0.3), mat(0x2a2521), 0, -0.115, 0, 0, 0, 0, false);
  floorPlane(X0, Z0, X1, Z1, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 }));
  floorPlane(5.0, Z0, X1, -2.6, new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.35 }), 0.004);
  floorPlane(3.6, 0.2, X1, Z1, mat(0x4d525c, { roughness: 1 }), 0.004);

  // Karpet Studio Fleek Project (Slate Dark)
  floorPlane(-8.8, -5.8, -2.8, -1.0, mat(0x1e293b, { roughness: 0.85 }), 0.003);
  // Karpet Workshop Xavortree Lab (Deep Moss Slate)
  floorPlane(-8.8, -0.6, -2.8, 5.8, mat(0x13271f, { roughness: 0.85 }), 0.003);
  // Karpet Executive Lounge Tengah
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.4), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0.8, 0.008, 3.4); rug.receiveShadow = true; scene.add(rug);

  // dinding belakang + kanan, plint, list atas
  add(scene, bx(X1 - X0 + WALL_T, WALL_H, WALL_T), wallMats[0], 0, WALL_H / 2, Z0 - WALL_T / 2);
  add(scene, bx(WALL_T, WALL_H, Z1 - Z0 + WALL_T), wallMats[1], X1 + WALL_T / 2, WALL_H / 2, 0);
  add(scene, bx(X1 - X0, 0.1, 0.03), M.charcoal, 0, 0.05, Z0 + 0.015);
  add(scene, bx(0.03, 0.1, Z1 - Z0), M.charcoal, X1 - 0.015, 0.05, 0);
  add(scene, bx(X1 - X0 + WALL_T, 0.06, WALL_T + 0.02), M.charcoal, 0, WALL_H + 0.03, Z0 - WALL_T / 2, 0, 0, 0, false);
  add(scene, bx(WALL_T + 0.02, 0.06, Z1 - Z0 + WALL_T), M.charcoal, X1 + WALL_T / 2, WALL_H + 0.03, 0, 0, 0, 0, false);
  block(X0, Z0, X1, Z0 + 0.05, 0.25); block(X1 - 0.05, Z0, X1, Z1, 0.25);
  block(X0, Z0, X0 + 0.02, Z1, 0.25); block(X0, Z1 - 0.02, X1, Z1, 0.25);

  // jendela kota
  const win = (cx, cy, w, h, onRight) => {
    const m = new THREE.MeshBasicMaterial({ map: winNight, toneMapped: false }); windowMats.push(m);
    const g = grp(scene, onRight ? X1 - 0.01 : cx, cy, onRight ? cx : Z0 + 0.01, onRight ? -Math.PI / 2 : 0);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); pane.position.z = 0.005; g.add(pane);
    const t = 0.06;
    add(g, bx(w + t, t, 0.06), M.black, 0, h / 2, 0.02); add(g, bx(w + t, t, 0.06), M.black, 0, -h / 2, 0.02);
    add(g, bx(t, h, 0.06), M.black, -w / 2, 0, 0.02); add(g, bx(t, h, 0.06), M.black, w / 2, 0, 0.02);
    const n = Math.round(w / 1.1);
    for (let k = 1; k < n; k++) add(g, bx(0.035, h, 0.04), M.black, -w / 2 + (k * w) / n, 0, 0.02);
    add(g, bx(w + 0.14, 0.04, 0.14), M.white, 0, -h / 2 - 0.02, 0.07);
  };
  win(-3.2, 1.95, 3.4, 1.35, false);
  win(0.6, 1.95, 3.4, 1.35, false);
  win(-3.9, 1.9, 1.9, 1.3, true);

  // Dinding kaca pembatas ruangan (bingkai hitam modern minimalis)
  const glassWall = (xa, za, xb, zb) => {
    const len = Math.hypot(xb - xa, zb - za), g = grp(scene, (xa + xb) / 2, 0, (za + zb) / 2, -Math.atan2(zb - za, xb - xa));
    const H = 2.55, n = Math.max(1, Math.round(len / 1.3));
    const pane = new THREE.Mesh(bx(len, H, 0.02), M.glass); pane.position.y = H / 2; g.add(pane);
    for (let k = 0; k <= n; k++) add(g, bx(0.05, H, 0.06), M.black, -len / 2 + (k * len) / n, H / 2, 0);
    add(g, bx(len, 0.05, 0.07), M.black, 0, H, 0); add(g, bx(len, 0.06, 0.07), M.black, 0, 0.03, 0);
    add(g, bx(len, 0.02, 0.025), mat(0xe5e7eb), 0, 1.1, 0.012, 0, 0, 0, false);
    block(xa, za, xb, zb, 0.2);
  };

  // 1. Partisi Kaca Sayap Kiri (Pemisah Studio dari Lorong Utama)
  // Segmen Fleek Studio (belakang)
  glassWall(-2.6, -6.0, -2.6, -2.4);
  add(scene, bx(0.06, 0.05, 1.2), M.black, -2.6, 2.55, -1.8); // Ambang pintu Fleek Studio
  // Segmen Tengah pembatas
  glassWall(-2.6, -1.2, -2.6, 1.2);
  add(scene, bx(0.06, 0.05, 1.2), M.black, -2.6, 2.55, 1.8); // Ambang pintu Xavortree Lab
  // Segmen Xavortree Lab (depan)
  glassWall(-2.6, 2.4, -2.6, 6.0);

  // 1b. Dinding Partisi Pemisah Studio Fleek Project & Xavortree Lab (z = -0.8)
  glassWall(-9.0, -0.8, -2.6, -0.8);

  // 2. Partisi Murni RUANG RAPAT BERSAMA (Executive Boardroom - Sayap Kanan)
  glassWall(3.6, 0.2, 3.6, Z1);
  glassWall(4.8, 0.2, X1, 0.2);
  add(scene, bx(1.2, 0.05, 0.07), M.black, 4.2, 2.55, 0.2); // Ambang pintu geser Ruang Rapat

  // 3. Plang Nama 3D Akrilik Bercahaya untuk Setiap Ruangan
  function roomSign3D(title, subtitle, x, y, z, ry, accentColor) {
    const tex = canvasTex(512, 160, (c, w, h) => {
      c.fillStyle = "#0f172a"; c.fillRect(0, 0, w, h);
      c.strokeStyle = accentColor; c.lineWidth = 6;
      c.strokeRect(6, 6, w - 12, h - 12);
      c.fillStyle = accentColor;
      c.font = "bold 44px -apple-system, sans-serif";
      c.textAlign = "center";
      c.fillText(title, w / 2, 68);
      c.fillStyle = "#cbd5e1";
      c.font = "bold 24px -apple-system, sans-serif";
      c.fillText(subtitle, w / 2, 118);
    });
    const g = grp(scene, x, y, z, ry);
    const matSign = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.58), matSign);
    g.add(mesh);
    add(g, rbox(1.96, 0.64, 0.06, 0.02), M.black, 0, 0, -0.032);
    return g;
  }

  // Plang Studio Fleek Project (Sayap Kiri Belakang)
  roomSign3D("FLEEK PROJECT", "Software & Digital Studio", -2.6, 2.65, -3.4, Math.PI / 2, "#0284c7");

  // Plang Studio Xavortree (Sayap Kiri Depan)
  roomSign3D("XAVORTREE LAB", "3D Printing · IoT · Analytics", -2.6, 2.65, 3.0, Math.PI / 2, "#10b981");

  // Plang Ruang Rapat Bersama (Sayap Kanan Kaca)
  roomSign3D("RUANG RAPAT", "Shared Executive Boardroom", 6.3, 2.7, 0.2, 0, "#c084fc");
}

// =====================================================================
// PERABOT
// =====================================================================
function plant(x, z, size = 1, tall = false) {
  const g = grp(scene, x, 0, z);
  add(g, cyl(0.17 * size, 0.13 * size, 0.34 * size, 18), M.pot, 0, 0.17 * size, 0);
  add(g, cyl(0.16 * size, 0.16 * size, 0.02, 18), mat(0x3b2a20), 0, 0.33 * size, 0, 0, 0, 0, false);
  const r = rng(Math.round(Math.abs(x * 13 + z * 7) * 100) + 1);
  const n = tall ? 9 : 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r(), h = (tall ? 0.55 + r() * 0.75 : 0.35 + r() * 0.25) * size;
    const leaf = add(g, new THREE.IcosahedronGeometry(0.13 * size, 0), i % 2 ? M.leafA : M.leafB, Math.cos(a) * 0.14 * size, 0.34 * size + h, Math.sin(a) * 0.14 * size, r(), r() * 3, r());
    leaf.scale.set(1, 1.6 + r(), 0.6);
    if (tall) add(g, cyl(0.008, 0.008, h, 5), M.leafA, Math.cos(a) * 0.07 * size, 0.34 * size + h / 2, Math.sin(a) * 0.07 * size, 0, 0, Math.cos(a) * 0.3, false);
  }
  block(x, z, x, z, 0.25 * size);
  return g;
}
function floorLamp(x, z) {
  const g = grp(scene, x, 0, z);
  add(g, cyl(0.16, 0.18, 0.03, 20), M.black, 0, 0.015, 0);
  add(g, cyl(0.015, 0.015, 1.55, 8), M.black, 0, 0.8, 0);
  add(g, cyl(0.14, 0.22, 0.26, 20), glowMat(0xfff0d6, 0.15, 0.9), 0, 1.62, 0, 0, 0, 0, false);
  lampLight(x, 1.5, z, 7, 5);
  block(x, z, x, z, 0.2);
}
function pendant(x, z, y = 1.9) {
  add(scene, cyl(0.005, 0.005, WALL_H - y, 4), M.black, x, y + (WALL_H - y) / 2, z, 0, 0, 0, false);
  add(scene, cyl(0.06, 0.2, 0.18, 20), M.black, x, y, z, 0, 0, 0, false);
  add(scene, cyl(0.19, 0.19, 0.01, 20), glowMat(0xffe4b5, 0.2, 2.2), x, y - 0.09, z, 0, 0, 0, false);
  lampLight(x, y - 0.3, z, 6, 4.5);
}
function books(parent, x0, x1, y, z, seed) {
  const r = rng(seed), cols = [0xb91c1c, 0x1d4ed8, 0x15803d, 0xca8a04, 0x6d28d9, 0x0f766e, 0x374151, 0xe5e7eb];
  let x = x0;
  while (x < x1 - 0.03) {
    const w = 0.025 + r() * 0.035, h = 0.18 + r() * 0.1;
    if (r() < 0.12) { x += 0.08; continue; }
    add(parent, bx(w, h, 0.17), mat(cols[(r() * cols.length) | 0], { roughness: 0.8 }), x + w / 2, y + h / 2, z, 0, 0, r() < 0.1 ? 0.2 : 0, false);
    x += w + 0.004;
  }
}

// ---------- meja kerja studio per peran ----------
const DESKS = {};
const SCREEN_KIND = { orchestrator: "dash", architect: "code", maker3d: "test" };
const MONITORS = { orchestrator: 2, architect: 2, maker3d: 2 };
function monitor(parent, x, z, ry, tex, w = 0.56, h = 0.33) {
  const m = grp(parent, x, 0.745, z, ry);
  add(m, rbox(w + 0.03, h + 0.03, 0.03, 0.01), M.black, 0, 0.2 + h / 2, 0);
  const sm = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sm); scr.position.set(0, 0.2 + h / 2, 0.017); m.add(scr);
  add(m, bx(0.04, 0.2, 0.03), M.black, 0, 0.1, -0.04);
  add(m, rbox(0.22, 0.015, 0.16, 0.006), M.black, 0, 0.008, -0.02);
  return { mat: sm, on: tex };
}
function aeronChair(x, z, ry) {
  // Kursi Ergonomis Mesh Herman Miller Aeron (untuk Software Architect / Bima)
  const g = grp(scene, x, 0, z, ry);
  const darkMesh = mat(0x1e2430, { roughness: 0.85 });
  const graphite = mat(0x333b47, { roughness: 0.5, metalness: 0.4 });
  // Kaki bintang 5 aluminium graphite
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    add(g, bx(0.035, 0.025, 0.28), graphite, Math.sin(a) * 0.13, 0.05, Math.cos(a) * 0.13, 0, a, 0);
    add(g, sph(0.025, 8), M.black, Math.sin(a) * 0.27, 0.025, Math.cos(a) * 0.27);
  }
  add(g, cyl(0.025, 0.025, 0.28, 8), M.steel, 0, 0.20, 0); // Tiang hidrolik
  // Dudukan mesh melengkung ergonomis
  add(g, rbox(0.48, 0.05, 0.48, 0.04), graphite, 0, 0.41, 0.02);
  add(g, rbox(0.40, 0.02, 0.42, 0.03), darkMesh, 0, 0.44, 0.02);
  // Sandaran punggung mesh dengan PostureFit Lumbar Support (bentuk Y di belakang)
  const back = grp(g, 0, 0.43, -0.21); back.rotation.x = -0.10;
  add(back, rbox(0.46, 0.56, 0.04, 0.03), graphite, 0, 0.32, 0);
  add(back, rbox(0.38, 0.50, 0.015, 0.02), darkMesh, 0, 0.32, 0.018);
  // Lumbar Y support
  add(back, bx(0.04, 0.32, 0.02), graphite, 0, 0.26, -0.02);
  add(back, bx(0.24, 0.04, 0.02), graphite, 0, 0.38, -0.02);
  // 3D Armrest melengkung
  for (const s of [-1, 1]) {
    add(g, bx(0.035, 0.18, 0.035), graphite, s * 0.26, 0.52, -0.02);
    add(g, rbox(0.08, 0.025, 0.24, 0.012), darkMesh, s * 0.26, 0.62, 0.02);
  }
  return g;
}

function executiveLeatherChair(x, z, ry, leatherColor = 0x181a20) {
  // Kursi Eksekutif Kulit Mewah (untuk Kai & Dimitri CEO)
  const g = grp(scene, x, 0, z, ry);
  const leather = mat(leatherColor, { roughness: 0.65 });
  const chrome = mat(0xd1d5db, { roughness: 0.15, metalness: 0.9 });
  // Kaki bintang 5 chrome berkilau
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    add(g, bx(0.04, 0.03, 0.3), chrome, Math.sin(a) * 0.14, 0.06, Math.cos(a) * 0.14, 0, a, 0);
    add(g, sph(0.028, 8), M.black, Math.sin(a) * 0.29, 0.028, Math.cos(a) * 0.29);
  }
  add(g, cyl(0.03, 0.03, 0.28, 10), chrome, 0, 0.21, 0);
  // Bantalan duduk kulit tebal berkontur
  add(g, rbox(0.52, 0.10, 0.52, 0.04), leather, 0, 0.41, 0.02);
  add(g, rbox(0.44, 0.03, 0.44, 0.02), leather, 0, 0.47, 0.02);
  // Sandaran tinggi (High-Back) dengan bantal kepala terintegrasi
  const back = grp(g, 0, 0.45, -0.22); back.rotation.x = -0.12;
  add(back, rbox(0.50, 0.82, 0.09, 0.04), leather, 0, 0.43, 0);
  add(back, rbox(0.38, 0.20, 0.06, 0.03), leather, 0, 0.74, 0.04); // Headrest
  add(back, bx(0.04, 0.80, 0.02), chrome, -0.23, 0.43, -0.03); // Aksen chrome samping
  add(back, bx(0.04, 0.80, 0.02), chrome, 0.23, 0.43, -0.03);
  // Armrest kulit dengan rangka chrome
  for (const s of [-1, 1]) {
    add(g, bx(0.03, 0.22, 0.03), chrome, s * 0.28, 0.54, -0.02);
    add(g, rbox(0.08, 0.03, 0.28, 0.015), leather, s * 0.28, 0.65, 0.01);
  }
  return g;
}

function makerWorkshopChair(x, z, ry, accentColor = 0x10b981) {
  // Kursi Workshop Maker Heavy-Duty (untuk Reno)
  const g = grp(scene, x, 0, z, ry);
  const acc = mat(accentColor, { roughness: 0.7 });
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    add(g, bx(0.04, 0.03, 0.28), M.black, Math.sin(a) * 0.13, 0.06, Math.cos(a) * 0.13, 0, a, 0);
    add(g, sph(0.028, 8), M.black, Math.sin(a) * 0.27, 0.028, Math.cos(a) * 0.27);
  }
  add(g, cyl(0.03, 0.03, 0.28, 8), M.steel, 0, 0.20, 0);
  add(g, rbox(0.48, 0.08, 0.48, 0.03), M.charcoal, 0, 0.41, 0.02);
  add(g, rbox(0.36, 0.02, 0.38, 0.01), acc, 0, 0.46, 0.03);
  const back = grp(g, 0, 0.44, -0.21); back.rotation.x = -0.12;
  add(back, rbox(0.46, 0.58, 0.06, 0.03), M.charcoal, 0, 0.32, 0);
  add(back, rbox(0.36, 0.46, 0.02, 0.01), acc, 0, 0.32, 0.03);
  for (const s of [-1, 1]) {
    add(g, bx(0.035, 0.19, 0.035), M.black, s * 0.26, 0.53, -0.02);
    add(g, rbox(0.07, 0.025, 0.24, 0.01), M.black, s * 0.26, 0.63, 0.01);
  }
  return g;
}

function gamingChair(x, z, ry, accent) {
  return executiveLeatherChair(x, z, ry, new THREE.Color(accent).getHex());
}
function officeChair(x, z, ry) {
  return aeronChair(x, z, ry);
}
function buildDesk(type, accent) {
  const s = SPOTS["desk:" + type];
  const isArchitect = type === "architect";
  const isMaker = type === "maker3d";
  const isKai = type === "orchestrator";

  const W = isKai ? 2.2 : (isMaker ? 1.85 : 1.75);
  const D = isKai ? 0.95 : (isMaker ? 0.90 : 0.85);
  const f = fwd(s.ry);
  const cx = s.x + f.x * (isKai ? 0.78 : 0.75), cz = s.z + f.z * (isKai ? 0.78 : 0.75);
  const g = grp(scene, cx, 0, cz, s.ry + Math.PI); // lokal +z mengarah ke orang

  const kind = SCREEN_KIND[type] || "doc", screens = [];
  const r = rng(type.length * 97 + type.charCodeAt(0));
  const tex = () => { const t = screenTex(kind, (r() * 1e6) | 0); if (kind === "code" || kind === "test") t.repeat.set(1, 0.7); return t; };

  if (isArchitect) {
    // =========================================================================
    // SETUP BIMA (FLEEK PROJECT): Standing Desk Elektrik + Mac Studio + Dual Studio Display
    // =========================================================================
    // Daun meja standing desk matte black dengan bevel lembut
    add(g, rbox(W, 0.04, D, 0.015), mat(0x181a20, { roughness: 0.6 }), 0, 0.73, 0);
    // Kaki standing desk teleskopik elektrik warna hitam
    for (const sx of [-1, 1]) {
      add(g, rbox(0.08, 0.71, 0.12, 0.01), mat(0x0f1115, { metalness: 0.6 }), sx * (W / 2 - 0.12), 0.355, 0);
      add(g, rbox(0.12, 0.03, D - 0.1, 0.01), mat(0x0f1115, { metalness: 0.6 }), sx * (W / 2 - 0.12), 0.015, 0); // Kaki bawah T-shape
    }
    // Controller digital ketinggian meja (LED display kecil di sisi kanan)
    add(g, rbox(0.08, 0.025, 0.03, 0.005), mat(0x2563eb, { emissive: 0x2563eb, emissiveIntensity: 0.5 }), W / 2 - 0.15, 0.715, D / 2 - 0.02);

    // Apple Mac Studio M-Series (Kubus aluminium perak unibody)
    const macStudio = grp(g, -W / 2 + 0.22, 0.75, -0.05);
    add(macStudio, rbox(0.19, 0.09, 0.19, 0.02), mat(0xd1d5db, { metalness: 0.85, roughness: 0.2 }), 0, 0.045, 0);
    add(macStudio, sph(0.004, 6), glowMat(0xffffff, 1.0, 2.0), 0, 0.025, 0.096); // LED status putih

    // Dual Apple Studio Display 27" dengan stand aluminium perak
    screens.push(monitor(g, -0.38, -0.16, 0.12, tex(), 0.64, 0.38));
    screens.push(monitor(g, 0.36, -0.16, -0.12, tex(), 0.64, 0.38));

    // Extended Desk Mat Dark Navy
    add(g, rbox(0.85, 0.006, 0.35, 0.01), mat(0x0f172a, { roughness: 0.9 }), 0.02, 0.753, 0.18);
    // Magic Keyboard Space Gray + Magic Trackpad
    add(g, rbox(0.38, 0.012, 0.12, 0.004), mat(0x334155, { metalness: 0.5 }), -0.06, 0.76, 0.20);
    add(g, rbox(0.14, 0.010, 0.12, 0.004), mat(0x1e293b, { metalness: 0.5 }), 0.25, 0.758, 0.20);

    // Headphone stand aluminium + Wireless Headphones over-ear
    const hpStand = grp(g, -W / 2 + 0.15, 0.75, -0.25);
    add(hpStand, cyl(0.06, 0.06, 0.01, 14), M.steel, 0, 0.005, 0);
    add(hpStand, cyl(0.008, 0.008, 0.24, 8), M.steel, 0, 0.12, 0);
    add(hpStand, rbox(0.12, 0.02, 0.05, 0.01), M.steel, 0, 0.24, 0);
    add(hpStand, new THREE.TorusGeometry(0.07, 0.018, 8, 16, Math.PI), mat(0x1e293b), 0, 0.22, 0, 0, 0, Math.PI); // Headband headphone

    // Miniatur Rubber Duck Debugging Kuning di sudut meja
    const duck = grp(g, W / 2 - 0.16, 0.75, -0.22);
    add(duck, sph(0.022, 10), mat(0xfacc15, { roughness: 0.4 }), 0, 0.022, 0); // Bodi bebek
    add(duck, sph(0.015, 8), mat(0xfacc15, { roughness: 0.4 }), 0.01, 0.040, 0.005); // Kepala
    add(duck, rbox(0.012, 0.006, 0.012, 0.002), mat(0xf97316), 0.022, 0.038, 0.005); // Paruh oranye

    // Kursi Aeron Mesh Herman Miller
    aeronChair(s.x, s.z, s.ry);

  } else if (isMaker) {
    // =========================================================================
    // SETUP RENO (XAVORTREE LAB): Workbench Solid Oak + PC Gaming Tower + Bambu Lab FDM
    // =========================================================================
    // Daun meja workbench kayu oak solid tebal kokoh
    add(g, rbox(W, 0.055, D, 0.01), M.oak, 0, 0.725, 0);
    for (const sx of [-1, 1]) add(g, bx(0.06, 0.695, D - 0.06), M.black, sx * (W / 2 - 0.08), 0.348, 0);
    add(g, bx(W - 0.2, 0.25, 0.02), M.black, 0, 0.52, -D / 2 + 0.06);

    // Custom PC Workstation / Gaming Tower (Casing tempered glass + radiator fan subtle glow)
    const pcTower = grp(g, -W / 2 + 0.20, 0.755, -0.15);
    add(pcTower, rbox(0.22, 0.46, 0.42, 0.02), mat(0x0f172a, { metalness: 0.7, roughness: 0.3 }), 0, 0.23, 0);
    // Kaca tempered samping tembus pandang
    add(pcTower, rbox(0.01, 0.42, 0.38, 0.01), mat(0x38bdf8, { transparent: true, opacity: 0.35 }), 0.115, 0.23, 0);
    // Fan pendingin GPU dengan subtle glow oranye/cyan
    add(pcTower, sph(0.04, 8), glowMat(0xf97316, 0.8, 2.0), 0.08, 0.28, 0.08);
    add(pcTower, sph(0.04, 8), glowMat(0x38bdf8, 0.8, 2.0), 0.08, 0.18, -0.08);

    // UltraWide Curved Monitor 34" untuk 3D CAD & Slicing
    screens.push(monitor(g, -0.12, -0.16, 0.0, tex(), 0.78, 0.36));

    // Mechanical Keyboard dengan Keycap Custom + Drawing Pen Tablet
    add(g, rbox(0.38, 0.018, 0.14, 0.005), mat(0x1e293b), -0.22, 0.762, 0.22);
    // Tombol keycap pastel warna-warni
    add(g, rbox(0.36, 0.005, 0.12, 0.002), mat(0xfbcfe8), -0.22, 0.774, 0.22);
    // Drawing Tablet Wacom + Stylus Pen
    add(g, rbox(0.26, 0.008, 0.18, 0.005), mat(0x0f172a), 0.16, 0.757, 0.22);
    add(g, cyl(0.004, 0.004, 0.14, 6), mat(0x38bdf8), 0.16, 0.768, 0.22, 0, 0, 0.3); // Stylus pen

    // 3D Printer Bambu Lab FDM Miniatur Presisi
    const p3d = grp(g, W / 2 - 0.25, 0.755, -0.14, 0);
    add(p3d, rbox(0.42, 0.48, 0.40, 0.02), mat(0x1e293b, { roughness: 0.3, metalness: 0.7 }), 0, 0.24, 0); // Enclosure
    add(p3d, rbox(0.34, 0.38, 0.015, 0.01), mat(0x93c5fd, { transparent: true, opacity: 0.4 }), 0, 0.24, 0.20); // Pintu kaca
    add(p3d, rbox(0.26, 0.015, 0.26, 0.01), glowMat(0xffffff, 0.9, 1.8), 0, 0.12, 0); // Print bed bercahaya putih
    add(p3d, cyl(0.07, 0.07, 0.05, 16), mat(0xf97316), 0, 0.51, -0.06); // Spool filamen PLA oranye di atas
    add(p3d, bx(0.12, 0.07, 0.01), mat(0x0284c7), 0.12, 0.44, 0.20); // Layar sentuh kontrol

    // Jangka Sorong Digital (Caliper) & Miniatur Chibi di meja
    add(g, bx(0.16, 0.006, 0.03), M.steel, W / 2 - 0.35, 0.756, 0.24); // Caliper digital
    add(g, cyl(0.025, 0.03, 0.08, 10), mat(0xf472b6), -0.02, 0.795, -0.22); // Figur chibi pink mini

    // Kursi Workshop Reno
    makerWorkshopChair(s.x, s.z, s.ry, 0x10b981);

  } else {
    // =========================================================================
    // SETUP KAI (EXECUTIVE COMMONS): Meja Solid Walnut Mewah + Apple iMac + iPad on Magnetic Stand
    // =========================================================================
    // Daun meja eksekutif solid walnut mewah
    add(g, rbox(W, 0.05, D, 0.02), M.walnut, 0, 0.73, 0);
    for (const sx of [-1, 1]) add(g, rbox(0.08, 0.70, D - 0.12, 0.02), M.walnut, sx * (W / 2 - 0.08), 0.35, 0);
    add(g, bx(W - 0.2, 0.38, 0.02), mat(0x3e2719), 0, 0.52, -D / 2 + 0.08); // Modesty panel kayu

    // Leather Desk Mat Cognac Brown
    add(g, rbox(0.95, 0.008, 0.45, 0.015), mat(0x6c4427, { roughness: 0.8 }), 0, 0.757, 0.18);

    // Apple iMac 24" Silver M-Series (Ultra-thin display dengan stand aluminium perak)
    screens.push(monitor(g, 0.0, -0.16, 0.0, tex(), 0.68, 0.40));

    // iPad Pro di atas Magnetic Stand miring (untuk Live KPI & Checklist Notulen)
    const ipadStand = grp(g, -0.62, 0.755, 0.02, 0.35);
    add(ipadStand, cyl(0.06, 0.06, 0.008, 16), M.steel, 0, 0.004, 0);
    add(ipadStand, cyl(0.008, 0.008, 0.16, 8), M.steel, 0, 0.08, -0.02, -0.2);
    add(ipadStand, rbox(0.24, 0.17, 0.008, 0.005), mat(0x1e293b, { metalness: 0.8 }), 0, 0.16, 0, -0.2); // iPad Pro
    const smIpad = new THREE.MeshBasicMaterial({ map: tex(), toneMapped: false });
    const scrIpad = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.15), smIpad);
    scrIpad.position.set(0, 0.16, 0.006); scrIpad.rotation.x = -0.2; ipadStand.add(scrIpad);

    // Magic Keyboard Silver + Magic Mouse
    add(g, rbox(0.38, 0.012, 0.13, 0.004), mat(0xd1d5db, { metalness: 0.7 }), -0.05, 0.765, 0.22);
    add(g, rbox(0.06, 0.018, 0.10, 0.012), mat(0xd1d5db, { metalness: 0.7 }), 0.26, 0.765, 0.22);

    // Cangkir Keramik Hitam Kopi Panas Kai + Map Folder Eksekutif
    add(g, cyl(0.04, 0.035, 0.09, 12), M.black, -W / 2 + 0.22, 0.80, 0.24); // Cangkir kopi
    add(g, rbox(0.24, 0.025, 0.32, 0.01), mat(0x78350f), 0.58, 0.768, 0.12, 0, -0.15, 0); // Map berkas kulit

    // Kursi Kulit Eksekutif Mewah Kai
    executiveLeatherChair(s.x, s.z, s.ry, 0x14161a);
  }

  // Tanaman pot kecil meja di sudut
  if (r() < 0.75) {
    const p = grp(g, W / 2 - 0.14, 0.755, -0.30);
    add(p, cyl(0.045, 0.035, 0.07, 10), mat(0xf1f5f9), 0, 0.035, 0);
    for (let i = 0; i < 4; i++) add(p, new THREE.IcosahedronGeometry(0.035, 0), M.leafB, Math.cos(i * 1.5) * 0.025, 0.10 + i * 0.012, Math.sin(i * 1.5) * 0.025);
  }

  blockC(cx, cz, W, D, 0.22);
  DESKS[type] = { screens };
}

function sofa(x, z, ry, len, n, color, pillowCols = []) {
  const g = grp(scene, x, 0, z, ry), fab = mat(color, { roughness: 0.95 });
  add(g, rbox(len, 0.24, 0.88, 0.05), fab, 0, 0.2, 0);
  const cw = (len - 0.36) / n;
  for (let i = 0; i < n; i++) {
    const cx = -len / 2 + 0.18 + cw / 2 + i * cw;
    add(g, rbox(cw - 0.02, 0.13, 0.64, 0.05), fab, cx, 0.37, 0.08);
    add(g, rbox(cw - 0.02, 0.44, 0.2, 0.07), fab, cx, 0.62, -0.3, -0.12);
  }
  for (const sx of [-1, 1]) add(g, rbox(0.18, 0.5, 0.88, 0.06), fab, sx * (len / 2 - 0.09), 0.33, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, cyl(0.02, 0.02, 0.08, 6), M.black, sx * (len / 2 - 0.1), 0.04, sz * 0.35);
  pillowCols.forEach((pc, i) => {
    const px = pillowCols.length > 1 ? -len / 2 + 0.35 + (i * (len - 0.7)) / (pillowCols.length - 1) : 0;
    add(g, rbox(0.34, 0.34, 0.11, 0.05), mat(pc, { roughness: 1 }), px, 0.6, -0.16, -0.3, 0, 0.18 * (i % 2 ? 1 : -1));
  });
  const w = Math.abs(Math.cos(ry)) > 0.5 ? len : 0.88, d = Math.abs(Math.cos(ry)) > 0.5 ? 0.88 : len;
  blockC(x, z, w, d, 0.2);
  return g;
}

function buildFurniture() {
  // ---------- area kerja ----------
  Object.keys(SEAT_TYPES).forEach((t) => buildDesk(t, (roster[t] && roster[t].color) || DEFAULT_COLORS[t]));
  boards.kanban = board(-7.0, 1.95, Z0 + 0.03, 0, 3.0, 1.25, 1024, 430, false);
  boards.road = board(3.55, 1.95, Z0 + 0.03, 0, 1.9, 1.2, 640, 400, false);
  boards.status = board(X1 - 0.03, 1.72, -1.45, -Math.PI / 2, 2.0, 1.15, 680, 400, false);
  boards.clock = board(X1 - 0.03, 2.62, -1.45, -Math.PI / 2, 0.42, 0.42, 256, 256, false, true);

  // =========================================================================
  // XAVORTREE LAB: Showcase Lemari Kaca Produk, Pegboard Filamen & IoT Bench
  // =========================================================================
  // 1. Showcase Lemari Kaca Display Produk 3D Xavortree
  const sc = grp(scene, -8.3, 0, 0.5, Math.PI / 2);
  add(sc, rbox(1.8, 1.9, 0.5, 0.03), mat(0x0f172a, { roughness: 0.2 }), 0, 0.95, 0); // Bodi kabinet luar
  add(sc, rbox(1.7, 1.7, 0.46, 0.02), mat(0x1e293b), 0, 0.95, 0.02); // Rongga dalam
  // Rak kaca transparan
  add(sc, rbox(1.68, 0.02, 0.44, 0.01), M.glass, 0, 0.65, 0.02);
  add(sc, rbox(1.68, 0.02, 0.44, 0.01), M.glass, 0, 1.25, 0.02);
  // Pintu Kaca Depan Akrilik
  add(sc, rbox(1.76, 1.8, 0.02, 0.01), mat(0xe0f2fe, { transparent: true, opacity: 0.35, roughness: 0.05 }), 0, 0.95, 0.25);
  // Produk-Produk di Rak Showcase:
  // Rak 1: 3D Strava Line Elevasi & Chibi Paintable
  add(sc, rbox(0.35, 0.06, 0.25, 0.01), mat(0xd97706), -0.5, 0.69, 0.05); // Model rute elevasi Strava 3D
  add(sc, cyl(0.04, 0.05, 0.14, 12), mat(0xfbcfe8), 0.0, 0.73, 0.05); // Figur Chibi Custom Paintable
  add(sc, rbox(0.18, 0.24, 0.03, 0.005), mat(0xdb2777), 0.5, 0.78, 0.05); // Bingkai Photocard K-Pop timbul
  // Rak 2: Keycap Clicker Charm & Articulated Fidget Dragon
  add(sc, rbox(0.09, 0.09, 0.09, 0.01), mat(0x38bdf8), -0.4, 1.30, 0.05); // Keycap Mechanical Switch Clicker
  add(sc, rbox(0.3, 0.04, 0.08, 0.01), mat(0x22c55e), 0.2, 1.28, 0.05); // Articulated Dragon
  // Lampu LED Showcase Warm White
  add(sc, bx(1.6, 0.02, 0.04), glowMat(0xfef3c7, 0.8, 2.0), 0, 1.78, 0.05, 0, 0, 0, false);
  blockC(-8.3, 0.5, 0.5, 1.8, 0.2);

  // 2. Pegboard Dinding Spool Filamen PLA Xavortree (Pastel, Silk, Glow)
  const pb = grp(scene, -8.96, 1.7, 2.8, Math.PI / 2);
  add(pb, rbox(1.8, 1.1, 0.04, 0.01), mat(0xfef3c7, { roughness: 0.8 }), 0, 0, 0); // Papan pegboard kayu
  const spoolColors = [0xf472b6, 0x60a5fa, 0x4ade80, 0xfbbf24, 0xa78bfa, 0xf97316, 0x38bdf8, 0xe2e8f0];
  spoolColors.forEach((col, idx) => {
    const sx = -0.65 + (idx % 4) * 0.43;
    const sy = 0.25 - Math.floor(idx / 4) * 0.5;
    add(pb, cyl(0.08, 0.08, 0.05, 14), mat(col, { roughness: 0.4 }), sx, sy, 0.05, Math.PI / 2, 0, 0);
  });

  // 3. Workbench IoT Telemetry & Finishing Xavortree
  const wb = grp(scene, -3.8, 0, 3.2, 0);
  add(wb, rbox(1.8, 0.05, 0.8, 0.01), M.oak, 0, 0.725, 0); // Meja kerja kayu
  add(wb, bx(0.05, 0.7, 0.7), M.black, -0.8, 0.35, 0);
  add(wb, bx(0.05, 0.7, 0.7), M.black, 0.8, 0.35, 0);
  // Matras Antistatis Hijau + Modul ESP32 & Alat
  add(wb, rbox(0.9, 0.01, 0.5, 0.005), mat(0x047857), -0.2, 0.755, 0);
  add(wb, rbox(0.12, 0.02, 0.08, 0.002), mat(0x1e293b), -0.2, 0.77, 0); // ESP32 board
  add(wb, cyl(0.004, 0.004, 0.12, 4), M.steel, -0.15, 0.81, 0, 0, 0, 0.4); // Antena IoT
  add(wb, rbox(0.14, 0.03, 0.08, 0.005), mat(0xeab308), -0.45, 0.768, -0.1); // Multimeter digital kuning
  add(wb, rbox(0.2, 0.04, 0.06, 0.005), mat(0xef4444), 0.45, 0.765, -0.1); // Tang Potong Presisi
  // Deretan botol cat akrilik chibi & kuas halus
  const paintCols = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xa855f7];
  paintCols.forEach((col, idx) => {
    add(wb, cyl(0.018, 0.018, 0.045, 10), mat(col), 0.2 + idx * 0.05, 0.775, 0.18);
  });
  add(wb, cyl(0.003, 0.003, 0.15, 6), mat(0x78350f), 0.5, 0.76, 0.15, 0, 0, 0.3); // Kuas lukis
  blockC(-3.8, 3.2, 1.8, 0.8, 0.2);

  // =========================================================================
  // FLEEK PROJECT STUDIO: Server Tower NAS, Glass Whiteboard & Standby Desk
  // =========================================================================
  // 1. Mini Server Rack Tower & NAS Backup
  const sr = grp(scene, -8.3, 0, -5.3);
  add(sr, rbox(0.7, 1.4, 0.6, 0.02), mat(0x0f172a, { metalness: 0.6, roughness: 0.4 }), 0, 0.7, 0);
  add(sr, rbox(0.62, 1.25, 0.02, 0.01), mat(0x1e293b), 0, 0.7, 0.31);
  // Lampu Status LED Server
  for (let l = 0; l < 4; l++) {
    add(sr, sph(0.015, 8), glowMat(l === 3 ? 0x38bdf8 : 0x22c55e, 1.0, 3.0), -0.2 + l * 0.13, 1.22, 0.32, 0, 0, 0, false);
  }
  // Router Wi-Fi 6 Mesh di atas server rack dengan antena
  add(sr, rbox(0.18, 0.04, 0.14, 0.01), mat(0x334155), 0, 1.42, 0);
  add(sr, cyl(0.003, 0.003, 0.12, 4), M.black, -0.06, 1.48, -0.04);
  add(sr, cyl(0.003, 0.003, 0.12, 4), M.black, 0.06, 1.48, -0.04);
  blockC(-8.3, -5.3, 0.7, 0.6, 0.2);

  // 2. Glass Whiteboard Arsitektur Database (Dinding Belakang Fleek)
  const gwb = grp(scene, -4.5, 1.8, Z0 + 0.03, 0);
  add(gwb, rbox(2.2, 1.2, 0.02, 0.01), mat(0xe0f2fe, { transparent: true, opacity: 0.85, roughness: 0.1 }), 0, 0, 0);
  add(gwb, rbox(2.26, 1.26, 0.03, 0.01), M.black, 0, 0, -0.015); // Frame hitam
  // Skema DB corat-coret di whiteboard
  add(gwb, rbox(0.4, 0.25, 0.005, 0.005), mat(0x0284c7), -0.5, 0.2, 0.015);
  add(gwb, rbox(0.4, 0.25, 0.005, 0.005), mat(0x7c3aed), 0.4, 0.2, 0.015);
  add(gwb, bx(0.5, 0.02, 0.005), mat(0x0f172a), -0.05, 0.2, 0.015);

  // Floating Wall Shelf Fleek Studio di atas whiteboard
  const fws = grp(scene, -4.5, 2.55, Z0 + 0.08, 0);
  add(fws, rbox(1.6, 0.03, 0.20, 0.005), mat(0x181a20), 0, 0, 0);
  // Rubik Cube di rak
  add(fws, rbox(0.05, 0.05, 0.05, 0.005), mat(0x3b82f6), -0.5, 0.04, 0);
  // Buku Clean Code & System Design
  add(fws, rbox(0.04, 0.16, 0.12, 0.002), mat(0x0284c7), 0.3, 0.09, 0);
  add(fws, rbox(0.03, 0.15, 0.12, 0.002), mat(0x10b981), 0.35, 0.09, 0);

  // 3. Meja Standby Dev Squad Fleek Project (Self-Hiring Ready)
  const dsq = grp(scene, -3.8, 0, -3.2, 0);
  add(dsq, rbox(1.6, 0.045, 0.75, 0.01), mat(0x334155), 0, 0.725, 0);
  add(dsq, bx(0.04, 0.7, 0.65), M.black, -0.7, 0.35, 0);
  add(dsq, bx(0.04, 0.7, 0.65), M.black, 0.7, 0.35, 0);
  // Laptop Standby Dev Squad
  add(dsq, rbox(0.34, 0.015, 0.24, 0.005), M.steel, 0, 0.755, 0.05);
  add(dsq, rbox(0.34, 0.22, 0.01, 0.005), M.black, 0, 0.86, -0.07, -0.2);
  officeChair(-3.8, -2.6, 0); // Kursi standby squad
  blockC(-3.8, -3.2, 1.6, 0.75, 0.2);

  // rak buku & majalah santai di lounge tengah
  const shelf = grp(scene, 0.6, 0, 4.8, 0);
  for (const y of [0.04, 0.52, 1.02]) add(shelf, rbox(2.4, 0.04, 0.36, 0.01), M.oak, 0, y, 0);
  for (const sx of [-1.15, 0, 1.15]) add(shelf, bx(0.04, 1.02, 0.36), M.oak, sx, 0.52, 0);
  books(shelf, -1.1, -0.1, 0.06, 0, 5); books(shelf, 0.1, 1.1, 0.06, 0, 6);
  blockC(0.6, 4.8, 2.4, 0.36, 0.2);

  plant(-8.6, -5.55, 1.2, true); plant(2.95, -5.55, 1.1, true); plant(-4.35, 0.35, 1.0, true);
  const rack = grp(scene, 3.05, 0, 0.55);
  add(rack, cyl(0.2, 0.22, 0.03, 16), M.black, 0, 0.015, 0); add(rack, cyl(0.02, 0.02, 1.75, 8), M.black, 0, 0.88, 0);
  for (let k = 0; k < 4; k++) add(rack, cyl(0.008, 0.008, 0.18, 6), M.black, Math.sin(k * 1.57) * 0.07, 1.68, Math.cos(k * 1.57) * 0.07, Math.cos(k * 1.57) * 0.7, 0, -Math.sin(k * 1.57) * 0.7);
  add(rack, rbox(0.3, 0.55, 0.12, 0.05), mat(0x78350f), 0.1, 1.35, 0.0, 0, 0, -0.1);
  block(3.05, 0.55, 3.05, 0.55, 0.22);

  // ---------- ruang meeting ----------
  const T = grp(scene, MEET_T.x, 0, MEET_T.z);
  add(T, rbox(3.4, 0.05, 1.15, 0.02), M.walnut, 0, 0.735, 0);
  for (const sx of [-1.25, 1.25]) { add(T, bx(0.08, 0.7, 0.8), M.black, sx, 0.36, 0); add(T, bx(0.5, 0.04, 0.9), M.black, sx, 0.02, 0); }
  // Conference 360 Mic / Speaker Puck bulat dengan cincin LED Cyan di tengah meja
  add(T, cyl(0.09, 0.09, 0.02, 20), mat(0x0f172a, { metalness: 0.8 }), 0, 0.765, 0);
  add(T, new THREE.TorusGeometry(0.085, 0.003, 6, 24), glowMat(0x38bdf8, 1.2, 2.5), 0, 0.775, 0, Math.PI / 2);
  // Wireless charging pad di dua sisi meja
  add(T, cyl(0.05, 0.05, 0.005, 16), mat(0x334155), -0.6, 0.762, 0);
  add(T, cyl(0.05, 0.05, 0.005, 16), mat(0x334155), 0.6, 0.762, 0);

  [[-1.1, -0.3], [0, -0.3], [1.1, -0.3], [-1.1, 0.3], [0, 0.3], [1.1, 0.3]].forEach(([lx, lz], i) => {
    if (i % 2) { add(T, rbox(0.21, 0.004, 0.28, 0.002), M.white, lx, 0.762, lz, 0, 0.1, 0, false); add(T, cyl(0.004, 0.004, 0.16, 6), M.black, lx + 0.14, 0.765, lz, Math.PI / 2, 0, 0, false); }
    else { const lp = grp(T, lx, 0.76, lz, lz > 0 ? Math.PI : 0); add(lp, rbox(0.32, 0.012, 0.22, 0.005), M.steel, 0, 0.006, 0); add(lp, rbox(0.32, 0.2, 0.01, 0.004), M.steel, 0, 0.11, -0.11, -0.25); }
    add(T, cyl(0.03, 0.03, 0.1, 10), M.glass, lx - 0.2, 0.81, lz * 0.7, 0, 0, 0, false);
  });
  for (const id of MEET_IDS.slice(1)) {
    const s = SPOTS[id];
    if (id === "meet:7") {
      executiveLeatherChair(s.x, s.z, s.ry, 0x0369a1); // Kursi Pimpinan CEO (Dimitri) di kepala meja
    } else {
      aeronChair(s.x, s.z, s.ry); // Kursi Ergonomis Mesh Aeron untuk Tim
    }
  }
  const tv = grp(scene, X1 - 0.04, 0, 3.1, -Math.PI / 2);
  add(tv, rbox(2.95, 1.7, 0.06, 0.02), M.black, 0, 1.6, 0);
  boards.tv = board(0, 0, 0, 0, 2.82, 1.58, 1024, 576, true); tv.add(boards.tv.mesh); boards.tv.mesh.position.set(0, 1.6, 0.035);
  // Soundbar & Video Conference Camera 4K di bawah TV
  add(tv, rbox(1.4, 0.08, 0.08, 0.02), mat(0x0f172a, { metalness: 0.6 }), 0, 0.75, 0.06);
  add(tv, sph(0.015, 8), mat(0x38bdf8), 0, 0.75, 0.11); // Lensa kamera konferensi
  add(tv, rbox(2.4, 0.5, 0.42, 0.02), M.walnut, 0, 0.25, 0.22);
  block(X1 - 0.5, 1.9, X1, 4.3, 0.1);
  plant(8.55, 5.55, 1.1, true); plant(4.0, 5.6, 0.9);

  // ---------- pantry / pojok kopi ----------
  const P = grp(scene, 6.7, 0, -5.6);
  add(P, rbox(3.0, 0.84, 0.6, 0.01), M.white, 0, 0.42, 0);
  for (let k = 0; k < 5; k++) add(P, bx(0.006, 0.7, 0.005), mat(0xc9c5bd), -1.2 + k * 0.6, 0.45, 0.302, 0, 0, 0, false);
  add(P, rbox(3.06, 0.05, 0.64, 0.01), M.stone, 0, 0.865, 0);
  add(P, rbox(0.5, 0.02, 0.36, 0.01), M.charcoal, 0.35, 0.885, 0.02, 0, 0, 0, false); add(P, cyl(0.012, 0.012, 0.26, 8), M.steel, 0.35, 1.0, -0.2);
  add(P, rbox(3.0, 0.62, 0.34, 0.01), M.oak, 0, 1.95, -0.13);
  add(P, bx(2.9, 0.02, 0.02), glowMat(0xfff1d6, 0.2, 2.4), 0, 1.63, 0.03, 0, 0, 0, false);
  const cm = grp(P, -0.9, 0.89, -0.05);
  add(cm, rbox(0.3, 0.38, 0.3, 0.03), M.black, 0, 0.19, 0); add(cm, rbox(0.22, 0.04, 0.12, 0.01), M.steel, 0, 0.04, 0.14);
  add(cm, sph(0.012, 8), glowMat(0xef4444, 1, 3), 0.1, 0.3, 0.151); add(cm, cyl(0.035, 0.03, 0.07, 10), M.white, 0, 0.1, 0.14);
  add(P, rbox(0.46, 0.27, 0.34, 0.02), M.steel, 1.05, 1.03, -0.02); add(P, rbox(0.3, 0.2, 0.01, 0.01), M.charcoal, 1.0, 1.03, 0.155, 0, 0, 0, false);
  for (let k = 0; k < 4; k++) add(P, cyl(0.04, 0.034, 0.09, 10), mat([0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981][k]), -0.45 + k * 0.1, 0.935, 0.12);
  add(P, cyl(0.07, 0.08, 0.22, 12), M.steel, -0.4, 0.99, -0.12);
  blockC(6.7, -5.6, 3.06, 0.64, 0.22);
  const fr = grp(scene, 8.55, 0, -5.55);
  add(fr, rbox(0.7, 1.9, 0.68, 0.03), M.steel, 0, 0.95, 0); add(fr, bx(0.02, 0.5, 0.03), M.charcoal, -0.28, 1.3, 0.345); add(fr, bx(0.02, 0.3, 0.03), M.charcoal, -0.28, 0.7, 0.345);
  blockC(8.55, -5.55, 0.7, 0.68, 0.2);
  const bt = grp(scene, 6.8, 0, -3.75);
  add(bt, cyl(0.45, 0.45, 0.04, 28), M.oak, 0, 1.03, 0); add(bt, cyl(0.04, 0.04, 1.0, 10), M.black, 0, 0.51, 0); add(bt, cyl(0.28, 0.3, 0.03, 20), M.black, 0, 0.015, 0);
  add(bt, cyl(0.04, 0.035, 0.09, 10), M.white, -0.15, 1.095, 0.1);
  blockC(6.8, -3.75, 0.9, 0.9, 0.22);
  for (const id of ["rest:stool1", "rest:stool2"]) {
    const s = SPOTS[id], st = grp(scene, s.x, 0, s.z);
    add(st, cyl(0.19, 0.17, 0.06, 18), M.oak, 0, 0.72, 0); add(st, cyl(0.025, 0.025, 0.7, 8), M.black, 0, 0.36, 0);
    add(st, new THREE.TorusGeometry(0.15, 0.012, 6, 20), M.black, 0, 0.28, 0, Math.PI / 2); add(st, cyl(0.2, 0.22, 0.025, 18), M.black, 0, 0.012, 0);
  }
  pendant(6.55, -3.75, 1.85); pendant(7.05, -3.75, 1.95);
  plant(5.35, -3.0, 0.9);

  // ---------- EXECUTIVE LOUNGE TENGAH (Warm Scandinavian, Anti AI-Slop) ----------
  // Sofa santai staf di lounge tengah (warna warm cream, bantal slate & amber)
  sofa(0.8, 2.8, 0, 2.4, 3, 0xd4c7b5, [0x475569, 0xb45309]);
  const ct = grp(scene, 0.8, 0, 3.8);
  add(ct, rbox(0.65, 0.05, 1.2, 0.02), M.walnut, 0, 0.42, 0); // Coffee table kayu solid walnut
  for (const sx of [-0.25, 0.25]) for (const sz of [-0.48, 0.48]) add(ct, cyl(0.02, 0.02, 0.4, 6), M.black, sx, 0.2, sz);
  add(ct, rbox(0.2, 0.03, 0.28, 0.005), mat(0x1e293b), 0.05, 0.46, -0.25, 0, 0.3, 0); // Majalah desain arsitektur
  add(ct, cyl(0.04, 0.035, 0.09, 10), M.white, -0.1, 0.49, 0.2); // Cangkir kopi
  blockC(0.8, 3.8, 0.65, 1.2, 0.2);

  // Lampu lantai & tanaman hias lounge tengah
  floorLamp(2.5, 3.8);
  plant(2.5, 2.6, 1.1, true);
  plant(-8.6, 5.4, 1.0, true); // Tanaman sudut lab Xavortree
}

// =====================================================================
// PAPAN (kanban, roadmap, status, jam, TV presentasi)
// =====================================================================
const boards = {};
function board(x, y, z, ry, w, h, cw, ch, glow, round) {
  const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const material = glow ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, transparent: !!round });
  const mesh = new THREE.Mesh(round ? new THREE.CircleGeometry(w / 2, 40) : new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z); mesh.rotation.y = ry;
  if (!glow) {
    mesh.receiveShadow = true; scene.add(mesh);
    if (!round) { const fr = new THREE.Mesh(bx(w + 0.06, h + 0.06, 0.02), M.charcoal); fr.position.z = -0.012; mesh.add(fr); }
  }
  return { mesh, cv, tex, ctx: cv.getContext("2d") };
}
function txt(c, s, x, y, size, color, weight = "normal", align = "left", maxW) {
  c.font = `${weight} ${size}px -apple-system, "Segoe UI", sans-serif`; c.fillStyle = color; c.textAlign = align;
  if (maxW) c.fillText(String(s), x, y, maxW); else c.fillText(String(s), x, y);
}
function drawKanban() {
  const b = boards.kanban; if (!b) return; const c = b.ctx, w = b.cv.width, h = b.cv.height;
  c.fillStyle = "#fbfaf7"; c.fillRect(0, 0, w, h);
  txt(c, `Papan Tugas · ${meta.name || ""}`, 24, 44, 30, "#1f2430", "bold");
  const total = meta.planCount || 0, done = Math.round((total * (meta.roadmapProgress || 0)) / 100);
  const working = Object.values(agents).filter((a) => a.status === "kerja").length;
  const inQA = Math.min(meta.qaReports || 0, Math.max(0, total - done));
  const doing = Math.min(working, Math.max(0, total - done - inQA));
  const cols = [["Rencana", Math.max(0, total - done - inQA - doing), "#fde68a"], ["Dikerjakan", doing, "#bfdbfe"], ["Uji QA", inQA, "#fbcfe8"], ["Selesai", done, "#bbf7d0"]];
  const cw = (w - 48) / 4, r = rng(42);
  cols.forEach(([name, n, col], i) => {
    const x = 24 + i * cw;
    c.fillStyle = "#e5e7eb"; c.fillRect(x + 4, 64, cw - 12, 3);
    txt(c, `${name} (${n})`, x + 8, 96, 22, "#374151", "bold");
    for (let k = 0; k < Math.min(n, 6); k++) {
      const nx = x + 10 + (k % 2) * (cw / 2 - 6), ny = 112 + Math.floor(k / 2) * 98, rot = (r() - 0.5) * 0.12;
      c.save(); c.translate(nx + 50, ny + 40); c.rotate(rot);
      c.fillStyle = col; c.shadowColor = "rgba(0,0,0,0.15)"; c.shadowBlur = 6; c.fillRect(-50, -40, cw / 2 - 20, 84); c.shadowBlur = 0;
      c.fillStyle = "rgba(0,0,0,0.35)"; for (let l = 0; l < 3; l++) c.fillRect(-40, -22 + l * 16, 40 + r() * 50, 5);
      c.restore();
    }
  });
  if (meta.blokir) { c.save(); c.translate(w - 150, 44); c.rotate(0.05); c.fillStyle = "#fca5a5"; c.fillRect(-60, -26, 150, 46); txt(c, `BLOKIR ${meta.blokir}`, 15, 6, 22, "#7f1d1d", "bold", "center"); c.restore(); }
  b.tex.needsUpdate = true;
}
function drawRoad() {
  const b = boards.road; if (!b) return; const c = b.ctx, w = b.cv.width, h = b.cv.height, p = meta.roadmapProgress || 0;
  c.fillStyle = "#fbfaf7"; c.fillRect(0, 0, w, h);
  txt(c, "Roadmap", 28, 50, 32, "#1f2430", "bold"); txt(c, meta.name || "", 28, 84, 22, "#6b7280");
  c.lineWidth = 22; c.strokeStyle = "#e5e7eb"; c.beginPath(); c.arc(w - 130, 150, 80, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = "#7c3aed"; c.beginPath(); c.arc(w - 130, 150, 80, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * p) / 100); c.stroke();
  txt(c, `${p}%`, w - 130, 164, 38, "#1f2430", "bold", "center");
  txt(c, `${meta.planCount || 0} plan`, 28, 160, 26, "#374151"); txt(c, `${meta.qaReports || 0} laporan QA`, 28, 200, 26, "#374151");
  txt(c, `${meta.blokir || 0} BLOKIR`, 28, 240, 26, meta.blokir ? "#b91c1c" : "#374151", "bold");
  const q = meta.quota && meta.quota.status !== "ok";
  txt(c, q ? "Kuota: habis, tim istirahat" : "Kuota: aman", 28, h - 40, 22, q ? "#b45309" : "#16a34a");
  b.tex.needsUpdate = true;
}
function statusLabel(a) {
  if (meta.quota && meta.quota.status !== "ok") return "kuota habis";
  const act = actors[a.type];
  if (act && (act.pose === "meet" || act.pose === "present") && act.atSpot) return "lagi rapat";
  return a.status === "kerja" ? "lagi kerja" : "istirahat";
}
function drawStatus() {
  const b = boards.status; if (!b) return; const c = b.ctx, w = b.cv.width;
  c.fillStyle = "#fbfaf7"; c.fillRect(0, 0, w, b.cv.height);
  const list = Object.values(agents), kerja = list.filter((a) => a.status === "kerja").length;
  txt(c, "Papan Status", 24, 46, 30, "#1f2430", "bold");
  txt(c, `${kerja} kerja · ${list.length - kerja} istirahat`, w - 24, 46, 20, "#6b7280", "normal", "right");
  list.slice(0, 8).forEach((a, i) => {
    const y = 88 + i * 38;
    c.fillStyle = a.color || "#64748b"; c.beginPath(); c.arc(34, y - 7, 8, 0, Math.PI * 2); c.fill();
    txt(c, `${a.nickname}`, 52, y, 21, "#1f2430", "bold"); txt(c, statusLabel(a), 150, y, 19, a.status === "kerja" ? "#16a34a" : "#6b7280");
    txt(c, (a.lastSummary || "-").replace(/^Bash: /, "$ ").slice(0, 34), 262, y, 17, "#4b5563", "normal", "left", w - 280);
  });
  if (!list.length) txt(c, "Belum ada aktivitas tercatat", 24, 100, 20, "#6b7280");
  b.tex.needsUpdate = true;
}
function drawClock() {
  const b = boards.clock; if (!b) return; const c = b.ctx, s = b.cv.width, r = s / 2;
  c.clearRect(0, 0, s, s); c.fillStyle = "#ffffff"; c.beginPath(); c.arc(r, r, r - 4, 0, Math.PI * 2); c.fill();
  c.lineWidth = 10; c.strokeStyle = "#1f2430"; c.stroke();
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.fillStyle = "#1f2430"; c.fillRect(r + Math.sin(a) * (r - 30) - 3, r - Math.cos(a) * (r - 30) - 3, 6, 6); }
  const d = new Date(), hh = (d.getHours() % 12) + d.getMinutes() / 60, mm = d.getMinutes();
  const hand = (ang, len, wid) => { c.lineWidth = wid; c.lineCap = "round"; c.beginPath(); c.moveTo(r, r); c.lineTo(r + Math.sin(ang) * len, r - Math.cos(ang) * len); c.stroke(); };
  hand((hh / 12) * Math.PI * 2, r * 0.5, 10); hand((mm / 60) * Math.PI * 2, r * 0.75, 6);
  b.tex.needsUpdate = true;
}
function drawTV() {
  const b = boards.tv; if (!b) return; const c = b.ctx, w = b.cv.width, h = b.cv.height;
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#0b1224"); g.addColorStop(1, "#1e1b4b"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const m = meta.meeting && meta.meeting.active;
  if (m) {
    txt(c, "PRESENTASI", 56, 70, 26, "#93c5fd", "bold");
    txt(c, meta.meeting.title || "Rapat tim", 56, 128, 52, "#f8fafc", "bold", "left", w - 112);
    const parts = (meta.meeting.participants || []).map((t) => agents[t] || (roster[t] && { nickname: roster[t].nickname, color: roster[t].color })).filter(Boolean);
    parts.slice(0, 6).forEach((a, i) => {
      const y = 200 + i * 56;
      c.fillStyle = a.color || "#64748b"; c.beginPath(); c.arc(74, y - 10, 12, 0, Math.PI * 2); c.fill();
      txt(c, a.nickname, 100, y, 28, "#e2e8f0", "bold"); txt(c, (a.lastSummary || "menyimak").slice(0, 48), 250, y, 24, "#cbd5e1");
    });
  } else {
    txt(c, "Team Dimitri", w / 2, h / 2 - 40, 64, "#f8fafc", "bold", "center");
    txt(c, `${meta.name || ""} · roadmap ${meta.roadmapProgress || 0}%`, w / 2, h / 2 + 20, 30, "#a5b4fc", "normal", "center");
    txt(c, new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), w / 2, h / 2 + 90, 44, "#e2e8f0", "bold", "center");
  }
  b.tex.needsUpdate = true;
}
function refreshBoards() { drawKanban(); drawRoad(); drawStatus(); drawClock(); drawTV(); }

// =====================================================================
// MANUSIA PROSEDURAL
// =====================================================================
const SEAT_TYPES = { orchestrator: 1, architect: 1, maker3d: 1 };
const DEFAULT_COLORS = { orchestrator: "#6b4f3a", architect: "#0891b2", maker3d: "#d97706" };
const STYLE = {
  orchestrator: { skin: 0xd9a47e, hair: 0x1c1c24, pants: 0x1f2937, hairStyle: "side", tie: true },
  architect: { skin: 0xc68a62, hair: 0x111111, pants: 0x2d3748, hairStyle: "short", glasses: true },
  maker3d: { skin: 0xe8b894, hair: 0x6b4423, pants: 0x3b3f4a, hairStyle: "spiky", headset: true },
};
function makeHuman(style, shirtHex) {
  const shirtC = new THREE.Color(shirtHex).getHex();
  const skin = mat(style.skin, { roughness: 0.7 }), hairM = mat(style.hair, { roughness: 0.95 }), pants = mat(style.pants, { roughness: 0.9 });
  const shirt = mat(shirtC, { roughness: 0.85 }), shoe = mat(0x1b1b1f, { roughness: 0.6 });
  const root = new THREE.Group();
  const hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips);
  add(hips, rbox(0.32, 0.15, 0.2, 0.05), pants, 0, 0, 0);
  const spine = new THREE.Group(); spine.position.y = 0.05; hips.add(spine);
  const tw = style.female ? 0.33 : 0.37;
  add(spine, rbox(tw, 0.46, 0.21, 0.07), shirt, 0, 0.25, 0);
  if (style.tie) { add(spine, bx(0.1, 0.06, 0.01), M.white, 0, 0.46, 0.106, 0, 0, 0, false); add(spine, bx(0.04, 0.2, 0.012), mat(0x991b1b), 0, 0.36, 0.108, 0, 0, 0, false); }
  add(spine, cyl(0.05, 0.055, 0.08, 10), skin, 0, 0.5, 0);
  const head = new THREE.Group(); head.position.y = 0.53; spine.add(head);
  add(head, rbox(0.2, 0.23, 0.21, 0.075), skin, 0, 0.115, 0.005);
  for (const sx of [-1, 1]) { add(head, sph(0.017, 8), M.eye, sx * 0.048, 0.125, 0.112, 0, 0, 0, false); add(head, bx(0.04, 0.008, 0.01), hairM, sx * 0.048, 0.155, 0.11, 0, 0, sx * -0.12, false); }
  add(head, bx(0.05, 0.008, 0.01), mat(0x9a4a3a), 0, 0.065, 0.113, 0, 0, 0, false);
  add(head, rbox(0.215, 0.085, 0.225, 0.04), hairM, 0, 0.205, 0.0);
  switch (style.hairStyle) {
    case "long": add(head, rbox(0.21, 0.3, 0.06, 0.03), hairM, 0, 0.07, -0.095); for (const sx of [-1, 1]) add(head, rbox(0.03, 0.2, 0.15, 0.015), hairM, sx * 0.108, 0.09, -0.02); break;
    case "bob": add(head, rbox(0.225, 0.17, 0.08, 0.035), hairM, 0, 0.1, -0.085); for (const sx of [-1, 1]) add(head, rbox(0.035, 0.15, 0.18, 0.015), hairM, sx * 0.11, 0.1, -0.005); break;
    case "bun": add(head, sph(0.065, 12), hairM, 0, 0.27, -0.07); add(head, rbox(0.21, 0.12, 0.05, 0.02), hairM, 0, 0.15, -0.095); break;
    case "curly": for (let k = 0; k < 9; k++) add(head, sph(0.045, 8), hairM, Math.cos(k * 0.7) * 0.08, 0.22 + (k % 2) * 0.02, Math.sin(k * 0.7) * 0.08 - 0.01); break;
    case "spiky": for (let k = 0; k < 6; k++) add(head, new THREE.ConeGeometry(0.035, 0.1, 5), hairM, -0.075 + k * 0.03, 0.27, -0.02 + (k % 2) * 0.04, -0.3, 0, 0); break;
    case "side": add(head, rbox(0.1, 0.05, 0.2, 0.02), hairM, 0.05, 0.245, 0.0, 0, 0, -0.15); add(head, rbox(0.21, 0.12, 0.05, 0.02), hairM, 0, 0.15, -0.095); break;
    default: add(head, rbox(0.21, 0.12, 0.05, 0.02), hairM, 0, 0.15, -0.095);
  }
  if (style.glasses) {
    for (const sx of [-1, 1]) add(head, new THREE.TorusGeometry(0.032, 0.006, 6, 16), M.black, sx * 0.048, 0.125, 0.114, 0, 0, 0, false);
    add(head, bx(0.03, 0.006, 0.006), M.black, 0, 0.128, 0.116, 0, 0, 0, false);
  }
  if (style.headset) {
    add(head, new THREE.TorusGeometry(0.128, 0.014, 8, 24, Math.PI), M.black, 0, 0.13, 0, 0, 0, 0, false);
    for (const sx of [-1, 1]) add(head, cyl(0.048, 0.048, 0.04, 14), mat(shirtC, { roughness: 0.4 }), sx * 0.12, 0.12, 0, 0, 0, Math.PI / 2, false);
  }
  const arm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * (tw / 2 + 0.035), 0.44, 0); spine.add(sh);
    add(sh, cap(0.05, 0.19), shirt, 0, -0.13, 0);
    const el = new THREE.Group(); el.position.y = -0.28; sh.add(el);
    add(el, cap(0.042, 0.17), skin, 0, -0.12, 0);
    const hand = new THREE.Group(); hand.position.y = -0.26; el.add(hand);
    add(hand, sph(0.045, 10), skin, 0, 0, 0);
    return { sh, el, hand };
  };
  const L = arm(1), R = arm(-1);
  const leg = (side) => {
    const hp = new THREE.Group(); hp.position.set(side * 0.09, -0.05, 0); hips.add(hp);
    add(hp, cap(0.068, 0.3), pants, 0, -0.21, 0);
    const kn = new THREE.Group(); kn.position.y = -0.42; hp.add(kn);
    add(kn, cap(0.058, 0.3), pants, 0, -0.2, 0);
    add(kn, rbox(0.1, 0.07, 0.22, 0.03), shoe, 0, -0.41, 0.04);
    return { hp, kn };
  };
  const LL = leg(1), RL = leg(-1);
  const mug = new THREE.Group(); mug.visible = false; R.hand.add(mug);
  add(mug, cyl(0.04, 0.035, 0.09, 12), M.white, 0, -0.02, 0.05, 0, 0, 0, false);
  add(mug, cyl(0.041, 0.041, 0.02, 12), mat(shirtC), 0, -0.02, 0.05, 0, 0, 0, false);
  const phone = new THREE.Group(); phone.visible = false; R.hand.add(phone);
  add(phone, rbox(0.08, 0.15, 0.012, 0.01), M.black, -0.05, -0.02, 0.05, 0.3, 0, 0, false);
  add(phone, new THREE.PlaneGeometry(0.07, 0.13), new THREE.MeshBasicMaterial({ color: 0x7dd3fc, toneMapped: false }), -0.05, -0.02, 0.058, 0.3, 0, 0, false);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, hips, spine, head, shL: L.sh, elL: L.el, shR: R.sh, elR: R.el, hipL: LL.hp, knL: LL.kn, hipR: RL.hp, knR: RL.kn, mug, phone };
}

function mugArm(p, ph) {
  const sip = Math.sin(ph * 0.6) > 0.93;
  p.shRx = sip ? -1.35 : -0.55; p.elR = sip ? -1.95 : -1.3; p.shRz = -0.12; if (sip) p.headX = -0.15;
}
function targetPose(a, t) {
  const p = { hipsY: 0.92, spine: 0.01, headX: 0, headY: 0, shLx: 0, shLz: 0.07, shRx: 0, shRz: -0.07, elL: -0.12, elR: -0.12, hipL: 0, hipR: 0, knL: 0, knR: 0 };
  const ph = t * 0.001 + a.idx * 1.7;
  if (a.moving) {
    const s = Math.sin(a.walkPhase);
    Object.assign(p, { hipL: -s * 0.5, hipR: s * 0.5, knL: Math.max(0, s) * 0.7, knR: Math.max(0, -s) * 0.7, shLx: s * 0.4, shRx: -s * 0.4, elL: -0.25, elR: -0.25, hipsY: 0.92 + Math.abs(Math.cos(a.walkPhase)) * 0.025, spine: 0.04 });
    return p;
  }
  const sit = (h, hip = -1.5, knee = 1.5) => { p.hipsY = h + 0.07; p.hipL = p.hipR = hip; p.knL = p.knR = knee; };
  switch (a.pose) {
    case "type":
      sit(a.seatH); p.spine = 0.14; p.headX = 0.1 + Math.sin(ph * 0.7) * 0.03; p.headY = a.monitors > 2 ? Math.sin(ph * 0.35) * 0.35 : Math.sin(ph * 0.3) * 0.12;
      p.shLx = p.shRx = -0.82; p.shLz = 0.12; p.shRz = -0.12; p.elL = -0.9 + Math.sin(ph * 14) * 0.07; p.elR = -0.9 + Math.sin(ph * 13 + 1) * 0.07; break;
    case "deskIdle": sit(a.seatH); p.spine = -0.1; p.headX = 0.08; p.shLx = p.shRx = -0.35; p.elL = p.elR = -0.75; break;
    case "meet":
      sit(a.seatH); p.spine = 0.06; p.headX = 0.05 + Math.sin(ph * 0.9) * 0.04; p.headY = Math.sin(ph * 0.4) * 0.45; p.shLx = p.shRx = -0.6; p.elL = p.elR = -0.95;
      if (Math.sin(ph * 0.8) > 0.6) { p.shRx = -1.15; p.elR = -0.5 + Math.sin(ph * 6) * 0.2; } break;
    case "sofa": sit(a.seatH, -1.4, 1.45); p.spine = -0.24; p.headX = -0.04; p.shLx = -0.25; p.shLz = 0.3; p.elL = -0.3; mugArm(p, ph); break;
    case "stool": sit(a.seatH, -1.25, 0.95); p.spine = 0.06; p.shLx = -0.7; p.elL = -0.8; mugArm(p, ph); break;
    case "bean": sit(a.seatH, -1.2, 1.15); p.spine = -0.38; p.headX = 0.35; p.shLx = p.shRx = -0.9; p.elL = p.elR = -1.25; p.shLz = 0.15; p.shRz = -0.15; break;
    case "mug": mugArm(p, ph); p.headY = Math.sin(ph * 0.3) * 0.35; break;
    case "arcade": p.spine = 0.1; p.headX = 0.12; p.shLx = p.shRx = -0.95; p.elL = -0.45 + Math.sin(ph * 9) * 0.1; p.elR = -0.45 + Math.sin(ph * 11 + 2) * 0.12; p.hipsY = 0.92 + Math.sin(ph * 4) * 0.01; break;
    case "present": p.headY = Math.sin(ph * 0.5) > 0.2 ? 0.85 : -0.1; p.shLz = 1.15; p.shLx = -0.35; p.elL = -0.1; p.shRx = -0.5 + Math.sin(ph * 2) * 0.25; p.elR = -1.0; break;
  }
  return p;
}
function applyPose(h, p, k) {
  const L = (o, prop, v) => { o[prop] += (v - o[prop]) * k; };
  L(h.hips.position, "y", p.hipsY); L(h.spine.rotation, "x", p.spine); L(h.head.rotation, "x", p.headX); L(h.head.rotation, "y", p.headY);
  L(h.shL.rotation, "x", p.shLx); L(h.shL.rotation, "z", p.shLz); L(h.shR.rotation, "x", p.shRx); L(h.shR.rotation, "z", p.shRz);
  L(h.elL.rotation, "x", p.elL); L(h.elR.rotation, "x", p.elR);
  L(h.hipL.rotation, "x", p.hipL); L(h.hipR.rotation, "x", p.hipR); L(h.knL.rotation, "x", p.knL); L(h.knR.rotation, "x", p.knR);
}

// =====================================================================
// AKTOR: data -> tujuan -> jalan (A*) -> pose
// =====================================================================
const actors = {};
const pickables = [];
let labelMode = "ringkas";
try { labelMode = localStorage.getItem("office3d-labels") || "ringkas"; } catch { /* abaikan */ }
const LABEL_NEXT = { ringkas: "lengkap", lengkap: "mati", mati: "ringkas" };
const LABEL_TEXT = { ringkas: "🏷 Label: ringkas", lengkap: "🏷 Label: lengkap", mati: "🏷 Label: mati" };
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
let hovered = null;
renderer.domElement.addEventListener("pointermove", (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickables.filter((m) => actors[m.userData.actor] && actors[m.userData.actor].h.root.visible), false)[0];
  hovered = hit ? hit.object.userData.actor : null;
  renderer.domElement.style.cursor = hovered ? "pointer" : "";
});
renderer.domElement.addEventListener("pointerleave", () => { hovered = null; });
let roster = {}, agents = {}, meta = { meeting: { active: false } };
const owner = {}; // spotId -> type
const SOUL_CHATTER = {
  orchestrator: ["Milestone on-track 📋", "Izin lapor, 1 blocker ke CEO", "Kopi hitam dulu sambil cek agenda", "Catat di notulen executive", "Format laporan maks 10 baris"],
  architect: ["Arsitektur modular siap di-scale", "Hindari over-engineering, buat simpel", "Skema database SaaS aman", "Cek integrasi backend telemetry", "Teh pekat biar fokus debugging"],
  maker3d: ["Overhang 45° aman, minim support", "Toleransi snap-fit 0.35mm presisi", "Ganti spool filamen PLA matte pastel", "Nozzle 0.4mm Bambu Lab lancar", "Kalkulasi: 38 gram PLA, siap cetak"]
};
const CHATTER = ["Ngopi dulu ☕", "Nunggu keputusan CEO", "Rehat 5 menit"];
const MEET_CHATTER = ["Masuk ASUMSI atau butuh BLOKIR CEO?", "Rekomendasi teknis kita opsi A", "Pastikan acceptance criteria teruji", "Sinkronkan ke folder Drive yang tepat", "Catat di notulen executive"];

function spawnActors() {
  Object.keys(SEAT_TYPES).forEach((type, idx) => {
    const color = (roster[type] && roster[type].color) || DEFAULT_COLORS[type];
    const h = makeHuman(STYLE[type] || STYLE.backend, color);
    scene.add(h.root);
    const s = SPOTS["desk:" + type];
    const wrap = document.createElement("div"); wrap.className = "label3d";
    const bubble = document.createElement("div"); bubble.className = "bubble3d"; bubble.style.display = "none";
    const tag = document.createElement("div"); tag.className = "tag3d";
    wrap.appendChild(bubble); wrap.appendChild(tag);
    const lbl = new CSS2DObject(wrap); lbl.position.set(0, 0.52, 0); h.head.add(lbl);
    actors[type] = { wrap, hover: false, type, idx, h, x: s.x, z: s.z, ry: s.ry, targetRy: s.ry, spot: s, atSpot: true, path: [], moving: false, walkPhase: 0, pose: "deskIdle", seatH: s.seatH, monitors: MONITORS[type] || 2, tag, bubble, bubbleUntil: 0, nextChat: 3000 + idx * 1700, lastTag: "" };
    owner[s.id] = type;
    h.root.traverse((o) => { if (o.isMesh) { o.userData.actor = type; pickables.push(o); } });
    h.root.position.set(s.x, 0, s.z); h.root.rotation.y = s.ry;
    applyPose(h, targetPose(actors[type], 0), 1);
  });
}
function wantedSpot(a) {
  const ag = agents[a.type], quotaOut = meta.quota && meta.quota.status !== "ok";
  const m = meta.meeting && meta.meeting.active ? meta.meeting : null;
  const parts = m ? (m.participants || []).filter((t) => actors[t]) : [];
  if (!quotaOut && m && parts.includes(a.type)) {
    const others = parts.filter((t) => t !== "orchestrator");
    const idx = a.type === "orchestrator" ? 0 : 1 + others.indexOf(a.type);
    return SPOTS[MEET_IDS[Math.min(idx, MEET_IDS.length - 1)]];
  }
  if (ag && (ag.status === "istirahat" || quotaOut)) {
    if (a.spot && a.spot.id.startsWith("rest:") && owner[a.spot.id] === a.type) return a.spot;
    const n = REST_IDS.length;
    for (let k = 0; k < n; k++) { const id = REST_IDS[(a.idx * 5 + k) % n]; if (!owner[id] || owner[id] === a.type) return SPOTS[id]; }
  }
  return SPOTS["desk:" + a.type];
}
function goTo(a, s) {
  if (a.spot && owner[a.spot.id] === a.type) delete owner[a.spot.id];
  owner[s.id] = a.type;
  const pts = [];
  let sx = a.x, sz = a.z;
  if (a.atSpot && a.spot) { pts.push([a.spot.ax, a.spot.az]); sx = a.spot.ax; sz = a.spot.az; }
  const mid = astar(sx, sz, s.ax, s.az);
  pts.push(...mid.slice(1), [s.ax, s.az], [s.x, s.z]);
  a.path = pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.05);
  a.spot = s; a.atSpot = false; a.moving = true; a.seatH = s.seatH;
}
function poseFor(a) {
  const s = a.spot, ag = agents[a.type];
  if (s.pose === "desk") return ag && ag.status === "kerja" && !(meta.quota && meta.quota.status !== "ok") ? "type" : "deskIdle";
  return s.pose;
}
function angLerp(a, b, k) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; }

function stepActors(dt, t) {
  const quotaOut = meta.quota && meta.quota.status !== "ok";
  const team = Array.isArray(meta.team) && meta.team.length ? meta.team : null;
  let bubblesShown = 0;
  for (const a of Object.values(actors)) {
    const inTeam = !team || team.includes(a.type);
    a.h.root.visible = inTeam;
    if (!inTeam) { a.wrap.style.display = "none"; const dd = DESKS[a.type]; if (dd) for (const s of dd.screens) if (s.mat.map !== lockTex) { s.mat.map = lockTex; s.mat.needsUpdate = true; } continue; }
    const want = wantedSpot(a);
    if (want !== a.spot) goTo(a, want);
    if (a.path.length) {
      const [tx, tz] = a.path[0], dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz), sp = 1.35 * dt;
      if (d > 0.02) a.targetRy = Math.atan2(dx, dz);
      if (d <= sp) { a.x = tx; a.z = tz; a.path.shift(); } else { a.x += (dx / d) * sp; a.z += (dz / d) * sp; }
      a.walkPhase += dt * 8.5; a.moving = a.path.length > 0;
      if (!a.path.length) a.atSpot = true;
    }
    if (a.atSpot) { a.targetRy = a.spot.ry; a.pose = poseFor(a); }
    a.ry = angLerp(a.ry, a.targetRy, Math.min(1, dt * 8));
    a.h.root.position.set(a.x, 0, a.z); a.h.root.rotation.y = a.ry;
    applyPose(a.h, targetPose(a, t), Math.min(1, dt * 7));
    a.h.mug.visible = !a.moving && ["sofa", "stool", "mug"].includes(a.pose);
    a.h.phone.visible = !a.moving && a.pose === "bean";

    // label nama + status
    const ag = agents[a.type], info = roster[a.type] || {};
    const nick = info.nickname || (ag && ag.nickname) || a.type, role = info.role || a.type;
    const st = !ag ? "belum aktif" : a.moving ? "jalan" : statusLabel(ag);
    const isHover = hovered === a.type;
    const full = isHover || labelMode === "lengkap";
    const tagText = full ? (container.classList.contains("o3d-compact") && !isHover ? `${nick} · ${st}` : `${nick} (${role}) · ${st}`) : nick;
    const showTag = isHover || labelMode === "lengkap" || (labelMode === "ringkas" && ag);
    a.wrap.style.display = showTag ? "" : "none";
    a.wrap.classList.toggle("hover", isHover);
    if (tagText !== a.lastTag) { a.tag.textContent = tagText; a.lastTag = tagText; a.tag.style.background = ag ? info.color || ag.color || "#64748b" : "#8b8f98"; }
    let bub = null;
    if (!a.moving && a.atSpot) {
      if (quotaOut && ag && t > a.bubbleUntil) { bub = meta.quota.status === "habis" ? "Kuota habis, ngopi dulu ☕" : "API error, nunggu perintah"; a.bubbleUntil = t + 5000; a.nextChat = t + 14000; }
      else if ((a.pose === "meet" || a.pose === "present") && t > a.nextChat) { bub = ag && ag.status === "kerja" && ag.lastSummary ? ag.lastSummary : MEET_CHATTER[(a.idx + Math.floor(t / 9000)) % MEET_CHATTER.length]; a.bubbleUntil = t + 4500; a.nextChat = t + 8000 + Math.random() * 7000; }
      else if (a.pose === "type" && ag && ag.lastSummary && t > a.nextChat) { bub = ag.lastSummary; a.bubbleUntil = t + 5000; a.nextChat = t + 11000 + Math.random() * 9000; }
      else if (["sofa", "stool", "mug", "bean", "arcade", "deskIdle"].includes(a.pose) && !quotaOut && t > a.nextChat) {
        const chList = SOUL_CHATTER[a.type] || CHATTER;
        bub = chList[(a.idx + Math.floor(t / 10000)) % chList.length];
        a.bubbleUntil = t + 4500; a.nextChat = t + 11000 + Math.random() * 8000;
      }
    }
    const bubbleAllowed = isHover || labelMode === "lengkap" || (labelMode === "ringkas" && ["type", "meet", "present"].includes(a.pose) && bubblesShown < 3);
    if (bub) { a.bubble.textContent = String(bub).replace(/^Bash: /, "$ ").slice(0, 60); }
    const bubbleOn = bubbleAllowed && t < a.bubbleUntil && a.bubble.textContent;
    a.bubble.style.display = bubbleOn ? "block" : "none";
    if (bubbleOn) bubblesShown++;

    // layar meja: menyala saat pemiliknya mengetik
    const d = DESKS[a.type];
    if (d) {
      const on = a.atSpot && a.spot.id === "desk:" + a.type && a.pose === "type";
      for (const s of d.screens) {
        const w = on ? s.on : lockTex;
        if (s.mat.map !== w) { s.mat.map = w; s.mat.needsUpdate = true; }
        if (on && s.on.wrapT === THREE.RepeatWrapping) s.on.offset.y -= dt * 0.04;
      }
    }
  }
}

// =====================================================================
// KUCING KANTOR
// =====================================================================
const cat = { g: null, tail: null, x: -6.9, z: 4.6, tx: -6.9, tz: 4.6, next: 4000 };
function buildCat() {
  const g = grp(scene, cat.x, 0, cat.z), fur = mat(0xe38b2c, { roughness: 1 }), dark = mat(0xb45309, { roughness: 1 });
  const body = add(g, sph(0.1, 14), fur, 0, 0.15, 0); body.scale.set(1, 0.95, 1.9);
  add(g, sph(0.078, 14), fur, 0, 0.25, 0.19);
  for (const sx of [-1, 1]) { add(g, new THREE.ConeGeometry(0.03, 0.06, 4), dark, sx * 0.045, 0.33, 0.19, 0, 0, sx * -0.2); add(g, sph(0.012, 6), M.eye, sx * 0.03, 0.26, 0.26); }
  for (const [lx, lz] of [[-0.05, 0.12], [0.05, 0.12], [-0.05, -0.12], [0.05, -0.12]]) add(g, cyl(0.022, 0.02, 0.1, 6), fur, lx, 0.05, lz);
  const tail = new THREE.Group(); tail.position.set(0, 0.2, -0.18); g.add(tail);
  add(tail, cap(0.02, 0.2), dark, 0, 0.1, -0.03, -0.5, 0, 0);
  cat.g = g; cat.tail = tail;
}
function stepCat(dt, t) {
  if (!cat.g) return;
  cat.tail.rotation.z = Math.sin(t * 0.003) * 0.5;
  const d = Math.hypot(cat.tx - cat.x, cat.tz - cat.z);
  if (d > 0.05) {
    const sp = 0.5 * dt; cat.x += ((cat.tx - cat.x) / d) * Math.min(sp, d); cat.z += ((cat.tz - cat.z) / d) * Math.min(sp, d);
    cat.g.rotation.y = Math.atan2(cat.tx - cat.x, cat.tz - cat.z); cat.g.position.y = Math.abs(Math.sin(t * 0.02)) * 0.01;
  } else if (t > cat.next) {
    const pts = [[-6.9, 4.6], [-6.0, 2.7], [-7.2, 2.6], [-5.8, 5.0], [-3.2, 3.8], [-6.5, 5.2]];
    [cat.tx, cat.tz] = pts[(Math.random() * pts.length) | 0]; cat.next = t + 9000 + Math.random() * 9000;
  }
  cat.g.position.x = cat.x; cat.g.position.z = cat.z;
}

// =====================================================================
// LABEL ZONA & TOMBOL TEMA
// =====================================================================
function zoneLabel(text, x, y, z) { const d = document.createElement("div"); d.className = "zone3d"; d.textContent = text; const o = new CSS2DObject(d); o.position.set(x, y, z); scene.add(o); }
function setTheme(t) { themeChoice = t; try { localStorage.setItem("office3d-theme", t); } catch { /* abaikan */ } appliedTheme = null; applyTheme(); }
function themeButtons() {
  const box = document.createElement("div"); box.className = "theme3d";
  box.innerHTML = `<button data-t="auto">🕘 Otomatis</button><button data-t="day">☀️ Terang</button><button data-t="night">🌙 Gelap</button><button data-t="reset">↺ Kamera</button><button data-t="labels" class="lbl">${LABEL_TEXT[labelMode]}</button>`;
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.t === "labels") { labelMode = LABEL_NEXT[labelMode]; try { localStorage.setItem("office3d-labels", labelMode); } catch { /* abaikan */ } b.textContent = LABEL_TEXT[labelMode]; document.querySelectorAll(".zone3d").forEach((z) => (z.style.display = labelMode === "mati" ? "none" : "")); return; }
    if (b.dataset.t === "reset") { camera.position.copy(CAM_HOME); controls.target.set(0.3, 0, 0.3); return; }
    setTheme(b.dataset.t);
  });
  container.appendChild(box);
}

// =====================================================================
// LOOP & API
// =====================================================================
const clock = new THREE.Clock();
let lastTick = 0;
function frame() {
  // Tab tersembunyi memperlambat frame; pecah waktu jadi langkah kecil supaya orang tetap sampai tepat waktu
  let left = Math.min(3, clock.getDelta()); const t = performance.now();
  while (left > 1e-4) { const dt = Math.min(0.1, left); stepActors(dt, t); stepCat(dt, t); left -= dt; }
  controls.update();
  if (t - lastTick > 30000) { lastTick = t; drawClock(); drawTV(); applyTheme(); }
  renderer.render(scene, camera); labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}
const api = {
  update(list, rosterIn, metaIn) {
    roster = rosterIn || roster; agents = {}; (list || []).forEach((a) => (agents[a.type] = a)); meta = metaIn || meta;
    refreshBoards();
  },
};
window.office3d = { scene, camera, controls, actors, SPOTS, THREE, setTheme, blocked, GW, GH, CELL, X0, Z0 };

(async () => {
  if (!renderer.getContext()) throw new Error("WebGL tidak tersedia");
  const prev = window.office;
  if (prev && prev._last) roster = prev._last[1] || {};
  if (legacyCanvas) legacyCanvas.style.display = "none";
  container.style.display = "block";
  resize();
  window.office = api;
  buildRoom();
  buildFurniture();
  buildCat();
  spawnActors();
  zoneLabel("Studio Fleek Project", -5.8, 3.1, -3.4);
  zoneLabel("Lab Xavortree (3D & IoT)", -5.8, 3.1, 2.2);
  zoneLabel("Shared Boardroom", 6.3, 3.1, 3.1);
  zoneLabel("Executive Lounge & Pantry", 0.8, 3.1, 0.2);
  themeButtons();
  applyTheme();
  if (prev && prev._last) api.update(...prev._last); else refreshBoards();
  frame();
})().catch((e) => {
  console.error("Kantor 3D gagal, kembali ke canvas 2D:", e);
  container.style.display = "none"; if (legacyCanvas) legacyCanvas.style.display = "block";
});
