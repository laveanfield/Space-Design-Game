import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function linkStateColor(state) {
  switch (state) {
    case 'LOCK':
      return 0x38e594;
    case 'MARGINAL':
      return 0xffb84d;
    case 'DEGRADED':
      return 0xff5c6c;
    default:
      return 0x355c4e;
  }
}

export default function OrbitOps3DCanvas({ snapshot, design, catalog }) {
  const containerRef = useRef(null);
  const dynamicRef = useRef({
    satGroup: null,
    orbitGroup: null,
    beamLine: null,
    beamMat: null,
    ambient: null,
    sunLight: null,
    satPivot: null,
    stationMarker: null,
  });
  const camState = useRef({ yaw: 0.65, pitch: 0.4, zoom: 7.4, dragging: false, lx: 0, ly: 0 });
  const latestSnapRef = useRef(snapshot);
  latestSnapRef.current = snapshot;

  const orbitObj = catalog?.tables?.orbits?.[design?.orbit];
  const altKm = Number(orbitObj?.altitude_km || snapshot?.flight?.alt_km || 550);
  const incDeg = Number(orbitObj?.inclination_deg || 53);
  const orbitRadius = 2.0 + Math.max(0.45, Math.min(2.6, Math.log10(Math.max(200, altKm) / 100) * 1.1));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const scene = new THREE.Scene();
    const width = el.clientWidth || 560;
    const height = el.clientHeight || 410;
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    el.innerHTML = '';
    el.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xbbe6ff, 0.55);
    const sunLight = new THREE.DirectionalLight(0xfff6e5, 1.45);
    sunLight.position.set(10, 4, 8);
    scene.add(ambient, sunLight);
    dynamicRef.current.ambient = ambient;
    dynamicRef.current.sunLight = sunLight;

    // Starfield backdrop
    const starPts = [];
    for (let i = 0; i < 400; i++) {
      const r = 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPts.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xa4d9c4, size: 0.14 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Earth Sphere + Texture Loader
    const earthGeo = new THREE.SphereGeometry(2.0, 40, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1b4e8c,
      roughness: 0.8,
      metalness: 0.08,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      '/earth_bluemarble.jpg',
      (tex) => {
        earthMat.color.setHex(0xffffff);
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {
        // fallback stays solid ocean blue if texture unavailable
      }
    );

    // Subtle atmosphere grid shell
    const atmoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.04, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0x48c9ff,
        wireframe: true,
        transparent: true,
        opacity: 0.09,
      })
    );
    scene.add(atmoMesh);

    // Ground Station Marker on Earth Surface
    const stationMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x38e594 })
    );
    stationMarker.position.set(1.62, 0.92, 0.72);
    earthMesh.add(stationMarker);
    dynamicRef.current.stationMarker = stationMarker;

    // Inclined Orbit Ring + Satellite Pivot
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    dynamicRef.current.orbitGroup = orbitGroup;

    const ringPts = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    const ringMat = new THREE.LineBasicMaterial({ color: 0x38e594, transparent: true, opacity: 0.5 });
    const ringLine = new THREE.LineLoop(ringGeo, ringMat);
    orbitGroup.add(ringLine);
    orbitGroup.rotation.z = (incDeg * Math.PI) / 180;

    // Miniature Spacecraft
    const satPivot = new THREE.Group();
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.24, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xe0a229, metalness: 0.75, roughness: 0.3 })
    );
    const wingL = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.02, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x164191, metalness: 0.4, roughness: 0.25 })
    );
    wingL.position.x = -0.34;
    const wingR = wingL.clone();
    wingR.position.x = 0.34;
    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xe6edf0 })
    );
    dish.position.y = -0.17;
    satPivot.add(satBody, wingL, wingR, dish);
    orbitGroup.add(satPivot);
    dynamicRef.current.satPivot = satPivot;

    // RF/Optical Link Beam Line
    const beamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(orbitRadius, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const beamMat = new THREE.LineBasicMaterial({ color: 0x355c4e, transparent: true, opacity: 0.85 });
    const beamLine = new THREE.Line(beamGeo, beamMat);
    scene.add(beamLine);
    dynamicRef.current.beamLine = beamLine;
    dynamicRef.current.beamMat = beamMat;

    const resizeObserver = new ResizeObserver(() => {
      const w = el.clientWidth || 560;
      const h = el.clientHeight || 410;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(el);

    const dom = renderer.domElement;
    const onDown = (e) => {
      camState.current.dragging = true;
      camState.current.lx = e.clientX;
      camState.current.ly = e.clientY;
    };
    const onMove = (e) => {
      if (!camState.current.dragging) return;
      const dx = e.clientX - camState.current.lx;
      const dy = e.clientY - camState.current.ly;
      camState.current.lx = e.clientX;
      camState.current.ly = e.clientY;
      camState.current.yaw += dx * 0.01;
      camState.current.pitch = Math.max(-1.25, Math.min(1.25, camState.current.pitch + dy * 0.01));
    };
    const onUp = () => {
      camState.current.dragging = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      camState.current.zoom = Math.max(3.6, Math.min(14, camState.current.zoom + e.deltaY * 0.003));
    };

    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const satWorld = new THREE.Vector3();
    const gsWorld = new THREE.Vector3();
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const snap = latestSnapRef.current;
      // snap.auto: man "12 thang tren quy dao" khong co dong ho backend -> tu quay theo dong ho trinh duyet
      const simT = snap?.auto ? (performance.now() / 1000) * 12 : Number(snap?.t || 0);
      if (snap?.dead) {
        // ve tinh chet: lon nhao, khong con giu huong
        satPivot.rotation.x += 0.03;
        satPivot.rotation.z += 0.021;
      }

      earthMesh.rotation.y += 0.0012;

      const phaseAngle = simT * 0.015;
      satPivot.position.set(
        Math.cos(phaseAngle) * orbitRadius,
        0,
        Math.sin(phaseAngle) * orbitRadius
      );

      // Apply backend attitude quaternion q = [w, x, y, z]
      const qArr = snap?.attitude?.q;
      if (Array.isArray(qArr) && qArr.length === 4) {
        satPivot.quaternion.set(qArr[1], qArr[2], qArr[3], qArr[0]).normalize();
      }

      // Eclipse dimming
      const inEclipse = Boolean(snap?.power?.eclipse);
      sunLight.intensity = inEclipse ? 0.45 : 1.45;
      ambient.intensity = inEclipse ? 0.32 : 0.62;

      // Update link beam from satellite to ground station (or nadir if NO_PASS)
      satPivot.getWorldPosition(satWorld);
      const linkState = snap?.link?.state || 'NO_PASS';
      beamMat.color.setHex(linkStateColor(linkState));
      if (linkState === 'NO_PASS') {
        beamMat.opacity = 0.25;
        gsWorld.copy(satWorld).normalize().multiplyScalar(2.0);
      } else {
        beamMat.opacity = 0.92;
        stationMarker.getWorldPosition(gsWorld);
      }
      const posAttr = beamLine.geometry.getAttribute('position');
      posAttr.setXYZ(0, satWorld.x, satWorld.y, satWorld.z);
      posAttr.setXYZ(1, gsWorld.x, gsWorld.y, gsWorld.z);
      posAttr.needsUpdate = true;

      const { yaw, pitch, zoom } = camState.current;
      camera.position.set(
        zoom * Math.cos(pitch) * Math.sin(yaw),
        zoom * Math.sin(pitch),
        zoom * Math.cos(pitch) * Math.cos(yaw)
      );
      camera.lookAt(0, 0, 0);
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
  }, [orbitRadius, incDeg]);

  const linkState = snapshot?.link?.state || 'INIT';
  const station = snapshot?.link?.station || 'N/A';

  return (
    <div className="viewport-box">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="viewport-overlay">
        ORBIT_OPS_3D // {design?.orbit || '-'} ({incDeg.toFixed(1)}° | {altKm} km)
        <br />
        LINK: {linkState} ({station}) {snapshot?.power?.eclipse ? '• ECLIPSE' : '• SUNLIT'}
      </div>
      <div className="viewport-hint">Drag to rotate • Scroll to zoom</div>
    </div>
  );
}
