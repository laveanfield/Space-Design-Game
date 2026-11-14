/**
 * launchFx -- hieu ung phong, CHUYEN NGUYEN thuat toan tu game Ursina (08-11-2026-rocket_game_ursina_v6.py):
 *   - plumeGroup(): ngon lua = 2 mat tron xoay (outer: tron alpha, core: cong sang) theo plume_mesh() cua
 *     model_rocket_generic.py (profile, mau theo doan, "kim cuong soc" o loi), + quang sang (tex_glow).
 *   - drivePlume(): co gian theo do cao (pfac = exp(-h/7000), loe rong o chan khong exp_w) va luc day, rung nhe.
 *   - Puffs: be khoi (tex_puff) -- spawn/update y het lop Puffs cua game: lon dan theo sqrt(tuoi), mo dan (1-u)^1.2,
 *     van toc tat dan (1 - 0.35 dt). Ve bang 1 lan goi GPU (Points + shader), toi da 420 hat.
 */
import * as THREE from 'three';
import { siteTexture } from './modelLoader';

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);

/** plume_mesh(r_e, L, core) cua game: tra cac vong [r, z, rgba] voi z tang dan (z <= 0: lua phun xuong duoi). */
function plumeProfile(re, L, core) {
  const n = 22, out = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    let r = re * (1 + 0.5 * s) * Math.pow(Math.max(1 - Math.pow(s, 1.7), 0), 0.7);
    if (core) r *= 0.62;
    const z = -L * s * (core ? 0.62 : 1.0);
    const d = core ? 0.72 + 0.28 * Math.cos(2 * Math.PI * s * 4.5) ** 2 : 1.0; // kim cuong soc
    let c;
    if (core) c = [1.0, 0.86, 0.52, 0.9 * d * (1 - s * s)];
    else if (s < 0.35) { const t = s / 0.35; c = [1.0, 0.66 - 0.16 * t, 0.26 - 0.14 * t, 0.62 * (1 - 0.25 * t)]; }
    else { const t = (s - 0.35) / 0.65; c = [1.0 - 0.15 * t, 0.62 - 0.4 * t, 0.2 - 0.12 * t, 0.46 * Math.pow(1 - t, 1.4)]; }
    out.push([Math.max(r, 1e-3), z, c]);
  }
  return out.reverse();
}

/** Lua hydrolox (H2/O2): xanh nhat, gan nhu trong suot (plume_mesh_hydrolox cua rocket_stages). */
function hydroProfile(re, L, core) {
  return plumeProfile(re, L, core).map(([r, z, c], i, arr) => {
    const s = i / (arr.length - 1);
    return [r, z, core ? [0.75, 0.85, 1.0, c[3] * 0.9] : [0.62 + 0.2 * s, 0.74 + 0.1 * s, 1.0, c[3] * 0.8]];
  });
}

function latheWithColors(profile, seg = 20) {
  const pts = profile.map(([r, z]) => new THREE.Vector2(r, z));
  const geo = new THREE.LatheGeometry(pts, seg);
  const cols = new Float32Array(geo.attributes.position.count * 4);
  const per = profile.length;
  for (let v = 0; v < geo.attributes.position.count; v++) cols.set(profile[v % per][2], v * 4);
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 4));
  geo.rotateX(Math.PI / 2); // truc lathe (y) -> truc z cua ten lua
  return geo;
}

const PLUME_L = 14.0; // luoi dung voi L = 14 m, roi co gian theo Lm nhu game
const FLAME_BOOST = 2.2; // phong to cho de nhin tren man hinh web nho (game Ursina chay toan man hinh)
const KIND_LS = { solid: 1.0, hypergolic: 0.8, kerolox: 0.85, methalox: 0.8, hydrolox: 0.7 };

// ---------------------------------------------------------------- vat lieu lua (shader)
// Ban cu dung MeshBasicMaterial: alpha deu quanh vong -> vien lua hien ra nhu mot khoi tron dac ("qua bong").
// Lua that phat sang tu ben trong: sang nhat o truc, mo dan ra mep (nhin xien qua it khi nong hon),
// chap chon theo dong khi va tat dan ve cuoi. Shader duoi lam dung 3 viec do:
//   edge  = |N.V|^k      -> mep mem, khong con duong vien cung
//   turb  = nhieu cuon theo truc (thoi gian) -> lua "song", khong dung yen
//   tail  = mo dan o 25 % cuoi chieu dai, sang ngay mieng phun
const FLAME_VS = `
attribute vec4 color;
uniform float uLen;
varying vec4 vC; varying vec3 vN; varying vec3 vV; varying float vS; varying float vAng;
void main() {
  vC = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vS = clamp(-position.z / uLen, 0.0, 1.0);
  vAng = atan(position.y, position.x);
  gl_Position = projectionMatrix * mv;
}`;
const FLAME_FS = `
uniform float uTime; uniform float uOpacity; uniform float uEdge; uniform float uGain;
varying vec4 vC; varying vec3 vN; varying vec3 vV; varying float vS; varying float vAng;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  float facing = abs(dot(normalize(vN), normalize(vV)));
  float edge = pow(facing, uEdge);
  vec2 q = vec2(vAng * 1.6, vS * 9.0 - uTime * 7.0);
  float turb = 0.62 + 0.38 * noise(q) + 0.18 * (noise(q * 2.3 + 4.0) - 0.5);
  float tail = 1.0 - smoothstep(0.72, 1.0, vS);
  float a = vC.a * edge * turb * tail * uOpacity;
  vec3 col = vC.rgb * (uGain + 0.5 * edge);
  gl_FragColor = vec4(col, a); // AdditiveBlending: mau dich += mau * a
  if (a < 0.002) discard;
}`;

function flameMaterial(len, edgePow, gain) {
  return new THREE.ShaderMaterial({
    vertexShader: FLAME_VS,
    fragmentShader: FLAME_FS,
    uniforms: { uLen: { value: len }, uTime: { value: 0 }, uOpacity: { value: 1 }, uEdge: { value: edgePow }, uGain: { value: gain } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, // lua la nguon sang: cong mau, khong che khuat nhau
  });
}

/** Mot ngon lua tai mieng phun (x, y, z, r_e) trong he z-up cua ten lua. Giong make_plume() cua game. */
export function plumeGroup([x, y, z, re], kind) {
  const hydro = kind === 'hydrolox';
  const prof = hydro ? hydroProfile : plumeProfile;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const outer = new THREE.Mesh(latheWithColors(prof(re, PLUME_L, false)), flameMaterial(PLUME_L, 1.8, 0.9));
  const core = new THREE.Mesh(latheWithColors(prof(re, PLUME_L, true)), flameMaterial(PLUME_L * 0.62, 0.9, 1.25));
  core.renderOrder = 2;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: siteTexture('glow', false), color: hydro ? 0x99bfff : 0xff9e38, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.z = -0.5;
  g.add(outer, core, glow);
  const Ls = Math.min((KIND_LS[kind] ?? 0.85) * Math.pow(re / 0.7, 0.7), 2.4);
  return { g, outer, core, glow, re, Ls, hydro };
}

/** drive() cua game: th = muc luc day 0..1, h = do cao (m). */
export function drivePlume(p, th, h) {
  const pfac = Math.exp(-h / 7000); // ap suat khi quyen tuong doi: 1 o mat dat, ~0 ngoai khong gian
  // Chan khong: khi phut ra loe rong nhung rat loang -> gan nhu trong suot. Ban cu loe toi ~6 lan be ngang
  // voi do dac nhu o mat dat nen thanh "qua bong" sang. Gio chi loe ~2.2 lan va mo di theo pfac.
  const expW = 1 + 1.2 * Math.pow(1 - pfac, 1.4);
  const Lm = (9 + 14 * (1 - pfac)) * th * p.Ls * FLAME_BOOST;
  const on = th > 0.05 && Lm > 0.1;
  p.g.visible = on;
  if (!on) return;
  const fl = 1 + rand(-0.06, 0.06);
  const w = expW * (0.85 + 0.15 * th);
  p.outer.scale.set(w, w, Math.max(0.05, Lm / PLUME_L) * fl);
  p.core.scale.set(1, 1, p.outer.scale.z * (0.9 + 0.1 * pfac)); // loi sang khong loe theo, giu manh o mieng phun
  p.outer.rotation.z = Math.random() * Math.PI * 2;
  const t = performance.now() / 1000;
  p.outer.material.uniforms.uTime.value = t;
  p.core.material.uniforms.uTime.value = t + 3.7;
  const gs = Math.pow(p.re / 0.7, 0.6);
  const vac = 0.35 + 0.65 * pfac; // do sang chung giam khi ra chan khong
  if (p.hydro) {
    p.outer.material.uniforms.uOpacity.value = 0.45 * vac;
    p.core.material.uniforms.uOpacity.value = 0.95;
    p.glow.scale.setScalar((4.2 + 3.0 * th) * fl * gs);
    p.glow.material.opacity = 0.45;
  } else {
    p.outer.material.uniforms.uOpacity.value = 0.85 * vac;
    p.core.material.uniforms.uOpacity.value = 0.75 + 0.25 * pfac;
    p.glow.scale.setScalar((3.0 + 4.0 * th) * fl * gs);
    p.glow.material.opacity = Math.min(1, 0.6 * (0.4 + 0.6 * pfac));
  }
}

// ---------------------------------------------------------------- be khoi (Puffs)
const PUFF_VS = `
attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
uniform float uScale; varying float vA; varying vec3 vC;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  vA = aAlpha; vC = aColor;
}`;
const PUFF_FS = `
uniform sampler2D uMap; varying float vA; varying vec3 vC;
void main() {
  vec4 t = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(vC * t.rgb, t.a * vA);
  if (gl_FragColor.a < 0.003) discard;
}`;

export class Puffs {
  constructor(n = 420) {
    this.n = n;
    this.pos = new Float32Array(n * 3).fill(1e7);
    this.size = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.color = new Float32Array(n * 3);
    this.items = Array.from({ length: n }, () => null);
    this.next = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.color, 3));
    this.material = new THREE.ShaderMaterial({ vertexShader: PUFF_VS, fragmentShader: PUFF_FS, transparent: true, depthWrite: false, uniforms: { uMap: { value: siteTexture('puff', false) }, uScale: { value: 400 } } });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.geo = geo;
  }
  /** Giong Puffs.spawn(pos, vel, size, life, col, grow, a0) cua game. */
  spawn(p, v, size, life, col, grow = 2.0, a0 = 0.6) {
    const i = this.next; this.next = (this.next + 1) % this.n;
    this.items[i] = { p: p.clone(), v: v.clone(), age: 0, life, grow, s0: size, a0 };
    this.color.set(col, i * 3);
  }
  update(dt, cameraFovRad, viewH) {
    this.material.uniforms.uScale.value = viewH / (2 * Math.tan(cameraFovRad / 2));
    for (let i = 0; i < this.n; i++) {
      const it = this.items[i];
      if (!it) continue;
      it.age += dt;
      if (it.age >= it.life) { this.items[i] = null; this.pos[i * 3] = 1e7; this.alpha[i] = 0; continue; }
      const u = it.age / it.life;
      it.p.addScaledVector(it.v, dt);
      it.v.multiplyScalar(Math.max(0, 1 - 0.35 * dt));
      this.pos.set([it.p.x, it.p.y, it.p.z], i * 3);
      this.size[i] = it.s0 * (1 + (it.grow - 1) * Math.sqrt(u));
      this.alpha[i] = it.a0 * Math.pow(1 - u, 1.2) * Math.min(1, it.age * 3);
    }
    for (const k of ['position', 'aSize', 'aAlpha', 'aColor']) this.geo.attributes[k].needsUpdate = true;
  }
  clear() { this.items.fill(null); this.pos.fill(1e7); this.alpha.fill(0); }
}

/**
 * Khoi/lua o be (phan "hat khoi" trong vong lap cua game). pad = goc toa do be (mat dat, he canh), kf = he so co be.
 * lower = luc day tang duoi (0..1), h = do cao (m), held = con giu tren be (dem nguoc), tail = vi tri duoi ten lua.
 */
export function emitLaunchSmoke(puffs, { pad, kf, lower, h, held, tail, dt }) {
  if (lower <= 0.05 || h >= 4300) return;
  if (h < 160) {
    const n = Math.floor(2 + 2 * lower);
    for (let k = 0; k < n; k++) {
      const sgn = Math.random() < 0.5 ? -1 : 1, zz = rand(-9, 9) * kf;
      puffs.spawn(new THREE.Vector3(pad.x + sgn * rand(6, 16) * kf, pad.y + rand(2, 6), pad.z + zz), new THREE.Vector3(sgn * rand(18, 42), rand(4, 11), rand(-9, 9)),
        rand(14, 26) * kf, rand(7, 10), [0.93, 0.92, 0.9], 2.7, 0.55);
    }
    if (Math.random() < 0.5) {
      puffs.spawn(new THREE.Vector3(pad.x + rand(-70, 70), pad.y + 1.5, pad.z + rand(-60, 60)), new THREE.Vector3(rand(-14, 14), rand(2, 7), rand(-14, 14)),
        rand(16, 30) * kf, rand(6, 9), [0.8, 0.72, 0.6], 2.4, 0.42);
    }
  }
  if (!held && lower > 0.5 && Math.random() < Math.min(1, 22 * dt * (0.3 + 0.7 * sstep(0, 800, h) + 0.2))) {
    puffs.spawn(tail.clone().add(new THREE.Vector3(rand(-2, 2), rand(-2, 0), rand(-2, 2))), new THREE.Vector3(rand(-3, 3), 0, rand(-3, 3)),
      rand(9, 16) * kf, rand(9, 14), [0.97, 0.97, 0.98], 3.0 + h / 2500, 0.55);
  }
}

/** 8 dom lua sang quanh be (fires[] cua game), manh dan khi ten lua len cao. */
export function padFires(parent) {
  const list = [];
  for (const [x, y, z, s] of [[-17, 3.5, 0, 34], [17, 3.5, 0, 34], [-30, 4.5, -3, 42], [30, 4.5, 3, 42], [0, 4.0, -22, 30], [0, 4.0, 22, 30], [-8, 2.5, 8, 26], [8, 2.5, -8, 26]]) {
    const q = new THREE.Sprite(new THREE.SpriteMaterial({ map: siteTexture('glow', false), color: 0xff8029, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    q.position.set(x, y, z); q.scale.setScalar(s); parent.add(q); list.push({ q, s });
  }
  return {
    drive(lower, h, kf) {
      const fa = lower * (1 - sstep(30, 420, h));
      for (const { q, s } of list) {
        q.visible = fa > 0.02;
        if (q.visible) { q.scale.setScalar(s * kf * (0.9 + 0.25 * Math.random()) * (1 + h / 300)); q.material.opacity = 0.4 * fa; }
      }
    },
  };
}
