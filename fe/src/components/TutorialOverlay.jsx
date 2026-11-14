import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

export const TUTORIAL_STEPS = {
  home: [
    {
      target: 'home-hero',
      title: { vi: '1. MENU CHÍNH', en: '1. MAIN MENU' },
      body: {
        vi: 'Từ đây bạn có thể bắt đầu ngay, chọn màn chơi đã mở khóa, đọc nhanh cốt truyện hoặc chỉnh âm thanh và giao diện.',
        en: 'Start immediately, select unlocked missions, review backstory, or adjust audio and theme settings.',
      },
    },
    {
      target: 'home-start',
      title: { vi: '2. BẮT ĐẦU HOẶC CHỌN MÀN', en: '2. START OR SELECT MISSION' },
      body: {
        vi: 'Nhấn BẮT ĐẦU CHƠI để vào nhiệm vụ hiện tại, hoặc vào CHỌN MÀN CHƠI để xem tiến trình mở khóa từng cấp độ.',
        en: 'Click START MISSION to jump into current flight, or view unlocked levels in the mission roster.',
      },
    },
  ],
  brief: [
    {
      target: 'brief-kpis',
      title: { vi: '1. NẮM RÕ NGÂN SÁCH & HẠN CHÓT', en: '1. REVIEW BUDGET & DEADLINE' },
      body: {
        vi: 'Kiểm tra ngân sách tối đa và hạn chót trước khi vào xưởng. Vượt giới hạn này sẽ bị trừ thời gian kiểm định trước khi phóng.',
        en: 'Check your budget cap and deadline before entering the workshop. Overrunning limits penalizes pre-flight inspection time.',
      },
    },
    {
      target: 'brief-start',
      title: { vi: '2. VÀO XƯỞNG LẮP RÁP', en: '2. ENTER ASSEMBLY HANGAR' },
      body: {
        vi: 'Nhấn nút này để mở xưởng lắp ghép vệ tinh 3D và chọn từng linh kiện phù hợp.',
        en: 'Click this button to open the 3D satellite assembly bay and configure components.',
      },
    },
  ],
  design: [
    {
      target: 'build-slots',
      title: { vi: '1. KHO LINH KIỆN & CẢNH BÁO', en: '1. COMPONENT BAYS & STATUS' },
      body: {
        vi: 'Chuyển qua các hạng mục linh kiện để lắp ghép. Linh kiện giá rẻ chưa qua kiểm định tiết kiệm chi phí nhưng dễ gặp sự cố trên quỹ đạo.',
        en: 'Navigate through component categories to assemble the stack. Unverified low-cost parts save budget but carry high risk on orbit.',
      },
    },
    {
      target: 'build-hangar',
      title: { vi: '2. BÀN XOAY LẮP RÁP 3D & QUỸ ĐẠO', en: '2. 3D WORKSHOP & LIVE ORBIT' },
      body: {
        vi: 'Mô hình vệ tinh và đồ thị quỹ đạo tự cập nhật tức thì theo từng linh kiện bạn gắn. Kéo chuột để xoay, cuộn để phóng to thu nhỏ, kiểm tra gập mở cánh pin.',
        en: 'The 3D model and trajectory scope update dynamically with each selected part. Drag to orbit, scroll to zoom, and toggle solar array deployment.',
      },
    },
    {
      target: 'build-telemetry',
      title: { vi: '3. THEO DÕI CÂN BẰNG HỆ THỐNG', en: '3. SYSTEM HEALTH TELEMETRY' },
      body: {
        vi: 'Quan sát 4 thanh chỉ số năng lượng, khối lượng, liên lạc và độ bền cùng đồng hồ tiến độ để tối ưu hóa thiết kế.',
        en: 'Monitor power, mass, signal, and integrity bars alongside budget and schedule dials to balance system tradeoffs.',
      },
    },
    {
      target: 'build-next',
      title: { vi: '4. SANG PHÒNG KIỂM ĐỊNH', en: '4. PROCEED TO INSPECTION' },
      body: {
        vi: 'Mọi cấu hình đều được phép mang đi kiểm định và phóng thử. Nhấn nút này để chuyển sang giai đoạn quét lỗi.',
        en: 'Every design can proceed to testing and launch. Click this button to enter the pre-flight diagnostic chamber.',
      },
    },
  ],
  inspect: [
    {
      target: 'inspect-timer',
      title: { vi: '1. ĐỒNG HỒ ĐẾM NGƯỢC TIỀN PHÓNG', en: '1. PRE-FLIGHT COUNTDOWN TIMER' },
      body: {
        vi: 'Bạn có thời gian giới hạn để tìm lỗi ẩn trước khi tên lửa cất cánh. Vượt tiến độ chế tạo sẽ làm đồng hồ này ngắn đi.',
        en: 'You have limited time to uncover latent defects before liftoff. Manufacturing delays will reduce this inspection window.',
      },
    },
    {
      target: 'inspect-stage',
      title: { vi: '2. ĐÈN SOI QUÉT TÌM LỖI ẨN', en: '2. X-RAY SCANNER DIAGNOSTICS' },
      body: {
        vi: 'Rê chuột quanh mô hình tàu để quét rọi. Khi phát hiện điểm dị thường phát sáng, nhấp trực tiếp lên điểm đó để sửa chữa ngay.',
        en: 'Sweep the diagnostic spotlight across the vehicle. When anomalies shimmer, click directly on the highlighted point to patch it.',
      },
    },
    {
      target: 'inspect-checklist',
      title: { vi: '3. DANH MỤC KIỂM TRA & ĐỒNG HỒ ĐO', en: '3. INSPECTION CHECKLIST & METERS' },
      body: {
        vi: 'Khi đèn quét tới gần điểm lỗi, dao động ký bên dưới sẽ rung mạnh và mục lỗi hiển thị trên danh mục. Bạn cũng có thể bấm nút sửa tại đây.',
        en: 'When sweeping near a fault, telemetry meters spike and the issue appears on your checklist. You can also patch faults directly from this list.',
      },
    },
    {
      target: 'inspect-finish',
      title: { vi: '4. CHUYỂN RA BỆ PHÓNG', en: '4. ROLLOUT TO LAUNCH PAD' },
      body: {
        vi: 'Sau khi kiểm tra hoặc khắc phục xong các lỗi lắp ráp, nhấn nút này để bắt đầu phóng tên lửa.',
        en: 'Once diagnostics and patches are complete, press this button to initiate launch sequences.',
      },
    },
  ],
  launch: [
    {
      target: 'launch-canvas',
      title: { vi: '1. MÔ PHỎNG PHÓNG TÊN LỬA 3D', en: '1. 3D ASCENT SIMULATION' },
      body: {
        vi: 'Quan sát tên lửa rời bệ, vượt vùng áp suất cực đại, tách tầng và bung khoang tải. Dùng các nút tốc độ ở góc dưới để điều chỉnh thời gian.',
        en: 'Watch your vehicle clear the pad, endure maximum dynamic pressure, separate stages, and deploy payload fairings. Use speed controls below to adjust time.',
      },
    },
    {
      target: 'launch-sequencer',
      title: { vi: '2. TRÌNH TỰ PHÓNG TÊN LỬA', en: '2. ASCENT SEQUENCER' },
      body: {
        vi: 'Theo dõi từng mốc sự kiện bay. Nếu vượt tải trọng fairing hoặc còn lỗi lắp ráp chưa sửa, chuyến bay sẽ gặp sự cố kèm hồ sơ chi tiết.',
        en: 'Track each flight milestone in sequence. If payload limits are exceeded or unresolved defects persist, mission aborts with root cause dossier.',
      },
    },
  ],
  life: [
    {
      target: 'orbit-canvas',
      title: { vi: '1. GIÁM SÁT QUỸ ĐẠO', en: '1. ORBITAL SURVEILLANCE' },
      body: {
        vi: 'Theo dõi vệ tinh vận hành qua các mốc thời gian. Nếu linh kiện không đủ chịu bức xạ hoặc cạn điện vùng tối, mô phỏng sẽ dừng tại mốc sự cố.',
        en: 'Monitor your satellite operating across mission timeline milestones. Inadequate radiation shielding or depleted eclipse batteries will halt simulation.',
      },
    },
    {
      target: 'orbit-telemetry',
      title: { vi: '2. DỮ LIỆU ĐO XA & BẰNG CHỨNG', en: '2. TELEMETRY & CAPTURED EVIDENCE' },
      body: {
        vi: 'Xem mức pin, liều bức xạ tích lũy, đường truyền trạm mặt đất và hình ảnh thu được từ thiết bị quan sát.',
        en: 'Inspect battery charge, accumulated radiation dose, downlink connection quality, and scientific evidence captured by payloads.',
      },
    },
    {
      target: 'orbit-next',
      title: { vi: '3. TRÌNH BẰNG CHỨNG CHO GIÁM ĐỐC', en: '3. PRESENT DOSSIER TO DIRECTOR' },
      body: {
        vi: 'Khi hoàn tất các mốc vòng đời hoặc khi vệ tinh gặp sự cố, nhấn nút này để bước vào phiên tổng kết nhiệm vụ.',
        en: 'When the operational lifetime finishes or upon spacecraft anomaly, click here to enter mission debrief and director audit.',
      },
    },
  ],
  review: [
    {
      target: 'review-impact',
      title: { vi: '1. BÁO CÁO TÁC ĐỘNG NHÂN LOẠI', en: '1. EARTH IMPACT REPORT' },
      body: {
        vi: 'Đọc câu chuyện tác động trực tiếp trên Trái Đất từ kết quả phóng và vận hành vệ tinh, từ diện tích rừng, lưới điện đến an ninh lương thực.',
        en: 'Read the direct real-world consequences of your flight outcome, spanning wildfire protection, electrical grids, and climate food security.',
      },
    },
    {
      target: 'review-dossier',
      title: { vi: '2. HỒ SƠ NGUYÊN NHÂN GỐC', en: '2. ROOT CAUSE DOSSIER' },
      body: {
        vi: 'Kiểm tra chính xác lý do nhiệm vụ thành công hoặc thất bại, như phơi nhiễm bức xạ, sụt áp nguồn điện hay độ ổn định bám mục tiêu.',
        en: 'Analyze the precise root causes behind mission success or failure, including radiation tolerance, power deficits, and pointing stability.',
      },
    },
    {
      target: 'review-confront',
      title: { vi: '3. ĐỐI CHẤT GIÁM ĐỐC', en: '3. DIRECTOR AUDIT' },
      body: {
        vi: 'Nếu tàu hỏng do bị cắt giảm ngân sách hoặc ép tiến độ, hãy chọn đúng hồ sơ chứng cứ để chất vấn và mở khóa thêm kinh phí.',
        en: 'If the spacecraft failed due to budget caps or tight schedules, present matching evidence to confront management and unlock additional funding.',
      },
    },
    {
      target: 'review-actions',
      title: { vi: '4. ĐIỀU HƯỚNG NHIỆM VỤ', en: '4. MISSION NAVIGATION' },
      body: {
        vi: 'Sử dụng ngân sách vừa mở khóa quay lại xưởng chế tạo để nâng cấp linh kiện và phóng lại, hoặc chọn nhiệm vụ khác.',
        en: 'Apply unlocked overrides to upgrade flight hardware in the workshop for another launch, or transition to a new mission.',
      },
    },
  ],
  ops: [
    {
      target: 'ops-controls',
      title: { vi: 'VẬN HÀNH QUỸ ĐẠO THỦ CÔNG', en: 'MANUAL ORBIT OPERATIONS' },
      body: {
        vi: 'Điều khiển góc định hướng và xung động cơ đẩy theo thời gian thực để tối ưu hóa liên lạc với trạm mặt đất.',
        en: 'Command attitude orientation angles and reaction thruster pulses in real time to maintain ground station link.',
      },
    },
  ],
  debrief: [
    {
      target: 'ops-controls',
      title: { vi: 'PHÂN TÍCH TỔNG QUAN', en: 'MISSION DEBRIEF & PARETO' },
      body: {
        vi: 'Xem đánh giá điểm số và tham khảo các cấu hình tối ưu Pareto cho nhiệm vụ hiện tại.',
        en: 'Review operational performance metrics and inspect Pareto-optimal design recommendations for this mission.',
      },
    },
  ],
};

function computeOverlayGeometry(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 8;
  const topbarBottom = (document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0) + 4;
  const minY = Math.min(vh - 80, Math.max(8, topbarBottom));

  const boxX = Math.max(6, rect.left - pad);
  const boxY = Math.max(minY, rect.top - pad);
  const boxR = Math.min(vw - 6, rect.right + pad);
  const boxB = Math.min(vh - 6, rect.bottom + pad);
  const box = {
    x: boxX,
    y: boxY,
    w: Math.max(40, boxR - boxX),
    h: Math.max(40, boxB - boxY),
  };

  const cardW = Math.min(300, vw - 28);
  const cardH = 200;
  const gap = 30;

  const spaceRight = vw - (box.x + box.w);
  const spaceLeft = box.x;
  const spaceBottom = vh - (box.y + box.h);
  const spaceTop = box.y - minY;

  let side = 'right';
  if (spaceRight >= cardW + gap) side = 'right';
  else if (spaceLeft >= cardW + gap) side = 'left';
  else if (spaceBottom >= cardH + gap) side = 'bottom';
  else if (spaceTop >= cardH + gap) side = 'top';
  else {
    const ranked = [
      ['right', spaceRight],
      ['left', spaceLeft],
      ['bottom', spaceBottom],
      ['top', spaceTop],
    ].sort((a, b) => b[1] - a[1]);
    side = ranked[0][0];
  }

  let cardX = box.x;
  let cardY = box.y;
  if (side === 'right') {
    cardX = box.x + box.w + gap;
    cardY = box.y + Math.min(box.h * 0.45, 160) - cardH / 2;
  } else if (side === 'left') {
    cardX = box.x - cardW - gap;
    cardY = box.y + Math.min(box.h * 0.45, 160) - cardH / 2;
  } else if (side === 'bottom') {
    cardX = box.x + box.w / 2 - cardW / 2;
    cardY = box.y + box.h + gap;
  } else {
    cardX = box.x + box.w / 2 - cardW / 2;
    cardY = box.y - cardH - gap;
  }

  cardX = Math.max(12, Math.min(vw - cardW - 12, cardX));
  cardY = Math.max(minY + 4, Math.min(vh - cardH - 12, cardY));

  let sx = cardX + cardW / 2;
  let sy = cardY + cardH / 2;
  let tx = box.x + box.w / 2;
  let ty = box.y + box.h / 2;

  if (cardX >= box.x + box.w + 8) {
    sx = cardX;
    sy = cardY + cardH * 0.42;
    tx = box.x + box.w + 4;
    ty = Math.max(box.y + 24, Math.min(box.y + box.h - 24, sy));
  } else if (cardX + cardW <= box.x - 8) {
    sx = cardX + cardW;
    sy = cardY + cardH * 0.42;
    tx = box.x - 4;
    ty = Math.max(box.y + 24, Math.min(box.y + box.h - 24, sy));
  } else if (cardY >= box.y + box.h + 8) {
    sx = cardX + cardW / 2;
    sy = cardY;
    tx = Math.max(box.x + 28, Math.min(box.x + box.w - 28, sx));
    ty = box.y + box.h + 4;
  } else if (cardY + cardH <= box.y - 8) {
    sx = cardX + cardW / 2;
    sy = cardY + cardH;
    tx = Math.max(box.x + 28, Math.min(box.x + box.w - 28, sx));
    ty = box.y - 4;
  } else {
    sx = cardX + cardW / 2;
    sy = cardY;
    tx = box.x + box.w / 2;
    ty = box.y + 38;
  }

  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy);
  const bend = Math.min(28, dist * 0.2);
  const cx = (sx + tx) / 2 - (dy / Math.max(1, dist)) * bend;
  const cy = (sy + ty) / 2 + (dx / Math.max(1, dist)) * bend;

  return { box, cardX, cardY, cardW, sx, sy, cx, cy, tx, ty };
}

export default function TutorialOverlay({ phase, stepIndex, onStepChange, onClose, lang: propLang }) {
  const { lang: gameLang } = useGame();
  const lang = propLang || gameLang || 'vi';

  const steps = TUTORIAL_STEPS[phase] || [];
  const safeIndex = Math.max(0, Math.min(steps.length - 1, stepIndex));
  const step = steps[safeIndex];
  const [geom, setGeom] = useState(null);
  const scrolledTargetRef = useRef('');

  useLayoutEffect(() => {
    if (!step) return undefined;
    let raf = 0;

    const measure = () => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`);
      if (!el) {
        setGeom(null);
        return;
      }
      if (scrolledTargetRef.current !== `${phase}:${step.target}`) {
        scrolledTargetRef.current = `${phase}:${step.target}`;
        const r0 = el.getBoundingClientRect();
        if (r0.top < 12 || r0.bottom > window.innerHeight - 12) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setGeom(computeOverlayGeometry(r));
      } else {
        setGeom(null);
      }
    };

    measure();
    const tick = () => {
      measure();
      raf = requestAnimationFrame(tick);
    };
    const stopTimer = setTimeout(() => cancelAnimationFrame(raf), 420);
    raf = requestAnimationFrame(tick);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(stopTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [phase, step]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (safeIndex + 1 >= steps.length) onClose();
        else onStepChange(safeIndex + 1);
      } else if (e.key === 'ArrowLeft' && safeIndex > 0) {
        e.preventDefault();
        onStepChange(safeIndex - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [safeIndex, steps.length, onClose, onStepChange]);

  if (!step) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
  const cardStyle = geom
    ? { left: geom.cardX, top: geom.cardY, width: geom.cardW }
    : { left: Math.max(16, (vw - 360) / 2), top: Math.max(72, vh * 0.28), width: Math.min(360, vw - 32) };

  return (
    <div
      className="tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={tr(lang, 'Hướng dẫn thao tác', 'Mission tutorial')}
    >
      <svg className="tutorial-svg" viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none">
        <defs>
          <mask id="tut-spotlight-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {geom && (
              <rect
                x={geom.box.x}
                y={geom.box.y}
                width={geom.box.w}
                height={geom.box.h}
                rx="6"
                fill="black"
              />
            )}
          </mask>
          <marker
            id="tut-arrowhead"
            viewBox="0 0 12 12"
            refX="9"
            refY="6"
            markerWidth="9"
            markerHeight="9"
            orient="auto-start-reverse"
          >
            <path d="M 1 1 L 11 6 L 1 11 z" fill="#ffc44d" />
          </marker>
        </defs>

        <rect
          x="0"
          y="0"
          width={vw}
          height={vh}
          fill="rgba(7, 9, 12, 0.78)"
          mask="url(#tut-spotlight-mask)"
        />

        {geom && (
          <g>
            <rect
              className="tutorial-focus-ring"
              x={geom.box.x}
              y={geom.box.y}
              width={geom.box.w}
              height={geom.box.h}
              rx="6"
            />
            <rect
              className="tutorial-focus-dash"
              x={geom.box.x - 4}
              y={geom.box.y - 4}
              width={geom.box.w + 8}
              height={geom.box.h + 8}
              rx="8"
            />
            <path
              className="tutorial-arrow-glow"
              d={`M ${geom.sx} ${geom.sy} Q ${geom.cx} ${geom.cy} ${geom.tx} ${geom.ty}`}
            />
            <path
              className="tutorial-arrow-path"
              d={`M ${geom.sx} ${geom.sy} Q ${geom.cx} ${geom.cy} ${geom.tx} ${geom.ty}`}
              markerEnd="url(#tut-arrowhead)"
            />
            <circle cx={geom.sx} cy={geom.sy} r="4.5" fill="#ffc44d" stroke="#181c20" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {geom && (
        <div
          className="tutorial-zone-tag"
          style={{ left: geom.box.x, top: Math.max(8, geom.box.y - 24) }}
        >
          {tr(lang, `MỤC ${safeIndex + 1}/${steps.length}`, `STEP ${safeIndex + 1}/${steps.length}`)}
        </div>
      )}

      <div className="tutorial-card" style={cardStyle}>
        <div className="tutorial-card-head">
          <span className="tutorial-badge">
            {tr(lang, 'CẨM NANG HƯỚNG DẪN', 'FIELD MANUAL')} // {phase.toUpperCase()}
          </span>
          <button className="btn small" onClick={onClose}>
            {tr(lang, 'ĐÓNG', 'CLOSE')}
          </button>
        </div>

        <h3 className="tutorial-card-title">{tx(step.title, lang)}</h3>
        <p className="tutorial-card-body">{tx(step.body, lang)}</p>

        <div className="tutorial-card-foot">
          <div className="tutorial-dots">
            {steps.map((_, idx) => (
              <button
                key={idx}
                className={`tutorial-dot ${idx === safeIndex ? 'active' : ''}`}
                aria-label={tr(lang, `Bước ${idx + 1}`, `Step ${idx + 1}`)}
                onClick={() => onStepChange(idx)}
              />
            ))}
          </div>
          <div className="row-wrap">
            {safeIndex > 0 && (
              <button className="btn small" onClick={() => onStepChange(safeIndex - 1)}>
                {tr(lang, '← QUAY LẠI', '← BACK')}
              </button>
            )}
            <button
              className="btn small primary"
              onClick={() => (safeIndex + 1 >= steps.length ? onClose() : onStepChange(safeIndex + 1))}
            >
              {safeIndex + 1 >= steps.length
                ? tr(lang, 'XONG ✓', 'DONE ✓')
                : tr(lang, 'TIẾP THEO →', 'NEXT →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
