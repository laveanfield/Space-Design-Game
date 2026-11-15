import React, { useState } from 'react';
import { beep } from '../api/client';
import { useGame } from '../core/GameContext';
import { tr } from '../core/i18n';
import { MISSION_ORDER } from '../core/gameMachine';
import { BossPortrait, EngineerPortrait } from '../story/Portraits';

export default function HomeScreen() {
  const {
    lang,
    toggleLang,
    busy,
    audioOn,
    setAudioOn,
    theme,
    setTheme,
    unlockedMissions,
    unlockAllMissions,
    resetProgression,
    openValidityModal,
    setPhase,
    startTutorialSandbox,
    replayCrisisIntro,
  } = useGame();

  const [modal, setModal] = useState(null); // null | 'story' | 'settings'
  const allUnlocked = unlockedMissions.length >= MISSION_ORDER.length;

  const openModal = (name) => {
    beep(audioOn, 760, 0.04);
    setModal(name);
  };

  return (
    <div className="home-menu-stage">
      <div className="home-menu-shell" data-tutorial="home-hero">
        <div className="home-side-character left" aria-hidden="true">
          <div className="home-char-frame eng">
            <EngineerPortrait mood="calm" />
            <span className="home-char-caption">{tr(lang, 'KỸ SƯ TRƯỞNG', 'CHIEF ENGINEER')}</span>
          </div>
        </div>

        <section className="panel lantern-panel home-menu-card">
          <div className="home-menu-badge">
            {tr(lang, 'CHẾ TẠO VỆ TINH • ĐẤU TRÍ QUỸ ĐẠO', 'SATELLITE ENGINEERING • ORBITAL STRATEGY')}
          </div>

          <h1 className="home-menu-title">ORBITAL ACCOUNTABILITY</h1>
          <p className="home-menu-subtitle">
            {tr(lang, 'Bảo vệ khoa học trước Sếp cắt xén ngân sách', 'Defend science against budget-slashing directors')}
          </p>

          <nav className="home-menu-buttons" aria-label={tr(lang, 'Menu chính', 'Main menu')} data-tutorial="home-start">
            <button
              type="button"
              className="btn primary hazard-cta home-menu-btn"
              disabled={busy}
              onClick={() => {
                beep(audioOn, 880, 0.05);
                setPhase('brief');
              }}
            >
              <span className="home-btn-label">🚀 {tr(lang, 'BẮT ĐẦU CHƠI', 'START GAME')}</span>
              <span className="home-btn-meta">▶</span>
            </button>

            <button
              type="button"
              className="btn home-menu-btn"
              disabled={busy}
              onClick={() => {
                beep(audioOn, 820, 0.05);
                startTutorialSandbox(true);
              }}
            >
              <span className="home-btn-label">🎓 {tr(lang, 'HƯỚNG DẪN TẬP SỰ (SANDBOX)', 'SANDBOX TUTORIAL')}</span>
              <span className="home-btn-meta">{tr(lang, 'CƠ BẢN', 'GUIDE')}</span>
            </button>

            <button
              type="button"
              className="btn home-menu-btn"
              disabled={busy}
              onClick={() => {
                beep(audioOn, 800, 0.05);
                setPhase('levels');
              }}
            >
              <span className="home-btn-label">🗺️ {tr(lang, 'CHỌN MÀN CHƠI', 'SELECT LEVEL')}</span>
              <span className="home-btn-meta">
                {unlockedMissions.length}/{MISSION_ORDER.length} {tr(lang, 'MỞ', 'UNLOCKED')}
              </span>
            </button>

            <button
              type="button"
              className="btn home-menu-btn"
              onClick={() => {
                beep(audioOn, 760, 0.04);
                replayCrisisIntro();
              }}
            >
              <span className="home-btn-label">📖 {tr(lang, 'CỐT TRUYỆN', 'STORY')}</span>
              <span className="home-btn-meta">{tr(lang, 'BỐI CẢNH', 'LORE')}</span>
            </button>

            <button
              type="button"
              className="btn home-menu-btn"
              onClick={() => openModal('settings')}
            >
              <span className="home-btn-label">⚙️ {tr(lang, 'CÀI ĐẶT & HỒ SƠ', 'SETTINGS & DOSSIER')}</span>
              <span className="home-btn-meta">{theme === 'dark' ? tr(lang, 'XƯỞNG ẤM', 'WORKSHOP') : tr(lang, 'BAN NGÀY', 'DAY')}</span>
            </button>

            <button
              type="button"
              className="btn home-menu-btn"
              onClick={() => {
                beep(audioOn, 740, 0.04);
                toggleLang();
              }}
            >
              <span className="home-btn-label">{lang === 'vi' ? '🌐 NGÔN NGỮ: TIẾNG VIỆT' : '🌐 LANGUAGE: ENGLISH'}</span>
              <span className="home-btn-meta">{lang === 'vi' ? 'EN' : 'VI'}</span>
            </button>
          </nav>
        </section>

        <div className="home-side-character right" aria-hidden="true">
          <div className="home-char-frame boss">
            <BossPortrait mood="smug" />
            <span className="home-char-caption">{tr(lang, 'SẾP KẾ TOÁN', 'BUDGET DIRECTOR')}</span>
          </div>
        </div>
      </div>

      {modal === 'story' && (
        <div className="menu-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="menu-modal-head">
              <strong>📖 {tr(lang, 'CỐT TRUYỆN // ORBITAL ACCOUNTABILITY', 'STORY // ORBITAL ACCOUNTABILITY')}</strong>
              <button type="button" className="btn small" onClick={() => setModal(null)}>
                {tr(lang, 'ĐÓNG', 'CLOSE')}
              </button>
            </div>
            <div className="menu-modal-body">
              <div className="story-summary-item">
                <strong>{tr(lang, '1. Cuộc đối đầu trong xưởng:', '1. Hangar Confrontation:')}</strong>{' '}
                {tr(
                  lang,
                  'Bạn là Kỹ sư trưởng bảo vệ độ bền khoa học, còn Sếp Kế toán chỉ quan tâm cắt giảm chi phí bằng linh kiện rẻ tiền.',
                  'You are the Chief Engineer defending scientific integrity, while the Budget Director pushes cheap parts to slash costs.'
                )}
              </div>
              <div className="story-summary-item">
                <strong>{tr(lang, '2. Luật phóng tự do:', '2. Launch Anything Rule:')}</strong>{' '}
                {tr(
                  lang,
                  'Không ai cấm bạn phóng một vệ tinh yếu lên trời — nhưng bức xạ và vật lý không gian sẽ phơi bày sai lầm.',
                  'No one stops you from launching a fragile craft — but space radiation and physics will expose every shortcut.'
                )}
              </div>
              <div className="story-summary-item">
                <strong>{tr(lang, '3. Trách nhiệm với nhân loại:', '3. Human Consequences:')}</strong>{' '}
                {tr(
                  lang,
                  'Mỗi lần phóng thất bại là rừng cháy chậm cứu hộ, mất cảnh báo bão mặt trời hoặc mù dữ liệu khí hậu.',
                  'Every mission failure means delayed wildfire response, missed solar storm alerts, or blind spots in climate data.'
                )}
              </div>
            </div>
            <div className="menu-modal-foot">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setModal(null);
                  setPhase('brief');
                }}
              >
                ▶ {tr(lang, 'VÀO CHƠI NGAY', 'PLAY NOW')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'settings' && (
        <div className="menu-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="menu-modal-head">
              <strong>⚙️ {tr(lang, 'CÀI ĐẶT & DỮ LIỆU', 'SETTINGS & DATA')}</strong>
              <button type="button" className="btn small" onClick={() => setModal(null)}>
                {tr(lang, 'ĐÓNG', 'CLOSE')}
              </button>
            </div>
            <div className="menu-modal-body">
              <div className="setting-row">
                <div>
                  <strong>{tr(lang, 'Ngôn ngữ giao diện', 'Interface Language')}</strong>
                  <div className="small muted">
                    {tr(
                      lang,
                      'Chuyển đổi toàn bộ hiển thị giữa Tiếng Việt và English',
                      'Switch entire display between Vietnamese and English'
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    beep(audioOn, 740, 0.04);
                    toggleLang();
                  }}
                >
                  🌐 {lang === 'vi' ? 'TIẾNG VIỆT' : 'ENGLISH'}
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>{tr(lang, 'Âm thanh hiệu ứng', 'Sound Effects')}</strong>
                  <div className="small muted">
                    {tr(lang, 'Tiếng còi cảnh báo, thao tác xưởng & phóng tên lửa', 'Alert horns, hangar operations & rocket launches')}
                  </div>
                </div>
                <button type="button" className={`btn ${audioOn ? 'primary' : ''}`} onClick={() => setAudioOn((v) => !v)}>
                  {audioOn ? tr(lang, 'ĐANG BẬT', 'ON') : tr(lang, 'ĐANG TẮT', 'OFF')}
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>{tr(lang, 'Màu nền giao diện', 'Interface Theme')}</strong>
                  <div className="small muted">
                    {tr(lang, 'Chuyển giữa Xưởng sáng ấm và Nền giấy ban ngày', 'Switch between warm workshop and daylight paper')}
                  </div>
                </div>
                <button type="button" className="btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
                  {theme === 'dark' ? tr(lang, 'XƯỞNG SÁNG ẤM', 'WARM WORKSHOP') : tr(lang, 'GIẤY BAN NGÀY', 'DAYLIGHT PAPER')}
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>
                    {tr(lang, 'Tiến trình màn chơi', 'Mission Progression')} • {unlockedMissions.length}/{MISSION_ORDER.length}
                  </strong>
                  <div className="small muted">
                    {tr(lang, 'Mở khóa dần từng màn hoặc mở tất cả để thử nhanh', 'Unlock missions sequentially or open all for quick testing')}
                  </div>
                </div>
                {allUnlocked ? (
                  <button type="button" className="btn" onClick={resetProgression}>
                    ↺ {tr(lang, 'Khóa lại từ Màn 1', 'Reset from Level 1')}
                  </button>
                ) : (
                  <button type="button" className="btn primary" onClick={unlockAllMissions}>
                    🔓 {tr(lang, 'Mở tất cả màn', 'Unlock all levels')}
                  </button>
                )}
              </div>

              <div className="setting-row">
                <div>
                  <strong>{tr(lang, 'Hồ sơ vật lý NASA', 'NASA Physics Dossier')}</strong>
                  <div className="small muted">
                    {tr(lang, 'Xem kiểm chứng công thức tính quỹ đạo & catalog gốc', 'Review orbital formulas verification & raw catalog')}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setModal(null);
                    openValidityModal?.();
                  }}
                >
                  🔬 {tr(lang, 'MỞ HỒ SƠ', 'OPEN DOSSIER')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
