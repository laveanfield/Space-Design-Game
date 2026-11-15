import React from 'react';
import { MissionBriefingDossier } from '../components/CrisisIntro';
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
    replayCrisisIntro,
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

            <div style={{ marginTop: 12 }}>
              <MissionBriefingDossier
                missionId={missionDetail.id}
                missionDetail={missionDetail}
                scenario={scenario}
                compact
              />
            </div>

            <div className="row-wrap brief-actions" data-tutorial="brief-start" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn primary hazard-cta"
                disabled={!design || busy}
                onClick={() => {
                  applyPreset(typeof missionDetail.starter === 'string' ? missionDetail.starter : 'starter');
                  enterBuild();
                }}
              >
                {tr(lang, 'VÀO XƯỞNG CHẾ TẠO →', 'ENTER BUILD BAY →')}
              </button>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={replayCrisisIntro}
                title={tr(lang, 'Mở lại phần giới thiệu toàn màn hình và hồ sơ kỹ thuật nhiệm vụ', 'Open full-screen narrative intro and technical dossier for this mission')}
              >
                {tr(lang, 'XEM HỒ SƠ NHIỆM VỤ', 'VIEW MISSION DOSSIER')}
              </button>
              <button
                type="button"
                className="btn warn"
                disabled={busy}
                onClick={() => startTutorialSandbox(true)}
                title={tr(lang, 'Chạy hướng dẫn Sandbox từng bước cùng Kỹ sư trưởng', 'Run interactive Sandbox Tutorial guided step-by-step by the Chief Engineer')}
              >
                {tr(lang, 'CHƠI SANDBOX (CÓ HƯỚNG DẪN)', 'SANDBOX TUTORIAL (GUIDED)')}
              </button>
              <button
                type="button"
                className="btn neon-btn"
                disabled={busy}
                onClick={() => startTutorialSandbox(false)}
                title={tr(lang, 'Vào Sandbox tự do mở toàn bộ linh kiện, tắt bảng hướng dẫn', 'Enter free Sandbox with all subsystems unlocked and guide hidden')}
              >
                {tr(lang, 'SANDBOX TỰ DO (KHÔNG HD)', 'FREE SANDBOX (NO GUIDE)')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setPhase('levels')}
              >
                {tr(lang, 'ĐỔI MÀN CHƠI', 'CHANGE LEVEL')}
              </button>
              {DEV && missionDetail.presets?.some((p) => p.id === 'good') && (
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => {
                    applyPreset('good', true);
                    setPhase('design');
                  }}
                >
                  {tr(lang, 'DEV: MỞ PRESET CHUẨN', 'DEV: LOAD GOOD PRESET')}
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
