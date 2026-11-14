import React from 'react';
import { GameProvider, useGame } from './core/GameContext';
import { tr } from './core/i18n';
import { PHASES, canEnterPhase } from './core/gameMachine';
import BriefScreen from './screens/BriefScreen';
import BuildScreen from './screens/BuildScreen';
import HomeScreen from './screens/HomeScreen';
import InspectScreen from './screens/InspectScreen';
import LaunchScreen from './screens/LaunchScreen';
import LevelsScreen from './screens/LevelsScreen';
import OpsSandboxScreen from './screens/OpsSandboxScreen';
import OrbitScreen from './screens/OrbitScreen';
import ReviewScreen from './screens/ReviewScreen';
import StoryScene from './story/StoryScene';
import TutorialOverlay from './components/TutorialOverlay';

/**
 * Screen Registry (State Pattern): anh xa phase -> man hinh doc lap.
 */
const SCREENS = {
  home: HomeScreen,
  levels: LevelsScreen,
  brief: BriefScreen,
  design: BuildScreen,
  inspect: InspectScreen,
  launch: LaunchScreen,
  life: OrbitScreen,
  review: ReviewScreen,
  ops: OpsSandboxScreen,
  debrief: OpsSandboxScreen,
};

const PHASE_NAMES = {
  home: { vi: '00. TRANG CHỦ', en: '00. HOME' },
  brief: { vi: '01. NHIỆM VỤ', en: '01. BRIEF' },
  design: { vi: '02. THIẾT KẾ', en: '02. BUILD' },
  inspect: { vi: '03. KIỂM ĐỊNH', en: '03. INSPECT' },
  launch: { vi: '04. PHÓNG TÀU', en: '04. LAUNCH 3D' },
  life: { vi: '05. QUỸ ĐẠO', en: '05. ORBIT 12M' },
  review: { vi: '06. ĐÁNH GIÁ', en: '06. REVIEW' },
};

function TerminalShell() {
  const {
    lang,
    toggleLang,
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
    tutorialOpen,
    tutorialStep,
    setTutorialStep,
    openTutorial,
    closeTutorial,
    validityDoc,
    dialogRef,
    openValidityModal,
  } = useGame();

  const ActiveScreen = SCREENS[phase] || HomeScreen;

  const currentTitle =
    (lang === 'en'
      ? missionDetail?.meta?.title?.en || missionDetail?.meta?.title?.vi
      : missionDetail?.meta?.title?.vi || missionDetail?.meta?.title?.en) || '';

  const storyHeader = {
    level: `LEVEL ${missionDetail?.meta?.difficulty ?? 1}`,
    title: currentTitle.toUpperCase(),
    budget: effectiveBudget || '-',
    deadline: effectiveDeadline || '-',
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="brand brand-btn"
          onClick={() => navigatePhase('home')}
          title={tr(lang, 'Về màn hình chính', 'Return to home screen')}
        >
          <span className="brand-dot" />
          <span>MISSION CONTROL // SPACE MISSION DESIGN TERMINAL</span>
        </button>

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
                {PHASE_NAMES[p.id]?.[lang] || p.label}
              </button>
            );
          })}
        </nav>

        <div className="top-actions">
          <button
            className="btn top-action-btn"
            onClick={toggleLang}
            title={tr(lang, 'Chuyển sang English', 'Switch to Vietnamese')}
          >
            🌐 {lang === 'vi' ? 'VI / EN' : 'EN / VI'}
          </button>
          <button
            className="btn warn top-action-btn"
            onClick={openTutorial}
            title={tr(lang, 'Mở hướng dẫn cho pha hiện tại', 'Open guide for current phase')}
          >
            ? {tr(lang, 'HƯỚNG DẪN', 'GUIDE')}
          </button>
          <button className="btn top-action-btn" onClick={() => setAudioOn((v) => !v)}>
            AUDIO: {audioOn ? tr(lang, 'BẬT', 'ON') : tr(lang, 'TẮT', 'OFF')}
          </button>
          <button className="btn top-action-btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            THEME: {theme === 'dark' ? tr(lang, 'XƯỞNG TỐI', 'WORKSHOP') : tr(lang, 'BAN NGÀY', 'DAY')}
          </button>
          <button className="btn top-action-btn" onClick={openValidityModal}>
            {tr(lang, 'HỒ SƠ VẬT LÝ', 'VALIDITY DOSSIER')}
          </button>
        </div>
      </header>

      <main className="main-area">
        {errorMsg && (
          <div className="banner-err row-between">
            <span>{errorMsg}</span>
            <button className="btn" onClick={() => setErrorMsg('')}>
              {tr(lang, 'ĐÓNG', 'DISMISS')}
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
          lang={lang}
          phase={phase}
          stepIndex={tutorialStep}
          onStepChange={setTutorialStep}
          onClose={closeTutorial}
        />
      )}

      <dialog ref={dialogRef} className="modal">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <strong style={{ color: 'var(--accent)' }}>
            {tr(lang, 'HỒ SƠ KIỂM CHỨNG VẬT LÝ & CATALOG', 'ENGINE & CATALOG VALIDITY DOSSIER')}
          </strong>
          <button className="btn" onClick={() => dialogRef.current?.close()}>
            {tr(lang, 'ĐÓNG', 'CLOSE')}
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
