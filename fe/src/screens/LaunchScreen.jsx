import React, { useMemo, useState } from 'react';
import { decodeF32 } from '../api/client';
import AccidentNewspaper, { buildAccidentInfo } from '../components/AccidentNewspaper';
import { Dossier } from '../components/CampaignPanels';
import Launch3DCanvas from '../components/Launch3DCanvas';
import { REP_MAX } from '../core/gameMachine';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

function MechDial({ label, valueText, unit, value, min = 0, max = 100, accent = '#34d399', warnAt = 0.85 }) {
  const pct = Math.max(0, Math.min(1, (value - min) / Math.max(1e-6, max - min)));
  const startDeg = -130;
  const sweepDeg = 260;
  const needleDeg = startDeg + pct * sweepDeg;
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = ((startDeg + (i / 10) * sweepDeg - 90) * Math.PI) / 180;
    const r1 = 36;
    const r2 = i % 2 === 0 ? 43 : 40;
    return {
      x1: 54 + r1 * Math.cos(a),
      y1: 54 + r1 * Math.sin(a),
      x2: 54 + r2 * Math.cos(a),
      y2: 54 + r2 * Math.sin(a),
      major: i % 2 === 0,
      warn: i / 10 >= warnAt,
    };
  });

  return (
    <div className="mech-gauge-card">
      <span className="mech-rivet tl" />
      <span className="mech-rivet tr" />
      <span className="mech-rivet bl" />
      <span className="mech-rivet br" />
      <svg className="mech-dial-svg" viewBox="0 0 108 108" aria-hidden="true">
        <circle cx="54" cy="54" r="49" fill="#0b1216" stroke="#36464f" strokeWidth="2.5" />
        <circle cx="54" cy="54" r="45" fill="none" stroke="#1e2b33" strokeWidth="1" />
        {ticks.map((tk, idx) => (
          <line
            key={idx}
            x1={tk.x1}
            y1={tk.y1}
            x2={tk.x2}
            y2={tk.y2}
            stroke={tk.warn ? '#f59e0b' : tk.major ? '#9bb2be' : '#4a5d68'}
            strokeWidth={tk.major ? 1.8 : 1.1}
            strokeLinecap="round"
          />
        ))}
        <g transform={`rotate(${needleDeg} 54 54)`}>
          <polygon points="52.4,56 55.6,56 54.6,17 53.4,17" fill={accent} />
        </g>
        <circle cx="54" cy="54" r="5.5" fill="#d9a441" stroke="#1b2429" strokeWidth="1.5" />
      </svg>
      <div className="mech-gauge-readout">
        <div className="mech-gauge-val">{valueText} <span className="mech-gauge-unit">{unit}</span></div>
        <div className="mech-gauge-lbl">{label}</div>
      </div>
    </div>
  );
}

function sampleAtTime(points, t) {
  if (!points.length) return { t: 0, alt: 0, down: 0 };
  if (t <= points[0].t) return points[0];
  const last = points[points.length - 1];
  if (t >= last.t) return last;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / Math.max(1e-6, b.t - a.t);
      return {
        t,
        alt: a.alt + (b.alt - a.alt) * f,
        down: a.down + (b.down - a.down) * f,
      };
    }
  }
  return last;
}

function MechTrajectoryGraph({ points, events = [], tEnd, currentT, currentAlt, pitchDeg = 0, targetAlt, finalOrbitAlt, orbitId }) {
  const W = 300;
  const H = 96;
  const padL = 16;
  const padR = 14;
  const padB = 15;
  const isHohmann = finalOrbitAlt > targetAlt + 50;
  const padT = isHohmann ? 30 : 16;
  const maxAscentAlt = Math.max(100, targetAlt, ...points.map((p) => p.alt));
  const maxDown = Math.max(1, ...points.map((p) => p.down ?? 0));
  const totalT = Math.max(1, tEnd);
  const ascentEndX = isHohmann ? W * 0.68 : W - padR;

  const scaleAlt = (a) => Math.pow(Math.max(0, a), 0.65);
  const maxScaledAlt = Math.max(1, scaleAlt(maxAscentAlt));

  const toX = (down) => padL + (Math.max(0, Math.min(maxDown, down)) / maxDown) * (ascentEndX - padL);
  const toY = (alt) => H - padB - (scaleAlt(Math.min(maxAscentAlt, alt)) / maxScaledAlt) * (H - padT - padB);

  const plannedPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${toX(p.down ?? 0).toFixed(1)},${toY(p.alt).toFixed(1)}`).join(' ');
  const activePts = points.filter((p) => p.t <= Math.max(0, currentT));
  const curSample = sampleAtTime(points, Math.max(0, currentT));
  const curX = toX(curSample.down);
  const curY = toY(Math.max(0, currentAlt));
  const livePath =
    activePts.length > 0
      ? `${activePts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${toX(p.down ?? 0).toFixed(1)},${toY(p.alt).toFixed(1)}`).join(' ')} L${curX.toFixed(1)},${curY.toFixed(1)}`
      : `M${padL},${H - padB}`;
  const karmanY = maxAscentAlt >= 120 ? toY(100) : null;
  const parkingY = toY(targetAlt);
  const finalY = 11;
  const hohmannPath = isHohmann
    ? `M${ascentEndX.toFixed(1)},${parkingY.toFixed(1)} Q${((ascentEndX + W - padR) * 0.5).toFixed(1)},${((parkingY + finalY) * 0.42).toFixed(1)} ${(W - padR).toFixed(1)},${finalY}`
    : '';
  const burning = currentT >= 0 && currentT < totalT - 1;
  const rocketRot = Math.max(0, Math.min(90, pitchDeg));

  const markerEvents = events
    .filter((ev) => ['MECO', 'STAGE_SEP', 'SECO2'].includes(ev.name) && ev.t != null)
    .map((ev) => {
      const pt = sampleAtTime(points, Number(ev.t));
      return {
        name: ev.name === 'STAGE_SEP' ? 'SEP' : ev.name,
        t: Number(ev.t),
        x: toX(pt.down),
        y: toY(pt.alt),
        passed: currentT >= Number(ev.t),
      };
    });

  return (
    <div className="mech-gauge-card mech-traj-card">
      <span className="mech-rivet tl" />
      <span className="mech-rivet tr" />
      <span className="mech-rivet bl" />
      <span className="mech-rivet br" />
      <div className="mech-traj-head">
        <span className="mech-gauge-lbl">
          {orbitId} · {isHohmann ? `${Math.round(targetAlt)} → ${Math.round(finalOrbitAlt)} km` : `${Math.round(targetAlt)} km`}
        </span>
        <span className="mech-gauge-lbl">{Math.max(0, Math.round(currentT))}s / {Math.round(totalT)}s</span>
      </div>
      <svg className="mech-traj-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="earthArcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        {/* Curved Earth horizon */}
        <path d={`M0,${H} Q${W / 2},${H - 18} ${W},${H} Z`} fill="url(#earthArcGrad)" />
        <path d={`M0,${H} Q${W / 2},${H - 18} ${W},${H}`} fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.55" />

        {/* Target / Parking orbit lines */}
        {isHohmann && (
          <>
            <line x1={padL} y1={finalY} x2={W - padR} y2={finalY} stroke="#38bdf8" strokeWidth="1.1" strokeDasharray="4 3" opacity="0.65" />
            <text x={padL + 2} y={finalY - 2} fill="#7dd3fc" fontSize="6.5" fontFamily="monospace" opacity="0.85">
              TARGET {Math.round(finalOrbitAlt)} km
            </text>
            <path d={hohmannPath} fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.7" />
            <text x={((ascentEndX + W - padR) * 0.52).toFixed(1)} y={((parkingY + finalY) * 0.44 - 3).toFixed(1)} textAnchor="middle" fill="#7dd3fc" fontSize="5.6" fontFamily="monospace" opacity="0.8">
              HOHMANN
            </text>
          </>
        )}
        <line x1={padL} y1={parkingY} x2={W - padR} y2={parkingY} stroke={isHohmann ? '#94a3b8' : '#38bdf8'} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <text x={W - padR - 2} y={parkingY - 3} textAnchor="end" fill="#94a3b8" fontSize="6.5" fontFamily="monospace" opacity="0.85">
          {isHohmann ? `PARK ${Math.round(targetAlt)} km` : `${Math.round(targetAlt)} km`}
        </text>
        {karmanY != null && (
          <line x1={padL} y1={karmanY} x2={ascentEndX} y2={karmanY} stroke="#2b424f" strokeWidth="0.9" strokeDasharray="2 3" />
        )}

        {/* Planned & live trajectory */}
        {plannedPath && (
          <path d={plannedPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.55" />
        )}
        <path d={livePath} fill="none" stroke="#34d399" strokeWidth="2.3" strokeLinecap="round" />

        {/* Stage / burn event markers along trajectory */}
        {markerEvents.map((m, idx) => (
          <g key={`${m.name}-${idx}`}>
            <circle
              cx={m.x.toFixed(1)}
              cy={m.y.toFixed(1)}
              r="2.2"
              fill={m.passed ? '#34d399' : '#f59e0b'}
              stroke="#0b1216"
              strokeWidth="0.8"
            />
            <text
              x={(m.x + (m.name === 'SECO2' ? -2 : 4)).toFixed(1)}
              y={(m.y + (m.name === 'SECO2' ? 8 : 6)).toFixed(1)}
              textAnchor={m.name === 'SECO2' ? 'end' : 'start'}
              fill={m.passed ? '#a7f3d0' : '#cbd5e1'}
              fontSize="5.4"
              fontFamily="monospace"
              opacity="0.85"
            >
              {m.name}
            </text>
          </g>
        ))}

        {/* Rocket flying along the trajectory */}
        <g transform={`translate(${curX.toFixed(1)}, ${curY.toFixed(1)}) rotate(${rocketRot.toFixed(1)})`}>
          <circle cx="0" cy="0" r="8" fill="rgba(52, 211, 153, 0.16)" />
          {burning && (
            <polygon points="-1.6,5.5 1.6,5.5 0,11.5" fill="#f59e0b" opacity="0.9" />
          )}
          <polygon points="0,-7.5 -2.2,-2.5 2.2,-2.5" fill="#f59e0b" />
          <rect x="-2" y="-2.5" width="4" height="7" rx="0.8" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.5" />
          <polygon points="-2,2 -4.2,5 -2,4.5" fill="#94a3b8" />
          <polygon points="2,2 4.2,5 2,4.5" fill="#94a3b8" />
        </g>
      </svg>
    </div>
  );
}

const EVENT_NAMES = {
  IGNITION: { vi: 'ĐÁNH LỬA ĐỘNG CƠ', en: 'IGNITION' },
  LIFTOFF: { vi: 'RỜI BỆ PHÓNG', en: 'LIFTOFF' },
  MAX_Q: { vi: 'ÁP SUẤT CỰC ĐẠI', en: 'MAX-Q' },
  MECO: { vi: 'TẮT ĐỘNG CƠ TẦNG 1', en: 'MECO' },
  STAGE_SEP: { vi: 'TÁCH TẦNG 1', en: 'STAGE SEPARATION' },
  FAIRING_SEP: { vi: 'TÁCH VỎ BẢO VỆ', en: 'FAIRING SEPARATION' },
  SECO: { vi: 'TẮT ĐỘNG CƠ TẦNG 2', en: 'SECO' },
  PAYLOAD_DEPLOY: { vi: 'TÁCH VỆ TINH', en: 'PAYLOAD DEPLOYMENT' },
};

export default function LaunchScreen() {
  const {
    flightData,
    design,
    audioOn,
    launchSeq,
    launchFired,
    launchResult,
    reputation,
    busy,
    selectedMissionId,
    catalog,
    evalReport,
    onLaunchEvent,
    onLaunchEnd,
    startLife,
    setPhase,
    loadMission,
    tutorialOpen,
    closeTutorial,
    completeTutorialToBrief,
    lang,
  } = useGame();

  if (!flightData) {
    return (
      <div className="sandbox-end-wrap">
        <section className="panel sandbox-end-card">
          <div className="sandbox-end-badge">{tr(lang, 'KẾT THÚC HƯỚNG DẪN SANDBOX', 'SANDBOX WALKTHROUGH COMPLETE')}</div>
          <h2 className="sandbox-end-title">{tr(lang, 'Kết thúc sandbox, quay về cốt truyện', 'Sandbox Complete — Return to Campaign')}</h2>
          <div className="sandbox-end-actions">
            <button type="button" className="btn neon-btn sandbox-return-btn" onClick={completeTutorialToBrief}>
              {tr(lang, 'QUAY VỀ CỐT TRUYỆN', 'RETURN TO MISSIONS')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const tutorialPaused = Boolean(tutorialOpen && !launchResult);

  const [telem, setTelem] = useState({ t: 0, altKm: 0, velKms: 0, pitchDeg: 0, targetAltKm: 400, phase: 'countdown' });

  const trajSeries = useMemo(() => {
    const s = flightData?.series;
    if (!s?.alt_km || !s?.n) return { points: [{ t: 0, alt: 0, down: 0 }, { t: 540, alt: 400, down: 1600 }], tEnd: 540 };
    const alt = decodeF32(s.alt_km);
    const down = s.downrange_km ? decodeF32(s.downrange_km) : null;
    const n = s.n;
    const dt = s.dt_s || 1;
    const step = Math.max(1, Math.floor(n / 60));
    const points = [];
    for (let i = 0; i < n; i += step) {
      points.push({ t: i * dt, alt: alt[i] || 0, down: down ? down[i] || 0 : i * dt });
    }
    if (points[points.length - 1]?.t < (n - 1) * dt) {
      points.push({ t: (n - 1) * dt, alt: alt[n - 1] || 0, down: down ? down[n - 1] || 0 : (n - 1) * dt });
    }
    return { points, tEnd: (n - 1) * dt };
  }, [flightData]);

  // vi tri bai phong + do nghieng quy dao -> Trai Dat o canh phong quay dung duoi ve tinh
  const site = catalog?.tables?.launch_sites?.[design?.launch?.site];
  const orbit = catalog?.tables?.orbits?.[design?.orbit];
  const geo = { latDeg: site?.lat_deg, lonDeg: site?.lon_deg, incDeg: orbit?.inclination_deg };
  const ascentPeakAltKm = Math.max(
    100,
    Number(trajSeries.points[trajSeries.points.length - 1]?.alt || telem.targetAltKm || 400)
  );
  const finalOrbitAltKm = Number(orbit?.altitude_km || ascentPeakAltKm);

  // To bao tai nan (du lieu su co that cua chuyen bay) lap day o trong duoi khung 3D khi phong that bai
  const accident =
    launchResult && !launchResult.success
      ? buildAccidentInfo({
          failure: launchResult.failure,
          flight: flightData,
          catalog,
          cost: Number(evalReport?.metrics?.['cost.total_musd'] || 0),
        })
      : null;

  return (
    <div className="launch-grid">
      <section className="panel launch-left" data-tutorial="launch-canvas">
        <h2 className="panel-title">
          <span>
            {tr(lang, 'PHÓNG 3D', 'LAUNCH 3D')} // {flightData.meta?.vehicle} @ {flightData.meta?.site}
          </span>
          <span className="small muted">
            {tr(lang, 'TẢI TRỌNG', 'PAYLOAD')} {Number(flightData.meta?.payload_kg || 0).toFixed(1)} kg
          </span>
        </h2>

        <Launch3DCanvas
          key={launchSeq}
          flight={flightData}
          design={design}
          geo={geo}
          audioOn={audioOn}
          onEvent={onLaunchEvent}
          onEnd={onLaunchEnd}
          onTelemetry={setTelem}
          tutorialPaused={tutorialPaused}
          onResumeFromTutorial={closeTutorial}
        />

        {accident && <AccidentNewspaper info={accident} variant="extended" />}
      </section>

      <section className="panel" data-tutorial="launch-sequencer">

        <h2 className="panel-title" style={{ marginTop: 10 }}>
          <span>{tr(lang, 'TIẾN TRÌNH PHÓNG TÊN LỬA', 'ASCENT SEQUENCER')}</span>
          <span className="small muted">{flightData.meta?.physics}</span>
        </h2>

        <div className="constraint-list">
          {[{ name: 'IGNITION' }, ...(flightData.events || [])].map((ev, i) => (
            <div key={i} className={`constraint-row ${launchFired.includes(ev.name) ? 'pass' : ''}`}>
              <div className="row-between">
                <strong>{tx(EVENT_NAMES[ev.name], lang) || ev.name}</strong>
                <span className="small muted">{ev.t != null ? `T+${Number(ev.t).toFixed(0)}s` : 'T-1s'}</span>
              </div>
            </div>
          ))}
        </div>

        {!launchResult && (
          <div className="small muted" style={{ marginTop: 10 }}>
            {tr(
              lang,
              'ĐANG PHÓNG. Không thể chỉnh sửa thiết kế trong lúc tên lửa rời bệ.',
              'LAUNCH IN PROGRESS. Design cannot be modified after ignition.'
            )}
          </div>
        )}

        {launchResult && !launchResult.success && (
          <>
            <div className="halt-banner">
              {tr(lang, '⚠ THẤT BẠI PHÓNG NGHIÊM TRỌNG', '⚠ CRITICAL LAUNCH FAILURE')}
            </div>
            <Dossier dossier={launchResult.failure} />
          </>
        )}
        {launchResult?.success && (
          <div className="ok-banner">
            {tr(
              lang,
              'ĐÃ VÀO QUỸ ĐẠO. Bắt đầu theo dõi vận hành 12 tháng để kiểm chứng độ bền hệ thống.',
              'ORBIT REACHED. Begin 12-month orbital operations to verify mission delivery.'
            )}
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {launchResult?.success && (
            <button className="btn primary hazard hazard-cta" data-tutorial="launch-next" disabled={busy} onClick={startLife}>
              {tr(lang, 'THEO DÕI 12 MỐC QUỸ ĐẠO [05] →', 'ENTER 12-EPOCH ORBIT OPS [05]')}
            </button>
          )}
          {launchResult && !launchResult.success && reputation > 0 && (
            <button className="btn primary" onClick={() => setPhase('design')}>
              {tr(
                lang,
                `VỀ XƯỞNG SỬA THIẾT KẾ (CÒN ${reputation}/${REP_MAX} VẠCH UY TÍN)`,
                `RETURN TO BUILD BAY (${reputation}/${REP_MAX} CREDITS LEFT)`
              )}
            </button>
          )}
          {launchResult && !launchResult.success && reputation <= 0 && (
            <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
              {tr(
                lang,
                'DỰ ÁN BỊ HỦY — NHẬN LẠI NHIỆM VỤ TỪ ĐẦU',
                'PROGRAM CANCELED — RESTART MISSION'
              )}
            </button>
          )}
        </div>
      </section>
      {!accident && (
        <section className="panel launch-gauges-panel" aria-label="Telemetry Gauges">
          <div className="mech-gauges-grid">
            <MechTrajectoryGraph
              points={trajSeries.points}
              events={flightData.events || []}
              tEnd={trajSeries.tEnd}
              currentT={telem.t}
              currentAlt={telem.altKm}
              pitchDeg={telem.pitchDeg}
              targetAlt={ascentPeakAltKm}
              finalOrbitAlt={finalOrbitAltKm}
              orbitId={design?.orbit || 'LEO'}
            />
            <MechDial
              label={tr(lang, 'ĐỘ CAO', 'ALTITUDE')}
              valueText={telem.altKm < 10 ? telem.altKm.toFixed(1) : Math.round(telem.altKm)}
              unit="km"
              value={telem.altKm}
              min={0}
              max={Math.max(200, ascentPeakAltKm)}
              accent="#38bdf8"
              warnAt={0.92}
            />
            <MechDial
              label={tr(lang, 'VẬN TỐC', 'VELOCITY')}
              valueText={telem.velKms.toFixed(2)}
              unit="km/s"
              value={telem.velKms}
              min={0}
              max={10}
              accent="#34d399"
              warnAt={0.8}
            />
            <MechDial
              label={tr(lang, 'GÓC NGHIÊNG', 'PITCH')}
              valueText={Math.round(telem.pitchDeg)}
              unit="°"
              value={telem.pitchDeg}
              min={0}
              max={90}
              accent="#f59e0b"
              warnAt={0.9}
            />
          </div>
        </section>
      )}
    </div>
  );
}
