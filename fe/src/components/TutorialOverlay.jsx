import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EngineerCircleAvatar } from '../story/Portraits';
import { SLOTS, getPartInsight } from '../core/gameMachine';
import { useGame } from '../core/GameContext';

/**
 * TutorialOverlay — Hướng dẫn Kỹ sư trưởng:
 * 1. Khoanh vùng chính xác vị trí cần quan tâm + làm tối nhẹ vùng xung quanh (Spotlight Dimming) nhưng vẫn cho click tự do.
 * 2. Đặt Hình tròn Kỹ sư trưởng + Ô hướng dẫn ở GÓC TRÊN PHẢI (có thể đổi vị trí) để KHÔNG che các nút bấm góc dưới phải.
 * 3. Ở màn 02.BUILD: hướng dẫn tuần tự từng mục 1..9, hiển thị rõ Dùng ở đâu / Lợi ích (+) / Tác hại (-) của lựa chọn hiện tại,
 *    chỉ qua mục tiếp theo khi người chơi nhấn nút [TIẾP THEO].
 * 4. Ở màn 03.INSPECT: hướng dẫn cặn kẽ 3 nhiệm vụ (Audio xì ga, X-Ray mesh trắng thưa ở Full Stack / Payload Focus, Kéo góc Camera về 0°).
 * 5. Ở màn 04.LAUNCH_3D & 05.ORBIT_12M: tạm dừng (pause) game khi đang giới thiệu, bấm [BẮT ĐẦU ▶] mới chạy.
 */

export const TUTORIAL_STEPS = {
  design: [
    {
      target: 'build-slots',
      slotId: 'orbit',
      title: 'BƯỚC 1/10 • CHỌN QUỸ ĐẠO BAY (1.ORBIT)',
      body: (
        <>
          Bấm thử từng mức <span className="neon-green">1.ORBIT (Quỹ đạo)</span> ở cột trái để xem{' '}
          <span className="neon-green">Dùng ở đâu, Lợi ích &amp; Tác hại</span>. Khi ưng ý, bấm{' '}
          <span className="neon-green">[TIẾP THEO →]</span> để mở hệ phóng!
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'launch',
      title: 'BƯỚC 2/10 • CHỌN TÊN LỬA ĐẨY (2.LAUNCH)',
      body: (
        <>
          Chọn <span className="neon-green">2.LAUNCH (Tên lửa &amp; Bãi phóng)</span>. Chú ý{' '}
          <span className="neon-green">Sức nâng (CAP kg)</span> và{' '}
          <span className="neon-green">Đường kính mũi (FAIR m)</span> rồi bấm{' '}
          <span className="neon-green">[TIẾP THEO →]</span>!
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'bus',
      title: 'BƯỚC 3/10 • CHỌN KHUNG VỆ TINH (3.BUS)',
      body: (
        <>
          Chọn <span className="neon-green">3.BUS (Khung chịu lực chính)</span>. Khung quyết định{' '}
          <span className="neon-green">Trần khối lượng (≤ kg)</span> và{' '}
          <span className="neon-green">Công suất cấp cho thiết bị (W)</span>.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'instruments',
      title: 'BƯỚC 4/10 • CHỌN CAMERA / CẢM BIẾN (4.INSTR)',
      body: (
        <>
          Chọn <span className="neon-green">4.INSTR (Thiết bị quan sát)</span>. Lưu ý camera{' '}
          <span className="neon-green">giá rẻ (Basic)</span> nhẹ nhưng dễ lệch góc lắp ráp; camera lớn cần{' '}
          <span className="neon-green">nhiều điện &amp; băng thông</span>!
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'power',
      title: 'BƯỚC 5/10 • CHỌN CÁNH PIN MẶT TRỜI (5.POWER)',
      body: (
        <>
          Chọn <span className="neon-green">5.POWER (Pin Mặt Trời)</span> để phát điện nuôi tàu khi có nắng.{' '}
          <span className="neon-green">Công suất phát (GEN W)</span> phải lớn hơn tổng tải tiêu thụ!
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'battery',
      title: 'BƯỚC 6/10 • CHỌN PIN DỰ TRỮ VÙNG TỐI (6.BATT)',
      body: (
        <>
          Chọn <span className="neon-green">6.BATT (Ắc-quy Li-ion)</span> để nuôi vệ tinh khi bay vào{' '}
          <span className="neon-green">bóng tối Trái Đất (Eclipse)</span>, tránh sập nguồn!
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'comm',
      title: 'BƯỚC 7/10 • CHỌN ĂNG-TEN TRUYỀN TIN (7.COMM)',
      body: (
        <>
          Chọn <span className="neon-green">7.COMM (Ăng-ten)</span>. Tốc độ{' '}
          <span className="neon-green">Downlink (Mbps)</span> phải đủ nhanh để truyền hết lượng GB ảnh chụp mỗi ngày!
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'obc',
      title: 'BƯỚC 8/10 • CHỌN MÁY TÍNH ĐIỀU KHIỂN (8.OBC)',
      body: (
        <>
          Chọn <span className="neon-green">8.OBC (Máy tính trung tâm)</span>. Độ chịu bức xạ{' '}
          <span className="neon-green">RAD (krad)</span> phải cao hơn bức xạ quỹ đạo để không bị cháy chip!
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'adcs',
      title: 'BƯỚC 9/10 • CHỌN HỆ ĐIỀU HƯỚNG (9.ADCS)',
      body: (
        <>
          Chọn <span className="neon-green">9.ADCS (Ổn định tư thế)</span>. Sai số góc{' '}
          <span className="neon-green">PT (±°)</span> phải nhỏ hơn yêu cầu của Camera để ảnh chụp không bị nhòe!
        </>
      ),
    },
    {
      target: 'build-next',
      title: 'BƯỚC 10/10 • HOÀN TẤT LẮP RÁP → SANG TÌM LỖI!',
      body: (
        <>
          Bạn đã nắm rõ cả 9 phân hệ! Bấm nút <span className="neon-green">[ GO TO INSPECTION ]</span> đang khoanh vùng ở dưới để vào{' '}
          <span className="neon-green">Buồng Chẩn Đoán 3 Nhiệm Vụ Tìm Lỗi</span>!
        </>
      ),
    },
  ],
  inspect: [
    {
      target: 'inspect-stage',
      title: 'NHIỆM VỤ 1/3 • NGHE TIẾNG XÌ GA TO/NHỎ ĐỂ BẤM',
      body: (
        <>
          Mắt thường <span className="neon-green">không thấy điểm xì</span>! Hãy rê chuột dọc thân tên lửa, lắng nghe{' '}
          <span className="neon-green">tiếng xì ga TO DẦN rồi NHỎ DẦN</span> (kèm đồng hồ{' '}
          <span className="neon-green">1. AUDIO HISS</span>). Nghe to nhất ở đâu →{' '}
          <span className="neon-green">CLICK chuột ngay vào đó</span>!
        </>
      ),
    },
    {
      target: 'inspect-tools',
      title: 'NHIỆM VỤ 2/3 • X-RAY TÌM ĐƯỜNG NỨT VÀNG NHỎ',
      body: (
        <>
          Bấm <span className="neon-green">[ 🩻 BẬT X-RAY MESH ]</span> để hiện lưới trắng thưa và tìm{' '}
          <span className="neon-green">đường ngoằn nghoèo nhỏ màu vàng</span> để bấm hàn!{' '}
          <span className="neon-green">Tên lửa dỏm có 2–3 vết</span> ở cả{' '}
          <span className="neon-green">FULL STACK</span> lẫn giấu trong <span className="neon-green">PAYLOAD FOCUS</span>!
        </>
      ),
    },
    {
      target: 'inspect-cam-align',
      title: 'NHIỆM VỤ 3/3 • KÉO TRỤC PHÁP GƯƠNG TRÙNG TRỤC ĐỨNG (0.0°)',
      body: (
        <>
          Ngay trên model 3D phía trên có <span className="neon-green">1 Trục Đứng (0.0°)</span> và{' '}
          <span className="neon-green">1 Trục Pháp tuyến Gương</span> đang bị lệch (do camera dỏm bị rơ bánh răng &amp; kẹt lò xo). Hãy{' '}
          <span className="neon-green">ghì kéo chuột trực tiếp trên model</span> đưa{' '}
          <span className="neon-green">Trục Pháp trùng khít Trục Đứng (hiện màu XANH)</span> và{' '}
          <span className="neon-green">giữ yên ở đó đến 100%</span>!
        </>
      ),
    },
    {
      target: 'inspect-finish',
      title: 'ĐÃ SỬA XONG • ĐƯA TÊN LỬA RA BỆ PHÓNG!',
      body: (
        <>
          Hoàn tất kiểm định! Bấm nút <span className="neon-green">[ FINISH INSPECTION ]</span> ở góc dưới phải để chuyển sang{' '}
          <span className="neon-green">Màn Phóng Tên Lửa 3D</span>!
        </>
      ),
    },
  ],
  launch: [
    {
      target: 'launch-canvas',
      title: 'PHÓNG 3D (ĐANG PAUSE) • QUAN SÁT BỆ PHÓNG',
      body: (
        <>
          Game đang <span className="neon-green">TẠM DỪNG</span> để bạn xem hướng dẫn. Khi phóng, tên lửa sẽ vượt{' '}
          <span className="neon-green">Max-Q</span>, <span className="neon-green">tách tầng</span> và{' '}
          <span className="neon-green">bung fairing</span>. Có thể dùng nút <span className="neon-green">4x / 12x / 30x</span> góc dưới để tua nhanh!
        </>
      ),
    },
    {
      target: 'launch-sequencer',
      title: 'TRÌNH TỰ BAY • BẤM ĐỂ BẮT ĐẦU PHÓNG!',
      body: (
        <>
          Bảng bên phải theo dõi từng mốc <span className="neon-green">IGNITION → LIFTOFF → MAX-Q → PAYLOAD_SEP</span>. Bấm{' '}
          <span className="neon-green">[ ▶ BẮT ĐẦU PHÓNG! ]</span> bên dưới để tên lửa rời bệ ngay!
        </>
      ),
    },
    {
      target: 'launch-next',
      title: 'ĐẠT QUỸ ĐẠO 100% • SANG VẬN HÀNH VỆ TINH!',
      body: (
        <>
          <span className="neon-green">PHÓNG THÀNH CÔNG!</span> Bấm nút{' '}
          <span className="neon-green">[ THEO DÕI 12 MỐC QUỸ ĐẠO [05] → ]</span> đang khoanh vùng để kiểm tra vệ tinh chụp ảnh!
        </>
      ),
    },
  ],
  life: [
    {
      target: 'orbit-canvas',
      title: 'QUỸ ĐẠO 12 THÁNG (ĐANG PAUSE) • VÒNG ĐỜI TÀU',
      body: (
        <>
          Mô phỏng đang <span className="neon-green">TẠM DỪNG</span>. Vệ tinh sẽ bay qua{' '}
          <span className="neon-green">12 tháng</span> quanh Trái Đất, tự động sạc pin ngoài nắng và xả pin khi vào bóng tối.
        </>
      ),
    },
    {
      target: 'orbit-telemetry',
      title: 'TELEMETRY & ẢNH VỆ TINH • BẮT ĐẦU CHẠY!',
      body: (
        <>
          Bên phải hiển thị <span className="neon-green">Pin (SOC), Bức xạ (RAD)</span> và{' '}
          <span className="neon-green">Ảnh chụp vệ tinh (Evidence Gallery)</span>. Bấm{' '}
          <span className="neon-green">[ ▶ BẮT ĐẦU VẬN HÀNH! ]</span> để tàu bay và chụp ảnh!
        </>
      ),
    },
    {
      target: 'orbit-next',
      title: 'KẾT THÚC SANDBOX, QUAY VỀ CỐT TRUYỆN!',
      body: (
        <>
          <span className="neon-green">Kết thúc sandbox, quay về cốt truyện!</span> Bạn đã hoàn thành xuất sắc 12 tháng vận hành vệ tinh. Bấm nút{' '}
          <span className="neon-green">[ ↩ RETURN ]</span> để quay về cốt truyện chính!
        </>
      ),
    },
  ],
  brief: [
    {
      target: 'brief-missions',
      title: '1. CHỌN CHIẾN DỊCH (MISSIONS)',
      body: (
        <>
          Chọn một <span className="neon-green">Nhiệm vụ không gian</span> ở cột trái. Bạn cũng có thể bấm{' '}
          <span className="neon-green">Chơi lại Sandbox (Có hoặc Tắt hướng dẫn)</span> bất cứ lúc nào!
        </>
      ),
    },
    {
      target: 'brief-start',
      title: '2. VÀO XƯỞNG CHẾ TẠO [02.BUILD]',
      body: (
        <>
          Bấm <span className="neon-green">[ VÀO XƯỞNG CHẾ TẠO → ]</span> để bắt đầu thiết kế vệ tinh cho nhiệm vụ đã chọn!
        </>
      ),
    },
  ],
  review: [
    {
      target: 'review-impact',
      title: '1. BÁO CÁO HẬU QUẢ TRÁI ĐẤT',
      body: (
        <>
          Xem <span className="neon-green">tác động thực tế</span> của chuyến bay và{' '}
          <span className="neon-green">nguyên nhân gốc</span> trong hồ sơ kỹ thuật.
        </>
      ),
    },
    {
      target: 'review-confront',
      title: '2. CHẤT VẤN SẾP MỞ KHÓA NGÂN SÁCH',
      body: (
        <>
          Chọn <span className="neon-green">Thẻ bằng chứng khớp lỗi</span> để buộc Sếp mở khóa thêm{' '}
          <span className="neon-green">Ngân sách &amp; Thời gian</span>!
        </>
      ),
    },
  ],
};

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

export default function TutorialOverlay({ phase, stepIndex, onStepChange, onClose }) {
  const {
    tutorialMode,
    completeTutorialToBrief,
    design,
    catalog,
    activeSlot,
    selectSlot,
    confirmSlotAndAdvance,
    enterInspect,
  } = useGame();

  const steps = TUTORIAL_STEPS[phase] || [];
  const safeIndex = Math.max(0, Math.min(steps.length - 1, stepIndex));
  const step = steps[safeIndex];
  const [box, setBox] = useState(null);
  const [dockPos, setDockPos] = useState('top-right'); // 'top-right' mac dinh de khong che nut goc duoi phai
  const scrolledTargetRef = useRef('');

  // Lay thong tin chi tiet (Dung o dau / Loi ich / Tac hai) cua linh kien dang chon o 02.BUILD
  const buildInsightInfo = (() => {
    if (phase !== 'design' || !design || !catalog?.tables) return null;
    const slotId = step?.slotId || activeSlot;
    if (!slotId) return null;
    const t = catalog.tables;
    let item = null;
    if (slotId === 'orbit') item = t.orbits?.[design.orbit];
    else if (slotId === 'launch') item = t.launch_vehicles?.[design.launch?.vehicle];
    else if (slotId === 'bus') item = t.buses?.[design.bus];
    else if (slotId === 'instruments') item = t.instruments?.[design.instruments?.[0]];
    else if (slotId === 'power') item = t.power_arrays?.[design.power];
    else if (slotId === 'battery') item = t.batteries?.[design.battery];
    else if (slotId === 'comm') item = t.comms?.[design.comm];
    else if (slotId === 'obc') item = t.avionics?.[design.obc];
    else if (slotId === 'adcs') item = t.avionics?.[design.adcs];
    if (!item) return null;
    const ins = getPartInsight(slotId, item);
    return { item, ins };
  })();

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
      } else if (safeIndex === 1) {
        // Kich hoat bat dau phong (unpause Launch3DCanvas)
        onClose();
      } else {
        onClose();
      }
      return;
    }
    if (phase === 'life') {
      if (safeIndex === 0) {
        onStepChange(1);
      } else if (safeIndex === 1) {
        // Kich hoat bat dau chay 12 thang quy dao (unpause LifePhase)
        onClose();
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

  let nextBtnLabel = 'TIẾP THEO →';
  if (phase === 'design') {
    if (safeIndex < SLOTS.length - 1) {
      nextBtnLabel = `TIẾP: MỞ ${SLOTS[safeIndex + 1].label} →`;
    } else if (safeIndex === SLOTS.length - 1) {
      nextBtnLabel = 'XONG 9 MỤC → XEM NÚT KIỂM ĐỊNH';
    } else {
      nextBtnLabel = 'VÀO PHÒNG TÌM LỖI [03] →';
    }
  } else if (phase === 'launch') {
    if (safeIndex === 0) nextBtnLabel = 'TIẾP THEO →';
    else if (safeIndex === 1) nextBtnLabel = '▶ BẮT ĐẦU PHÓNG!';
    else nextBtnLabel = 'ĐÃ HIỂU ✓';
  } else if (phase === 'life') {
    if (safeIndex === 0) nextBtnLabel = 'TIẾP THEO →';
    else if (safeIndex === 1) nextBtnLabel = '▶ BẮT ĐẦU VẬN HÀNH!';
    else nextBtnLabel = '↩ RETURN (QUAY VỀ CỐT TRUYỆN)';
  } else if (safeIndex + 1 >= steps.length) {
    nextBtnLabel = 'ĐÃ HIỂU ✓';
  }

  return (
    <div className="tutorial-overlay" aria-label="Hướng dẫn Kỹ sư trưởng">
      {/* Khoanh vùng sáng rõ vị trí cần quan tâm + Giảm độ sáng xung quanh một chút (pointer-events: none để không chặn thao tác) */}
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
          [ VÙNG THAO TÁC {safeIndex + 1}/{steps.length} ]
        </div>
      )}

      {/* Dock Kỹ sư trưởng: Mặc định ở GÓC TRÊN BÊN PHẢI để không bao giờ che nút ở dưới */}
      <aside
        className={`eng-tutorial-dock ${dockPos === 'top-right' ? 'pos-top-right' : 'pos-bottom-right'}`}
        role="region"
        aria-live="polite"
      >
        <div className="eng-tutorial-bubble">
          <div className="eng-tutorial-head">
            <span className="eng-tutorial-kicker">
              <span className="neon-dot" /> KỸ SƯ TRƯỞNG // {tutorialMode ? 'HƯỚNG DẪN SANDBOX' : 'HƯỚNG DẪN'}
            </span>
            <div className="eng-tutorial-meta">
              <button
                type="button"
                className="eng-skip-btn"
                onClick={() => setDockPos((p) => (p === 'top-right' ? 'bottom-right' : 'top-right'))}
                title="Chuyển vị trí hộp thoại Lên trên / Xuống dưới nếu vướng tầm nhìn"
              >
                ⇅ {dockPos === 'top-right' ? 'XUỐNG DƯỚI' : 'LÊN TRÊN'}
              </button>
              {tutorialMode && (
                <button
                  type="button"
                  className="eng-skip-btn"
                  onClick={completeTutorialToBrief}
                  title="Bỏ qua màn hướng dẫn và vào thẳng Chọn Mission"
                >
                  CHỌN MISSION →
                </button>
              )}
              <button
                type="button"
                className="eng-skip-btn"
                onClick={onClose}
                title="Tạm ẩn hộp thoại hướng dẫn (có thể bật lại ở thanh trên cùng)"
              >
                ẨN [ESC]
              </button>
            </div>
          </div>

          <div className="eng-tutorial-title">{step.title}</div>
          <div className="eng-tutorial-body">{step.body}</div>

          {/* Phan tich chi tiet linh kien dang chon o man 02.BUILD */}
          {phase === 'design' && safeIndex < SLOTS.length && buildInsightInfo?.ins && (
            <div className="eng-part-live-box">
              <div className="eng-part-live-title">
                ĐANG CHỌN: <span className="neon-green">{buildInsightInfo.item.name || buildInsightInfo.item.id}</span>
              </div>
              <div className="eng-part-live-row">
                <b>📍 Dùng ở đâu:</b> {buildInsightInfo.ins.where}
              </div>
              <div className="eng-part-live-row pros">
                <b>✅ Lợi ích (+):</b> {buildInsightInfo.ins.pros}
              </div>
              <div className="eng-part-live-row cons">
                <b>⚠️ Tác hại (-):</b> {buildInsightInfo.ins.cons}
              </div>
            </div>
          )}

          <div className="eng-tutorial-foot">
            <div className="tutorial-dots">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`tutorial-dot neon ${idx === safeIndex ? 'active' : ''}`}
                  aria-label={`Bước ${idx + 1}`}
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
                  ← TRƯỚC
                </button>
              )}
              {phase === 'launch' && safeIndex === 0 && (
                <button type="button" className="btn small neon-btn" onClick={onClose}>
                  ▶ BẮT ĐẦU PHÓNG!
                </button>
              )}
              {phase === 'life' && safeIndex === 0 && (
                <button type="button" className="btn small neon-btn" onClick={onClose}>
                  ▶ BẮT ĐẦU VẬN HÀNH!
                </button>
              )}
              <button type="button" className="btn small neon-btn" onClick={handleNextStep}>
                {nextBtnLabel}
              </button>
            </div>
          </div>
        </div>

        <div className="eng-tutorial-avatar-wrap" title="Kỹ sư trưởng hướng dẫn">
          <div className="eng-tutorial-circle">
            <EngineerCircleAvatar />
          </div>
          <span className="eng-avatar-tag">CHIEF ENG.</span>
        </div>
      </aside>
    </div>
  );
}
