import React, { useMemo } from 'react';
import OrbitOps3DCanvas from '../components/OrbitOps3DCanvas';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

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
    lang,
  } = useGame();

  const recommendedDesigns = useMemo(() => {
    if (!pareto) return [];
    if (Array.isArray(pareto.designs)) return pareto.designs;
    if (Array.isArray(pareto)) return pareto;
    return [];
  }, [pareto]);

  if (phase === 'ops' && opsSnap) {
    const linkStateLabel =
      opsSnap.link?.state === 'LOCK'
        ? tr(lang, 'KẾT NỐI KHÓA', 'LOCK')
        : opsSnap.link?.state === 'MARGINAL'
        ? tr(lang, 'KẾT NỐI YẾU', 'MARGINAL')
        : tr(lang, 'MẤT LIÊN LẠC', 'NO PASS');

    return (
      <div className="ops-grid">
        <section className="panel" data-tutorial="ops-controls">
          <h2 className="panel-title">
            <span>{tr(lang, 'VẬN HÀNH QUỸ ĐẠO 3D', 'ORBITAL OPERATIONS 3D')}</span>
            <span className="badge info">
              T+{Number(opsSnap.t || 0).toFixed(0)}s • {opsSnap.mode?.toUpperCase()}
            </span>
          </h2>

          <OrbitOps3DCanvas snapshot={opsSnap} design={design} catalog={catalog} />

          <div className="row-between" style={{ marginTop: 10 }}>
            <div className="row-wrap">
              <button className="btn primary" onClick={() => setOpsRunning((r) => !r)}>
                {opsRunning ? tr(lang, 'TẠM DỪNG', 'PAUSE SIM') : tr(lang, 'TIẾP TỤC', 'RUN SIM')}
              </button>
              {[1, 5, 20, 60].map((w) => (
                <button key={w} className={`btn ${opsWarp === w ? 'primary' : ''}`} onClick={() => setOpsWarp(w)}>
                  {w}x
                </button>
              ))}
              <button className="btn" onClick={() => stepOps(5, [])}>
                {tr(lang, '+5 GIÂY', '+5s STEP')}
              </button>
            </div>

            <button className="btn warn" disabled={busy} onClick={() => finishOps()}>
              {tr(lang, 'KẾT THÚC VẬN HÀNH & TỔNG KẾT →', 'END MISSION & DEBRIEF →')}
            </button>
          </div>

          <div className="panel" style={{ marginTop: 10, padding: 10 }}>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <strong className="small">
                {tr(lang, 'ĐIỀU KHIỂN ĐỊNH HƯỚNG VỆ TINH', 'SPACECRAFT ATTITUDE CONTROL')}
              </strong>
              <span className="small muted">
                {tr(lang, 'CHẾ ĐỘ', 'MODE')}:{' '}
                {opsSnap.attitude?.auto
                  ? opsSnap.attitude.auto.toUpperCase()
                  : tr(lang, 'THỦ CÔNG', 'MANUAL')}
              </span>
            </div>
            <div className="row-wrap" style={{ marginBottom: 8 }}>
              {[
                { id: 'rate_null', label: tr(lang, 'TRIỆT TIÊU QUAY', 'RATE NULL') },
                { id: 'nadir', label: tr(lang, 'HƯỚNG ĐẤT', 'NADIR') },
                { id: 'track', label: tr(lang, 'BÁM MỤC TIÊU', 'TRACK') },
                { id: 'manual', label: tr(lang, 'THỦ CÔNG', 'MANUAL') },
              ].map((m) => (
                <button
                  key={m.id}
                  className={`btn ${(opsSnap.attitude?.auto || 'manual') === m.id ? 'primary' : ''}`}
                  onClick={() => stepOps(0.5, [{ type: m.id }])}
                >
                  {m.label}
                </button>
              ))}
              <button
                className="btn primary"
                onClick={() =>
                  stepOps(0.5, [{ type: 'capture', offset_deg: Number(opsSnap.attitude?.boresight_error_deg || 0) }])
                }
              >
                {tr(lang, 'BÁM MỤC TIÊU', 'CAPTURE TARGET')}
              </button>
              {(opsSnap.overlays || []).includes('orbit_keeping') && (
                <button
                  className="btn warn"
                  disabled={(opsSnap.fuel || 0) <= 0}
                  onClick={() => stepOps(0.5, [{ type: 'burn' }])}
                >
                  {tr(
                    lang,
                    `ĐỐT ĐẨY NÂNG QUỸ ĐẠO — NHIÊN LIỆU ${opsSnap.fuel ?? 0}`,
                    `REBOOST BURN — FUEL ${opsSnap.fuel ?? 0}`
                  )}
                </button>
              )}
            </div>

            <div className="row-wrap">
              <span className="small muted">
                {tr(lang, `XUNG ĐẨY ${rcsPulse}:`, `THRUSTER PULSE ${rcsPulse}:`)}
              </span>
              {[
                { id: 'short', label: tr(lang, 'ngắn', 'short') },
                { id: 'med', label: tr(lang, 'vừa', 'med') },
                { id: 'long', label: tr(lang, 'dài', 'long') },
              ].map((p) => (
                <button
                  key={p.id}
                  className={`btn small ${rcsPulse === p.id ? 'primary' : ''}`}
                  onClick={() => setRcsPulse(p.id)}
                >
                  {p.label}
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
            <span>{tr(lang, 'DỮ LIỆU ĐO XA TRỰC TIẾP', 'LIVE SPACECRAFT TELEMETRY')}</span>
            <span
              className={`badge ${
                opsSnap.link?.state === 'LOCK' ? 'ok' : opsSnap.link?.state === 'MARGINAL' ? 'warn' : 'err'
              }`}
            >
              {linkStateLabel}
            </span>
          </h2>

          {opsSnap.mode_hud && (
            <div className="kpi-box" style={{ marginBottom: 8 }}>
              <div className="kpi-label">{tx(opsSnap.mode_hud.title, lang)}</div>
              {(opsSnap.mode_hud.lines || []).map((ln, idx) => (
                <div key={idx} className="small">
                  {tx(ln, lang)}
                </div>
              ))}
              {(opsSnap.mode_hud.prompts || []).map((pr, idx) => (
                <div key={idx} className="small" style={{ color: 'var(--warn)', marginTop: 3 }}>
                  ▶ {tx(pr, lang)}
                </div>
              ))}
            </div>
          )}

          <div className="telemetry-grid">
            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'DUNG LƯỢNG PIN', 'BATTERY SOC')}</div>
              <div className="kpi-val">{((opsSnap.power?.soc || 0) * 100).toFixed(1)}%</div>
              <div className="gauge-bar">
                <div
                  className={`gauge-fill ${(opsSnap.power?.soc || 0) < 0.25 ? 'err' : ''}`}
                  style={{ width: `${Math.min(100, (opsSnap.power?.soc || 0) * 100)}%` }}
                />
              </div>
              <div className="small muted">
                {tr(lang, 'Phát', 'Gen')} {Number(opsSnap.power?.gen_w || 0).toFixed(1)}W /{' '}
                {tr(lang, 'Tải', 'Load')} {Number(opsSnap.power?.load_w || 0).toFixed(1)}W
              </div>
            </div>

            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'BỘ ĐỆM DỮ LIỆU', 'DATA BUFFER')}</div>
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
                {tr(lang, 'Đệm', 'Buf')} {Number(opsSnap.data?.buffer_gb || 0).toFixed(2)} /{' '}
                {Number(opsSnap.data?.capacity_gb || 0).toFixed(1)} GB
              </div>
            </div>

            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'LỆCH GÓC ĐỊNH HƯỚNG', 'ATTITUDE ERROR')}</div>
              <div className="kpi-val">{Number(opsSnap.attitude?.boresight_error_deg || 0).toFixed(2)}°</div>
              <div className="small muted">
                {tr(lang, 'Tốc độ quay: ', 'Rate: ')}
                {(opsSnap.attitude?.omega_dps || []).map((v) => v.toFixed(1)).join(', ')} °/s
              </div>
            </div>

            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'LIỀU LƯỢNG BỨC XẠ', 'RADIATION DOSE')}</div>
              <div className="kpi-val">{Number(opsSnap.radiation?.dose_krad || 0).toFixed(1)} krad</div>
              <div className="small muted">
                {tr(lang, 'Chịu tải ', 'Tol ')}
                {Number(opsSnap.radiation?.tolerance_krad || 0).toFixed(0)} krad{' '}
                {opsSnap.radiation?.seu_active ? tr(lang, '• PHƠI NHIỄM BỨC XẠ!', '• RADIATION EVENT!') : ''}
              </div>
            </div>
          </div>

          <div className="small muted" style={{ margin: '10px 0 4px 0' }}>
            {tr(lang, 'DÒNG SỰ KIỆN', 'EVENT STREAM')}
          </div>
          <div className="constraint-list" style={{ maxHeight: 165 }}>
            {opsEvents.map((ev, i) => (
              <div key={i} className="small">
                [T+{Number(ev.t || 0).toFixed(0)}s] <strong>{tx(ev.name, lang)}</strong>
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
            <span>{tr(lang, 'TỔNG KẾT VẬN HÀNH THỦ CÔNG', 'MANUAL OPS DEBRIEF')}</span>
            <span className={`badge ${debrief.design_ok ? 'ok' : 'warn'}`}>
              {tr(lang, `HẠNG ${debrief.score?.grade || '-'}`, `GRADE ${debrief.score?.grade || '-'}`)}
            </span>
          </h2>
          <div className="kpi-grid">
            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'ĐIỂM TỔNG KẾT', 'FINAL SCORE')}</div>
              <div className="kpi-val">{Number(debrief.score?.total || 0).toFixed(1)} / 100</div>
            </div>
            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'CHI PHÍ / NGÂN SÁCH', 'COST / BUDGET')}</div>
              <div className="kpi-val">
                ${Number(debrief.cost_musd || 0).toFixed(1)}M / ${Number(debrief.budget_musd || 0).toFixed(1)}M
              </div>
            </div>
          </div>
          <div className="constraint-list">
            {(debrief.explanations || []).map((ex, idx) => (
              <div key={idx} className="constraint-row">
                {typeof ex === 'string' ? ex : tx(ex, lang) || JSON.stringify(ex)}
              </div>
            ))}
          </div>
          <div className="row-wrap" style={{ marginTop: 14 }}>
            <button className="btn primary" onClick={() => setPhase('design')}>
              {tr(lang, '← QUAY LẠI LẮP RÁP', '← BACK TO BUILD')}
            </button>
            <button className="btn" onClick={() => setPhase('brief')}>
              {tr(lang, 'ĐỔI NHIỆM VỤ', 'SWITCH MISSION')}
            </button>
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">
            <span>{tr(lang, 'KHUYẾN NGHỊ TỐI ƯU PARETO', 'PARETO ADVISOR RECOMMENDATIONS')}</span>
            <div className="row-wrap">
              <button
                className={`btn small ${adviseObj === 'max_score' ? 'primary' : ''}`}
                onClick={() => refreshAdvisor('max_score')}
              >
                {tr(lang, 'ĐIỂM CAO NHẤT', 'MAX SCORE')}
              </button>
              <button
                className={`btn small ${adviseObj === 'min_cost' ? 'primary' : ''}`}
                onClick={() => refreshAdvisor('min_cost')}
              >
                {tr(lang, 'CHI PHÍ THẤP NHẤT', 'MIN COST')}
              </button>
            </div>
          </h2>
          <div className="constraint-list">
            {recommendedDesigns.length === 0 ? (
              <div className="muted small">
                {tr(lang, 'Không có cấu hình Pareto phù hợp.', 'No Pareto candidates returned for this query.')}
              </div>
            ) : (
              recommendedDesigns.map((rec, idx) => (
                <div key={idx} className="constraint-row pass">
                  <div className="row-between">
                    <strong>
                      #{idx + 1} • {tr(lang, `Hạng ${rec.grade}`, `Grade ${rec.grade}`)} • $
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
                      {tr(lang, 'NẠP', 'LOAD')}
                    </button>
                  </div>
                  <div className="small muted" style={{ marginTop: 2 }}>
                    {rec.design?.orbit} | {(rec.design?.instruments || []).join(',')} | {rec.design?.bus} |{' '}
                    {rec.design?.power} | {rec.design?.comm} | {rec.design?.launch?.vehicle}
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
