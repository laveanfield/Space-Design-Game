Ý tưởng **3 Phase (Build → Inspect bắt lỗi giới hạn thời gian → Phóng & Hậu quả theo tháng)** nối tiếp qua **3 Level tiến hóa** của bạn và bạn của bạn **cực kỳ thông minh**! Nó biến một bài toán kỹ thuật khô khan thành một vòng lặp gameplay có nhịp căng thẳng rõ rệt (giống *Papers, Please* kết hợp *Apollo 13*), và giải quyết triệt để chuyện "lắp 1 phát ăn ngay".

Mình đánh giá chi tiết những điểm đắt giá, cách đổi cốt truyện cho hợp chuẩn NASA, và vài điểm cần tinh chỉnh để game chặt chẽ nhất:

---

### 1. Đổi cốt truyện: Từ "Nhà độc tài bắt cóc" → "Giám đốc Quỹ Đầu tư Keo kiệt & Quan liêu" (hoặc Ủy ban Ngân sách Khẩn cấp)

Bạn hoàn toàn giữ được **100% tính cách "keo kiệt, quan liêu, ép tiến độ, cấp linh kiện trôi nổi"** mà vẫn hài hước, nhân văn và ăn điểm cao với giám khảo NASA bằng bối cảnh sau:

* **Vai của bạn:** Kỹ sư trưởng vừa đầu quân cho một **Dự án Cứu hộ Khí hậu / Cảnh báo Thảm họa** nhưng bị quản lý bởi **Ông Sếp Kế Toán Keo Kiệt (Director Penny-Pincher)** — một người chẳng hiểu gì về vật lý, chỉ thích cắt giảm ngân sách và mua linh kiện "hàng chợ / tồn kho" để báo cáo đẹp.
* **Tại sao cốt truyện này khớp hoàn hảo với 3 Level của bạn?**
* **Level 1 (Ép tiền & Linh kiện trôi nổi):** Sếp chỉ cấp ngân sách siêu bèo và ép dùng linh kiện giá rẻ không chống bức xạ (`provenance: estimate/unverified`). Bạn bắt hết lỗi lắp ráp để phóng lên được, nhưng **tới Tháng thứ 3** vệ tinh bị bức xạ bắn cháy chip (`SEU/Reset`) ngay giữa mùa bão → bạn拿 báo cáo kỹ thuật **đập bàn chất vấn Sếp** → Sếp sợ mất ghế nên phải mở hầu bao cấp thêm tiền cho Level 2!
* **Level 2 (Ép tiến độ 10 tháng):** Có tiền hơn, nhưng Sếp lại hứa bừa với truyền thông là **"10 tháng nữa phải phóng!"** (`deadline_months: 10`). Các linh kiện xịn cần 12–14 tháng chế tạo bị khóa hoặc nếu cố lắp sẽ bị cắt giờ kiểm tra ở Phase 2 (giảm thời gian soi lỗi), dẫn tới vệ tinh lên quỹ đạo bị tụt độ cao/hết pin ở **Tháng thứ 6**.
* **Level 3 (Sứ mệnh Chuẩn NASA):** Sau 2 cú vấp đau đớn, Sếp buộc phải nghe lời Kỹ sư trưởng — giao đủ ngân sách, mở khóa linh kiện chuẩn NASA (`Flight Heritage`) để bạn tự tay cân đối và vận hành vệ tinh sống trọn **12/12 tháng**, cứu được dữ liệu thảm họa và được vinh danh!



---

### 2. Tinh chỉnh nhẹ 3 Phase để Gameplay "cuốn" và học được thật

1. **Phase 1 (Build & Lựa chọn trong thế kẹt):**
* Thay vì khóa cứng 1 đáp án, ở Level 1 và 2 người chơi thấy rõ ngay trên thẻ linh kiện dòng chữ cảnh báo kiểu: *`[HÀNG TỒN KHO GIÁ RẺ] Đủ ngân sách Sếp giao, nhưng chỉ chịu được 3 krad bức xạ (Dự kiến chết ở Tháng 3–4)`*. Người chơi biết trước rủi ro nhưng **buộc phải lắp vì Sếp không cho tiền**, tạo sự ức chế tích cực để lát nữa có cớ "chất vấn Sếp".


2. **Phase 2 (Pre-Flight Inspection — Soi lỗi giới hạn thời gian):**
* Đây là điểm sáng nhất của bạn! Trước khi phóng, hiện **Sơ đồ X-quang / Mô hình 3D của Tên lửa & Vệ tinh** với đồng hồ đếm ngược (ví dụ `45 giây`).
* Code sẽ **inject 3 lỗi kỹ thuật có thật** vào các vị trí trên tàu (ví dụ: *Chốt tách tầng bị kẹt, Dây cáp pin mặt trời đấu ngược cực, Ống kính camera quên tháo nắp bảo vệ, Cảm biến góc lắp lệch*).
* **Hậu quả phân tầng đúng ý bạn:**
* **Bắt 0/3 lỗi:** Phóng lên nổ ngay tại Max-Q / không tách được tầng → Phóng lại.
* **Bắt 1–2/3 lỗi:** Tên lửa lên được quỹ đạo nhưng vệ tinh bị kẹt 1 cánh pin hoặc mờ ống kính (chết sớm ở Tháng 1–2).
* **Bắt đủ 3/3 lỗi:** Phóng hoàn hảo, bước sang Phase 3 để đối mặt với **lỗi thiết kế hệ thống** (do linh kiện keo kiệt của Sếp ở Level 1–2 hoặc thử thách 12 tháng ở Level 3).




3. **Phase 3 (Mô phỏng vòng đời 12 tháng & Màn "Chất vấn Sếp"):**
* Thay vì tính theo giây rời rạc, thanh thời gian ở Phase 3 chạy từ **Tháng 1 → Tháng 12**.
* Ở Level 1, tới **Tháng 3–4**, vệ tinh chết đứng kèm bảng phân tích nguyên nhân gốc (*Root-Cause*). Lúc này hiện nút **[ĐƯA BẰNG CHỨNG KỸ THUẬT ĐỂ CHẤT VẤN SẾP]** — bạn chọn đúng lý do vệ tinh hỏng (ví dụ: *"Do Sếp ép dùng chip OBC-CUBE không chống bức xạ!"*) là mở khóa ngân sách qua Level 2!

