import React, { useCallback } from 'react';
import { LifePhase } from '../components/CampaignPanels';
import { useGame } from '../core/GameContext';
import { tr } from '../core/i18n';

export default function OrbitScreen() {
  const {
    lifeData,
    design,
    catalog,
    audioOn,
    finishLife,
    tutorialMode,
    tutorialGuided,
    tutorialOpen,
    closeTutorial,
    setTutorialOpen,
    setTutorialStep,
    completeTutorialToBrief,
    lang,
  } = useGame();

  const handleTutorialFinishStep = useCallback(() => {
    if (tutorialGuided) {
      setTutorialStep(8);
      setTutorialOpen(true);
    }
  }, [tutorialGuided, setTutorialStep, setTutorialOpen]);

  if (!lifeData) {
    return (
      <div className="sandbox-end-wrap">
        <section className="panel sandbox-end-card">
          <div className="sandbox-end-badge">{tr(lang, 'HOÀN THÀNH HƯỚNG DẪN SANDBOX', 'SANDBOX WALKTHROUGH COMPLETE')}</div>
          <h2 className="sandbox-end-title">{tr(lang, 'Kết thúc sandbox, quay về cốt truyện', 'Sandbox Complete — Return to Campaign')}</h2>
          <p className="sandbox-end-desc">
            {tr(
              lang,
              'Nhấn nút Return bên dưới để quay về màn hình cốt truyện và chọn nhiệm vụ chính thức.',
              'Click Return below to go back to the mission briefing screen and select a campaign mission.'
            )}
          </p>
          <div className="sandbox-end-actions">
            <button
              type="button"
              className="btn neon-btn sandbox-return-btn"
              onClick={completeTutorialToBrief}
            >
              {tr(lang, 'QUAY VỀ CỐT TRUYỆN', 'RETURN TO MISSIONS')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <LifePhase
      life={lifeData}
      design={design}
      catalog={catalog}
      audioOn={audioOn}
      onDone={finishLife}
      onReturnCampaign={completeTutorialToBrief}
      tutorialMode={tutorialMode}
      tutorialPaused={Boolean(tutorialOpen)}
      onResumeFromTutorial={closeTutorial}
      onTutorialFinishStep={handleTutorialFinishStep}
      lang={lang}
    />
  );
}
