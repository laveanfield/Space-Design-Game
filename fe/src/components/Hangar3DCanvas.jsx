import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGame } from '../core/GameContext';
import { tr } from '../core/i18n';
import { buildRocket, buildSatellite, loadInstruments, loadRocket, loadSatellite } from '../three/modelLoader';
import { addAdapterBelow } from '../three/payloadAdapter';
import { buildHangarEnv, buildIntegrationHall } from '../three/environments';

const BUS_DIMS = {
  'BUS-3U': [0.1, 0.1, 0.34],
  'BUS-6U': [0.1, 0.2, 0.34], // theo model 14-11-2026 (NASA CubeSat 101: 20 cm la suy ra tu trang 14)
  'BUS-12U': [0.2263, 0.2263, 0.366],
  'BUS-ESPA': [0.7, 0.6, 0.95],
  'BUS-SMALL500': [1.0, 1.0, 1.5],
  'BUS-LARGE-LEO': [2.0, 2.0, 3.6],
  'BUS-GEO': [2.4, 2.0, 3.6],
};

function buildSatelliteGroup(design, catalog, report) {
  const root = new THREE.Group();
  const busId = design?.bus || 'BUS-3U';
  const powerId = design?.power || 'PWR-SA-DEP';
  const commId = design?.comm || 'COM-S-CUBE';
  const instruments = Array.isArray(design?.instruments) ? design.instruments : [];

  const dims = BUS_DIMS[busId] || [0.5, 0.5, 0.8];
  const [bw, bd, bh] = dims;
  const norm = 1.55 / Math.max(bw, bd, bh);
  const w = bw * norm;
  const d = bd * norm;
  const h = bh * norm;

  const matAlu = new THREE.MeshStandardMaterial({
    color: 0xc2d0d8,
    metalness: 0.7,
    roughness: 0.32,
  });
  const matDarkAlu = new THREE.MeshStandardMaterial({
    color: 0x33414a,
    metalness: 0.65,
    roughness: 0.4,
  });
  const matGoldMli = new THREE.MeshStandardMaterial({
    color: 0xe0a229,
    metalness: 0.82,
    roughness: 0.28,
  });
  const matSolar = new THREE.MeshStandardMaterial({
    color: 0x12326e,
    metalness: 0.45,
    roughness: 0.22,
    emissive: 0x061333,
  });
  const matWhiteCeramic = new THREE.MeshStandardMaterial({
    color: 0xe6edf0,
    metalness: 0.15,
    roughness: 0.45,
  });
  const matLens = new THREE.MeshStandardMaterial({
    color: 0x38e5ff,
    emissive: 0x0b586e,
    metalness: 0.3,
    roughness: 0.1,
  });

  // Main structural bus body
  const busGroup = new THREE.Group();
  const isEspaOrBig =
    busId === 'BUS-ESPA' ||
    busId === 'BUS-SMALL500' ||
    busId === 'BUS-LARGE-LEO' ||
    busId === 'BUS-GEO';

  if (isEspaOrBig) {
    // Upper structural bay + lower gold MLI thermal wrap section
    const upperGeo = new THREE.BoxGeometry(w, h * 0.48, d);
    const upperMesh = new THREE.Mesh(upperGeo, matAlu);
    upperMesh.position.y = h * 0.26;
    busGroup.add(upperMesh);

    const lowerGeo = new THREE.BoxGeometry(w * 1.03, h * 0.52, d * 1.03);
    const lowerMesh = new THREE.Mesh(lowerGeo, matGoldMli);
    lowerMesh.position.y = -h * 0.24;
    busGroup.add(lowerMesh);
  } else {
    // CubeSat structural rails + frame
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matDarkAlu);
    busGroup.add(bodyMesh);
    const plateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.92, h * 0.94, d * 1.02),
      matAlu
    );
    busGroup.add(plateMesh);
  }
  root.add(busGroup);

  // Solar Arrays
  const isBodyMounted = powerId.includes('BODY');
  if (isBodyMounted) {
    // Flush body-mounted cells on +X, -X, +Z faces
    const padX = new THREE.Mesh(new THREE.BoxGeometry(0.02, h * 0.82, d * 0.82), matSolar);
    padX.position.x = w * 0.5 + 0.015;
    root.add(padX);

    const padXNeg = padX.clone();
    padXNeg.position.x = -(w * 0.5 + 0.015);
    root.add(padXNeg);

    const padZ = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, h * 0.82, 0.02), matSolar);
    padZ.position.z = d * 0.5 + 0.015;
    root.add(padZ);
  } else {
    let segCount = 2;
    if (powerId.includes('GEO') || busId === 'BUS-GEO') segCount = 4;
    else if (powerId.includes('LARGE') || busId === 'BUS-12U' || busId === 'BUS-LARGE-LEO') segCount = 3;
    else if (powerId.includes('SMALL') || busId === 'BUS-6U') segCount = 2;

    const segLen = powerId.includes('DEP') ? 0.52 : powerId.includes('GEO') ? 0.68 : 0.6;
    const wingWidth = Math.max(d * 0.8, 0.42);
    const singleSideOnly = busId === 'BUS-LARGE-LEO';
    const sides = singleSideOnly ? [1] : [-1, 1];

    sides.forEach((dir) => {
      const wing = new THREE.Group();
      const yoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8),
        matDarkAlu
      );
      yoke.rotation.z = Math.PI / 2;
      yoke.position.x = dir * (w * 0.5 + 0.11);
      wing.add(yoke);

      for (let i = 0; i < segCount; i++) {
        const panelFrame = new THREE.Mesh(
          new THREE.BoxGeometry(segLen, 0.026, wingWidth),
          matDarkAlu
        );
        const cells = new THREE.Mesh(
          new THREE.BoxGeometry(segLen * 0.92, 0.032, wingWidth * 0.88),
          matSolar
        );
        const xCenter = dir * (w * 0.5 + 0.22 + (i + 0.5) * (segLen + 0.04));
        panelFrame.position.x = xCenter;
        cells.position.x = xCenter;
        wing.add(panelFrame, cells);
      }
      root.add(wing);
    });

    if (singleSideOnly) {
      // Counterweight magnetometer/sensor boom on -X
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.8, 8), matAlu);
      boom.rotation.z = Math.PI / 2;
      boom.position.x = -(w * 0.5 + 0.4);
      root.add(boom);
    }
  }

  // Nadir Payload Bay / Instruments (-Y direction is nadir-facing in display)
  const payloadCount = Math.max(1, instruments.length);
  instruments.forEach((insId, idx) => {
    const insObj = catalog?.tables?.instruments?.[insId];
    const kind = (insObj?.kind || insObj?.type || '').toLowerCase();
    const offsetZ = payloadCount === 1 ? 0 : (idx - (payloadCount - 1) / 2) * (d * 0.42);

    if (insId === 'INS-08' || kind.includes('mag') || kind.includes('particle')) {
      // Deployable magnetometer boom on +Y/side
      const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.9, 8), matAlu);
      magBoom.position.set(0, h * 0.5 + 0.45, offsetZ * 0.5);
      const sensorHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), matGoldMli);
      sensorHead.position.set(0, h * 0.5 + 0.92, offsetZ * 0.5);
      root.add(magBoom, sensorHead);
    } else if (kind.includes('sar') || kind.includes('radar')) {
      // Flat phased-array radar panel nadir
      const sarPanel = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.95, 0.06, d * 0.55),
        matGoldMli
      );
      sarPanel.position.set(0, -(h * 0.5 + 0.07), offsetZ);
      root.add(sarPanel);
    } else {
      // Optical telescope / spectrometer baffle
      const radius = Math.min(w, d) * 0.24;
      const baffle = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.05, radius * 0.85, 0.24, 16),
        matDarkAlu
      );
      baffle.position.set(0, -(h * 0.5 + 0.12), offsetZ);
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.03, 16),
        matLens
      );
      glass.position.set(0, -(h * 0.5 + 0.23), offsetZ);
      root.add(baffle, glass);
    }
  });

  // Comm Antenna Array (+Z / forward deck or dorsal boom)
  const commGroup = new THREE.Group();
  commGroup.position.set(0, 0, d * 0.5 + 0.04);
  if (commId === 'COM-UHF') {
    const whip1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.72, 6), matAlu);
    whip1.rotation.z = 0.45;
    whip1.position.set(0.14, h * 0.42, 0);
    const whip2 = whip1.clone();
    whip2.rotation.z = -0.45;
    whip2.position.x = -0.14;
    commGroup.add(whip1, whip2);
  } else if (commId === 'COM-S-CUBE') {
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.03), matWhiteCeramic);
    const active = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.036), matGoldMli);
    commGroup.add(patch, active);
  } else if (commId === 'COM-X-SMALL') {
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.05, 0.22, 4), matAlu);
    horn.rotation.x = Math.PI / 2;
    horn.rotation.y = Math.PI / 4;
    horn.position.z = 0.1;
    commGroup.add(horn);
  } else if (commId === 'COM-OPT-LEO') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.14, 12), matDarkAlu);
    base.rotation.x = Math.PI / 2;
    const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), matAlu);
    gimbal.position.z = 0.12;
    const laserLens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), matLens);
    laserLens.rotation.x = Math.PI / 2;
    laserLens.position.z = 0.2;
    commGroup.add(base, gimbal, laserLens);
  } else {
    // Parabolic dishes: COM-KA-LEO (0.5m), COM-X-MGA (0.6m), COM-X-HGA (1.5m), COM-KA-GEO (2.2m)
    const dishR =
      commId === 'COM-KA-GEO' ? 0.48 : commId === 'COM-X-HGA' ? 0.36 : commId === 'COM-X-MGA' ? 0.24 : 0.2;
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.24, 8), matDarkAlu);
    boom.rotation.x = Math.PI / 2;
    boom.position.z = 0.1;
    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(dishR, dishR * 0.22, dishR * 0.35, 20, 1, true),
      matWhiteCeramic
    );
    dish.material.side = THREE.DoubleSide;
    dish.rotation.x = Math.PI / 2;
    dish.position.z = 0.24;

    const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.028, dishR * 0.7, 8), matGoldMli);
    feed.rotation.x = Math.PI / 2;
    feed.position.z = 0.24 + dishR * 0.32;
    commGroup.add(boom, dish, feed);

    if (commId === 'COM-KA-GEO') {
      const feed2 = feed.clone();
      feed2.position.x = 0.14;
      const feed3 = feed.clone();
      feed3.position.x = -0.14;
      commGroup.add(feed2, feed3);
    }
  }
  root.add(commGroup);

  // Propulsion / Reboost Tank (-Z aft)
  const orbitObj = catalog?.tables?.orbits?.[design?.orbit];
  const needsReboost =
    isEspaOrBig ||
    (orbitObj?.class && orbitObj.class !== 'LEO') ||
    (design?.reboost_fuel_kg || 0) > 0;
  if (needsReboost) {
    const tank = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.22, 14, 14), matAlu);
    tank.position.set(0, -h * 0.1, -(d * 0.5 + 0.06));
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.09, 0.16, 12),
      matDarkAlu
    );
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, -h * 0.1, -(d * 0.5 + 0.19));
    root.add(tank, nozzle);
  }

  // (Vong trang thai duoi de da bo: xuong lap rap co ban xoay that, va man che tao khong phan xet thiet ke.)
  return root;
}

/** Giai phong hinh hoc/vat lieu cua mot nhom du phong (model that dung chung cache nen KHONG giai phong). */
function disposeGroup(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
  });
}

/** Hop bao cua mot nhom o trang thai hien tai -> [kich thuoc lon nhat, tam]. */
function fitOf(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  return { max: Math.max(size.x, size.y, size.z) || 1, size, center: box.getCenter(new THREE.Vector3()) };
}

/**
 * Xuong lap rap 3D.
 * - view "sat": ve tinh THAT theo (bus, comm) da chon, co nut gap/mo canh pin, roi ang-ten.
 * - view "rocket": ten lua THAT theo launch vehicle da chon.
 * Model chua co trong thu muc /models -> dung model du phong (cac khoi hop) nhu truoc.
 * Chi dung lai khi bus/comm/vehicle doi; khong dung lai moi lan /evaluate tra ve.
 */
export default function Hangar3DCanvas({ design, catalog, theme }) {
  const { lang } = useGame();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const stageRef = useRef({
    holder: null,
    rig: null,
    fallback: null,
    obj: null,
    pivot: null,
    f: 0.15,
    fTarget: 1,
    pop: 1,
    fitStowed: 1,
    fitOpen: 1,
    sizeYStowed: 1,
    sizeYOpen: 1,
    centerStowed: new THREE.Vector3(),
    centerOpen: new THREE.Vector3(),
  });
  const rotRef = useRef({ yaw: 0.55, pitch: 0.28, zoom: 5.2, dragging: false, lx: 0, ly: 0 });
  const [view, setView] = useState('sat');
  const [deployed, setDeployed] = useState(true);
  const [source, setSource] = useState('');

  const busId = design?.bus;
  const commId = design?.comm;
  const vehicleId = design?.launch?.vehicle;
  const powerId = design?.power;
  const batteryId = design?.battery;
  const obcId = design?.obc;
  const adcsId = design?.adcs;
  const instrumentsKey = (design?.instruments || []).join(',');
  const orbitId = design?.orbit;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const width = el.clientWidth || 500;
    const height = el.clientHeight || 410;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    el.innerHTML = '';
    el.appendChild(renderer.domElement);

    // Anh sang xuong: den tran trang + hat dien xanh nhe; nen xam-xanh dam nhu trong nha xuong
    scene.background = new THREE.Color(theme === 'light' ? 0xdfe6ea : 0x1a2229);
    scene.fog = new THREE.Fog(scene.background, 9, 22);
    scene.add(new THREE.HemisphereLight(0xf2f7ff, 0x5a6066, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(4, 7, 5);
    const rimLight = new THREE.DirectionalLight(0x8fd8ff, 0.55);
    rimLight.position.set(-4, 3, -5);
    scene.add(keyLight, rimLight);
    // 2 boi canh: xuong sach cho VE TINH, toa tich hop thang dung cho TEN LUA (ten lua ~75 % chieu cao toa)
    const env = buildHangarEnv();
    scene.add(env);
    const hall = buildIntegrationHall({ rocketH: 2.6, rocketR: 0.14 });
    hall.group.visible = false;
    scene.add(hall.group);
    stageRef.current.envSat = env;
    stageRef.current.hall = hall;

    const holder = new THREE.Group();
    scene.add(holder);
    stageRef.current.holder = holder;

    const resizeObserver = new ResizeObserver(() => {
      const w = el.clientWidth || 500;
      const h = el.clientHeight || 410;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(el);

    // Xoay camera: bat con tro (pointer capture) de keo ra ngoai canvas khong bi tuot; goc ngang khong cho chui
    // xuong duoi san (pitch >= -0.05) hay nhin thang tu dinh; khoang cach toi thieu lon hon model -> model khong "mat".
    const rot = rotRef.current;
    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    const onDown = (e) => { rot.dragging = true; rot.lx = e.clientX; rot.ly = e.clientY; dom.setPointerCapture?.(e.pointerId); };
    const onMove = (e) => {
      if (!rot.dragging) return;
      rot.yaw -= (e.clientX - rot.lx) * 0.008;
      rot.pitch = Math.max(-0.05, Math.min(1.05, rot.pitch + (e.clientY - rot.ly) * 0.006));
      rot.lx = e.clientX; rot.ly = e.clientY;
    };
    const onUp = (e) => { rot.dragging = false; dom.releasePointerCapture?.(e.pointerId); };
    const onWheel = (e) => { e.preventDefault(); rot.zoom = Math.max(3.4, Math.min(8.5, rot.zoom + e.deltaY * 0.003)); };
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerup', onUp);
    dom.addEventListener('pointercancel', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Khong ve khi canvas khong nam trong man hinh hoac tab bi an -> may nhe hon
    let visible = true;
    const io = new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; });
    io.observe(el);

    let rafId = 0;
    let last = performance.now();
    const animate = (now) => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden) return;
      const st = stageRef.current;
      if (!rot.dragging && st.view !== 'rocket') rot.yaw += 0.24 * dt; // toa tich hop: dung yen, nhin tu phia truoc
      // gap/mo canh pin muot (khoang 1,4 giay)
      if (st.rig?.setDeploy && Math.abs(st.fTarget - st.f) > 1e-4) {
        st.f += Math.sign(st.fTarget - st.f) * Math.min(Math.abs(st.fTarget - st.f), dt / 1.4);
        st.rig.setDeploy(st.f);
      }
      // model moi "bat" vao vi tri: phong nhe tu 0.86 -> 1
      st.pop += (1 - st.pop) * Math.min(1, dt * 9);
      const rocketView = st.view === 'rocket';
      if (st.pivot && st.obj) {
        const tDeploy = rocketView ? 0 : st.f;
        const fit = st.fitStowed + (st.fitOpen - st.fitStowed) * tDeploy;
        const curSizeY = st.sizeYStowed + (st.sizeYOpen - st.sizeYStowed) * tDeploy;
        st.obj.position.lerpVectors(st.centerStowed, st.centerOpen, tDeploy).multiplyScalar(-1);
        st.pivot.scale.setScalar(fit * st.pop);
        const baseTop = rocketView && st.hall ? st.hall.mlpTop : -0.92;
        st.pivot.position.y = baseTop + (curSizeY * fit * st.pop) / 2 + 0.02;
      }
      // camera luon nhin vao TAM model; mode ten lua: lui xa va nhin cao hon de thay ca toa tich hop
      // ngoai troi (toa tich hop) -> nen troi xanh; trong xuong sach -> nen xam
      scene.background.set(rocketView ? 0xa9c9e6 : theme === 'light' ? 0xdfe6ea : 0x1a2229);
      scene.fog.color.copy(scene.background);
      scene.fog.near = rocketView ? 14 : 9; scene.fog.far = rocketView ? 40 : 22;
      const ty = rocketView ? 0.45 : 0.15;
      const zoom = rocketView ? rot.zoom * 1.3 : rot.zoom;
      const pitch = rocketView ? Math.min(rot.pitch, 0.3) : rot.pitch;
      const yaw = rocketView ? Math.max(-0.7, Math.min(0.7, Math.atan2(Math.sin(rot.yaw), Math.cos(rot.yaw)))) : rot.yaw;
      camera.position.set(zoom * Math.cos(pitch) * Math.sin(yaw), ty + zoom * Math.sin(pitch), zoom * Math.cos(pitch) * Math.cos(yaw));
      camera.lookAt(0, ty, 0);
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      io.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('pointercancel', onUp);
      dom.removeEventListener('wheel', onWheel);
      env.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      hall.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      if (stageRef.current.fallback) disposeGroup(stageRef.current.fallback);
      stageRef.current = {
        holder: null,
        rig: null,
        fallback: null,
        obj: null,
        pivot: null,
        f: 0.15,
        fTarget: 1,
        pop: 1,
        fitStowed: 1,
        fitOpen: 1,
        sizeYStowed: 1,
        sizeYOpen: 1,
        centerStowed: new THREE.Vector3(),
        centerOpen: new THREE.Vector3(),
      };
      renderer.dispose();
    };
  }, [theme]);

  // Doi model khi linh kien lien quan doi
  useEffect(() => {
    const st = stageRef.current;
    if (!st.holder || !design) return undefined;
    let cancelled = false;
    const setAdapterVisible = (rigObj, visible) => {
      rigObj?.inner?.traverse((o) => {
        if (o.userData?.role === 'adapter') o.visible = visible;
      });
    };
    const place = (rig, fallback, label) => {
      if (cancelled || !st.holder) return;
      if (st.fallback) disposeGroup(st.fallback);
      st.holder.clear();
      st.rig = rig;
      st.fallback = fallback;
      const obj = fallback || rig.root;
      obj.scale.setScalar(1);
      obj.position.set(0, 0, 0);
      if (rig?.setDeploy) {
        setAdapterVisible(rig, false);
        rig.setDeploy(1);
        const open = fitOf(obj);
        setAdapterVisible(rig, true);
        rig.setDeploy(0);
        const stowed = fitOf(obj);
        st.fitStowed = 2.3 / stowed.max;
        st.fitOpen = 2.9 / open.max;
        st.sizeYStowed = stowed.size.y;
        st.sizeYOpen = open.size.y;
        st.centerStowed.copy(stowed.center);
        st.centerOpen.copy(open.center);
        setAdapterVisible(rig, !deployed || view !== 'sat');
        rig.setDeploy(st.f);
      } else if (rig) {
        const fit = fitOf(obj);
        st.fitStowed = st.fitOpen = 2.6 / fit.max;
        st.sizeYStowed = st.sizeYOpen = fit.size.y;
        st.centerStowed.copy(fit.center);
        st.centerOpen.copy(fit.center);
      } else {
        const fit = fitOf(obj);
        st.fitStowed = st.fitOpen = 1;
        st.sizeYStowed = st.sizeYOpen = fit.size.y || 1.9;
        st.centerStowed.copy(fit.center);
        st.centerOpen.copy(fit.center);
      }
      const pivot = new THREE.Group();
      pivot.add(obj);
      const rocketView = view === 'rocket';
      st.view = view;
      st.obj = obj;
      st.pivot = pivot;
      if (st.envSat) st.envSat.visible = !rocketView;
      if (st.hall) st.hall.group.visible = rocketView;
      const tDeploy = rocketView ? 0 : st.f;
      const fitNow = st.fitStowed + (st.fitOpen - st.fitStowed) * tDeploy;
      const sizeYNow = st.sizeYStowed + (st.sizeYOpen - st.sizeYStowed) * tDeploy;
      obj.position.lerpVectors(st.centerStowed, st.centerOpen, tDeploy).multiplyScalar(-1);
      pivot.scale.setScalar(fitNow);
      pivot.position.y = (rocketView && st.hall ? st.hall.mlpTop : -0.92) + (sizeYNow * fitNow) / 2 + 0.02;
      st.holder.add(pivot);
      if (rig) { st.rig = { ...rig, root: pivot }; }
      else { st.fallback = pivot; }
      st.pop = 0.88;
      setSource(label);
    };
    (async () => {
      if (view === 'rocket') {
        const model = await loadRocket(vehicleId);
        if (model) return place(buildRocket(model), null, 'MODEL THAT');
      } else {
        const [model, insModels] = await Promise.all([
          loadSatellite(busId, commId),
          loadInstruments(design?.instruments),
        ]);
        if (model) {
          // ve tinh dung tren DOAN CHOP NOI (payload adapter) nhu luc gan len tang tren cua ten lua
          const satRig = buildSatellite(model, { withAdapter: false, design, insModels });
          addAdapterBelow(satRig);
          return place(satRig, null, 'MODEL THAT');
        }
      }
      return place(null, buildSatelliteGroup(design, catalog, null), 'MODEL DU PHONG');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, busId, commId, vehicleId, powerId, batteryId, obcId, adcsId, instrumentsKey, orbitId, catalog, theme]);

  // Nut gap/mo: chi doi muc tieu, vong lap ve tu chay muot toi do
  useEffect(() => {
    const st = stageRef.current;
    st.fTarget = deployed && view === 'sat' ? 1 : 0;
    if (st.rig?.inner) {
      st.rig.inner.traverse((o) => { if (o.userData?.role === 'adapter') o.visible = !deployed || view !== 'sat'; });
    }
  }, [deployed, view, source, busId, commId, powerId, batteryId, obcId, adcsId, instrumentsKey]);

  const sourceLabel =
    source === 'MODEL THAT'
      ? tr(lang, 'MÔ HÌNH CHUẨN', 'CAD MODEL')
      : source
        ? tr(lang, 'MÔ HÌNH DỰ PHÒNG', 'FALLBACK MODEL')
        : '';

  const busDims = BUS_DIMS[design?.bus] || null;
  return (
    <div className="viewport-box">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="viewport-overlay">
        {view === 'sat' ? `HANGAR_3D // ${design?.bus || 'NO_BUS'}` : `HANGAR_3D // ${design?.launch?.vehicle || 'NO_LV'}`}
        {view === 'sat' && busDims ? ` (${busDims[0]}×${busDims[1]}×${busDims[2]} m)` : ''}
        <br />
        PWR: {design?.power || '-'} | COM: {design?.comm || '-'} | BAT: {design?.battery || '-'}
        <br />
        OBC: {design?.obc || '-'} | ADCS: {design?.adcs || '-'} | INS: {(design?.instruments || []).length} | {sourceLabel}
      </div>
      <div className="viewport-tools">
        <button className={`btn small ${view === 'sat' ? 'primary' : ''}`} onClick={() => setView('sat')}>
          {tr(lang, 'VỆ TINH', 'SATELLITE')}
        </button>
        <button className={`btn small ${view === 'rocket' ? 'primary' : ''}`} onClick={() => setView('rocket')}>
          {tr(lang, 'TÊN LỬA', 'ROCKET')}
        </button>
        {view === 'sat' && (
          <button className="btn small" onClick={() => setDeployed((d) => !d)}>
            {deployed ? tr(lang, 'GẬP CÁNH', 'STOW WINGS') : tr(lang, 'MỞ CÁNH / ĂNG-TEN', 'DEPLOY WINGS')}
          </button>
        )}
      </div>
      <div className="viewport-hint">{tr(lang, 'Kéo để xoay • Cuộn để phóng to', 'Drag to rotate • Scroll to zoom')}</div>
    </div>
  );
}

