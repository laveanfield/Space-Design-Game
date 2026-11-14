import React from 'react';
import BossConfrontation from '../components/BossConfrontation';
import { Dossier, Logbook, tx } from '../components/CampaignPanels';
import HumanityImpactCard from '../components/HumanityImpactCard';
import { REP_MAX } from '../core/gameMachine';
import { useGame } from '../core/GameContext';

export default function ReviewScreen() {
  const {
    outcome,
    lifeData,
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
  } = useGame();

  if (!outcome) return null;

  return (
    <div className="debrief-grid">
      <section className="panel">
        <h2 className="panel-title">
          <span>DIRECTOR REVIEW // TỔNG KẾT &amp; CHẤT VẤN</span>
          <span className={`badge ${outcome.success ? 'ok' : 'err'}`}>
            {outcome.success ? 'MISSION COMPLETE' : 'MISSION FAILED'}
          </span>
        </h2>
        <h3 style={{ margin: '0 0 10px 0', color: outcome.success ? 'var(--ok)' : 'var(--err)' }}>
          {outcome.headline}
        </h3>

        <div className="kpi-grid">
          <div className="kpi-box">
            <div className="kpi-label">VÒNG ĐỜI HOẠT ĐỘNG</div>
            <div className="kpi-val">
              {outcome.survived_steps} / {lifeData?.steps_total ?? 12} MỐC
            </div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">DỮ LIỆU HỢP LỆ</div>
            <div className="kpi-val">
              {Number(outcome.usable_gb).toFixed(1)} / {Number(outcome.generated_gb).toFixed(1)} GB
            </div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">UY TÍN (AUTH CREDITS)</div>
            <div className="kpi-val">
              {outcome.repLoss > 0 ? `-${outcome.repLoss} → ` : ''}CÒN {outcome.repAfter}/{REP_MAX}
            </div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">CHỈ SỐ BỀN BỈ</div>
            <div className="kpi-val">
              {outcome.score ? `GRADE ${outcome.score.grade}` : '-'}
            </div>
          </div>
        </div>

        <div data-tutorial="review-impact" style={{ marginTop: 10 }}>
          <HumanityImpactCard
            missionId={selectedMissionId}
            success={Boolean(outcome.success)}
            failureId={outcome.dossier?.id || outcome.killer || outcome.review_fail?.[0] || 'launch'}
            outcome={outcome}
          />
        </div>

        <div data-tutorial="review-dossier">
          <Dossier dossier={outcome.dossier} />
        </div>

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
              {outcome.success ? '← THỬ CẤU HÌNH KHÁC' : '← VỀ XƯỞNG SỬA THIẾT KẾ'}
            </button>
          ) : (
            <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
              DỰ ÁN BỊ HỦY — NHẬN LẠI NHIỆM VỤ TỪ ĐẦU
            </button>
          )}
          <button className="btn" onClick={() => setPhase('brief')}>
            CHỌN NHIỆM VỤ KHÁC
          </button>
          {outcome.survived_steps > 0 && (
            <button className="btn" disabled={busy} onClick={startOps}>
              VẬN HÀNH TAY 2 NGÀY (ADCS / RCS)
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
