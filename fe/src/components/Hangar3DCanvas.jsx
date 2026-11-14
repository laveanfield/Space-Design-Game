import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BUS_DIMS = {
  'BUS-3U': [0.1, 0.1, 0.34],
  'BUS-6U': [0.1, 0.2263, 0.366],
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

  // Diagnostic Status Ring around Hangar Base
  let ringColor = 0x48c9ff;
  if (report) {
    ringColor = report.ok ? 0x38e594 : report.launch_allowed ? 0xffb84d : 0xff5c6c;
  }
  const ringMat = new THREE.MeshBasicMaterial({
    color: ringColor,
    transparent: true,
    opacity: 0.45,
  });
  const statusRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.015, 8, 64), ringMat);
  statusRing.rotation.x = Math.PI / 2;
  statusRing.position.y = -1.1;
  root.add(statusRing);

  return root;
}

export default function Hangar3DCanvas({ design, catalog, report, theme }) {
  const containerRef = useRef(null);
  const satGroupRef = useRef(null);
  const sceneRef = useRef(null);
  const rotRef = useRef({ yaw: 0.55, pitch: 0.35, zoom: 4.1, dragging: false, lx: 0, ly: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = el.clientWidth || 500;
    const height = el.clientHeight || 410;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    el.innerHTML = '';
    el.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xd9f5ea, 0.72);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(4, 6, 5);
    const rimLight = new THREE.DirectionalLight(0x38e594, 0.65);
    rimLight.position.set(-4, -2, -4);
    scene.add(ambient, keyLight, rimLight);

    const gridColor = theme === 'light' ? 0x4b7565 : 0x1e4a38;
    const grid = new THREE.GridHelper(6, 16, gridColor, gridColor);
    grid.position.y = -1.12;
    scene.add(grid);

    const resizeObserver = new ResizeObserver(() => {
      if (!el) return;
      const w = el.clientWidth || 500;
      const h = el.clientHeight || 410;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(el);

    const onDown = (e) => {
      rotRef.current.dragging = true;
      rotRef.current.lx = e.clientX;
      rotRef.current.ly = e.clientY;
    };
    const onMove = (e) => {
      if (!rotRef.current.dragging) return;
      const dx = e.clientX - rotRef.current.lx;
      const dy = e.clientY - rotRef.current.ly;
      rotRef.current.lx = e.clientX;
      rotRef.current.ly = e.clientY;
      rotRef.current.yaw += dx * 0.01;
      rotRef.current.pitch = Math.max(-1.2, Math.min(1.2, rotRef.current.pitch + dy * 0.01));
    };
    const onUp = () => {
      rotRef.current.dragging = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      rotRef.current.zoom = Math.max(2.3, Math.min(7.5, rotRef.current.zoom + e.deltaY * 0.002));
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!rotRef.current.dragging) {
        rotRef.current.yaw += 0.004;
      }
      const { yaw, pitch, zoom } = rotRef.current;
      camera.position.set(
        zoom * Math.cos(pitch) * Math.sin(yaw),
        zoom * Math.sin(pitch) + 0.15,
        zoom * Math.cos(pitch) * Math.cos(yaw)
      );
      camera.lookAt(0, -0.1, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [theme]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !design) return;

    if (satGroupRef.current) {
      scene.remove(satGroupRef.current);
      satGroupRef.current.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const nextSat = buildSatelliteGroup(design, catalog, report);
    satGroupRef.current = nextSat;
    scene.add(nextSat);
  }, [design, catalog, report]);

  const busDims = BUS_DIMS[design?.bus] || null;
  return (
    <div className="viewport-box">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="viewport-overlay">
        HANGAR_3D // {design?.bus || 'NO_BUS'}
        {busDims ? ` (${busDims[0]}×${busDims[1]}×${busDims[2]} m)` : ''}
        <br />
        PWR: {design?.power || '-'} | COM: {design?.comm || '-'}
      </div>
      <div className="viewport-hint">Drag to orbit • Scroll to zoom</div>
    </div>
  );
}
