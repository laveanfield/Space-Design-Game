# Đặc Tả Thiết Kế Game & Kiến Trúc Kỹ Thuật (`spec.md`)

Tài liệu này mô tả thiết kế gameplay theo chiến dịch **3 Level × 4 Phase**, cơ chế mô phỏng vật lý thực tế, và kế hoạch tích hợp trọn vẹn **bộ Backend 3D + Quỹ đạo phóng đa tầng** từ `Game Demo` vào hệ thống `Project/be` (Python / FastAPI) và `Project/fe` (React / Vite / Three.js).

---

## 1. Tổng quan Core Loop & Triết lý Thiết kế

### 1.1. Bối cảnh & Cốt truyện ("Papers, Please × Apollo 13 / Kerbal")
- **Vai trò người chơi:** **Kỹ sư trưởng (Chief Space Systems Engineer)** tại Cục Giám sát Khí hậu & Thảm họa (`Dept. of Orbital Surveillance`).
- **Nhân vật phản diện hài hước:** **Ông Sếp Kế Toán Keo Kiệt (Director Penny-Pincher)** — người không hiểu vật lý không gian, luôn cắt xén ngân sách, ép tiến độ phi thực tế trước báo chí và nhập linh kiện trôi nổi giá rẻ (`[CHEAP/UNVERIFIED]`, `[SURPLUS]`).
- **Đường cong cảm xúc qua 3 Level:**
  1. Bị Sếp ép dùng đồ rẻ tiền → Phóng thành công nhưng vệ tinh chết ở Tháng 3 → Lấy báo cáo vật lý đập bàn chất vấn Sếp để đòi tiền.
  2. Có tiền nhưng bị Sếp ép tiến độ 10 tháng → Thiếu thời gian soi lỗi hoặc buộc phải lắp linh kiện yếu → Sập nguồn / tụt quỹ đạo ở Tháng 6 → Tiếp tục chất vấn Sếp đòi quyền tự chủ tiến độ.
  3. Mở khóa toàn bộ ngân sách & linh kiện chuẩn NASA (`Flight Heritage`) → Tự cân bằng thiết kế + soi sạch 3 lỗi lắp ráp → Giữ vệ tinh sống trọn **12/12 Tháng**.

### 1.2. Bốn Nguyên tắc Gameplay Cốt lõi
1. **Tự do phóng 100% ("Launch Anything"):**
   - **Không khóa** nút chuyển sang Inspection hay nút Phóng khi thiết kế vi phạm ràng buộc kỹ thuật (thiếu điện, quá tải tên lửa, chịu bức xạ kém, sai độ chính xác ADCS).
   - Loại bỏ điểm **Science** khỏi giao diện chế tạo và điều kiện chặn phóng: giá trị của thiết kế được chứng minh bằng việc tên lửa có lên được quỹ đạo không và vệ tinh có sống sót qua **12 Tháng** hay không.
   - Mọi thiết kế lỗi vẫn được phép phóng để người chơi trực tiếp chứng kiến hậu quả vật lý (không rời nổi bệ, nổ ở Max-Q, hụt nhiên liệu rơi lại khí quyển, hoặc chết dần trên quỹ đạo).
2. **Tối giản thông số ở màn Build (Chỉ giữ 4 KPI sống còn):**
   - Bỏ các bảng số liệu chằng chịt ở màn chế tạo; thay bằng **4 thanh chỉ số trực quan (`0..100%`)**:
     - `POWER`: Cân bằng công suất phát / tải trung bình & dung lượng pin qua vùng tối (`eclipse`).
     - `MASS`: Tổng khối lượng tàu (`dry_kg`) so với tải trọng tối đa của tên lửa ở quỹ đạo chọn và giới hạn khung (`bus_limit_kg`).
     - `SIGNAL`: Tỷ lệ khả năng hạ dữ liệu / dữ liệu sinh ra và độ chính xác chỉ hướng ADCS (`downlink` & `pointing`).
     - `INTEGRITY`: Độ bền bức xạ (`rad_tolerance_krad` so với tổng liều 12 tháng tại quỹ đạo) và độ tin cậy linh kiện.
   - Các thông số nguy cơ ẩn (như tuổi thọ krad, thời gian chờ chế tạo dài) chỉ hiển thị dưới dạng nhãn cảnh báo ngắn / mờ trên thẻ linh kiện (ví dụ `[CHEAP/UNVERIFIED]`) thay vì phơi hết công thức chi tiết.
3. **Biểu đồ Quỹ đạo Phóng Thời gian thực (Live Ascent Trajectory Preview):**
   - **Mỗi lần người chơi đổi bất kỳ linh kiện nào** (Bus, Instrument, Pin, Tên lửa, Bãi phóng, Quỹ đạo), backend/engine tính lại ngay đường bay phóng 2D dựa trên tổng khối lượng thực tế và tham số 8 dòng tên lửa (`07-11-2026-rocket_orbit_multi.py`), cập nhật biểu đồ quỹ đạo dự kiến ngay trên bàn chế tạo:
     - Đạt quỹ đạo ổn định (`perigee / apogee` xanh).
     - Hụt nhiên liệu tầng trên (`SECO1_EMPTY` — đường bay cong xuống sớm).
     - Quá tải / TWR < 1 hoặc rơi lại mặt đất (`IMPACT` — vùng cảnh báo đỏ).
4. **Giữ nguyên bản Model 3D chân thực từ Backend:**
   - **Không** gò ép model 3D của tên lửa và vệ tinh theo shader hoạt hình 2D của giao diện.
   - Giao diện 2D mang phong cách xưởng kỹ thuật công nghiệp (*Industrial Brass / Steel*), còn bên trong viewport 3D giữ nguyên hình khối, tỷ lệ mét thực, lớp bọc vàng MLI, tấm pin quang điện xanh đậm, loa phụt và màu sơn gốc của `08-11-2026-satellite_models.py` và `07-11-2026-rocket_vehicles.py`.

---

## 2. Cấu trúc Chi tiết 4 Phase trong Mỗi Level

### 2.1. Phase 1: `BUILD MODE` (Xưởng Chế Tạo & Quỹ đạo Dự Báo)
- **Các nhóm linh kiện lựa chọn:**
  - `Orbit`: Quỹ đạo mục tiêu (`ORB-LEO-400`, `ORB-LEO-500`, `ORB-SSO-600`, `ORB-MEO-20200`, ...).
  - `Instrument`: Thiết bị quan sát (bỏ `science_value_pts`; chỉ dùng `mass_kg`, `avg_power_w`, `data_generated_gb_per_day`, `pointing_required_deg`).
  - `Bus`: 7 loại khung vệ tinh chuẩn (`BUS-3U`, `BUS-6U`, `BUS-12U`, `BUS-ESPA`, `BUS-SMALL500`, `BUS-LARGE-LEO`, `BUS-GEO`).
  - `Power Array` (`PWR-SA-*`) & `Battery` (`BAT-*`).
  - `Comm` (`COM-UHF`, `COM-S-CUBE`, `COM-X-SMALL`, `COM-KA-LEO`, `COM-OPT-LEO`, `COM-X-MGA`, `COM-X-HGA`, `COM-KA-GEO`).
  - `Avionics`: Máy tính (`OBC-*`) và Hệ điều hướng (`ADCS-*`).
  - `Launch Vehicle` (`LV-ELECTRON`, `LV-VEGAC`, `LV-ARIANE62`, `LV-ARIANE64`, `LV-LVM3`, `LV-VULCAN-VC6`, `LV-NEWGLENN`, `LV-H3-24L`) & `Launch Site` (`SITE-*`).
- **Ràng buộc Quản lý của Sếp (Management Rules):**
  - `Budget ($M)`: Nếu vượt quá ngân sách Sếp giao, nút chuyển tiếp vẫn cảnh báo đỏ hoặc chặn mua món vượt trần tùy cấu hình Level (ở Level 1–2 ngân sách đóng khung để **ép người chơi phải chọn đồ rẻ/trôi nổi** nhằm tạo tình huống cốt truyện; ở Level 3 đủ tiền cho nhiều phương án).
  - `Deadline (Months)`: Tính theo `lead_time_months` lớn nhất (hoặc tổng chuỗi cung ứng theo quy tắc level) của linh kiện đã chọn. **Nếu vượt `Deadline`**, hệ thống vẫn cho phép đi tiếp sang Phase 2 nhưng **trừ trực tiếp thời gian soi lỗi ở Phase 2** (mỗi tháng trễ trừ `5–8 giây`, tối thiểu còn `15 giây`).
- **Phản hồi tức thời khi đổi bất kỳ linh kiện nào:**
  1. Cập nhật Model 3D Vệ tinh / Tên lửa thật trên giàn lắp ráp.
  2. Cập nhật 4 thanh KPI: `POWER`, `MASS`, `SIGNAL`, `INTEGRITY`.
  3. Gọi tính toán quỹ đạo phóng đa tầng RK4 (hoặc bản rút gọn bước thời gian nhanh) và vẽ lại **Live Trajectory Plot** + các mốc `MAX-Q`, `MECO`, `SECO`, `APO/PERI`.

### 2.2. Phase 2: `PRE-FLIGHT INSPECTION` (Soi Lỗi Lắp Ráp Giới Hạn Thời Gian)
- **Thời gian kiểm tra:** Mặc định `45s` (bị giảm xuống tối đa còn `15s` nếu bị phạt tiến độ từ Phase 1).
- **Cơ chế Random Lỗi Ẩn (`3 lỗi / lượt chơi`):**
  - Mỗi lần bước vào Phase 2, backend/engine random **3 lỗi lắp ráp vật lý** gắn vào các tọa độ thật trên model 3D của Tên lửa + Vệ tinh từ 6 nhóm trong `INSPECTION CHECKLIST`:
    1. `THRUSTER COUPLING` (*Lệch / lỏng cổ góp loa phụt động cơ*): Loa phụt nghiêng nhẹ ~`3–5°`, vòng cổ loa có khe hở rất mảnh.
    2. `AVIONICS BANK` (*Lỏng cáp / chập xung nhịp hộp OBC-ADCS*): Khớp nối cụm điện tử nhấp nháy tia tĩnh điện cực nhỏ khi đèn soi lướt qua.
    3. `FUEL LINES` (*Rò rỉ vi mô ống dẫn nhiên liệu lạnh*): Vệt sương trắng rất mảnh thoát ra ở cụm ống raceway thân tầng.
    4. `SOLAR APERTURE` (*Kẹt chốt hoặc ngược cực bản lề `SADA` pin mặt trời*): Khớp bản lề `wR0` / `wL0` lệch chốt giữ.
    5. `PAYLOAD INTERFACE` (*Kẹt nắp bảo vệ / lệch ngàm adapter tải trọng*): Có tấm che mờ trên thấu kính hoặc vòng adapter lệch nhẹ.
    6. `SATELLITE ALIGN` (*Lệch trục căn chỉnh Star Tracker / Antenna*): Cảm biến sao / đĩa anten nghiêng nhẹ ngoài trục chuẩn.
- **Tính chất "Ẩn ẩn 1 xíu" & Cách tương tác:**
  - Khi nhìn tổng thể bằng mắt thường dưới ánh sáng xưởng dịu, lỗi rất khó nhận ra (không tô đỏ phát sáng lộ liễu).
  - Người chơi sử dụng **Đèn Soi X-Ray / Kiểm Định (Inspection Cone)** bám theo vị trí con trỏ chuột quét lên bề mặt 3D (có thể xoay/zoom mô hình):
    - Khi tâm đèn tiến gần vùng chứa lỗi: ánh sáng cường độ cao làm lộ khe hở / độ lệch / hạt sương / tia lửa mảnh; đồng thời **4 đồng hồ kim cơ học bên dưới rung nhẹ kèm tiếng nhiễu `static_noise.wav` / `gyro_whine.wav`**.
    - Click vào vùng lỗi trên 3D (hoặc xác nhận trên `INSPECTION CHECKLIST`) để khắc phục (`FIXED [x]`).
- **Quy tắc Hậu quả khi kết thúc Phase 2 (`[ FINISH INSPECTION ]` hoặc hết giờ):**
  - **Còn $\ge 2$ lỗi chưa sửa (hoặc còn 1 lỗi chí tử thuộc nhóm `THRUSTER COUPLING` / `FUEL LINES`):** Tên lửa **nổ tung ở Phase 3A** (tại điểm `MAX-Q` hoặc `MECO / STAGE_SEP`).
  - **Còn 1 lỗi thuộc phần Vệ tinh (`SOLAR APERTURE`, `PAYLOAD INTERFACE`, `SATELLITE ALIGN`, `AVIONICS BANK`):** Tên lửa bay lên được quỹ đạo, nhưng **vệ tinh lên quỹ đạo trong trạng thái tật nguyền** (1 cánh pin không mở hết, ống kính bị mờ hoặc mất định hướng) → **chết sớm tại Tháng 1–2** ở Phase 3B (và ở Phase 4 Sếp sẽ từ chối nhận trách nhiệm vì đây là lỗi lắp ráp của đội kiểm tra).
  - **Sửa sạch 3/3 lỗi:** Phóng sạch về mặt lắp ráp, bước sang Phase 3 để kiểm chứng **vật lý thiết kế** thực thụ.

### 2.3. Phase 3: `LAUNCH & 12-MONTH ORBIT SIMULATION` (Phóng 3D, Nổ & Vòng đời 12 Tháng)
- **Giai đoạn 3A — Phóng Tên Lửa 3D (`Ascent Replay`):**
  - Sử dụng hình học thật của tên lửa đã chọn (`07-11-2026-rocket_vehicles.py`) + bệ phóng (`07-11-2026-launch_sites_m2.py`).
  - Diễn hoạt rời bệ, khói bệ phóng, luồng lửa động cơ theo loại nhiên liệu (`kerolox`, `hydrolox`, `methalox`, `solid`, `hypergolic`), tách booster, tách tầng (`MECO`), bung hai nửa `fairing`, và triển khai cánh pin + anten vệ tinh (`SatEntity.set_deploy(0..1)`).
  - **Hiệu ứng Nổ 3D (`Explosion FX`):**
    - Kích hoạt khi: (1) Sót lỗi nghiêm trọng từ Phase 2 (`MAX-Q` / tách tầng), (2) Thiết kế vệ tinh quá nặng khiến tên lửa mất kiểm soát / rơi lại khí quyển (`IMPACT`), hoặc (3) `TWR < 1.0` ngay tại bệ phóng.
    - Gồm: Quả cầu lửa giãn nở nhanh + vòng sóng xung kích + hàng chục mảnh vỡ tách từ các bộ phận thân/booster/tải trọng xoay lộn văng theo vận tốc tiếp tuyến + rung lắc camera + âm thanh nổ & còi báo động (`alarm.wav`).
    - Sau khi nổ, hiển thị nguyên nhân tai nạn (lỗi soi sót hay quá tải khối lượng) để người chơi quay về Phase 1/2 sửa lại.
- **Giai đoạn 3B — Mô phỏng Vòng đời Quỹ đạo `MONTH 1 → MONTH 12`:**
  - Nếu đạt quỹ đạo an toàn, camera chuyển sang Trái Đất 3D (`earth_bluemarble.jpg`) với vệ tinh 3D quay trên đường quỹ đạo thực tế (`inclination_deg`, `altitude_km`) và thanh tiến độ chạy từ **`MONTH 1` → `MONTH 12`**.
  - Động cơ sự cố dựa trên `08-11-2026-fault_fx.py` và `mission_engine/session/ops.py` tính toán trạng thái mỗi tháng:
    - Nếu không có lỗi hệ thống: Vệ tinh hoạt động đủ **12/12 Tháng**, truyền dữ liệu thành công → Chiến thắng màn chơi.
    - Nếu thiết kế bị lỗi hệ thống (do Sếp bóp ngân sách/tiến độ ở Level 1–2 hoặc người chơi thiết kế sai ở Level 3): Đúng tới tháng gãy (ví dụ **Tháng 3** cho lỗi bức xạ `OBC`, **Tháng 6** cho sập nguồn `eclipse` / tụt quỹ đạo `LEO-400`), cảnh báo đỏ `⚠ SIMULATION HALTED` bật lên kèm hiệu ứng tia lửa/mất liên lạc trên vệ tinh 3D, mở bảng **`FAILURE: ROOT-CAUSE DOSSIER`** và nút **`[ PRESENT PROOF TO DIRECTOR ]`**.

### 2.4. Phase 4: `BOSS CONFRONTATION` ("Chất Vấn Sếp")
- Diễn ra sau khi có báo cáo lỗi từ Phase 3B (hoặc tổng kết chiến thắng ở Level 3).
- Hiển thị Kỹ sư trưởng (cầm `TECHNICAL REPORT`) đối chất với **Sếp Penny-Pincher**.
- Người chơi có **3 thẻ Chứng Cứ (`EVIDENCE CARDS`)** trên bàn (ví dụ: `BÁO CÁO LỖI KỸ THUẬT`, `HÓA ĐƠN CẮT GIẢM NGÂN SÁCH`, `LỊCH TRÌNH ÉP TIẾN ĐỘ / SỔ ĐEN CỦA SẾP`).
- Người chơi chọn thẻ bằng chứng chứng minh **lỗi xảy ra xuất phát từ quyết định bóp ngân sách / ép tiến độ của Sếp** và nhấn **`[ TẤN CÔNG ]`**:
  - Nếu khớp nguyên nhân gốc từ Phase 3B → Thanh **`NGÂN SÁCH / QUYỀN HẠN ĐÃ MỞ KHÓA`** tăng đầy, Sếp lúng túng nhượng bộ và mở khóa Level tiếp theo.
  - Nếu người chơi chọn sai bằng chứng (hoặc tai nạn ở Phase 3 là do quên soi lỗi ở Phase 2 / lắp thừa đồ sai dù ngân sách còn dư) → Sếp phản bác lại, buộc quay về sửa thiết kế / kiểm tra lại.

---

## 3. Thiết kế 3 Level Chiến Dịch (Campaign Progression)

| Tiêu chí | **Level 1: "Ngân Sách Chợ Trời"** | **Level 2: "Lời Hứa 10 Tháng"** | **Level 3: "Chuẩn NASA Toàn Cầu"** |
| :--- | :--- | :--- | :--- |
| **Mục tiêu kịch bản** | Đo bức xạ & từ trường (`SC-03`: Space Weather) ở quỹ đạo nhiều hạt mang điện (`ORB-MEO-20200` / `ORB-GTO`). | Giám sát Khí hậu / Bờ biển (`SC-01` / `SC-04`) yêu cầu chụp ảnh & truyền dữ liệu liên tục 12 tháng. | Sứ mệnh Khí nhà kính / Quan trắc Chuẩn (`SC-04` tại `ORB-SSO-600`). |
| **Ngân sách & Hạn chế** | **Budget siêu thấp (VD: `$75M`)**, Deadline `36 tháng`. Chỉ đủ tiền dùng linh kiện `[CHEAP/UNVERIFIED]` như `OBC-BASIC` / `OBC-CUBE` (`5–20 krad`), không đủ mua `OBC-RADHARD`. | **Budget khá hơn (VD: `$145M`)**, nhưng **Deadline bị ép còn `10 tháng`**. Các pin/tên lửa/cảm biến tốt có `lead_time_months = 12–24` bị đánh dấu trễ hạn (nếu lắp sẽ cắt giờ Phase 2 từ `45s` xuống còn `15s`). | **Budget đầy đủ (`$280M`)**, **Deadline `36 tháng`**. Toàn bộ kho linh kiện `Flight Heritage` trong `space_mission_library.py` được mở khóa hoàn toàn. |
| **Thử thách cốt lõi** | Phải tính đủ Khối lượng & Công suất để phóng lên được quỹ đạo bằng gói tiền ít ỏi, đồng thời soi sạch `3/3` lỗi lắp ráp ở Phase 2. | Phải cân bằng giữa việc chọn đồ giao nhanh nhưng biên độ điện/quỹ đạo hẹp vs chấp nhận bị phạt thời gian soi lỗi ở Phase 2 còn `15–20s`. | Tự thiết kế kiến trúc vệ tinh + tên lửa tối ưu đáp ứng đồng thời `POWER`, `MASS`, `SIGNAL`, `INTEGRITY` và vượt qua `3/3` lỗi ẩn để sống trọn 12 tháng. |
| **Diễn biến Phase 3** | Vượt qua Phase 3A và Tháng 1–2, đến **Tháng 3** liều bức xạ tích lũy vượt ngưỡng chịu đựng của chip rẻ → **`FAILURE: NON-RADIATION HARDENED OBC CHIP (SEU Reset)`**. | Nếu chấp nhận linh kiện giao gấp / quỹ đạo thấp (`ORB-LEO-400` + pin nhỏ) → tới **Tháng 6** pin suy giảm qua chuỗi Eclipse / tụt độ cao → **`FAILURE: BATTERY BROWN-OUT / ORBITAL DECAY`**. | Vệ tinh hoạt động ổn định từ **Tháng 1 → Tháng 12**, cánh pin xoay bám Mặt Trời mượt mà, truyền tải dữ liệu đầy đủ. |
| **Mở khóa Phase 4** | Trình **`BÁO CÁO LỖI BỨC XẠ OBC`** + **`HÓA ĐƠN NGÂN SÁCH CẮT XÉN`** → Mở khóa ngân sách Level 2. | Trình **`BÁO CÁO TỤT QUỸ ĐẠO / SẬP PIN THÁNG 6`** + **`LỆNH ÉP DEADLINE 10 THÁNG`** → Sếp đầu hàng, cấp toàn quyền Level 3. | Tổng kết chiến dịch, xếp hạng Kỹ sư trưởng & mở chế độ **Free Sandbox / Pareto Challenge**. |

---

## 4. Kế hoạch Kỹ thuật Tích hợp Backend 3D & Nâng cấp Frontend (`Implementation Plan`)

### 4.1. Giai đoạn A — Tách & Port Backend 3D + Quỹ đạo RK4 (`Project/be`)
1. **Tạo package `engine/mission_engine/models3d/`:**
   - **`mesh_builder.py`:** Port `MB`, `Prof`, `ogive`, `bell`, `strip`, `frame`, `col` từ `06-11-2026-rocket_gfx.py` và `06-11-2026-rocket_models.py` sang thuần NumPy (không import `ursina`/`panda3d`). Viết hàm `export_mb(mb)` xuất dictionary gồm `P` (float32 b64), `N` (float32 b64), `UV` (float32 b64), `C` (float32 b64), `T` (uint32 b64).
   - **`textures.py`:** Port bộ sinh procedural textures (`TW`, `TP`) từ `06-11-2026-rocket_gfx.py` dùng `numpy` + `scipy` + `Pillow`, trả PNG base64 (có cache trong bộ nhớ).
   - **`satellite_builder.py`:** Port `08-11-2026-satellite_models.py` (`build(bus_id, comm_id)`) trả cấu trúc cây `SatEntity`: `body`, `adapter`, và `parts` (mỗi part chứa mesh `w`/`t`, `name`, `parent`, `pivot`, `axis`, `a0`, `a1`, `ts`, `te`, cờ `is_sol`).
   - **`rocket_builder.py`:** Port `06-11-2026-rocket_stages.py` và `07-11-2026-rocket_vehicles.py` cho đủ 8 dòng tên lửa (`LV-ELECTRON`, `LV-VEGAC`, `LV-ARIANE62`, `LV-ARIANE64`, `LV-LVM3`, `LV-VULCAN-VC6`, `LV-NEWGLENN`, `LV-H3-24L`) gắn đúng `payload` vệ tinh thật bên trong fairing.
2. **Nâng cấp Kernel Quỹ đạo Đa Tầng (`engine/mission_engine/kernels/multi_ascent.py`):**
   - Port `07-11-2026-rocket_orbit_multi.py` + `07-11-2026-rocket_catalog.py` + `07-11-2026-plan_table.py`.
   - Cung cấp:
     - `preview_trajectory(vehicle_id, site_id, total_payload_kg)`: mô phỏng nhanh đường bay thực tế theo khối lượng vệ tinh hiện tại để vẽ Live Trajectory Scope ở Phase 1.
     - `simulate_launch_3d(vehicle_id, site_id, design, defects)`: mô phỏng đầy đủ + chèn sự kiện nổ/tách tầng sai nếu còn lỗi nghiêm trọng từ Phase 2 hoặc quá tải khối lượng.
3. **Engine Chiến dịch & Kiểm tra lỗi (`engine/mission_engine/campaign/`):**
   - Định nghĩa 3 Level Campaign (`LEVEL_1`, `LEVEL_2`, `LEVEL_3`) kèm thông số `budget_musd`, `deadline_months`, `inspection_base_s`, danh sách thẻ chứng cứ cho Phase 4.
   - Bộ sinh lỗi Phase 2 (`defects.py`): random 3 lỗi ẩn có tọa độ neo (`anchor_part`, `local_pos`, `category`) tương ứng trực tiếp trên mesh tên lửa/vệ tinh 3D.
   - Bộ mô phỏng 12 tháng (`monthly_sim.py`): tái sử dụng `faults_from` & `state_at` (`08-11-2026-fault_fx.py`) để tạo timeline `Month 1 → Month 12`, xác định chính xác tháng hỏng và tạo gói `RootCauseDossier`.
4. **Cập nhật API FastAPI (`engine/mission_engine/api/app.py`):**
   - `GET /mesh/textures` -> trả textures `TW`, `TP`.
   - `GET /mesh/satellite?bus=...&comm=...` -> trả JSON mesh vệ tinh nguyên bản có khớp động.
   - `GET /mesh/rocket?vehicle=...&bus=...&comm=...` -> trả JSON mesh tên lửa + vệ tinh nguyên bản.
   - `POST /evaluate` -> bổ sung `bars: { power, mass, signal, integrity }`, `deadline_status`, `trajectory_preview`, luôn đặt `launch_allowed: True`.
   - `GET /campaign/levels`, `POST /campaign/start-inspection`, `POST /campaign/launch-and-orbit`, `POST /campaign/confront-boss`.

### 4.2. Giai đoạn B — Tích hợp Nạp Mesh 3D & Luồng 4 Phase Frontend (`Project/fe`)
1. **`src/three/meshLoader.js`:**
   - Giải mã buffer `f32:<b64>` / `u32:<b64>` từ API `/mesh/*` thành `THREE.BufferGeometry` với `position`, `normal`, `uv`, `color` (`vertexColors: true`), tạo `THREE.Texture` từ PNG `TW`/`TP` để dựng nguyên xi hình dáng vệ tinh & 8 tên lửa từ Python backend.
   - Cung cấp lớp `SatelliteRig` & `RocketRig` điều khiển gập/mở cánh pin `setDeploy(f, fs)`, xoay SADA `setSada(alpha)`, kích hoạt luồng lửa `plume`, tách tầng / fairing, và phân rã nổ tung các mảnh (`ExplosionSystem`).
2. **Component & Views mới (`src/components/` & `src/phases/`):**
   - `Phase1Build.jsx`: Khung UI xưởng công nghiệp + Danh sách linh kiện gắn tem `[CHEAP/UNVERIFIED]` + Viewport 3D nạp mesh từ backend + **Biểu đồ Quỹ đạo Phóng Live** cập nhật mỗi lần đổi linh kiện + 4 thanh KPI đáy màn hình + Nút `[ GO TO INSPECTION ]`.
   - `Phase2Inspect.jsx`: Viewport 3D trong phòng tối + Đèn soi X-Ray/UV theo chuột + Bảng `INSPECTION CHECKLIST` + 4 Đồng hồ kim cơ học rung theo khoảng cách tới lỗi ẩn + Đồng hồ đếm ngược.
   - `Phase3LaunchOrbit.jsx`: Viewport phóng tên lửa 3D có hệ thống hạt khói/lửa/nổ + chuyển cảnh Trái Đất 3D & timeline `MONTH 1 → MONTH 12` + Hộp thoại `FAILURE ROOT-CAUSE`.
   - `Phase4Confront.jsx`: Màn hình Chất vấn Sếp Penny-Pincher, chọn thẻ chứng cứ và mở khóa ngân sách qua Level mới.

### 4.3. Giai đoạn C — Kiểm thử & Nghiệm thu
- Viết unit test kiểm tra sinh mesh 3D (`models3d`), tính quỹ đạo RK4 cho nhiều mức khối lượng khác nhau (`multi_ascent`), và API end-to-end cho cả 3 Level × 4 Phase.
- Chạy `npm run build` ở `Project/fe` và `pytest -v` ở `Project/be` đảm bảo toàn bộ API & giao diện vận hành trơn tru không lỗi.
