import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EngineerCircleAvatar } from '../story/Portraits';
import { SLOTS, getPartInsight } from '../core/gameMachine';
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
      title: { vi: 'BƯỚC 1/10 | CHỌN QUỸ ĐẠO BAY (1.ORBIT)', en: 'STEP 1/10 | SELECT TARGET ORBIT (1.ORBIT)' },
      body: {
        vi: (
          <>
            Bấm thử từng mức <span className="neon-green">1.ORBIT (Quỹ đạo)</span> ở cột trái để xem{' '}
            <span className="neon-green">Dùng ở đâu, Lợi ích &amp; Tác hại</span>. Khi ưng ý, bấm{' '}
            <span className="neon-green">[TIẾP THEO]</span> để mở hệ phóng!
          </>
        ),
        en: (
          <>
            Click different options in <span className="neon-green">1.ORBIT</span> on the left to review{' '}
            <span className="neon-green">Usage, Pros, and Cons</span>. When ready, press{' '}
            <span className="neon-green">[NEXT]</span> to unlock the launch vehicle slot.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'launch',
      title: { vi: 'BƯỚC 2/10 | CHỌN TÊN LỬA ĐẨY (2.LAUNCH)', en: 'STEP 2/10 | SELECT LAUNCH VEHICLE (2.LAUNCH)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">2.LAUNCH (Tên lửa &amp; Bãi phóng)</span>. Chú ý{' '}
            <span className="neon-green">Sức nâng (CAP kg)</span> và{' '}
            <span className="neon-green">Đường kính mũi (FAIR m)</span> rồi bấm{' '}
            <span className="neon-green">[TIẾP THEO]</span>!
          </>
        ),
        en: (
          <>
            Choose <span className="neon-green">2.LAUNCH (Booster &amp; Site)</span>. Check{' '}
            <span className="neon-green">Lift Capacity (CAP kg)</span> and{' '}
            <span className="neon-green">Fairing Diameter (FAIR m)</span>, then click{' '}
            <span className="neon-green">[NEXT]</span>.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'bus',
      title: { vi: 'BƯỚC 3/10 | CHỌN KHUNG VỆ TINH (3.BUS)', en: 'STEP 3/10 | SELECT SPACECRAFT BUS (3.BUS)' },
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
            Choose <span className="neon-green">3.BUS (Structural Frame)</span>. The bus sets{' '}
            <span className="neon-green">Maximum Dry Mass (≤ kg)</span> and{' '}
            <span className="neon-green">Payload Power Budget (W)</span>.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'instruments',
      title: { vi: 'BƯỚC 4/10 | CHỌN CAMERA / CẢM BIẾN (4.INSTR)', en: 'STEP 4/10 | SELECT PAYLOAD INSTRUMENT (4.INSTR)' },
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
            Select <span className="neon-green">4.INSTR (Camera / Sensor)</span>. Note that{' '}
            <span className="neon-green">Basic-tier</span> cameras are light but suffer higher optical drift; heavy sensors require{' '}
            <span className="neon-green">more power and bandwidth</span>.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'power',
      title: { vi: 'BƯỚC 5/10 | CHỌN CÁNH PIN MẶT TRỜI (5.POWER)', en: 'STEP 5/10 | SELECT SOLAR ARRAY (5.POWER)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">5.POWER (Pin Mặt Trời)</span> để phát điện nuôi tàu khi có nắng.{' '}
            <span className="neon-green">Công suất phát (GEN W)</span> phải lớn hơn tổng tải tiêu thụ!
          </>
        ),
        en: (
          <>
            Choose <span className="neon-green">5.POWER (Solar Array)</span> to power the spacecraft in sunlight.{' '}
            <span className="neon-green">Generated Power (GEN W)</span> must stay above total load plus battery recharge.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'battery',
      title: { vi: 'BƯỚC 6/10 | CHỌN PIN DỰ TRỮ VÙNG TỐI (6.BATT)', en: 'STEP 6/10 | SELECT BATTERY STORAGE (6.BATT)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">6.BATT (Ắc-quy Li-ion)</span> để nuôi vệ tinh khi bay vào{' '}
            <span className="neon-green">bóng tối Trái Đất (Eclipse)</span>, tránh sập nguồn!
          </>
        ),
        en: (
          <>
            Choose <span className="neon-green">6.BATT (Li-Ion Pack)</span> to keep electronics alive through{' '}
            <span className="neon-green">Earth Eclipse</span> without brownout.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'comm',
      title: { vi: 'BƯỚC 7/10 | CHỌN ĂNG-TEN TRUYỀN TIN (7.COMM)', en: 'STEP 7/10 | SELECT DOWNLINK RADIO (7.COMM)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">7.COMM (Ăng-ten)</span>. Tốc độ{' '}
            <span className="neon-green">Downlink (Mbps)</span> phải đủ nhanh để truyền hết lượng GB ảnh chụp mỗi ngày!
          </>
        ),
        en: (
          <>
            Choose <span className="neon-green">7.COMM (Transmitter / Antenna)</span>.{' '}
            <span className="neon-green">Downlink Rate (Mbps)</span> must drain captured data faster than daily generation.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'obc',
      title: { vi: 'BƯỚC 8/10 | CHỌN MÁY TÍNH ĐIỀU KHIỂN (8.OBC)', en: 'STEP 8/10 | SELECT FLIGHT COMPUTER (8.OBC)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">8.OBC (Máy tính trung tâm)</span>. Độ chịu bức xạ{' '}
            <span className="neon-green">RAD (krad)</span> phải cao hơn bức xạ quỹ đạo để không bị cháy chip!
          </>
        ),
        en: (
          <>
            Choose <span className="neon-green">8.OBC (On-Board Computer)</span>.{' '}
            <span className="neon-green">Radiation Tolerance (RAD krad)</span> must exceed mission dose to prevent latch-ups.
          </>
        ),
      },
    },
    {
      target: 'build-slots',
      slotId: 'adcs',
      title: { vi: 'BƯỚC 9/10 | CHỌN HỆ ĐIỀU HƯỚNG (9.ADCS)', en: 'STEP 9/10 | SELECT ATTITUDE CONTROL (9.ADCS)' },
      body: {
        vi: (
          <>
            Chọn <span className="neon-green">9.ADCS (Ổn định tư thế)</span>. Sai số góc{' '}
            <span className="neon-green">PT (±°)</span> phải nhỏ hơn yêu cầu của Camera để ảnh chụp không bị nhòe!
          </>
        ),
        en: (
          <>
            Choose <span className="neon-green">9.ADCS (Stabilization)</span>. Pointing error{' '}
            <span className="neon-green">PT (+/- deg)</span> must stay within camera limits to avoid image blur.
          </>
        ),
      },
    },
    {
      target: 'build-next',
      title: { vi: 'BƯỚC 10/10 | HOÀN TẤT LẮP RÁP — SANG KIỂM ĐỊNH!', en: 'STEP 10/10 | BUILD COMPLETE — PROCEED TO INSPECTION' },
      body: {
        vi: (
          <>
            Bạn đã nắm rõ cả 9 phân hệ! Bấm nút <span className="neon-green">[ GO TO INSPECTION ]</span> đang khoanh vùng ở dưới để vào{' '}
            <span className="neon-green">Buồng Chẩn Đoán 3 Nhiệm Vụ Tìm Lỗi</span>!
          </>
        ),
        en: (
          <>
            All 9 subsystems are unlocked. Click <span className="neon-green">[ GO TO INSPECTION ]</span> highlighted below to enter{' '}
            <span className="neon-green">Pre-Flight Diagnostics (3 Tasks)</span>.
          </>
        ),
      },
    },
  ],
  inspect: [
    {
      target: 'inspect-cam-align',
      title: { vi: 'BƯỚC 1/3 | PAYLOAD FOCUS: CĂN TRỤC QUANG HỌC', en: 'STEP 1/3 | PAYLOAD FOCUS: ALIGN OPTICAL AXIS' },
      body: {
        vi: (
          <>
            Kiểm định mở mặc định ở chế độ <span className="neon-green">PAYLOAD FOCUS</span>. Hãy ghì kéo chuột trên khung 3D để căn{' '}
            <span className="neon-green">Trục Quang học Gương</span> trùng với <span className="neon-green">Trục Đứng 0.0°</span> và giữ yên đến 100%.
          </>
        ),
        en: (
          <>
            Inspection opens in <span className="neon-green">PAYLOAD FOCUS</span> by default. Drag on the 3D viewport to align the{' '}
            <span className="neon-green">Mirror Optical Axis</span> with the <span className="neon-green">Vertical 0.0 deg Axis</span> and hold until locked at 100%.
          </>
        ),
      },
    },
    {
      target: 'inspect-stage',
      title: { vi: 'BƯỚC 2/3 | FULL STACK: DÒ RÒ RỈ KHÍ BẰNG ÂM THANH', en: 'STEP 2/3 | FULL STACK: AUDIO LEAK SCAN' },
      body: {
        vi: (
          <>
            Khi chốt gương đã khóa, góc nhìn tự chuyển sang <span className="neon-green">FULL STACK</span>. Lia chuột dọc thân tên lửa, lắng nghe{' '}
            <span className="neon-green">tiếng xì ga lớn nhất</span> và click thẳng vào nguồn xì để hàn kín.
          </>
        ),
        en: (
          <>
            Once the mirror locks, the camera transitions to <span className="neon-green">FULL STACK</span>. Sweep across the rocket body, listen for the{' '}
            <span className="neon-green">loudest gas hiss peak</span>, and click the leak origin to seal it.
          </>
        ),
      },
    },
    {
      target: 'inspect-tools',
      title: { vi: 'BƯỚC 3/3 | X-RAY: TÌM ĐƯỜNG NỨT HÀN MÀU VÀNG', en: 'STEP 3/3 | X-RAY: LOCATE YELLOW WELD CRACKS' },
      body: {
        vi: (
          <>
            Bật <span className="neon-green">X-RAY MESH</span>, tìm và click vào mọi đường nứt vàng. Nếu còn vết nứt bên trong khoang tải, hãy chuyển lại{' '}
            <span className="neon-green">PAYLOAD FOCUS</span>; chỉ báo trục quang học chỉ hiển thị tại đó.
          </>
        ),
        en: (
          <>
            Toggle <span className="neon-green">X-RAY MESH</span>, spot and click every yellow crack. If remaining cracks are inside the fairing, switch back to{' '}
            <span className="neon-green">PAYLOAD FOCUS</span>; the optical axis indicator only appears there.
          </>
        ),
      },
    },
    {
      target: 'inspect-finish',
      title: { vi: 'ĐÃ XỬ LÝ XONG — ĐƯA TÊN LỬA RA BỆ PHÓNG', en: 'ALL CHECKS CLEARED — ROLL OUT TO LAUNCH PAD' },
      body: {
        vi: (
          <>
            Hoàn tất kiểm định. Bấm nút <span className="neon-green">[ FINISH INSPECTION ]</span> ở góc dưới phải để chuyển sang{' '}
            <span className="neon-green">Phóng Tên Lửa 3D [04.LAUNCH_3D]</span>.
          </>
        ),
        en: (
          <>
            Inspection complete. Click <span className="neon-green">[ FINISH INSPECTION ]</span> in the bottom-right corner to enter{' '}
            <span className="neon-green">3D Rocket Launch [04.LAUNCH_3D]</span>.
          </>
        ),
      },
    },
  ],
  launch: [
    {
      target: 'launch-canvas',
      title: { vi: 'PHÓNG 3D (ĐANG TẠM DỪNG) | QUAN SÁT BỆ PHÓNG', en: '3D LAUNCH (PAUSED) | PAD OBSERVATION' },
      body: {
        vi: (
          <>
            Mô phỏng đang <span className="neon-green">TẠM DỪNG</span> trong khi bạn xem hướng dẫn. Khi bay, tên lửa vượt{' '}
            <span className="neon-green">Max-Q</span>, nghiêng mượt theo quỹ đạo <span className="neon-green">gravity turn</span>, tách tầng và thả vệ tinh. Tốc độ khởi đầu ở{' '}
            <span className="neon-green">x1</span> (chỉnh tới x100).
          </>
        ),
        en: (
          <>
            Simulation is <span className="neon-green">PAUSED</span> while you read the guide. During flight, the rocket passes{' '}
            <span className="neon-green">Max-Q</span>, pitches smoothly into a <span className="neon-green">gravity turn</span>, stages, and deploys the payload. Speed starts at{' '}
            <span className="neon-green">x1</span> (adjustable up to x100).
          </>
        ),
      },
    },
    {
      target: 'launch-sequencer',
      title: { vi: 'TRÌNH TỰ BAY | SẴN SÀNG ĐÁNH LỬA', en: 'FLIGHT SEQUENCER | IGNITION READY' },
      body: {
        vi: (
          <>
            Bảng bên phải theo dõi <span className="neon-green">IGNITION, LIFTOFF, MAX-Q và PAYLOAD_SEP</span>. Bấm{' '}
            <span className="neon-green">[ BẮT ĐẦU PHÓNG ]</span> bên dưới để đánh lửa động cơ.
          </>
        ),
        en: (
          <>
            The right panel tracks <span className="neon-green">IGNITION, LIFTOFF, MAX-Q, and PAYLOAD_SEP</span>. Click{' '}
            <span className="neon-green">[ START LAUNCH ]</span> below to ignite the engines.
          </>
        ),
      },
    },
    {
      target: 'launch-next',
      title: { vi: 'ĐẠT QUỸ ĐẠO 100% | SANG VẬN HÀNH QUỸ ĐẠO', en: 'ORBIT INSERTION 100% | ENTER ORBITAL OPERATIONS' },
      body: {
        vi: (
          <>
            <span className="neon-green">PHÓNG THÀNH CÔNG!</span> Bấm{' '}
            <span className="neon-green">[ THEO DÕI 12 MỐC QUỸ ĐẠO [05] ]</span> đang khoanh vùng để kiểm chứng chụp ảnh và truyền tin.
          </>
        ),
        en: (
          <>
            <span className="neon-green">LAUNCH SUCCESSFUL!</span> Click{' '}
            <span className="neon-green">[ ENTER 12-EPOCH ORBIT OPS [05] ]</span> highlighted below to verify imaging and downlink.
          </>
        ),
      },
    },
  ],
  life: [
    {
      target: 'orbit-canvas',
      title: { vi: '1. CHÀO MỪNG ĐẾN VẬN HÀNH QUỸ ĐẠO (05.ORBIT)', en: '1. WELCOME TO ORBITAL OPERATIONS (05.ORBIT)' },
      body: {
        vi: (
          <>
            Tách vệ tinh <span className="neon-green">chưa phải là kết thúc nhiệm vụ</span>. Tàu hiện đang ở trên quỹ đạo (đang tạm dừng) và phải hoàn thành chụp ảnh, lưu bộ đệm và truyền về Trái Đất.
          </>
        ),
        en: (
          <>
            Payload separation <span className="neon-green">is not the end of the mission</span>. The spacecraft is now in orbit (paused) and must complete capture, onboard storage, and Earth downlink.
          </>
        ),
      },
    },
    {
      target: 'orbit-region',
      title: { vi: '2. VÙNG MỤC TIÊU & CƠ HỘI BAY QUA', en: '2. TARGET ZONE & OVERPASS OPPORTUNITIES' },
      body: {
        vi: (
          <>
            <span className="neon-green">Trục thời gian 12 mốc</span> và vệt bay cho thấy các lượt bay qua vùng mục tiêu. Cảm biến chỉ thu được ảnh hợp lệ khi bay qua đúng khu vực chỉ định.
          </>
        ),
        en: (
          <>
            The <span className="neon-green">12-epoch timeline</span> and ground track show target overpasses. The instrument can only collect valid frames while flying across designated target regions.
          </>
        ),
      },
    },
    {
      target: 'orbit-capture',
      title: { vi: '3. CHỤP QUAN SÁT (01 | ĐÃ CHỤP)', en: '3. OBSERVATION CAPTURE (01 | CAPTURED)' },
      body: {
        vi: (
          <>
            Khi bay qua mục tiêu cháy rừng/quan sát với ADCS ổn định, cảm biến sẽ chụp khung hình và tăng bộ đếm <span className="neon-green">ĐÃ CHỤP (CAPTURED)</span>.
          </>
        ),
        en: (
          <>
            When crossing a wildfire/mission target with steady ADCS pointing, the sensor captures a frame and increments <span className="neon-green">CAPTURED FRAMES</span>.
          </>
        ),
      },
    },
    {
      target: 'orbit-storage',
      title: { vi: '4. LƯU TRỮ TRÊN TÀU (02 | BỘ ĐỆM)', en: '4. ONBOARD STORAGE (02 | BUFFER)' },
      body: {
        vi: (
          <>
            Ảnh mới chụp được đệm trong <span className="neon-green">bộ nhớ máy tính OBC</span> (Store-and-Forward). Lưu ý: <span className="neon-green">dữ liệu trong bộ nhớ chưa về tới Trái Đất</span>; nếu đầy bộ nhớ trước khi truyền, ảnh mới sẽ bị rớt.
          </>
        ),
        en: (
          <>
            New frames buffer inside the <span className="neon-green">OBC onboard memory</span> (Store-and-Forward). Note: <span className="neon-green">stored data is not yet on Earth</span>; if storage fills before downlink, new imagery is dropped.
          </>
        ),
      },
    },
    {
      target: 'orbit-comm',
      title: { vi: '5. LIÊN LẠC TRẠM MẶT ĐẤT (03 | TRUYỀN TIN)', en: '5. GROUND STATION CONTACT (03 | CONTACT)' },
      body: {
        vi: (
          <>
            Truyền tin chỉ hoạt động trong <span className="neon-green">cửa sổ tầm nhìn thẳng (LOS) với trạm thu</span> có <span className="neon-green">Link Margin (&gt;= 3 dB)</span> dương và mức pin (SOC) đủ khỏe.
          </>
        ),
        en: (
          <>
            Downlink works only inside a <span className="neon-green">ground station Line-of-Sight (LOS) window</span> with positive <span className="neon-green">Link Margin (&gt;= 3 dB)</span> and healthy battery charge (SOC).
          </>
        ),
      },
    },
    {
      target: 'orbit-downlink',
      title: { vi: '6. THÔNG LƯỢNG TRUYỀN XUỐNG TRÁI ĐẤT', en: '6. DATA DOWNLINK THROUGHPUT' },
      body: {
        vi: (
          <>
            Trong cửa sổ liên lạc hợp lệ, bộ phát đẩy dữ liệu đang chờ xuống đất ở <span className="neon-green">tốc độ truyền (Mbps)</span>. Băng thông hẹp sẽ làm ảnh bị kẹt lại trên quỹ đạo.
          </>
        ),
        en: (
          <>
            During valid contact windows, the transmitter streams queued bytes down at <span className="neon-green">downlink rate (Mbps)</span>. Narrow bandwidth strands imagery in orbit.
          </>
        ),
      },
    },
    {
      target: 'orbit-delivered',
      title: { vi: '7. BẰNG CHỨNG ĐÃ VỀ TRÁI ĐẤT (04 | ĐÃ NHẬN)', en: '7. DELIVERED EVIDENCE (04 | EARTH)' },
      body: {
        vi: (
          <>
            Bộ đếm <span className="neon-green">ĐÃ VỀ TRÁI ĐẤT (DELIVERED)</span> chỉ tăng sau khi một bức ảnh rõ nét hoàn tất <span className="neon-green">100% đường truyền xuống</span> tới trạm mặt đất.
          </>
        ),
        en: (
          <>
            The <span className="neon-green">DELIVERED FRAMES</span> counter increments only after a clear frame finishes <span className="neon-green">100% downlink transfer</span> to a ground station.
          </>
        ),
      },
    },
    {
      target: 'orbit-speed',
      title: { vi: '8. TUA NHANH THỜI GIAN', en: '8. TIME ACCELERATION' },
      body: {
        vi: (
          <>
            Mô phỏng quỹ đạo luôn bắt đầu ở tốc độ <span className="neon-green">1x</span>. Chọn giữa <span className="neon-green">1x, 2x, 5x, 10x, 30x và 100x</span> để tua nhanh các lượt bay qua. Bấm <span className="neon-green">[ BẮT ĐẦU / TIẾP TỤC ]</span> để chạy.
          </>
        ),
        en: (
          <>
            Orbit ops always begin at real-time <span className="neon-green">1x</span>. Switch between <span className="neon-green">1x, 2x, 5x, 10x, 30x, and 100x</span> to fast-forward orbital passes. Click <span className="neon-green">[ START / RESUME ]</span> to run.
          </>
        ),
      },
    },
    {
      target: 'orbit-next',
      title: { vi: '9. QUY TẮC HOÀN THÀNH NHIỆM VỤ', en: '9. MISSION COMPLETION RULE' },
      body: {
        vi: (
          <>
            Thành công đòi hỏi vệ tinh <span className="neon-green">sống sót, chụp đủ ảnh rõ VÀ hoàn tất 100% truyền về trạm thu</span>. Tràn bộ nhớ, mất liên lạc hay băng thông thấp đều thất bại dù đã lên quỹ đạo. Bấm bên dưới để hoàn tất đánh giá.
          </>
        ),
        en: (
          <>
            Success requires that the spacecraft <span className="neon-green">survives, captures enough clear frames, AND completes 100% ground delivery</span>. Storage overflow, link dropouts, or low bandwidth cause failure even after reaching orbit. Click below to finish review.
          </>
        ),
      },
    },
  ],
  brief: [
    {
      target: 'brief-missions',
      title: { vi: '1. CHỌN CHIẾN DỊCH (MISSIONS)', en: '1. SELECT CAMPAIGN MISSION' },
      body: {
        vi: (
          <>
            Chọn một <span className="neon-green">Nhiệm vụ không gian</span> ở cột trái. Bạn cũng có thể bấm{' '}
            <span className="neon-green">Chơi lại Sandbox (Có hoặc Tắt hướng dẫn)</span> bất cứ lúc nào!
          </>
        ),
        en: (
          <>
            Select a <span className="neon-green">Space Mission</span> on the left. You can also launch the{' '}
            <span className="neon-green">Sandbox Tutorial (Guided or Free)</span> anytime.
          </>
        ),
      },
    },
    {
      target: 'brief-start',
      title: { vi: '2. VÀO XƯỞNG CHẾ TẠO [02.BUILD]', en: '2. ENTER INTEGRATION BAY [02.BUILD]' },
      body: {
        vi: (
          <>
            Bấm <span className="neon-green">[ VÀO XƯỞNG CHẾ TẠO → ]</span> để bắt đầu thiết kế vệ tinh cho nhiệm vụ đã chọn!
          </>
        ),
        en: (
          <>
            Click <span className="neon-green">[ ENTER BUILD BAY → ]</span> to start designing the spacecraft for your selected mission.
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
  const [dockPos, setDockPos] = useState('top-right');
  const scrolledTargetRef = useRef('');

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
      } else {
        onClose();
      }
      return;
    }
    if (phase === 'life') {
      if (safeIndex < 7) {
        onStepChange(safeIndex + 1);
      } else if (safeIndex === 7) {
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
    if (safeIndex < 7) nextBtnLabel = tr(lang, 'TIẾP THEO →', 'NEXT');
    else if (safeIndex === 7) nextBtnLabel = tr(lang, 'BẮT ĐẦU VẬN HÀNH', 'START OPERATIONS');
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

          {phase === 'design' && safeIndex < SLOTS.length && buildInsightInfo?.ins && (
            <div className="eng-part-live-box">
              <div className="eng-part-live-title">
                {tr(lang, 'ĐANG CHỌN:', 'SELECTED:')}{' '}
                <span className="neon-green">{tx(buildInsightInfo.item.name, lang) || buildInsightInfo.item.id}</span>
              </div>
              <div className="eng-part-live-row">
                <b>{tr(lang, 'Dùng ở đâu:', 'Where used:')}</b> {tx(buildInsightInfo.ins.where, lang)}
              </div>
              <div className="eng-part-live-row pros">
                <b>{tr(lang, 'Lợi ích (+):', 'Pros (+):')}</b> {tx(buildInsightInfo.ins.pros, lang)}
              </div>
              <div className="eng-part-live-row cons">
                <b>⚠ {tr(lang, 'Tác hại (-):', 'Risks / Cons (-):')}</b> {tx(buildInsightInfo.ins.cons, lang)}
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
