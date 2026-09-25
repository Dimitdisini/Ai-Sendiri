// Kantor 3D Team Dimitri — Three.js + aset CC0 Kenney (Furniture Kit, Mini Characters).
// Mengganti office.js (canvas 2D) bila WebGL tersedia. API sama: window.office.update(agents, roster, meta).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";

const container = document.getElementById("office3d");
const legacyCanvas = document.getElementById("officeCanvas");
if (!container) throw new Error("#office3d tidak ada");

// ---------- Tata letak (grid meter, x ke kanan, z ke bawah layar) ----------
const GRID_W = 17, GRID_H = 10;
const MEET_X = 10.5, MEET_Y = 5.6;
const SEATS = {
  "business-analyst": { x: 2, y: 1.6 }, pm: { x: 4, y: 1.6 }, analyst: { x: 6, y: 1.6 }, "ai-engineer": { x: 8, y: 1.6 },
  backend: { x: 2, y: 4.6 }, frontend: { x: 4, y: 4.6 }, data: { x: 6, y: 4.6 }, devops: { x: 8, y: 4.6 },
  qa: { x: 2, y: 7.6 }, "chief-of-staff": { x: 4, y: 7.6 }, orchestrator: { x: 7.2, y: 7.6 },
};
const CHAR_MODEL = {
  orchestrator: "male-a", "business-analyst": "female-a", pm: "female-b", analyst: "male-b", "ai-engineer": "female-c",
  backend: "male-c", frontend: "male-d", data: "female-d", devops: "male-e", qa: "female-e", "chief-of-staff": "male-f",
};
const MEETING_SEATS = [{ x: 11.6, y: 2.7 }, { x: 12.7, y: 1.55 }, { x: 13.8, y: 1.55 }, { x: 14.9, y: 1.55 }, { x: 12.7, y: 3.85 }, { x: 13.8, y: 3.85 }, { x: 14.9, y: 3.85 }, { x: 16.1, y: 2.1 }, { x: 16.1, y: 3.3 }].map((p) => ({ ...p, r: Math.atan2(13.95 - p.x, 2.7 - p.y) }));
const BREAK_SPOTS = [{ x: 12.5, y: 8.85, sit: true, r: Math.PI, h: 0.4 }, { x: 13.2, y: 8.85, sit: true, r: Math.PI, h: 0.4 }, { x: 10.95, y: 7.9, sit: true, r: Math.PI / 2, h: 0.4 }, { x: 11.2, y: 9.3, sit: true, r: Math.PI * 0.75, h: 0.38 }, { x: 14.6, y: 7.0, sit: true, r: Math.PI, h: 0.62 }, { x: 15.4, y: 7.0, sit: true, r: Math.PI, h: 0.62 }, { x: 15.7, y: 7.6, r: -Math.PI / 2 }, { x: 14.0, y: 8.3, r: Math.PI }, { x: 13.5, y: 6.6, r: Math.PI }, { x: 12.0, y: 6.8, r: Math.PI }, { x: 15.9, y: 8.7, r: -Math.PI / 2 }];
const CHATTER = ["Ngopi dulu ☕", "Nunggu keputusan CEO", "Rehat bentar", "Tadi QA-nya ketat banget", "Plan berikutnya apa ya?", "Kopi kedua nih", "Main sama kucing kantor 🐈"];
const MEETING_CHATTER = ["Setuju, catat di notulen", "Itu ASUMSI atau BLOKIR?", "Rekomendasiku opsi A", "AC-nya harus bisa diuji", "Tanya CEO dulu yang ini"];

const wx = (gx) => gx - GRID_W / 2;
const wz = (gy) => gy - GRID_H / 2;

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3eee4);
const aspect = () => container.clientWidth / Math.max(1, container.clientHeight);
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
function setCamera() {
  const half = 6.0, a = aspect();
  camera.left = -half * a; camera.right = half * a; camera.top = half; camera.bottom = -half;
  camera.updateProjectionMatrix();
}
camera.position.set(13, 12, 13);
camera.lookAt(0.3, 0, 0.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.pointerEvents = "none";
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.3, 0, 0.2);
controls.enablePan = false;
controls.minZoom = 0.7; controls.maxZoom = 2.2;
controls.maxPolarAngle = Math.PI / 2.3; controls.minPolarAngle = Math.PI / 5;
controls.enableDamping = true;

function resize() {
  const w = container.clientWidth, h = window.OFFICE_STUDIO ? container.clientHeight : Math.round(w * 0.56);
  if (!window.OFFICE_STUDIO) container.style.height = h + "px";
  renderer.setSize(w, h); labelRenderer.setSize(w, h); setCamera();
}
window.addEventListener("resize", resize);

scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cdb4, 1.15));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
sun.position.set(-6, 14, 8); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
scene.add(sun);

// ---------- Ruangan ----------
function floorZone(x0, y0, x1, y1, color) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  m.rotation.x = -Math.PI / 2; m.position.set(wx((x0 + x1) / 2), 0, wz((y0 + y1) / 2)); m.receiveShadow = true; scene.add(m);
}
floorZone(0, 0, MEET_X, GRID_H, 0xead8b4);            // ruang kerja kayu
floorZone(MEET_X, 0, GRID_W, MEET_Y, 0xcfc9e0);       // ruang rapat
floorZone(MEET_X, MEET_Y, GRID_W, GRID_H, 0xbfcdb4);  // sudut istirahat
// garis ubin tipis
const grid = new THREE.GridHelper(Math.max(GRID_W, GRID_H), Math.max(GRID_W, GRID_H), 0xc9b48c, 0xc9b48c);
grid.position.set(wx(GRID_W / 2) - (GRID_W - GRID_H) / 2 + (GRID_W - GRID_H) / 2, 0.005, 0);
grid.material.opacity = 0.18; grid.material.transparent = true; scene.add(grid);

function wall(x0, y0, x1, y1, h, color, opts = {}) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const geo = new THREE.BoxGeometry(len, h, 0.14);
  const mat = opts.glass ? new THREE.MeshPhysicalMaterial({ color: 0xbfe0f2, transparent: true, opacity: 0.28, roughness: 0.1, transmission: 0.2 }) : new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(wx((x0 + x1) / 2), h / 2, wz((y0 + y1) / 2));
  m.rotation.y = -Math.atan2(y1 - y0, x1 - x0);
  m.castShadow = !opts.glass; m.receiveShadow = true; scene.add(m); return m;
}
wall(0, 0, GRID_W, 0, 2.7, 0xe8e2d5);      // dinding belakang
wall(0, 0, 0, GRID_H, 2.7, 0xded7c8);      // dinding kiri
wall(MEET_X, 0, MEET_X, MEET_Y - 1.2, 2.3, 0, { glass: true }); // kaca ruang rapat (dengan celah pintu)
wall(MEET_X, MEET_Y, GRID_W, MEET_Y, 2.3, 0, { glass: true });
// jendela di dinding belakang
for (const x0 of [1.4, 5.4, 12.0]) {
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshStandardMaterial({ color: 0xbfe3f5, emissive: 0x7fc4e8, emissiveIntensity: 0.35 }));
  win.position.set(wx(x0 + 1.3), 1.7, wz(0) + 0.08); scene.add(win);
}

// Papan tulis bertekstur canvas (roadmap di dinding kiri, ruang rapat di dinding belakang)
function makeBoard(w, h) {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return { mesh, cv, tex };
}
const roadBoard = makeBoard(2.6, 1.3); roadBoard.mesh.position.set(wx(0) + 0.08, 1.7, wz(5.0)); roadBoard.mesh.rotation.y = Math.PI / 2; scene.add(roadBoard.mesh);
const statusBoard = makeBoard(2.6, 1.3); statusBoard.mesh.position.set(wx(0) + 0.08, 1.7, wz(8.0)); statusBoard.mesh.rotation.y = Math.PI / 2; scene.add(statusBoard.mesh);
const meetBoard = makeBoard(4.2, 2.2); meetBoard.mesh.position.set(wx(13.9), 1.55, wz(0) + 0.09); scene.add(meetBoard.mesh);
function drawBoard(b, lines, accent, dark) {
  const c = b.cv.getContext("2d");
  c.fillStyle = dark ? "#0f172a" : "#ffffff"; c.fillRect(0, 0, 512, 256);
  c.strokeStyle = dark ? "#334155" : "#9ca3af"; c.lineWidth = 6; c.strokeRect(3, 3, 506, 250);
  c.fillStyle = dark ? "#e2e8f0" : "#1f2430"; c.font = "bold 30px sans-serif"; c.fillText(lines[0] || "", 20, 46);
  c.font = "21px sans-serif"; c.fillStyle = accent || (dark ? "#cbd5e1" : "#374151");
  lines.slice(1, 8).forEach((l, i) => c.fillText(String(l).slice(0, 42), 20, 86 + i * 27));
  b.tex.needsUpdate = true;
}

// ---------- Loader + cache ----------
const loader = new GLTFLoader();
const cache = new Map();
function load(path) {
  if (!cache.has(path)) cache.set(path, new Promise((res, rej) => loader.load(path, (g) => res(g), undefined, rej)));
  return cache.get(path);
}
function prepShadow(o) { o.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); }
// Normalisasi ukuran: skala supaya dimensi terbesar di bidang XZ = target (meter)
function fitXZ(o, target) {
  const b = new THREE.Box3().setFromObject(o); const sz = new THREE.Vector3(); b.getSize(sz);
  const k = target / Math.max(sz.x, sz.z, 0.001); o.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(o); const c = new THREE.Vector3(); b2.getCenter(c);
  o.position.x -= c.x; o.position.z -= c.z; o.position.y -= b2.min.y; // pivot = tengah alas
  return o;
}
async function furniture(name, gx, gy, size, rotY = 0, lift = 0) {
  const g = await load(`/assets/furniture/${name}.glb`);
  const o = g.scene.clone(true); prepShadow(o);
  const group = new THREE.Group(); group.add(o); fitXZ(o, size);
  group.position.set(wx(gx), lift, wz(gy)); group.rotation.y = rotY; scene.add(group); return group;
}

// Strip RGB ala meja gaming: balok tipis emisif berwarna peran
function rgbStrip(gx, gy, width, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.025, 0.025), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8 }));
  m.position.set(wx(gx), 0.63, wz(gy) + 0.33); scene.add(m); return m;
}
async function buildFurniture() {
  const jobs = [];
  // Meja gaming per peran: meja, 3 layar (tengah + 2 miring), keyboard, mouse, strip RGB, kursi
  for (const [type, s] of Object.entries(SEATS)) {
    const big = type === "orchestrator";
    const col = (roster[type] && roster[type].color) || "#7c3aed";
    jobs.push(furniture(big ? "deskCorner" : "desk", s.x, s.y, big ? 1.7 : 1.35, 0));
    jobs.push(furniture("computerScreen", s.x, s.y - 0.14, 0.44, 0, 0.72));
    jobs.push(furniture("computerScreen", s.x - 0.42, s.y - 0.06, 0.4, 0.55, 0.72));
    jobs.push(furniture("computerScreen", s.x + 0.42, s.y - 0.06, 0.4, -0.55, 0.72));
    jobs.push(furniture("computerKeyboard", s.x - 0.05, s.y + 0.16, 0.36, 0, 0.72));
    jobs.push(furniture("computerMouse", s.x + 0.3, s.y + 0.17, 0.1, 0, 0.72));
    if (big) jobs.push(furniture("laptop", s.x + 0.75, s.y + 0.1, 0.38, -0.6, 0.72));
    jobs.push(furniture("chairDesk", s.x, s.y + 0.62, 0.52, Math.PI));
    strips[type] = rgbStrip(s.x, s.y, big ? 1.5 : 1.15, col);
  }
  // Rak estetik sepanjang dinding belakang ruang kerja, selang-seling tinggi/rendah, dengan buku dan tanaman kecil
  for (let i = 0; i < 4; i++) {
    const x = 1.2 + i * 2.1, low = i % 2 === 1;
    jobs.push(furniture(low ? "bookcaseOpenLow" : "bookcaseOpen", x, 0.35, 1.0, 0));
    jobs.push(furniture("books", x - 0.2, 0.35, 0.3, 0, low ? 1.0 : 1.75));
    jobs.push(furniture(i % 2 ? "plantSmall2" : "plantSmall3", x + 0.25, 0.35, 0.28, 0, low ? 1.0 : 1.75));
  }
  jobs.push(furniture("lampRoundFloor", 9.7, 4.0, 0.45)); jobs.push(furniture("coatRackStanding", 9.7, 6.4, 0.4));
  // Ruang rapat: meja panjang, 8 kursi, layar presentasi (papan), tanaman
  jobs.push(furniture("table", 13.15, 2.7, 1.75, 0)); jobs.push(furniture("table", 14.75, 2.7, 1.75, 0));
  for (const ms of MEETING_SEATS.slice(0, 7)) jobs.push(furniture("chairModernCushion", ms.x, ms.y, 0.5, ms.r - Math.PI / 2));
  jobs.push(furniture("pottedPlant", 11.0, 0.7, 0.55)); jobs.push(furniture("pottedPlant", 16.4, 4.9, 0.55));
  jobs.push(furniture("sideTable", 16.4, 1.0, 0.5, -Math.PI / 2)); jobs.push(furniture("speakerSmall", 16.4, 1.0, 0.2, 0, 0.55));
  // Pantry di sepanjang dinding kanan sudut istirahat
  const px = 16.55;
  jobs.push(furniture("kitchenFridgeSmall", px, 6.2, 0.7, -Math.PI / 2));
  jobs.push(furniture("kitchenCabinet", px, 7.0, 0.8, -Math.PI / 2)); jobs.push(furniture("kitchenCoffeeMachine", px, 7.0, 0.38, -Math.PI / 2, 0.9));
  jobs.push(furniture("kitchenCabinetDrawer", px, 7.8, 0.8, -Math.PI / 2)); jobs.push(furniture("kitchenMicrowave", px, 7.8, 0.5, -Math.PI / 2, 0.9));
  jobs.push(furniture("kitchenCabinetUpper", px, 7.0, 0.8, -Math.PI / 2, 1.45)); jobs.push(furniture("kitchenCabinetUpper", px, 7.8, 0.8, -Math.PI / 2, 1.45));
  jobs.push(furniture("kitchenBar", 15.0, 6.4, 1.6, 0)); jobs.push(furniture("stoolBar", 14.6, 7.0, 0.35)); jobs.push(furniture("stoolBar", 15.4, 7.0, 0.35));
  jobs.push(furniture("toaster", 15.4, 6.35, 0.25, 0, 0.95)); jobs.push(furniture("kitchenBlender", 14.7, 6.35, 0.22, 0, 0.95));
  // Sofa sudut keren + meja kaca + karpet + TV
  jobs.push(furniture("loungeSofaCorner", 12.2, 8.9, 2.4, Math.PI));
  jobs.push(furniture("loungeSofa", 10.9, 7.8, 1.5, Math.PI / 2));
  jobs.push(furniture("pillowBlue", 12.0, 8.9, 0.35, 0, 0.42)); jobs.push(furniture("pillow", 13.0, 8.9, 0.35, 0.4, 0.42));
  jobs.push(furniture("tableCoffeeGlass", 12.6, 7.6, 1.1, 0)); jobs.push(furniture("rugRound", 12.6, 7.9, 3.2, 0));
  jobs.push(furniture("cabinetTelevision", 13.9, 9.4, 1.4, Math.PI)); jobs.push(furniture("televisionModern", 13.9, 9.4, 1.1, Math.PI, 0.55));
  jobs.push(furniture("loungeChairRelax", 11.2, 9.3, 0.9, Math.PI / 4));
  jobs.push(furniture("plantSmall1", 12.6, 7.6, 0.25, 0, 0.45)); jobs.push(furniture("pottedPlant", 10.9, 9.5, 0.55));
  jobs.push(furniture("bear", 11.7, 9.6, 0.32, Math.PI / 4)); // kucing kantor versi Kenney
  await Promise.allSettled(jobs);
}

// ---------- Karakter ----------
const actors = {};
let roster = {}, agents = {}, meta = { meeting: { active: false } };

function makeLabel(text, color) {
  const div = document.createElement("div"); div.className = "tag3d"; div.textContent = text; div.style.background = color;
  const bubble = document.createElement("div"); bubble.className = "bubble3d"; bubble.style.display = "none";
  const wrap = document.createElement("div"); wrap.className = "label3d"; wrap.appendChild(bubble); wrap.appendChild(div);
  const obj = new CSS2DObject(wrap); obj.position.set(0, 1.25, 0); return { obj, div, bubble };
}
async function spawnActor(type, i) {
  const g = await load(`/assets/characters/character-${CHAR_MODEL[type] || "male-a"}.glb`);
  const model = skeletonClone(g.scene); prepShadow(model);
  const root = new THREE.Group(); root.add(model);
  const b = new THREE.Box3().setFromObject(model); const s = new THREE.Vector3(); b.getSize(s);
  model.scale.multiplyScalar(0.95 / Math.max(s.y, 0.001)); model.position.y = 0;
  const mixer = new THREE.AnimationMixer(model);
  const clips = {}; for (const c of g.animations) clips[c.name] = mixer.clipAction(c, model);
  const seat = SEATS[type];
  root.position.set(wx(seat.x), 0, wz(seat.y + 0.62)); root.rotation.y = Math.PI; // duduk menghadap meja (ke -z)
  scene.add(root);
  const label = makeLabel(type, "#64748b"); root.add(label.obj);
  actors[type] = { root, mixer, clips, current: null, x: seat.x, y: seat.y + 0.62, tx: seat.x, ty: seat.y + 0.62, faceY: Math.PI, mode: "diam", label, bubbleUntil: 0, nextChat: performance.now() + 3000 + i * 1500, idx: i };
  play(actors[type], "sit");
}
function play(a, name) {
  const next = a.clips[name] || a.clips.idle; if (!next || a.current === next) return;
  next.reset().setEffectiveWeight(1).fadeIn(0.25).play();
  if (a.current) a.current.fadeOut(0.25);
  a.current = next;
}

function step(dt, t) {
  const quotaOut = meta.quota && meta.quota.status !== "ok";
  const meeting = meta.meeting && meta.meeting.active ? meta.meeting : null;
  const participants = meeting ? meeting.participants || [] : [];
  for (const [type, a] of Object.entries(actors)) {
    const ag = agents[type], seat = SEATS[type], info = roster[type] || { nickname: type, role: type, color: "#64748b" };
    const inMeeting = !quotaOut && meeting && participants.includes(type);
    const wantWork = !quotaOut && !inMeeting && ag && ag.status === "kerja";
    const wantBreak = ag && (ag.status === "istirahat" || quotaOut) && !inMeeting;
    let goal = "diam", faceY = Math.PI, sit = true, seatH = 0.42;
    if (inMeeting) { const ms = MEETING_SEATS[Math.min(participants.indexOf(type), MEETING_SEATS.length - 1)]; a.tx = ms.x; a.ty = ms.y; faceY = ms.r; goal = "rapat"; }
    else if (wantWork) { a.tx = seat.x; a.ty = seat.y + 0.62; goal = "kerja"; }
    else if (wantBreak) { const bs = BREAK_SPOTS[a.idx % BREAK_SPOTS.length]; a.tx = bs.x; a.ty = bs.y; goal = "istirahat"; sit = !!bs.sit; faceY = bs.r || 0; seatH = bs.h || 0; }
    else { a.tx = seat.x; a.ty = seat.y + 0.62; }
    const dx = a.tx - a.x, dy = a.ty - a.y, dist = Math.hypot(dx, dy);
    if (dist > 0.04) {
      const sp = 1.4 * dt; a.x += (dx / dist) * Math.min(sp, dist); a.y += (dy / dist) * Math.min(sp, dist);
      a.mode = "jalan"; a.root.rotation.y = Math.atan2(dx, dy); play(a, "walk");
    } else {
      a.mode = goal; a.root.rotation.y = faceY;
      if (goal === "kerja") play(a, t % 6000 < 4500 ? "sit" : "interact-right");
      else if (goal === "rapat" || (goal === "istirahat" && sit) || goal === "diam") play(a, "sit");
      else play(a, "idle");
    }
    const seatedNow = a.mode !== "jalan" && (a.mode === "kerja" || a.mode === "diam" || a.mode === "rapat" || (a.mode === "istirahat" && sit));
    a.root.position.set(wx(a.x), seatedNow ? seatH : 0, wz(a.y));
    // label
    a.label.div.textContent = `${info.nickname} · ${info.role}`;
    a.label.div.style.background = ag ? info.color : "#9ca3af";
    let bubble = null;
    if (quotaOut && ag && t > a.bubbleUntil) { bubble = meta.quota.status === "habis" ? "Kuota habis, ngopi dulu ☕" : "API error, nunggu perintah"; a.bubbleUntil = t + 5000; a.nextChat = t + 12000; }
    else if (a.mode === "rapat" && t > a.nextChat) { bubble = ag && ag.status === "kerja" && ag.lastSummary ? ag.lastSummary.slice(0, 40) : MEETING_CHATTER[(a.idx + Math.floor(t / 9000)) % MEETING_CHATTER.length]; a.bubbleUntil = t + 4500; a.nextChat = t + 7000 + Math.random() * 6000; }
    else if (wantWork && ag.lastSummary && t > a.bubbleUntil) { bubble = ag.lastSummary.slice(0, 40); a.bubbleUntil = t + 6000; }
    else if (wantBreak && !quotaOut && t > a.nextChat) { bubble = CHATTER[(a.idx + Math.floor(t / 10000)) % CHATTER.length]; a.bubbleUntil = t + 4000; a.nextChat = t + 9000 + Math.random() * 6000; }
    if (bubble) { a.label.bubble.textContent = bubble; a.label.bubble.style.display = "block"; }
    if (t > a.bubbleUntil) a.label.bubble.style.display = "none";
    a.mixer.update(dt);
  }
}

// ---------- Loop ----------
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(0.1, clock.getDelta()), t = performance.now();
  step(dt, t); controls.update(); for (const m of benchMixers) m.update(dt);
  renderer.render(scene, camera); labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function refreshBoards() {
  drawBoard(roadBoard, [`Roadmap ${meta.name || ""}`, `${meta.roadmapProgress || 0}% · ${meta.planCount || 0} plan · ${meta.qaReports || 0} QA`, `Tertahan: ${meta.blokir || 0} BLOKIR`, meta.quota && meta.quota.status !== "ok" ? "Kuota: " + meta.quota.status : "Kuota: ok"]);
  const list = Object.values(agents);
  const kerja = list.filter((a) => a.status === "kerja");
  drawBoard(statusBoard, ["Papan Status", `${kerja.length} kerja · ${list.length - kerja.length} istirahat`, ...list.slice(0, 6).map((a) => `${a.nickname}: ${(a.lastSummary || "-").replace(/^Bash: /, "$ ")}`)]);
  const m = meta.meeting && meta.meeting.active;
  if (m) {
    const parts = (meta.meeting.participants || []).map((t) => agents[t]).filter(Boolean);
    drawBoard(meetBoard, [`Presentasi: ${meta.meeting.title || "rapat"}`, `${(meta.meeting.participants || []).length} peserta`, ...parts.slice(0, 5).map((a) => `${a.nickname}: ${a.lastSummary || "-"}`)], "#93c5fd", true);
  } else {
    drawBoard(meetBoard, ["Ruang Rapat", "Layar siap. Tidak ada rapat.", `${meta.name || ""} · ${meta.roadmapProgress || 0}% roadmap`], "#94a3b8", true);
  }
}

// Pasang API yang sama dengan office.js, sembunyikan canvas 2D
let lastArgs = null;
window.office3d = { scene, camera, actors, THREE };
const strips = {}; // untuk debugging dari konsol
const api = {
  update(list, rosterIn, metaIn) {
    lastArgs = [list, rosterIn, metaIn];
    roster = rosterIn || roster; agents = {}; (list || []).forEach((a) => (agents[a.type] = a)); meta = metaIn || meta;
    for (const [t, m] of Object.entries(strips)) { const c = roster[t] && roster[t].color; if (c) { m.material.color.set(c); m.material.emissive.set(c); } }
    refreshBoards();
  },
};

const benchMixers = [];
async function bench() {
  const q = new URLSearchParams(location.search);
  const names = q.get("bench").split(",").filter(Boolean);
  const z = +q.get("zoom") || 1; camera.zoom = z; controls.minZoom = 0.5; controls.maxZoom = 6; camera.updateProjectionMatrix();
  const cx = 2 + (names.length - 1) * 0.8; controls.target.set(wx(cx), 0.4, wz(5)); camera.position.set(wx(cx) + 9, 9, wz(5) + 9);
  for (let i = 0; i < names.length; i++) {
    const g = names[i].startsWith("character-") ? await (async () => { const gl = await load(`/assets/characters/${names[i]}.glb`); const m = skeletonClone(gl.scene); const grp = new THREE.Group(); grp.add(m); fitXZ(m, 0.6); grp.position.set(wx(2 + i * 1.6), 0, wz(5)); scene.add(grp); const mixer = new THREE.AnimationMixer(m); mixer.clipAction(gl.animations.find((a) => a.name === "sit") || gl.animations[0], m).play(); benchMixers.push(mixer); return grp; })() : await furniture(names[i], 2 + i * 1.6, 5, 1.0, 0);
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0.05, 0), 1.0, 0x2563eb, 0.25, 0.15); g.add(arrow);
    const ax = new THREE.AxesHelper(0.8); g.add(ax);
    const lbl = document.createElement("div"); lbl.className = "tag3d"; lbl.style.background = "#1f2430"; lbl.textContent = names[i]; const o = new CSS2DObject(lbl); o.position.set(0, 1.2, 0); g.add(o);
  }
}
(async () => {
  if (!renderer.getContext()) throw new Error("WebGL tidak tersedia");
  if (legacyCanvas) legacyCanvas.style.display = "none";
  container.style.display = "block"; // tampilkan dulu, baru ukur, supaya clientWidth tidak nol
  resize();
  const prev = window.office;
  window.office = api;
  if (new URLSearchParams(location.search).get("bench")) { await bench(); frame(); return; }
  await buildFurniture();
  await Promise.allSettled(Object.keys(SEATS).map((type, i) => spawnActor(type, i)));
  refreshBoards();
  frame();
  if (prev && prev._last) api.update(...prev._last);
})().catch((e) => {
  console.error("Kantor 3D gagal, kembali ke canvas 2D:", e);
  container.style.display = "none"; if (legacyCanvas) legacyCanvas.style.display = "block";
});
