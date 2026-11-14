import React from 'react';
import { GameProvider, useGame } from './core/GameContext';
import { PHASES, canEnterPhase } from './core/gameMachine';
import BriefScreen from './screens/BriefScreen';
import BuildScreen from './screens/BuildScreen';
import InspectScreen from './screens/InspectScreen';
import LaunchScreen from './screens/LaunchScreen';
import OpsSandboxScreen from './screens/OpsSandboxScreen';
import OrbitScreen from './screens/OrbitScreen';
import ReviewScreen from './screens/ReviewScreen';
import StoryScene from './story/StoryScene';
import TutorialOverlay from './components/TutorialOverlay';

/**
 * Screen Registry (State Pattern): anh xa phase -> man hinh doc lap.
 */
const SCREENS = {
  brief: BriefScreen,
  design: BuildScreen,
  inspect: InspectScreen,
  launch: LaunchScreen,
  life: OrbitScreen,
  review: ReviewScreen,
  ops: OpsSandboxScreen,
  debrief: OpsSandboxScreen,
};

function TerminalShell() {
  const {
    phase,
    navigatePhase,
    theme,
    setTheme,
    audioOn,
    setAudioOn,
    errorMsg,
    setErrorMsg,
    launchResult,
    design,
    inspectReport,
    flightData,
    lifeData,
    outcome,
    missionDetail,
    effectiveBudget,
    effectiveDeadline,
    story,
    closeStory,
    tutorialMode,
    completeTutorialToBrief,
    tutorialOpen,
    tutorialStep,
    setTutorialStep,
    openTutorial,
    closeTutorial,
    validityDoc,
    dialogRef,
    openValidityModal,
  } = useGame();

  const ActiveScreen = SCREENS[phase] || BriefScreen;

  const storyHeader = {
    level: `LEVEL ${missionDetail?.meta?.difficulty ?? 1}`,
    title: (missionDetail?.meta?.title?.vi || '').toUpperCase(),
    budget: effectiveBudget || '-',
    deadline: effectiveDeadline || '-',
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MISSION CONTROL // SPACE MISSION DESIGN TERMINAL</span>
        </div>

        <nav className="stepper">
          {PHASES.map((p) => {
            const allowed = canEnterPhase(p.id, {
              currentPhase: phase,
              launchResult,
              design,
              inspectReport,
              flightData,
              lifeData,
              outcome,
            });
            return (
              <button
                key={p.id}
                className={`step-btn ${phase === p.id ? 'active' : ''}`}
                disabled={!allowed}
                onClick={() => navigatePhase(p.id)}
              >
                {p.label}
              </button>
            );
          })}
        </nav>

        <div className="top-actions">
          {tutorialMode && (
            <button
              className="btn neon-btn"
              onClick={completeTutorialToBrief}
              title="Hoàn thành hoặc bỏ qua màn hướng dẫn để vào chọn Mission"
            >
              ★ VÀO CHỌN MISSION [01]
            </button>
          )}
          <button
            className="btn warn"
            onClick={() => (tutorialOpen ? closeTutorial() : openTutorial())}
            title="Bật/tắt Kỹ sư trưởng hướng dẫn góc phải"
          >
            {tutorialOpen ? 'ẨN KỸ SƯ' : '? HƯỚNG DẪN'}
          </button>
          <button className="btn" onClick={() => setAudioOn((v) => !v)}>
            AUDIO: {audioOn ? 'ON' : 'OFF'}
          </button>
          <button className="btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            THEME: {theme === 'dark' ? 'WORKSHOP' : 'DAY'}
          </button>
          <button className="btn" onClick={openValidityModal}>
            VALIDITY_DOC
          </button>
        </div>
      </header>

      <main className="main-area">
        {errorMsg && (
          <div className="banner-err row-between">
            <span>{errorMsg}</span>
            <button className="btn" onClick={() => setErrorMsg('')}>
              DISMISS
            </button>
          </div>
        )}

        <ActiveScreen />
      </main>

      {story && (
        <StoryScene lines={story.lines} ctx={story.ctx} header={storyHeader} audioOn={audioOn} onClose={closeStory} />
      )}

      {!story && tutorialOpen && (
        <TutorialOverlay
          phase={phase}
          stepIndex={tutorialStep}
          onStepChange={setTutorialStep}
          onClose={closeTutorial}
        />
      )}

      <dialog ref={dialogRef} className="modal">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <strong style={{ color: 'var(--accent)' }}>ENGINE &amp; CATALOG VALIDITY DOSSIER</strong>
          <button className="btn" onClick={() => dialogRef.current?.close()}>
            CLOSE
          </button>
        </div>
        {validityDoc && (
          <div>
            <div className="small muted" style={{ marginBottom: 8 }}>
              Engine: {validityDoc.engine_version} • Catalog Hash: {validityDoc.catalog_hash}
            </div>
            <pre className="pre-scroll">{validityDoc.data_doctor_md}</pre>
          </div>
        )}
      </dialog>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <TerminalShell />
    </GameProvider>
  );
}
