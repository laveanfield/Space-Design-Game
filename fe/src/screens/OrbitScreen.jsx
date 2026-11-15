import React, { useCallback } from 'react';
import { LifePhase } from '../components/CampaignPanels';
import { useGame } from '../core/GameContext';

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
          <div className="sandbox-end-badge">SANDBOX WALKTHROUGH COMPLETE</div>
          <h2 className="sandbox-end-title">Sandbox Complete — Return to Campaign</h2>
          <p className="sandbox-end-desc">
            Click Return below to go back to the mission briefing screen and select a campaign mission.
          </p>
          <div className="sandbox-end-actions">
            <button
              type="button"
              className="btn neon-btn sandbox-return-btn"
              onClick={completeTutorialToBrief}
            >
              RETURN TO MISSIONS
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
    />
  );
}
