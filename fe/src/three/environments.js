/**
 * environments -- boi canh 3D dung bang code (khong tai file, rat nhe):
 *   buildHangarEnv(): xuong lap rap sach (clean room) quanh ve tinh / ten lua o man che tao.
 *   buildLaunchComplex(): khu phong ven bien: nha lap rap lon (VAB, khong logo), duong xe xich, be phong,
 *                         thap dich vu dang gian thep, cot thu loi, thap nuoc, bo bien.
 * Be mat dung texture ve bang canvas 2D (lien mach, khong co vach soc).
 */
import * as THREE from 'three';

const texCache = new Map();

/** Texture ve bang canvas 2D, lap lai (repeat) va cache theo ten. */
function canvasTexture(key, size, draw, repeat = [1, 1]) {
  if (!texCache.has(key)) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    draw(cv.getContext('2d'), size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    texCache.set(key, tex);
  }
  const t = texCache.get(key).clone();
  t.repeat.set(repeat[0], repeat[1]);
  t.needsUpdate = true;
  return t;
}

/** Nhieu muot (value noise) don gian cho mat dat, co, be tong. */
function noiseFill(g, size, base, spread, seed = 1) {
  const img = g.createImageData(size, size);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cells = 16, grid = [];
  for (let i = 0; i <= cells; i++) { grid.push([]); for (let j = 0; j <= cells; j++) grid[i].push(rnd()); }
  for (let i = 0; i <= cells; i++) { grid[i][cells] = grid[i][0]; grid[cells][i] = grid[0][i]; }
  const sm = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells, fy = (y / size) * cells, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = sm(fx - ix), ty = sm(fy - iy);
      const v = (grid[iy][ix] * (1 - tx) + grid[iy][ix + 1] * tx) * (1 - ty) + (grid[iy + 1][ix] * (1 - tx) + grid[iy + 1][ix + 1] * tx) * ty;
      const n = (v - 0.5) * spread + (rnd() - 0.5) * spread * 0.35;
      const o = (y * size + x) * 4;
      img.data[o] = base[0] + n; img.data[o + 1] = base[1] + n; img.data[o + 2] = base[2] + n; img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

/** Nhieu thanh dam (dau-cuoi) bang InstancedMesh: dung cho gian thep, lan can, cot thu loi... rat nhe. */
function beams(segments, thickness, material) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, material, segments.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  segments.forEach(([a, b], i) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A), len = dir.length();
    q.setFromUnitVectors(up, dir.normalize());
    m.compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(thickness, len, thickness));
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/** Thap gian thep vuong canh w, cao h, khoang bay; tra ve danh sach doan thang. */
function latticeSegments(cx, cz, w, h, bay) {
  const segs = [], hw = w / 2;
  const corners = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]];
  for (const [x, z] of corners) segs.push([[cx + x, 0, cz + z], [cx + x, h, cz + z]]);
  for (let y = 0; y <= h + 1e-6; y += bay) {
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = corners[i], [x1, z1] = corners[(i + 1) % 4];
      segs.push([[cx + x0, y, cz + z0], [cx + x1, y, cz + z1]]);
      if (y + bay <= h + 1e-6) segs.push([[cx + x0, y, cz + z0], [cx + x1, y + bay, cz + z1]]); // giang cheo
    }
  }
  return segs;
}

// ======================================================================= XUONG LAP RAP
/**
 * Xuong sach: san epoxy, vach vang an toan, tuong panel, den tran, cau truc ray, ban xoay + gian cong tac.
 * Don vi = don vi canh cua Hangar (model da chuan hoa cao ~2.3). floorY = cao do san.
 */
export function buildHangarEnv({ floorY = -1.15, tall = false } = {}) {
  const g = new THREE.Group();
  const R = 7.5, H = tall ? 9 : 6.2;
  const floorTex = canvasTexture('epoxy', 256, (c, s) => {
    noiseFill(c, s, [176, 182, 186], 10, 7);
    c.strokeStyle = 'rgba(90,100,108,0.35)'; c.lineWidth = 2;
    c.strokeRect(0, 0, s, s); // khe noi tam san (moi tam 1 o lap)
  }, [10, 10]);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R * 1.6, 64), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  floor.receiveShadow = true;
  g.add(floor);
  // vong vach vang an toan quanh khu lap rap
  const stripe = new THREE.Mesh(new THREE.RingGeometry(2.15, 2.32, 72), new THREE.MeshBasicMaterial({ color: 0xe8b81c }));
  stripe.rotation.x = -Math.PI / 2; stripe.position.y = floorY + 0.004; g.add(stripe);
  // ban xoay (turntable) duoi model
  const metal = new THREE.MeshStandardMaterial({ color: 0x8d969d, metalness: 0.75, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a4248, metalness: 0.5, roughness: 0.5 });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.18, 48), dark);
  plinth.position.y = floorY + 0.09; g.add(plinth);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.05, 48), metal);
  table.position.y = floorY + 0.205; g.add(table);
  // tuong panel bao quanh (mot nua vong phia sau)
  const wallTex = canvasTexture('wall', 256, (c, s) => {
    noiseFill(c, s, [208, 214, 218], 6, 3);
    c.strokeStyle = 'rgba(120,130,138,0.55)'; c.lineWidth = 3;
    c.strokeRect(1, 1, s - 2, s - 2);
    c.fillStyle = 'rgba(60,140,200,0.18)'; c.fillRect(0, s * 0.78, s, s * 0.06); // dai xanh nhan dien
  }, [14, tall ? 3 : 2]);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true, Math.PI * 0.15, Math.PI * 1.7), new THREE.MeshStandardMaterial({ map: wallTex, side: THREE.BackSide, roughness: 0.8 }));
  wall.position.y = floorY + H / 2; g.add(wall);
  // den tran (tam phat sang) + cau truc ray
  const lamp = new THREE.MeshBasicMaterial({ color: 0xf4fbff });
  for (let i = -2; i <= 2; i++) { const l = box(0.5, 0.04, 4.5, lamp); l.position.set(i * 1.6, floorY + H - 0.05, 0); g.add(l); }
  const yellow = new THREE.MeshStandardMaterial({ color: 0xd9a21b, metalness: 0.4, roughness: 0.5 });
  for (const z of [-3.2, 3.2]) { const rail = box(13, 0.22, 0.22, dark); rail.position.set(0, floorY + H - 0.6, z); g.add(rail); }
  const bridge = box(0.4, 0.5, 6.8, yellow); bridge.position.set(-1.6, floorY + H - 0.95, 0); g.add(bridge);
  const trolley = box(0.6, 0.45, 0.7, dark); trolley.position.set(-1.6, floorY + H - 1.4, 0.4); g.add(trolley);
  g.add(beams([[[-1.6, floorY + H - 1.6, 0.4], [-1.6, floorY + H - 2.6, 0.4]]], 0.025, dark));
  const hook = box(0.22, 0.28, 0.22, yellow); hook.position.set(-1.6, floorY + H - 2.75, 0.4); g.add(hook);
  // gian cong tac (work stand) 2 tang o mot ben + lan can
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa3a8, metalness: 0.6, roughness: 0.45 });
  const sx = 4.6, sz = -2.2; // dat xa ban xoay de khong che model
  const segs = [];
  for (const [x, z] of [[sx - 0.8, sz - 1], [sx + 0.8, sz - 1], [sx + 0.8, sz + 1], [sx - 0.8, sz + 1]]) segs.push([[x, floorY, z], [x, floorY + 2.4, z]]);
  for (const y of [1.15, 2.3]) {
    segs.push([[sx - 0.8, floorY + y + 0.55, sz - 1], [sx - 0.8, floorY + y + 0.55, sz + 1]]);
    segs.push([[sx - 0.8, floorY + y + 0.3, sz - 1], [sx - 0.8, floorY + y + 0.3, sz + 1]]);
  }
  g.add(beams(segs, 0.04, steel));
  for (const y of [1.15, 2.3]) { const deck = box(1.7, 0.05, 2.1, new THREE.MeshStandardMaterial({ color: 0x6f7a80, metalness: 0.5, roughness: 0.6 })); deck.position.set(sx, floorY + y, sz); g.add(deck); }
  // xe day dung cu + thung chua (chi tiet nho cho co "nguoi dang lam viec")
  const cart = box(0.7, 0.55, 0.45, new THREE.MeshStandardMaterial({ color: 0x2f6f9f, roughness: 0.6 })); cart.position.set(-2.8, floorY + 0.4, 1.6); g.add(cart);
  const crate = box(0.6, 0.6, 0.6, new THREE.MeshStandardMaterial({ color: 0x8a6a3c, roughness: 0.9 })); crate.position.set(-3.4, floorY + 0.3, -1.9); g.add(crate);
  return g;
}

// ======================================================================= TOA TICH HOP THANG DUNG (mode TEN LUA)
/**
 * Toa tich hop thang dung (kieu Vertical Integration Facility trong anh thuc te, khong logo):
 * 2 thap op panel xam hai ben, khung giang cheo + ban cong nhieu tang phia ngoai, khoang giua mo de lap ten lua,
 * san cong tac ben trong, dam cau truc mau cam tren noc, be phong di dong toi mau duoi ten lua, xe tai + container o chan.
 * Don vi = don vi canh cua Hangar. rocketH = chieu cao ten lua sau chuan hoa; toa cao rocketH / 0.75 (ten lua ~75 % toa).
 */
export function buildIntegrationHall({ floorY = -1.15, rocketH = 2.6, rocketR = 0.12 } = {}) {
  const g = new THREE.Group();
  const H = rocketH / 0.75, W = rocketH * 0.95, D = rocketH * 0.42;
  const towerW = W * 0.27, gap = W - 2 * towerW; // khoang mo giua
  const y0 = floorY;
  // be mat panel xam (ghep tam, lien mach) + noi that toi
  const clad = canvasTexture('clad', 256, (c, s) => {
    noiseFill(c, s, [150, 156, 160], 10, 21);
    c.strokeStyle = 'rgba(70,76,82,0.55)'; c.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, (i * s) / 4); c.lineTo(s, (i * s) / 4); c.stroke(); }
    c.beginPath(); c.moveTo(s / 2, 0); c.lineTo(s / 2, s); c.stroke();
  }, [2, 6]);
  const cladMat = new THREE.MeshStandardMaterial({ map: clad, roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xb7bdc2, metalness: 0.55, roughness: 0.45 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x2c3136, metalness: 0.4, roughness: 0.7 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe9ecee, roughness: 0.6 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xe49a1c, metalness: 0.3, roughness: 0.5 });
  const rust = new THREE.MeshStandardMaterial({ color: 0x7d5a44, roughness: 0.9 });

  // san be tong truoc toa + vach vang
  const apronTex = canvasTexture('apron', 256, (c, s) => { noiseFill(c, s, [176, 176, 170], 14, 31); c.strokeStyle = 'rgba(90,90,86,0.4)'; c.lineWidth = 2; c.strokeRect(0, 0, s, s); }, [8, 8]);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(W * 4, W * 4), new THREE.MeshStandardMaterial({ map: apronTex, roughness: 0.9 }));
  apron.rotation.x = -Math.PI / 2; apron.position.set(0, y0, W * 0.6); g.add(apron);
  for (const x of [-gap / 2, gap / 2]) { const l = box(0.03, 0.004, W * 1.6, new THREE.MeshBasicMaterial({ color: 0xe1b320 })); l.position.set(x, y0 + 0.003, W * 0.8); g.add(l); }

  // 2 thap op panel
  for (const sx of [-1, 1]) {
    const t = box(towerW, H, D, cladMat);
    t.position.set(sx * (gap / 2 + towerW / 2), y0 + H / 2, 0);
    g.add(t);
    // chan thap mau trang (phong may / van phong)
    const base = box(towerW * 1.02, H * 0.12, D * 1.02, white);
    base.position.set(sx * (gap / 2 + towerW / 2), y0 + H * 0.06, 0); g.add(base);
  }
  // tuong sau khoang giua: xam sang co den chieu (nhu anh thuc te) de ten lua mau toi van noi ro, co ong ky thuat
  const backTex = canvasTexture('hallback', 256, (c, s) => {
    noiseFill(c, s, [118, 124, 130], 10, 41);
    c.fillStyle = 'rgba(255,244,214,0.35)';
    for (let i = 0; i < 4; i++) c.fillRect(s * 0.1 + i * s * 0.22, s * 0.05, s * 0.06, s * 0.02); // den chieu
  }, [1, 4]);
  const back = box(gap, H, 0.05, new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.85 })); back.position.set(0, y0 + H / 2, -D / 2); g.add(back);
  const lamp = new THREE.PointLight(0xfff2d8, 2.2, H * 1.6, 1.2); lamp.position.set(0, y0 + H * 0.6, D * 0.3); g.add(lamp);
  const levels = 9;
  for (let i = 1; i < levels; i++) {
    const y = y0 + (H * i) / levels;
    for (const sx of [-1, 1]) {
      // san cong tac ben trong: dua tu tuong ra sat ten lua (de lai khe cho than ten lua)
      const len = gap / 2 - rocketR * 1.6;
      const deck = box(len, 0.025, D * 0.55, steel);
      deck.position.set(sx * (gap / 2 - len / 2), y, -D * 0.12);
      g.add(deck);
    }
  }
  const pipeSegs = [];
  for (const x of [-gap * 0.36, -gap * 0.3, gap * 0.33]) pipeSegs.push([[x, y0 + 0.05, -D / 2 + 0.06], [x, y0 + H * 0.92, -D / 2 + 0.06]]);
  g.add(beams(pipeSegs, 0.03, rust));

  // khung giang cheo + ban cong nhieu tang o mat ngoai 2 thap
  const frameSegs = [];
  for (const sx of [-1, 1]) {
    const xo = sx * (gap / 2 + towerW + 0.16);
    for (const z of [D / 2 - 0.02, -D / 2 + 0.02]) {
      frameSegs.push([[xo, y0, z], [xo, y0 + H, z]]);
      for (let i = 0; i < 7; i++) {
        const ya = y0 + H * 0.08 + (H * 0.9 * i) / 7, yb = ya + (H * 0.9) / 7;
        frameSegs.push([[xo, ya, z], [sx * (gap / 2 + towerW), yb, z]]);
      }
    }
    for (let i = 1; i <= 7; i++) {
      const y = y0 + H * 0.08 + (H * 0.9 * i) / 7;
      const deck = box(0.34, 0.02, D * 1.05, steel);
      deck.position.set(sx * (gap / 2 + towerW + 0.12), y, 0); g.add(deck);
      frameSegs.push([[sx * (gap / 2 + towerW + 0.29), y, -D * 0.52], [sx * (gap / 2 + towerW + 0.29), y + 0.08, -D * 0.52]]);
      frameSegs.push([[sx * (gap / 2 + towerW + 0.29), y + 0.08, -D * 0.52], [sx * (gap / 2 + towerW + 0.29), y + 0.08, D * 0.52]]); // lan can
    }
  }
  g.add(beams(frameSegs, 0.018, steel));

  // noc: dam ngang + cau truc mau cam + khung mai
  const roof = box(W + 0.4, 0.12, D + 0.2, cladMat); roof.position.set(0, y0 + H + 0.06, 0); g.add(roof);
  const girder = box(gap, 0.14, 0.16, orange); girder.position.set(0, y0 + H * 0.9, D * 0.1); g.add(girder);
  const trolley = box(0.22, 0.12, 0.22, orange); trolley.position.set(0, y0 + H * 0.9 - 0.12, D * 0.1); g.add(trolley);
  const roofTruss = [];
  for (let i = 0; i <= 6; i++) { const x = -W / 2 - 0.2 + ((W + 0.4) * i) / 6; roofTruss.push([[x, y0 + H + 0.12, D / 2], [x, y0 + H + 0.36, D / 2]]); }
  roofTruss.push([[-W / 2 - 0.2, y0 + H + 0.36, D / 2], [W / 2 + 0.2, y0 + H + 0.36, D / 2]]);
  g.add(beams(roofTruss, 0.02, steel));

  // be phong di dong (MLP) toi mau duoi ten lua + cot ho tro duoi
  const mlp = box(gap * 0.82, 0.16, D * 0.75, darkSteel); mlp.position.set(0, y0 + 0.08, 0.02); g.add(mlp);
  const tsm = box(0.08, 0.5, 0.08, rust); tsm.position.set(gap * 0.18, y0 + 0.41, -0.06); g.add(tsm);
  // xe tai + container trang o chan toa
  const trailer = box(W * 0.42, 0.42, 0.42, white); trailer.position.set(-W * 0.62, y0 + 0.21, D * 0.9); g.add(trailer);
  const cab = box(0.28, 0.3, 0.32, white); cab.position.set(gap * 0.05, y0 + 0.15, D * 1.25); g.add(cab);
  const cabWin = box(0.29, 0.1, 0.2, new THREE.MeshStandardMaterial({ color: 0x1c2a36, roughness: 0.2, metalness: 0.4 })); cabWin.position.set(gap * 0.05, y0 + 0.24, D * 1.25); g.add(cabWin);
  const bed = box(0.5, 0.08, 0.36, darkSteel); bed.position.set(gap * 0.05, y0 + 0.06, D * 1.25 - 0.4); g.add(bed);
  return { group: g, height: H, width: W, mlpTop: y0 + 0.16 };
}

// ======================================================================= KHU PHONG
/**
 * Khu phong ven bien (don vi: met, goc toa do = tam be phong, mat dat y = 0).
 * Kich thuoc nha lap rap lon lay theo co VAB (cao ~160 m) nhung KHONG co logo / ten co quan nao.
 */
export function buildLaunchComplex() {
  const g = new THREE.Group();
  const grassTex = canvasTexture('grass', 256, (c, s) => noiseFill(c, s, [86, 112, 70], 26, 11), [120, 120]);
  const land = new THREE.Mesh(new THREE.CircleGeometry(4200, 72), new THREE.MeshLambertMaterial({ map: grassTex }));
  land.rotation.x = -Math.PI / 2; g.add(land);
  // bien va bai cat (phia dong, +x)
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshLambertMaterial({ color: 0x2a6f9a }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(5200, -0.6, 0); g.add(sea);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(260, 8400), new THREE.MeshLambertMaterial({ color: 0xd8cba1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(640, 0.05, 0); g.add(sand);
  // be phong: nen be tong bat giac + muong dan lua
  const concreteTex = canvasTexture('concrete', 256, (c, s) => noiseFill(c, s, [168, 166, 160], 22, 5), [6, 6]);
  const concrete = new THREE.MeshLambertMaterial({ map: concreteTex });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(160, 175, 6, 8), concrete);
  pad.position.y = -3.05; g.add(pad);
  // mieng muong dan lua (toi, sau) ngay duoi de ten lua + tuong chan lua hai ben
  const trench = box(10, 0.3, 46, new THREE.MeshLambertMaterial({ color: 0x1e1b19 }));
  trench.position.set(0, 0.02, 30); g.add(trench);
  for (const side of [-1, 1]) { const w = box(2, 3, 46, concrete); w.position.set(side * 6, 1.5, 30); g.add(w); }
  // duong xe xich (2 lan, giai co o giua) tu nha lap rap ra be
  const gravel = new THREE.MeshLambertMaterial({ map: canvasTexture('gravel', 128, (c, s) => noiseFill(c, s, [150, 146, 136], 40, 9), [4, 120]) });
  for (const off of [-13, 13]) {
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(2300, 12), gravel); // dai theo truc x (tu nha lap rap toi be)
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(-1300, 0.06, off);
    g.add(lane);
  }
  // nha lap rap lon (khoi hop cao, cua cuon doc, khong logo)
  const vabTex = canvasTexture('vab', 512, (c, s) => {
    noiseFill(c, s, [214, 216, 214], 6, 2);
    c.fillStyle = 'rgba(70,74,80,0.85)';
    for (let i = 0; i < 4; i++) c.fillRect(s * (0.12 + i * 0.21), s * 0.08, s * 0.1, s * 0.92); // 4 cua cao cho ten lua di qua
    c.strokeStyle = 'rgba(40,44,50,0.5)'; c.lineWidth = 2;
    for (let y = s * 0.08; y < s; y += s * 0.05) { c.beginPath(); c.moveTo(0, y); c.lineTo(s, y); c.stroke(); }
    c.fillStyle = 'rgba(46,86,140,0.9)'; c.fillRect(s * 0.02, s * 0.12, s * 0.07, s * 0.2); // mang son xanh trang tri (khong co chu/logo)
  }, [1, 1]);
  const vabMat = new THREE.MeshLambertMaterial({ map: vabTex });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xb9bcbc });
  const vab = new THREE.Mesh(new THREE.BoxGeometry(218, 160, 158), [vabMat, vabMat, roofMat, roofMat, vabMat, vabMat]); // 4 mat ben co cua, tren/duoi tron
  vab.position.set(-2600, 80, -60); g.add(vab);
  const annex = box(150, 50, 140, new THREE.MeshLambertMaterial({ color: 0xd0d2d0 }));
  annex.position.set(-2600, 25, 120); g.add(annex);
  // thap nuoc (cau tren chan)
  const tankMat = new THREE.MeshLambertMaterial({ color: 0xd9dcdc });
  const tank = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), tankMat); tank.position.set(170, 72, -150); g.add(tank);
  const legs = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; legs.push([[170 + Math.cos(a) * 10, 0, -150 + Math.sin(a) * 10], [170 + Math.cos(a) * 6, 62, -150 + Math.sin(a) * 6]]); }
  g.add(beams(legs, 1.4, tankMat));
  // 3 cot thu loi quanh be + day cap noi dinh
  const mastMat = new THREE.MeshLambertMaterial({ color: 0x9aa0a4 });
  const masts = [[-70, -70], [80, -40], [-20, 95]];
  const mastSegs = [];
  for (const [x, z] of masts) mastSegs.push(...latticeSegments(x, z, 3.2, 150, 10));
  g.add(beams(mastSegs, 0.35, mastMat));
  const wire = new THREE.LineBasicMaterial({ color: 0x55595c });
  for (let i = 0; i < 3; i++) {
    const [x0, z0] = masts[i], [x1, z1] = masts[(i + 1) % 3];
    const pts = [];
    for (let k = 0; k <= 24; k++) { const t = k / 24; pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, 150 - 26 * 4 * t * (1 - t), z0 + (z1 - z0) * t)); }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));
  }
  // nha dieu khien thap (bunker) va duong vao
  const bunker = box(40, 8, 26, new THREE.MeshLambertMaterial({ color: 0xbfc1bd })); bunker.position.set(-420, 4, 260); g.add(bunker);
  return g;
}

/**
 * Thap dich vu canh ten lua (gian thep do), cao theo ten lua, kem 2 can ve sinh/nhien lieu (umbilical arm) quay duoc.
 * Tra { group, arms: [Object3D] } -- arms quay ra xa khi T-0.
 */
export function buildServiceTower(H, R) {
  const g = new THREE.Group();
  const w = Math.max(6, R * 3.2), h = H * 1.12, x = -(R + w / 2 + 2.5);
  const red = new THREE.MeshLambertMaterial({ color: 0xa8432f });
  g.add(beams(latticeSegments(x, 0, w, h, Math.max(4, w * 0.9)), Math.max(0.25, w * 0.045), red));
  const deckMat = new THREE.MeshLambertMaterial({ color: 0x5c5f62 });
  for (let y = w; y < h; y += w * 1.6) { const d = box(w, 0.35, w, deckMat); d.position.set(x, y, 0); g.add(d); }
  const cap = box(w * 1.1, 1.2, w * 1.1, red); cap.position.set(x, h + 0.6, 0); g.add(cap);
  const arms = [];
  for (const frac of [0.55, 0.86]) {
    const pivot = new THREE.Group();
    pivot.position.set(x + w / 2, H * frac, 0);
    const len = R + 2.2; // tu mep thap toi sat than ten lua
    const beam = box(len, 1.1, 1.1, red);
    beam.position.set(len / 2, 0, 0);
    const hoodMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d2 });
    const hood = box(1.4, 1.8, 1.8, hoodMat); // dau noi (umbilical) ap vao than
    hood.position.set(len - 0.4, 0, 0);
    pivot.add(beam, hood);
    g.add(pivot);
    arms.push(pivot);
  }
  // ke giu chan (hold-down) quanh de ten lua
  const clampMat = new THREE.MeshLambertMaterial({ color: 0x3c3f42 });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; const c = box(R * 0.35, R * 0.6, R * 0.35, clampMat); c.position.set(Math.cos(a) * R * 1.15, R * 0.3, Math.sin(a) * R * 1.15); g.add(c); }
  return { group: g, arms };
}
