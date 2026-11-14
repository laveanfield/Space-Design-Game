import React from 'react';
import { beep } from '../api/client';
import { DEV } from '../core/devFlag';
import { useGame } from '../core/GameContext';

export default function BriefScreen() {
  const {
    missions,
    selectedMissionId,
    missionDetail,
    catalog,
    scenario,
    design,
    busy,
    audioOn,
    loadMission,
    applyPreset,
    enterBuild,
    setPhase,
    startTutorialSandbox,
  } = useGame();

  return (
    <div className="brief-grid">
      <section className="panel" data-tutorial="brief-missions">
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
            <p style={{ marginTop: 0 }}>{missionDetail.meta?.brief?.vi || scenario.description_simple}</p>
            <p
              className="small boss-quote"
              title="Bạn tự chịu trách nhiệm kỹ thuật: thiết kế luôn được phép phóng và chứng minh bằng kết quả thực tế."
            >
              [ENG-01] KỸ SƯ TRƯỞNG &nbsp;|&nbsp; [DIR-01] SẾP GIỮ TIỀN &nbsp;|&nbsp; AUTH CREDITS: 3/3
            </p>
            <p className="muted">
              MỤC TIÊU: {missionDetail.objective?.statement?.vi || missionDetail.objective?.statement?.en}
            </p>

            <div className="kpi-grid" style={{ marginTop: 12 }} data-tutorial="brief-kpis">
              <div className="kpi-box">
                <div className="kpi-label">BUDGET LIMIT</div>
                <div className="kpi-val">${scenario.budget_musd ?? '-'}M</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">DEADLINE / MIN LIFE</div>
                <div className="kpi-val">
                  {scenario.deadline_months ?? '-'} MO / {missionDetail.life_years ?? scenario.min_mission_life_years ?? '-'} YR
                </div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">RECOMMENDED ORBITS</div>
                <div className="small">{(scenario.allowed_orbit_ids || []).join(', ') || 'ANY'}</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">FLIGHT RULE</div>
                <div className="kpi-val">LAUNCH ANYTHING</div>
              </div>
            </div>

            <div className="row-wrap" style={{ marginTop: 14 }}>
              <button
                className="btn primary hazard-cta"
                data-tutorial="brief-start"
                disabled={!design || busy}
                onClick={() => {
                  applyPreset(typeof missionDetail.starter === 'string' ? missionDetail.starter : 'starter');
                  enterBuild();
                }}
              >
                [ VÀO XƯỞNG CHẾ TẠO → ]
              </button>
              <button
                className="btn warn"
                disabled={busy}
                onClick={() => startTutorialSandbox(true)}
                title="Chơi lại màn Sandbox kèm Kỹ sư trưởng hướng dẫn từng bước"
              >
                🎓 CHƠI SANDBOX (CÓ HƯỚNG DẪN)
              </button>
              <button
                className="btn neon-btn"
                disabled={busy}
                onClick={() => startTutorialSandbox(false)}
                title="Vào thẳng Sandbox mở khóa sẵn toàn bộ thiết bị, không bật hộp thoại hướng dẫn"
              >
                🛠️ CHƠI SANDBOX TỰ DO (TẮT HƯỚNG DẪN)
              </button>
              {DEV && missionDetail.presets?.some((p) => p.id === 'good') && (
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => {
                    applyPreset('good');
                    setPhase('design');
                  }}
                >
                  DEV: MỞ PRESET CHUẨN (GOOD)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="muted">LOADING MISSION DOSSIER...</div>
        )}
      </section>
    </div>
  );
}
