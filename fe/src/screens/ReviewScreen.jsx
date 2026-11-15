import React from 'react';
import BossConfrontation from '../components/BossConfrontation';
import { Dossier, Logbook, tx } from '../components/CampaignPanels';
import HumanityImpactCard from '../components/HumanityImpactCard';
import { canShowOrbitalTimes } from '../components/missionPlayback';
import { REP_MAX } from '../core/gameMachine';
import { useGame } from '../core/GameContext';

export default function ReviewScreen() {
  const {
    outcome,
    lifeData,
    launchResult,
    flightData,
    effectiveBudget,
    effectiveDeadline,
    budgetBonus,
    audioOn,
    applyBossOverride,
    selectedMissionId,
    loadMission,
    setPhase,
    startOps,
    busy,
    logbook,
    tutorialMode,
    completeTutorialToBrief,
    startTutorialSandbox,
  } = useGame();

  if (tutorialMode || outcome?.sandboxComplete || !outcome) {
    return (
      <div className="sandbox-end-wrap">
        <section className="panel sandbox-end-card">
          <div className="sandbox-end-badge">SANDBOX WALKTHROUGH COMPLETE</div>
          <h2 className="sandbox-end-title">Sandbox Complete — Return to Campaign</h2>
          <p className="sandbox-end-desc">
            You completed the entire mission workflow: building all 9 subsystems, passing the 3 pre-flight inspection checks, flying the 3D ascent, and running 12-month orbital operations.
          </p>
          <div className="sandbox-end-actions">
            <button
              type="button"
              className="btn neon-btn sandbox-return-btn"
              onClick={completeTutorialToBrief}
            >
              RETURN TO MISSIONS
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => startTutorialSandbox(false)}
            >
              REPLAY FREE SANDBOX (NO GUIDE)
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="debrief-grid">
      <section className="panel">
        <h2 className="panel-title">
          <span>DIRECTOR REVIEW // SUMMARY &amp; AUDIT</span>
          <span className={`badge ${outcome.success ? 'ok' : 'err'}`}>
            {outcome.success ? 'MISSION COMPLETE' : 'MISSION FAILED'}
          </span>
        </h2>
        <h3 style={{ margin: '0 0 10px 0', color: outcome.success ? 'var(--ok)' : 'var(--err)' }}>
          {outcome.headline}
        </h3>

        <div className="kpi-grid">
          <div className="kpi-box">
            <div className="kpi-label">OPERATIONAL LIFETIME</div>
            <div className="kpi-val">
              {outcome.survived_steps} / {lifeData?.steps_total ?? 12} EPOCHS
            </div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">VALID EVIDENCE DATA</div>
            <div className="kpi-val">
              {Number(outcome.usable_gb).toFixed(1)} / {Number(outcome.generated_gb).toFixed(1)} GB
            </div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">AUTHORIZATION CREDITS</div>
            <div className="kpi-val">
              {outcome.repLoss > 0 ? `-${outcome.repLoss} -> ` : ''}{outcome.repAfter}/{REP_MAX} LEFT
            </div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">DURABILITY RATING</div>
            <div className="kpi-val">
              {outcome.score ? `GRADE ${outcome.score.grade}` : '-'}
            </div>
          </div>
        </div>

        <div data-tutorial="review-impact" style={{ marginTop: 10 }}>
          {canShowOrbitalTimes({
            missionId: selectedMissionId,
            success: Boolean(outcome.success),
            outcome,
            lifeData,
            launchResult,
            flightData,
          }) && (
            <HumanityImpactCard
              missionId={selectedMissionId}
              success={Boolean(outcome.success)}
              failureId={outcome.dossier?.id || outcome.killer || outcome.review_fail?.[0] || 'launch'}
              outcome={outcome}
              lifeData={lifeData}
              launchResult={launchResult}
              flightData={flightData}
            />
          )}
        </div>

        <div data-tutorial="review-dossier">
          <Dossier dossier={outcome.dossier} />
        </div>

        {lifeData?.communications && (
          <div className="comms-review-summary">
            <div className="row-between small">
              <strong>COMMUNICATIONS REVIEW</strong>
              <span className={`badge ${lifeData.communications.summary.delivered >= lifeData.evidence_need ? 'ok' : 'err'}`}>
                {lifeData.communications.summary.delivered}/{lifeData.evidence_need} EVIDENCE DELIVERED
              </span>
            </div>
            <div className="small muted">
              {lifeData.communications.windows.length} ground passes | {Number(lifeData.communications.summary.usable_min).toFixed(1)} min usable link | {Number(lifeData.communications.summary.buffer_gb).toFixed(3)} GB pending
            </div>
            {lifeData.communications.diagnostics.map((reason) => (
              <div className="small" key={reason}>- {reason}</div>
            ))}
          </div>
        )}

        <div className="constraint-list" style={{ marginTop: 10 }}>
          {(outcome.review || []).map((r) => (
            <div key={r.id} className={`constraint-row ${r.pass ? 'pass' : 'fail'}`}>
              <div className="row-between small">
                <span>{r.pass ? `OK: ${r.id.toUpperCase()}` : tx(r.title)}</span>
                <span className={`badge ${r.pass ? 'ok' : 'err'}`}>{r.pass ? 'PASS' : 'FAIL'}</span>
              </div>
            </div>
          ))}
        </div>

        <div data-tutorial="review-confront">
          <BossConfrontation
            outcome={outcome}
            effectiveBudget={effectiveBudget}
            effectiveDeadline={effectiveDeadline}
            budgetBonus={budgetBonus}
            audioOn={audioOn}
            onUnlock={applyBossOverride}
            onReturnBuild={() => setPhase('design')}
          />
        </div>

        <div className="row-wrap" style={{ marginTop: 14 }} data-tutorial="review-actions">
          {outcome.repAfter > 0 ? (
            <button className="btn primary" onClick={() => setPhase('design')}>
              {outcome.success ? 'TRY ANOTHER CONFIGURATION' : 'RETURN TO BUILD BAY'}
            </button>
          ) : (
            <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
              PROGRAM CANCELED — RESTART MISSION
            </button>
          )}
          <button className="btn" onClick={() => setPhase('brief')}>
            SELECT ANOTHER MISSION
          </button>
          {outcome.survived_steps > 0 && (
            <button className="btn" disabled={busy} onClick={startOps}>
              2-DAY MANUAL OPS (ADCS / RCS)
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">
          <span>FLIGHT INCIDENT LOGBOOK</span>
        </h2>
        <Logbook entries={logbook} />
      </section>
    </div>
  );
}
