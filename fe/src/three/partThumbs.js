/**
 * partThumbs -- anh thu nho 3D cho tung linh kien trong danh sach chon (02.BUILD).
 *
 * Mot WebGLRenderer an duy nhat ve lan luot tung model (hang doi, moi khung 1 anh) -> PNG, luu cache theo (slot, id).
 * Nguon model:
 *   - bus, comm, instrument (INS-01..04, 09), launch: model THAT da bake tu thu vien Python 14-11-2026
 *   - power, battery, OBC, ADCS va cac thiet bi chua co ban ve (INS-05..08, 10): dung bang code o day,
 *     theo hinh dang thuc te cua loai linh kien do (minh hoa, khong phai ban ve ky thuat).
 */
import * as THREE from 'three';
import { buildRocket, buildSatellite, loadIndex, loadModel, loadSatellite } from './modelLoader';

const W = 192, H = 140;
let renderer = null, scene = null, camera = null;
const cache = new Map(); // key -> Promise<dataURL>
const queue = [];
let busy = false;

function setup() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H);
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x40464c, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fd6ff, 0.6); rim.position.set(-4, 2, -3); scene.add(rim);
  camera = new THREE.PerspectiveCamera(30, W / H, 0.01, 100);
}

const M = {
  alu: new THREE.MeshStandardMaterial({ color: 0xc4ccd2, metalness: 0.7, roughness: 0.35 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x30363c, metalness: 0.5, roughness: 0.5 }),
  cell: new THREE.MeshStandardMaterial({ color: 0x18357a, metalness: 0.6, roughness: 0.25, emissive: 0x061230 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd9a531, metalness: 0.85, roughness: 0.3 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.6 }),
  chip: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xb8692e, metalness: 0.8, roughness: 0.35 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.5 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x3a9fd8, metalness: 0.3, roughness: 0.1, emissive: 0x0b3550 }),
  wrap: new THREE.MeshStandardMaterial({ color: 0x2e5fa8, roughness: 0.5 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc8402e, roughness: 0.5 }),
};
const bx = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
const cyl = (r, h, m, x = 0, y = 0, z = 0, seg = 24, axis = 'y') => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); o.position.set(x, y, z);
  if (axis === 'x') o.rotation.z = Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2; return o;
};

// ---------------------------------------------------------------- linh kien dung bang code
function solarWing(g, side, panels, pw, ph, gapX) {
  // canh pin nghieng ~57 do ve phia may anh, neu nam ngang thi anh thu nho chi con mot vach mong
  const wing = new THREE.Group();
  for (let i = 0; i < panels; i++) {
    const x = side * (gapX + pw / 2 + i * (pw + 0.03));
    wing.add(bx(pw, 0.03, ph, M.alu, x, 0, 0), bx(pw * 0.92, 0.035, ph * 0.9, M.cell, x, 0.004, 0));
    for (let k = 1; k < 3; k++) wing.add(bx(pw * 0.92, 0.04, 0.012, M.alu, x, 0.006, -ph * 0.45 + (k * ph * 0.9) / 3));   // duong chia o pin
  }
  wing.rotation.x = 1.0;
  g.add(wing, cyl(0.03, gapX, M.dark, side * gapX / 2, 0, 0, 10, 'x'));
}
const POWER = {
  'PWR-SA-BODY': () => { const g = new THREE.Group(); g.add(bx(0.5, 1.4, 0.5, M.alu)); for (const [x, z, ry] of [[0.255, 0, 0], [-0.255, 0, 0], [0, 0.255, 1]]) { const p = bx(ry ? 0.42 : 0.012, 1.25, ry ? 0.012 : 0.42, M.cell, x, 0, z); g.add(p); } return g; },
  'PWR-SA-DEP': () => { const g = new THREE.Group(); g.add(bx(0.5, 0.8, 0.5, M.alu)); solarWing(g, 1, 2, 0.6, 0.7, 0.3); solarWing(g, -1, 2, 0.6, 0.7, 0.3); return g; },
  'PWR-SA-SMALL': () => { const g = new THREE.Group(); g.add(bx(0.7, 0.7, 0.7, M.gold)); solarWing(g, 1, 3, 0.55, 0.6, 0.45); solarWing(g, -1, 3, 0.55, 0.6, 0.45); return g; },
  'PWR-SA-LARGE': () => { const g = new THREE.Group(); g.add(bx(0.8, 1.1, 0.8, M.gold)); solarWing(g, 1, 5, 0.6, 0.9, 0.5); return g; },
  'PWR-SA-GEO': () => { const g = new THREE.Group(); g.add(bx(0.9, 1.0, 0.9, M.gold)); solarWing(g, 1, 4, 0.7, 1.0, 0.55); solarWing(g, -1, 4, 0.7, 1.0, 0.55); return g; },
};
function cellPack(nx, nz, r = 0.09, h = 0.36) {
  const g = new THREE.Group();
  const w = nx * r * 2.1, d = nz * r * 2.1;
  g.add(bx(w + 0.06, 0.04, d + 0.06, M.dark, 0, -h / 2 - 0.02, 0), bx(w + 0.06, 0.04, d + 0.06, M.dark, 0, h / 2 + 0.02, 0));
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) g.add(cyl(r, h, i % 2 ? M.wrap : M.white, (i - (nx - 1) / 2) * r * 2.1, 0, (k - (nz - 1) / 2) * r * 2.1, 16));
  g.add(bx(0.12, 0.05, 0.05, M.red, w / 2 - 0.05, h / 2 + 0.06, 0));
  return g;
}
const BATTERY = {
  'BAT-S': () => cellPack(2, 2),
  'BAT-M': () => cellPack(4, 3),
  'BAT-L': () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = bx(0.42, 0.62, 0.9, M.dark, (i - 1) * 0.46, 0, 0); g.add(m, bx(0.36, 0.05, 0.84, M.wrap, (i - 1) * 0.46, 0.33, 0)); } return g; },
  'BAT-XL': () => { const g = new THREE.Group(); for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) g.add(bx(0.4, 0.4, 0.4, k % 2 ? M.dark : M.alu, (i - 0.5) * 0.44, k * 0.44 - 0.44, 0)); g.add(bx(0.95, 0.05, 0.5, M.red, 0, 0.7, 0)); return g; },
};
function pcb(y, m = M.pcb) {
  const g = new THREE.Group();
  g.add(bx(0.9, 0.025, 0.9, m, 0, y, 0));
  g.add(bx(0.22, 0.04, 0.22, M.chip, -0.18, y + 0.03, 0.1), bx(0.12, 0.03, 0.18, M.chip, 0.22, y + 0.03, -0.18), bx(0.5, 0.05, 0.08, M.dark, 0, y + 0.035, 0.38));
  return g;
}
const AVIONICS = {
  'OBC-BASIC': () => { const g = new THREE.Group(); g.add(pcb(0)); return g; },
  'OBC-CUBE': () => { const g = new THREE.Group(); [0, 0.22, 0.44].forEach((y) => g.add(pcb(y))); for (const [x, z] of [[0.4, 0.4], [-0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]]) g.add(cyl(0.025, 0.5, M.alu, x, 0.22, z, 8)); return g; },
  'OBC-SPACE': () => { const g = new THREE.Group(); [0, 0.2, 0.4, 0.6].forEach((y) => g.add(pcb(y))); g.add(bx(1.0, 0.8, 0.04, M.alu, 0, 0.3, -0.48)); g.add(bx(0.04, 0.8, 1.0, M.alu, -0.48, 0.3, 0)); return g; },
  'OBC-RADHARD': () => { const g = new THREE.Group(); g.add(bx(1.0, 0.6, 0.8, M.gold)); g.add(bx(0.8, 0.12, 0.06, M.dark, 0, 0.1, 0.43), bx(0.5, 0.12, 0.06, M.dark, 0, -0.1, 0.43)); for (let i = 0; i < 6; i++) g.add(bx(0.03, 0.62, 0.82, M.alu, -0.5 + i * 0.2, 0, 0)); return g; },
  'ADCS-MAG': () => { const g = new THREE.Group(); g.add(cyl(0.06, 1.0, M.copper, 0, 0, -0.25, 16, 'x'), cyl(0.06, 1.0, M.copper, -0.3, 0, 0.1, 16, 'z')); g.add(bx(0.4, 0.4, 0.06, M.pcb, 0.25, 0.05, 0.3)); g.add(bx(0.12, 0.04, 0.12, M.glass, 0.25, 0.28, 0.3)); return g; },
  'ADCS-WHEEL': () => { const g = new THREE.Group(); g.add(bx(1.0, 0.06, 1.0, M.dark, 0, -0.32, 0)); g.add(cyl(0.22, 0.12, M.alu, -0.3, -0.1, -0.2, 28), cyl(0.22, 0.12, M.alu, 0.25, 0.1, -0.25, 28, 'x'), cyl(0.22, 0.12, M.alu, 0, 0.05, 0.28, 28, 'z')); return g; },
  'ADCS-STAR': () => { const g = AVIONICS['ADCS-WHEEL'](); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.42, 20, 1, true), M.dark); st.material.side = THREE.DoubleSide; st.position.set(0.32, 0.25, 0.3); st.rotation.z = -0.5; g.add(st, cyl(0.1, 0.02, M.glass, 0.24, 0.12, 0.3, 20)); return g; },
  'ADCS-FINE': () => { const g = new THREE.Group(); g.add(bx(1.1, 0.06, 1.1, M.dark, 0, -0.35, 0)); for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { const w = cyl(0.17, 0.1, M.alu, x, -0.1, z, 28); w.rotation.set(0.5 * Math.sign(z), 0, 0.5 * Math.sign(x)); g.add(w); } for (const x of [-0.25, 0.25]) { const st = cyl(0.1, 0.4, M.dark, x, 0.35, 0, 18); st.rotation.z = x * 1.4; g.add(st); } g.add(bx(0.24, 0.18, 0.24, M.gold, 0, 0.05, 0)); return g; },
};
function lens(g, r, len, x, y, z, ringMat = M.dark) {
  g.add(cyl(r, len, ringMat, x, y, z + len / 2, 28, 'z'));
  g.add(cyl(r * 0.78, 0.02, M.glass, x, y, z + len + 0.005, 28, 'z'));
  g.add(cyl(r * 1.08, 0.04, M.alu, x, y, z + len - 0.02, 28, 'z'));
}
const INSTR_PROC = {
  // camera RGB nho gon: than den + 1 ong kinh
  'INS-01': () => { const g = new THREE.Group(); g.add(bx(0.6, 0.45, 0.4, M.dark), bx(0.62, 0.06, 0.42, M.alu, 0, 0.25, 0)); lens(g, 0.14, 0.25, 0.05, 0, 0.2); return g; },
  // da pho: 4 ong kinh nho (4 dai pho) tren mot khoi vang
  'INS-02': () => { const g = new THREE.Group(); g.add(bx(0.8, 0.6, 0.45, M.gold)); for (const [x, y] of [[-0.18, 0.13], [0.18, 0.13], [-0.18, -0.13], [0.18, -0.13]]) lens(g, 0.09, 0.15, x, y, 0.22); return g; },
  // hong ngoai nhiet: ong kinh lon + canh tan nhiet
  'INS-03': () => { const g = new THREE.Group(); g.add(bx(0.7, 0.55, 0.5, M.alu)); lens(g, 0.2, 0.3, 0, 0, 0.25, M.gold); for (let i = 0; i < 6; i++) g.add(bx(0.02, 0.5, 0.45, M.dark, -0.36 - i * 0.05, 0, 0)); return g; },
  // sieu pho: than dai + khe hep
  'INS-04': () => { const g = new THREE.Group(); g.add(bx(0.5, 0.45, 1.0, M.white)); lens(g, 0.15, 0.2, 0, 0.05, 0.5); g.add(bx(0.3, 0.03, 0.05, M.chip, 0, -0.12, 0.51)); g.add(bx(0.52, 0.08, 0.6, M.gold, 0, -0.26, -0.1)); return g; },
  // kinh vien vong UV/quang hoc 0.3 m: ong dai + nap che
  'INS-09': () => { const g = new THREE.Group(); const t = cyl(0.3, 1.3, M.white, 0, 0, 0, 32, 'z'); g.add(t, cyl(0.26, 0.02, M.glass, 0, 0, 0.66, 32, 'z'), bx(0.8, 0.8, 0.12, M.gold, 0, 0, -0.7)); const lid = bx(0.6, 0.03, 0.5, M.alu, 0, 0.3, 0.85); lid.rotation.x = -0.6; g.add(lid); return g; },
  'INS-05': () => { const g = new THREE.Group(); g.add(bx(1.4, 0.06, 0.5, M.dark)); for (let i = 0; i < 7; i++) for (let k = 0; k < 3; k++) g.add(bx(0.16, 0.02, 0.12, M.gold, -0.6 + i * 0.2, 0.04, -0.15 + k * 0.15)); g.add(bx(0.3, 0.3, 0.3, M.alu, 0, -0.18, 0)); return g; },
  'INS-06': () => { const g = new THREE.Group(); g.add(bx(0.7, 0.5, 0.6, M.gold)); g.add(cyl(0.16, 0.25, M.dark, 0, 0.35, 0.05, 24)); g.add(cyl(0.12, 0.02, M.glass, 0, 0.48, 0.05, 24)); g.add(bx(0.25, 0.2, 0.25, M.white, 0.3, 0.32, -0.15)); return g; },
  'INS-07': () => { const g = new THREE.Group(); g.add(cyl(0.025, 1.5, M.alu, 0.6, 0, 0, 10, 'x')); g.add(cyl(0.07, 0.16, M.white, 1.35, 0, 0, 18, 'x')); g.add(bx(0.3, 0.3, 0.3, M.gold, -0.2, 0, 0)); return g; },
  'INS-08': () => { const g = new THREE.Group(); g.add(bx(0.6, 0.45, 0.6, M.alu)); for (const [x, ry] of [[-0.15, 0.4], [0.15, -0.4]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.3, 18, 1, true), M.dark); c.material.side = THREE.DoubleSide; c.position.set(x, 0.38, 0); c.rotation.z = ry; g.add(c); } return g; },
  'INS-10': () => { const g = new THREE.Group(); const t = cyl(0.3, 1.1, M.white, 0, 0.3, 0, 30); g.add(t, cyl(0.26, 0.02, M.glass, 0, 0.86, 0, 30), bx(0.9, 0.18, 0.9, M.gold, 0, -0.32, 0)); return g; },
};

// ---------------------------------------------------------------- dung doi tuong cho tung slot
async function objectFor(slot, id) {
  const index = await loadIndex();
  if (slot === 'power') return POWER[id]?.() || null;
  if (slot === 'battery') return BATTERY[id]?.() || null;
  if (slot === 'obc' || slot === 'adcs') return AVIONICS[id]?.() || null;
  if (slot === 'instruments') {
    // uu tien hinh dung rieng (de phan biet tung loai); thieu thi dung model bake cua thu vien
    if (INSTR_PROC[id]) return INSTR_PROC[id]();
    if (index.instruments?.[id]) { const m = await loadModel(index.instruments[id]); if (m) { const r = buildSatellite(m); r.setDeploy(1); return r.root; } }
    return null;
  }
  if (slot === 'comm' && index.comms?.[id]) { const m = await loadModel(index.comms[id]); if (m) { const r = buildSatellite(m); r.setDeploy(1); return r.root; } }
  if (slot === 'bus') {
    const key = Object.keys(index.sats || {}).find((k) => k === `${id}__COM-S-CUBE`) || Object.keys(index.sats || {}).find((k) => k.startsWith(`${id}__`));
    if (key) { const m = await loadSatellite(...key.split('__')); if (m) { const r = buildSatellite(m, { withAdapter: false }); r.setDeploy(1); return r.root; } }
  }
  if (slot === 'launch' && index.rockets?.[id]) { const m = await loadModel(index.rockets[id]); if (m) return buildRocket(m).root; }
  return null;
}

function snap(obj, slot) {
  setup();
  const holder = new THREE.Group();
  holder.add(obj);
  scene.add(holder);
  const box = new THREE.Box3().setFromObject(holder);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  obj.position.sub(centre);
  const r = Math.max(size.x, size.y, size.z) * 0.62 || 1;
  const tall = slot === 'launch';
  const dist = r / Math.tan((camera.fov * Math.PI) / 360) * (tall ? 1.05 : 1.25);
  const dir = tall ? new THREE.Vector3(0.6, 0.15, 0.8) : new THREE.Vector3(0.75, 0.55, 0.9);
  dir.normalize();
  // dat may anh theo hinh cau bao, roi chinh lai khoang cach de vat thuc su lap day khung (vat det/dai bi thua le)
  let d = dist;
  const local = new THREE.Box3().setFromObject(holder);
  const corners = [];
  for (const x of [local.min.x, local.max.x]) for (const y of [local.min.y, local.max.y]) for (const z of [local.min.z, local.max.z]) corners.push(new THREE.Vector3(x, y, z));
  for (let it = 0; it < 3; it++) {
    camera.position.copy(dir).multiplyScalar(d);
    camera.near = d / 50; camera.far = d * 6; camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    const ext = Math.max(...corners.map((c) => { const p = c.clone().project(camera); return Math.max(Math.abs(p.x), Math.abs(p.y)); }));
    if (!isFinite(ext) || ext <= 0) break;
    d *= Math.max(0.5, Math.min(2, ext / 0.86));
  }
  camera.position.copy(dir).multiplyScalar(d);
  camera.near = d / 50; camera.far = d * 6; camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(holder);
  return url;
}

function pump() {
  if (busy || !queue.length) return;
  busy = true;
  const job = queue.shift();
  requestAnimationFrame(async () => {
    try {
      const obj = await objectFor(job.slot, job.id);
      job.resolve(obj ? snap(obj, job.slot) : null);
    } catch {
      job.resolve(null);
    }
    busy = false;
    pump();
  });
}

/** Anh thu nho (data URL) cua linh kien, hoac null neu chua co hinh. Lan dau ve, lan sau lay tu cache. */
export function partThumb(slot, id) {
  const key = `${slot}:${id}`;
  if (!cache.has(key)) cache.set(key, new Promise((resolve) => { queue.push({ slot, id, resolve }); pump(); }));
  return cache.get(key);
}
