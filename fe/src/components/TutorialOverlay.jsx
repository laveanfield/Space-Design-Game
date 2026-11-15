import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EngineerCircleAvatar } from '../story/Portraits';
import { SLOTS, getPartInsight } from '../core/gameMachine';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

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
      title: { vi: 'BƯỚC 1/10 • CHỌN QUỸ ĐẠO BAY (1.ORBIT)', en: 'STEP 1/10 • SELECT MISSION ORBIT (1.ORBIT)' },
      body: {
        vi: (
          <>
            Bấm thử từng mức <span className="neon-green">1.ORBIT (Quỹ đạo)</span> ở cột trái để xem{' '}
            <span className="neon-green">Dùng ở đâu, Lợi ích &amp; Tác hại</span>. Khi ưng ý, bấm{' '}
            <span className="neon-green">[TIẾP THEO →]</span> để mở hệ phóng!
          </>
        ),
        en: (
          <>
            Select each <span className="neon-green">1.ORBIT</span> option on the left column to view{' '}
            <span className="neon-green">Application, Benefits &amp; Risks</span>. When satisfied, click{' '}
            <span className="neon-green">[NEXT →]</span> to unlock the launch vehicle!
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'launch',
      title: { vi: 'BƯỚC 2/10 • CHỌN TÊN LỬA ĐẨY (2.LAUNCH)', en: 'STEP 2/10 • SELECT LAUNCH VEHICLE (2.LAUNCH)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">2.LAUNCH (Tên lửa &amp; Bãi phóng)</span>. Chú ý{' '}
            <span className="neon-green">Sức nâng (CAP kg)</span> và{' '}
            <span className="neon-green">Đường kính mũi (FAIR m)</span> rồi bấm{' '}
            <span className="neon-green">[TIẾP THEO →]</span>!
          </>
        ),
        en: (
          <>
            Choose <span className="neon-green">2.LAUNCH (Rocket &amp; Spaceport)</span>. Note{' '}
            <span className="neon-green">Payload Capacity (CAP kg)</span> and{' '}
            <span className="neon-green">Fairing Diameter (FAIR m)</span>, then click{' '}
            <span className="neon-green">[NEXT →]</span>!
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'bus',
      title: { vi: 'BƯỚC 3/10 • CHỌN KHUNG VỆ TINH (3.BUS)', en: 'STEP 3/10 • SELECT SPACECRAFT BUS (3.BUS)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">3.BUS (Khung chịu lực chính)</span>. Khung quyết định{' '}
            <span className="neon-green">Trần khối lượng (≤ kg)</span> và{' '}
            <span className="neon-green">Công suất cấp cho thiết bị (W)</span>.
          </>
        ),
        en: (
          <>
            Select <span className="neon-green">3.BUS (Structural Bus)</span>. The bus dictates{' '}
            <span className="neon-green">Mass Limit (≤ kg)</span> and{' '}
            <span className="neon-green">Instrument Power Allocation (W)</span>.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'instruments',
      title: { vi: 'BƯỚC 4/10 • CHỌN CAMERA / CẢM BIẾN (4.INSTR)', en: 'STEP 4/10 • SELECT PAYLOAD SENSORS (4.INSTR)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">4.INSTR (Thiết bị quan sát)</span>. Lưu ý camera{' '}
            <span className="neon-green">giá rẻ (Basic)</span> nhẹ nhưng dễ lệch góc lắp ráp; camera lớn cần{' '}
            <span className="neon-green">nhiều điện &amp; băng thông</span>!
          </>
        ),
        en: (
          <>
            Select <span className="neon-green">4.INSTR (Observation Payload)</span>. Budget cameras{' '}
            <span className="neon-green">(Basic)</span> are light but prone to alignment drift; high-res sensors need{' '}
            <span className="neon-green">more power &amp; downlink bandwidth</span>!
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'power',
      title: { vi: 'BƯỚC 5/10 • CHỌN CÁNH PIN MẶT TRỜI (5.POWER)', en: 'STEP 5/10 • SELECT SOLAR ARRAYS (5.POWER)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">5.POWER (Pin Mặt Trời)</span> để phát điện nuôi tàu khi có nắng.{' '}
            <span className="neon-green">Công suất phát (GEN W)</span> phải lớn hơn tổng tải tiêu thụ!
          </>
        ),
        en: (
          <>
            Select <span className="neon-green">5.POWER (Solar Arrays)</span> to generate electricity in sunlight.{' '}
            <span className="neon-green">Generation (GEN W)</span> must exceed total load demand!
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'battery',
      title: { vi: 'BƯỚC 6/10 • CHỌN PIN DỰ TRỮ VÙNG TỐI (6.BATT)', en: 'STEP 6/10 • SELECT BATTERY STORAGE (6.BATT)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">6.BATT (Ắc-quy Li-ion)</span> để nuôi vệ tinh khi bay vào{' '}
            <span className="neon-green">bóng tối Trái Đất (Eclipse)</span>, tránh sập nguồn!
          </>
        ),
        en: (
          <>
            Select <span className="neon-green">6.BATT (Li-ion Battery)</span> to power spacecraft in{' '}
            <span className="neon-green">Earth eclipse</span>, preventing brownouts!
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'comm',
      title: { vi: 'BƯỚC 7/10 • CHỌN ĂNG-TEN TRUYỀN TIN (7.COMM)', en: 'STEP 7/10 • SELECT COMM ANTENNA (7.COMM)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">7.COMM (Ăng-ten)</span>. Tốc độ{' '}
            <span className="neon-green">Downlink (Mbps)</span> phải đủ nhanh để truyền hết lượng GB ảnh chụp mỗi ngày!
          </>
        ),
        en: (
          <>
            Select <span className="neon-green">7.COMM (Antenna)</span>. Downlink speed{' '}
            <span className="neon-green">(Mbps)</span> must be fast enough to transmit captured daily gigabytes!
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'obc',
      title: { vi: 'BƯỚC 8/10 • CHỌN MÁY TÍNH ĐIỀU KHIỂN (8.OBC)', en: 'STEP 8/10 • SELECT ON-BOARD COMPUTER (8.OBC)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">8.OBC (Máy tính trung tâm)</span>. Độ chịu bức xạ{' '}
            <span className="neon-green">RAD (krad)</span> phải cao hơn bức xạ quỹ đạo để không bị cháy chip!
          </>
        ),
        en: (
          <>
            Select <span className="neon-green">8.OBC (Flight Computer)</span>. Radiation tolerance{' '}
            <span className="neon-green">RAD (krad)</span> must withstand orbital environment to prevent latch-ups!
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'adcs',
      title: { vi: 'BƯỚC 9/10 • CHỌN HỆ ĐIỀU HƯỚNG (9.ADCS)', en: 'STEP 9/10 • SELECT ATTITUDE CONTROL (9.ADCS)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">9.ADCS (Ổn định tư thế)</span>. Sai số góc{' '}
            <span className="neon-green">PT (±°)</span> phải nhỏ hơn yêu cầu của Camera để ảnh chụp không bị nhòe!
          </>
        ),
        en: (
          <>
            Select <span className="neon-green">9.ADCS (Attitude Control)</span>. Pointing accuracy{' '}
            <span className="neon-green">PT (±°)</span> must meet instrument optical requirements to avoid blurred imagery!
          </>
        ),
      },
    },
    {
      target: 'build-next',
      title: { vi: 'BƯỚC 10/10 • HOÀN TẤT LẮP RÁP → SANG TÌM LỖI!', en: 'STEP 10/10 • BUILD COMPLETE → PROCEED TO INSPECTION!' },
      body: {
        vi: (
          <>
            Bạn đã nắm rõ cả 9 phân hệ! Bấm nút <span className="neon-green">[ GO TO INSPECTION ]</span> đang khoanh vùng ở dưới để vào{' '}
            <span className="neon-green">Buồng Chẩn Đoán 3 Nhiệm Vụ Tìm Lỗi</span>!
          </>
        ),
        en: (
          <>
            All 9 subsystems configured! Click the highlighted <span className="neon-green">[ GO TO INSPECTION ]</span> button below to enter{' '}
            <span className="neon-green">Pre-Flight Diagnostic Bay (3 Tasks)</span>!
          </>
        ),
      },
    },
  ],
  inspect: [
    {
      target: 'inspect-stage',
      title: { vi: 'NHIỆM VỤ 1/3 • NGHE TIẾNG XÌ GA TO/NHỎ ĐỂ BẤM', en: 'TASK 1/3 • SWEEP CURSOR & LISTEN FOR GAS LEAK HISS' },
      body: {
        vi: (
          <>
            Mắt thường <span className="neon-green">không thấy điểm xì</span>! Hãy rê chuột dọc thân tên lửa, lắng nghe{' '}
            <span className="neon-green">tiếng xì ga TO DẦN rồi NHỎ DẦN</span> (kèm đồng hồ{' '}
            <span className="neon-green">1. AUDIO HISS</span>). Nghe to nhất ở đâu →{' '}
            <span className="neon-green">CLICK chuột ngay vào đó</span>!
          </>
        ),
        en: (
          <>
            <span className="neon-green">No visual marker</span>! Sweep cursor along the rocket body and listen for{' '}
            <span className="neon-green">peak gas hiss intensity</span> (watch the{' '}
            <span className="neon-green">1. AUDIO HISS</span> gauge). Where hiss peaks →{' '}
            <span className="neon-green">CLICK to seal the leak</span>!
          </>
        ),
      },
    },
    {
      target: 'inspect-tools',
      title: { vi: 'NHIỆM VỤ 2/3 • X-RAY TÌM ĐƯỜNG NỨT VÀNG NHỎ', en: 'TASK 2/3 • ENABLE X-RAY TO SPOT YELLOW CRACKS' },
      body: {
        vi: (
          <>
            Bấm <span className="neon-green">[ 🩻 BẬT X-RAY MESH ]</span> để hiện lưới trắng thưa và tìm{' '}
            <span className="neon-green">đường ngoằn nghoèo nhỏ màu vàng</span> để bấm hàn!{' '}
            <span className="neon-green">Tên lửa dỏm có 2–3 vết</span> ở cả{' '}
            <span className="neon-green">FULL STACK</span> lẫn giấu trong <span className="neon-green">PAYLOAD FOCUS</span>!
          </>
        ),
        en: (
          <>
            Click <span className="neon-green">[ 🩻 ENABLE X-RAY MESH ]</span> to view structural wireframe and find{' '}
            <span className="neon-green">fine yellow squiggly hairline cracks</span> to weld!{' '}
            <span className="neon-green">Low-cost rockets have 2–3 cracks</span> across both{' '}
            <span className="neon-green">FULL STACK</span> and hidden in <span className="neon-green">PAYLOAD FOCUS</span>!
          </>
        ),
      },
    },
    {
      target: 'inspect-cam-align',
      title: { vi: 'NHIỆM VỤ 3/3 • KÉO TRỤC PHÁP GƯƠNG TRÙNG TRỤC ĐỨNG (0.0°)', en: 'TASK 3/3 • ALIGN MIRROR NORMAL TO VERTICAL AXIS (0.0°)' },
      body: {
        vi: (
          <>
            Ngay trên model 3D phía trên có <span className="neon-green">1 Trục Đứng (0.0°)</span> và{' '}
            <span className="neon-green">1 Trục Pháp tuyến Gương</span> đang bị lệch (do camera dỏm bị rơ bánh răng &amp; kẹt lò xo). Hãy{' '}
            <span className="neon-green">ghì kéo chuột trực tiếp trên model</span> đưa{' '}
            <span className="neon-green">Trục Pháp trùng khít Trục Đứng (hiện màu XANH)</span> và{' '}
            <span className="neon-green">giữ yên ở đó đến 100%</span>!
          </>
        ),
        en: (
          <>
            On the 3D model above, observe the <span className="neon-green">Vertical Boresight (0.0°)</span> and{' '}
            <span className="neon-green">Mirror Normal Axis</span> (off-axis due to gear backlash).{' '}
            <span className="neon-green">Drag on the model</span> to align{' '}
            <span className="neon-green">Mirror Normal with Vertical (turns GREEN)</span> and{' '}
            <span className="neon-green">hold steady until latch reaches 100%</span>!
          </>
        ),
      },
    },
    {
      target: 'inspect-finish',
      title: { vi: 'ĐÃ SỬA XONG • ĐƯA TÊN LỬA RA BỆ PHÓNG!', en: 'INSPECTION COMPLETE • ROLLOUT TO LAUNCH PAD!' },
      body: {
        vi: (
          <>
            Hoàn tất kiểm định! Bấm nút <span className="neon-green">[ FINISH INSPECTION ]</span> ở góc dưới phải để chuyển sang{' '}
            <span className="neon-green">Màn Phóng Tên Lửa 3D</span>!
          </>
        ),
        en: (
          <>
            Pre-flight check cleared! Click the <span className="neon-green">[ FINISH INSPECTION ]</span> button at bottom right to proceed to{' '}
            <span className="neon-green">3D Launch Phase</span>!
          </>
        ),
      },
    },
  ],
  launch: [
    {
      target: 'launch-canvas',
      title: { vi: 'PHÓNG 3D (ĐANG PAUSE) • QUAN SÁT BỆ PHÓNG', en: '3D LAUNCH (PAUSED) • OBSERVE PAD' },
      body: {
        vi: (
          <>
            Game đang <span className="neon-green">TẠM DỪNG</span> để bạn xem hướng dẫn. Khi phóng, tên lửa sẽ vượt{' '}
            <span className="neon-green">Max-Q</span>, <span className="neon-green">tách tầng</span> và{' '}
            <span className="neon-green">bung fairing</span>. Có thể dùng nút <span className="neon-green">4x / 12x / 30x</span> góc dưới để tua nhanh!
          </>
        ),
        en: (
          <>
            Simulation is <span className="neon-green">PAUSED</span> for briefing. Upon liftoff, the vehicle will pass{' '}
            <span className="neon-green">Max-Q</span>, <span className="neon-green">stage separation</span>, and{' '}
            <span className="neon-green">fairing jettison</span>. Use the <span className="neon-green">4x / 12x / 30x</span> warp buttons below to speed up!
          </>
        ),
      },
    },
    {
      target: 'launch-sequencer',
      title: { vi: 'TRÌNH TỰ BAY • BẤM ĐỂ BẮT ĐẦU PHÓNG!', en: 'FLIGHT SEQUENCE • COMMENCE LAUNCH!' },
      body: {
        vi: (
          <>
            Bảng bên phải theo dõi từng mốc <span className="neon-green">IGNITION → LIFTOFF → MAX-Q → PAYLOAD_SEP</span>. Bấm{' '}
            <span className="neon-green">[ ▶ BẮT ĐẦU PHÓNG! ]</span> bên dưới để tên lửa rời bệ ngay!
          </>
        ),
        en: (
          <>
            The telemetry sequencer monitors <span className="neon-green">IGNITION → LIFTOFF → MAX-Q → PAYLOAD_SEP</span>. Click{' '}
            <span className="neon-green">[ ▶ COMMENCE LAUNCH! ]</span> below to ignite engines!
          </>
        ),
      },
    },
    {
      target: 'launch-next',
      title: { vi: 'ĐẠT QUỸ ĐẠO 100% • SANG VẬN HÀNH VỆ TINH!', en: 'ORBIT INSERTION 100% • SATELLITE OPERATIONS!' },
      body: {
        vi: (
          <>
            <span className="neon-green">PHÓNG THÀNH CÔNG!</span> Bấm nút{' '}
            <span className="neon-green">[ THEO DÕI 12 MỐC QUỸ ĐẠO [05] → ]</span> đang khoanh vùng để kiểm tra vệ tinh chụp ảnh!
          </>
        ),
        en: (
          <>
            <span className="neon-green">ORBIT INSERTION SUCCESSFUL!</span> Click the highlighted{' '}
            <span className="neon-green">[ 12-MONTH ORBIT SIMULATION [05] → ]</span> button to monitor science payload imaging!
          </>
        ),
      },
    },
  ],
  life: [
    {
      target: 'orbit-canvas',
      title: { vi: 'QUỸ ĐẠO 12 THÁNG (ĐANG PAUSE) • VÒNG ĐỜI TÀU', en: '12-MONTH ORBIT (PAUSED) • SPACECRAFT LIFECYCLE' },
      body: {
        vi: (
          <>
            Mô phỏng đang <span className="neon-green">TẠM DỪNG</span>. Vệ tinh sẽ bay qua{' '}
            <span className="neon-green">12 tháng</span> quanh Trái Đất, tự động sạc pin ngoài nắng và xả pin khi vào bóng tối.
          </>
        ),
        en: (
          <>
            Simulation is <span className="neon-green">PAUSED</span>. The spacecraft will traverse{' '}
            <span className="neon-green">12 months</span> around Earth, charging arrays in sunlight and draining batteries during eclipse.
          </>
        ),
      },
    },
    {
      target: 'orbit-telemetry',
      title: { vi: 'TELEMETRY & ẢNH VỆ TINH • BẮT ĐẦU CHẠY!', en: 'TELEMETRY & SATELLITE IMAGERY • COMMENCE OPS!' },
      body: {
        vi: (
          <>
            Bên phải hiển thị <span className="neon-green">Pin (SOC), Bức xạ (RAD)</span> và{' '}
            <span className="neon-green">Ảnh chụp vệ tinh (Evidence Gallery)</span>. Bấm{' '}
            <span className="neon-green">[ ▶ BẮT ĐẦU VẬN HÀNH! ]</span> để tàu bay và chụp ảnh!
          </>
        ),
        en: (
          <>
            Right panel streams <span className="neon-green">Battery (SOC), Radiation (RAD)</span> and{' '}
            <span className="neon-green">Captured Imagery (Evidence Gallery)</span>. Click{' '}
            <span className="neon-green">[ ▶ START OPERATIONS! ]</span> to begin orbital passes!
          </>
        ),
      },
    },
    {
      target: 'orbit-next',
      title: { vi: 'KẾT THÚC SANDBOX, QUAY VỀ CỐT TRUYỆN!', en: 'SANDBOX COMPLETE, RETURN TO CAMPAIGN!' },
      body: {
        vi: (
          <>
            <span className="neon-green">Kết thúc sandbox, quay về cốt truyện!</span> Bạn đã hoàn thành xuất sắc 12 tháng vận hành vệ tinh. Bấm nút{' '}
            <span className="neon-green">[ ↩ RETURN ]</span> để quay về cốt truyện chính!
          </>
        ),
        en: (
          <>
            <span className="neon-green">Sandbox completed, return to campaign!</span> You completed the full 12-month mission lifecycle. Click{' '}
            <span className="neon-green">[ ↩ RETURN ]</span> to resume the main narrative!
          </>
        ),
      },
    },
  ],
  brief: [
    {
      target: 'brief-missions',
      title: { vi: '1. CHỌN CHIẾN DỊCH (MISSIONS)', en: '1. SELECT MISSION CAMPAIGN' },
      body: {
        vi: (
          <>
            Chọn một <span className="neon-green">Nhiệm vụ không gian</span> ở cột trái. Bạn cũng có thể bấm{' '}
            <span className="neon-green">Chơi lại Sandbox (Có hoặc Tắt hướng dẫn)</span> bất cứ lúc nào!
          </>
        ),
        en: (
          <>
            Select a <span className="neon-green">Space Mission</span> on the left roster. You can also replay the{' '}
            <span className="neon-green">Sandbox Mode (with Guided Tutorial or Free)</span> at any time!
          </>
        ),
      },
    },
    {
      target: 'brief-start',
      title: { vi: '2. VÀO XƯỞNG CHẾ TẠO [02.BUILD]', en: '2. ENTER ASSEMBLY HANGAR [02.BUILD]' },
      body: {
        vi: (
          <>
            Bấm <span className="neon-green">[ VÀO XƯỞNG CHẾ TẠO → ]</span> để bắt đầu thiết kế vệ tinh cho nhiệm vụ đã chọn!
          </>
        ),
        en: (
          <>
            Click <span className="neon-green">[ ENTER ASSEMBLY HANGAR → ]</span> to begin designing the spacecraft!
          </>
        ),
      },
    },
  ],
  review: [
    {
      target: 'review-impact',
      title: { vi: '1. BÁO CÁO HẬU QUẢ TRÁI ĐẤT', en: '1. EARTH IMPACT REPORT' },
      body: {
        vi: (
          <>
            Xem <span className="neon-green">tác động thực tế</span> của chuyến bay và{' '}
            <span className="neon-green">nguyên nhân gốc</span> trong hồ sơ kỹ thuật.
          </>
        ),
        en: (
          <>
            Review real-world <span className="neon-green">Humanity Impact</span> and{' '}
            <span className="neon-green">Root Cause Dossier</span> from the telemetry log.
          </>
        ),
      },
    },
    {
      target: 'review-confront',
      title: { vi: '2. CHẤT VẤN SẾP MỞ KHÓA NGÂN SÁCH', en: '2. CONFRONT DIRECTOR TO EXPAND BUDGET' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">Thẻ bằng chứng khớp lỗi</span> để buộc Sếp mở khóa thêm{' '}
            <span className="neon-green">Ngân sách &amp; Thời gian</span>!
          </>
        ),
        en: (
          <>
            Present <span className="neon-green">matching evidence cards</span> to pressure the Director into authorizing additional{' '}
            <span className="neon-green">Budget &amp; Schedule</span>!
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
    design,
    catalog,
    activeSlot,
    selectSlot,
    confirmSlotAndAdvance,
    enterInspect,
  } = useGame();

  const lang = propLang || gameLang || 'vi';

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

  let nextBtnLabel = tr(lang, 'TIẾP THEO →', 'NEXT →');
  if (phase === 'design') {
    if (safeIndex < SLOTS.length - 1) {
      const nextSlot = SLOTS[safeIndex + 1];
      const nextSlotLabel = tx(nextSlot.label, lang) || nextSlot.label;
      nextBtnLabel = tr(lang, `TIẾP: MỞ ${nextSlotLabel} →`, `NEXT: UNLOCK ${nextSlotLabel} →`);
    } else if (safeIndex === SLOTS.length - 1) {
      nextBtnLabel = tr(lang, 'XONG 9 MỤC → XEM NÚT KIỂM ĐỊNH', 'DONE 9 SLOTS → VIEW INSPECT');
    } else {
      nextBtnLabel = tr(lang, 'VÀO PHÒNG TÌM LỖI [03] →', 'GO TO INSPECTION [03] →');
    }
  } else if (phase === 'launch') {
    if (safeIndex === 0) nextBtnLabel = tr(lang, 'TIẾP THEO →', 'NEXT →');
    else if (safeIndex === 1) nextBtnLabel = tr(lang, '▶ BẮT ĐẦU PHÓNG!', '▶ COMMENCE LAUNCH!');
    else nextBtnLabel = tr(lang, 'ĐÃ HIỂU ✓', 'UNDERSTOOD ✓');
  } else if (phase === 'life') {
    if (safeIndex === 0) nextBtnLabel = tr(lang, 'TIẾP THEO →', 'NEXT →');
    else if (safeIndex === 1) nextBtnLabel = tr(lang, '▶ BẮT ĐẦU VẬN HÀNH!', '▶ START OPERATIONS!');
    else nextBtnLabel = tr(lang, '↩ RETURN (QUAY VỀ CỐT TRUYỆN)', '↩ RETURN TO CAMPAIGN');
  } else if (safeIndex + 1 >= steps.length) {
    nextBtnLabel = tr(lang, 'ĐÃ HIỂU ✓', 'UNDERSTOOD ✓');
  }

  return (
    <div
      className="tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={tr(lang, 'Hướng dẫn Kỹ sư trưởng', 'Chief Engineer Guide')}
    >
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
          {tr(lang, `[ VÙNG THAO TÁC ${safeIndex + 1}/${steps.length} ]`, `[ FOCUS ZONE ${safeIndex + 1}/${steps.length} ]`)}
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
              <span className="neon-dot" /> {tr(lang, 'KỸ SƯ TRƯỞNG //', 'CHIEF ENGINEER //')}{' '}
              {tutorialMode ? tr(lang, 'HƯỚNG DẪN SANDBOX', 'SANDBOX GUIDE') : tr(lang, 'HƯỚNG DẪN', 'GUIDE')}
            </span>
            <div className="eng-tutorial-meta">
              <button
                type="button"
                className="eng-skip-btn"
                onClick={() => setDockPos((p) => (p === 'top-right' ? 'bottom-right' : 'top-right'))}
                title={tr(lang, 'Chuyển vị trí hộp thoại Lên trên / Xuống dưới nếu vướng tầm nhìn', 'Toggle dock position top / bottom')}
              >
                ⇅ {dockPos === 'top-right' ? tr(lang, 'XUỐNG DƯỚI', 'MOVE DOWN') : tr(lang, 'LÊN TRÊN', 'MOVE UP')}
              </button>
              {tutorialMode && (
                <button
                  type="button"
                  className="eng-skip-btn"
                  onClick={completeTutorialToBrief}
                  title={tr(lang, 'Bỏ qua màn hướng dẫn và vào thẳng Chọn Mission', 'Skip tutorial and proceed to Mission Select')}
                >
                  {tr(lang, 'CHỌN MISSION →', 'SELECT MISSION →')}
                </button>
              )}
              <button
                type="button"
                className="eng-skip-btn"
                onClick={onClose}
                title={tr(lang, 'Tạm ẩn hộp thoại hướng dẫn (có thể bật lại ở thanh trên cùng)', 'Hide tutorial dialog (press ESC)')}
              >
                {tr(lang, 'ẨN [ESC]', 'HIDE [ESC]')}
              </button>
            </div>
          </div>

          <div className="eng-tutorial-title">{renderStepContent(step.title, lang)}</div>
          <div className="eng-tutorial-body">{renderStepContent(step.body, lang)}</div>

          {/* Phan tich chi tiet linh kien dang chon o man 02.BUILD */}
          {phase === 'design' && safeIndex < SLOTS.length && buildInsightInfo?.ins && (
            <div className="eng-part-live-box">
              <div className="eng-part-live-title">
                {tr(lang, 'ĐANG CHỌN:', 'SELECTED:')}{' '}
                <span className="neon-green">{tx(buildInsightInfo.item.name, lang) || buildInsightInfo.item.id}</span>
              </div>
              <div className="eng-part-live-row">
                <b>📍 {tr(lang, 'Dùng ở đâu:', 'Application:')}</b> {tx(buildInsightInfo.ins.where, lang)}
              </div>
              <div className="eng-part-live-row pros">
                <b>✅ {tr(lang, 'Lợi ích (+):', 'Benefits (+):')}</b> {tx(buildInsightInfo.ins.pros, lang)}
              </div>
              <div className="eng-part-live-row cons">
                <b>⚠️ {tr(lang, 'Tác hại (-):', 'Risks (-):')}</b> {tx(buildInsightInfo.ins.cons, lang)}
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
                  {tr(lang, '← TRƯỚC', '← PREV')}
                </button>
              )}
              {phase === 'launch' && safeIndex === 0 && (
                <button type="button" className="btn small neon-btn" onClick={onClose}>
                  {tr(lang, '▶ BẮT ĐẦU PHÓNG!', '▶ COMMENCE LAUNCH!')}
                </button>
              )}
              {phase === 'life' && safeIndex === 0 && (
                <button type="button" className="btn small neon-btn" onClick={onClose}>
                  {tr(lang, '▶ BẮT ĐẦU VẬN HÀNH!', '▶ START OPERATIONS!')}
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
