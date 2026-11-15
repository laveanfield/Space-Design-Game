import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EngineerCircleAvatar } from '../story/Portraits';
import { SLOTS } from '../core/gameMachine';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

/**
 * TutorialOverlay -- Chief Engineer Interactive Walkthrough:
 * 1. Highlights the active UI target cleanly with dim backdrop while allowing free interaction.
 * 2. Keeps the Chief Engineer dock top-right (or bottom-right toggle) so bottom controls stay clear.
 * 3. Walks through 02.BUILD subsystems (Where / Pros / Cons), 03.INSPECT 3 tasks, 04.LAUNCH_3D, and 05.ORBIT_12M (9 steps).
 */

export const TUTORIAL_STEPS = {
  home: [
    {
      target: 'home-hero',
      title: { vi: '1. MENU CHÍNH', en: '1. MAIN MENU' },
      body: {
        vi: (
          <>
            Từ đây bạn có thể bắt đầu ngay, chọn màn chơi đã mở khóa, đọc nhanh cốt truyện hoặc chỉnh âm thanh và giao diện.
          </>
        ),
        en: (
          <>
            Jump into flight operations, pick unlocked missions, review backstory, or toggle audio and visual theme.
          </>
        ),
      },
    },
    {
      target: 'home-start',
      title: { vi: '2. BẮT ĐẦU HOẶC CHỌN MÀN', en: '2. START OR SELECT MISSION' },
      body: {
        vi: (
          <>
            Nhấn BẮT ĐẦU CHƠI để vào nhiệm vụ hiện tại, hoặc vào CHỌN MÀN CHƠI để xem tiến trình mở khóa từng cấp độ.
          </>
        ),
        en: (
          <>
            Click START MISSION to launch current flight, or SELECT MISSION to inspect campaign level progression.
          </>
        ),
      },
    },
  ],
  design: [
    {
      target: 'build-slots',
      slotId: 'orbit',
      title: { vi: '1/10 | QUỸ ĐẠO (1.ORBIT)', en: '1/10 | ORBIT (1.ORBIT)' },
      body: {
        vi: <>Chọn quỹ đạo bay ở cột trái rồi bấm <span className="neon-green">[TIẾP THEO]</span>.</>,
        en: <>Pick your target orbit on the left, then click <span className="neon-green">[NEXT]</span>.</>,
      },
    },
    {
      target: 'build-slots',
      slotId: 'launch',
      title: { vi: '2/10 | TÊN LỬA (2.LAUNCH)', en: '2/10 | LAUNCHER (2.LAUNCH)' },
      body: {
        vi: <>Chọn tên lửa đủ <span className="neon-green">sức nâng (CAP kg)</span> và <span className="neon-green">cỡ mũi (FAIR m)</span>.</>,
        en: <>Pick a rocket with enough <span className="neon-green">lift (CAP kg)</span> and <span className="neon-green">fairing (FAIR m)</span>.</>,
      },
    },
    {
      target: 'build-slots',
      slotId: 'bus',
      title: { vi: '3/10 | KHUNG TÀU (3.BUS)', en: '3/10 | BUS (3.BUS)' },
      body: {
        vi: <>Chọn khung vệ tinh phù hợp <span className="neon-green">trần khối lượng</span> và <span className="neon-green">công suất</span>.</>,
        en: <>Pick a spacecraft bus that fits your <span className="neon-green">mass</span> and <span className="neon-green">power</span> budget.</>,
      },
    },
    {
      target: 'build-slots',
      slotId: 'instruments',
      title: { vi: '4/10 | CẢM BIẾN (4.INSTR)', en: '4/10 | INSTRUMENT (4.INSTR)' },
      body: {
        vi: <>Chọn camera/cảm biến đạt yêu cầu nhiệm vụ. Bấm <span className="neon-green">?</span> trên thẻ để xem chi tiết.</>,
        en: <>Pick a sensor meeting mission specs. Click <span className="neon-green">?</span> on any card for details.</>,
      },
    },
    {
      target: 'build-slots',
      slotId: 'power',
      title: { vi: '5/10 | PIN MẶT TRỜI (5.POWER)', en: '5/10 | SOLAR ARRAY (5.POWER)' },
      body: {
        vi: <>Chọn cánh pin có <span className="neon-green">GEN (W)</span> lớn hơn tổng tải tiêu thụ.</>,
        en: <>Pick a solar array whose <span className="neon-green">GEN (W)</span> exceeds total load.</>,
      },
    },
    {
      target: 'build-slots',
      slotId: 'battery',
      title: { vi: '6/10 | ẮC-QUY (6.BATT)', en: '6/10 | BATTERY (6.BATT)' },
      body: {
        vi: <>Chọn pin đủ dung lượng để tàu không sập nguồn trong <span className="neon-green">vùng tối</span>.</>,
        en: <>Pick enough battery capacity to survive <span className="neon-green">Earth eclipse</span>.</>,
      },
    },
    {
      target: 'build-slots',
      slotId: 'comm',
      title: { vi: '7/10 | ĂNG-TEN (7.COMM)', en: '7/10 | RADIO (7.COMM)' },
      body: {
        vi: <>Chọn ăng-ten có <span className="neon-green">Mbps</span> đủ nhanh để truyền hết ảnh mỗi ngày.</>,
        en: <>Pick a radio fast enough (<span className="neon-green">Mbps</span>) to downlink daily imagery.</>,
      },
    },
    {
      target: 'build-slots',
      slotId: 'obc',
      title: { vi: '8/10 | MÁY TÍNH (8.OBC)', en: '8/10 | COMPUTER (8.OBC)' },
      body: {
        vi: <>Chọn máy tính có <span className="neon-green">RAD (krad)</span> cao hơn mức bức xạ quỹ đạo.</>,
        en: <>Pick an OBC with <span className="neon-green">RAD (krad)</span> above the orbit radiation dose.</>,
      },
    },
    {
      target: 'build-slots',
      slotId: 'adcs',
      title: { vi: '9/10 | ĐIỀU HƯỚNG (9.ADCS)', en: '9/10 | ATTITUDE (9.ADCS)' },
      body: {
        vi: <>Chọn ADCS có sai số <span className="neon-green">PT (±°)</span> nhỏ hơn ngưỡng camera.</>,
        en: <>Pick an ADCS with pointing error <span className="neon-green">PT (±°)</span> within camera limits.</>,
      },
    },
    {
      target: 'build-next',
      title: { vi: '10/10 | SANG KIỂM ĐỊNH', en: '10/10 | GO TO INSPECTION' },
      body: {
        vi: <>Bấm <span className="neon-green">[ ▶ TIẾP TỤC ĐẾN KIỂM ĐỊNH ]</span> bên dưới để kiểm tra trước khi phóng.</>,
        en: <>Click <span className="neon-green">[ ▶ GO TO INSPECTION ]</span> below to run pre-flight checks.</>,
      },
    },
  ],
  inspect: [
    {
      target: 'inspect-cam-align',
      title: { vi: '1/4 | CĂN TRỤC QUANG HỌC', en: '1/4 | ALIGN OPTICAL AXIS' },
      body: {
        vi: <>Kéo chuột trong khung 3D để căn trục gương về <span className="neon-green">0.0°</span> và giữ tới 100%.</>,
        en: <>Drag inside the 3D viewport to align the mirror axis to <span className="neon-green">0.0°</span> until 100%.</>,
      },
    },
    {
      target: 'inspect-stage',
      title: { vi: '2/4 | DÒ RÒ RỈ KHÍ', en: '2/4 | AUDIO LEAK SCAN' },
      body: {
        vi: <>Ở góc nhìn <span className="neon-green">FULL STACK</span>, rê chuột tìm tiếng xì lớn nhất và click để hàn kín.</>,
        en: <>In <span className="neon-green">FULL STACK</span>, sweep for the loudest hiss and click to seal the leak.</>,
      },
    },
    {
      target: 'inspect-tools',
      title: { vi: '3/4 | X-RAY TÌM VẾT NỨT', en: '3/4 | X-RAY WELD CHECK' },
      body: {
        vi: <>Bật <span className="neon-green">X-RAY MESH</span>, tìm và click vào mọi đường nứt màu vàng.</>,
        en: <>Toggle <span className="neon-green">X-RAY MESH</span> and click every yellow weld crack.</>,
      },
    },
    {
      target: 'inspect-finish',
      title: { vi: '4/4 | HOÀN TẤT KIỂM ĐỊNH', en: '4/4 | INSPECTION COMPLETE' },
      body: {
        vi: <>Bấm <span className="neon-green">[ FINISH INSPECTION ]</span> để đưa tên lửa ra bệ phóng.</>,
        en: <>Click <span className="neon-green">[ FINISH INSPECTION ]</span> to roll out to the pad.</>,
      },
    },
  ],
  launch: [
    {
      target: 'launch-canvas',
      title: { vi: 'PHÓNG TÊN LỬA 3D', en: '3D LAUNCH' },
      body: {
        vi: <>Bấm <span className="neon-green">[ BẮT ĐẦU PHÓNG ]</span> để tên lửa rời bệ, tách tầng và thả vệ tinh (chỉnh tốc độ tới x100).</>,
        en: <>Click <span className="neon-green">[ START LAUNCH ]</span> to liftoff, stage, and deploy the payload (speed up to x100).</>,
      },
    },
    {
      target: 'launch-sequencer',
      title: { vi: 'TRÌNH TỰ BAY', en: 'FLIGHT SEQUENCER' },
      body: {
        vi: <>Bảng tiến trình theo dõi các mốc <span className="neon-green">IGNITION → MAX-Q → PAYLOAD_SEP</span>.</>,
        en: <>The sequencer tracks <span className="neon-green">IGNITION → MAX-Q → PAYLOAD_SEP</span>.</>,
      },
    },
    {
      target: 'launch-next',
      title: { vi: 'ĐẠT QUỸ ĐẠO', en: 'ORBIT REACHED' },
      body: {
        vi: <>Khi phóng đạt quỹ đạo, bấm nút bên dưới để vào pha <span className="neon-green">Vận hành Quỹ đạo [05]</span>.</>,
        en: <>Once orbit insertion completes, click below to enter <span className="neon-green">Orbital Operations [05]</span>.</>,
      },
    },
  ],
  life: [
    {
      target: 'orbit-speed',
      title: { vi: '1/3 | CHẠY & TUA NHANH', en: '1/3 | START & TIME WARP' },
      body: {
        vi: <>Chọn tốc độ <span className="neon-green">1x–100x</span> rồi bấm <span className="neon-green">[ BẮT ĐẦU ]</span> để vệ tinh bay đủ 12 mốc.</>,
        en: <>Pick speed <span className="neon-green">1x–100x</span> and click <span className="neon-green">[ START ]</span> to run 12 orbital epochs.</>,
      },
    },
    {
      target: 'orbit-capture',
      title: { vi: '2/3 | CHỤP & TRUYỀN VỀ TRÁI ĐẤT', en: '2/3 | CAPTURE & DOWNLINK' },
      body: {
        vi: <>Vệ tinh chỉ thắng khi vừa <span className="neon-green">chụp đủ ảnh</span> qua vùng mục tiêu, vừa <span className="neon-green">truyền 100%</span> qua trạm mặt đất (không tràn bộ đệm).</>,
        en: <>To win, the satellite must <span className="neon-green">capture enough frames</span> and <span className="neon-green">downlink 100%</span> to ground stations without overflowing.</>,
      },
    },
    {
      target: 'orbit-next',
      title: { vi: '3/3 | HOÀN THÀNH NHIỆM VỤ', en: '3/3 | FINISH MISSION' },
      body: {
        vi: <>Sau khi chạy xong 12 mốc, bấm nút ở góc dưới bên phải để xem kết quả và báo chí.</>,
        en: <>After 12 epochs complete, click the bottom-right button to open Mission Review.</>,
      },
    },
  ],
  brief: [
    {
      target: 'brief-kpis',
      title: { vi: '1/2 | MỤC TIÊU & NGÂN SÁCH', en: '1/2 | OBJECTIVES & BUDGET' },
      body: {
        vi: (
          <>
            Xem các chỉ tiêu cần đạt và ngân sách ở đây. Bấm <span className="neon-green">ĐỔI MÀN CHƠI</span> nếu muốn chọn nhiệm vụ khác hoặc mở Sandbox.
          </>
        ),
        en: (
          <>
            Review mission targets and budget here. Click <span className="neon-green">CHANGE LEVEL</span> to pick another mission or launch Sandbox.
          </>
        ),
      },
    },
    {
      target: 'brief-start',
      title: { vi: '2/2 | VÀO XƯỞNG CHẾ TẠO [02.BUILD]', en: '2/2 | ENTER BUILD BAY [02.BUILD]' },
      body: {
        vi: (
          <>
            Bấm nút vào <span className="neon-green">Xưởng chế tạo</span> bên dưới để bắt đầu thiết kế vệ tinh!
          </>
        ),
        en: (
          <>
            Click the <span className="neon-green">Enter Build Bay</span> button below to start designing your spacecraft.
          </>
        ),
      },
    },
  ],
  review: [
    {
      target: 'review-impact',
      title: { vi: '1. BÁO CÁO HẬU QUẢ TRÁI ĐẤT', en: '1. EARTH IMPACT & TELEMETRY REPORT' },
      body: {
        vi: (
          <>
            Xem <span className="neon-green">tác động thực tế</span> của chuyến bay và{' '}
            <span className="neon-green">nguyên nhân gốc</span> trong hồ sơ kỹ thuật.
          </>
        ),
        en: (
          <>
            Inspect the <span className="neon-green">real-world outcome</span> of the flight and its{' '}
            <span className="neon-green">technical root cause</span> in the dossier.
          </>
        ),
      },
    },
    {
      target: 'review-confront',
      title: { vi: '2. CHẤT VẤN SẾP MỞ KHÓA NGÂN SÁCH', en: '2. DIRECTOR CONFRONTATION TO UNLOCK BUDGET' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">Thẻ bằng chứng khớp lỗi</span> để buộc Sếp mở khóa thêm{' '}
            <span className="neon-green">Ngân sách &amp; Thời gian</span>!
          </>
        ),
        en: (
          <>
            Present the <span className="neon-green">matching failure evidence card</span> to force Management to unlock extra{' '}
            <span className="neon-green">Budget &amp; Schedule</span>.
          </>
        ),
      },
    },
  ],
};

function renderStepContent(content, lang) {
  if (content == null) return null;
  if (React.isValidElement(content)) return content;
  if (typeof content === 'object') {
    const picked = lang === 'en' ? content.en || content.vi : content.vi || content.en;
    if (React.isValidElement(picked)) return picked;
    return tx(picked, lang);
  }
  return tx(content, lang);
}

function computeFocusBox(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 6;
  const topbarBottom = (document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0) + 4;
  const minY = Math.min(vh - 60, Math.max(6, topbarBottom));

  const boxX = Math.max(6, rect.left - pad);
  const boxY = Math.max(minY, rect.top - pad);
  const boxR = Math.min(vw - 6, rect.right + pad);
  const boxB = Math.min(vh - 6, rect.bottom + pad);
  return {
    x: boxX,
    y: boxY,
    w: Math.max(36, boxR - boxX),
    h: Math.max(36, boxB - boxY),
  };
}

export default function TutorialOverlay({ phase, stepIndex, onStepChange, onClose, lang: propLang }) {
  const {
    lang: gameLang,
    tutorialMode,
    completeTutorialToBrief,
    selectSlot,
    confirmSlotAndAdvance,
    enterInspect,
  } = useGame();

  const lang = propLang || gameLang || 'vi';

  const steps = TUTORIAL_STEPS[phase] || [];
  const safeIndex = Math.max(0, Math.min(steps.length - 1, stepIndex));
  const step = steps[safeIndex];
  const [box, setBox] = useState(null);
  const [dockPos, setDockPos] = useState('top-right');
  const scrolledTargetRef = useRef('');

  useLayoutEffect(() => {
    if (!step) return undefined;
    let raf = 0;

    const measure = () => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`);
      if (!el) {
        setBox(null);
        return;
      }
      if (scrolledTargetRef.current !== `${phase}:${step.target}:${safeIndex}`) {
        scrolledTargetRef.current = `${phase}:${step.target}:${safeIndex}`;
        const r0 = el.getBoundingClientRect();
        if (r0.top < 12 || r0.bottom > window.innerHeight - 12) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setBox(computeFocusBox(r));
      } else {
        setBox(null);
      }
    };

    measure();
    const tick = () => {
      measure();
      raf = requestAnimationFrame(tick);
    };
    const stopTimer = setTimeout(() => cancelAnimationFrame(raf), 600);
    raf = requestAnimationFrame(tick);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(stopTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [phase, step, safeIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!step) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;

  const handleNextStep = () => {
    if (phase === 'design') {
      if (safeIndex < SLOTS.length) {
        confirmSlotAndAdvance();
      } else {
        enterInspect();
      }
      return;
    }
    if (phase === 'launch') {
      if (safeIndex === 0) {
        onStepChange(1);
      } else {
        onClose();
      }
      return;
    }
    if (phase === 'life') {
      if (safeIndex + 1 < steps.length) {
        onStepChange(safeIndex + 1);
      } else if (tutorialMode) {
        completeTutorialToBrief();
      } else {
        onClose();
      }
      return;
    }
    if (safeIndex + 1 < steps.length) {
      onStepChange(safeIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (safeIndex <= 0) return;
    const prevIdx = safeIndex - 1;
    if (phase === 'design' && prevIdx < SLOTS.length) {
      selectSlot(SLOTS[prevIdx].id);
    } else {
      onStepChange(prevIdx);
    }
  };

  let nextBtnLabel = tr(lang, 'TIẾP THEO →', 'NEXT');
  if (phase === 'design') {
    if (safeIndex < SLOTS.length - 1) {
      const nextSlot = SLOTS[safeIndex + 1];
      const nextSlotLabel = tx(nextSlot.label, lang) || nextSlot.label;
      nextBtnLabel = tr(lang, `TIẾP: MỞ ${nextSlotLabel} →`, `NEXT: UNLOCK ${nextSlotLabel}`);
    } else if (safeIndex === SLOTS.length - 1) {
      nextBtnLabel = tr(lang, 'XONG 9 MỤC → XEM NÚT KIỂM ĐỊNH', 'DONE 9 SLOTS — SHOW INSPECT BTN');
    } else {
      nextBtnLabel = tr(lang, 'VÀO PHÒNG TÌM LỖI [03] →', 'GO TO INSPECTION [03]');
    }
  } else if (phase === 'launch') {
    if (safeIndex === 0) nextBtnLabel = tr(lang, 'TIẾP THEO →', 'NEXT');
    else if (safeIndex === 1) nextBtnLabel = tr(lang, 'BẮT ĐẦU PHÓNG', 'START LAUNCH');
    else nextBtnLabel = tr(lang, 'ĐÃ HIỂU', 'GOT IT');
  } else if (phase === 'life') {
    if (safeIndex + 1 < steps.length) nextBtnLabel = tr(lang, 'TIẾP THEO →', 'NEXT');
    else nextBtnLabel = tutorialMode ? tr(lang, 'QUAY VỀ CỐT TRUYỆN', 'RETURN TO CAMPAIGN') : tr(lang, 'ĐÃ HIỂU', 'GOT IT');
  } else if (safeIndex + 1 >= steps.length) {
    nextBtnLabel = tr(lang, 'ĐÃ HIỂU', 'GOT IT');
  }

  return (
    <div
      className="tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={tr(lang, 'Hướng dẫn Kỹ sư trưởng', 'Chief Engineer Guide')}
    >
      <svg className="tutorial-svg" viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none">
        <defs>
          <mask id="tut-spotlight-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {box && (
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {box && (
          <rect
            x="0"
            y="0"
            width={vw}
            height={vh}
            fill="rgba(4, 8, 12, 0.56)"
            mask="url(#tut-spotlight-mask)"
          />
        )}

        {box && (
          <g>
            <rect
              className="tutorial-focus-ring-neon"
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              rx="8"
            />
            <rect
              className="tutorial-focus-dash-neon"
              x={box.x - 4}
              y={box.y - 4}
              width={box.w + 8}
              height={box.h + 8}
              rx="10"
            />
          </g>
        )}
      </svg>

      {box && (
        <div
          className="tutorial-zone-tag neon"
          style={{ left: box.x, top: Math.max(46, box.y - 24) }}
        >
          {tr(lang, `[ VÙNG THAO TÁC ${safeIndex + 1}/${steps.length} ]`, `[ ACTIVE ZONE ${safeIndex + 1}/${steps.length} ]`)}
        </div>
      )}

      <aside
        className={`eng-tutorial-dock ${dockPos === 'top-right' ? 'pos-top-right' : 'pos-bottom-right'}`}
        role="region"
        aria-live="polite"
      >
        <div className="eng-tutorial-bubble">
          <div className="eng-tutorial-head">
            <span className="eng-tutorial-kicker">
              <span className="neon-dot" /> {tr(lang, 'KỸ SƯ TRƯỞNG //', 'CHIEF ENGINEER //')}{' '}
              {tutorialMode ? tr(lang, 'HƯỚNG DẪN SANDBOX', 'SANDBOX GUIDE') : tr(lang, 'HƯỚNG DẪN', 'GUIDE')}
            </span>
            <div className="eng-tutorial-meta">
              <button
                type="button"
                className="eng-skip-btn"
                onClick={() => setDockPos((p) => (p === 'top-right' ? 'bottom-right' : 'top-right'))}
                title={tr(lang, 'Chuyển vị trí hộp thoại Lên trên / Xuống dưới nếu vướng tầm nhìn', 'Move guide dock top or bottom if blocking view')}
              >
                {dockPos === 'top-right' ? tr(lang, 'XUỐNG DƯỚI', 'MOVE DOWN') : tr(lang, 'LÊN TRÊN', 'MOVE UP')}
              </button>
              {tutorialMode && (
                <button
                  type="button"
                  className="eng-skip-btn"
                  onClick={completeTutorialToBrief}
                  title={tr(lang, 'Bỏ qua màn hướng dẫn và vào thẳng Chọn Mission', 'Skip tutorial and open Mission Selection')}
                >
                  {tr(lang, 'CHỌN MISSION →', 'SELECT MISSION')}
                </button>
              )}
              <button
                type="button"
                className="eng-skip-btn"
                onClick={onClose}
                title={tr(lang, 'Tạm ẩn hộp thoại hướng dẫn (có thể bật lại ở thanh trên cùng)', 'Hide guide dialog (toggle anytime from the top bar)')}
              >
                {tr(lang, 'ẨN [ESC]', 'HIDE [ESC]')}
              </button>
            </div>
          </div>

          <div className="eng-tutorial-title">{renderStepContent(step.title, lang)}</div>
          <div className="eng-tutorial-body">{renderStepContent(step.body, lang)}</div>

          <div className="eng-tutorial-foot">
            <div className="tutorial-dots">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`tutorial-dot neon ${idx === safeIndex ? 'active' : ''}`}
                  aria-label={tr(lang, `Bước ${idx + 1}`, `Step ${idx + 1}`)}
                  onClick={() => {
                    if (phase === 'design' && idx < SLOTS.length) {
                      selectSlot(SLOTS[idx].id);
                    } else {
                      onStepChange(idx);
                    }
                  }}
                />
              ))}
            </div>

            <div className="row-wrap">
              {safeIndex > 0 && (
                <button type="button" className="btn small" onClick={handlePrevStep}>
                  {tr(lang, 'TRƯỚC', 'PREV')}
                </button>
              )}
              {phase === 'launch' && safeIndex === 0 && (
                <button type="button" className="btn small neon-btn" onClick={onClose}>
                  {tr(lang, 'BẮT ĐẦU PHÓNG', 'START LAUNCH')}
                </button>
              )}
              {phase === 'life' && safeIndex === 0 && (
                <button type="button" className="btn small neon-btn" onClick={onClose}>
                  {tr(lang, 'BẮT ĐẦU VẬN HÀNH', 'START OPERATIONS')}
                </button>
              )}
              <button type="button" className="btn small neon-btn" onClick={handleNextStep}>
                {nextBtnLabel}
              </button>
            </div>
          </div>
        </div>

        <div className="eng-tutorial-avatar-wrap" title={tr(lang, 'Kỹ sư trưởng hướng dẫn', 'Chief Engineer Guide')}>
          <div className="eng-tutorial-circle">
            <EngineerCircleAvatar />
          </div>
          <span className="eng-avatar-tag">CHIEF ENG.</span>
        </div>
      </aside>
    </div>
  );
}
