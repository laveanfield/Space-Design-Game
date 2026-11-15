import React from 'react';
import { beep } from '../api/client';
import { MissionBriefingDossier } from '../components/CrisisIntro';
import { DEV } from '../core/devFlag';
import { useGame } from '../core/GameContext';

// Anh nen minh hoa cua tung nhiem vu (be/tools/14-11-2026-render_mission_art.py -> fe/public/mission_art/<ID>.jpg; khong dung /missions vi Vite chuyen duong do sang API)
export const missionArt = (id) => `/mission_art/${id}.jpg`;

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
    replayCrisisIntro,
  } = useGame();

  return (
    <div className="brief-grid">
      <section className="panel" data-tutorial="brief-missions">
        <h2 className="panel-title">
          <span>AVAILABLE MISSIONS ({missions.length})</span>
          <span className="small muted">{catalog?.catalog_hash ? `#${catalog.catalog_hash.slice(0, 8)}` : ''}</span>
        </h2>
        <div className="mission-list">
          {[...missions].sort((a, b) => (a.difficulty ?? 9) - (b.difficulty ?? 9)).map((m) => (
            <button
              key={m.id}
              className={`mission-card ${m.id === selectedMissionId ? 'selected' : ''}`}
              style={{ backgroundImage: `linear-gradient(90deg, rgba(10,14,18,0.92) 35%, rgba(10,14,18,0.45)), url(${missionArt(m.id)})` }}
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
            <div className="mission-hero" style={{ backgroundImage: `url(${missionArt(missionDetail.id)})` }}>
              <span className="badge info mission-hero-lvl">LEVEL {missionDetail.meta?.difficulty ?? 1}</span>
              <h3 className="mission-hero-title">
                {missionDetail.meta?.title?.en || missionDetail.meta?.title?.vi}
              </h3>
              <span className="mission-hero-note">mission preview</span>
            </div>
            <p style={{ marginTop: 0 }}>{missionDetail.meta?.brief?.en || scenario.description_simple || missionDetail.meta?.brief?.vi}</p>
            <p
              className="small boss-quote"
              title="You own engineering trade-offs: any build can be launched and proven against orbital physics."
            >
              [ENG-01] LEAD ENGINEER &nbsp;|&nbsp; [DIR-01] FINANCE DIRECTOR &nbsp;|&nbsp; AUTH CREDITS: 3/3
            </p>
            <p className="muted">
              OBJECTIVE: {missionDetail.objective?.statement?.en || missionDetail.objective?.statement?.vi}
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

            <div style={{ marginTop: 12 }}>
              <MissionBriefingDossier
                missionId={missionDetail.id}
                missionDetail={missionDetail}
                scenario={scenario}
                compact
              />
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
                ENTER BUILD BAY
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={replayCrisisIntro}
                title="Open full-screen narrative intro and technical dossier for this mission"
              >
                VIEW MISSION DOSSIER
              </button>
              <button
                className="btn warn"
                disabled={busy}
                onClick={() => startTutorialSandbox(true)}
                title="Run interactive Sandbox Tutorial guided step-by-step by the Chief Engineer"
              >
                SANDBOX TUTORIAL (GUIDED)
              </button>
              <button
                className="btn neon-btn"
                disabled={busy}
                onClick={() => startTutorialSandbox(false)}
                title="Enter free Sandbox with all subsystems unlocked and guide hidden"
              >
                FREE SANDBOX (NO GUIDE)
              </button>
              {DEV && missionDetail.presets?.some((p) => p.id === 'good') && (
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => {
                    applyPreset('good', true);
                    setPhase('design');
                  }}
                >
                  DEV: LOAD GOOD PRESET
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
