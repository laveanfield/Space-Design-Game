import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { decodeF32, decodeU8, playSoundAsset } from '../api/client';
import { buildRocket, buildSatellite, loadInstruments, loadRocket, loadSatellite, loadSite } from '../three/modelLoader';
import { buildLaunchComplex, buildServiceTower } from '../three/environments';
import { Puffs, drivePlume, emitLaunchSmoke, padFires, plumeGroup } from '../three/launchFx';

/**
 * Launch3DCanvas -- canh phong 3D: ten lua THAT bay theo du lieu /fly cua backend.
 *
 * Dien bien: dem nguoc -> roi be -> Max-Q -> tach booster / tach tang -> bung fairing -> tach ve tinh, mo canh.
 * Neu backend bao su co (flight.failure): rung, khoi den, roi NO tren khong (cau lua, song xung kich, manh vo).
 *
 * De nhe may: mot renderer, do phan giai toi da 1.5, hat khoi/tia lua la Points (vai tram diem),
 * so lieu HUD ghi thang vao DOM (khong render lai React moi khung hinh).
 */

const SKY_DAY = new THREE.Color(0x6fa8dc);
const SKY_HIGH = new THREE.Color(0x0a1430);
const SKY_SPACE = new THREE.Color(0x020308);
const EARTH_R = 6000; // ban kinh Trai Dat trong canh (don vi canh, khong phai km): chi de thay duong chan troi cong
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);

function seriesOf(flight) {
  const s = flight.series;
  return { dt: s.dt_s, n: s.n, alt: decodeF32(s.alt_km), vel: decodeF32(s.v_inertial_ms), stage: decodeU8(s.stage_idx), tEnd: (s.n - 1) * s.dt_s };
}

/** Noi suy tuyen tinh so lieu tai thoi diem t (giay). */
function sample(S, t) {
  const x = Math.max(0, Math.min(S.n - 1.0001, t / S.dt));
  const i = Math.floor(x), f = x - i;
  return { alt: lerp(S.alt[i], S.alt[i + 1] ?? S.alt[i], f), vel: lerp(S.vel[i], S.vel[i + 1] ?? S.vel[i], f), stage: S.stage[i] };
}

/** Anh dom tron mo (ve mot lan bang canvas 2D) de hat khoi/lua khong bi vuong. */
let softSprite = null;
function softTexture() {
  if (softSprite) return softSprite;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  softSprite = new THREE.CanvasTexture(cv);
  return softSprite;
}

/** Nhom hat (Points) don gian: moi hat co vi tri, van toc, tuoi; het tuoi thi an di. */
function makeParticles(count, { color, size, additive, opacity = 1 }) {
  const pos = new Float32Array(count * 3).fill(1e6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, map: softTexture(), transparent: true, opacity, depthWrite: false, sizeAttenuation: true, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const vel = new Float32Array(count * 3), life = new Float32Array(count);
  let next = 0;
  return {
    points, mat,
    spawn(p, v, ttl) {
      const i = next; next = (next + 1) % count;
      pos.set([p.x, p.y, p.z], i * 3); vel.set([v.x, v.y, v.z], i * 3); life[i] = ttl;
    },
    step(dt, drag = 0) {
      for (let i = 0; i < count; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        if (life[i] <= 0) { pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 1e6; continue; }
        const k = Math.max(0, 1 - drag * dt);
        for (let a = 0; a < 3; a++) { vel[i * 3 + a] *= k; pos[i * 3 + a] += vel[i * 3 + a] * dt; }
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

export default function Launch3DCanvas({ flight, design, audioOn, onEvent, onEnd }) {
  const containerRef = useRef(null);
  const hudRef = useRef({});
  const ctlRef = useRef({ warp: 12, playing: true });
  const cbRef = useRef({ onEvent, onEnd, audioOn });
  cbRef.current = { onEvent, onEnd, audioOn };
  const [warp, setWarp] = useState(12);
  const [playing, setPlaying] = useState(true);
  const [banner, setBanner] = useState(null);
  const [flash, setFlash] = useState(false);
  ctlRef.current.warp = warp;
  ctlRef.current.playing = playing;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !flight) return undefined;
    let disposed = false;
    const S = seriesOf(flight);
    const events = [...(flight.events || [])].sort((a, b) => a.t - b.t);
    const failure = flight.failure || null;
    const tSep = flight.separation?.t ?? S.tEnd + 60;
    const tLast = events.filter((e) => e.name !== 'PAYLOAD_SEP').reduce((m, e) => Math.max(m, e.t), 0); // het nhien lieu tang cuoi
    const vMax = Math.max(1, S.vel[S.n - 1]);
    const say = (name) => cbRef.current.onEvent?.(name);
    const sound = (file, vol = 0.35) => playSoundAsset(cbRef.current.audioOn, file, vol);

    // ---------- canh, camera, anh sang
    const scene = new THREE.Scene();
    scene.background = SKY_DAY.clone();
    const camera = new THREE.PerspectiveCamera(46, (el.clientWidth || 800) / (el.clientHeight || 460), 0.05, 40000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(el.clientWidth || 800, el.clientHeight || 460);
    el.innerHTML = '';
    el.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xcfe3ff, 0.75));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.7);
    sun.position.set(-30, 60, 40);
    scene.add(sun);

    // ---------- khu phong ven bien (nha lap rap lon, duong xe xich, be, cot thu loi, thap nuoc), se tut xuong khi ten lua len cao
    const ground = new THREE.Group();
    const complex = buildLaunchComplex();
    ground.add(complex);
    const padSlab = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 22), new THREE.MeshLambertMaterial({ color: 0xa5a8aa }));
    padSlab.position.y = -1;
    ground.add(padSlab);
    let tower = null; // thap dich vu dung khi biet chieu cao ten lua
    scene.add(ground);
    scene.fog = new THREE.Fog(SKY_DAY.clone(), 1500, 6000);

    // ---------- Trai Dat cong + sao (hien dan khi len cao)
    const earthMat = new THREE.MeshLambertMaterial({ color: 0x2b5f8f });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 64, 48), earthMat);
    earth.visible = false;
    scene.add(earth);
    new THREE.TextureLoader().load('/earth_bluemarble.jpg', (tex) => { if (disposed) return tex.dispose(); tex.colorSpace = THREE.SRGBColorSpace; earthMat.map = tex; earthMat.color.set(0xffffff); earthMat.needsUpdate = true; });
    const starPos = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(18000); if (v.y < -2000) v.y *= -1; starPos.set([v.x, v.y, v.z], i * 3); }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 28, transparent: true, opacity: 0, depthWrite: false });
    scene.add(new THREE.Points(starGeo, starMat));

    // ---------- ten lua (nap bat dong bo), hat khoi/lua
    const stack = new THREE.Group(); // nghieng dan khi bay (gravity turn)
    scene.add(stack);
    const fx = new THREE.Group();
    scene.add(fx);
    let rig = null, satRig = null, H = 20, R = 1, mount = 1.5, kf = 0.6;
    const plumes = []; // {mesh, stage|booster index}
    const debris = []; // {obj, v, w, ttl}
    const sparks = makeParticles(320, { color: 0xffb060, size: 2.2, additive: true });
    const soot = makeParticles(60, { color: 0x2a2624, size: 26, additive: false, opacity: 0.7 });
    fx.add(sparks.points, soot.points);
    // khoi be (thuat toan Puffs cua game Ursina) song trong he mat dat de troi dat cung khoi khi ten lua len cao
    const puffs = new Puffs(420);
    ground.add(puffs.points);
    const fires = padFires(ground);
    const fireballs = [], rings = [];
    let shards = null;

    // lua dong co: plume_mesh cua game (outer + core + quang sang), dat tai tung mieng phun
    const addPlume = (parent, nozzle, kind, key) => {
      const p = plumeGroup(nozzle, kind);
      p.g.visible = false;
      parent.add(p.g);
      plumes.push({ ...p, key });
    };

    (async () => {
      const [rocketModel, satModel, insModels] = await Promise.all([
        loadRocket(design?.launch?.vehicle),
        loadSatellite(design?.bus, design?.comm),
        loadInstruments(design?.instruments),
      ]);
      if (disposed) return;
      if (rocketModel) {
        rig = buildRocket(rocketModel);
        H = rig.info.H; R = rig.info.R;
        rig.info.stages.forEach((st, i) => (st.nozzles || []).forEach((nz) => rig.stages[i] && addPlume(rig.stages[i], nz, st.kind, `s${i}`)));
        rig.info.boosters.forEach((b, i) => (b.nozzles || []).forEach((nz) => rig.boosters[i] && addPlume(rig.boosters[i], nz, 'solid', 'b')));
      } else {
        // khong co model: ten lua du phong la mot tru + chop
        const inner = new THREE.Group();
        const body = new THREE.Group();
        body.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 18, 20).rotateX(Math.PI / 2).translate(0, 0, 9), new THREE.MeshStandardMaterial({ color: 0xe8ecef })));
        inner.add(body); inner.rotation.x = -Math.PI / 2;
        const root = new THREE.Group(); root.add(inner);
        rig = { root, inner, info: { H: 20, R: 1, stages: [{ nozzles: [[0, 0, 0, 0.8]], kind: 'kerolox' }], boosters: [] }, stages: [body], boosters: [], fairing: [], payload: null, extras: [] };
        addPlume(body, [0, 0, 0, 0.8], 'kerolox', 's0');
      }
      stack.add(rig.root);
      kf = 0.55 + (0.45 * R) / 2.7;
      // Bai phong THAT cua game Ursina (thap, can noi, bon, nha xuong, bo bien...) neu da bake; khong thi dung khu phong du phong
      const site = await loadSite(design?.launch?.site, design?.launch?.vehicle);
      if (disposed) return;
      if (site) {
        ground.remove(complex); ground.remove(padSlab);
        ground.add(site.group);
        tower = { arms: site.arms, armSign: 1 };
        mount = site.info.pad.rocket_y;
        rig.extras.forEach((x) => ground.attach(x));
      } else {
        tower = buildServiceTower(H, R);
        ground.add(tower.group);
        padSlab.scale.set(Math.max(1, R * 0.9), 1, Math.max(1, R * 0.9));
      }
      if (site) {
        // (be TEL / chan de da nam trong bai phong)
      } else if (rig.extras.length) {
        // phan phu cua model (vi du be TEL cua Electron) thuoc ve BE PHONG: o lai mat dat, khong bay theo ten lua
        mount = 0;
        rig.extras.forEach((x) => ground.attach(x));
      } else {
        // khong co be trong model: ten lua dung tren 4 chan, cao MOUNT, de thay duoc lua va khoi luc roi be
        mount = H * 0.09;
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(R * 0.25, mount, R * 0.25), padSlab.material);
          leg.position.set(sx * (R + 0.4), mount / 2, sz * (R + 0.4));
          ground.add(leg);
        }
      }
      if (satModel && rig.payload) {
        // thay khoi tai trong chung bang ve tinh THAT (ti le that) nam trong fairing
        satRig = buildSatellite(satModel, { withAdapter: false, design, insModels });
        satRig.inner.rotation.set(0, 0, 0);
        const lo = rig.payload.userData.lo;
        const carrier = new THREE.Group();
        carrier.position.set(0, 0, lo[2] + 0.05);
        carrier.add(satRig.inner);
        rig.payload.clear();
        rig.payload.add(carrier);
      }
      cam.dist = H * 2.7;
    })();

    // ---------- camera: keo de xoay, cuon de phong to
    // goc may ban dau: dung phia bien (+x) nhin vao ten lua, nha lap rap lon nam phia sau
    const cam = { yaw: 1.32, pitch: 0.12, dist: 55, dragging: false, lx: 0, ly: 0, shake: 0, focus: new THREE.Vector3(0, 9, 0) };
    const dom = renderer.domElement;
    const onDown = (e) => { cam.dragging = true; cam.lx = e.clientX; cam.ly = e.clientY; };
    const onMove = (e) => { if (!cam.dragging) return; cam.yaw -= (e.clientX - cam.lx) * 0.008; cam.pitch = Math.max(-0.4, Math.min(1.3, cam.pitch + (e.clientY - cam.ly) * 0.006)); cam.lx = e.clientX; cam.ly = e.clientY; };
    const onUp = () => { cam.dragging = false; };
    const onWheel = (e) => { e.preventDefault(); cam.dist = Math.max(1.2, Math.min(H * 9, cam.dist * (1 + e.deltaY * 0.001))); };
    dom.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); dom.addEventListener('wheel', onWheel, { passive: false });
    const ro = new ResizeObserver(() => { const w = el.clientWidth || 800, h = el.clientHeight || 460; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); });
    ro.observe(el);

    // ---------- trang thai chuyen bay
    const F = { t: -3.2, phase: 'countdown', done: new Set(), pitch: 0, downrange: 0, altKm: 0, vel: 0, stageNow: 0, after: 0, deploy: 0, ended: false, lastCount: 4, fallAlt: 0 };
    const axisOf = () => new THREE.Vector3(Math.sin(F.pitch), Math.cos(F.pitch), 0); // huong mui ten lua trong canh
    const worldOf = (obj) => obj.getWorldPosition(new THREE.Vector3());

    const detach = (obj, v, w, ttl = 7) => {
      if (!obj || !obj.parent) return;
      scene.attach(obj); // giu nguyen vi tri/huong hien tai, tach khoi ten lua
      debris.push({ obj, v, w, ttl });
    };
    const fire = (name) => {
      if (F.done.has(name)) return false;
      F.done.add(name); say(name); return true;
    };

    const explode = () => {
      const at = stack.localToWorld(new THREE.Vector3(0, H * 0.55, 0));
      plumes.forEach((p) => (p.g.visible = false));
      const ax = axisOf();
      for (const part of [...(rig?.stages || []), ...(rig?.boosters || []), ...(rig?.fairing || []), rig?.payload]) {
        const dir = new THREE.Vector3().randomDirection();
        detach(part, dir.multiplyScalar(rand(H * 0.5, H * 1.6)).addScaledVector(ax, H * 0.4), new THREE.Vector3(rand(-3, 3), rand(-3, 3), rand(-3, 3)), 9);
      }
      for (const [color, k] of [[0xffffff, 0.55], [0xffd27a, 0.85], [0xff7a2a, 1.2]]) {
        const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
        ball.position.copy(at); fx.add(ball); fireballs.push({ ball, k, age: 0 });
      }
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.position.copy(at); fx.add(ring); rings.push({ ring, age: 0 });
      shards = new THREE.InstancedMesh(new THREE.BoxGeometry(H * 0.03, H * 0.012, H * 0.05), new THREE.MeshStandardMaterial({ color: 0xcfd3d6, metalness: 0.5, roughness: 0.5 }), 70);
      shards.userData.items = Array.from({ length: 70 }, () => ({ p: at.clone(), v: new THREE.Vector3().randomDirection().multiplyScalar(rand(H * 0.6, H * 2.6)), r: new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6)), w: rand(-6, 6) }));
      fx.add(shards);
      for (let i = 0; i < 300; i++) sparks.spawn(at, new THREE.Vector3().randomDirection().multiplyScalar(rand(H * 1.2, H * 4.5)), rand(0.8, 2.6));
      for (let i = 0; i < 40; i++) soot.spawn(at.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(H * 0.2)), new THREE.Vector3().randomDirection().multiplyScalar(rand(H * 0.1, H * 0.5)), rand(3, 6.5));
      sparks.mat.size = H * 0.05; soot.mat.size = H * 0.55;
      cam.shake = 1;
      setFlash(true); setTimeout(() => !disposed && setFlash(false), 220);
      sound('06-11-2026-sonic_boom.wav', 0.6); sound('08-11-2026-alarm.wav', 0.3);
    };

    const finish = (success, aborted = null) => {
      if (F.ended) return;
      F.ended = true;
      cbRef.current.onEnd?.({ success, failure: aborted ? abortFailure(aborted) : failure, aborted });
    };

    // Nut HUY PHONG: truoc T-0 la hoan phong (scrub); dang bay la kich hoat he thong tu huy an toan (FTS) -> no.
    const abortFailure = (kind) => kind === 'scrub'
      ? { kind: 'scrub', explode: false, title: { vi: 'HOÃN PHÓNG THEO LỆNH KỸ SƯ TRƯỞNG', en: 'LAUNCH SCRUBBED BY CHIEF ENGINEER' },
        cause: { vi: 'Bạn dừng đếm ngược trước khi đánh lửa. Tên lửa an toàn, nhưng chi phí chuẩn bị chuyến bay coi như mất và Sếp không vui.', en: 'You stopped the countdown before ignition. The vehicle is safe but the campaign cost is lost.' }, numbers: [] }
      : { kind: 'fts', explode: true, title: { vi: 'KÍCH HOẠT TỰ HỦY AN TOÀN (FTS)', en: 'FLIGHT TERMINATION SYSTEM ACTIVATED' },
        cause: { vi: 'Bạn ra lệnh hủy chuyến bay khi tên lửa đang bay: hệ thống tự hủy phá tên lửa trên không để bảo vệ khu dân cư. Mất cả tên lửa lẫn vệ tinh.', en: 'You terminated the flight in the air: the range safety system destroyed vehicle and payload.' }, numbers: [] };
    ctlRef.current.abort = () => {
      if (F.ended || F.phase === 'boom') return;
      if (F.phase === 'countdown') {
        F.phase = 'boom'; F.after = 0; fire('SCRUB');
        plumes.forEach((p) => (p.g.visible = false));
        sound('08-11-2026-power_down.wav', 0.35);
        setBanner({ kind: 'fail', title: abortFailure('scrub').title });
        finish(false, 'scrub');
      } else if (F.phase === 'deploy') {
        // da tach ve tinh thanh cong: khong con gi de huy
      } else {
        explode(); F.phase = 'boom'; F.after = 0; fire('FTS');
        setBanner({ kind: 'fail', title: abortFailure('fts').title });
        setTimeout(() => !disposed && finish(false, 'fts'), 2600);
      }
    };

    // ---------- vong lap
    let rafId = 0, last = performance.now(), visible = true;
    const io = new IntersectionObserver((en) => { visible = en[en.length - 1].isIntersecting; });
    io.observe(el);
    const tmp = new THREE.Vector3(), mat4 = new THREE.Matrix4(), quat = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      // gioi han 0.2 s: may yeu (it khung hinh) van chay dung toc do that, khong bi "quay cham"
      const real = Math.min(0.2, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden || !rig) return;
      advance(real);
    };
    // Mot buoc mo phong + ve, dai `real` giay. Tach rieng de co the chay thu tung buoc (window.__launch3d).
    const advance = (real) => {
      const ctl = ctlRef.current;
      const cinematic = F.phase === 'countdown' || F.phase === 'boom' || F.phase === 'deploy' || F.t < 4;
      const dt = ctl.playing ? real * (cinematic ? 1 : ctl.warp) : 0;
      const fxDt = ctl.playing ? real : 0;

      if (F.phase === 'countdown') {
        F.t += dt;
        const c = Math.ceil(-F.t);
        if (c !== F.lastCount && c >= 1 && c <= 3) { F.lastCount = c; sound('06-11-2026-beep.wav', 0.25); }
        if (F.t > -1.2 && fire('IGNITION')) sound('06-11-2026-ignition.wav', 0.4);
        // can noi (umbilical) quay ra xa trong 2 giay cuoi dem nguoc
        if (tower) tower.arms.forEach((a, i) => { a.rotation.y = -1.25 * smooth(-2.2 + i * 0.4, -0.3, F.t); });
        if (F.t >= 0) { F.phase = 'ascent'; fire('LIFTOFF'); sound('06-11-2026-clamp_release.wav', 0.4); sound('06-11-2026-engine_roar.wav', 0.4); }
      } else if (F.phase === 'ascent' || F.phase === 'coast') {
        F.t += dt;
        const s = sample(S, Math.min(F.t, S.tEnd));
        F.vel = s.vel; F.stageNow = s.stage;
        // qua tLast ma khong vao quy dao: het nhien lieu, roi dan
        if (F.t > tLast && failure && failure.kind !== 'structural_maxq') {
          F.phase = 'coast';
          const k = clamp01((F.t - tLast) / Math.max(1, failure.t - tLast));
          F.altKm = s.alt * (1 - 0.55 * k * k);
          F.pitch = lerp(F.pitch, Math.PI * 0.62, clamp01(real * 0.5)); // chui mui xuong
        } else {
          F.altKm = s.alt;
          // Nguoi xem luon thay ten lua bay gan nhu THANG DUNG (camera bam theo, mat dat tut xuong duoi).
          // Goc nghieng nhin thay chi toi da 8 do khi da len cao, giong cach game Ursina dat camera theo truc ten lua.
          F.pitch = ((8 * Math.PI) / 180) * smooth(0.25, 0.95, s.vel / vMax);
        }
        F.downrange = 0; // khong truot ngang tren man hinh
        // --- su kien theo thoi gian
        for (const e of events) {
          if (F.t >= e.t && fire(e.name)) {
            if (e.name === 'MAXQ') sound('06-11-2026-maxq_wind.wav', 0.3);
            if (e.name === 'MECO' || e.name === 'STAGE_SEP') sound('06-11-2026-stage_sep.wav', 0.4);
          }
        }
        // --- tach booster o 55 % thoi gian chay tang 1
        const t1 = events.find((e) => e.name === 'MECO' || e.name === 'STAGE_SEP' || e.name === 'SECO2')?.t ?? S.tEnd;
        if (rig.boosters.length && F.t > 0.55 * t1 && fire('BOOSTER_SEP')) {
          sound('06-11-2026-booster_sep.wav', 0.4);
          rig.boosters.forEach((b, i) => { const p = rig.info.boosters[i].pos; const out = stack.localToWorld(new THREE.Vector3(p[0], 0, -p[1])).sub(worldOf(stack)).normalize(); detach(b, out.multiplyScalar(H * 0.25).addScaledVector(axisOf(), -H * 0.5), new THREE.Vector3(rand(-1, 1), 0, rand(-1, 1)), 6); });
        }
        // --- tach tang: tang da chay het roi lui lai phia sau
        for (let i = 0; i < F.stageNow; i++) {
          if (rig.stages[i]?.parent && rig.stages[i].parent !== scene && fire(`DROP${i}`)) {
            detach(rig.stages[i], axisOf().multiplyScalar(-H * 0.55), new THREE.Vector3(rand(-0.5, 0.5), 0, rand(-0.6, 0.6)), 7);
          }
        }
        // --- bung fairing khi ra khoi khi quyen day
        if (F.altKm > 110 && rig.fairing.length && fire('FAIRING_SEP')) {
          sound('06-11-2026-fairing_sep.wav', 0.4);
          rig.fairing.forEach((f, i) => { const side = stack.localToWorld(new THREE.Vector3(0, 0, i ? 1 : -1)).sub(worldOf(stack)).normalize(); detach(f, side.multiplyScalar(R * 2.2).addScaledVector(axisOf(), -H * 0.12), new THREE.Vector3(i ? 0.9 : -0.9, 0, 0), 7); });
        }
        // --- su co
        if (failure && F.t >= failure.t - 4 && failure.explode) cam.shake = Math.max(cam.shake, 0.25 * smooth(failure.t - 4, failure.t, F.t));
        if (failure && F.t >= failure.t) {
          if (failure.explode) { explode(); F.phase = 'boom'; fire('FAILURE'); setBanner({ kind: 'fail', title: failure.title }); }
          else { F.phase = 'boom'; fire('FAILURE'); plumes.forEach((p) => (p.g.visible = false)); sound('06-11-2026-engine_cut.wav', 0.4); setBanner({ kind: 'fail', title: failure.title }); }
        } else if (!failure && F.t >= tSep) {
          F.phase = 'deploy'; sound('06-11-2026-chime.wav', 0.35);
          rig.fairing.forEach((f) => detach(f, new THREE.Vector3(), new THREE.Vector3(), 0.01));
          setBanner({ kind: 'ok', title: { vi: 'TÁCH VỆ TINH: ĐÃ VÀO QUỸ ĐẠO', en: 'PAYLOAD SEPARATION: IN ORBIT' } });
        }
      } else if (F.phase === 'deploy') {
        F.after += real;
        // tang tren lui lai, camera ap sat ve tinh, canh pin / ang-ten bung ra
        const top = rig.stages[rig.stages.length - 1];
        if (top?.parent === rig.inner) top.position.z -= real * 0.9;
        F.deploy = smooth(1.2, 4.6, F.after);
        satRig?.setDeploy(F.deploy);
        if (F.after > 6.2) finish(true);
      } else if (F.phase === 'boom') {
        F.after += real;
        if (F.after > (failure?.explode ? 5.2 : 3.2)) finish(false);
      }

      // ---------- dat canh theo trang thai
      const altM = F.altKm * 1000;
      stack.rotation.z = -F.pitch;
      ground.position.set(-Math.min(F.downrange, 30000), -altM - mount, 0);
      ground.visible = altM < 9000;
      earth.visible = altM > 2500;
      earth.position.set(0, -(EARTH_R + Math.max(40, F.altKm * 6)), 0);
      earth.rotation.z += (F.vel * Math.sin(F.pitch) * dt) / (EARTH_R * 160);
      const sky = F.altKm < 40 ? SKY_DAY.clone().lerp(SKY_HIGH, F.altKm / 40) : SKY_HIGH.clone().lerp(SKY_SPACE, clamp01((F.altKm - 40) / 60));
      scene.background.copy(sky);
      scene.fog.color.copy(sky);
      scene.fog.far = 6000 + altM * 4; // len cao thi thay xa hon
      starMat.opacity = clamp01((F.altKm - 35) / 60);

      // ---------- lua dong co (drive() cua game): luc day th: dem nguoc tang dan tu luc danh lua, bay = 1
      const burning = (F.phase === 'ascent' && F.t <= tLast + 0.5) || (F.phase === 'countdown' && F.t > -1.2);
      const th = F.phase === 'countdown' ? smooth(-1.2, 0, F.t) : 1;
      for (const p of plumes) {
        const mine = p.key === `s${F.stageNow}` || (p.key === 'b' && !F.done.has('BOOSTER_SEP')) || (p.key === 's0' && F.stageNow === 0);
        const attached = p.g.parent?.parent !== scene;
        drivePlume(p, burning && mine && attached ? th : 0, altM);
      }
      // ---------- khoi be + lua nen (thuat toan Puffs cua game, toa do theo be)
      const lower = burning ? th : 0;
      const tailW = stack.localToWorld(new THREE.Vector3(0, -0.5, 0));
      const tailG = ground.worldToLocal(tailW.clone());
      emitLaunchSmoke(puffs, { pad: new THREE.Vector3(0, 0, 0), kf, lower, h: altM, held: F.phase === 'countdown', tail: tailG, dt: fxDt * (cinematic ? 1 : Math.min(4, ctl.warp)) });
      puffs.update(fxDt, (camera.fov * Math.PI) / 180, renderer.domElement.height);
      fires.drive(lower, altM, kf);
      // rung khi phong (shake cua game): manh khi con gan mat dat, tat dan tu 100 -> 700 m
      if (lower > 0.1 && altM < 700) cam.shake = Math.max(cam.shake, 0.9 * lower * (1 - smooth(100, 700, altM)));
      sparks.step(fxDt, 0.5); soot.step(fxDt, 0.6);

      // ---------- manh vo, cau lua, song xung kich
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.ttl -= fxDt;
        d.obj.position.addScaledVector(d.v, fxDt);
        d.obj.rotation.x += d.w.x * fxDt; d.obj.rotation.y += d.w.y * fxDt; d.obj.rotation.z += d.w.z * fxDt;
        if (d.ttl <= 0) { scene.remove(d.obj); debris.splice(i, 1); }
      }
      for (const fb of fireballs) {
        fb.age += fxDt;
        const k = 1 - Math.exp(-fb.age * 2.4);
        fb.ball.scale.setScalar(H * (0.15 + fb.k * 1.3 * k));
        fb.ball.material.opacity = Math.max(0, 0.95 * (1 - fb.age / (1.6 + fb.k)));
        fb.ball.visible = fb.ball.material.opacity > 0.01;
      }
      for (const r of rings) {
        r.age += fxDt;
        r.ring.scale.setScalar(H * (0.3 + r.age * 5.5));
        r.ring.material.opacity = Math.max(0, 0.9 * (1 - r.age / 1.1));
        r.ring.quaternion.copy(camera.quaternion);
      }
      if (shards) {
        shards.userData.items.forEach((it, i) => {
          it.p.addScaledVector(it.v, fxDt); it.r.x += it.w * fxDt; it.r.y += it.w * 0.7 * fxDt;
          shards.setMatrixAt(i, mat4.compose(it.p, quat.setFromEuler(it.r), one));
        });
        shards.instanceMatrix.needsUpdate = true;
      }

      // ---------- camera
      const centre = stack.localToWorld(tmp.set(0, H * 0.5, 0)).clone();
      let wantDist = cam.dist;
      if (F.phase === 'deploy' && satRig) {
        satRig.inner.getWorldPosition(centre);
        const size = Math.max(...satRig.info.dims) * 5;
        wantDist = lerp(cam.dist, Math.max(1.4, size), smooth(0.2, 2.6, F.after));
        cam.yaw += real * 0.25;
      }
      cam.focus.lerp(centre, clamp01(real * (F.phase === 'deploy' ? 2.5 : 8)));
      const d = wantDist;
      camera.position.set(cam.focus.x + d * Math.cos(cam.pitch) * Math.sin(cam.yaw), cam.focus.y + d * Math.sin(cam.pitch), cam.focus.z + d * Math.cos(cam.pitch) * Math.cos(cam.yaw));
      if (F.phase === 'countdown' || altM < 400) camera.position.y = Math.max(camera.position.y, 2 - altM - mount);
      if (cam.shake > 0.001) {
        camera.position.add(tmp.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(cam.shake * H * 0.035));
        cam.shake *= Math.exp(-real * 1.6);
      }
      camera.lookAt(cam.focus);
      sun.position.copy(camera.position).add(tmp.set(-30, 60, 40));
      renderer.render(scene, camera);

      // ---------- HUD: ghi thang vao DOM
      const h = hudRef.current;
      if (h.met) {
        h.met.textContent = F.t < 0 ? `T-${Math.ceil(-F.t)}` : `T+${F.t.toFixed(0)} s`;
        h.alt.textContent = F.altKm < 10 ? `${F.altKm.toFixed(2)} km` : `${F.altKm.toFixed(0)} km`;
        h.vel.textContent = `${(F.vel / 1000).toFixed(2)} km/s`;
        h.stage.textContent = F.phase === 'deploy' ? 'PAYLOAD' : `S${F.stageNow + 1}`;
        h.velBar.style.width = `${clamp01(F.vel / 7800) * 100}%`;
        h.altBar.style.width = `${clamp01(F.altKm / Math.max(200, S.alt[S.n - 1])) * 100}%`;
      }
    };
    rafId = requestAnimationFrame(tick);
    // Cong cu thu nghiem: tua nhanh `seconds` giay that theo tung khung 1/30 s, khong phu thuoc requestAnimationFrame
    window.__launch3d = {
      state: F,
      ready: () => Boolean(rig),
      advance: (seconds, fps = 30) => { if (!rig) return 0; const t0 = performance.now(); const n = Math.round(seconds * fps); for (let i = 0; i < n; i++) advance(1 / fps); return (performance.now() - t0) / Math.max(1, n); },
    };

    return () => {
      disposed = true;
      delete window.__launch3d;
      cancelAnimationFrame(rafId);
      io.disconnect(); ro.disconnect();
      dom.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); dom.removeEventListener('wheel', onWheel);
      ground.traverse((o) => o.geometry?.dispose());
      [padSlab, earth].forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
      earthMat.map?.dispose();
      starGeo.dispose(); starMat.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight]);

  const setHud = (key) => (node) => { hudRef.current[key] = node; };
  return (
    <div className={`viewport-box launch3d ${flash ? 'flash' : ''}`}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="launch-hud">
        <div className="hud-cell"><span className="hud-label">MET</span><span className="hud-val" ref={setHud('met')}>T-3</span></div>
        <div className="hud-cell"><span className="hud-label">ALT</span><span className="hud-val" ref={setHud('alt')}>0 km</span><div className="hud-bar"><div ref={setHud('altBar')} /></div></div>
        <div className="hud-cell"><span className="hud-label">VEL</span><span className="hud-val" ref={setHud('vel')}>0 km/s</span><div className="hud-bar"><div ref={setHud('velBar')} /></div></div>
        <div className="hud-cell"><span className="hud-label">STAGE</span><span className="hud-val" ref={setHud('stage')}>S1</span></div>
      </div>
      {banner && (
        <div className={`launch-banner ${banner.kind}`}>{banner.kind === 'fail' ? '⚠ ' : ''}{banner.title?.vi || banner.title?.en}</div>
      )}
      <div className="viewport-tools">
        <button className="btn small" onClick={() => setPlaying((p) => !p)}>{playing ? 'TẠM DỪNG' : 'TIẾP TỤC'}</button>
        {[4, 12, 30].map((w) => (
          <button key={w} className={`btn small ${warp === w ? 'primary' : ''}`} onClick={() => setWarp(w)}>{w}x</button>
        ))}
        {!banner && (
          <button className="btn small danger" onClick={() => ctlRef.current.abort?.()} title="Hủy phóng: mất 1 vạch uy tín">
            ✕ HỦY PHÓNG
          </button>
        )}
      </div>
      <div className="viewport-hint">Kéo để xoay camera • Cuộn để phóng to</div>
    </div>
  );
}
