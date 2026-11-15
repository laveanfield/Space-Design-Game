import React from 'react';
import BossConfrontation from '../components/BossConfrontation';
import { Dossier, Logbook } from '../components/CampaignPanels';
import HumanityImpactCard from '../components/HumanityImpactCard';
import { REP_MAX } from '../core/gameMachine';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

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
    lang,
  } = useGame();

  if (tutorialMode || outcome?.sandboxComplete || !outcome) {
    return (
      <div className="sandbox-end-wrap">
        <section className="panel sandbox-end-card">
          <div className="sandbox-end-badge">✓ {tr(lang, 'HOÀN THÀNH HƯỚNG DẪN SANDBOX', 'SANDBOX TUTORIAL COMPLETE')}</div>
          <h2 className="sandbox-end-title">{tr(lang, 'Kết thúc sandbox, quay về cốt truyện', 'Sandbox tutorial complete, return to campaign')}</h2>
          <p className="sandbox-end-desc">
            {tr(
              lang,
              'Bạn đã hoàn tất toàn bộ quy trình từ thiết kế 9 thành phần vệ tinh, kiểm định 3 lỗi phần cứng (nghe tiếng xì ga, soi X-Ray vết nứt vàng, kéo trục pháp gương trùng trục đứng 0°), phóng tên lửa 3D tới vận hành 12 tháng trên quỹ đạo.',
              'You completed the entire workflow from designing 9 subsystems, bench-testing 3 hardware faults (listening for gas leak, X-ray scanning micro-fractures, aligning mirror optical axis to 0°), 3D rocket launch, and 12-month orbit operations.'
            )}
          </p>
          <div className="sandbox-end-actions">
            <button
              type="button"
              className="btn neon-btn sandbox-return-btn"
              onClick={completeTutorialToBrief}
            >
              ↩ {tr(lang, 'RETURN (QUAY VỀ CỐT TRUYỆN)', 'RETURN TO CAMPAIGN')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => startTutorialSandbox(false)}
            >
              🛠️ {tr(lang, 'CHƠI LẠI SANDBOX (TẮT HƯỚNG DẪN)', 'REPLAY SANDBOX (FREE PLAY)')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const failureId = outcome.dossier?.id || outcome.killer || outcome.review_fail?.[0] || 'launch';

  return (
    <div className="debrief-grid">
      {/* Cột trái: Báo cáo hậu quả & hồ sơ nguyên nhân gốc */}
      <section className="panel review-col-left">
        <h2 className="panel-title">
          <span>{tr(lang, 'ĐÁNH GIÁ CỦA GIÁM ĐỐC // TỔNG KẾT NHIỆM VỤ', 'DIRECTOR REVIEW // MISSION SUMMARY')}</span>
          <span className={`badge ${outcome.success ? 'ok' : 'err'}`}>
            {outcome.success
              ? tr(lang, 'NHIỆM VỤ HOÀN THÀNH', 'MISSION COMPLETE')
              : tr(lang, 'NHIỆM VỤ THẤT BẠI', 'MISSION FAILED')}
          </span>
        </h2>
        <h3 style={{ margin: '0 0 10px 0', color: outcome.success ? 'var(--ok)' : 'var(--err)' }}>
          {tx(outcome.headline, lang)}
        </h3>

        <div className="kpi-strip">
          <div className="kpi-cell">
            <div className="kpi-label">{tr(lang, 'VÒNG ĐỜI HOẠT ĐỘNG', 'OPERATIONAL LIFETIME')}</div>
            <div className="kpi-val review-metric-val">
              {outcome.survived_steps} / {lifeData?.steps_total ?? 12} {tr(lang, 'MỐC', 'STEPS')}
            </div>
          </div>
          <div className="kpi-cell">
            <div className="kpi-label">{tr(lang, 'DỮ LIỆU HỢP LỆ', 'USABLE DATA')}</div>
            <div className="kpi-val review-metric-val">
              {Number(outcome.usable_gb).toFixed(1)} / {Number(outcome.generated_gb).toFixed(1)} GB
            </div>
          </div>
          <div className="kpi-cell">
            <div className="kpi-label">{tr(lang, 'UY TÍN', 'AUTHORITY')}</div>
            <div className="kpi-val review-metric-val">
              {outcome.repLoss > 0 ? `-${outcome.repLoss} → ` : ''}
              {tr(lang, 'CÒN', 'REMAINING')} {outcome.repAfter}/{REP_MAX}
            </div>
          </div>
          <div className="kpi-cell">
            <div className="kpi-label">{tr(lang, 'CHỈ SỐ BỀN BỈ', 'RELIABILITY GRADE')}</div>
            <div className="kpi-val review-metric-val">
              {outcome.score ? tr(lang, `HẠNG ${outcome.score.grade}`, `GRADE ${outcome.score.grade}`) : '-'}
            </div>
          </div>
        </div>

        <div className="review-section-block" data-tutorial="review-impact">
          <HumanityImpactCard
            missionId={selectedMissionId}
            success={Boolean(outcome.success)}
            failureId={failureId}
            outcome={outcome}
            lang={lang}
          />
        </div>

        <div className="review-section-block" data-tutorial="review-dossier">
          <Dossier dossier={outcome.dossier} />
        </div>

        {lifeData?.communications && (
          <div className="comms-review-summary review-section-block">
            <div className="row-between small">
              <strong>{tr(lang, 'ĐÁNH GIÁ TRUYỀN THÔNG', 'COMMUNICATIONS REVIEW')}</strong>
              <span className={`badge ${lifeData.communications.summary.delivered >= lifeData.evidence_need ? 'ok' : 'err'}`}>
                {lifeData.communications.summary.delivered}/{lifeData.evidence_need} {tr(lang, 'BẰNG CHỨNG ĐÃ VỀ', 'EVIDENCES DELIVERED')}
              </span>
            </div>
            <div className="small muted">
              {lifeData.communications.windows.length} {tr(lang, 'lượt qua trạm · ', 'passes · ')}
              {Number(lifeData.communications.summary.usable_min).toFixed(1)} {tr(lang, 'phút đủ tín hiệu · ', 'min signal · ')}
              {Number(lifeData.communications.summary.buffer_gb).toFixed(3)} {tr(lang, 'GB còn chờ', 'GB pending')}
            </div>
            {lifeData.communications.diagnostics.map((reason) => (
              <div className="small" key={reason}>→ {reason}</div>
            ))}
          </div>
        )}

        <div className="constraint-list" style={{ marginTop: 8 }}>
          {(outcome.review || []).map((r) => (
            <div key={r.id} className={`constraint-row ${r.pass ? 'pass' : 'fail'}`}>
              <div className="row-between small">
                <span>{r.pass ? `OK: ${r.id.toUpperCase()}` : tx(r.title, lang)}</span>
                <span className={`badge ${r.pass ? 'ok' : 'err'}`}>
                  {r.pass ? tr(lang, 'ĐẠT', 'PASS') : tr(lang, 'HỎNG', 'FAIL')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cột phải: Chất vấn sếp & điều hướng */}
      <div className="review-col-right">
        <section className="panel review-confront-panel" data-tutorial="review-confront">
          <BossConfrontation
            outcome={outcome}
            effectiveBudget={effectiveBudget}
            effectiveDeadline={effectiveDeadline}
            budgetBonus={budgetBonus}
            audioOn={audioOn}
            onUnlock={applyBossOverride}
            onReturnBuild={() => setPhase('design')}
            lang={lang}
          />

          <div className="row-wrap review-actions-bar review-action-bar" data-tutorial="review-actions">
            {outcome.repAfter > 0 ? (
              <button className="btn primary" onClick={() => setPhase('design')}>
                {outcome.success
                  ? tr(lang, '← THỬ CẤU HÌNH KHÁC', '← TRY ANOTHER CONFIG')
                  : tr(lang, '← VỀ XƯỞNG SỬA THIẾT KẾ', '← BACK TO BUILD')}
              </button>
            ) : (
              <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
                {tr(lang, 'DỰ ÁN BỊ HỦY — LÀM LẠI TỪ ĐẦU', 'PROJECT SCRUBBED — RESTART MISSION')}
              </button>
            )}
            <button className="btn" onClick={() => setPhase('levels')}>
              {tr(lang, 'CHỌN MÀN CHƠI KHÁC', 'SELECT OTHER MISSION')}
            </button>
            {outcome.survived_steps > 0 && (
              <button className="btn" disabled={busy} onClick={startOps}>
                {tr(lang, 'VẬN HÀNH QUỸ ĐẠO', 'MANUAL ORBIT OPS')}
              </button>
            )}
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">
            <span>{tr(lang, 'NHẬT KÝ SỰ CỐ CHUYẾN BAY', 'FLIGHT INCIDENT LOGBOOK')}</span>
          </h2>
          <Logbook entries={logbook} />
        </section>
      </div>
    </div>
  );
}
