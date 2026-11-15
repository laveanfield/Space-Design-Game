import React from 'react';
import AccidentNewspaper, { buildAccidentInfo } from '../components/AccidentNewspaper';
import { Dossier } from '../components/CampaignPanels';
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
    catalog,
    evalReport,
    onLaunchEvent,
    onLaunchEnd,
    startLife,
    setPhase,
    loadMission,
    tutorialOpen,
    closeTutorial,
    completeTutorialToBrief,
    lang,
  } = useGame();

  if (!flightData) {
    return (
      <div className="sandbox-end-wrap">
        <section className="panel sandbox-end-card">
          <div className="sandbox-end-badge">{tr(lang, 'KẾT THÚC HƯỚNG DẪN SANDBOX', 'SANDBOX WALKTHROUGH COMPLETE')}</div>
          <h2 className="sandbox-end-title">{tr(lang, 'Kết thúc sandbox, quay về cốt truyện', 'Sandbox Complete — Return to Campaign')}</h2>
          <div className="sandbox-end-actions">
            <button type="button" className="btn neon-btn sandbox-return-btn" onClick={completeTutorialToBrief}>
              {tr(lang, 'QUAY VỀ CỐT TRUYỆN', 'RETURN TO MISSIONS')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const tutorialPaused = Boolean(tutorialOpen && !launchResult);

  // vi tri bai phong + do nghieng quy dao -> Trai Dat o canh phong quay dung duoi ve tinh
  const site = catalog?.tables?.launch_sites?.[design?.launch?.site];
  const orbit = catalog?.tables?.orbits?.[design?.orbit];
  const geo = { latDeg: site?.lat_deg, lonDeg: site?.lon_deg, incDeg: orbit?.inclination_deg };

  // To bao tai nan (du lieu su co that cua chuyen bay) lap day o trong duoi khung 3D khi phong that bai
  const accident =
    launchResult && !launchResult.success
      ? buildAccidentInfo({
          failure: launchResult.failure,
          flight: flightData,
          catalog,
          cost: Number(evalReport?.metrics?.['cost.total_musd'] || 0),
        })
      : null;

  return (
    <div className="launch-grid">
      <section className="panel launch-left" data-tutorial="launch-canvas">
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
          geo={geo}
          audioOn={audioOn}
          onEvent={onLaunchEvent}
          onEnd={onLaunchEnd}
          tutorialPaused={tutorialPaused}
          onResumeFromTutorial={closeTutorial}
        />

        {accident && <AccidentNewspaper info={accident} variant="extended" />}
      </section>

      <section className="panel" data-tutorial="launch-sequencer">

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
              'LAUNCH IN PROGRESS. Design cannot be modified after ignition.'
            )}
          </div>
        )}

        {launchResult && !launchResult.success && (
          <>
            <div className="halt-banner">
              {tr(lang, '⚠ THẤT BẠI PHÓNG NGHIÊM TRỌNG', '⚠ CRITICAL LAUNCH FAILURE')}
            </div>
            <Dossier dossier={launchResult.failure} />
          </>
        )}
        {launchResult?.success && (
          <div className="ok-banner">
            {tr(
              lang,
              'ĐÃ VÀO QUỸ ĐẠO. Bắt đầu theo dõi vận hành 12 tháng để kiểm chứng độ bền hệ thống.',
              'ORBIT REACHED. Begin 12-month orbital operations to verify mission delivery.'
            )}
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {launchResult?.success && (
            <button className="btn primary hazard hazard-cta" data-tutorial="launch-next" disabled={busy} onClick={startLife}>
              {tr(lang, 'THEO DÕI 12 MỐC QUỸ ĐẠO [05] →', 'ENTER 12-EPOCH ORBIT OPS [05]')}
            </button>
          )}
          {launchResult && !launchResult.success && reputation > 0 && (
            <button className="btn primary" onClick={() => setPhase('design')}>
              {tr(
                lang,
                `VỀ XƯỞNG SỬA THIẾT KẾ (CÒN ${reputation}/${REP_MAX} VẠCH UY TÍN)`,
                `RETURN TO BUILD BAY (${reputation}/${REP_MAX} CREDITS LEFT)`
              )}
            </button>
          )}
          {launchResult && !launchResult.success && reputation <= 0 && (
            <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
              {tr(
                lang,
                'DỰ ÁN BỊ HỦY — NHẬN LẠI NHIỆM VỤ TỪ ĐẦU',
                'PROGRAM CANCELED — RESTART MISSION'
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
