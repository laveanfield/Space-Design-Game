// =====================================================================
//  [anatomy] LAUNCHPAD -- hinh isometric be phong (ve bang kit cua skill /anatomy)
//
//  Vat the: be be tong co muong dan lua, be phong di dong (MLP) tren 6 tru do, thap dich vu gian thep
//  voi 2 can noi (umbilical) quay ra, 4 kep giu chan, ten lua 2 tang + fairing, bon nuoc chong rung, tam nhan.
//  Chuyen dong (dung trong game): arm 0..1 = can noi quay rut ra 0..80 do; clamp 0..1 = kep mo; lift = ten lua nhac len.
//  Cac so trong hinh la MINH HOA (ti le hinh ve, don vi ~1 px), khong phai thong so cua mot be phong that.
//
//  Dung o 2 noi: trong trinh duyet (React, ve 1 lan + cap nhat phan dong) va trong Node (kiem tra --audit / lines).
// =====================================================================
import * as k from './kit/iso-kit.mjs';
import * as G from './kit/lathe.mjs';
import ORDER_FILE from './14-11-2026-launchpad_order.json' with { type: 'json' };

const ORDER = ORDER_FILE.order || [];

export const W = 600, H = 440;
export const PAD = { x: -150, y: -100, w: 290, d: 200, r: 10 };   // be be tong
export const MLP = { x: -55, y: -45, w: 110, d: 90, r: 3 };       // be phong di dong
const MLP_Z = [8, 26];
const TOWER = { x0: -92, x1: -64, y0: -14, y1: 14, top: 300 };    // thap dich vu (mep ngoai cot)
const POST = 4, GIRT = 2.4;
const GIRT_Z = [40, 80, 120, 160, 200, 240, 280];
export const ARM_Z = [150, 222];                                  // 2 can noi: tang 1 va tang 2
const RK = { r: 9, base: MLP_Z[1] };                              // ten lua dung tren mat MLP
const STAGE1 = 150, INTER = 8, STAGE2 = 62, SKIRT = 6, OGIVE = 54, RF = 10.5;
const ARM_MAX = (80 * Math.PI) / 180;

export const projection = () => k.fitProjection(
  [...k.boxCorners(PAD, -14, 0), [TOWER.x0, TOWER.y0, TOWER.top + 26], [TOWER.x1, TOWER.y1, TOWER.top + 26], [0, 0, RK.base + STAGE1 + INTER + STAGE2 + SKIRT + OGIVE + 70]],
  W, H, { pad: 22, azimuth: 45 });

// ---------------------------------------------------------------- tien ich
const box = (P, [x0, y0, z0], [x1, y1, z1], bevel = 0, r = 0) => k.slabOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r }, z0, z1 - z0, P, r ? 3 : 1, bevel);
const SB = (min, max, name) => ({ t: 'slab', plan: { x: min[0], y: min[1], w: max[0] - min[0], d: max[1] - min[1], r: 0 }, z: min[2], h: max[2] - min[2], name });

/** Ogive tiep tuyen cua fairing: ban kinh theo khoang cach tu chan fairing (s' = 0..OGIVE). */
const RHO = (RF * RF + OGIVE * OGIVE) / (2 * RF);
const ogiveR = (sp) => Math.max(0, Math.sqrt(Math.max(0, RHO * RHO - sp * sp)) + RF - RHO);
const ogiveSlope = (sp) => -sp / Math.sqrt(Math.max(1e-6, RHO * RHO - sp * sp));

/**
 * Tat ca chi tiet o tu the nghi, theo thu tu ve (sau -> truoc). Moi item: { id, svg, shapes, part }
 * part: 'static' | 'arm0' | 'arm1' | 'clamp' | 'rocket'  (phan dong duoc dat trong <g data-part=...>).
 */
export function items(P, state = { arm: 0, clamp: 0, lift: 0 }) {
  const S = (p, s) => k.solidSvg(p, s);
  const L = (d, s) => k.lineSvg(d, s);
  const D = (pts, s) => k.dotsSvg(pts, s);
  const at = (p) => k.iso(p, P);
  const out = [];
  const put = (id, part, svg, shapes = []) => out.push({ id, part, svg, shapes });

  // ---------- BE BE TONG: ranh vien, oc goc, muong dan lua, tam nhan, bon nuoc
  const corners = k.corners(PAD, 12);
  const trench = { x: -12, y: MLP.y + MLP.d, w: 24, d: 52, r: 2 };
  const plate = { x: 64, y: 58, w: 62, d: 30, r: 3 };
  const rule = (y, a, b) => L(k.lineOnTop([plate.x + a, y], [plate.x + b, y], 1, P), { tone: 'lo', free: true });
  put('stand.pad', 'static', [
    `<path class="iso-halo" d="${k.haloOf(PAD, -14, 14, P)}"/>`,
    S(k.slabOf(PAD, -14, 14, P, 8, 1.4), { tone: 'lo', inner: L(k.sideSeam(PAD, -6, P, 8), { tone: 'faint' }) }),
    L(k.planOutline(k.insetPlan(PAD, 6), 0, P), { tone: 'faint' }),
    L(corners.map(([x, y]) => k.ring(x, y, 3, 0, P, 14)).join(''), { tone: 'lo' }),
    D(corners.map(([x, y]) => at([x, y, 0])), { size: 0.5 }),
    `<path class="iso-shade" data-shade="0" d="${k.onTop(k.ringOf(trench, 3), 0, P, true)}"/>`,
    L(k.planOutline(trench, 0, P, 3), { tone: 'mid' }),
    L(k.planOutline(k.insetPlan(trench, 3), 0, P, 3), { tone: 'faint' }),
  ].join(''), [{ t: 'slab', plan: PAD, z: -14, h: 14, name: 'stand.pad', ground: true }]);
  put('stand.plate', 'static', [
    S(k.slabOf(plate, 0, 1, P, 3), { tone: 'lo', crease: 'none' }),
    L(k.planOutline(k.insetPlan(plate, 2.5), 1, P, 3), { tone: 'faint' }),
    rule(plate.y + 18, 8, 40), rule(plate.y + 23, 8, 30),
    k.faceTextSvg(k.topMatrix([plate.x + 8, plate.y + 12], 1, P, 'x'), 'PAD 1', { size: 7, tone: 'lo' }),
    D([at([plate.x + 4, plate.y + 4, 1]), at([plate.x + plate.w - 4, plate.y + plate.d - 4, 1])], { size: 0.45 }),
  ].join(''), [{ t: 'slab', plan: plate, z: 0, h: 1, name: 'stand.plate' }]);
  const tank = [105, -62];
  put('stand.tank', 'static', [
    S(k.cylinder(tank[0], tank[1], 17, 0, 4, P, 40), { tone: 'mid' }),
    S(k.cylinder(tank[0], tank[1], 15, 4, 30, P, 40, 0.8), { tone: 'mid', inner: L([12, 22].map((z) => k.sideArc(tank[0], tank[1], 15, z, P, 28)).join(''), { tone: 'faint' }) }),
    L(k.ring(tank[0], tank[1], 11, 34, P, 32), { tone: 'lo' }),
    S(k.cylinder(tank[0], tank[1], 4, 34, 4, P, 20), { tone: 'mid' }),
    D([0, 1, 2, 3, 4, 5].map((i) => at([tank[0] + Math.cos(i) * 13.5, tank[1] + Math.sin(i) * 13.5, 34])), { size: 0.45 }),
  ].join(''), [{ t: 'cyl', cx: tank[0], cy: tank[1], r: 17, z: 0, h: 4, name: 'stand.tank.base' }, { t: 'cyl', cx: tank[0], cy: tank[1], r: 15, z: 4, h: 30, name: 'stand.tank' }, { t: 'cyl', cx: tank[0], cy: tank[1], r: 4, z: 34, h: 4, name: 'stand.tank.valve' }]);

  // ---------- THAP DICH VU: 4 cot, 7 tang thanh ngang, 2 san cong tac o tang can noi, mu thap, cot thu loi
  const posts = [[TOWER.x0, TOWER.y0], [TOWER.x1 - POST, TOWER.y0], [TOWER.x0, TOWER.y1 - POST], [TOWER.x1 - POST, TOWER.y1 - POST]];
  const postItem = ([x, y], i) => put(`tower.post${i}`, 'static', S(box(P, [x, y, 0], [x + POST, y + POST, TOWER.top], 0.4), { tone: 'mid' }), [SB([x, y, 0], [x + POST, y + POST, TOWER.top], `tower.post${i}`)]);
  // thu tu: cot sau (xa nguoi xem) truoc, roi thanh ngang, roi cot truoc
  postItem(posts[0], 0);
  for (const z of GIRT_Z) {
    const g = [
      [[TOWER.x0 + POST, TOWER.y0 + 1, z - GIRT / 2], [TOWER.x1 - POST, TOWER.y0 + 1 + GIRT, z + GIRT / 2]],
      [[TOWER.x0 + 1, TOWER.y0 + POST, z - GIRT / 2], [TOWER.x0 + 1 + GIRT, TOWER.y1 - POST, z + GIRT / 2]],
    ];
    g.forEach(([a, b], j) => put(`tower.girt${z}.${j}`, 'static', S(box(P, a, b), { tone: 'mid' }), [SB(a, b, `tower.girt${z}.${j}`)]));
  }
  postItem(posts[1], 1);
  postItem(posts[2], 2);
  for (const z of ARM_Z) {
    const a = [TOWER.x0 + POST, TOWER.y0 + POST, z - 12], b = [TOWER.x1 - POST, TOWER.y1 - POST, z - 10];
    put(`tower.deck${z}`, 'static', S(box(P, a, b, 0.3), { tone: 'mid' }) + D(k.corners({ x: a[0], y: a[1], w: b[0] - a[0], d: b[1] - a[1] }, 2).map(([x, y]) => at([x, y, b[2]])), { size: 0.4 }), [SB(a, b, `tower.deck${z}`)]);
  }
  // tam ga can noi: tam thep dung giua 2 cot truoc, ban le can noi tua vao day
  for (const z of ARM_Z) {
    const a = [TOWER.x1 - 2, TOWER.y0 + POST, z - 16], b = [TOWER.x1, TOWER.y1 - POST, z + 2];
    put(`tower.mount${z}`, 'static', S(box(P, a, b, 0.3), { tone: 'mid' }) + D([[0, -6], [0, 6]].map(([, y]) => at([TOWER.x1, y, z - 13])), { size: 0.4 }), [SB(a, b, `tower.mount${z}`)]);
  }
  for (const z of GIRT_Z) {
    const g = [
      [[TOWER.x0 + POST, TOWER.y1 - 1 - GIRT, z - GIRT / 2], [TOWER.x1 - POST, TOWER.y1 - 1, z + GIRT / 2]],
      [[TOWER.x1 - 1 - GIRT, TOWER.y0 + POST, z - GIRT / 2], [TOWER.x1 - 1, TOWER.y1 - POST, z + GIRT / 2]],
    ];
    g.forEach(([a, b], j) => put(`tower.girtF${z}.${j}`, 'static', S(box(P, a, b), { tone: 'mid' }), [SB(a, b, `tower.girtF${z}.${j}`)]));
  }
  postItem(posts[3], 3);
  const cap = [[TOWER.x0 - 2, TOWER.y0 - 2, TOWER.top], [TOWER.x1 + 2, TOWER.y1 + 2, TOWER.top + 6]];
  put('tower.cap', 'static', S(box(P, cap[0], cap[1], 0.6), { tone: 'mid' }) + D(k.corners({ x: cap[0][0], y: cap[0][1], w: cap[1][0] - cap[0][0], d: cap[1][1] - cap[0][1] }, 3).map(([x, y]) => at([x, y, TOWER.top + 6])), { size: 0.45 }), [SB(cap[0], cap[1], 'tower.cap')]);
  const mx = (TOWER.x0 + TOWER.x1) / 2, my = 0;
  put('tower.mast', 'static', S(k.cylinder(mx, my, 3.2, TOWER.top + 6, 4, P, 18), { tone: 'mid' }) + S(k.cylinder(mx, my, 1.3, TOWER.top + 10, 16, P, 12), { tone: 'mid', crease: 'none' }) + D([at([mx, my, TOWER.top + 26])], { size: 0.7, tone: 'hi' }),
    [{ t: 'cyl', cx: mx, cy: my, r: 3.2, z: TOWER.top + 6, h: 4, name: 'tower.mast.base' }, { t: 'cyl', cx: mx, cy: my, r: 1.3, z: TOWER.top + 10, h: 16, name: 'tower.mast' }]);

  // ---------- CAN NOI (umbilical arm): quay quanh truc dung o mep thap, phia sau ten lua
  ARM_Z.forEach((z, i) => put(`arm${i}`, `arm${i}`, armSvg(P, i, state.arm), armShapes(i, state.arm)));

  // ---------- MLP tren 6 tru do
  const peds = [[-45, -35], [0, -35], [45, -35], [-45, 35], [0, 35], [45, 35]];
  peds.forEach(([x, y], i) => put(`mlp.ped${i}`, 'static', S(k.cylinder(x, y, 6, 0, MLP_Z[0], P, 20), { tone: 'lo' }), [{ t: 'cyl', cx: x, cy: y, r: 6, z: 0, h: MLP_Z[0], name: `mlp.ped${i}` }]));
  const mlpScrews = k.corners(MLP, 6);
  put('mlp', 'static', [
    S(k.slabOf(MLP, MLP_Z[0], MLP_Z[1] - MLP_Z[0], P, 3, 1), { tone: 'mid', inner: L(k.sideSeam(MLP, MLP_Z[0] + 6, P, 3), { tone: 'faint' }) }),
    L(k.planOutline(k.insetPlan(MLP, 4), MLP_Z[1], P, 3), { tone: 'faint' }),
    `<path class="iso-shade" data-shade="0" d="${k.onTop(k.circleRing(0, 0, 15, 40), MLP_Z[1], P, true)}"/>`,
    L(k.ring(0, 0, 15, MLP_Z[1], P, 40), { tone: 'mid' }),
    L(k.ring(0, 0, 18, MLP_Z[1], P, 40), { tone: 'faint' }),
    D(mlpScrews.map(([x, y]) => at([x, y, MLP_Z[1]])), { size: 0.5 }),
  ].join(''), [{ t: 'slab', plan: MLP, z: MLP_Z[0], h: MLP_Z[1] - MLP_Z[0], name: 'mlp' }]);
  // 2 cot ho tro duoi (tail service mast) phia truoc MLP
  for (const [x, y] of [[30, 30], [-30, 30]]) {
    put(`mlp.tsm${x}`, 'static', S(box(P, [x - 5, y - 5, MLP_Z[1]], [x + 5, y + 5, MLP_Z[1] + 16], 0.4), { tone: 'mid' }) + L(k.sideSeam({ x: x - 5, y: y - 5, w: 10, d: 10, r: 0 }, MLP_Z[1] + 10, P, 1), { tone: 'faint' }) + D([at([x, y, MLP_Z[1] + 16])], { size: 0.45 }),
      [SB([x - 5, y - 5, MLP_Z[1]], [x + 5, y + 5, MLP_Z[1] + 16], `mlp.tsm${x}`)]);
  }

  // ---------- KEP GIU CHAN: 3 kep phia sau/ben ve truoc ten lua, kep phia truoc ve sau ten lua
  const clampItem = (i) => { const c = clampParts(P, i, state.clamp); put(`clamp${i}`, 'clamp', c.svg, c.shapes); };
  clampItem(0); clampItem(1); clampItem(2);

  // ---------- TEN LUA: tang 1, vong lien tang, tang 2, chan fairing, fairing ogive (tat ca tren truc z)
  put('rocket', 'rocket', rocketSvg(P, state.lift), rocketShapes(state.lift));
  clampItem(3);
  return out;
}

// 4 kep theo 4 huong truc (-y sau, -x trai, +x phai, +y truoc) de hop vuong cua kep an khop voi than tron
const CLAMP_DIRS = [[0, -1], [-1, 0], [1, 0], [0, 1]];

/**
 * Kep giu chan i: de co dinh tren mat MLP + ham kep nam TREN mat de, chia vao sat than ten lua (cach 1.2).
 * clamp = 1 (luc T-0): ham kep truot ra ngoai 6 don vi tren mat de, giai phong ten lua.
 */
export function clampParts(P, i, clamp) {
  const [c, s] = CLAMP_DIRS[i];
  const z0 = MLP_Z[1], zt = z0 + 7;
  const rect = (r0, r1, w) => (c !== 0
    ? [[Math.min(c * r0, c * r1), -w, 0], [Math.max(c * r0, c * r1), w, 0]]
    : [[-w, Math.min(s * r0, s * r1), 0], [w, Math.max(s * r0, s * r1), 0]]);
  const [b0, b1] = rect(15, 24, 4);
  const base = [[b0[0], b0[1], z0], [b1[0], b1[1], zt]];
  const open = clamp * 6;
  const [j0, j1] = rect(RK.r + 1.2 + open, 22 + open, 2.6);
  const jaw = [[j0[0], j0[1], zt], [j1[0], j1[1], zt + 4]];
  const tip = [c * (23 + open), s * (23 + open), zt + 4];
  const svg = k.solidSvg(box(P, base[0], base[1], 0.4), { tone: 'mid', inner: k.lineSvg(k.sideSeam({ x: base[0][0], y: base[0][1], w: base[1][0] - base[0][0], d: base[1][1] - base[0][1], r: 0 }, z0 + 3, P, 1), { tone: 'faint' }) }) +
    k.solidSvg(box(P, jaw[0], jaw[1], 0.3), { tone: 'hi', crease: 'lo' }) + k.dotsSvg([k.iso(tip, P)], { size: 0.45 });
  return { svg, shapes: [SB(base[0], base[1], `clamp${i}.base`), SB(jaw[0], jaw[1], `clamp${i}.jaw`)] };
}

const HINGE_R = 3;
function armRing(i, arm) {
  // truc ban le dung, tiep xuc mat tam ga (x = TOWER.x1); can duoi theo +x toi sat than ten lua
  const pivot = [TOWER.x1 + HINGE_R, 0], len = -RK.r - 1.5 - pivot[0], a = -ARM_MAX * arm;
  const rot = ([x, y]) => [pivot[0] + x * Math.cos(a) - y * Math.sin(a), pivot[1] + x * Math.sin(a) + y * Math.cos(a)];
  return {
    beam: [[0, -3], [len - 6, -3], [len - 6, 3], [0, 3]].map(rot),
    hood: [[len - 6, -4.5], [len, -4.5], [len, 4.5], [len - 6, 4.5]].map(rot),
    pivot, z: ARM_Z[i],
  };
}

/** Can noi i o goc mo arm (0 = ap vao ten lua, 1 = quay ra 80 do). Ve lai moi khung trong trang. */
export function armSvg(P, i, arm) {
  const { beam, hood, pivot, z } = armRing(i, arm);
  return k.solidSvg(k.cylinder(pivot[0], pivot[1], HINGE_R, z - 14, 16, P, 18), { tone: 'mid' }) +
    k.solidSvg(k.extrude(beam, z - 9, 6, P), { tone: 'hi', lit: true }) + k.solidSvg(k.extrude(hood, z - 11, 10, P), { tone: 'hi', lit: true });
}

function armShapes(i, arm) {
  const { beam, hood, pivot, z } = armRing(i, arm);
  const owner = `arm${i}`;
  return [{ t: 'cyl', cx: pivot[0], cy: pivot[1], r: HINGE_R, z: z - 14, h: 16, name: `arm${i}.hinge`, owner },
    { t: 'ext', ring: beam, z: z - 9, h: 6, name: `arm${i}.beam`, owner }, { t: 'ext', ring: hood, z: z - 11, h: 10, name: `arm${i}.hood`, owner }];
}

const rocketParts = () => {
  const z1 = RK.base + STAGE1, z2 = z1 + INTER, z3 = z2 + STAGE2, z4 = z3 + SKIRT;
  const ogive = Array.from({ length: 25 }, (_, j) => { const sp = (OGIVE * j) / 24; return [sp, ogiveR(sp), 1]; });
  return { z1, z2, z3, z4, ogive };
};

export function rocketSvg(P, lift = 0) {
  const { z1, z2, z3, z4, ogive } = rocketParts();
  const F = (z) => G.frameAlong([0, 0, z + lift], [0, 0, 1]);
  const S = (p, s) => k.solidSvg(p, s);
  const L = (d, s) => k.lineSvg(d, s);
  const seam1 = [0.3, 0.62].map((f) => G.arcOf(F(RK.base), STAGE1 * f, RK.r, P)).join('');
  return [
    S(G.disc(0, STAGE1, RK.r, F(RK.base), P), { tone: 'hi', inner: L(seam1, { tone: 'faint' }) }),
    S(G.disc(0, INTER, RK.r + 0.6, F(z1), P), { tone: 'mid' }),
    S(G.disc(0, STAGE2, RK.r, F(z2), P), { tone: 'hi', inner: L(G.arcOf(F(z2), STAGE2 * 0.5, RK.r, P), { tone: 'faint' }) }),
    S(G.disc(0, SKIRT, RF, F(z3), P), { tone: 'mid' }),
    S(G.solidOf(ogive, F(z4), P, { smooth: { slope: ogiveSlope, radius: ogiveR } }), { tone: 'hi' }),
  ].join('');
}

function rocketShapes(lift = 0) {
  const { z1, z2, z3, z4 } = rocketParts();
  const o = (z) => [0, 0, z + lift];
  return [
    { t: 'disc', o: o(RK.base), a: [0, 0, 1], s0: 0, s1: STAGE1, r: RK.r, name: 'rocket.s1' },
    { t: 'disc', o: o(z1), a: [0, 0, 1], s0: 0, s1: INTER, r: RK.r + 0.6, name: 'rocket.inter' },
    { t: 'disc', o: o(z2), a: [0, 0, 1], s0: 0, s1: STAGE2, r: RK.r, name: 'rocket.s2' },
    { t: 'disc', o: o(z3), a: [0, 0, 1], s0: 0, s1: SKIRT, r: RF, name: 'rocket.skirt' },
    { t: 'ogive', o: o(z4), name: 'rocket.fairing' },
  ];
}

/** Ogive cho audit: profile da lay mau (dong ve truc o 2 dau trong A.solid). */
export function ogiveProfile() {
  return Array.from({ length: 25 }, (_, j) => { const sp = (OGIVE * j) / 24; return [sp, ogiveR(sp), 1]; });
}
export { ogiveR, ogiveSlope };

/**
 * SVG hoan chinh. Phan dong nam trong <g data-part="arm0|arm1|clamp*|rocket">, de trang web cap nhat rieng.
 * Tra { svg, P }.
 */
export function launchPadSvg({ label = 'Bệ phóng: tháp dịch vụ, cần nối, kẹp giữ chân và tên lửa trên bệ phóng di động.', state, order = ORDER } = {}) {
  const P = projection();
  const list = items(P, state);
  // thu tu ve da do bang kit/audit.mjs (A.settle) trong build -> dung dung thu tu do o moi noi
  if (order?.length) list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const body = list.map((it) => (it.part === 'static' ? it.svg : `<g data-part="${it.part === 'clamp' ? it.id : it.part}">${it.svg}</g>`));
  return { svg: k.figureSvg({ width: W, height: H, label, body }), P };
}

export const ISO_CSS = k.ISO_CSS;
