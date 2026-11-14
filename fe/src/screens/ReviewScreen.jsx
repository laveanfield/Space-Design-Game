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
    tutorialMode,
    completeTutorialToBrief,
    startTutorialSandbox,
  } = useGame();

  if (tutorialMode || outcome?.sandboxComplete || !outcome) {
    return (
      <div className="sandbox-end-wrap">
        <section className="panel sandbox-end-card">
          <div className="sandbox-end-badge">✓ HOÀN THÀNH HƯỚNG DẪN SANDBOX</div>
          <h2 className="sandbox-end-title">Kết thúc sandbox, quay về cốt truyện</h2>
          <p className="sandbox-end-desc">
            Bạn đã hoàn tất toàn bộ quy trình từ thiết kế 9 thành phần vệ tinh, kiểm định 3 lỗi phần cứng (nghe tiếng xì ga, soi X-Ray vết nứt vàng, kéo trục pháp gương trùng trục đứng 0°), phóng tên lửa 3D tới vận hành 12 tháng trên quỹ đạo.
          </p>
          <div className="sandbox-end-actions">
            <button
              type="button"
              className="btn neon-btn sandbox-return-btn"
              onClick={completeTutorialToBrief}
            >
              ↩ RETURN (QUAY VỀ CỐT TRUYỆN)
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => startTutorialSandbox(false)}
            >
              🛠️ CHƠI LẠI SANDBOX (TẮT HƯỚNG DẪN)
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

        {lifeData?.communications && (
          <div className="comms-review-summary">
            <div className="row-between small">
              <strong>COMMUNICATIONS REVIEW</strong>
              <span className={`badge ${lifeData.communications.summary.delivered >= lifeData.evidence_need ? 'ok' : 'err'}`}>
                {lifeData.communications.summary.delivered}/{lifeData.evidence_need} BẰNG CHỨNG ĐÃ VỀ
              </span>
            </div>
            <div className="small muted">
              {lifeData.communications.windows.length} lượt qua trạm · {Number(lifeData.communications.summary.usable_min).toFixed(1)} phút đủ tín hiệu · {Number(lifeData.communications.summary.buffer_gb).toFixed(3)} GB còn chờ
            </div>
            {lifeData.communications.diagnostics.map((reason) => (
              <div className="small" key={reason}>→ {reason}</div>
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
