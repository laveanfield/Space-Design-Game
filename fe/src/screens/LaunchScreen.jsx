import React from 'react';
import { LaunchPadLive } from '../anatomy/LaunchPadFigure';
import { Dossier } from '../components/CampaignPanels';
import HumanityImpactCard from '../components/HumanityImpactCard';
import Launch3DCanvas from '../components/Launch3DCanvas';
import { REP_MAX } from '../core/gameMachine';
import { useGame } from '../core/GameContext';

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
  } = useGame();

  if (!flightData) return null;

  return (
    <div className="launch-grid">
      <section className="panel" data-tutorial="launch-canvas">
        <h2 className="panel-title">
          <span>
            LAUNCH 3D // {flightData.meta?.vehicle} @ {flightData.meta?.site}
          </span>
          <span className="small muted">PAYLOAD {Number(flightData.meta?.payload_kg || 0).toFixed(1)} kg</span>
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
          <span>ASCENT SEQUENCER</span>
          <span className="small muted">{flightData.meta?.physics}</span>
        </h2>

        <div className="constraint-list">
          {[{ name: 'IGNITION' }, ...(flightData.events || [])].map((ev, i) => (
            <div key={i} className={`constraint-row ${launchFired.includes(ev.name) ? 'pass' : ''}`}>
              <div className="row-between">
                <strong>{ev.name}</strong>
                <span className="small muted">{ev.t != null ? `T+${Number(ev.t).toFixed(0)}s` : 'T-1s'}</span>
              </div>
            </div>
          ))}
        </div>

        {!launchResult && (
          <div className="small muted" style={{ marginTop: 10 }}>
            ĐANG PHÓNG. Không thể chỉnh sửa thiết kế trong lúc tên lửa rời bệ.
          </div>
        )}

        {launchResult && !launchResult.success && (
          <>
            <div className="halt-banner">⚠ CRITICAL LAUNCH FAILURE</div>
            <Dossier dossier={launchResult.failure} />
            <div style={{ marginTop: 10 }}>
              <HumanityImpactCard
                missionId={selectedMissionId}
                success={false}
                failureId={launchResult.failure?.kind || 'launch'}
                compact
              />
            </div>
          </>
        )}
        {launchResult?.success && (
          <div className="ok-banner">
            ĐÃ VÀO QUỸ ĐẠO. Bắt đầu theo dõi vận hành 12 tháng để kiểm chứng độ bền hệ thống.
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {launchResult?.success && (
            <button className="btn primary" disabled={busy} onClick={startLife}>
              THEO DÕI 12 MỐC QUỸ ĐẠO [05] →
            </button>
          )}
          {launchResult && !launchResult.success && reputation > 0 && (
            <button className="btn primary" onClick={() => setPhase('design')}>
              ← VỀ XƯỞNG SỬA THIẾT KẾ (CÒN {reputation}/{REP_MAX} VẠCH UY TÍN)
            </button>
          )}
          {launchResult && !launchResult.success && reputation <= 0 && (
            <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
              DỰ ÁN BỊ HỦY — NHẬN LẠI NHIỆM VỤ TỪ ĐẦU
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
