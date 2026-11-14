import React from 'react';
import { LaunchPadLive } from '../anatomy/LaunchPadFigure';
import { Dossier } from '../components/CampaignPanels';
import HumanityImpactCard from '../components/HumanityImpactCard';
import Launch3DCanvas from '../components/Launch3DCanvas';
import { REP_MAX } from '../core/gameMachine';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

const EVENT_NAMES = {
  IGNITION: { vi: 'ĐÁNH LỬA ĐỘNG CƠ', en: 'IGNITION' },
  LIFTOFF: { vi: 'RỜI BỆ PHÓNG', en: 'LIFTOFF' },
  MAX_Q: { vi: 'ÁP SUẤT CỰC ĐẠI', en: 'MAX-Q' },
  MECO: { vi: 'TẮT ĐỘNG CƠ TẦNG 1', en: 'MECO' },
  STAGE_SEP: { vi: 'TÁCH TẦNG 1', en: 'STAGE SEPARATION' },
  FAIRING_SEP: { vi: 'TÁCH VỎ BẢO VỆ', en: 'FAIRING SEPARATION' },
  SECO: { vi: 'TẮT ĐỘNG CƠ TẦNG 2', en: 'SECO' },
  PAYLOAD_DEPLOY: { vi: 'TÁCH VỆ TINH', en: 'PAYLOAD DEPLOYMENT' },
};

export default function LaunchScreen() {
  const {
    flightData,
    design,
    audioOn,
    launchSeq,
    launchFired,
    launchResult,
    reputation,
    busy,
    selectedMissionId,
    onLaunchEvent,
    onLaunchEnd,
    startLife,
    setPhase,
    loadMission,
    lang,
  } = useGame();

  if (!flightData) return null;

  return (
    <div className="launch-grid">
      <section className="panel" data-tutorial="launch-canvas">
        <h2 className="panel-title">
          <span>
            {tr(lang, 'PHÓNG 3D', 'LAUNCH 3D')} // {flightData.meta?.vehicle} @ {flightData.meta?.site}
          </span>
          <span className="small muted">
            {tr(lang, 'TẢI TRỌNG', 'PAYLOAD')} {Number(flightData.meta?.payload_kg || 0).toFixed(1)} kg
          </span>
        </h2>

        <Launch3DCanvas
          key={launchSeq}
          flight={flightData}
          design={design}
          audioOn={audioOn}
          onEvent={onLaunchEvent}
          onEnd={onLaunchEnd}
        />
      </section>

      <section className="panel" data-tutorial="launch-sequencer">
        <LaunchPadLive key={launchSeq} fired={launchFired} />

        <h2 className="panel-title" style={{ marginTop: 10 }}>
          <span>{tr(lang, 'TIẾN TRÌNH PHÓNG TÊN LỬA', 'ASCENT SEQUENCER')}</span>
          <span className="small muted">{flightData.meta?.physics}</span>
        </h2>

        <div className="constraint-list">
          {[{ name: 'IGNITION' }, ...(flightData.events || [])].map((ev, i) => (
            <div key={i} className={`constraint-row ${launchFired.includes(ev.name) ? 'pass' : ''}`}>
              <div className="row-between">
                <strong>{tx(EVENT_NAMES[ev.name], lang) || ev.name}</strong>
                <span className="small muted">{ev.t != null ? `T+${Number(ev.t).toFixed(0)}s` : 'T-1s'}</span>
              </div>
            </div>
          ))}
        </div>

        {!launchResult && (
          <div className="small muted" style={{ marginTop: 10 }}>
            {tr(
              lang,
              'ĐANG PHÓNG. Không thể chỉnh sửa thiết kế trong lúc tên lửa rời bệ.',
              'LAUNCH IN PROGRESS. Configuration locked during ascent.'
            )}
          </div>
        )}

        {launchResult && !launchResult.success && (
          <>
            <div className="halt-banner">
              {tr(lang, '⚠ THẤT BẠI PHÓNG NGHIÊM TRỌNG', '⚠ CRITICAL LAUNCH FAILURE')}
            </div>
            <Dossier dossier={launchResult.failure} />
            <div style={{ marginTop: 10 }}>
              <HumanityImpactCard
                missionId={selectedMissionId}
                success={false}
                failureId={launchResult.failure?.kind || 'launch'}
                compact
                lang={lang}
              />
            </div>
          </>
        )}
        {launchResult?.success && (
          <div className="ok-banner">
            {tr(
              lang,
              'ĐÃ VÀO QUỸ ĐẠO. Bắt đầu theo dõi vận hành để kiểm chứng độ bền hệ thống.',
              'ORBIT INSERTION CONFIRMED. Initiating mission lifetime evaluation.'
            )}
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {launchResult?.success && (
            <button className="btn primary" disabled={busy} onClick={startLife}>
              {tr(lang, 'THEO DÕI VẬN HÀNH QUỸ ĐẠO →', 'PROCEED TO ORBIT OPERATIONS →')}
            </button>
          )}
          {launchResult && !launchResult.success && reputation > 0 && (
            <button className="btn primary" onClick={() => setPhase('design')}>
              {tr(
                lang,
                `← VỀ XƯỞNG SỬA THIẾT KẾ — UY TÍN ${reputation}/${REP_MAX}`,
                `← RETURN TO BUILD — AUTHORITY ${reputation}/${REP_MAX}`
              )}
            </button>
          )}
          {launchResult && !launchResult.success && reputation <= 0 && (
            <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
              {tr(
                lang,
                'DỰ ÁN BỊ HỦY — LÀM LẠI TỪ ĐẦU',
                'PROJECT SCRUBBED — RESTART MISSION'
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
