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
      setTutorialStep(2);
      setTutorialOpen(true);
    }
  }, [tutorialGuided, setTutorialStep, setTutorialOpen]);

  if (!lifeData) {
    return (
      <div className="sandbox-end-wrap">
        <section className="panel sandbox-end-card">
          <div className="sandbox-end-badge">✓ HOÀN THÀNH HƯỚNG DẪN SANDBOX</div>
          <h2 className="sandbox-end-title">Kết thúc sandbox, quay về cốt truyện</h2>
          <p className="sandbox-end-desc">
            Nhấn nút Return bên dưới để quay về màn hình cốt truyện và chọn nhiệm vụ chính thức.
          </p>
          <div className="sandbox-end-actions">
            <button
              type="button"
              className="btn neon-btn sandbox-return-btn"
              onClick={completeTutorialToBrief}
            >
              ↩ RETURN (QUAY VỀ CỐT TRUYỆN)
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
