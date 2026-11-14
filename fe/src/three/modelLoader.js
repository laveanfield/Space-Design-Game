/**
 * modelLoader -- nap model 3D that (da xuat san boi be/tools/14-11-2026-bake_models3d.py) cho Three.js.
 *
 * Moi model = 1 file .json (mo ta) + 1 file .bin (toa do int16, phap tuyen int8, mau uint8, chi so).
 * - Chi tai model dang can, va giu lai trong bo nho (cache) -> lan sau khong tai lai.
 * - Hinh hoc (BufferGeometry) va vat lieu dung chung, nen doi linh kien khong phai dung lai tu dau.
 * He truc cua model: z huong len, don vi met. Ham build* tra ve nhom da xoay sang he y-up cua Three.js.
 */
import * as THREE from 'three';

const BASE = '/models/';
const cache = new Map(); // ten file -> Promise
let indexPromise = null;

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const LINEAR_LUT = Float32Array.from({ length: 256 }, (_, i) => srgbToLinear(i / 255));

// Vat lieu dung chung: than (mau theo dinh) va tam pin mat troi (bong hon, hoi phat xanh)
// DoubleSide: cac tam mong 1 lop (chao ang-ten, dia, tam pin) phai thay duoc ca 2 mat, giong Ursina double_sided=True.
// Chieu quan tam giac da duoc sua khop phap tuyen luc bake, nen anh sang 2 mat deu dung.
export const MATERIALS = {
  hull: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.55, side: THREE.DoubleSide }),
  solar: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.6, roughness: 0.25, emissive: 0x04102e, side: THREE.DoubleSide }),
};

export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(`${BASE}index.json`).then((r) => (r.ok ? r.json() : { sats: {}, rockets: {} })).catch(() => ({ sats: {}, rockets: {} }));
  }
  return indexPromise;
}

/** Giai luong tu hoa 1 luoi trong .bin thanh BufferGeometry. */
function geometryOf(mesh, buffer) {
  const q = new Int16Array(buffer, mesh.p, mesh.nv * 3);
  const n8 = new Int8Array(buffer, mesh.n, mesh.nv * 3);
  const c8 = new Uint8Array(buffer, mesh.c, mesh.nv * 3);
  const pos = new Float32Array(mesh.nv * 3);
  const nor = new Float32Array(mesh.nv * 3);
  const col = new Float32Array(mesh.nv * 3);
  for (let i = 0; i < mesh.nv * 3; i++) {
    const a = i % 3;
    pos[i] = ((q[i] + 32768) / 65535) * mesh.span[a] + mesh.lo[a];
    nor[i] = n8[i] / 127;
    col[i] = LINEAR_LUT[c8[i]];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const idx = mesh.idx16 ? new Uint16Array(buffer, mesh.i, mesh.ni) : new Uint32Array(buffer, mesh.i, mesh.ni);
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  return geo;
}

/** Tai 1 model theo ten file (khong duoi). Tra { info, geos: Map(ten luoi -> BufferGeometry) } hoac null. */
export function loadModel(stem) {
  if (!stem) return Promise.resolve(null);
  if (!cache.has(stem)) {
    cache.set(
      stem,
      (async () => {
        const info = await fetch(`${BASE}${stem}.json`).then((r) => {
          if (!r.ok) throw new Error(`model ${stem}: ${r.status}`);
          return r.json();
        });
        const buffer = await fetch(`${BASE}${info.bin}`).then((r) => r.arrayBuffer());
        const geos = new Map(info.meshes.map((m) => [m.name, geometryOf(m, buffer)]));
        return { info, geos };
      })().catch(() => null)
    );
  }
  return cache.get(stem);
}

export async function loadSatellite(busId, commId) {
  const index = await loadIndex();
  return loadModel(index.sats?.[`${busId}__${commId}`]);
}

export async function loadRocket(vehicleId) {
  const index = await loadIndex();
  return loadModel(index.rockets?.[vehicleId]);
}

// ---------------------------------------------------------------- bai phong (tu game Ursina, toa do y-up, met)
const texLoader = new THREE.TextureLoader();
const siteTex = new Map();
export function siteTexture(name, srgb = true) {
  if (!siteTex.has(name)) {
    const ext = name === 'puff' || name === 'glow' ? 'png' : 'jpg';
    const t = texLoader.load(`${BASE}tex/${name}.${ext}`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    siteTex.set(name, t);
  }
  return siteTex.get(name);
}

const siteCache = new Map();
/** Tai bai phong cho cap (bai, ten lua). Tra { info, group, arms: [Object3D] } hoac null. */
export async function loadSite(siteId, vehicleId) {
  const index = await loadIndex();
  const stem = index.sites?.[`${siteId}__${vehicleId}`];
  if (!stem) return null;
  if (!siteCache.has(stem)) {
    siteCache.set(stem, (async () => {
      const info = await fetch(`${BASE}${stem}.json`).then((r) => r.json());
      const buffer = await fetch(`${BASE}${info.bin}`).then((r) => r.arrayBuffer());
      return { info, buffer };
    })().catch(() => null));
  }
  const raw = await siteCache.get(stem);
  if (!raw) return null;
  const { info, buffer } = raw;
  const group = new THREE.Group();
  const arms = [];
  for (const m of info.meshes) {
    const geo = geometryOf(m, buffer);
    if (m.role === 'arm') {
      // can noi: dung doc truc x tu ban le ve phia ten lua; quay quanh truc dung tai ban le khi T-0
      const pivot = new THREE.Group();
      pivot.position.set(info.pad.hinge_x, info.arms[m.index].y, 0);
      const mesh = new THREE.Mesh(geo, MATERIALS.hull);
      mesh.rotation.x = -Math.PI / 2; // luoi can noi la z-up (giong ten lua)
      pivot.add(mesh);
      group.add(pivot);
      arms.push(pivot);
      continue;
    }
    const uv = new Float32Array(buffer, m.uv, m.nv * 2);
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const alpha = new Uint8Array(buffer, m.a, m.nv);
    const col = geo.getAttribute('color');
    const rgba = new Float32Array(m.nv * 4);
    for (let i = 0; i < m.nv; i++) { rgba[i * 4] = col.array[i * 3]; rgba[i * 4 + 1] = col.array[i * 3 + 1]; rgba[i * 4 + 2] = col.array[i * 3 + 2]; rgba[i * 4 + 3] = alpha[i] / 255; }
    geo.setAttribute('color', new THREE.BufferAttribute(rgba, 4));
    const shadow = m.name === 'shadow';
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, map: m.tex ? siteTexture(m.tex) : null, side: THREE.DoubleSide,
      roughness: 1 - Math.min(0.9, m.gloss || 0) * 0.8, metalness: m.name === 'steel' ? 0.35 : 0.0,
      transparent: shadow, depthWrite: !shadow, polygonOffset: shadow, polygonOffsetFactor: -2,
    });
    if (shadow) { mat.color.set(0x000000); }
    group.add(new THREE.Mesh(geo, mat));
  }
  return { info, group, arms };
}

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / Math.max(b - a, 1e-9)));
  return t * t * (3 - 2 * t);
};

/**
 * Ve tinh co khop: than + adapter + cac bo phan (canh pin, roi ang-ten...) gap/mo theo f = 0..1.
 * Cung cong thuc voi part_transforms() ben Python: goc = a0 + (a1 - a0) * smoothstep(ts, te, f).
 */
export function buildSatellite(model, { withAdapter = true } = {}) {
  const { info, geos } = model;
  const inner = new THREE.Group(); // he z-up cua model
  const partGroups = info.parts.map(() => new THREE.Group());
  info.parts.forEach((p, i) => {
    partGroups[i].position.fromArray(p.pivot);
    (p.parent < 0 ? inner : partGroups[p.parent]).add(partGroups[i]);
  });
  for (const m of info.meshes) {
    if (m.role === 'adapter' && !withAdapter) continue;
    const mesh = new THREE.Mesh(geos.get(m.name), m.solar ? MATERIALS.solar : MATERIALS.hull);
    mesh.userData.role = m.role;
    (m.part >= 0 ? partGroups[m.part] : inner).add(mesh);
  }
  const axes = info.parts.map((p) => new THREE.Vector3().fromArray(p.axis).normalize());
  const setDeploy = (f) => {
    info.parts.forEach((p, i) => {
      partGroups[i].quaternion.setFromAxisAngle(axes[i], p.a0 + (p.a1 - p.a0) * smoothstep(p.ts, p.te, f));
    });
  };
  setDeploy(0);
  const root = new THREE.Group();
  inner.rotation.x = -Math.PI / 2; // z-up -> y-up
  root.add(inner);
  return { root, inner, info, setDeploy, hasMovingParts: info.parts.length > 0 };
}

/** Ten lua: moi tang, booster, nua fairing la mot nhom rieng de tach tang / bung fairing / vo vun khi no. */
export function buildRocket(model) {
  const { info, geos } = model;
  const inner = new THREE.Group();
  const groups = { stages: [], boosters: [], fairing: [], payload: null, extras: [] };
  for (const m of info.meshes) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geos.get(m.name), MATERIALS.hull));
    g.userData = { role: m.role, index: m.index ?? 0, lo: m.lo, span: m.span };
    inner.add(g);
    if (m.role === 'stage') groups.stages[m.index] = g;
    else if (m.role === 'booster') groups.boosters[m.index] = g;
    else if (m.role === 'fairing') groups.fairing[m.index] = g;
    else if (m.role === 'payload') groups.payload = g;
    else groups.extras.push(g);
  }
  const root = new THREE.Group();
  inner.rotation.x = -Math.PI / 2;
  root.add(inner);
  return { root, inner, info, ...groups };
}
