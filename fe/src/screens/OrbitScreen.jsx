import React from 'react';
import { LifePhase } from '../components/CampaignPanels';
import { useGame } from '../core/GameContext';

export default function OrbitScreen() {
  const { lifeData, design, catalog, audioOn, finishLife, lang } = useGame();
  if (!lifeData) return null;

  return (
    <LifePhase
      life={lifeData}
      design={design}
      catalog={catalog}
      audioOn={audioOn}
      onDone={finishLife}
      lang={lang}
    />
  );
}
