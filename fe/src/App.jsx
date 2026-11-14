import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, beep, decodeF32, decodeU8, playSoundAsset } from './api/client';
import Hangar3DCanvas from './components/Hangar3DCanvas';
import OrbitOps3DCanvas from './components/OrbitOps3DCanvas';
import LaunchCanvas from './components/LaunchCanvas';
import MassBalanceSvg from './components/MassBalanceSvg';

const PHASES = [
  { id: 'brief', label: '01.BRIEF' },
  { id: 'design', label: '02.DESIGN_DESK' },
  { id: 'launch', label: '03.LAUNCH_CTRL' },
  { id: 'ops', label: '04.SAT_OPS_3D' },
  { id: 'debrief', label: '05.DEBRIEF' },
];

const SLOTS = [
  { id: 'orbit', label: 'ORBIT' },
  { id: 'instruments', label: 'INSTR' },
  { id: 'bus', label: 'BUS' },
  { id: 'power', label: 'POWER' },
  { id: 'battery', label: 'BATT' },
  { id: 'comm', label: 'COMM' },
  { id: 'obc', label: 'OBC' },
  { id: 'adcs', label: 'ADCS' },
  { id: 'launch', label: 'LAUNCH' },
];

function resolvePresetDesign(presets, presetId, missionDetail) {
  if (presetId === 'starter' && missionDetail?.starter && typeof missionDetail.starter === 'object') {
    return {
      schema_version: 'design/1',
      mission: missionDetail.id || missionDetail.starter.mission,
      seed: missionDetail.hazards?.seed ?? missionDetail.starter.seed ?? 0,
      ...structuredClone(missionDetail.starter),
    };
  }
  const map = Object.fromEntries((presets || []).map((p) => [p.id, p]));
  const pick = (typeof presetId === 'string' && map[presetId]) || presets?.[0];
  if (!pick) {
    if (missionDetail?.starter && typeof missionDetail.starter === 'object') {
      return {
        schema_version: 'design/1',
        mission: missionDetail.id,
        seed: missionDetail.hazards?.seed ?? 0,
        ...structuredClone(missionDetail.starter),
      };
    }
    return null;
  }

  let base = pick.design ? structuredClone(pick.design) : null;
  if (!base && pick.from && map[pick.from]?.design) {
    base = structuredClone(map[pick.from].design);
    if (pick.swap) {
      Object.entries(pick.swap).forEach(([k, v]) => {
        base[k] = structuredClone(v);
      });
    }
  }
  if (!base) return null;
  return {
    schema_version: 'design/1',
    mission: missionDetail?.id || base.mission,
    seed: missionDetail?.hazards?.seed ?? 0,
    ...base,
  };
}

export default function App() {
  const [phase, setPhase] = useState('brief');
  const [theme, setTheme] = useState('dark');
  const [audioOn, setAudioOn] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [catalog, setCatalog] = useState(null);
  const [missions, setMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [missionDetail, setMissionDetail] = useState(null);

  const [activeSlot, setActiveSlot] = useState('orbit');
  const [design, setDesign] = useState(null);
  const [evalReport, setEvalReport] = useState(null);

  // Launch replay state
  const [flightData, setFlightData] = useState(null);
  const [launchPlaying, setLaunchPlaying] = useState(false);
  const [launchWarp, setLaunchWarp] = useState(8);
  const [launchCursor, setLaunchCursor] = useState(0);

  // Ops 3D simulation state
  const [opsId, setOpsId] = useState(null);
  const [opsSnap, setOpsSnap] = useState(null);
  const [opsRunning, setOpsRunning] = useState(false);
  const [opsWarp, setOpsWarp] = useState(5);
  const [rcsPulse, setRcsPulse] = useState('med');
  const [opsEvents, setOpsEvents] = useState([]);
  const opsSteppingRef = useRef(false);

  // Debrief & Advisor state
  const [debrief, setDebrief] = useState(null);
  const [pareto, setPareto] = useState(null);
  const [adviseObj, setAdviseObj] = useState('max_score');

  // Validity modal
  const [validityDoc, setValidityDoc] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const evaluateDesign = useCallback(async (nextDesign, missionId) => {
    if (!nextDesign) return null;
    try {
      const rep = await apiFetch('/evaluate', {
        method: 'POST',
        body: { design: nextDesign, mission_id: missionId || nextDesign.mission, with_hints: true },
      });
      setEvalReport(rep);
      return rep;
    } catch (err) {
      setErrorMsg(`Evaluate error: ${err.message}`);
      return null;
    }
  }, []);

  const loadMission = useCallback(
    async (missionId) => {
      setBusy(true);
      setErrorMsg('');
      try {
        const detail = await apiFetch(`/missions/${encodeURIComponent(missionId)}`);
        setSelectedMissionId(missionId);
        setMissionDetail(detail);
        const starterId = typeof detail.starter === 'string' ? detail.starter : 'starter';
        const d = resolvePresetDesign(detail.presets, starterId, detail);
        setDesign(d);
        setFlightData(null);
        setOpsId(null);
        setOpsSnap(null);
        setOpsRunning(false);
        setDebrief(null);
        setPareto(null);
        if (d) {
          await evaluateDesign(d, missionId);
        }
      } catch (err) {
        setErrorMsg(`Failed loading mission ${missionId}: ${err.message}`);
      } finally {
        setBusy(false);
      }
    },
    [evaluateDesign]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, misRes] = await Promise.all([apiFetch('/catalog'), apiFetch('/missions')]);
        if (cancelled) return;
        setCatalog(catRes);
        setMissions(misRes);
        if (misRes.length > 0) {
          await loadMission(misRes[0].id);
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(`Backend connection failed: ${err.message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMission]);

  // Launch replay timer
  const decodedFlight = useMemo(() => {
    if (!flightData?.series?.t) return null;
    return {
      t: decodeF32(flightData.series.t),
      alt: decodeF32(flightData.series.alt_km),
      vel: decodeF32(flightData.series.v_inertial_ms),
      mass: decodeF32(flightData.series.mass_kg),
      thrust: decodeF32(flightData.series.thrust_n),
      stage: decodeU8(flightData.series.stage_idx),
    };
  }, [flightData]);

  useEffect(() => {
    if (phase !== 'launch' || !launchPlaying || !decodedFlight) return undefined;
    const total = decodedFlight.t.length;
    if (total === 0) return undefined;
    const id = setInterval(() => {
      setLaunchCursor((prev) => {
        const step = Math.max(1, Math.round(launchWarp * 0.5));
        const nxt = prev + step;
        if (nxt >= total - 1) {
          setLaunchPlaying(false);
          return total - 1;
        }
        return nxt;
      });
    }, 80);
    return () => clearInterval(id);
  }, [phase, launchPlaying, launchWarp, decodedFlight]);

  // Ops real-time simulation loop
  const stepOps = useCallback(
    async (dt, actions = []) => {
      if (!opsId || opsSteppingRef.current) return;
      opsSteppingRef.current = true;
      try {
        const snap = await apiFetch(`/ops/${encodeURIComponent(opsId)}/step`, {
          method: 'POST',
          body: { dt, actions },
        });
        setOpsSnap(snap);
        if (Array.isArray(snap?.events) && snap.events.length > 0) {
          setOpsEvents((prev) => [...snap.events.slice().reverse(), ...prev].slice(0, 30));
          const names = snap.events.map((e) => e.name).join(' ');
          if (names.includes('SEU') || names.includes('FAULT') || names.includes('DENIED')) {
            playSoundAsset(audioOn, '08-11-2026-alarm.wav', 0.28);
          } else if (names.includes('CAPTURE')) {
            playSoundAsset(audioOn, '08-11-2026-shutter.wav', 0.35);
          }
        }
      } catch (err) {
        setOpsRunning(false);
        setErrorMsg(`Ops step error: ${err.message}`);
      } finally {
        opsSteppingRef.current = false;
      }
    },
    [opsId, audioOn]
  );

  useEffect(() => {
    if (phase !== 'ops' || !opsRunning || !opsId) return undefined;
    const id = setInterval(() => {
      stepOps(Math.min(3600, opsWarp), []);
    }, 450);
    return () => clearInterval(id);
  }, [phase, opsRunning, opsId, opsWarp, stepOps]);

  const updateDesign = (mutator) => {
    if (!design) return;
    const next = structuredClone(design);
    mutator(next);
    setDesign(next);
    beep(audioOn, 740, 0.035);
    evaluateDesign(next, selectedMissionId);
  };

  const applyPreset = (presetId) => {
    const d = resolvePresetDesign(missionDetail?.presets, presetId, missionDetail);
    if (!d) return;
    setDesign(d);
    beep(audioOn, 920, 0.05);
    evaluateDesign(d, selectedMissionId);
  };

  const startLaunch = async () => {
    if (!design || !evalReport?.launch_allowed) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const fl = await apiFetch('/fly', {
        method: 'POST',
        body: { design, mission_id: selectedMissionId },
      });
      setFlightData(fl);
      setLaunchCursor(0);
      setLaunchPlaying(true);
      setPhase('launch');
      playSoundAsset(audioOn, '06-11-2026-ignition.wav', 0.35);
    } catch (err) {
      setErrorMsg(`Flight simulation failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const startOps = async () => {
    if (!design) return;
    setBusy(true);
    setErrorMsg('');
    setLaunchPlaying(false);
    try {
      const res = await apiFetch('/ops', {
        method: 'POST',
        body: {
          design,
          mission_id: selectedMissionId,
          seed: Number(design.seed ?? missionDetail?.hazards?.seed ?? 0),
        },
      });
      setOpsId(res.ops_id);
      setOpsSnap(res.snapshot);
      setOpsEvents(res.snapshot?.events || []);
      setOpsRunning(true);
      setPhase('ops');
      playSoundAsset(audioOn, '06-11-2026-chime.wav', 0.3);
    } catch (err) {
      setErrorMsg(`Ops start failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const finishOps = async (objective = adviseObj) => {
    if (!opsId) return;
    setOpsRunning(false);
    setBusy(true);
    setErrorMsg('');
    try {
      const [debRes, advRes] = await Promise.all([
        apiFetch(`/ops/${encodeURIComponent(opsId)}/finish`, { method: 'POST' }),
        apiFetch('/advise', {
          method: 'POST',
          body: { mission_id: selectedMissionId, objective, k: 5 },
        }).catch(() => null),
      ]);
      setDebrief(debRes);
      setPareto(advRes);
      setPhase('debrief');
      playSoundAsset(audioOn, '06-11-2026-beep_go.wav', 0.3);
    } catch (err) {
      setErrorMsg(`Debrief failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const refreshAdvisor = async (obj) => {
    setAdviseObj(obj);
    if (!selectedMissionId) return;
    try {
      const advRes = await apiFetch('/advise', {
        method: 'POST',
        body: { mission_id: selectedMissionId, objective: obj, k: 5 },
      });
      setPareto(advRes);
    } catch (err) {
      setErrorMsg(`Advisor error: ${err.message}`);
    }
  };

  const openValidityModal = async () => {
    try {
      const doc = await apiFetch('/validity');
      setValidityDoc(doc);
      dialogRef.current?.showModal();
    } catch (err) {
      setErrorMsg(`Failed loading validity doc: ${err.message}`);
    }
  };

  const scenario = missionDetail?.scenario || {};
  const tables = catalog?.tables || {};

  const slotEntries = useMemo(() => {
    if (!tables || !activeSlot) return [];
    if (activeSlot === 'orbit') return Object.values(tables.orbits || {});
    if (activeSlot === 'instruments') return Object.values(tables.instruments || {});
    if (activeSlot === 'bus') return Object.values(tables.buses || {});
    if (activeSlot === 'power') return Object.values(tables.power_arrays || {});
    if (activeSlot === 'battery') return Object.values(tables.batteries || {});
    if (activeSlot === 'comm') return Object.values(tables.comms || {});
    if (activeSlot === 'obc') {
      return Object.values(tables.avionics || {}).filter((a) => !a.type || a.type === 'obc');
    }
    if (activeSlot === 'adcs') {
      return Object.values(tables.avionics || {}).filter((a) => a.type === 'adcs');
    }
    if (activeSlot === 'launch') return Object.values(tables.launch_vehicles || {});
    return [];
  }, [tables, activeSlot]);

  const recommendedDesigns = useMemo(() => {
    if (!pareto) return [];
    if (Array.isArray(pareto.designs)) return pareto.designs;
    if (Array.isArray(pareto)) return pareto;
    return [];
  }, [pareto]);

  const selectedVehicle = tables.launch_vehicles?.[design?.launch?.vehicle];
  const compatibleSites = (selectedVehicle?.compatible_site_ids || [])
    .map((sid) => tables.launch_sites?.[sid])
    .filter(Boolean);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MISSION CONTROL // SPACE MISSION DESIGN TERMINAL</span>
        </div>

        <nav className="stepper">
          {PHASES.map((p) => {
            const disabled =
              (p.id === 'design' && !design) ||
              (p.id === 'launch' && !flightData) ||
              (p.id === 'ops' && !opsSnap) ||
              (p.id === 'debrief' && !debrief);
            return (
              <button
                key={p.id}
                className={`step-btn ${phase === p.id ? 'active' : ''}`}
                disabled={disabled}
                onClick={() => {
                  beep(audioOn, 660, 0.03);
                  if (p.id !== 'ops') setOpsRunning(false);
                  if (p.id !== 'launch') setLaunchPlaying(false);
                  setPhase(p.id);
                }}
              >
                {p.label}
              </button>
            );
          })}
        </nav>

        <div className="top-actions">
          <button className="btn" onClick={() => setAudioOn((v) => !v)}>
            AUDIO: {audioOn ? 'ON' : 'OFF'}
          </button>
          <button className="btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            THEME: {theme === 'dark' ? 'CRT' : 'DAY'}
          </button>
          <button className="btn" onClick={openValidityModal}>
            VALIDITY_DOC
          </button>
        </div>
      </header>

      <main className="main-area">
        {errorMsg && (
          <div className="banner-err row-between">
            <span>{errorMsg}</span>
            <button className="btn" onClick={() => setErrorMsg('')}>
              DISMISS
            </button>
          </div>
        )}

        {/* PHASE 1: BRIEF */}
        {phase === 'brief' && (
          <div className="brief-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>AVAILABLE MISSIONS ({missions.length})</span>
                <span className="small muted">{catalog?.catalog_hash ? `#${catalog.catalog_hash.slice(0, 8)}` : ''}</span>
              </h2>
              <div className="mission-list">
                {missions.map((m) => (
                  <button
                    key={m.id}
                    className={`mission-card ${m.id === selectedMissionId ? 'selected' : ''}`}
                    onClick={() => {
                      beep(audioOn, 780, 0.04);
                      loadMission(m.id);
                    }}
                  >
                    <div className="row-between">
                      <strong>{m.title?.vi || m.title?.en || m.id}</strong>
                      <span className="badge info">LVL {m.difficulty}</span>
                    </div>
                    <div className="small muted" style={{ marginTop: 4 }}>
                      {m.id} • ~{m.est_play_min} min
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-title">
                <span>MISSION BRIEFING</span>
                {missionDetail && <span className="badge ok">{missionDetail.id}</span>}
              </h2>
              {missionDetail ? (
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: 'var(--accent)' }}>
                    {missionDetail.meta?.title?.vi} ({missionDetail.meta?.title?.en})
                  </h3>
                  <p style={{ marginTop: 0 }}>
                    {missionDetail.meta?.brief?.vi || scenario.description_simple}
                  </p>
                  <p className="muted">
                    <strong>Mục tiêu:</strong>{' '}
                    {missionDetail.objective?.statement?.vi || missionDetail.objective?.statement?.en}
                  </p>

                  <div className="kpi-grid" style={{ marginTop: 12 }}>
                    <div className="kpi-box">
                      <div className="kpi-label">BUDGET LIMIT</div>
                      <div className="kpi-val">${scenario.budget_musd ?? '-'}M</div>
                    </div>
                    <div className="kpi-box">
                      <div className="kpi-label">MIN LIFE / SCIENCE</div>
                      <div className="kpi-val">
                        {missionDetail.life_years ?? scenario.min_mission_life_years ?? '-'} yr /{' '}
                        {scenario.min_science_pts ?? '-'} pts
                      </div>
                    </div>
                    <div className="kpi-box">
                      <div className="kpi-label">ALLOWED ORBITS</div>
                      <div className="small">
                        {(scenario.allowed_orbit_ids || []).join(', ') || 'ANY'}
                      </div>
                    </div>
                    <div className="kpi-box">
                      <div className="kpi-label">GAMEPLAY MODE</div>
                      <div className="kpi-val">{missionDetail.gameplay?.mode || 'auto'}</div>
                    </div>
                  </div>

                  <div className="row-wrap" style={{ marginTop: 14 }}>
                    <button
                      className="btn primary"
                      disabled={!design || busy}
                      onClick={() => {
                        applyPreset(
                          typeof missionDetail.starter === 'string' ? missionDetail.starter : 'starter'
                        );
                        setPhase('design');
                      }}
                    >
                      VÀO DESIGN DESK (STARTER) →
                    </button>
                    {missionDetail.presets?.some((p) => p.id === 'good') && (
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={() => {
                          applyPreset('good');
                          setPhase('design');
                        }}
                      >
                        MỞ VỚI PRESET ĐẠT CHUẨN (GOOD)
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="muted">Loading mission dossier...</div>
              )}
            </section>
          </div>
        )}

        {/* PHASE 2: DESIGN DESK */}
        {phase === 'design' && design && (
          <div className="design-grid">
            {/* Left Slot Picker */}
            <section className="panel">
              <h2 className="panel-title">
                <span>SUBSYSTEM SLOTS</span>
                <span className="small muted">{design.orbit}</span>
              </h2>

              <div className="row-wrap" style={{ marginBottom: 8 }}>
                {(missionDetail?.presets || []).map((p) => (
                  <button key={p.id} className="btn small" onClick={() => applyPreset(p.id)}>
                    {p.id}
                  </button>
                ))}
              </div>

              <div className="slot-tabs">
                {SLOTS.map((s) => (
                  <button
                    key={s.id}
                    className={`slot-tab ${activeSlot === s.id ? 'active' : ''}`}
                    onClick={() => {
                      beep(audioOn, 620, 0.025);
                      setActiveSlot(s.id);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="option-list">
                {slotEntries.map((item) => {
                  const isInstr = activeSlot === 'instruments';
                  const isLaunch = activeSlot === 'launch';
                  const selected = isInstr
                    ? (design.instruments || []).includes(item.id)
                    : isLaunch
                      ? design.launch?.vehicle === item.id
                      : design[activeSlot] === item.id;

                  const allowedOrbits = scenario.allowed_orbit_ids || [];
                  const disallowed =
                    activeSlot === 'orbit' &&
                    allowedOrbits.length > 0 &&
                    !allowedOrbits.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      className={`option-item ${selected ? 'selected' : ''} ${disallowed ? 'disallowed' : ''}`}
                      onClick={() => {
                        updateDesign((d) => {
                          if (isInstr) {
                            const cur = d.instruments || [];
                            if (cur.includes(item.id)) {
                              if (cur.length > 1) {
                                d.instruments = cur.filter((x) => x !== item.id);
                              }
                            } else {
                              d.instruments = [...cur, item.id];
                            }
                          } else if (isLaunch) {
                            const sites = item.compatible_site_ids || [];
                            const nextSite = sites.includes(d.launch?.site)
                              ? d.launch.site
                              : sites[0] || d.launch?.site;
                            d.launch = { vehicle: item.id, site: nextSite };
                          } else {
                            d[activeSlot] = item.id;
                          }
                        });
                      }}
                    >
                      <div className="row-between">
                        <strong>{item.name || item.id}</strong>
                        <span className="small muted">${Number(item.cost_musd || 0).toFixed(1)}M</span>
                      </div>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {item.id}
                        {item.mass_kg != null ? ` • ${item.mass_kg} kg` : ''}
                        {item.altitude_km != null ? ` • ${item.altitude_km} km` : ''}
                        {item.avg_power_w != null ? ` • ${item.avg_power_w}W` : ''}
                        {item.capacity_wh != null ? ` • ${item.capacity_wh}Wh` : ''}
                        {item.data_rate_mbps != null ? ` • ${item.data_rate_mbps} Mbps` : ''}
                        {item.pointing_accuracy_deg != null ? ` • ±${item.pointing_accuracy_deg}°` : ''}
                        {item.rad_tolerance_krad != null ? ` • ${item.rad_tolerance_krad} krad` : ''}
                        {item.payload_to_leo_kg != null ? ` • LEO ${item.payload_to_leo_kg}kg` : ''}
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeSlot === 'launch' && compatibleSites.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="small muted" style={{ marginBottom: 4 }}>
                    LAUNCH SITE
                  </div>
                  <div className="row-wrap">
                    {compatibleSites.map((s) => (
                      <button
                        key={s.id}
                        className={`btn ${design.launch?.site === s.id ? 'primary' : ''}`}
                        onClick={() =>
                          updateDesign((d) => {
                            d.launch = { ...d.launch, site: s.id };
                          })
                        }
                      >
                        {s.name || s.id} ({Number(s.lat_deg).toFixed(1)}°)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="slider-row">
                <div className="row-between small">
                  <span className="muted">HAZARD SEED</span>
                  <span>#{design.seed ?? 0}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="99"
                  value={Number(design.seed ?? 0)}
                  onChange={(e) => {
                    const seed = Number(e.target.value);
                    updateDesign((d) => {
                      d.seed = seed;
                    });
                  }}
                />
              </div>
            </section>

            {/* Center 3D Hangar */}
            <section className="panel">
              <h2 className="panel-title">
                <span>SPACECRAFT ASSEMBLY HANGAR (THREE.JS)</span>
                {evalReport && (
                  <span className={`badge ${evalReport.ok ? 'ok' : evalReport.launch_allowed ? 'warn' : 'err'}`}>
                    {evalReport.ok ? 'NOMINAL PASS' : evalReport.launch_allowed ? 'FLIGHT RISKS' : 'BLOCKED'}
                  </span>
                )}
              </h2>

              <Hangar3DCanvas design={design} catalog={catalog} report={evalReport} theme={theme} />
              <MassBalanceSvg mass={evalReport?.mass} metrics={evalReport?.metrics} />

              <div className="row-between" style={{ marginTop: 12 }}>
                <div className="small muted">
                  Instruments: {(design.instruments || []).join(', ')} • LV: {design.launch?.vehicle} @{' '}
                  {design.launch?.site}
                </div>
                <button
                  className="btn primary"
                  disabled={busy || !evalReport?.launch_allowed}
                  onClick={startLaunch}
                >
                  PROCEED TO LAUNCH CTRL →
                </button>
              </div>
            </section>

            {/* Right Verification & Constraints */}
            <section className="panel">
              <h2 className="panel-title">
                <span>SYSTEM EVALUATION</span>
                {evalReport?.score && (
                  <span className="badge info">
                    {Number(evalReport.score.total).toFixed(1)} ({evalReport.score.grade})
                  </span>
                )}
              </h2>

              {evalReport && (
                <>
                  <div className="kpi-grid">
                    <div className="kpi-box">
                      <div className="kpi-label">COST / BUDGET</div>
                      <div className="kpi-val">
                        ${Number(evalReport.metrics?.['cost.total_musd'] || 0).toFixed(1)}M / $
                        {scenario.budget_musd ?? '-'}M
                      </div>
                    </div>
                    <div className="kpi-box">
                      <div className="kpi-label">POWER MARGIN</div>
                      <div className="kpi-val">
                        {Number(evalReport.metrics?.['power.margin_pct'] || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="constraint-list">
                    {(evalReport.constraints || []).map((c) => (
                      <div key={c.id} className={`constraint-row ${c.pass ? 'pass' : 'fail'}`}>
                        <div className="row-between">
                          <strong>
                            {c.id.toUpperCase()} {c.critical ? '*' : ''}
                          </strong>
                          <span className={`badge ${c.pass ? 'ok' : 'err'}`}>
                            {c.pass ? 'PASS' : c.fault || 'FAIL'}
                          </span>
                        </div>
                        <div className="small muted" style={{ marginTop: 2 }}>
                          val={typeof c.value === 'number' ? c.value.toFixed(2) : String(c.value)} {c.op}{' '}
                          {typeof c.limit === 'number' ? c.limit.toFixed(2) : String(c.limit)}{' '}
                          {c.unit || ''}
                        </div>
                        {c.why && <div className="small">{c.why}</div>}
                      </div>
                    ))}
                  </div>

                  {(evalReport.hints || []).length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div className="small muted" style={{ marginBottom: 4 }}>
                        ADVISOR QUICK FIXES
                      </div>
                      {evalReport.hints.map((h, idx) => (
                        <div
                          key={idx}
                          className="constraint-row"
                          style={{ marginBottom: 4, borderLeftColor: 'var(--warn)' }}
                        >
                          <div className="small">
                            Fix <strong>{h.constraint}</strong>:
                          </div>
                          <div className="row-wrap" style={{ marginTop: 4 }}>
                            {(h.fixes || []).map((fx, fIdx) => (
                              <button
                                key={fIdx}
                                className="btn small"
                                onClick={() =>
                                  updateDesign((d) => {
                                    if (fx.slot === 'instruments') {
                                      d.instruments = Array.isArray(fx.to) ? fx.to : [fx.to];
                                    } else if (fx.slot === 'launch') {
                                      d.launch = fx.to;
                                    } else {
                                      d[fx.slot] = fx.to;
                                    }
                                  })
                                }
                              >
                                {fx.slot} → {typeof fx.to === 'object' ? fx.to.vehicle : fx.to}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        {/* PHASE 3: LAUNCH CTRL */}
        {phase === 'launch' && flightData && (
          <div className="launch-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>
                  ASCENT TRAJECTORY // {flightData.meta?.vehicle} @ {flightData.meta?.site}
                </span>
                <span className={`badge ${flightData.meta?.reaches_orbit ? 'ok' : 'err'}`}>
                  {flightData.meta?.reaches_orbit ? 'ORBIT INSERTION OK' : 'INSERTION FAILED'}
                </span>
              </h2>

              <LaunchCanvas flight={flightData} cursorIdx={launchCursor} />

              <div className="row-between" style={{ marginTop: 10 }}>
                <div className="row-wrap">
                  <button className="btn primary" onClick={() => setLaunchPlaying((p) => !p)}>
                    {launchPlaying ? 'PAUSE' : 'PLAY'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setLaunchPlaying(false);
                      setLaunchCursor(0);
                    }}
                  >
                    RESET
                  </button>
                  {[2, 8, 20].map((w) => (
                    <button
                      key={w}
                      className={`btn ${launchWarp === w ? 'primary' : ''}`}
                      onClick={() => setLaunchWarp(w)}
                    >
                      {w}x
                    </button>
                  ))}
                </div>
                <div className="small muted">
                  Δv ideal: {Number(flightData.meta?.dv_ideal_ms || 0).toFixed(0)} m/s / req:{' '}
                  {Number(flightData.meta?.dv_needed_ms || 0).toFixed(0)} m/s
                </div>
              </div>

              {decodedFlight && decodedFlight.t.length > 0 && (
                <div className="slider-row">
                  <input
                    type="range"
                    min="0"
                    max={decodedFlight.t.length - 1}
                    value={launchCursor}
                    onChange={(e) => {
                      setLaunchPlaying(false);
                      setLaunchCursor(Number(e.target.value));
                    }}
                  />
                  <div className="row-between small">
                    <span>MET: T+{decodedFlight.t[launchCursor]?.toFixed(1)}s</span>
                    <span>ALT: {decodedFlight.alt[launchCursor]?.toFixed(1)} km</span>
                    <span>VEL: {(decodedFlight.vel[launchCursor] / 1000)?.toFixed(2)} km/s</span>
                    <span>MASS: {decodedFlight.mass[launchCursor]?.toFixed(0)} kg</span>
                  </div>
                </div>
              )}
            </section>

            <section className="panel">
              <h2 className="panel-title">
                <span>ASCENT EVENTS & SEQUENCER</span>
                <span className="small muted">{flightData.meta?.physics}</span>
              </h2>

              <div className="constraint-list">
                {(flightData.events || []).map((ev, i) => {
                  const curT = decodedFlight?.t[launchCursor] || 0;
                  const reached = curT >= ev.t;
                  return (
                    <div key={i} className={`constraint-row ${reached ? 'pass' : ''}`}>
                      <div className="row-between">
                        <strong>{ev.name}</strong>
                        <span className="small muted">T+{Number(ev.t).toFixed(1)}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn primary"
                  disabled={busy || !flightData.meta?.reaches_orbit}
                  onClick={startOps}
                >
                  ENTER ORBIT OPERATIONS 3D →
                </button>
                <button className="btn" onClick={() => setPhase('design')}>
                  ← BACK TO DESIGN DESK
                </button>
              </div>
            </section>
          </div>
        )}

        {/* PHASE 4: SAT OPS 3D */}
        {phase === 'ops' && opsSnap && (
          <div className="ops-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>ORBITAL OPERATIONS 3D (THREE.JS)</span>
                <span className="badge info">
                  T+{Number(opsSnap.t || 0).toFixed(0)}s • {opsSnap.mode?.toUpperCase()}
                </span>
              </h2>

              <OrbitOps3DCanvas snapshot={opsSnap} design={design} catalog={catalog} />

              <div className="row-between" style={{ marginTop: 10 }}>
                <div className="row-wrap">
                  <button className="btn primary" onClick={() => setOpsRunning((r) => !r)}>
                    {opsRunning ? 'PAUSE SIM' : 'RUN SIM'}
                  </button>
                  {[1, 5, 20, 60].map((w) => (
                    <button
                      key={w}
                      className={`btn ${opsWarp === w ? 'primary' : ''}`}
                      onClick={() => setOpsWarp(w)}
                    >
                      {w}x
                    </button>
                  ))}
                  <button className="btn" onClick={() => stepOps(5, [])}>
                    +5s STEP
                  </button>
                </div>

                <button className="btn warn" disabled={busy} onClick={() => finishOps()}>
                  END MISSION & DEBRIEF →
                </button>
              </div>

              <div className="panel" style={{ marginTop: 10, padding: 10 }}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <strong className="small">ADCS & RCS ATTITUDE CONTROL</strong>
                  <span className="small muted">MODE: {opsSnap.attitude?.auto || 'MANUAL'}</span>
                </div>
                <div className="row-wrap" style={{ marginBottom: 8 }}>
                  {['rate_null', 'nadir', 'track', 'manual'].map((m) => (
                    <button
                      key={m}
                      className={`btn ${
                        (opsSnap.attitude?.auto || 'manual') === m ? 'primary' : ''
                      }`}
                      onClick={() => stepOps(0.5, [{ type: m }])}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                  <button
                    className="btn primary"
                    onClick={() =>
                      stepOps(0.5, [
                        {
                          type: 'capture',
                          offset_deg: Number(opsSnap.attitude?.boresight_error_deg || 0),
                        },
                      ])
                    }
                  >
                    CAPTURE TARGET
                  </button>
                  {(opsSnap.overlays || []).includes('orbit_keeping') && (
                    <button
                      className="btn warn"
                      disabled={(opsSnap.fuel || 0) <= 0}
                      onClick={() => stepOps(0.5, [{ type: 'burn' }])}
                    >
                      REBOOST BURN ({opsSnap.fuel ?? 0})
                    </button>
                  )}
                </div>

                <div className="row-wrap">
                  <span className="small muted">RCS ({rcsPulse}):</span>
                  {['short', 'med', 'long'].map((p) => (
                    <button
                      key={p}
                      className={`btn small ${rcsPulse === p ? 'primary' : ''}`}
                      onClick={() => setRcsPulse(p)}
                    >
                      {p}
                    </button>
                  ))}
                  {[
                    { label: 'Roll+', axis: 0, sign: 1 },
                    { label: 'Roll-', axis: 0, sign: -1 },
                    { label: 'Pitch+', axis: 1, sign: 1 },
                    { label: 'Pitch-', axis: 1, sign: -1 },
                    { label: 'Yaw+', axis: 2, sign: 1 },
                    { label: 'Yaw-', axis: 2, sign: -1 },
                  ].map((cmd) => (
                    <button
                      key={cmd.label}
                      className="btn small"
                      onClick={() =>
                        stepOps(0.5, [
                          { type: 'rcs', axis: cmd.axis, sign: cmd.sign, pulse: rcsPulse },
                        ])
                      }
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Right Telemetry HUD */}
            <section className="panel">
              <h2 className="panel-title">
                <span>LIVE SPACECRAFT TELEMETRY</span>
                <span
                  className={`badge ${
                    opsSnap.link?.state === 'LOCK'
                      ? 'ok'
                      : opsSnap.link?.state === 'MARGINAL'
                        ? 'warn'
                        : 'err'
                  }`}
                >
                  {opsSnap.link?.state || 'NO_PASS'}
                </span>
              </h2>

              {opsSnap.mode_hud && (
                <div className="kpi-box" style={{ marginBottom: 8 }}>
                  <div className="kpi-label">{opsSnap.mode_hud.title}</div>
                  {(opsSnap.mode_hud.lines || []).map((ln, idx) => (
                    <div key={idx} className="small">
                      {ln}
                    </div>
                  ))}
                  {(opsSnap.mode_hud.prompts || []).map((pr, idx) => (
                    <div key={idx} className="small" style={{ color: 'var(--warn)', marginTop: 3 }}>
                      ▶ {pr}
                    </div>
                  ))}
                </div>
              )}

              <div className="telemetry-grid">
                <div className="kpi-box">
                  <div className="kpi-label">BATTERY SOC</div>
                  <div className="kpi-val">{((opsSnap.power?.soc || 0) * 100).toFixed(1)}%</div>
                  <div className="gauge-bar">
                    <div
                      className={`gauge-fill ${(opsSnap.power?.soc || 0) < 0.25 ? 'err' : ''}`}
                      style={{ width: `${Math.min(100, (opsSnap.power?.soc || 0) * 100)}%` }}
                    />
                  </div>
                  <div className="small muted">
                    Gen {Number(opsSnap.power?.gen_w || 0).toFixed(1)}W / Load{' '}
                    {Number(opsSnap.power?.load_w || 0).toFixed(1)}W
                  </div>
                </div>

                <div className="kpi-box">
                  <div className="kpi-label">DATA BUFFER</div>
                  <div className="kpi-val">
                    {Number(opsSnap.data?.downlinked_gb || 0).toFixed(3)} GB
                  </div>
                  <div className="gauge-bar">
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          ((opsSnap.data?.buffer_gb || 0) /
                            Math.max(0.01, opsSnap.data?.capacity_gb || 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="small muted">
                    Buf {Number(opsSnap.data?.buffer_gb || 0).toFixed(2)} /{' '}
                    {Number(opsSnap.data?.capacity_gb || 0).toFixed(1)} GB
                  </div>
                </div>

                <div className="kpi-box">
                  <div className="kpi-label">ATTITUDE ERROR</div>
                  <div className="kpi-val">
                    {Number(opsSnap.attitude?.boresight_error_deg || 0).toFixed(2)}°
                  </div>
                  <div className="small muted">
                    Rate: {(opsSnap.attitude?.omega_dps || []).map((v) => v.toFixed(1)).join(', ')} °/s
                  </div>
                </div>

                <div className="kpi-box">
                  <div className="kpi-label">RADIATION DOSE</div>
                  <div className="kpi-val">
                    {Number(opsSnap.radiation?.dose_krad || 0).toFixed(1)} krad
                  </div>
                  <div className="small muted">
                    Tol {Number(opsSnap.radiation?.tolerance_krad || 0).toFixed(0)} krad{' '}
                    {opsSnap.radiation?.seu_active ? '• SEU ACTIVE!' : ''}
                  </div>
                </div>
              </div>

              {(opsSnap.faults || []).length > 0 && (
                <div className="row-wrap" style={{ marginTop: 8 }}>
                  {opsSnap.faults.map((f, idx) => (
                    <span key={idx} className="badge err">
                      FAULT: {f}
                    </span>
                  ))}
                </div>
              )}

              <div className="small muted" style={{ margin: '10px 0 4px 0' }}>
                EVENT STREAM
              </div>
              <div className="constraint-list" style={{ maxHeight: 165 }}>
                {opsEvents.map((ev, i) => (
                  <div key={i} className="small">
                    [T+{Number(ev.t || 0).toFixed(0)}s] <strong>{ev.name}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* PHASE 5: DEBRIEF */}
        {phase === 'debrief' && debrief && (
          <div className="debrief-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>POST-FLIGHT DEBRIEF</span>
                <span className={`badge ${debrief.design_ok ? 'ok' : 'warn'}`}>
                  GRADE {debrief.score?.grade || '-'}
                </span>
              </h2>

              <div className="kpi-grid">
                <div className="kpi-box">
                  <div className="kpi-label">FINAL SCORE</div>
                  <div className="kpi-val">{Number(debrief.score?.total || 0).toFixed(1)} / 100</div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-label">COST / BUDGET</div>
                  <div className="kpi-val">
                    ${Number(debrief.cost_musd || 0).toFixed(1)}M / $
                    {Number(debrief.budget_musd || 0).toFixed(1)}M
                  </div>
                </div>
              </div>

              <div className="constraint-list">
                {(debrief.explanations || []).map((ex, idx) => (
                  <div key={idx} className="constraint-row">
                    {typeof ex === 'string' ? ex : JSON.stringify(ex)}
                  </div>
                ))}
              </div>

              <div className="row-wrap" style={{ marginTop: 14 }}>
                <button className="btn primary" onClick={() => setPhase('design')}>
                  ← TWEAK DESIGN IN HANGAR
                </button>
                <button className="btn" onClick={() => setPhase('brief')}>
                  SWITCH MISSION
                </button>
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-title">
                <span>PARETO ADVISOR RECOMMENDATIONS</span>
                <div className="row-wrap">
                  <button
                    className={`btn small ${adviseObj === 'max_score' ? 'primary' : ''}`}
                    onClick={() => refreshAdvisor('max_score')}
                  >
                    MAX SCORE
                  </button>
                  <button
                    className={`btn small ${adviseObj === 'min_cost' ? 'primary' : ''}`}
                    onClick={() => refreshAdvisor('min_cost')}
                  >
                    MIN COST
                  </button>
                </div>
              </h2>

              {pareto && (
                <div className="small muted" style={{ marginBottom: 8 }}>
                  Evaluated {pareto.n_evaluated} candidates • {pareto.n_ok} passing
                  {pareto.truncated ? ' (search truncated)' : ''}
                </div>
              )}

              <div className="constraint-list">
                {recommendedDesigns.length === 0 ? (
                  <div className="muted small">No Pareto candidates returned for this query.</div>
                ) : (
                  recommendedDesigns.map((rec, idx) => (
                    <div key={idx} className="constraint-row pass">
                      <div className="row-between">
                        <strong>
                          #{idx + 1} • Score {Number(rec.score).toFixed(1)} ({rec.grade}) • $
                          {Number(rec.cost_musd).toFixed(1)}M
                        </strong>
                        <button
                          className="btn small"
                          onClick={() => {
                            const next = { ...rec.design, mission: selectedMissionId };
                            setDesign(next);
                            evaluateDesign(next, selectedMissionId);
                            setPhase('design');
                          }}
                        >
                          LOAD
                        </button>
                      </div>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {rec.design?.orbit} | {(rec.design?.instruments || []).join(',')} |{' '}
                        {rec.design?.bus} | {rec.design?.power} | {rec.design?.comm} |{' '}
                        {rec.design?.launch?.vehicle}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <dialog ref={dialogRef} className="modal">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <strong style={{ color: 'var(--accent)' }}>ENGINE & CATALOG VALIDITY DOSSIER</strong>
          <button className="btn" onClick={() => dialogRef.current?.close()}>
            CLOSE
          </button>
        </div>
        {validityDoc && (
          <div>
            <div className="small muted" style={{ marginBottom: 8 }}>
              Engine: {validityDoc.engine_version} • Catalog Hash: {validityDoc.catalog_hash}
            </div>
            <pre className="pre-scroll">{validityDoc.data_doctor_md}</pre>
          </div>
        )}
      </dialog>
    </div>
  );
}
