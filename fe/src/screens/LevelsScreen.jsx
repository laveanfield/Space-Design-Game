import React from 'react';
import { beep } from '../api/client';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';
import { MISSION_ORDER } from '../core/gameMachine';

const LEVEL_META = {
  'MP-SC01-FIRST-EYES': {
    levelNum: 1,
    tag: { vi: 'MÀN 01 • CHÁY RỪNG', en: 'LEVEL 01 • WILDFIRE' },
    title: { vi: 'Đôi Mắt Đầu Tiên Nhìn Trái Đất', en: 'First Eyes on Earth' },
    shortDesc: {
      vi: 'Phóng CubeSat chụp ảnh cứu hộ cháy rừng trước hạn chót.',
      en: 'Deploy a CubeSat to photograph emergency wildfires before deadline.',
    },
    unlockHint: { vi: 'Mặc định đã mở khóa', en: 'Unlocked by default' },
  },
  'MP-SC03-SPACE-WEATHER': {
    levelNum: 2,
    tag: { vi: 'MÀN 02 • BÃO MẶT TRỜI', en: 'LEVEL 02 • SOLAR STORM' },
    title: { vi: 'Canh Gác Bão Mặt Trời', en: 'Space Weather Sentinel' },
    shortDesc: {
      vi: 'Chế tạo tàu chống bức xạ vượt qua bão CME mặt trời.',
      en: 'Build a radiation-hardened spacecraft to weather solar CME storms.',
    },
    unlockHint: { vi: 'Hoàn thành Màn 1 để mở khóa', en: 'Complete Level 1 to unlock' },
  },
  'MP-SC04-GHG': {
    levelNum: 3,
    tag: { vi: 'MÀN 03 • KHÍ NHÀ KÍNH', en: 'LEVEL 03 • GREENHOUSE GAS' },
    title: { vi: 'Truy Vết Khí Nhà Kính', en: 'Greenhouse Gas Tracker' },
    shortDesc: {
      vi: 'Đưa cảm biến tải nặng và tên lửa lớn vào quỹ đạo ổn định.',
      en: 'Insert heavy sensors and large launch vehicles into stable orbit.',
    },
    unlockHint: { vi: 'Hoàn thành Màn 2 để mở khóa', en: 'Complete Level 2 to unlock' },
  },
};

export default function LevelsScreen() {
  const {
    lang,
    missions,
    selectedMissionId,
    busy,
    audioOn,
    unlockedMissions,
    isMissionUnlocked,
    unlockAllMissions,
    resetProgression,
    loadMission,
    setPhase,
  } = useGame();

  const missionMap = new Map((missions || []).map((m) => [m.id, m]));
  const unlockedCount = unlockedMissions.length;
  const allUnlocked = unlockedCount >= MISSION_ORDER.length;

  const handleSelectLevel = async (missionId) => {
    if (!isMissionUnlocked(missionId) || busy) return;
    beep(audioOn, 820, 0.05);
    if (selectedMissionId !== missionId) {
      await loadMission(missionId);
    }
    setPhase('brief');
  };

  return (
    <div className="levels-screen">
      <div className="panel levels-container">
        <div className="levels-header">
          <div>
            <div className="levels-kicker">
              {tr(lang, 'CHIẾN DỊCH CỨU TRÁI ĐẤT • ĐÃ MỞ', 'EARTH RESCUE CAMPAIGN • UNLOCKED')} {unlockedCount}/{MISSION_ORDER.length} {tr(lang, 'MÀN', 'LEVELS')}
            </div>
            <h1 className="levels-title">{tr(lang, 'CHỌN MÀN CHƠI', 'SELECT LEVEL')}</h1>
          </div>

          <div className="row-wrap">
            {!allUnlocked ? (
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  beep(audioOn, 860, 0.05);
                  unlockAllMissions();
                }}
              >
                🔓 {tr(lang, 'Mở khóa tất cả màn', 'Unlock all levels')}
              </button>
            ) : (
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  beep(audioOn, 520, 0.05);
                  resetProgression();
                }}
              >
                ↺ {tr(lang, 'Đặt lại tiến trình', 'Reset progression')}
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => {
                beep(audioOn, 700, 0.04);
                setPhase('home');
              }}
            >
              ← {tr(lang, 'VỀ MENU CHÍNH', 'BACK TO MAIN MENU')}
            </button>
          </div>
        </div>

        <div className="levels-grid">
          {MISSION_ORDER.map((missionId) => {
            const meta = LEVEL_META[missionId];
            const liveMission = missionMap.get(missionId);
            const unlocked = isMissionUnlocked(missionId);
            const isCurrent = selectedMissionId === missionId;

            return (
              <div
                key={missionId}
                className={`level-card ${unlocked ? 'unlocked' : 'locked'} ${isCurrent && unlocked ? 'current' : ''}`}
              >
                <div className="level-card-top">
                  <span className={`badge ${unlocked ? 'ok' : 'warn'}`}>
                    {unlocked ? tr(lang, '🔓 ĐÃ MỞ KHÓA', '🔓 UNLOCKED') : tr(lang, '🔒 ĐANG KHÓA', '🔒 LOCKED')}
                  </span>
                  <span className="small muted">{tx(meta.tag, lang)}</span>
                </div>

                <h2 className="level-card-title">
                  {tx(liveMission?.title, lang) || tx(meta.title, lang)}
                </h2>

                <p className="level-card-desc">{tx(meta.shortDesc, lang)}</p>

                <div className="level-card-meta">
                  <span className="level-pill">LVL {liveMission?.difficulty ?? meta.levelNum}</span>
                  {isCurrent && unlocked && (
                    <span className="level-pill active">{tr(lang, 'ĐANG CHỌN', 'SELECTED')}</span>
                  )}
                </div>

                <div className="level-card-footer">
                  {unlocked ? (
                    <button
                      type="button"
                      className="btn primary hazard-cta level-play-btn"
                      disabled={busy}
                      onClick={() => handleSelectLevel(missionId)}
                    >
                      ▶ {tr(lang, 'CHỌN MÀN', 'SELECT LEVEL')} {meta.levelNum}
                    </button>
                  ) : (
                    <div className="level-lock-note">
                      🔒 {tx(meta.unlockHint, lang)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
