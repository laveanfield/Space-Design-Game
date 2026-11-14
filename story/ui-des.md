# Đặc Tả Thiết Kế Giao Diện UI/UX & Mỹ Thuật 3D (`ui-des.md`)

Tài liệu này mô tả hệ thống nhận diện thị giác, bố cục chi tiết 4 Phase và nguyên tắc dựng cảnh 3D dựa trên ảnh concept tham chiếu, đồng thời giữ nguyên bản chất chân thực của mô hình 3D tên lửa & vệ tinh từ backend.

---

## 1. Định hướng Mỹ thuật (Art Direction)

### 1.1. Tách bạch Mỹ thuật 2D UI Chrome và 3D Hardware Viewport
- **Khung Giao diện 2D (Industrial Engineering Bunker):**
  - Lấy cảm hứng trực tiếp từ bảng điều khiển cơ khí nặng, bản vẽ kỹ thuật và hầm điều hành cổ điển: vỏ thép tán đinh, viền đồng xước, thẻ giấy ngả vàng kẹp trên bảng gỗ/nhôm (`Clipboard`), đèn báo cổ điển, và các thanh đo 10-nấc phát sáng.
  - Không làm giao diện web phẳng vô hồn; sử dụng đường viền đôi (double-bevel border), góc cắt vát kim loại, tem cảnh báo sọc chéo vàng-đen (hazard stripes) ở các nút hành động chính.
- **Khung 3D Viewport (Realistic Backend 3D Models):**
  - **Không cố ép model 3D theo nét vẽ hoạt hình 2D.** Toàn bộ mô hình 3D vệ tinh (`08-11-2026-satellite_models.py`) và 8 tên lửa (`07-11-2026-rocket_vehicles.py`) giữ nguyên:
    - Hình học chính xác theo tỷ lệ mét thật, kết nối khớp quay SADA và bản lề Z-fold.
    - Bề mặt vật liệu thực: sơn trắng/đen/cam trên thân tên lửa, vòi phun hợp kim tối màu, lớp bọc vàng **Kapton MLI**, khung nhôm xước, tế bào pin mặt trời xanh dương thẫm và procedural panel texture (`TW`, `TP`).
  - Sự hòa hợp giữa khung 2D và model 3D đạt được nhờ **hệ thống ánh sáng xưởng** (đèn tungsten vàng ấm rọi từ trên xuống nền bàn thép tối + viền sáng cyan/hổ phách nhẹ phản chiếu trên cạnh kim loại).

### 1.2. Bảng Màu (Color Palette) & Kiểu Chữ (Typography)

| Token | Mã màu | Vai trò sử dụng |
| :--- | :--- | :--- |
| `--bg-bunker` | `#121619` | Nền thép tối chủ đạo của xưởng và không gian điều hành |
| `--panel-steel` | `#1c2227` | Nền bảng điều khiển, khay thẻ linh kiện |
| `--border-brass` | `#9c6d3b` | Khung viền đồng thau / thép gỉ, thanh trượt chính |
| `--accent-amber` | `#f2b44b` | Nút hành động chính (`GO TO INSPECTION`, `FINISH INSPECTION`, `TẤN CÔNG`), cảnh báo cấp độ 1 |
| `--paper-clip` | `#ddd0b8` | Giấy kẹp bảng `INSPECTION CHECKLIST` & thẻ chứng cứ/báo cáo |
| `--badge-cheap` | `#c84b31` | Tem cảnh báo đỏ `[CHEAP/UNVERIFIED]`, lỗi `FAILURE`, `SIMULATION HALTED` |
| `--crt-ok` | `#52d18a` | Đèn báo đạt chuẩn, đường quỹ đạo an toàn, các vạch KPI ở ngưỡng tốt |
| `--scope-cyan` | `#5bc0eb` | Đường nét bản vẽ kỹ thuật, lưới tọa độ Oscilloscope, chỉ dẫn chi tiết trên 3D |

- **Typography:**
  - Tiêu đề Phase / Nút bấm công nghiệp: Font chữ đậm góc cạnh viết hoa toàn bộ (`Oswald` / `Chakra Petch` / `Courier Prime Bold`), letter-spacing rộng (`0.08em`).
  - Thông số & Dossier kỹ thuật: `Fira Code` / `IBM Plex Mono` đảm bảo căn hàng cột số liệu thẳng tắp.

---

## 2. Chi tiết Giao diện 4 Phase (Đối chiếu Concept)

### 2.1. Màn hình `PHASE 1: BUILD MODE` (Tương ứng góc dưới-trái ảnh mẫu)
- **Thanh Header (trên cùng):**
  - Trái: Hộp nhãn thép `[ PHASE 1: BUILD MODE ]` + nút chuyển nhanh `LEVEL 1 / 2 / 3`.
  - Giữa: Bảng ngân sách lớn **`[ BUDGET: $42.5M / $75M ]`** (đổi màu đỏ nhấp nháy nếu chọn vượt ngân sách).
  - Phải: Bảng tiến độ **`[ DEADLINE: MONTH 14 / 10 ]`** (hiện cảnh báo `-15s Inspection Time` nếu lố deadline của Sếp).
- **Cột Trái (~320px — Kho Linh kiện Rút gọn):**
  - Hàng tab icon/chữ ngắn gọn cho từng hệ thống con: `ORBIT`, `INSTR`, `BUS`, `POWER`, `BATT`, `COMM`, `OBC`, `ADCS`, `ROCKET`.
  - **Thẻ Linh kiện tối giản (tối đa 3–4 dòng, bỏ hoàn toàn Science):**
    - Dòng 1: Tem trạng thái: `[CHEAP/UNVERIFIED]` (viền cam/đỏ sọc chéo), `[OVER-DEADLINE]` (tím/vàng), hoặc `[NASA FLIGHT READY]` (xanh).
    - Dòng 2: Icon/Hình minh họa + Tên linh kiện ngắn gọn (`OBC-CUBE`, `LV-VEGAC`, ...).
    - Dòng 3–4: Chỉ 3 thông số gọn: `Cost: $...M` | `Mass: ...kg` | `Spec/Risk ngắn` (VD: `Lead: 14 mo` hoặc `Rad: Low`).
- **Vùng Trung tâm (Bàn Lắp Ráp 3D + Oscilloscope Quỹ đạo):**
  - Phía trên / chính giữa: Bàn bệ thử kim loại có chao đèn rọi từ trần xưởng. Vệ tinh 3D hoặc Cụm Tên lửa 3D gốc xoay chậm để người chơi quan sát trực tiếp kích thước thật khi thay đổi `Bus` / `Comm` / `Rocket`. Có công tắc gạt **`[VIEW: SAT 3D | ROCKET 3D]`** và **`[TOGGLE SOLAR WINGS]`** để thử khớp gập/mở pin ngay trên bàn.
  - **Góc phải-dưới của khu vực 3D — `LIVE ASCENT TRAJECTORY SCOPE`:**
    - Màn hình radar/oscilloscope nhỏ gắn liền ngay dưới bản vẽ 3D, **vẽ lại tức thì sau mỗi cú click đổi linh kiện**:
      - Vòng cung cong mặt đất + lớp khí quyển xanh mờ.
      - Đường bay parabol/quỹ đạo dự kiến theo độ cao (`km`) & tầm ngang (`km`), đánh dấu các điểm `MAX-Q`, `MECO`, `APOGEE`.
      - Đổi màu xanh phosphor nếu dự báo đạt quỹ đạo; chuyển vàng/đỏ đứt đoạn kèm chữ `SUBORBITAL / IMPACT` hoặc `EXCESS MASS` nếu tên lửa không cõng nổi cấu hình hiện tại.
- **Thanh Đáy (Footer Telemetry & Action):**
  - Trái đến giữa: **4 Thanh Đo Phân Đoạn 10-Vạch (`Segmented LED Bars`):**
    - `POWER` | `MASS` | `SIGNAL` | `INTEGRITY` (mỗi thanh chỉ hiển thị phần trăm mức độ an toàn bằng màu xanh/vàng/đỏ, không nhồi chữ số phức tạp).
  - Phải: Nút bấm cơ khí viền sọc vàng-đen lớn **`[ GO TO INSPECTION ]`** — **luôn khả dụng để người chơi tự tin phóng bất chấp thiết kế đúng hay sai**.

---

### 2.2. Màn hình `PHASE 2: PRE-FLIGHT INSPECTION` (Tương ứng góc trên-trái ảnh mẫu)
- **Thanh Header:**
  - Trái: `[ PHASE 2: PRE-FLIGHT INSPECTION ]` + Số lỗi đã tìm `FOUND: 1 / 3`.
  - Phải: **Đồng hồ cát & Đếm ngược LED lớn `00:45`** (nền hổ phách; chuyển đỏ rực và nhấp nháy kèm tiếng tích tắc khi còn `< 10s`).
- **Cột Trái (Kẹp Giấy `INSPECTION CHECKLIST`):**
  - Thiết kế giống tờ giấy ghi chú kẹp trên bảng kim loại có kẹp sắt trên đầu.
  - Liệt kê 6 hạng mục cố định trên mọi chuyến bay:
    - `THRUSTER COUPLING`
    - `AVIONICS BANK`
    - `FUEL LINES`
    - `SOLAR APERTURE`
    - `PAYLOAD INTERFACE`
    - `SATELLITE ALIGN`
  - Người chơi click tích `[x]` sau khi soi trúng vùng lỗi trên 3D (hoặc click trực tiếp vào điểm lỗi trên mô hình 3D để tự động sửa `[FIXED]`).
- **Vùng Trung tâm (Phòng Tối Kiểm Định 3D + Đèn Soi X-Ray):**
  - Toàn bộ tên lửa 3D (gắn sẵn vệ tinh mở nắp fairing cắt lớp nhẹ hoặc chuyển mode soi Tên lửa ↔ Vệ tinh) được đặt trên bệ kiểm định ở giữa phòng tối.
  - **Hiệu ứng Đèn Soi Tương Tác (`X-RAY LANTERN / SPOTLIGHT CONE`):**
    - Không gian xung quanh tối dịu (`ambient` thấp); một chùm sáng `SpotLight` hội tụ bám theo con trỏ chuột (hoặc đèn treo có thể kéo thả) chiếu rọi dọc thân tên lửa & vệ tinh.
    - **Dấu hiệu lỗi được thiết kế tinh tế ("ẩn ẩn 1 xíu"):** Không khoanh vòng đỏ to tướng. Chỉ khi chùm sáng quét đúng khu vực lỗi mới thấy:
      - *Lệch loa phụt:* 1 bell nozzle nghiêng lệch `4°` so với cụm xung quanh.
      - *Rò rỉ nhiên liệu:* Hạt sương lạnh mảnh bay ngang tại đường ống thân.
      - *Hỏng khớp pin / Avionics:* Tia lửa điện nhỏ lóe thưa + khớp nối nhấp nháy nhẹ.
      - *Chốt tách tầng kẹt / Lệch Star Tracker:* Ngàm kẹp hoặc ống ngắm lệch nhẹ góc trục.
- **Thanh Đáy (Bảng Đồng Hồ Cơ Học & Phê duyệt Phóng):**
  - Gồm 4 đồng hồ tròn kim vặt (`Pressure`, `Bus Voltage`, `Avionics Sync`, `Structural Vib`) + đèn báo nhỏ: khi con trỏ đèn soi tiến lại gần vị trí có lỗi ẩn (bán kính `< 1.5m` trong không gian 3D), **kim đồng hồ tương ứng rung lắc và âm thanh nhiễu `static_noise.wav` tăng âm lượng nhẹ**, gợi ý người chơi soi kỹ vùng đó.
  - Phải: Nút cơ khí vàng-đen **`[ FINISH INSPECTION ]`** (chốt kết quả ngay khi đã tìm đủ 3/3 lỗi trước khi hết giờ).

---

### 2.3. Màn hình `PHASE 3: LAUNCH & ORBIT SIMULATION` (Hỗ trợ Phóng 3D, Nổ & Vòng Đời 12 Tháng)
- **Giai đoạn 3A — Phóng Tên Lửa 3D (`3D ASCENT & EXPLOSION`):**
  - Camera bám theo tên lửa 3D thật rời bệ phóng (`SITE-CAPE`, `SITE-KOUROU`, `SITE-MAHIA`...):
    - Hiệu ứng khói bệ phóng dày đặc cuộn quanh dàn thép phóng.
    - Ngọn lửa động cơ đổi màu theo loại nhiên liệu (hydrolox xanh nhạt, kerolox vàng cam sáng, solid trắng chói).
    - Theo sát các mốc tách booster bên hông, tách tầng 1, bung 2 nửa fairing để lộ vệ tinh 3D bung cánh pin.
    - Các nhãn chỉ thị tối giản góc trên: `MET T+...s | ALT ... km | VEL ... km/s | STAGE ...`.
  - **Cảnh báo & Hiệu ứng Nổ (`FAILURE EXPLOSION`):**
    - Khi gặp lỗi lắp ráp nghiêm trọng từ Phase 2 hoặc quá tải rơi xuống đất: tên lửa rung lắc dữ dội (`camera shake`), khói đen phụt ra ở vị trí hỏng trong `0.8s`, sau đó **bùng nổ quả cầu lửa lớn + vòng sóng xung kích trắng cam + mảnh thân vỏ/booster bắn văng xoay tròn** trong không gian 3D kèm banner đỏ `[ CRITICAL LAUNCH FAILURE ]` và nút quay lại xưởng/soát lỗi.
- **Giai đoạn 3B — Mô phỏng Vòng đời 12 Tháng (`ORBIT SURVEILLANCE`, tương ứng góc dưới-phải ảnh mẫu):**
  - Bố cục mô phỏng Trạm Giám sát Quỹ đạo:
    - Trái Đất 3D (`earth_bluemarble.jpg`) ở giữa, bao quanh bởi 3 vòng quỹ đạo nét đứt mảnh; vệ tinh 3D quay dọc theo vòng quỹ đạo với tốc độ nhanh theo mốc **`MONTH 1 → MONTH 12`**.
    - Cạnh vệ tinh hiển thị tem tiến độ (`MONTH 3`) và các vệt nhiễu / tia lửa / tắt pin trên chính model 3D nếu bước vào tháng hỏng.
  - **Hộp thoại Sự cố Dừng Mô Phỏng (`⚠ SIMULATION HALTED`):**
    - Khi thiết kế gãy tại một tháng (VD: Tháng 3 ở Level 1 hoặc Tháng 6 ở Level 2), toàn màn hình chớp khung đỏ nhẹ, bật bảng hồ sơ nền thép xám đóng khung viền cảnh báo:
      - Tiêu đề đỏ: **`FAILURE: <TÊN LỖI HỆ THỐNG>`**
      - Chi tiết hồ sơ giấy bên dưới: `ROOT-CAUSE`, `SUB-SYSTEM`, giải thích vật lý ngắn gọn (1–2 câu súc tích).
    - Nút đáy trung tâm: **`[ PRESENT PROOF TO DIRECTOR ]`** để bước ngay vào màn đối chất Phase 4.

---

### 2.4. Màn hình `PHASE 4: BOSS CONFRONTATION ("CHẤT VẤN SẾP")` (Tương ứng góc trên-phải ảnh mẫu)
- **Tiêu đề lớn phía trên:** Bảng gỗ/đồng **`BOSS CONFRONTATION // CHẤT VẤN SẾP`**.
- **Sân khấu Đối chất:**
  - **Bên trái:** Nhân vật **Kỹ sư trưởng** đội mũ bảo hộ & kính hàn, giơ tờ **`TECHNICAL REPORT`** đóng dấu đỏ, kèm bong bóng thoại chỉ thẳng lỗi hệ thống (*"Lỗi hệ thống thế này, Sếp giải thích sao?!"*).
  - **Bên phải:** **Ông Sếp Penny-Pincher** đội mũ chóp, kính một mắt, tay ôm cặp hồ sơ/tiền, đổ mồ hôi với biểu cảm chuyển đổi theo đòn tấn công (ngạo mạn → giật mình → cúi đầu nhượng bộ).
- **Khay `CHỌN CHỨNG CỨ` (ở giữa dưới):**
  - 3 thẻ hồ sơ có hình minh họa + nhãn rõ ràng:
    1. **`BÁO CÁO LỖI`** (Kết quả vật lý thu được từ chuyến bay Phase 3).
    2. **`HÓA ĐƠN / NGÂN SÁCH`** (Chứng từ cắt xén tiền bạc xuống dưới ngưỡng linh kiện chuẩn).
    3. **`SỔ ĐEN / LỆNH TIẾN ĐỘ CỦA SẾP`** (Giấy ép deadline 10 tháng / nhật ký mua đồ tồn kho).
  - Người chơi click chọn thẻ bằng chứng phản bác chính xác (hoặc ghép cặp chứng cứ theo gợi ý).
- **Thanh Tiến Trình & Nút Hành Động (đáy màn hình):**
  - Giữa: **`NGÂN SÁCH ĐÃ MỞ KHÓA`** có vạch chia đồng hồ cơ + số tiền/quyền hạn mới mở khóa (`$75M → $160M` hoặc mở khóa `Flight Heritage`).
  - Trái: **`[ RÚT LUI ]`** (quay lại Phase 1 của level hiện tại).
  - Phải: **`[ TẤN CÔNG ]`** (tung đòn chất vấn bằng thẻ chứng cứ đang chọn; phản hồi rung màn hình nhẹ + âm thanh đóng dấu cộp!).

---

## 3. Trạng thái Âm thanh & Tương tác Phản hồi (Audio & Micro-Feedback)
- **Tái sử dụng kho âm thanh gốc trong `Project/fe/public/sounds/`:**
  - Phase 1: Tiếng lách cách công tắc kim loại (`06-11-2026-click.wav`, `08-11-2026-relay_click.wav`) mỗi khi gắn linh kiện; tiếng bíp cảnh báo nhẹ (`06-11-2026-blip.wav`) nếu quỹ đạo dự báo chuyển sang vùng đỏ `IMPACT`.
  - Phase 2: Nhịp tích tắc đếm ngược cuối giờ; tiếng nhiễu tĩnh điện (`08-11-2026-static_noise.wav`) / tiếng rít con quay (`08-11-2026-gyro_whine.wav`) êm nhưng rõ khi đèn soi lướt trúng vùng chứa lỗi; tiếng bíp xác nhận (`06-11-2026-beep_go.wav`) khi sửa xong từng lỗi.
  - Phase 3: Âm thanh đếm ngược & đánh lửa (`06-11-2026-clamp_release.wav`, `06-11-2026-ignition.wav`, `06-11-2026-engine_roar.wav`, `06-11-2026-sonic_boom.wav`, `06-11-2026-stage_sep.wav`, `06-11-2026-fairing_sep.wav`); còi báo động & hiệu ứng âm thanh nổ / lỗi (`08-11-2026-alarm.wav`, `08-11-2026-power_down.wav`, `08-11-2026-seu_crackle.wav`).
  - Phase 4: Âm thanh đóng dấu / bíp chiến thắng (`06-11-2026-chime.wav`) khi chất vấn thành công Sếp để mở khóa Level tiếp theo.
