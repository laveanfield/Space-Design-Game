import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSoundAsset } from '../api/client';
import { CHECKLIST_TEMPLATES } from '../core/gameMachine';
import { useGame } from '../core/GameContext';
import { buildRocket, buildSatellite, loadInstruments, loadRocket, loadSatellite } from '../three/modelLoader';

/**
 * InspectScreen (Phase 03.INSPECT) -- Phong kiem dinh truoc phong:
 * - Dong ho dem nguoc (45s hoac bi tru neu tre deadline).
 * - Random 3 loi an tren model 3D that (Ten lua + Ve tinh) voi do an tinh te.
 * - Den soi SpotLight theo con tro chuot + 4 thanh dao dong ky rung khi quet gan vi tri loi.
 */

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function InspectScreen() {
  const { design, inspectSession, startLaunchFromInspect, audioOn, busy, setPhase } = useGame();
  const defects = useMemo(() => inspectSession?.defects || [], [inspectSession]);
  const [timeLeft, setTimeLeft] = useState(inspectSession?.timeLimit ?? 45);
  const [detectedIds, setDetectedIds] = useState([]);
  const [fixedIds, setFixedIds] = useState([]);
  const [yawTarget, setYawTarget] = useState(0);
  const [inspectMode, setInspectMode] = useState('stack'); // 'stack' | 'payload'
  const [meters, setMeters] = useState({ pressureDiff: 6, busRipple: 8, emiNoise: 5, structVib: 7 });
  const [scanHint, setScanHint] = useState('RÊ ĐÈN SOI X-RAY DỌC THÂN TÀU ĐỂ TÌM 3 LỖI ẨN');

  const mountRef = useRef(null);
  const pointerRef = useRef({ mx: 0.5, my: 0.5, inside: false, yaw: 0 });
  const fixedRef = useRef(fixedIds);
  fixedRef.current = fixedIds;
  const audioRef = useRef(audioOn);
  audioRef.current = audioOn;
  const yawRef = useRef(0);
  yawRef.current = yawTarget;
  const modeRef = useRef('stack');
  modeRef.current = inspectMode;
  const submittedRef = useRef(false);

  // Reset per inspection session
  useEffect(() => {
    submittedRef.current = false;
    setTimeLeft(inspectSession?.timeLimit ?? 45);
    setDetectedIds([]);
    setFixedIds([]);
  }, [inspectSession]);

  // Countdown timer
  useEffect(() => {
    if (!inspectSession) return undefined;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
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
  }, [inspectSession]);

  const markFixed = (id) => {
    setFixedIds((prev) => {
      if (prev.includes(id)) return prev;
      playSoundAsset(audioRef.current, '06-11-2026-beep_go.wav', 0.35);
      return [...prev, id];
    });
    setDetectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  // Three.js Dark Diagnostic Chamber + X-Ray Spotlight
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

    // Low ambient + tracking SpotLight
    scene.add(new THREE.AmbientLight(0x1f352e, 0.42));
    const rim = new THREE.DirectionalLight(0x38e594, 0.35);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    const spot = new THREE.SpotLight(0xffe6a8, 12, 16, 0.36, 0.72, 1.2);
    spot.position.set(0, 0.4, 3.6);
    const spotTarget = new THREE.Object3D();
    scene.add(spot, spotTarget);
    spot.target = spotTarget;

    // Subtle test stand ring
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.72, 0.06, 28),
      new THREE.MeshStandardMaterial({ color: 0x16241f, metalness: 0.6, roughness: 0.4 })
    );
    stand.position.y = -1.25;
    scene.add(stand);

    const assembly = new THREE.Group();
    scene.add(assembly);

    const faultVisuals = new Map();
    const buildVisuals = () => {
      for (const df of defects) {
        const markerGroup = new THREE.Group();
        markerGroup.position.set(df.pos[0], df.pos[1], df.pos[2]);

        // Subtle anomaly mesh ("an an 1 xiu": chi ro khi soi den vao gan)
        const matCore = new THREE.MeshBasicMaterial({
          color: df.meter === 'pressureDiff' ? 0xb8eeff : df.meter === 'structVib' ? 0xff9248 : 0x5bc0eb,
          transparent: true,
          opacity: 0.08,
          depthWrite: false,
        });
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), matCore);

        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffb84d,
          wireframe: true,
          transparent: true,
          opacity: 0.05,
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.008, 6, 18), ringMat);
        markerGroup.add(orb, ring);
        assembly.add(markerGroup);
        faultVisuals.set(df.id, { group: markerGroup, orb, ring, matCore, ringMat, def: df });
      }
    };

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
              o.material.opacity = 0.28; // X-Ray fairing shell
            }
          });
        });
        // FULL STACK: ve tinh THAT (dung ti le that, canh gap) nam trong long fairing tai dung cho gan payload,
        // giong het luc phong (Launch3DCanvas). Truoc day ve tinh duoc ve to rieng o y=0.52 nen chi ra ngoai chop.
        if (satModel && rig.payload) {
          const inRig = buildSatellite(satModel, { withAdapter: false, design, insModels });
          if (inRig.setDeploy) inRig.setDeploy(0);
          inRig.inner.rotation.set(0, 0, 0); // cung he truc z-huong-len voi than ten lua
          const lo = rig.payload.userData.lo;
          const carrier = new THREE.Group();
          carrier.position.set(0, 0, (lo ? lo[2] : 0) + 0.05);
          carrier.add(inRig.inner);
          rig.payload.clear();
          rig.payload.add(carrier);
        }
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
        const srig = buildSatellite(satModel, { withAdapter: true, design, insModels });
        srig.setDeploy(0.25);
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
      buildVisuals();
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
    let lastNoiseAt = 0;

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
      updatePointer(e.clientX, e.clientY);
      const { mx, my } = pointerRef.current;
      let bestId = null;
      let bestDist = 0.14;
      const proj = new THREE.Vector3();
      for (const [id, v] of faultVisuals.entries()) {
        if (fixedRef.current.includes(id)) continue;
        v.group.getWorldPosition(proj).project(camera);
        const sx = (proj.x + 1) / 2;
        const sy = (1 - proj.y) / 2;
        const dist = Math.hypot(sx - mx, sy - my);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = id;
        }
      }
      if (bestId) {
        markFixed(bestId);
      }
    };

    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerleave', onLeave);
    dom.addEventListener('click', onClick);

    let rafId = 0;
    let curYaw = 0;
    const tmp = new THREE.Vector3();

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (disposed) return;

      curYaw += (yawRef.current - curYaw) * 0.12;
      assembly.rotation.y = curYaw;
      if (stackObj) stackObj.visible = modeRef.current === 'stack';
      if (satHolder) {
        // ve tinh phong to chi hien o PAYLOAD FOCUS; o FULL STACK ve tinh da nam san trong fairing
        const payloadMode = modeRef.current === 'payload';
        satHolder.visible = payloadMode;
        satHolder.scale.setScalar(1.2);
        satHolder.position.y = 0;
      }

      const { mx, my, inside } = pointerRef.current;
      const worldX = (mx - 0.5) * 3.1;
      const worldY = (0.5 - my) * 2.5;
      spotTarget.position.set(worldX, worldY, 0);
      spot.position.set(worldX * 0.45, worldY * 0.35 + 0.2, 3.6);

      const nextMeters = { pressureDiff: 6, busRipple: 7, emiNoise: 5, structVib: 6 };
      let nearestFault = null;
      let nearestDist = 9;

      for (const [id, v] of faultVisuals.entries()) {
        const isFixed = fixedRef.current.includes(id);
        v.group.visible = !isFixed;
        if (isFixed) continue;

        v.group.getWorldPosition(tmp).project(camera);
        const sx = (tmp.x + 1) / 2;
        const sy = (1 - tmp.y) / 2;
        const dist = inside ? Math.hypot(sx - mx, sy - my) : 1;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestFault = v.def;
        }

        // Subtle shimmer when beam passes close
        const focus = smoothstep(0.28, 0.06, dist);
        const pulse = 0.55 + 0.45 * Math.sin(now * 0.018);
        v.matCore.opacity = 0.04 + focus * 0.85 * pulse;
        v.ringMat.opacity = focus * 0.8;
        v.ring.rotation.z += 0.04;
        v.ring.rotation.x += 0.025;

        const spike = Math.round(focus * 88 + (focus > 0.15 ? pulse * 10 : 0));
        nextMeters[v.def.meter] = Math.max(nextMeters[v.def.meter], spike);

        if (focus > 0.45) {
          setDetectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        }
      }

      if (nearestFault && nearestDist < 0.22 && now - lastNoiseAt > 650) {
        lastNoiseAt = now;
        playSoundAsset(audioRef.current, '08-11-2026-static_noise.wav', 0.14);
      }

      // Throttled UI meter readout
      if (Math.floor(now / 120) !== Math.floor((now - 16) / 120)) {
        setMeters(nextMeters);
        if (nearestFault && nearestDist < 0.14) {
          setScanHint(`PHÁT HIỆN DỊ THƯỜNG [${nearestFault.label}] — CLICK LÊN ĐIỂM ĐỎ/VÀNG ĐỂ SỬA`);
        } else if (nearestFault && nearestDist < 0.28) {
          setScanHint(`TÍN HIỆU DAO ĐỘNG KÝ ĐANG RUNG GẦN VỊ TRÍ NÀY... QUÉT CHẬM LẠI`);
        } else {
          setScanHint(`RÊ ĐÈN SOI X-RAY DỌC THÂN TÀU ĐỂ TÌM ${3 - fixedRef.current.length} LỖI CÒN LẠI`);
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
      renderer.dispose();
    };
  }, [design, defects]);

  if (!inspectSession) return null;

  const finishNow = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    startLaunchFromInspect(fixedIds);
  };

  const allFixed = fixedIds.length >= defects.length;

  return (
    <div className="phase-stage">
      <div className="phase-header-plaques row-between-wide">
        <div className="rivet-plaque title">PHASE 2: PRE-FLIGHT INSPECTION</div>
        <div className={`inspect-timer ${timeLeft <= 10 ? 'crit' : ''}`} data-tutorial="inspect-timer">
          <strong>00:{String(timeLeft).padStart(2, '0')} ⏳</strong>
        </div>
      </div>

      <div className="inspect-grid">
        {/* Left: Hanging Clipboard Checklist */}
        <section className="panel clipboard-panel" data-tutorial="inspect-checklist">
          <div className="clipboard-clip" aria-hidden="true" />
          <div className="clipboard-sheet">
            <h2 className="clipboard-title">
              <span>INSPECTION CHECKLIST</span>
              <span className={`badge ${allFixed ? 'ok' : 'warn'}`}>
                {fixedIds.length}/{defects.length}
              </span>
            </h2>

            {inspectSession.delayMonths > 0 && (
              <div className="small err-ink" style={{ marginBottom: 8 }}>
                ! TRỄ HẠN {inspectSession.delayMonths} THÁNG (-{inspectSession.delayMonths * 5}s SO TẠO CHUẨN 45s)
              </div>
            )}

            <div className="checklist-box">
              {CHECKLIST_TEMPLATES.map((item) => {
                const isDefect = defects.some((d) => d.id === item.id);
                const isDetected = detectedIds.includes(item.id);
                const isFixed = fixedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`check-row ${isFixed ? 'fixed' : isDetected ? 'detected' : ''}`}
                  >
                    <div className="row-between">
                      <span>
                        {item.label} [{isFixed ? 'x' : isDetected ? '!' : ' '}]
                      </span>
                      {isDefect && isDetected && !isFixed && (
                        <button className="btn small warn" onClick={() => markFixed(item.id)}>
                          PATCH
                        </button>
                      )}
                    </div>
                    {isDetected && <div className="small muted-ink">{item.symptom}</div>}
                  </div>
                );
              })}
            </div>

            <div className="row-wrap" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setPhase('design')}>
                ← BACK TO BUILD
              </button>
            </div>
          </div>
        </section>

        {/* Right: Dark 3D X-Ray Bay + Oscilloscope Meters */}
        <section className="panel lantern-panel">
          <h2 className="panel-title">
            <span>PRE-FLIGHT DIAGNOSTIC BAY [X-RAY LANTERN]</span>
            <span className="small muted">
              {design.launch?.vehicle} + {design.bus}
            </span>
          </h2>

          <div className="inspect-stage" data-tutorial="inspect-stage">
            <div ref={mountRef} className="inspect-canvas-wrap" />
            <div className="inspect-scan-banner small">{scanHint}</div>
            <div className="viewport-tools">
              <button className="btn small" onClick={() => setYawTarget((y) => y - Math.PI / 3)}>
                ⟲ ROTATE -60°
              </button>
              <button className="btn small" onClick={() => setYawTarget((y) => y + Math.PI / 3)}>
                ⟳ ROTATE +60°
              </button>
              <button
                className={`btn small ${inspectMode === 'stack' ? 'primary' : ''}`}
                onClick={() => setInspectMode('stack')}
              >
                FULL STACK
              </button>
              <button
                className={`btn small ${inspectMode === 'payload' ? 'primary' : ''}`}
                onClick={() => setInspectMode('payload')}
              >
                PAYLOAD FOCUS
              </button>
            </div>
          </div>

          <div className="osc-meters">
            {[
              ['PRESSURE_DIFF', meters.pressureDiff],
              ['BUS_RIPPLE', meters.busRipple],
              ['EMI_NOISE', meters.emiNoise],
              ['STRUCT_VIB', meters.structVib],
            ].map(([name, val]) => (
              <div key={name} className="kpi-box dial-meter">
                <div className="row-between">
                  <span className="kpi-label">{name}</span>
                  <span className={`small ${val > 45 ? 'err-text' : 'ok-text'}`}>{val}%</span>
                </div>
                <div className="gauge-bar">
                  <div className={`gauge-fill ${val > 60 ? 'err' : val > 28 ? 'warn' : ''}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="row-between" style={{ marginTop: 12 }}>
            <span className="small muted">
              {allFixed
                ? 'ĐÃ XỬ LÝ TOÀN BỘ LỖI LẮP RÁP — SẴN SÀNG PHÓNG'
                : 'CẢNH BÁO: PHÓNG KHI CÒN LỖI LẮP RÁP CÓ THỂ GÂY NỔ TÊN LỬA HOẶC HỎNG SỚM'}
            </span>
            <button
              className="btn primary hazard hazard-cta"
              data-tutorial="inspect-finish"
              disabled={busy}
              onClick={finishNow}
            >
              [ FINISH INSPECTION ]
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
