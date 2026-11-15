/**
 * padDetail -- lop CHI TIET THEM cho bai phong mat dat (chong len bai da bake tu game Ursina), tham khao anh hoat hinh bai phong Ariane 6:
 *
 *   - 4 COT THU LOI giàn khung (lattice) cao, to, thon dan, co binh dai, den bao do o dinh, sat quanh be phong
 *   - CONG ONG XA bang be tong (khoi vuong, cua den, tuong canh loe) o dau hao lua, kem DOC bac thang (co ke ngang) tu cong xuong dat
 *   - DEN PHA nhieu bong tren cot cao, DAY ONG / GIA CAP chay tu chan thap toi be, CHAN BE phong son xanh
 *   - THAP phuc vu op tam xanh co CHU TEN TEN LUA dung doc (chi ten phuong tien, khong co logo that), cua so dien xanh la
 *
 * Toa do: he canh cua Launch3DCanvas (y huong len, ten lua o goc toa do, mat dat y = 0). Tat ca hinh khoi chi la MINH HOA.
 * Hinh hoc ghep thanh vai luoi lon (it draw call): thep, son, be tong, den, lop op thap.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const Y = new THREE.Vector3(0, 1, 0);
const ONE = new THREE.Vector3(1, 1, 1);

const MAT = {
  steel: new THREE.MeshStandardMaterial({ color: 0xcfd4da, metalness: 0.45, roughness: 0.48 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x6d747c, metalness: 0.5, roughness: 0.5 }),
  white: new THREE.MeshStandardMaterial({ color: 0xeceef1, metalness: 0.1, roughness: 0.6 }),
  red: new THREE.MeshStandardMaterial({ color: 0xd2402a, metalness: 0.15, roughness: 0.55 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x1d52a6, metalness: 0.25, roughness: 0.5 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xb4b5b0, metalness: 0.0, roughness: 0.96 }),
  concreteLight: new THREE.MeshStandardMaterial({ color: 0xc9cac4, metalness: 0.0, roughness: 0.96 }),
  black: new THREE.MeshStandardMaterial({ color: 0x050607, metalness: 0.2, roughness: 0.9 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xe8b520, metalness: 0.2, roughness: 0.6 }),
  lamp: new THREE.MeshBasicMaterial({ color: 0xfff1c6 }),
  beacon: new THREE.MeshBasicMaterial({ color: 0xff3a24 }),
};

const quat = new THREE.Quaternion();
const mat4 = new THREE.Matrix4();

/** Thanh hop (box) noi hai diem a -> b, tiet dien t x t. */
function member(a, b, t) {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  const g = new THREE.BoxGeometry(t, len, t);
  quat.setFromUnitVectors(Y, d.normalize());
  mat4.compose(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), quat, ONE);
  return g.applyMatrix4(mat4);
}

function box(w, h, d, x, y, z) {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
}

function merge(geos, material) {
  if (!geos.length) return null;
  const merged = mergeGeos(geos);
  return new THREE.Mesh(merged, material);
}

// gop hinh hoc (cung thuoc tinh: toan bo la Box / Sphere co chi so) -> 1 luoi
const mergeGeos = (geos) => mergeGeometries(geos, false);

// ---------------------------------------------------------------- cot thu loi giàn khung
/**
 * Cot thu loi: 4 chan thon dan, thanh ngang moi khoang, cheo X xen ke, binh dai cu 20 m, 25 % tren cung son do / trang, den bao dinh.
 * steel/accent la 2 mang geometry de ghep thanh 2 luoi.
 */
function latticeMast(steel, accent, { x, z, h, w0, w1, bays, base = 0 }) {
  const hw = (y) => (w0 + (w1 - w0) * (y / h)) / 2;
  const legT = Math.max(0.5, w0 * 0.075);
  const braceT = legT * 0.45;
  for (let i = 0; i < bays; i++) {
    const y0 = base + (i * h) / bays;
    const y1 = base + ((i + 1) * h) / bays;
    const painted = i / bays > 0.74 && i % 2 === 0; // 25 % tren cung son do trang xen ke
    const target = painted ? accent : steel;
    const c0 = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => new THREE.Vector3(x + sx * hw(y0 - base), y0, z + sz * hw(y0 - base)));
    const c1 = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => new THREE.Vector3(x + sx * hw(y1 - base), y1, z + sz * hw(y1 - base)));
    for (let k = 0; k < 4; k++) {
      target.push(member(c0[k], c1[k], legT)); // chan
      target.push(member(c1[k], c1[(k + 1) % 4], braceT * 1.1)); // thanh ngang
      // cheo X xen ke theo khoang
      const a = i % 2 === 0 ? c0[k] : c0[(k + 1) % 4];
      const b = i % 2 === 0 ? c1[(k + 1) % 4] : c1[k];
      target.push(member(a, b, braceT));
    }
    // binh dai (platform) cu ~20 m: ban + lan can
    if (i > 0 && Math.round(((y0 - base) / h) * 5) !== Math.round(((y0 - base - h / bays) / h) * 5) && y0 - base < h * 0.9) {
      const w = hw(y0 - base) * 2 + 1.2;
      steel.push(box(w, 0.14, w, x, y0, z));
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) steel.push(member(new THREE.Vector3(x + (sx * w) / 2, y0, z + (sz * w) / 2), new THREE.Vector3(x + (sx * w) / 2, y0 + 1.1, z + (sz * w) / 2), 0.1));
      steel.push(box(w, 0.08, 0.08, x, y0 + 1.1, z - w / 2), box(w, 0.08, 0.08, x, y0 + 1.1, z + w / 2));
    }
  }
  // dinh: cot thu loi + cau den bao
  const spike = member(new THREE.Vector3(x, base + h, z), new THREE.Vector3(x, base + h + Math.max(5, h * 0.07), z), 0.2);
  steel.push(spike);
  return new THREE.Vector3(x, base + h + Math.max(5, h * 0.07), z);
}

// ---------------------------------------------------------------- den pha
function floodlightPole(steel, lamps, { x, z, h, rows = 2, cols = 4, base = 0 }) {
  h += base;
  steel.push(member(new THREE.Vector3(x, base, z), new THREE.Vector3(x, h, z), 0.5));
  steel.push(box(rows * 1.3 + 0.8, 0.3, cols * 1.3 + 0.8, x, h + 0.1, z)); // khung dau cot
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      lamps.push(box(1.0, 0.8, 0.5, x + (r - (rows - 1) / 2) * 1.3, h + 0.9, z + (c - (cols - 1) / 2) * 1.3));
    }
  }
  steel.push(box(0.4, 0.4, 0.4, x, base + 1.6, z + 0.6)); // hop dien chan cot
}

// ---------------------------------------------------------------- texture lop op thap (chu dung)
function towerTexture(name, heightM, widthM) {
  const W = 256;
  const Hpx = Math.round(W * (heightM / widthM));
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = Math.min(4096, Hpx);
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#173f80');
  grad.addColorStop(0.5, '#1f56ad');
  grad.addColorStop(1, '#173f80');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, cv.height);
  // khoang son (cu ~ 14 m): vach ngang dam
  const bay = (cv.height / heightM) * 14;
  g.fillStyle = 'rgba(8,20,48,0.55)';
  for (let y = bay; y < cv.height; y += bay) g.fillRect(0, y - 3, W, 6);
  // cua so dien (xanh la) o cot trai
  g.fillStyle = '#5be07e';
  for (let y = bay * 0.35; y < cv.height - bay * 0.5; y += bay * 0.5) g.fillRect(14, y, 26, 12);
  // chu ten tên lua XEP DOC, mau trang, phia phai
  const letters = (name || '').replace(/[^A-Z0-9\- ]/g, '').split('');
  g.fillStyle = '#f4f6fa';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const step = Math.min(120, (cv.height * 0.8) / Math.max(1, letters.length));
  g.font = `bold ${Math.round(step * 0.82)}px "Arial Black", Impact, sans-serif`;
  const y0 = cv.height * 0.12;
  letters.forEach((ch, i) => { if (ch !== ' ') g.fillText(ch, W * 0.68, y0 + i * step); });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** "Ariane 6 (A62)" -> "ARIANE 6" */
const shortName = (n) => String(n || '').split('(')[0].trim().toUpperCase();

/**
 * Tao lop chi tiet. pad = site.info.pad (rocket_y, tower_x, table_top, Y0, hs, tel, tower_top ...), H, R = kich thuoc ten lua.
 * Tra { group, dispose }.
 */
export function buildPadDetail({ pad, H, R, vehicleName }) {
  const group = new THREE.Group();
  group.name = 'pad-detail';
  const disposables = [];
  const tel = Boolean(pad.tel);
  const hs = pad.hs || Math.max(4.2, 1.28 * R);
  const steel = [];
  const accent = [];
  const lamps = [];
  const concrete = [];
  const concreteLight = [];
  const dark = [];
  const blue = [];
  const yellow = [];
  const beacons = [];

  // ---- 1) 4 cot thu loi giàn khung sat quanh be phong
  const mh = Math.max(tel ? 34 : 70, H * (tel ? 1.7 : 1.4));
  const w0 = Math.max(4.6, mh * 0.075);
  const dx = tel ? 44 : 66;
  const dz = tel ? 40 : 60;
  const Y0 = pad.Y0 ?? 6;
  const TB = pad.table_top ?? 9.5;
  const deckBase = tel ? 0 : Y0; // cot nam tren san be tong khu be phong (cao Y0) neu khong phai bai TEL
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const top = latticeMast(steel, accent, { x: sx * dx, z: sz * dz, h: mh, w0, w1: w0 * 0.28, bays: Math.max(8, Math.round(mh / 6)), base: deckBase });
    beacons.push(new THREE.SphereGeometry(0.7, 10, 8).translate(top.x, top.y + 0.7, top.z));
  }

  // ---- 2) den pha nhieu bong (cot cao) quanh khu be phong
  const poles = tel ? [[-30, 30], [30, -30]] : [[40, 40], [-26, 44], [40, -40], [-26, -44], [0, 76], [0, -76]];
  for (const [x, z] of poles) floodlightPole(steel, lamps, { x, z, h: tel ? 24 : 34, base: !tel && Math.abs(z) < 64 ? Y0 : 0 });

  if (!tel) {
    // ---- 3) chan be phong son xanh (op quanh vong thep be)
    const o = hs + 8 + 0.06;
    const yc = (Y0 + TB) / 2;
    const hh = TB - Y0 + 0.2;
    for (const sg of [-1, 1]) {
      blue.push(box(2 * o, hh, 0.14, 0, yc, sg * o), box(0.14, hh, 2 * o, sg * o, yc, 0));
      yellow.push(box(2 * o + 0.3, 0.3, 0.2, 0, TB + 0.12, sg * (o + 0.05)), box(0.2, 0.3, 2 * o + 0.3, sg * (o + 0.05), TB + 0.12, 0));
    }

    // ---- 4) CONG ONG XA be tong o dau hao lua (+x, huong ra bien) + canh loe + doc bac thang
    const ex = hs + 8 + 18; // dau cong, sau chan be
    const pw = 2 * (hs + 3.2); // rong cong
    const ph = 8.6; // cao cong
    const pd = 15; // sau cong
    concrete.push(box(pd, ph, pw, ex + pd / 2, ph / 2, 0)); // khoi cong
    concreteLight.push(box(pd + 0.8, 0.9, pw + 1.2, ex + pd / 2, ph + 0.45, 0)); // mu cong
    dark.push(box(0.5, ph * 0.66, pw * 0.58, ex + pd - 0.2, ph * 0.4, 0)); // cua ra (den, lom sau)
    dark.push(box(0.5, ph * 0.66, pw * 0.58, ex + 0.2, ph * 0.4, 0)); // cua vao (mat huong be: dong lua di vao ong)
    yellow.push(box(0.3, 0.5, pw * 0.64, ex + pd + 0.02, ph * 0.76, 0)); // vach canh bao tren cua
    // 2 canh loe 30 do hai ben cua ra
    for (const sg of [-1, 1]) {
      const wing = box(10, ph * 0.8, 1.2, 0, 0, 0);
      wing.rotateY(sg * -0.55).translate(ex + pd + 4.2, ph * 0.4, sg * (pw / 2 + 2.6));
      concrete.push(wing);
    }
    // doc bac thang: tu mat cong xuong dat, co ke ngang giong anh tham khao
    const steps = 9;
    const rampL = 44;
    for (let i = 0; i < steps; i++) {
      const y = ph * (1 - (i + 1) / steps);
      const sx0 = ex + pd + 1.2 + (rampL * i) / steps;
      concrete.push(box(rampL / steps + 0.05, Math.max(0.2, y), pw * 0.88 - i * 0.9, sx0 + rampL / steps / 2, Math.max(0.1, y) / 2, 0));
      concreteLight.push(box(rampL / steps + 0.15, 0.16, pw * 0.88 - i * 0.9 + 0.2, sx0 + rampL / steps / 2, y + 0.08, 0)); // ke ngang sang
    }

    // ---- 5) day ong / gia cap tu chan thap toi be (4 ong song song tren cac khung be tong)
    const tx = pad.tower_x ?? -(R + 40);
    const x0 = tx + 8;
    const x1 = -(hs + 9);
    const rackZ = hs + 2.2; // hanh lang giua tuong hao lua va san be tong
    const pipeCols = [steel, yellow, blue, steel];
    for (let k = 0; k < 4; k++) {
      const z = rackZ + (k - 1.5) * 0.9;
      pipeCols[k].push(member(new THREE.Vector3(x0, 1.4 + (k % 2) * 0.5, z), new THREE.Vector3(x1, 1.4 + (k % 2) * 0.5, z), 0.34));
    }
    for (let x = x0; x < x1; x += 9) {
      concreteLight.push(box(1.2, 1.2, 4.6, x, 0.6, rackZ));
      steel.push(box(0.3, 1.6, 4.0, x, 1.6, rackZ));
    }

    // ---- 6) lop op xanh + chu dung cho THAP phuc vu
    const topY = pad.tower_top ?? 78;
    const hTower = topY - Y0 - 4;
    const wTower = 11.6;
    const tex = towerTexture(shortName(vehicleName), hTower, wTower);
    disposables.push(tex);
    const clad = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.2, roughness: 0.55 });
    disposables.push(clad);
    for (const sg of [-1, 1]) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(wTower, hTower), clad);
      plane.position.set(tx, Y0 + 2 + hTower / 2, sg * 6.07);
      if (sg < 0) plane.rotation.y = Math.PI;
      group.add(plane);
    }
  }

  const add = (geos, material) => {
    const m = merge(geos, material);
    if (m) group.add(m);
  };
  add(steel, MAT.steel);
  add(accent, MAT.red);
  add(concrete, MAT.concrete);
  add(concreteLight, MAT.concreteLight);
  add(dark, MAT.black);
  add(blue, MAT.blue);
  add(yellow, MAT.yellow);
  add(lamps, MAT.lamp);
  add(beacons, MAT.beacon);
  return {
    group,
    dispose() {
      group.traverse((o) => o.geometry?.dispose());
      disposables.forEach((d) => d.dispose());
    },
  };
}
