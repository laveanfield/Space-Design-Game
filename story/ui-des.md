# Đặc Tả Thiết Kế Giao Diện UI/UX & Kiến Trúc Màn Hình (`ui-des.md`)

Tài liệu này mô tả hệ thống nhận diện thị giác theo chuẩn **Mission Control CRT Terminal**, kiến trúc tách màn hình theo Game Design Pattern (`State Machine + Screen Registry`), và nguyên tắc dựng cảnh 3D chân thực từ backend (`be/tools/14-11-2026-bake_models3d.py`).

---

## 1. Định hướng Mỹ thuật: Mission Control Terminal + Realistic 3D Hardware

### 1.1. Thống nhất Giao diện 2D theo chuẩn CRT Terminal (`styles.css`)
- **Nền điều khiển chủ đạo:** CRT Terminal xanh lá phosphor (`--bg: #060b09`, `--bg-panel: #0b1411`, `--accent: #38e594`, `--border: #1e3d31`, font `Fira Code / monospace`) xuyên suốt toàn bộ 6 phase, kể cả lớp liên lạc cốt truyện (`StoryScene` dạng `SECURE TERMINAL COMM-LINK // CH-04`, bỏ hoàn toàn hộp thoại visual novel hoạt hình).
- **Màu cảnh báo kỹ thuật:** Vàng hổ phách (`--warn: #ffb84d`) cho cảnh báo `[CHEAP / UNVERIFIED]`, `[OVER-DEADLINE]`, dao động ký cảnh báo; đỏ (`--err: #ff5c6c`) cho `FAILURE`, `MAX-Q BREAKUP`, `SIMULATION HALTED`, đồng hồ soi lỗi `< 10s`.
- **Giữ nguyên bản Model 3D từ Backend:** Toàn bộ tên lửa (8 dòng), 56 tổ hợp vệ tinh và 10 bãi phóng đã bake sẵn (`.json`/`.bin`) được render chân thực trong các viewport Three.js với vật liệu thực (Kapton vàng, tấm pin mặt trời xanh dương thẫm, kim loại/hợp kim tên lửa).

---

## 2. Kiến trúc Frontend theo Game Design Pattern (`Project/fe/src/`)

Thay vì nhồi toàn bộ giao diện và logic vào `App.jsx`, Frontend được tách thành 3 tầng rõ ràng:

1. **Finite State Machine & Rules (`src/core/gameMachine.js`):**
   - `PHASES`: `01.BRIEF` → `02.BUILD` → `03.INSPECT` → `04.LAUNCH_3D` → `05.ORBIT_12M` → `06.REVIEW` (cùng 2 màn phụ `ops`, `debrief`).
   - `canEnterPhase(...)`, `computeCoreBars(...)` (tính 4 thanh 10-nấc `POWER`, `MASS`, `SIGNAL`, `INTEGRITY`), `generateInspectionDefects(...)` (random 3 lỗi ẩn), `evaluateInspectionOutcome(...)`.
2. **Centralized Game Controller (`src/core/GameContext.jsx`):**
   - Quản lý toàn bộ state chiến dịch, tự động gọi `POST /fly` (`allow_nofit: true`) để cập nhật biểu đồ quỹ đạo mỗi khi đổi linh kiện, xử lý hậu quả kiểm định Phase 03, và cấp `applyBossOverride()` khi chất vấn Sếp thành công.
3. **Screen Registry (`src/screens/*` & `src/App.jsx` ~120 dòng):**
   - `BriefScreen.jsx` (`01.BRIEF`): Chọn nhiệm vụ, xem `BUDGET LIMIT`, `DEADLINE / MIN LIFE` (loại bỏ chỉ số `SCIENCE`).
   - `BuildScreen.jsx` (`02.BUILD`): Kho linh kiện gắn tem `[CHEAP / UNVERIFIED]`, `[OVER-DEADLINE]`, `[FLIGHT-HERITAGE]`, không khóa chọn linh kiện sai; viewport 3D Hangar + `TrajectoryScope` tự động cập nhật + `CoreTelemetryBars` 4 thanh 10-nấc.
   - `InspectScreen.jsx` (`03.INSPECT`): Phòng tối kiểm định 3D với model tên lửa (fairing X-Ray trong suốt) + vệ tinh; đèn soi `SpotLight` theo con trỏ chuột; 3 lỗi ngẫu nhiên ẩn tinh tế chỉ lộ rõ khi rọi đèn vào gần kèm 4 thanh dao động ký (`PRESSURE_DIFF`, `BUS_RIPPLE`, `EMI_NOISE`, `STRUCT_VIB`) và đồng hồ đếm ngược `45s` (bị trừ `-5s/tháng` nếu vượt deadline).
   - `LaunchScreen.jsx` (`04.LAUNCH_3D`): Phóng tên lửa 3D (`Launch3DCanvas`) kèm hiệu ứng nổ cầu lửa + mảnh vỡ nếu vỡ fairing (`allow_nofit`), quá tải Max-Q, hụt delta-v, hoặc bỏ sót lỗi kiểm định nhóm tên lửa.
   - `OrbitScreen.jsx` (`05.ORBIT_12M`): Giám sát vòng đời 12 tháng (`LifePhase`) kèm Trái Đất 3D và ảnh target; chết sớm ở tháng 2 nếu bỏ sót lỗi kiểm định vệ tinh.
   - `ReviewScreen.jsx` (`06.REVIEW`): Hồ sơ nguyên nhân gốc (`Dossier`) + `BossConfrontation` (`DIRECTOR AUDIT // CHẤT VẤN SẾP`) với 3 hồ sơ chứng cứ `[DOC-01..03]` để phản biện Sếp và mở khóa `+$80M` ngân sách + `+18` tháng hạn chót.
   - `OpsSandboxScreen.jsx` (`ops` / `debrief`): Tách riêng chế độ vận hành tay ADCS/RCS và Pareto Advisor.
