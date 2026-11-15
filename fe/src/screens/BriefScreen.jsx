import React from 'react';
import { DEV } from '../core/devFlag';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

export default function BriefScreen() {
  const {
    lang,
    missionDetail,
    scenario,
    design,
    busy,
    applyPreset,
    enterBuild,
    setPhase,
    startTutorialSandbox,
  } = useGame();

  return (
    <div className="brief-single-wrap">
      <section className="panel brief-single-card">
        <h2 className="panel-title">
          <span>{tr(lang, 'PHIẾU GIAO NHIỆM VỤ', 'MISSION DOSSIER')}</span>
          {missionDetail && <span className="badge ok">{missionDetail.id}</span>}
        </h2>

        {missionDetail ? (
          <div className="brief-single-body">
            <div
              className="mission-hero"
              style={{ backgroundImage: `url(/mission_art/${missionDetail.id}.jpg)` }}
            >
              <span className="badge info mission-hero-lvl">
                {tr(lang, 'CẤP ĐỘ', 'LEVEL')} {missionDetail.meta?.difficulty ?? 1}
              </span>
              <h3 className="mission-hero-title">
                {tx(missionDetail.meta?.title, lang)}
                <small>{tx(missionDetail.meta?.title, lang === 'vi' ? 'en' : 'vi')}</small>
              </h3>
              <span className="mission-hero-note">{tr(lang, 'ảnh minh họa', 'concept art')}</span>
            </div>

            <h1 className="brief-mission-title">
              {tx(missionDetail.meta?.title, lang)}
            </h1>
            <p className="brief-mission-desc">
              {tx(missionDetail.meta?.brief, lang) || tx(scenario.description_simple, lang)}
            </p>
            <div className="brief-objective-box">
              <strong>{tr(lang, 'MỤC TIÊU:', 'OBJECTIVE:')}</strong>{' '}
              {tx(missionDetail.objective?.statement, lang)}
            </div>

            <div className="kpi-grid" style={{ marginTop: 14 }} data-tutorial="brief-kpis">
              <div className="kpi-box">
                <div className="kpi-label">{tr(lang, 'NGÂN SÁCH TỐI ĐA', 'BUDGET CEILING')}</div>
                <div className="kpi-val">${scenario.budget_musd ?? '-'}M</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">{tr(lang, 'HẠN CHÓT / TUỔI THỌ', 'DEADLINE / LIFETIME')}</div>
                <div className="kpi-val">
                  {scenario.deadline_months ?? '-'} {tr(lang, 'THÁNG', 'MO')} / {missionDetail.life_years ?? scenario.min_mission_life_years ?? '-'} {tr(lang, 'NĂM', 'YR')}
                </div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">{tr(lang, 'QUỸ ĐẠO GỢI Ý', 'TARGET ORBITS')}</div>
                <div className="kpi-val" style={{ fontSize: 13 }}>
                  {(scenario.allowed_orbit_ids || []).join(', ') || tr(lang, 'BẤT KỲ', 'ANY')}
                </div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">{tr(lang, 'LUẬT PHÓNG', 'LAUNCH PROTOCOL')}</div>
                <div className="kpi-val">LAUNCH ANYTHING</div>
              </div>
            </div>

            <div className="row-wrap brief-actions" data-tutorial="brief-start">
              <button
                type="button"
                className="btn primary hazard-cta"
                disabled={!design || busy}
                onClick={() => {
                  applyPreset(typeof missionDetail.starter === 'string' ? missionDetail.starter : 'starter');
                  enterBuild();
                }}
              >
                [ {tr(lang, 'VÀO XƯỞNG CHẾ TẠO →', 'ENTER ASSEMBLY HANGAR →')} ]
              </button>
              <button
                type="button"
                className="btn warn"
                disabled={busy}
                onClick={() => startTutorialSandbox(true)}
              >
                🎓 {tr(lang, 'CHƠI SANDBOX (CÓ HƯỚNG DẪN)', 'GUIDED SANDBOX')}
              </button>
              <button
                type="button"
                className="btn neon-btn"
                disabled={busy}
                onClick={() => startTutorialSandbox(false)}
              >
                🛠️ {tr(lang, 'SANDBOX TỰ DO', 'FREE SANDBOX')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setPhase('levels')}
              >
                🗺️ {tr(lang, 'ĐỔI MÀN CHƠI', 'CHANGE LEVEL')}
              </button>
              {DEV && missionDetail.presets?.some((p) => p.id === 'good') && (
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => {
                    applyPreset('good');
                    setPhase('design');
                  }}
                >
                  DEV: {tr(lang, 'MỞ PRESET CHUẨN', 'LOAD REFERENCE PRESET')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="muted">{tr(lang, 'ĐANG TẢI HỒ SƠ NHIỆM VỤ...', 'LOADING MISSION DOSSIER...')}</div>
        )}
      </section>
    </div>
  );
}
