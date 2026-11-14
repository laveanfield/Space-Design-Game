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
    lang,
  } = useGame();

  if (!outcome) return null;
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
