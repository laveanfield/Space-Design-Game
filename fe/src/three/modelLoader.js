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
  alu: new THREE.MeshStandardMaterial({ color: 0xc8d2dc, metalness: 0.65, roughness: 0.35, side: THREE.DoubleSide }),
  dark: new THREE.MeshStandardMaterial({ color: 0x262d34, metalness: 0.5, roughness: 0.45, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ color: 0xdba632, metalness: 0.82, roughness: 0.28, side: THREE.DoubleSide }),
  cell: new THREE.MeshStandardMaterial({ color: 0x163882, metalness: 0.62, roughness: 0.22, emissive: 0x061538, side: THREE.DoubleSide }),
  lens: new THREE.MeshStandardMaterial({ color: 0x38a6e8, metalness: 0.35, roughness: 0.12, emissive: 0x0a2e46, side: THREE.DoubleSide }),
  copper: new THREE.MeshStandardMaterial({ color: 0xbc6c32, metalness: 0.78, roughness: 0.32, side: THREE.DoubleSide }),
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

export async function loadInstruments(insIds = []) {
  if (!insIds?.length) return {};
  const index = await loadIndex();
  const entries = await Promise.all(
    insIds.map(async (id) => {
      const stem = index.instruments?.[id];
      const m = stem ? await loadModel(stem) : null;
      return [id, m];
    })
  );
  return Object.fromEntries(entries);
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

const tagSubsystem = (obj) => {
  obj.traverse((node) => {
    node.userData.role = 'subsystem';
  });
  return obj;
};

/** Tao 1 canh pin mat troi gap/mo (1 hoac 2 doan) cho bus khong co canh san (vi du BUS-3U). */
function addProceduralWing({ inner, dir, pivotPos, panelW, panelH, segs, extraDeployers }) {
  const root = new THREE.Group();
  root.position.fromArray(pivotPos);
  inner.add(root);

  const zAxis = new THREE.Vector3(0, 0, 1);
  const segLen = panelW / segs;
  let parent = root;

  for (let i = 0; i < segs; i++) {
    const segGroup = i === 0 ? root : new THREE.Group();
    if (i > 0) {
      segGroup.position.set(dir * segLen, dir * 0.004 * (i % 2 === 1 ? 1 : -1), 0);
      parent.add(segGroup);
    }
    const frame = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.008, panelH), MATERIALS.alu);
    frame.position.set(dir * segLen * 0.5, 0, 0);
    const cell = new THREE.Mesh(new THREE.BoxGeometry(segLen * 0.92, 0.011, panelH * 0.9), MATERIALS.cell);
    cell.position.set(dir * segLen * 0.5, -0.001, 0);
    segGroup.add(frame, cell);

    const a0 = i === 0 ? (dir > 0 ? -Math.PI / 2 : Math.PI / 2) : dir * (i % 2 === 1 ? Math.PI : -Math.PI);
    const ts = i * 0.25;
    const te = Math.min(1, ts + 0.55);
    extraDeployers.push((f) => {
      segGroup.quaternion.setFromAxisAngle(zAxis, a0 * (1 - smoothstep(ts, te, f)));
    });
    parent = segGroup;
  }
  tagSubsystem(root);
}

/** Tao module tai trong (baked hoac procedural) gan len mat -Y (nadir) cua than ve tinh. */
function buildInstrumentUnit(insId, insModel, unitScale) {
  const g = new THREE.Group();
  if (insModel?.info && insModel?.geos) {
    const baked = new THREE.Group();
    for (const m of insModel.info.meshes) {
      const geo = insModel.geos.get(m.name);
      if (geo) baked.add(new THREE.Mesh(geo, m.solar ? MATERIALS.solar : MATERIALS.hull));
    }
    const box = new THREE.Box3().setFromObject(baked);
    const sz = box.getSize(new THREE.Vector3());
    const ctr = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(sz.x, sz.y, sz.z, 1e-4);
    const k = (unitScale * 0.56) / maxDim;
    baked.scale.setScalar(k);
    baked.position.set(-ctr.x * k, -box.max.y * k, -ctr.z * k);
    g.add(baked);
    return tagSubsystem(g);
  }

  if (insId === 'INS-06' || insId === 'INS-08') {
    // Phased-array SAR / Radar altimeter plate
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(unitScale * 0.54, unitScale * 0.08, unitScale * 0.42),
      MATERIALS.gold
    );
    plate.position.y = -unitScale * 0.1;
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(unitScale * 0.58, unitScale * 0.04, unitScale * 0.46),
      MATERIALS.alu
    );
    trim.position.y = -unitScale * 0.05;
    g.add(trim, plate);
  } else if (insId === 'INS-07' || insId === 'INS-10') {
    // Extendable magnetometer / particle sensor boom
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(unitScale * 0.08, unitScale * 0.1, unitScale * 0.08, 10),
      MATERIALS.dark
    );
    base.position.y = -unitScale * 0.04;
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(unitScale * 0.025, unitScale * 0.03, unitScale * 0.55, 8),
      MATERIALS.alu
    );
    rod.position.y = -unitScale * 0.32;
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(unitScale * 0.095), MATERIALS.gold);
    head.position.y = -unitScale * 0.62;
    g.add(base, rod, head);
  } else {
    // Optical / Spectrometer telescope baffle + coated lens
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(unitScale * 0.17, unitScale * 0.13, unitScale * 0.28, 14),
      MATERIALS.dark
    );
    barrel.position.y = -unitScale * 0.14;
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(unitScale * 0.18, unitScale * 0.18, unitScale * 0.05, 14),
      MATERIALS.gold
    );
    collar.position.y = -unitScale * 0.04;
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(unitScale * 0.13, unitScale * 0.13, unitScale * 0.03, 14),
      MATERIALS.lens
    );
    lens.position.y = -unitScale * 0.27;
    g.add(collar, barrel, lens);
  }
  return tagSubsystem(g);
}

/** Gan module pin, OBC, ADCS len khoang ky thuat de doi linh kien thay ngay tren model 3D. */
function buildServiceModules(design, bx, by, bz) {
  const s = Math.min(bx, by);
  const g = new THREE.Group();

  // 1. Battery pack (-Z / lower service deck): so block tang theo dung luong
  const batId = design.battery || 'BAT-LI-S';
  const blocks = batId.includes('GEO') ? 4 : batId.includes('-L') ? 3 : batId.includes('-M') ? 2 : 1;
  const batMat = batId.includes('GEO') ? MATERIALS.gold : MATERIALS.cell;
  const cellW = s * 0.14;
  for (let i = 0; i < blocks; i++) {
    const cell = new THREE.Mesh(new THREE.BoxGeometry(cellW, s * 0.12, s * 0.16), batMat);
    const ox = (i - (blocks - 1) / 2) * (cellW * 1.18);
    cell.position.set(ox, by * 0.42, bz * 0.16);
    g.add(cell);
  }

  // 2. OBC box (+Y mid-aft): STD (xam), RAD (dong chong buc xa), DUAL (kep vang du phong)
  const obcId = design.obc || 'OBC-STD';
  const obcMat = obcId.includes('DUAL') ? MATERIALS.gold : obcId.includes('RAD') ? MATERIALS.copper : MATERIALS.dark;
  const obcCount = obcId.includes('DUAL') ? 2 : 1;
  for (let i = 0; i < obcCount; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, s * 0.09, s * 0.22), obcMat);
    const ox = obcCount === 2 ? (i === 0 ? -s * 0.13 : s * 0.13) : 0;
    box.position.set(ox, by * 0.52, bz * 0.42);
    g.add(box);
  }

  // 3. ADCS (+Y forward sensor rim): MAG torque rods, RW-3 cluster, STAR twin baffles, CMG spheres
  const adcsId = design.adcs || 'ADCS-MAG';
  if (adcsId.includes('STAR')) {
    [-1, 1].forEach((side) => {
      const baffle = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.09, s * 0.055, s * 0.18, 12), MATERIALS.dark);
      baffle.position.set(side * s * 0.18, by * 0.54, bz * 0.72);
      baffle.rotation.z = -side * 0.42;
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.075, s * 0.075, s * 0.025, 12), MATERIALS.lens);
      lens.position.set(side * s * 0.22, by * 0.61, bz * 0.72);
      lens.rotation.z = -side * 0.42;
      g.add(baffle, lens);
    });
  } else if (adcsId.includes('CMG')) {
    for (let i = -1; i <= 1; i++) {
      const gyro = new THREE.Mesh(new THREE.SphereGeometry(s * 0.09, 12, 12), MATERIALS.gold);
      gyro.position.set(i * s * 0.16, by * 0.54, bz * 0.72);
      g.add(gyro);
    }
  } else if (adcsId.includes('RW')) {
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.14, s * 0.14, s * 0.09, 14), MATERIALS.alu);
    hub.position.set(0, by * 0.53, bz * 0.72);
    g.add(hub);
  } else {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.025, s * 0.025, s * 0.44, 8), MATERIALS.copper);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, by * 0.52, bz * 0.72);
    g.add(rod);
  }

  return tagSubsystem(g);
}

/** Lap rap day du POWER, INSTRUMENTS, BATTERY, OBC, ADCS len model ve tinh. */
function applyDesignToSatellite({ inner, info, partGroups, extraDeployers, design, insModels }) {
  const [bx, by, bz] = info.dims || [0.5, 0.5, 0.6];
  const powerId = design.power || 'PWR-SA-SMALL';

  const wingIndices = [];
  const rightIndices = [];
  const leftIndices = [];
  info.parts.forEach((p, i) => {
    const nm = p.name || '';
    const isWing = Boolean(p.sol) || nm.startsWith('wR') || nm.startsWith('wL');
    if (!isWing) return;
    wingIndices.push(i);
    if (nm.startsWith('wR')) rightIndices.push(i);
    if (nm.startsWith('wL')) leftIndices.push(i);
  });

  if (powerId === 'PWR-SA-BODY') {
    wingIndices.forEach((i) => {
      partGroups[i].visible = false;
    });
    // Pin ap sat 2 mat ben (+X / -X) thay vi canh xoe
    [-1, 1].forEach((dir) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.012, by * 0.78, bz * 0.78), MATERIALS.cell);
      pad.position.set(dir * (bx * 0.5 + 0.008), 0, bz * 0.5);
      const border = new THREE.Mesh(new THREE.BoxGeometry(0.008, by * 0.84, bz * 0.84), MATERIALS.alu);
      border.position.set(dir * (bx * 0.5 + 0.004), 0, bz * 0.5);
      inner.add(tagSubsystem(border), tagSubsystem(pad));
    });
  } else {
    const isLargeSingle = powerId === 'PWR-SA-LARGE';
    const isDepCompact = powerId === 'PWR-SA-DEP';
    const scaleMap = {
      'PWR-SA-DEP': [0.78, 1.0, 0.88],
      'PWR-SA-SMALL': [1.0, 1.0, 1.0],
      'PWR-SA-LARGE': [1.22, 1.0, 1.08],
      'PWR-SA-GEO': [1.28, 1.0, 1.12],
    };
    const [sx, sy, sz] = scaleMap[powerId] || [1, 1, 1];

    const wR0Idx = info.parts.findIndex((p) => p.name === 'wR0');
    const wL0Idx = info.parts.findIndex((p) => p.name === 'wL0');

    if (wR0Idx < 0) {
      addProceduralWing({
        inner,
        dir: 1,
        pivotPos: [bx * 0.5 + 0.008, by * 0.5, bz * 0.5],
        panelW: Math.max(0.28, bx * 1.9) * sx,
        panelH: bz * 0.86 * sz,
        segs: isDepCompact ? 1 : 2,
        extraDeployers,
      });
    } else {
      partGroups[wR0Idx].scale.set(sx, sy, sz);
      if (isDepCompact) {
        rightIndices.forEach((i) => {
          const nm = info.parts[i].name || '';
          if (nm !== 'wR0' && nm !== 'wR1') partGroups[i].visible = false;
        });
      }
    }

    if (isLargeSingle) {
      leftIndices.forEach((i) => {
        partGroups[i].visible = false;
      });
      // Doi trong tu truong phia -X cho cau hinh 1 canh lon
      const boomLen = Math.max(0.22, bx * 0.9);
      const cwBoom = new THREE.Mesh(
        new THREE.CylinderGeometry(Math.min(bx, by) * 0.03, Math.min(bx, by) * 0.04, boomLen, 8),
        MATERIALS.alu
      );
      cwBoom.rotation.z = Math.PI / 2;
      cwBoom.position.set(-(bx * 0.5 + boomLen * 0.5), 0, bz * 0.5);
      const cwTip = new THREE.Mesh(new THREE.SphereGeometry(Math.min(bx, by) * 0.085, 10, 10), MATERIALS.gold);
      cwTip.position.set(-(bx * 0.5 + boomLen), 0, bz * 0.5);
      inner.add(tagSubsystem(cwBoom), tagSubsystem(cwTip));
    } else if (wL0Idx < 0) {
      addProceduralWing({
        inner,
        dir: -1,
        pivotPos: [-(bx * 0.5 + 0.008), by * 0.5, bz * 0.5],
        panelW: Math.max(0.28, bx * 1.9) * sx,
        panelH: bz * 0.86 * sz,
        segs: isDepCompact ? 1 : 2,
        extraDeployers,
      });
    } else {
      partGroups[wL0Idx].scale.set(sx, sy, sz);
      if (isDepCompact) {
        leftIndices.forEach((i) => {
          const nm = info.parts[i].name || '';
          if (nm !== 'wL0' && nm !== 'wL1') partGroups[i].visible = false;
        });
      }
    }
  }

  // Mount Payload Instruments tren khoang -Y
  const insList = design.instruments || [];
  if (insList.length > 0) {
    const unitScale = Math.min(bx, by);
    const cols = insList.length > 2 ? 2 : 1;
    insList.forEach((insId, idx) => {
      const unit = buildInstrumentUnit(insId, insModels?.[insId], unitScale);
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const totalRows = Math.ceil(insList.length / cols);
      const zPos =
        totalRows === 1 ? bz * 0.52 : bz * (0.3 + (row / Math.max(1, totalRows - 1)) * 0.44);
      const xPos = cols === 1 ? 0 : (col === 0 ? -1 : 1) * (bx * 0.22);
      unit.position.set(xPos, -by * 0.5, zPos);
      inner.add(unit);
    });
  }

  // Mount Battery / OBC / ADCS modules
  inner.add(buildServiceModules(design, bx, by, bz));
}

/**
 * Ve tinh co khop: than + adapter + cac bo phan (canh pin, roi ang-ten...) gap/mo theo f = 0..1.
 * Cung cong thuc voi part_transforms() ben Python: goc = a0 + (a1 - a0) * smoothstep(ts, te, f).
 */
export function buildSatellite(model, { withAdapter = true, design = null, insModels = null } = {}) {
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
  const extraDeployers = [];
  if (design) {
    applyDesignToSatellite({ inner, info, partGroups, extraDeployers, design, insModels });
  }
  const axes = info.parts.map((p) => new THREE.Vector3().fromArray(p.axis).normalize());
  const setDeploy = (f) => {
    info.parts.forEach((p, i) => {
      partGroups[i].quaternion.setFromAxisAngle(axes[i], p.a0 + (p.a1 - p.a0) * smoothstep(p.ts, p.te, f));
    });
    extraDeployers.forEach((fn) => fn(f));
  };
  setDeploy(0);
  const root = new THREE.Group();
  inner.rotation.x = -Math.PI / 2; // z-up -> y-up
  root.add(inner);
  return {
    root,
    inner,
    info,
    setDeploy,
    hasMovingParts: info.parts.length > 0 || extraDeployers.length > 0,
  };
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
