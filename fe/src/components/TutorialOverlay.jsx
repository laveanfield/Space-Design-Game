import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * TutorialOverlay -- Lop phu huong dan tung man hinh (phase):
 * Khoanh vung (spotlight cutout) + ve mui ten SVG chi thang vao vung can thao tac.
 */

export const TUTORIAL_STEPS = {
  brief: [
    {
      target: 'brief-missions',
      title: '1. CHỌN NHIỆM VỤ (MISSIONS)',
      body: 'Chọn một chiến dịch ở cột trái (từ Level 1 tới các nhiệm vụ khó hơn). Mỗi màn sẽ có điều kiện quỹ đạo và lỗi vật lý riêng.',
    },
    {
      target: 'brief-kpis',
      title: '2. ĐỌC GIỚI HẠN NGÂN SÁCH & HẠN CHÓT',
      body: 'Kiểm tra BUDGET LIMIT và DEADLINE. Vượt ngân sách hoặc trễ tiến độ đều bị Sếp trừ thời gian soi lỗi trước giờ phóng!',
    },
    {
      target: 'brief-start',
      title: '3. VÀO XƯỞNG CHẾ TẠO [02]',
      body: 'Nhấn nút này để mở phòng lắp ráp vệ tinh 3D và bắt đầu chọn linh kiện.',
    },
  ],
  design: [
    {
      target: 'build-slots',
      title: '1. KHO LINH KIỆN & TEM CẢNH BÁO',
      body: 'Chuyển qua các tab (ORBIT, PAYLOAD, BUS, SOLAR, BATTERY, COMM, OBC, ADCS, LAUNCHER) để lắp ghép. Thẻ viền vàng [CHEAP/UNVERIFIED] rẻ nhưng dễ hỏng trên quỹ đạo!',
    },
    {
      target: 'build-hangar',
      title: '2. BÀN XOAY LẮP RÁP 3D & QUỸ ĐẠO LIVE',
      body: 'Vệ tinh 3D và đồ thị quỹ đạo phía dưới tự cập nhật tức thì theo từng món đồ bạn gắn. Kéo chuột để xoay, cuộn để zoom, bấm GẬP/MỞ CÁNH để kiểm tra.',
    },
    {
      target: 'build-telemetry',
      title: '3. THEO DÕI 4 THANH SINH TỒN & SẾP',
      body: 'Quan sát 4 thanh POWER, MASS, SIGNAL, INTEGRITY (10 nấc) cùng đồng hồ ngân sách/tiến độ để cân bằng chi phí và độ bền.',
    },
    {
      target: 'build-next',
      title: '4. SANG PHÒNG KIỂM ĐỊNH [GO TO INSPECTION]',
      body: 'Triết lý LAUNCH ANYTHING: mọi cấu hình đều được phép mang đi kiểm định & phóng thử. Bấm nút này để sang pha soi X-Ray!',
    },
  ],
  inspect: [
    {
      target: 'inspect-timer',
      title: '1. ĐỒNG HỒ ĐẾM NGƯỢC TIỀN PHÓNG',
      body: 'Bạn có thời gian giới hạn để tìm lỗi ẩn trước khi tên lửa cất cánh (chế tạo trễ deadline sẽ làm đồng hồ này ngắn đi!).',
    },
    {
      target: 'inspect-stage',
      title: '2. ĐÈN SOI X-RAY TÌM 3 LỖI ẨN',
      body: 'Rê chuột quanh mô hình tàu để rọi đèn X-Ray. Khi thấy đốm dị thường phát sáng, CLICK TRỰC TIẾP lên điểm đó để khắc phục ngay!',
    },
    {
      target: 'inspect-checklist',
      title: '3. BÌA HỒ SƠ CHECKLIST & ĐỒNG HỒ ĐO',
      body: 'Khi đèn quét tới gần điểm lỗi, đồng hồ đo nhiễu bên dưới sẽ rung mạnh và mục lỗi hiện lên bảng checklist (bạn cũng có thể bấm PATCH tại đây).',
    },
    {
      target: 'inspect-finish',
      title: '4. CHUYỂN RA BỆ PHÓNG [FINISH INSPECTION]',
      body: 'Sau khi kiểm tra hoặc vá lỗi xong, nhấn nút này để bắt đầu phóng tên lửa 3D.',
    },
  ],
  launch: [
    {
      target: 'launch-canvas',
      title: '1. MÔ PHỎNG PHÓNG TÊN LỬA 3D',
      body: 'Quan sát tên lửa rời bệ, vượt vùng áp suất Max-Q, tách tầng và bung fairing. Dùng các nút 4x / 12x / 30x ở góc dưới để tua nhanh.',
    },
    {
      target: 'launch-sequencer',
      title: '2. BẢNG TRÌNH TỰ PHÓNG (ASCENT SEQUENCER)',
      body: 'Theo dõi từng mốc sự kiện bay. Nếu vượt tải fairing hoặc còn lỗi lắp ráp chưa sửa, tên lửa sẽ nổ tại Max-Q kèm hồ sơ nguyên nhân!',
    },
  ],
  life: [
    {
      target: 'orbit-canvas',
      title: '1. GIÁM SÁT QUỸ ĐẠO 12 THÁNG',
      body: 'Theo dõi vệ tinh vận hành qua 12 mốc. Nếu chọn chip OBC yếu bức xạ hay thiếu điện vùng tối, hệ thống sẽ dừng ở mốc sự cố (SIMULATION HALTED).',
    },
    {
      target: 'orbit-telemetry',
      title: '2. TELEMETRY & BẰNG CHỨNG ẢNH CHỤP',
      body: 'Xem mức pin (SOC), liều bức xạ tích lũy (RADIATION DOSE), đường truyền downlink và các bức ảnh chụp được từ payload.',
    },
    {
      target: 'orbit-next',
      title: '3. TRÌNH BẰNG CHỨNG CHO SẾP [06]',
      body: 'Khi hết 12 mốc hoặc khi tàu gặp sự cố, nhấn nút này để mở hồ sơ chất vấn Sếp kế toán.',
    },
  ],
  review: [
    {
      target: 'review-impact',
      title: '1. BÁO CÁO HẬU QUẢ NHÂN LOẠI',
      body: 'Đọc câu chuyện hậu quả trực tiếp trên Trái Đất từ kết quả phóng và vận hành vệ tinh ở màn này (diện tích rừng, lưới điện, khí hậu...).',
    },
    {
      target: 'review-dossier',
      title: '2. HỒ SƠ NGUYÊN NHÂN GỐC (DOSSIER)',
      body: 'Kiểm tra chính xác lý do nhiệm vụ thất bại hoặc thành công (bức xạ, thiếu nguồn, thiếu dữ liệu, sai góc chụp...).',
    },
    {
      target: 'review-confront',
      title: '3. CHẤT VẤN SẾP (BOSS CONFRONTATION)',
      body: 'Nếu tàu hỏng do bị Sếp ép ngân sách/deadline, chọn đúng thẻ chứng cứ khớp nguyên nhân rồi bấm TẤN CÔNG để mở khóa thêm tiền & thời gian!',
    },
    {
      target: 'review-actions',
      title: '4. QUAY VỀ XƯỞNG NÂNG CẤP HOẶC ĐỔI MÀN',
      body: 'Sử dụng ngân sách vừa mở khóa quay lại Xưởng Chế Tạo để thay linh kiện xịn hơn và phóng lại.',
    },
  ],
  ops: [
    {
      target: 'ops-controls',
      title: 'VẬN HÀNH TAY (MANUAL OPS)',
      body: 'Điều khiển góc hướng (ADCS) và xung đẩy (RCS) theo thời gian thực để tối ưu liên lạc trạm mặt đất.',
    },
  ],
  debrief: [
    {
      target: 'ops-controls',
      title: 'PHÂN TÍCH TỔNG QUAN',
      body: 'Xem đồ thị đánh đổi và gợi ý tối ưu thiết kế cho nhiệm vụ hiện tại.',
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

  // Pick placement side with enough room outside the spotlight box
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
    // Pick direction with largest clearance so arrow stays outside the card
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

  // Connect nearest edge of card to nearest edge of spotlight box so arrow never hides behind card
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
    // Card overlaps box horizontally (fallback on ultra-tall zone): point from top corner of card up to spotlight title area
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

export default function TutorialOverlay({ phase, stepIndex, onStepChange, onClose }) {
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
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Hướng dẫn pha chơi">
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

        {/* Backdrop with spotlight hole */}
        <rect
          x="0"
          y="0"
          width={vw}
          height={vh}
          fill="rgba(7, 9, 12, 0.78)"
          mask="url(#tut-spotlight-mask)"
        />

        {/* Highlighted zone + arrow */}
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
          [ KHOANH VÙNG {safeIndex + 1}/{steps.length} ]
        </div>
      )}

      <div className="tutorial-card" style={cardStyle}>
        <div className="tutorial-card-head">
          <span className="tutorial-badge">FIELD MANUAL // {phase.toUpperCase()}</span>
          <button className="btn small" onClick={onClose}>
            ĐÓNG [ESC]
          </button>
        </div>

        <h3 className="tutorial-card-title">{step.title}</h3>
        <p className="tutorial-card-body">{step.body}</p>

        <div className="tutorial-card-foot">
          <div className="tutorial-dots">
            {steps.map((_, idx) => (
              <button
                key={idx}
                className={`tutorial-dot ${idx === safeIndex ? 'active' : ''}`}
                aria-label={`Bước ${idx + 1}`}
                onClick={() => onStepChange(idx)}
              />
            ))}
          </div>
          <div className="row-wrap">
            {safeIndex > 0 && (
              <button className="btn small" onClick={() => onStepChange(safeIndex - 1)}>
                ← TRƯỚC
              </button>
            )}
            <button
              className="btn small primary"
              onClick={() => (safeIndex + 1 >= steps.length ? onClose() : onStepChange(safeIndex + 1))}
            >
              {safeIndex + 1 >= steps.length ? 'ĐÃ HIỂU ✓' : 'TIẾP THEO →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
