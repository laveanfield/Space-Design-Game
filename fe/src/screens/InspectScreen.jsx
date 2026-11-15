import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { beep, playGasHiss, playSoundAsset } from '../api/client';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';
import { buildRocket, buildSatellite, loadInstruments, loadRocket, loadSatellite } from '../three/modelLoader';
import { addAdapterBelow, mountSatelliteOnAdapter } from '../three/payloadAdapter';

/**
 * InspectScreen (Phase 03.INSPECT) -- Phong kiem dinh truoc phong voi 3 nhiem vu:
 * 1. GAS_LEAK_AUDIO: KHONG hien diem tren 3D, nguoi choi phai lia chuot nghe tieng xi ga TO DAN roi NHO DAN de bam trung cho xi.
 * 2. STRUCT_CRACK_XRAY: KHONG hien diem tron, chi hien duong ngoan nghoeo nho mau vang khi bat X-Ray (Rocket dom co 2-3 vet o ca FULL STACK & PAYLOAD FOCUS).
 * 3. CAMERA_TILT_ALIGN: Guong phan xa cua Camera bi lech & ro banh rang / ket lo xo do do dom -> keo nang tay hon, tha som bi bat nguoc, phai giu o 0.0° de siet chot.
 */

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function InspectScreen() {
  const {
    design,
    inspectSession,
    startLaunchFromInspect,
    audioOn,
    busy,
    setPhase,
    tutorialMode,
    setTutorialStep,
    completeTutorialToBrief,
    lang,
  } = useGame();

  const defects = useMemo(() => inspectSession?.defects || [], [inspectSession]);
  const leakDefect = useMemo(() => defects.find((d) => d.id === 'GAS_LEAK_AUDIO'), [defects]);
  const crackDefect = useMemo(() => defects.find((d) => d.id === 'STRUCT_CRACK_XRAY'), [defects]);
  const camDefect = useMemo(() => defects.find((d) => d.id === 'CAMERA_TILT_ALIGN'), [defects]);
  const totalCracks = crackDefect?.cracks?.length || 1;

  const [timeLeft, setTimeLeft] = useState(inspectSession?.timeLimit ?? 60);
  const [detectedIds, setDetectedIds] = useState(['CAMERA_TILT_ALIGN']);
  const [fixedIds, setFixedIds] = useState([]);
  const [fixedCracks, setFixedCracks] = useState([]);
  const [yawTarget, setYawTarget] = useState(0);
  const [inspectMode, setInspectMode] = useState('stack'); // 'stack' | 'payload'
  const [xrayMode, setXrayMode] = useState(false);

  // Goc nghieng Guong Camera (keo chuot + giu chot o 0.0 do)
  const initialTilt = camDefect?.initialTiltDeg ?? -24;
  const [cameraAngle, setCameraAngle] = useState(initialTilt);
  const [draggingCam, setDraggingCam] = useState(false);
  const [mirrorLockPct, setMirrorLockPct] = useState(0);
  const dragStartRef = useRef({ x: 0, startAngle: initialTilt });

  const [meters, setMeters] = useState({
    pressureDiff: 4,
    structVib: 6,
    camTiltErr: Math.min(100, Math.abs(initialTilt) * 3.4),
  });
  const [scanHint, setScanHint] = useState({
    vi: '1: NGHE TIẾNG XÌ GA TO DẦN ĐỂ BẤM (KHÔNG HIỆN ĐIỂM) • 2: BẬT X-RAY TÌM ĐƯỜNG NỨT VÀNG NHỎ • 3: GHÌ CHUỘT CHỈNH GƯƠNG CAMERA VỀ 0°',
    en: '1: LISTEN FOR PROPELLANT LEAK HISS • 2: ENABLE X-RAY TO SPOT YELLOW CRACKS • 3: DRAG CAMERA MIRROR TO 0°',
  });

  const mountRef = useRef(null);
  const pointerRef = useRef({ mx: 0.5, my: 0.5, inside: false });
  const fixedRef = useRef(fixedIds);
  fixedRef.current = fixedIds;
  const fixedCracksRef = useRef(fixedCracks);
  fixedCracksRef.current = fixedCracks;
  const audioRef = useRef(audioOn);
  audioRef.current = audioOn;
  const yawRef = useRef(0);
  yawRef.current = yawTarget;
  const modeRef = useRef('stack');
  modeRef.current = inspectMode;
  const xrayRef = useRef(false);
  xrayRef.current = xrayMode;
  const camAngleRef = useRef(cameraAngle);
  camAngleRef.current = cameraAngle;
  const submittedRef = useRef(false);

  // Reset moi phien kiem dinh
  useEffect(() => {
    submittedRef.current = false;
    const tilt0 = inspectSession?.defects?.find((d) => d.id === 'CAMERA_TILT_ALIGN')?.initialTiltDeg ?? -24;
    setTimeLeft(inspectSession?.timeLimit ?? 60);
    setDetectedIds(['CAMERA_TILT_ALIGN']);
    setFixedIds([]);
    setFixedCracks([]);
    setXrayMode(false);
    setInspectMode('stack');
    setCameraAngle(tilt0);
    setMirrorLockPct(0);
    setScanHint({
      vi: '1: NGHE TIẾNG XÌ GA TO DẦN ĐỂ BẤM (KHÔNG HIỆN ĐIỂM) • 2: BẬT X-RAY TÌM ĐƯỜNG NỨT VÀNG NHỎ • 3: GHÌ CHUỘT CHỈNH GƯƠNG CAMERA VỀ 0°',
      en: '1: LISTEN FOR PROPELLANT LEAK HISS • 2: ENABLE X-RAY TO SPOT YELLOW CRACKS • 3: DRAG CAMERA MIRROR TO 0°',
    });
  }, [inspectSession]);

  // Dong bo buoc huong dan Ky su truong theo tien do sua 3 loi
  useEffect(() => {
    const hasLeak = fixedIds.includes('GAS_LEAK_AUDIO');
    const hasCrack = fixedIds.includes('STRUCT_CRACK_XRAY');
    const hasCam = fixedIds.includes('CAMERA_TILT_ALIGN');
    if (hasLeak && hasCrack && hasCam) {
      setTutorialStep?.(3);
    } else if (hasLeak && hasCrack) {
      setTutorialStep?.(2);
    } else if (hasLeak) {
      setTutorialStep?.(1);
    }
  }, [fixedIds, setTutorialStep]);

  // Dong ho dem nguoc
  useEffect(() => {
    if (!inspectSession) return undefined;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (tutorialMode && prev <= 20) {
          return 20;
        }
        if (prev <= 1) {
          clearInterval(id);
          if (!submittedRef.current) {
            submittedRef.current = true;
            startLaunchFromInspect(fixedRef.current);
          }
          return 0;
        }
        if (prev <= 11) playSoundAsset(audioRef.current, '06-11-2026-beep.wav', 0.14);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectSession, tutorialMode]);

  const markFixed = (id) => {
    setFixedIds((prev) => {
      if (prev.includes(id)) return prev;
      playSoundAsset(audioRef.current, '06-11-2026-beep_go.wav', 0.42);
      return [...prev, id];
    });
    setDetectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (id === 'CAMERA_TILT_ALIGN') {
      setCameraAngle(0);
      setMirrorLockPct(100);
    }
  };

  // Co che Giu & Siet Chot Guong Camera tai vung 0.0° (±0.35°) + Do truot banh rang khi tha chuot som
  useEffect(() => {
    if (fixedIds.includes('CAMERA_TILT_ALIGN')) return undefined;
    const isBasicCam = camDefect?.cameraTier === 'basic';
    const id = setInterval(() => {
      const cur = camAngleRef.current;
      if (Math.abs(cur) <= 0.35) {
        // Dang giu guong trong vung chuan 0.0 do -> tang tien trinh siet chot
        setMirrorLockPct((p) => {
          const step = isBasicCam ? 20 : 28;
          const next = Math.min(100, p + step);
          if (next >= 100) {
            markFixed('CAMERA_TILT_ALIGN');
          } else {
            beep(audioRef.current, 740 + next * 3, 0.025);
          }
          return next;
        });
      } else {
        setMirrorLockPct((p) => Math.max(0, p - 25));
        // Neu khong giu chuot ma guong chua khoa -> lo xo bi ro keo guong lech tro lai!
        if (!draggingCam && Math.abs(cur - initialTilt) > 0.5) {
          const driftStep = isBasicCam ? 1.35 : 0.65;
          const dir = initialTilt > cur ? 1 : -1;
          setCameraAngle((a) => Math.round((a + dir * driftStep) * 10) / 10);
        }
      }
    }, 110);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingCam, fixedIds, initialTilt, camDefect]);

  const handleStagePointerDown = (e) => {
    if (e.target.closest('.viewport-tools')) return;
    if (fixedIds.includes('CAMERA_TILT_ALIGN')) return;
    setDraggingCam(true);
    dragStartRef.current = { x: e.clientX, startAngle: cameraAngle, moved: false };
  };

  useEffect(() => {
    if (!draggingCam) return undefined;
    const onWinMove = (e) => {
      if (fixedIds.includes('CAMERA_TILT_ALIGN')) return;
      const dx = e.clientX - dragStartRef.current.x;
      if (Math.abs(dx) > 4) {
        dragStartRef.current.moved = true;
      }
      if (!dragStartRef.current.moved) return;
      const isBasicCam = camDefect?.cameraTier === 'basic';
      // Camera dom co banh rang nang tay hon (he so 0.062) va do khac/ro banh rang (backlash cogging)
      const gearScale = isBasicCam ? 0.062 : 0.088;
      const backlash = isBasicCam ? Math.sin(dx * 0.22) * 0.55 : Math.sin(dx * 0.18) * 0.2;
      let nextAngle = dragStartRef.current.startAngle + dx * gearScale + backlash;
      nextAngle = Math.max(-30, Math.min(30, nextAngle));
      nextAngle = Math.round(nextAngle * 10) / 10;
      setCameraAngle(nextAngle);
    };
    const onWinUp = () => {
      setDraggingCam(false);
    };
    window.addEventListener('pointermove', onWinMove);
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinUp);
    return () => {
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinUp);
    };
  }, [draggingCam, fixedIds, camDefect]);

  // Three.js Diagnostic Bay:
  // 1. Audio Gas Leak (Invisible anchor - sound only!)
  // 2. X-Ray Wireframe + Small Squiggly Yellow Crack Lines (Multiple cracks for cheap rockets!)
  // 3. Camera Tilt visual
  useEffect(() => {
    const el = mountRef.current;
    if (!el || !design) return undefined;
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040908);
    const w = el.clientWidth || 640;
    const h = el.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 40);
    camera.position.set(0, 0.1, 4.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h);
    el.innerHTML = '';
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x243b33, 0.55));
    const rim = new THREE.DirectionalLight(0x38e594, 0.45);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    const spot = new THREE.SpotLight(0xffe6a8, 12, 16, 0.36, 0.72, 1.2);
    spot.position.set(0, 0.4, 3.6);
    const spotTarget = new THREE.Object3D();
    scene.add(spot, spotTarget);
    spot.target = spotTarget;

    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.72, 0.06, 28),
      new THREE.MeshStandardMaterial({ color: 0x16241f, metalness: 0.6, roughness: 0.4 })
    );
    stand.position.y = -1.25;
    scene.add(stand);

    const assembly = new THREE.Group();
    scene.add(assembly);

    const meshMaterials = [];
    const xrayWireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });

    // 1. Anchor VO HINH cho GAS_LEAK_AUDIO (Khong hien bat ky diem nao tren man hinh!)
    let leakAnchor = null;
    if (leakDefect) {
      leakAnchor = new THREE.Object3D();
      leakAnchor.position.set(leakDefect.pos[0], leakDefect.pos[1], leakDefect.pos[2]);
      assembly.add(leakAnchor);
    }

    // 2. Cac duong ngoan nghoeo nho mau vang cho STRUCT_CRACK_XRAY (Khong co diem tron/orb)
    const crackVisuals = [];
    if (crackDefect?.cracks) {
      crackDefect.cracks.forEach((cr, idx) => {
        const g = new THREE.Group();
        g.position.set(cr.pos[0], cr.pos[1], cr.pos[2]);

        // Tao 1 duong ngoan nghoeo nho (squiggly micro-crack) mau vang #ffdd22
        const dir = idx % 2 === 0 ? 1 : -1;
        const pts = [
          new THREE.Vector3(-0.042 * dir, -0.036, 0.015),
          new THREE.Vector3(-0.026 * dir, -0.014, 0.02),
          new THREE.Vector3(-0.008 * dir, -0.025, 0.022),
          new THREE.Vector3(0.006 * dir, 0.004, 0.024),
          new THREE.Vector3(-0.009 * dir, 0.018, 0.022),
          new THREE.Vector3(0.019 * dir, 0.026, 0.02),
          new THREE.Vector3(0.012 * dir, 0.041, 0.018),
          new THREE.Vector3(0.038 * dir, 0.052, 0.015),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
          color: 0xffdd22,
          transparent: true,
          opacity: 0.92,
        });
        const line1 = new THREE.Line(geo, mat);
        // Ve them 1 nhanh re nho sat ben de duong ngoan nghoeo ro net tren nen luoi trang
        const branchPts = [
          new THREE.Vector3(0.006 * dir, 0.004, 0.024),
          new THREE.Vector3(0.024 * dir, -0.007, 0.022),
          new THREE.Vector3(0.034 * dir, 0.003, 0.02),
        ];
        const branchGeo = new THREE.BufferGeometry().setFromPoints(branchPts);
        const line2 = new THREE.Line(branchGeo, mat);

        g.add(line1, line2);
        g.visible = false;
        assembly.add(g);
        crackVisuals.push({ subId: cr.subId, mode: cr.mode, group: g, mat });
      });
    }

    let stackObj = null;
    let satHolder = null;
    (async () => {
      const [rocketModel, satModel, insModels] = await Promise.all([
        loadRocket(design?.launch?.vehicle),
        loadSatellite(design?.bus, design?.comm),
        loadInstruments(design?.instruments),
      ]);
      if (disposed) return;

      if (rocketModel) {
        const rig = buildRocket(rocketModel);
        rig.fairing.forEach((f) => {
          f.traverse((o) => {
            if (o.isMesh && o.material) {
              o.material = o.material.clone();
              o.material.transparent = true;
              o.material.opacity = 0.28;
            }
          });
        });
        // FULL STACK: ve tinh THAT (dung ti le that, canh gap) nam trong long fairing tai dung cho gan payload,
        // giong het luc phong (Launch3DCanvas). Truoc day ve tinh duoc ve to rieng o y=0.52 nen chi ra ngoai chop.
        if (satModel && rig.payload) {
          const inRig = buildSatellite(satModel, { withAdapter: false, design, insModels });
          if (inRig.setDeploy) inRig.setDeploy(0);
          inRig.inner.rotation.set(0, 0, 0); // cung he truc z-huong-len voi than ten lua
          // ve tinh dung tren DOAN CHOP NOI o dinh tang tren cung (nhin xuyen qua fairing X-Ray)
          if (!mountSatelliteOnAdapter(rig, inRig)) {
            const lo = rig.payload.userData.lo;
            const carrier = new THREE.Group();
            carrier.position.set(0, 0, (lo ? lo[2] : 0) + 0.05);
            carrier.add(inRig.inner);
            rig.payload.clear();
            rig.payload.add(carrier);
          }
        }
        rig.root.traverse((o) => {
          if (o.isMesh && o.material) {
            meshMaterials.push({ mesh: o, origMat: o.material });
          }
        });
        const box = new THREE.Box3().setFromObject(rig.root);
        const size = box.getSize(new THREE.Vector3());
        const ctr = box.getCenter(new THREE.Vector3());
        const scale = 2.2 / Math.max(size.x, size.y, size.z || 1);
        rig.root.scale.setScalar(scale);
        rig.root.position.sub(ctr.multiplyScalar(scale));
        stackObj = rig.root;
        assembly.add(stackObj);
      }

      if (satModel) {
        const srig = buildSatellite(satModel, { withAdapter: false, design, insModels });
        addAdapterBelow(srig); // PAYLOAD FOCUS: ve tinh dung tren doan chop noi, nhu tren ten lua
        srig.setDeploy(0.25);
        srig.root.traverse((o) => {
          if (o.isMesh && o.material) {
            meshMaterials.push({ mesh: o, origMat: o.material });
          }
        });
        const box = new THREE.Box3().setFromObject(srig.root);
        const size = box.getSize(new THREE.Vector3());
        const ctr = box.getCenter(new THREE.Vector3());
        const scale = 1.25 / Math.max(size.x, size.y, size.z || 1);
        srig.root.scale.setScalar(scale);
        srig.root.position.sub(ctr.multiplyScalar(scale));
        satHolder = new THREE.Group();
        satHolder.position.y = 0.52;
        satHolder.add(srig.root);
        assembly.add(satHolder);
      }
    })();

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth || 640;
      const nh = el.clientHeight || 420;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(el);

    const dom = renderer.domElement;
    let lastHissAt = 0;

    const updatePointer = (clientX, clientY) => {
      const rect = dom.getBoundingClientRect();
      pointerRef.current.mx = clamp01((clientX - rect.left) / Math.max(1, rect.width));
      pointerRef.current.my = clamp01((clientY - rect.top) / Math.max(1, rect.height));
      pointerRef.current.inside = true;
    };

    const onMove = (e) => updatePointer(e.clientX, e.clientY);
    const onLeave = () => {
      pointerRef.current.inside = false;
    };
    const onClick = (e) => {
      if (dragStartRef.current?.moved) {
        dragStartRef.current.moved = false;
        return;
      }
      updatePointer(e.clientX, e.clientY);
      const { mx, my } = pointerRef.current;
      const proj = new THREE.Vector3();

      // 1. Kiem tra click trung vung xi ga (khi dang o FULL STACK va nghe tieng xi to)
      if (leakAnchor && !fixedRef.current.includes('GAS_LEAK_AUDIO') && modeRef.current === 'stack') {
        leakAnchor.getWorldPosition(proj).project(camera);
        const sx = (proj.x + 1) / 2;
        const sy = (1 - proj.y) / 2;
        const dist = Math.hypot(sx - mx, sy - my);
        if (dist < 0.13) {
          markFixed('GAS_LEAK_AUDIO');
          return;
        }
      }

      // 2. Kiem tra click trung duong nut ngoan nghoeo mau vang (khi dang bat X-Ray)
      if (xrayRef.current && !fixedRef.current.includes('STRUCT_CRACK_XRAY')) {
        for (const cv of crackVisuals) {
          if (fixedCracksRef.current.includes(cv.subId)) continue;
          if (cv.mode !== modeRef.current) continue;
          cv.group.getWorldPosition(proj).project(camera);
          const sx = (proj.x + 1) / 2;
          const sy = (1 - proj.y) / 2;
          const dist = Math.hypot(sx - mx, sy - my);
          if (dist < 0.11) {
            playSoundAsset(audioRef.current, '06-11-2026-beep_go.wav', 0.38);
            setFixedCracks((prev) => {
              if (prev.includes(cv.subId)) return prev;
              const next = [...prev, cv.subId];
              if (next.length >= crackVisuals.length) {
                markFixed('STRUCT_CRACK_XRAY');
              }
              return next;
            });
            setDetectedIds((prev) => (prev.includes('STRUCT_CRACK_XRAY') ? prev : [...prev, 'STRUCT_CRACK_XRAY']));
            return;
          }
        }
      }
    };

    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerleave', onLeave);
    dom.addEventListener('click', onClick);

    let rafId = 0;
    let curYaw = 0;
    let lastXrayApplied = false;
    const tmp = new THREE.Vector3();

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (disposed) return;

      if (xrayRef.current !== lastXrayApplied && meshMaterials.length > 0) {
        lastXrayApplied = xrayRef.current;
        for (const item of meshMaterials) {
          item.mesh.material = lastXrayApplied ? xrayWireMat : item.origMat;
        }
      }

      curYaw += (yawRef.current - curYaw) * 0.12;
      assembly.rotation.y = curYaw;
      if (stackObj) stackObj.visible = modeRef.current === 'stack';
      if (satHolder) {
        // ve tinh phong to chi hien o PAYLOAD FOCUS; o FULL STACK ve tinh da nam san trong fairing
        const payloadMode = modeRef.current === 'payload';
        satHolder.visible = payloadMode;
        satHolder.scale.setScalar(1.25);
        satHolder.position.y = 0;
        satHolder.rotation.z = (-camAngleRef.current * Math.PI) / 180; // guong camera nghieng theo goc dang keo (nhiem vu 3)
      }

      const { mx, my, inside } = pointerRef.current;
      const worldX = (mx - 0.5) * 3.1;
      const worldY = (0.5 - my) * 2.5;
      spotTarget.position.set(worldX, worldY, 0);
      spot.position.set(worldX * 0.45, worldY * 0.35 + 0.2, 3.6);

      let pressureVal = 4;
      let crackVal = 6;

      // 1. Tinh do gan chuot voi diem xi ga vo hinh -> Phat am thanh xi ga to dan / nho dan
      let leakFocus = 0;
      if (leakAnchor && !fixedRef.current.includes('GAS_LEAK_AUDIO') && modeRef.current === 'stack') {
        leakAnchor.getWorldPosition(tmp).project(camera);
        const sx = (tmp.x + 1) / 2;
        const sy = (1 - tmp.y) / 2;
        const dist = inside ? Math.hypot(sx - mx, sy - my) : 1;
        // Am thanh xi ga bat dau nghe thay tu khoang cach 0.42 va cuc dai o < 0.04
        leakFocus = smoothstep(0.42, 0.03, dist);
        pressureVal = Math.max(pressureVal, Math.round(leakFocus * 96));

        if (leakFocus > 0.35) {
          setDetectedIds((prev) => (prev.includes('GAS_LEAK_AUDIO') ? prev : [...prev, 'GAS_LEAK_AUDIO']));
        }
        if (leakFocus > 0.05 && now - lastHissAt > 115) {
          lastHissAt = now;
          playGasHiss(audioRef.current, leakFocus, 0.13);
        }
      }

      // 2. Hien thi cac duong nut ngoan nghoeo nho mau vang khi bat X-Ray
      let nearCrackFocus = 0;
      for (const cv of crackVisuals) {
        const isSubFixed =
          fixedRef.current.includes('STRUCT_CRACK_XRAY') || fixedCracksRef.current.includes(cv.subId);
        const rightMode = modeRef.current === cv.mode;
        const show = !isSubFixed && xrayRef.current && rightMode;
        cv.group.visible = show;
        if (show) {
          cv.group.getWorldPosition(tmp).project(camera);
          const sx = (tmp.x + 1) / 2;
          const sy = (1 - tmp.y) / 2;
          const dist = inside ? Math.hypot(sx - mx, sy - my) : 1;
          const f = smoothstep(0.32, 0.03, dist);
          nearCrackFocus = Math.max(nearCrackFocus, f);
          cv.mat.opacity = 0.65 + f * 0.35;
        }
      }
      if (nearCrackFocus > 0.2) {
        crackVal = Math.round(25 + nearCrackFocus * 70);
        setDetectedIds((prev) => (prev.includes('STRUCT_CRACK_XRAY') ? prev : [...prev, 'STRUCT_CRACK_XRAY']));
      }

      if (Math.floor(now / 120) !== Math.floor((now - 16) / 120)) {
        const tiltErr = fixedRef.current.includes('CAMERA_TILT_ALIGN')
          ? 0
          : Math.min(100, Math.round(Math.abs(camAngleRef.current) * 3.4));
        setMeters({ pressureDiff: pressureVal, structVib: crackVal, camTiltErr: tiltErr });

        const unfixedInCurrentMode = crackVisuals.filter(
          (cv) => !fixedCracksRef.current.includes(cv.subId) && cv.mode === modeRef.current
        );
        const unfixedInOtherMode = crackVisuals.filter(
          (cv) => !fixedCracksRef.current.includes(cv.subId) && cv.mode !== modeRef.current
        );

        if (leakFocus > 0.65) {
          setScanHint({
            vi: '🔊 TIẾNG XÌ GA ĐANG CỰC LỚN NGAY ĐÂY! CLICK CHUỘT NGAY ĐỂ HÀN KÍN (KHÔNG CÓ ĐIỂM ĐÁNH DẤU)!',
            en: '🔊 GAS HISS PEAKING RIGHT HERE! CLICK NOW TO SEAL LEAK (NO MARKER)!',
          });
        } else if (leakFocus > 0.2) {
          setScanHint({
            vi: '🔉 ĐANG NGHE THẤY TIẾNG XÌ GA... LIA CHUỘT TÌM CHỖ TIẾNG XÌ TO NHẤT RỒI BẤM!',
            en: '🔉 GAS LEAK DETECTED... SWEEP CURSOR FOR PEAK HISS THEN CLICK!',
          });
        } else if (
          xrayRef.current &&
          !fixedRef.current.includes('STRUCT_CRACK_XRAY') &&
          unfixedInCurrentMode.length === 0 &&
          unfixedInOtherMode.length > 0
        ) {
          const count = unfixedInOtherMode.length;
          setScanHint(
            unfixedInOtherMode[0].mode === 'payload'
              ? {
                  vi: `🩻 CÒN ${count} VẾT NỨT VÀNG GIẤU TRONG KHOANG TẢI! HÃY BẤM [PAYLOAD FOCUS] ĐỂ TÌM!`,
                  en: `🩻 ${count} YELLOW CRACK(S) HIDDEN IN PAYLOAD BAY! SWITCH TO [PAYLOAD FOCUS]!`,
                }
              : {
                  vi: `🩻 CÒN ${count} VẾT NỨT VÀNG Ở THÂN TÊN LỬA! HÃY BẤM [FULL STACK] ĐỂ TÌM!`,
                  en: `🩻 ${count} YELLOW CRACK(S) ON ROCKET STACK! SWITCH TO [FULL STACK]!`,
                }
          );
        } else if (nearCrackFocus > 0.4) {
          setScanHint({
            vi: '🩻 BẮT GẶP ĐƯỜNG NỨT NGOẰN NGHÈO MÀU VÀNG! CLICK TRỰC TIẾP VÀO ĐƯỜNG VÀNG ĐỂ HÀN!',
            en: '🩻 YELLOW HAIRLINE CRACK DETECTED! CLICK DIRECTLY ON CRACK TO WELD!',
          });
        } else if (!fixedRef.current.includes('GAS_LEAK_AUDIO')) {
          setScanHint({
            vi: 'NHIỆM VỤ 1: LIA CHUỘT TRÊN TÊN LỬA — LẮNG NGHE TIẾNG XÌ GA TO DẦN RỒI BẤM (KHÔNG HIỆN ĐIỂM)',
            en: 'TASK 1: SWEEP ROCKET BODY — LISTEN FOR INCREASING GAS HISS THEN CLICK (NO MARKER)',
          });
        } else if (!fixedRef.current.includes('STRUCT_CRACK_XRAY')) {
          setScanHint({
            vi: `NHIỆM VỤ 2: BẬT [🩻 X-RAY MESH] TÌM & BẤM VÀO ĐƯỜNG NỨT VÀNG NHỎ (${fixedCracksRef.current.length}/${crackVisuals.length} VẾT)`,
            en: `TASK 2: ENABLE [🩻 X-RAY MESH], FIND & CLICK YELLOW CRACKS (${fixedCracksRef.current.length}/${crackVisuals.length})`,
          });
        } else if (!fixedRef.current.includes('CAMERA_TILT_ALIGN')) {
          setScanHint({
            vi: 'NHIỆM VỤ 3: GHÌ KÉO CHUỘT ĐƯA GƯƠNG CAMERA VỀ 0.0° VÀ GIỮ YÊN ĐỂ SIẾT CHỐT 100%',
            en: 'TASK 3: DRAG CAMERA MIRROR TO 0.0° AND HOLD STEADY TO LOCK 100%',
          });
        } else {
          setScanHint({
            vi: '✓ ĐÃ XỬ LÝ XONG CẢ 3 NHIỆM VỤ — BẤM [FINISH INSPECTION] ĐỂ RA BỆ PHÓNG!',
            en: '✓ ALL 3 TASKS RESOLVED — CLICK [FINISH INSPECTION] TO PROCEED TO LAUNCH PAD!',
          });
        }
      }

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerleave', onLeave);
      dom.removeEventListener('click', onClick);
      xrayWireMat.dispose();
      renderer.dispose();
    };
  }, [design, defects, leakDefect, crackDefect]);

  if (!inspectSession) {
    return (
      <div className="sandbox-end-wrap">
        <section className="panel sandbox-end-card">
          <div className="sandbox-end-badge">
            {tr(lang, '✓ KẾT THÚC HƯỚNG DẪN SANDBOX', '✓ SANDBOX TUTORIAL COMPLETE')}
          </div>
          <h2 className="sandbox-end-title">
            {tr(lang, 'Kết thúc sandbox, quay về cốt truyện', 'Sandbox tutorial complete, return to campaign')}
          </h2>
          <div className="sandbox-end-actions">
            <button type="button" className="btn neon-btn sandbox-return-btn" onClick={completeTutorialToBrief}>
              {tr(lang, '↩ RETURN (QUAY VỀ CỐT TRUYỆN)', '↩ RETURN TO CAMPAIGN')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const finishNow = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    startLaunchFromInspect(fixedIds);
  };

  const allFixed = fixedIds.length >= defects.length;
  const camAligned = fixedIds.includes('CAMERA_TILT_ALIGN');

  return (
    <div className="phase-stage">
      <div className="phase-header-plaques row-between-wide">
        <div className="rivet-plaque title">
          {tr(lang, 'PHASE 2: PRE-FLIGHT INSPECTION (3 NHIỆM VỤ CHẨN ĐOÁN)', 'PHASE 2: PRE-FLIGHT INSPECTION (3 DIAGNOSTIC TASKS)')}
        </div>
        <div className={`inspect-timer inspect-timer-pill ${timeLeft <= 10 ? 'crit' : ''}`} data-tutorial="inspect-timer">
          <strong>00:{String(timeLeft).padStart(2, '0')} ⏳</strong>
        </div>
      </div>

      <div className="inspect-grid">
        {/* Left: Hanging Clipboard Checklist */}
        <section className="panel clipboard-panel" data-tutorial="inspect-checklist">
          <div className="clipboard-clip" aria-hidden="true" />
          <div className="clipboard-sheet">
            <h2 className="clipboard-title">
              <span>{tr(lang, '3 NHIỆM VỤ KIỂM ĐỊNH', '3 INSPECTION TASKS')}</span>
              <span className={`badge ${allFixed ? 'ok' : 'warn'}`}>
                {fixedIds.length}/{defects.length} {tr(lang, 'HOÀN TẤT', 'DONE')}
              </span>
            </h2>

            {inspectSession.delayMonths > 0 && (
              <div className="small err-ink" style={{ marginBottom: 8 }}>
                {tr(
                  lang,
                  `! TRỄ HẠN ${inspectSession.delayMonths} THÁNG (-${inspectSession.delayMonths * 5}s THỜI GIAN KIỂM ĐỊNH)`,
                  `! DELAYED ${inspectSession.delayMonths} MONTHS (-${inspectSession.delayMonths * 5}s INSPECTION TIME)`
                )}
              </div>
            )}

            <div className="checklist-box">
              {defects.map((item) => {
                const isDetected = detectedIds.includes(item.id);
                const isFixed = fixedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`check-row ${isFixed ? 'fixed' : isDetected ? 'detected' : ''}`}
                  >
                    <div className="row-between">
                      <span>
                        {tx(item.label, lang)}{' '}
                        {item.id === 'STRUCT_CRACK_XRAY'
                          ? `[${isFixed ? `${totalCracks}/${totalCracks} ${tr(lang, 'VẾT ✓', 'CRACKS ✓')}` : `${fixedCracks.length}/${totalCracks} ${tr(lang, 'VẾT', 'CRACKS')}`}]`
                          : `[${isFixed ? tr(lang, '✓ ĐÃ SỬA', '✓ FIXED') : isDetected ? tr(lang, 'ĐANG XỬ LÝ', 'IN PROGRESS') : tr(lang, 'ĐANG DÒ...', 'SCANNING...')}]`}
                      </span>
                    </div>
                    <div className="small muted-ink" style={{ marginTop: 4 }}>
                      {tx(item.symptom, lang)}
                    </div>
                    {item.id === 'STRUCT_CRACK_XRAY' && !isFixed && (
                      <div className="small err-ink" style={{ marginTop: 3 }}>
                        👉 {item.isCheapRocket
                          ? tr(
                              lang,
                              `Tên lửa ${item.rocketName} (dỏm/độ tin cậy thấp) bị nứt tới ${totalCracks} vết màu vàng (có ở cả FULL STACK & PAYLOAD FOCUS)!`,
                              `Rocket ${item.rocketName} (low reliability) has ${totalCracks} yellow cracks across FULL STACK & PAYLOAD FOCUS!`
                            )
                          : tr(
                              lang,
                              `Tìm ${totalCracks} đường nứt ngoằn nghoèo nhỏ màu vàng khi bật [🩻 X-RAY MESH]!`,
                              `Find ${totalCracks} hairline yellow cracks with [🩻 X-RAY MESH]!`
                            )}
                      </div>
                    )}
                    {item.id === 'CAMERA_TILT_ALIGN' && !isFixed && (
                      <div className="small err-ink" style={{ marginTop: 3 }}>
                        👉 {tx(item.mirrorIssue, lang)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="row-wrap" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setPhase('design')}>
                {tr(lang, '← QUAY LẠI XƯỞNG (02.BUILD)', '← BACK TO BUILD (02.BUILD)')}
              </button>
            </div>
          </div>
        </section>

        {/* Right: Dark 3D X-Ray Bay + Mirror Gimbal Drag Aligner + Meters */}
        <section className="panel lantern-panel">
          <h2 className="panel-title">
            <span>
              {tr(
                lang,
                'BUỒNG CHẨN ĐOÁN 3D [AUDIO HISS • X-RAY YELLOW CRACKS • MIRROR ALIGN]',
                '3D DIAGNOSTIC BAY [AUDIO HISS • X-RAY YELLOW CRACKS • MIRROR ALIGN]'
              )}
            </span>
            <span className="small muted">
              {design.launch?.vehicle} + {design.bus}
            </span>
          </h2>

          <div
            className="inspect-stage"
            data-tutorial="inspect-stage"
            onPointerDown={handleStagePointerDown}
          >
            <div ref={mountRef} className="inspect-canvas-wrap" />

            {/* Màn chơi kéo gương trực tiếp trên model 3D phía trên: 1 Trục Đứng (0°) & 1 Trục Pháp tuyến Gương */}
            {(() => {
              const pivotX = 320;
              const pivotY = inspectMode === 'payload' ? 215 : 150;
              const isCoinciding = camAligned || Math.abs(cameraAngle) <= 0.35;
              const normalColor = isCoinciding ? '#39ff14' : Math.abs(cameraAngle) <= 3.5 ? '#ffd829' : '#ff6b4a';
              const vertColor = isCoinciding ? '#39ff14' : 'rgba(130, 255, 175, 0.72)';
              const ringR = 30;
              const ringCirc = 2 * Math.PI * ringR;
              const ringDash = (mirrorLockPct / 100) * ringCirc;

              // Cung hiển thị góc lệch giữa Trục Đứng và Trục Pháp Gương
              const arcR = 64;
              const rad = ((cameraAngle - 90) * Math.PI) / 180;
              const arcEndX = pivotX + arcR * Math.cos(rad);
              const arcEndY = pivotY + arcR * Math.sin(rad);
              const sweepFlag = cameraAngle >= 0 ? 1 : 0;

              return (
                <svg
                  className="inspect-mirror-overlay"
                  viewBox="0 0 640 420"
                  preserveAspectRatio="xMidYMid meet"
                  data-tutorial="inspect-cam-align"
                >
                  <defs>
                    <filter id="axis-neon-glow" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Cung báo góc lệch khi 2 trục chưa trùng */}
                  {!isCoinciding && Math.abs(cameraAngle) > 0.6 && (
                    <path
                      d={`M ${pivotX} ${pivotY - arcR} A ${arcR} ${arcR} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY} L ${pivotX} ${pivotY} Z`}
                      fill="rgba(255, 107, 74, 0.16)"
                      stroke="rgba(255, 107, 74, 0.55)"
                      strokeWidth="1.2"
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* 1. TRỤC ĐỨNG CHUẨN (0.0°) */}
                  <g filter={isCoinciding ? 'url(#axis-neon-glow)' : undefined}>
                    <line
                      x1={pivotX}
                      y1={pivotY - 120}
                      x2={pivotX}
                      y2={pivotY + 86}
                      stroke={vertColor}
                      strokeWidth={isCoinciding ? 3.6 : 2.2}
                      strokeDasharray={isCoinciding ? undefined : '6 4'}
                    />
                    <polygon
                      points={`${pivotX},${pivotY - 128} ${pivotX - 6},${pivotY - 114} ${pivotX + 6},${pivotY - 114}`}
                      fill={vertColor}
                    />
                    <text
                      x={pivotX}
                      y={pivotY - 134}
                      textAnchor="middle"
                      fill={isCoinciding ? '#39ff14' : '#b8ffd0'}
                      fontSize="11"
                      fontWeight="800"
                    >
                      {isCoinciding
                        ? tr(lang, '★ TRÙNG TRỤC CHUẨN 0.0° (XANH)', '★ ALIGNED TO 0.0° BORESIGHT (GREEN)')
                        : tr(lang, 'TRỤC ĐỨNG 0.0°', 'VERTICAL AXIS 0.0°')}
                    </text>
                  </g>

                  {/* 2. MẶT GƯƠNG & TRỤC PHÁP TUYẾN VỚI HƯỚNG GƯƠNG (quay theo cameraAngle) */}
                  <g
                    transform={`translate(${pivotX}, ${pivotY}) rotate(${cameraAngle})`}
                    filter={isCoinciding ? 'url(#axis-neon-glow)' : undefined}
                  >
                    {/* Mặt gương phản xạ (vuông góc với trục pháp tuyến) */}
                    <rect
                      x="-54"
                      y="-4"
                      width="108"
                      height="8"
                      rx="2"
                      fill="rgba(16, 28, 34, 0.88)"
                      stroke={normalColor}
                      strokeWidth="2.2"
                    />
                    {/* Ký hiệu góc vuông ∟ giữa Mặt gương và Trục pháp tuyến */}
                    <polyline
                      points="0,-12 12,-12 12,0"
                      fill="none"
                      stroke={normalColor}
                      strokeWidth="1.5"
                    />

                    {/* Trục pháp tuyến với hướng gương */}
                    <line
                      x1="0"
                      y1="72"
                      x2="0"
                      y2="-112"
                      stroke={normalColor}
                      strokeWidth={isCoinciding ? 3.6 : 2.6}
                    />
                    <polygon points="0,-124 -7,-108 7,-108" fill={normalColor} />

                    {/* Nút nắm kéo trục pháp tuyến trên model */}
                    {!camAligned && (
                      <g className="mirror-axis-handle" transform="translate(0, -82)">
                        <circle
                          cx="0"
                          cy="0"
                          r="13"
                          fill="rgba(10, 18, 22, 0.92)"
                          stroke={normalColor}
                          strokeWidth="2.2"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill={normalColor}
                          fontSize="12"
                          fontWeight="900"
                        >
                          ⇄
                        </text>
                      </g>
                    )}

                    {/* Nhãn Trục Pháp Gương (giữ chữ ngang dễ đọc) */}
                    <g transform={`translate(0, 92) rotate(${-cameraAngle})`}>
                      <rect
                        x="-118"
                        y="-12"
                        width="236"
                        height="22"
                        rx="4"
                        fill="rgba(6, 12, 16, 0.88)"
                        stroke={normalColor}
                        strokeWidth="1.4"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill={normalColor}
                        fontSize="11"
                        fontWeight="800"
                      >
                        {camAligned
                          ? tr(lang, '✓ ĐÃ KHÓA TRỤC PHÁP GƯƠNG 0.0°', '✓ MIRROR NORMAL LOCKED AT 0.0°')
                          : isCoinciding
                            ? tr(lang, `★ ĐANG TRÙNG TRỤC XANH! GIỮ YÊN (${mirrorLockPct}%)`, `★ ALIGNED! HOLD STEADY (${mirrorLockPct}%)`)
                            : tr(
                                lang,
                                `TRỤC PHÁP GƯƠNG: ${cameraAngle > 0 ? `+${cameraAngle.toFixed(1)}` : cameraAngle.toFixed(1)}° (KÉO VỀ 0°)`,
                                `MIRROR NORMAL: ${cameraAngle > 0 ? `+${cameraAngle.toFixed(1)}` : cameraAngle.toFixed(1)}° (DRAG TO 0°)`
                              )}
                      </text>
                    </g>
                  </g>

                  {/* Vòng giữ khóa chốt (0% -> 100%) ngay tại tâm giao 2 trục */}
                  <circle
                    cx={pivotX}
                    cy={pivotY}
                    r={ringR}
                    fill="none"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="4"
                  />
                  {mirrorLockPct > 0 && (
                    <circle
                      cx={pivotX}
                      cy={pivotY}
                      r={ringR}
                      fill="none"
                      stroke="#39ff14"
                      strokeWidth="4.5"
                      strokeDasharray={`${ringDash} ${ringCirc}`}
                      transform={`rotate(-90 ${pivotX} ${pivotY})`}
                      filter="url(#axis-neon-glow)"
                    />
                  )}
                  <circle cx={pivotX} cy={pivotY} r="5.5" fill={normalColor} />
                </svg>
              );
            })()}

            <div className="inspect-scan-banner small">{tx(scanHint, lang)}</div>

            {/* Hộp trạng thái gương gọn nhẹ ngay góc trên phải khung 3D */}
            <div className={`inspect-mirror-hud ${camAligned ? 'ok' : ''}`}>
              <div className="row-between" style={{ gap: 8 }}>
                <strong>
                  📐 {tr(lang, 'GƯƠNG', 'MIRROR')} ({camDefect?.cameraName || 'CAM'}):
                </strong>
                <span className={`badge ${camAligned || Math.abs(cameraAngle) <= 0.35 ? 'ok' : 'warn'}`}>
                  {camAligned
                    ? tr(lang, '✓ ĐÃ KHÓA 0.0°', '✓ LOCKED 0.0°')
                    : `${cameraAngle > 0 ? `+${cameraAngle.toFixed(1)}` : cameraAngle.toFixed(1)}° • ${tr(lang, 'CHỐT', 'LATCH')} ${mirrorLockPct}%`}
                </span>
              </div>
              <div className="small muted" style={{ marginTop: 2 }}>
                {camAligned
                  ? tr(lang, 'Trục pháp gương đã khóa trùng khít Trục đứng 0.0°.', 'Mirror normal locked precisely to vertical axis 0.0°.')
                  : tr(
                      lang,
                      'Ghì kéo chuột trên model để Trục Pháp trùng Trục Đứng (hiện XANH) và giữ yên tới 100%.',
                      'Drag on model to align Mirror Normal with Vertical Axis (GREEN) and hold until 100%.'
                    )}
              </div>
            </div>

            <div className="viewport-tools" data-tutorial="inspect-tools">
              <button
                type="button"
                className={`btn small ${xrayMode ? 'neon-btn' : 'warn'}`}
                onClick={() => {
                  beep(audioOn, xrayMode ? 520 : 880, 0.04);
                  setXrayMode((v) => !v);
                }}
              >
                {xrayMode
                  ? tr(lang, '🩻 X-RAY MESH: BẬT (LƯỚI TRẮNG)', '🩻 X-RAY MESH: ON (WHITE)')
                  : tr(lang, '🩻 BẬT X-RAY MESH', '🩻 ENABLE X-RAY MESH')}
              </button>
              <button
                type="button"
                className={`btn small ${inspectMode === 'stack' ? 'primary' : ''}`}
                onClick={() => setInspectMode('stack')}
              >
                {tr(lang, 'FULL STACK (TÊN LỬA)', 'FULL STACK (ROCKET)')}
              </button>
              <button
                type="button"
                className={`btn small ${inspectMode === 'payload' ? 'primary' : ''}`}
                onClick={() => setInspectMode('payload')}
              >
                {tr(lang, 'PAYLOAD FOCUS (TRONG VỆ TINH)', 'PAYLOAD FOCUS (SATELLITE)')}
              </button>
              <button type="button" className="btn small" onClick={() => setYawTarget((y) => y - Math.PI / 3)}>
                {tr(lang, '⟲ XOAY -60°', '⟲ ROTATE -60°')}
              </button>
              <button type="button" className="btn small" onClick={() => setYawTarget((y) => y + Math.PI / 3)}>
                {tr(lang, '⟳ XOAY +60°', '⟳ ROTATE +60°')}
              </button>
            </div>
          </div>

          <div className="osc-meters three-cols">
            {[
              [
                '1. AUDIO HISS',
                tr(lang, '1. AUDIO HISS (TIẾNG XÌ GA)', '1. AUDIO HISS (GAS LEAK)'),
                meters.pressureDiff,
              ],
              [
                '2. X-RAY CRACKS',
                tr(
                  lang,
                  `2. X-RAY CRACKS (${fixedCracks.length}/${totalCracks} VẾT VÀNG)`,
                  `2. X-RAY CRACKS (${fixedCracks.length}/${totalCracks} YELLOW CRACKS)`
                ),
                meters.structVib,
              ],
              [
                '3. MIRROR TILT',
                tr(lang, '3. MIRROR TILT (LỆCH GƯƠNG)', '3. MIRROR TILT (OFF-AXIS)'),
                meters.camTiltErr,
              ],
            ].map(([id, label, val]) => (
              <div key={id} className="kpi-box dial-meter">
                <div className="row-between">
                  <span className="kpi-label">{label}</span>
                  <span className={`small ${val > 35 ? 'err-text' : 'ok-text'}`}>{val}%</span>
                </div>
                <div className="gauge-bar">
                  <div
                    className={`gauge-fill ${val > 55 ? 'err' : val > 20 ? 'warn' : ''}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="row-between inspect-action-bar" style={{ marginTop: 12 }}>
            <div className="inspect-status-slot">
              <span className={`small ${allFixed ? 'ok-text' : 'muted'}`}>
                {allFixed
                  ? tr(lang, '✓ ĐÃ XỬ LÝ TOÀN BỘ 3 LỖI KIỂM ĐỊNH — SẴN SÀNG PHÓNG', '✓ ALL 3 DEFECTS RESOLVED — READY FOR LAUNCH')
                  : tr(
                      lang,
                      `CÒN ${defects.length - fixedIds.length}/3 HẠNG MỤC CHƯA XỬ LÝ`,
                      `${defects.length - fixedIds.length}/3 DEFECTS REMAINING`
                    )}
              </span>
            </div>
            <button
              className="btn primary hazard hazard-cta"
              data-tutorial="inspect-finish"
              disabled={busy}
              onClick={finishNow}
            >
              {allFixed
                ? tr(lang, 'PHÓNG TÊN LỬA NGAY [FINISH]', 'LAUNCH VEHICLE NOW [FINISH]')
                : tr(lang, 'HOÀN THÀNH KIỂM ĐỊNH', 'FINISH INSPECTION')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
