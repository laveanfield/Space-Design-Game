import React, { useMemo } from 'react';
import OrbitOps3DCanvas from '../components/OrbitOps3DCanvas';
import { useGame } from '../core/GameContext';

export default function OpsSandboxScreen() {
  const {
    phase,
    setPhase,
    opsSnap,
    opsRunning,
    setOpsRunning,
    opsWarp,
    setOpsWarp,
    rcsPulse,
    setRcsPulse,
    opsEvents,
    stepOps,
    finishOps,
    debrief,
    pareto,
    adviseObj,
    refreshAdvisor,
    selectedMissionId,
    design,
    catalog,
    setDesign,
    evaluateDesign,
    busy,
  } = useGame();

  const recommendedDesigns = useMemo(() => {
    if (!pareto) return [];
    if (Array.isArray(pareto.designs)) return pareto.designs;
    if (Array.isArray(pareto)) return pareto;
    return [];
  }, [pareto]);

  if (phase === 'ops' && opsSnap) {
    return (
      <div className="ops-grid">
        <section className="panel" data-tutorial="ops-controls">
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
                <button key={w} className={`btn ${opsWarp === w ? 'primary' : ''}`} onClick={() => setOpsWarp(w)}>
                  {w}x
                </button>
              ))}
              <button className="btn" onClick={() => stepOps(5, [])}>
                +5s STEP
              </button>
            </div>

            <button className="btn warn" disabled={busy} onClick={() => finishOps()}>
              END MISSION &amp; DEBRIEF →
            </button>
          </div>

          <div className="panel" style={{ marginTop: 10, padding: 10 }}>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <strong className="small">ADCS &amp; RCS ATTITUDE CONTROL</strong>
              <span className="small muted">MODE: {opsSnap.attitude?.auto || 'MANUAL'}</span>
            </div>
            <div className="row-wrap" style={{ marginBottom: 8 }}>
              {['rate_null', 'nadir', 'track', 'manual'].map((m) => (
                <button
                  key={m}
                  className={`btn ${(opsSnap.attitude?.auto || 'manual') === m ? 'primary' : ''}`}
                  onClick={() => stepOps(0.5, [{ type: m }])}
                >
                  {m.toUpperCase()}
                </button>
              ))}
              <button
                className="btn primary"
                onClick={() =>
                  stepOps(0.5, [{ type: 'capture', offset_deg: Number(opsSnap.attitude?.boresight_error_deg || 0) }])
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
                <button key={p} className={`btn small ${rcsPulse === p ? 'primary' : ''}`} onClick={() => setRcsPulse(p)}>
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
                  onClick={() => stepOps(0.5, [{ type: 'rcs', axis: cmd.axis, sign: cmd.sign, pulse: rcsPulse }])}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">
            <span>LIVE SPACECRAFT TELEMETRY</span>
            <span
              className={`badge ${
                opsSnap.link?.state === 'LOCK' ? 'ok' : opsSnap.link?.state === 'MARGINAL' ? 'warn' : 'err'
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
                Gen {Number(opsSnap.power?.gen_w || 0).toFixed(1)}W / Load {Number(opsSnap.power?.load_w || 0).toFixed(1)}W
              </div>
            </div>

            <div className="kpi-box">
              <div className="kpi-label">DATA BUFFER</div>
              <div className="kpi-val">{Number(opsSnap.data?.downlinked_gb || 0).toFixed(3)} GB</div>
              <div className="gauge-bar">
                <div
                  className="gauge-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      ((opsSnap.data?.buffer_gb || 0) / Math.max(0.01, opsSnap.data?.capacity_gb || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="small muted">
                Buf {Number(opsSnap.data?.buffer_gb || 0).toFixed(2)} / {Number(opsSnap.data?.capacity_gb || 0).toFixed(1)} GB
              </div>
            </div>

            <div className="kpi-box">
              <div className="kpi-label">ATTITUDE ERROR</div>
              <div className="kpi-val">{Number(opsSnap.attitude?.boresight_error_deg || 0).toFixed(2)}°</div>
              <div className="small muted">
                Rate: {(opsSnap.attitude?.omega_dps || []).map((v) => v.toFixed(1)).join(', ')} °/s
              </div>
            </div>

            <div className="kpi-box">
              <div className="kpi-label">RADIATION DOSE</div>
              <div className="kpi-val">{Number(opsSnap.radiation?.dose_krad || 0).toFixed(1)} krad</div>
              <div className="small muted">
                Tol {Number(opsSnap.radiation?.tolerance_krad || 0).toFixed(0)} krad{' '}
                {opsSnap.radiation?.seu_active ? '• SEU ACTIVE!' : ''}
              </div>
            </div>
          </div>

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
    );
  }

  if (phase === 'debrief' && debrief) {
    return (
      <div className="debrief-grid">
        <section className="panel">
          <h2 className="panel-title">
            <span>MANUAL OPS DEBRIEF</span>
            <span className={`badge ${debrief.design_ok ? 'ok' : 'warn'}`}>GRADE {debrief.score?.grade || '-'}</span>
          </h2>
          <div className="kpi-grid">
            <div className="kpi-box">
              <div className="kpi-label">FINAL SCORE</div>
              <div className="kpi-val">{Number(debrief.score?.total || 0).toFixed(1)} / 100</div>
            </div>
            <div className="kpi-box">
              <div className="kpi-label">COST / BUDGET</div>
              <div className="kpi-val">
                ${Number(debrief.cost_musd || 0).toFixed(1)}M / ${Number(debrief.budget_musd || 0).toFixed(1)}M
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
              ← BACK TO BUILD
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
              <button className={`btn small ${adviseObj === 'max_score' ? 'primary' : ''}`} onClick={() => refreshAdvisor('max_score')}>
                MAX SCORE
              </button>
              <button className={`btn small ${adviseObj === 'min_cost' ? 'primary' : ''}`} onClick={() => refreshAdvisor('min_cost')}>
                MIN COST
              </button>
            </div>
          </h2>
          <div className="constraint-list">
            {recommendedDesigns.length === 0 ? (
              <div className="muted small">No Pareto candidates returned for this query.</div>
            ) : (
              recommendedDesigns.map((rec, idx) => (
                <div key={idx} className="constraint-row pass">
                  <div className="row-between">
                    <strong>
                      #{idx + 1} • Grade {rec.grade} • ${Number(rec.cost_musd).toFixed(1)}M
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
                    {rec.design?.orbit} | {(rec.design?.instruments || []).join(',')} | {rec.design?.bus} | {rec.design?.power} |{' '}
                    {rec.design?.comm} | {rec.design?.launch?.vehicle}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  return null;
}
