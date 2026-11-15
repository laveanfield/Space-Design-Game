# Space Design Game — Signal & Communications

Tài liệu bàn giao phần **signal physics, năng lượng và truyền dữ liệu vệ tinh** cho branch dự kiến `signal/communications`, để tích hợp vào gameplay/UI mới trên `main`.

**Mục tiêu:** phóng được vệ tinh chưa có nghĩa là hoàn thành nhiệm vụ. Vệ tinh phải quan sát đúng mục tiêu, chụp được ảnh có ích, lưu ảnh, có đủ điện và đường truyền để gửi trọn dữ liệu về mặt đất.

> Tài liệu mô tả mã nguồn local được kiểm tra ngày 15/11/2026. Tên branch phía trên là dự kiến, không phải xác nhận đã tạo/push branch. Các mục **Đề xuất** là thiết kế tiếp theo, chưa phải tính năng đã triển khai. Đây là mô phỏng giáo dục, không phải công cụ chứng nhận một hệ thống vệ tinh thực.

## 1. Đã thêm và tích hợp những gì?

| Phần | Hiện trạng trong mã nguồn | Điểm tích hợp |
| --- | --- | --- |
| RF solver | Thư viện `cubesat_link` được đặt trong backend; tính hình học liên lạc, che khuất bởi Trái Đất, free-space loss và link budget có điều kiện | [cubesat_link](be/engine/cubesat_link/) |
| API RF | Endpoint giải bài toán RF, thông tin phiên bản và JSON schema; có phân biệt dữ liệu tính toán với giả định | [radio_link.py](be/engine/mission_engine/integrations/radio_link.py), [app.py](be/engine/mission_engine/api/app.py) |
| Mô phỏng vận hành | Quỹ đạo ECI chuyển sang ECEF, trạm thu, mục tiêu quan sát, ngày/đêm, cửa sổ liên lạc trong 7 ngày đại diện | [mission_comms.py](be/engine/mission_engine/integrations/mission_comms.py) |
| Pin và truyền tin | Tải nền, năng lượng chụp ảnh, tải phát, sạc khi có nắng và ngưỡng dự trữ cho radio | [mission_comms.py](be/engine/mission_engine/integrations/mission_comms.py) |
| Store-and-forward | Gói ảnh xếp hàng FIFO, truyền dở được giữ lại, chỉ ghi nhận ảnh nhận đủ; bộ nhớ đầy từ chối ảnh mới | [mission_comms.py](be/engine/mission_engine/integrations/mission_comms.py) |
| Cấu hình thiết kế | Chọn trạm, mục tiêu, mức công suất phát, bitrate và chiến lược pin; thiết kế cũ thiếu cấu hình vẫn dùng mặc định | [models.py](be/engine/mission_engine/contract/models.py), [metrics.py](be/engine/mission_engine/rules/metrics.py) |
| Campaign | Kết nối kết quả capture/downlink vào bằng chứng nhiệm vụ; giữ các rủi ro tuổi thọ, nguồn và bức xạ của campaign | [service.py](be/engine/mission_engine/service.py), [lifetime.py](be/engine/mission_engine/campaign/lifetime.py) |
| Manual OPS | Dùng adapter RF, cấu hình trạm, tải phát và dự trữ pin trong session vận hành | [ops.py](be/engine/mission_engine/session/ops.py) |
| UI | Cấu hình communications trong BUILD, vận hành tự động sau tách vệ tinh, giải thích hậu quả thiết kế, RF lab qua `?dev=1` | [MissionComms.jsx](fe/src/components/MissionComms.jsx), [RadioLinkLab.jsx](fe/src/components/RadioLinkLab.jsx), [App.jsx](fe/src/App.jsx) |
| Đồng hồ và bằng chứng | Đồng bộ playback với capture/contact/downlink; ảnh không được xuất hiện là đã nhận trước khi truyền xong hoặc sau điểm campaign đã thất bại | [missionPlayback.js](fe/src/components/missionPlayback.js), [CampaignPanels.jsx](fe/src/components/CampaignPanels.jsx), [EvidenceGallery.jsx](fe/src/components/EvidenceGallery.jsx) |

[run_server.py](be/run_server.py) là **entry point chạy API**, không chứa toàn bộ signal physics và hiện không có thay đổi so với HEAD tại thời điểm kiểm tra. Chỉ chuyển file này sang branch khác sẽ không mang theo tính năng communications.

Luồng người chơi hiện tại: **BUILD → Launch → tách vệ tinh thành công → tự động chụp/truyền trên quỹ đạo → Review → chỉnh thiết kế và thử lại**. Không yêu cầu thêm bước LINK_OPS hay nút chụp/truyền thủ công riêng.

## 2. Quy tắc vật lý và giới hạn hiện tại

### 2.1. Có nhìn thấy trạm chưa chắc truyền được

Trong campaign, truyền dữ liệu cần đồng thời:

1. Vệ tinh ở trên góc ngẩng tối thiểu của trạm.
2. Link margin đạt ít nhất **3 dB** theo giả định gameplay.
3. Có dữ liệu đang chờ, không thực hiện chụp ảnh trong cùng bước xử lý.
4. Pin đủ dự trữ cho radio; thời gian phát bị giới hạn bởi lượng điện còn trên ngưỡng này.

Bitrate là chính sách do người chơi chọn từ khả năng radio trong catalog, **không phải thông lượng tự suy ra từ ray tracing**. Lượng dữ liệu truyền được:

```text
data_GB = rate_Mbps × downlink_efficiency × transmit_seconds / 8000
```

Nếu các đại lượng khác giữ nguyên, công thức trong adapter cho thấy:

- Giảm bitrate còn 1/10 cải thiện margin 10 dB, nhưng tốc độ dữ liệu chỉ còn 1/10 khi link đủ điều kiện.
- Giảm công suất RF còn 1/4 làm margin giảm khoảng 6,02 dB.
- Không được đồng nhất công suất RF với điện tiêu thụ của cả radio. Tải phát hiện dùng `catalog.power_w × (0.4 + 0.6 × tx_scale)` — một xấp xỉ gameplay.

### 2.2. Ngưỡng năng lượng và ảnh

| Thông số | Giá trị hiện tại | Ý nghĩa |
| --- | --- | --- |
| Pin ban đầu trong mô phỏng communications | 80% | Không khởi đầu với pin đầy |
| `data_first` | Dự trữ radio 6% | Cho phép phát sâu hơn vào pin |
| `balanced` | Dự trữ radio 25% | Cân bằng truyền dữ liệu và dự trữ |
| `save_power` | Dự trữ radio 55% | Dừng radio sớm hơn để giữ điện |
| Chụp ảnh | Bỏ lượt nếu SOC <20% | Không chụp bằng điện không có |
| RGB | Mặt Trời cao >10° tại mục tiêu | Không dùng RGB để chụp một mục tiêu đang tối |
| Vùng quan sát minh họa | Góc ngẩng từ mục tiêu ≥45° | Chưa phải footprint từ thông số camera thực |
| Nhịp chụp | Tối đa 1 ảnh/mục tiêu/24 giờ | Lượt bị bỏ cũng có thể làm phải đợi đến chu kỳ tiếp theo theo logic hiện tại |
| Bộ nhớ | Mặc định 8 GB | Gói ảnh đại diện tối thiểu 0,02 GB; ngân sách dữ liệu payload/ngày được chia đều cho số mục tiêu dự kiến |
| Ảnh dùng được | Đã truyền trọn gói và `blur < 0.35` | Nhận được ảnh không đồng nghĩa ảnh có ích |

Các ngưỡng này là **tham số của game**, không phải tiêu chuẩn chung cho mọi CubeSat. Dự trữ radio không ngăn tải nền tiếp tục làm cạn pin.

### 2.3. Không đánh đồng các lớp mô phỏng

- Operations: **7 ngày liên tục**, bước 60 giây, quỹ đạo tròn, Trái Đất cầu quay; chưa có J2 hay lịch quỹ đạo thực cập nhật.
- Campaign: ghép 12 đoạn của 7 ngày vào 12 mốc lão hóa. Đây **không phải dự báo cửa sổ liên lạc cả năm**; SOC campaign là mô hình riêng, không phải cùng chuỗi pin operations.
- Campaign dùng visibility hình học. Tia khí quyển tham chiếu P.834 được ray trace ở đỉnh từng lượt trong dải 0,1–12 GHz; manual OPS sử dụng nghiệm khúc xạ khi có contact. Không nên khẳng định hai chế độ giống nhau sát chân trời.
- Gain thu 35 dBi cho RF hoặc 110 dBi cho optical, nhiệt độ 300 K, Eb/N0 yêu cầu 9,6 dB, suy hao cáp 2 dB và phân cực tròn khớp là giả định của adapter game.
- Suy hao môi trường/thời tiết hiện được cung cấp dưới dạng **assumed**, không phải dự báo mưa, đo plasma hay bằng chứng rằng suy hao thực bằng 0.
- Mất contact là sự kiện vận hành bình thường. Chỉ kết luận nhiệm vụ thất bại khi không đạt mục tiêu đúng hạn hoặc có sự cố kết thúc hoạt động.

Về cơ sở thiết kế, NASA mô tả lựa chọn trạm, link budget và yêu cầu pointing là các yếu tố của thiết kế communications; nguồn điện phải xét cả khả năng phát và tích trữ năng lượng. README dùng các nguyên tắc này để thiết kế kịch bản, không coi tham số minh họa là thông số một vệ tinh thật. Xem [NASA Communications](https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications/) và [NASA Power](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/).

## 3. Kịch bản thất bại dựa trên cơ chế đã có

Các kịch bản dưới đây là **thiết kế bài chơi/QA**, không phải danh sách preset đã được thêm vào UI. Chỉ những trường hợp nêu test tương ứng mới có fixture trong repository; chưa khẳng định đã chạy test trong lần viết tài liệu này.

### S01 — Chụp được nhưng không bao giờ gặp trạm

- **Thiết lập:** preset `good` của `MP-SC01-FIRST-EYES`, đổi `station_id` sang `GS-SVALBARD`; fixture hiện dùng quỹ đạo 400 km, inclination 51,6°.
- **Cơ chế:** hình học quỹ đạo/trạm và elevation mask không tạo contact trong mô phỏng này. Không thể sửa một đường bị Trái Đất che bằng tăng công suất.
- **Dấu hiệu:** không có `windows`, `sent_gb = 0`, vẫn có ảnh đã chụp; `NO_CONTACT`, rồi `DATA_BACKLOG`.
- **Kết quả:** thiếu bằng chứng nhận được; campaign trả dossier `data` trong test hiện có.
- **Khắc phục:** chọn trạm có thể tiếp cận hoặc đổi quỹ đạo, rồi kiểm tra lại cả vùng quan sát mục tiêu.
- **Kiểm chứng:** [test_mission_comms.py](be/tests/test_mission_comms.py), test `test_unreachable_station_never_delivers_or_banks_contact_credit`.

### S02 — Trạm xuất hiện trên bản đồ nhưng tín hiệu quá yếu

- **Thiết lập:** với một lượt có margin sát ngưỡng, giảm `tx_scale` xuống 0,25, giữ bitrate cao. Đây là bài thử có điều kiện; không phải mọi radio đều yếu ở 0,25.
- **Cơ chế:** công suất thu không đủ cho tốc độ đang yêu cầu; ở đầu/cuối pass, hình học cũng có thể bất lợi hơn.
- **Dấu hiệu:** có contact, `margin_db < 3`, trạng thái `WEAK_SIGNAL`, diagnostic `LINK_MARGIN`; hàng đợi không được giải phóng ở các bước đó.
- **Kết quả:** có thể phục hồi ở phần khác của pass; chỉ fail nhiệm vụ nếu thiếu ảnh nhận đủ vào cuối campaign.
- **Khắc phục:** hạ bitrate, tăng công suất trong giới hạn radio hoặc sửa lựa chọn antenna/ADCS. Sau mỗi thay đổi phải kiểm tra lại pin và thời gian truyền.
- **Kiểm chứng:** test RF kiểm tra giảm rate 10 lần tăng margin 10 dB, giảm công suất 4 lần giảm margin khoảng 6 dB; cần thêm fixture end-to-end cho một thiết kế sát ngưỡng.

### S03 — Tín hiệu tốt nhưng radio phải giữ pin

- **Thiết lập tái lập trong test:** trạm/mục tiêu ngay dưới vệ tinh lúc đầu, pin 1 Wh, công suất phát điện 0 W, `save_power`, mô phỏng 1 giờ. Đây là fixture stress, không phải cấu hình vệ tinh vận hành bình thường.
- **Cơ chế:** chụp và phát tiêu điện; pin chạm giới hạn dự trữ, dù đường RF vẫn có thể tốt.
- **Dấu hiệu:** `POWER_HOLD`, `power_holds > 0`; đã gửi một phần ảnh nhưng chưa hoàn thành.
- **Kết quả:** ảnh vẫn pending, chưa được tính bằng chứng.
- **Khắc phục:** cân đối tải, nguồn và pin; chỉ hạ dự trữ khi đã kiểm tra khả năng sống qua đoạn tối tiếp theo.
- **Kiểm chứng:** [test_comms_power.py](be/tests/test_comms_power.py).

### S04 — Vào vùng tối khi năng lượng không đủ

- **Thiết lập:** nguồn yếu hoặc tải nền lớn; chọn ca có eclipse, bắt đầu quan sát mức pin trước/sau đoạn tối.
- **Cơ chế:** phát điện bằng 0 trong eclipse nhưng OBC/ADCS vẫn tiêu thụ; tắt radio không loại bỏ tải nền.
- **Dấu hiệu operations:** `eclipse = true`, SOC giảm, radio bị giữ, các lượt chụp có thể bị bỏ vì pin thấp.
- **Kết quả hiện tại:** operations không tự phát sinh sự kiện chết vệ tinh chỉ vì SOC bằng 0. Campaign riêng có `BROWNOUT`/`BLACKOUT` theo mô hình lão hóa và SOC của nó. Không gán hai chuỗi này thành một mô hình điện áp vật lý thống nhất.
- **Khắc phục:** tăng năng lượng hữu dụng, cải thiện nguồn, giảm tải/duty cycle. Một pin lớn chỉ trì hoãn sự cố nếu năng lượng thu trung bình vẫn thiếu.

### S05 — Hạ bitrate cứu link nhưng không kịp gửi ảnh

- **Thiết lập:** `rate_scale = 0.1`, đủ pin và margin nhưng dữ liệu nhiều, tổng thời gian contact hữu dụng ngắn.
- **Cơ chế:** đường truyền ổn định nhưng không đủ dung lượng phục vụ hàng đợi.
- **Dấu hiệu:** `TRANSMITTING` có xuất hiện, `sent_gb > 0`, `remaining_gb > 0`, `DATA_BACKLOG`.
- **Ví dụ tính toán minh họa:** radio 2 Mbps, hiệu suất giả định 0,7, có 300 giây phát thực thì gửi được 0,0525 GB; ở 0,2 Mbps chỉ gửi 0,00525 GB. Đây không phải kết quả đã đo của preset.
- **Khắc phục:** tăng rate đến mức vẫn giữ margin, tăng thời gian contact khả dụng hoặc chọn payload ít dữ liệu hơn. Nén dữ liệu thích nghi chưa có trong game.

### S06 — Bộ nhớ đầy vì sản xuất nhanh hơn truyền

- **Thiết lập:** payload tạo gói lớn, nhiều lượt chụp, trạm hiếm hoặc radio thường bị giữ pin.
- **Cơ chế:** hàng đợi tăng đến mức không đủ chứa gói mới.
- **Dấu hiệu:** `BUFFER_FULL`, `lost_gb > 0`, còn nhiều ảnh pending. Gói lớn hơn toàn bộ buffer có thể bị từ chối ngay cả khi buffer trống.
- **Kết quả hiện tại trong communications:** bỏ ảnh mới, **không ghi đè ảnh cũ**. Một phần ảnh đã gửi không tự mất đi khi LOS.
- **Khắc phục:** tăng khả năng gửi dữ liệu, giảm khối lượng payload hoặc thay dung lượng buffer trong ruleset để thử nghiệm; chưa có chính sách chọn ảnh ưu tiên trong UI.

### S07 — Liên lạc tốt nhưng không chụp trúng mục tiêu

- **Thiết lập tái lập:** preset `good`, đổi `target_id` thành `FIRE-SIBERIA` theo fixture hiện có.
- **Cơ chế:** không có lượt đáp ứng điều kiện vùng quan sát mục tiêu của mô hình.
- **Dấu hiệu:** không có evidence; `TARGET_ACCESS`.
- **Kết quả:** link tốt vẫn không tạo ra ảnh để gửi. Diagnostic hiện gộp cả hình học, ánh sáng và pin, nên không được suy ra nguyên nhân duy nhất chỉ từ mã này.
- **Khắc phục:** chọn quỹ đạo/mục tiêu phù hợp; dùng telemetry để loại trừ thiếu sáng và thiếu pin.
- **Kiểm chứng:** test `test_unreachable_target_is_not_photographed` trong [test_mission_comms.py](be/tests/test_mission_comms.py).

### S08 — Bay qua đúng nơi nhưng camera RGB gặp ban đêm

- **Thiết lập:** chọn lượt mục tiêu vào footprint nhưng không đạt điều kiện chiếu sáng của RGB.
- **Cơ chế:** bỏ capture; không nên dựng một ảnh sáng rõ chỉ vì có contact với trạm thu.
- **Dấu hiệu:** `missed` tăng; có thể xuất hiện `TARGET_ACCESS` nếu không có ảnh nào. Chưa có reason code riêng cho từng lần bỏ chụp do tối.
- **Khắc phục:** đổi lịch/quỹ đạo phù hợp chiếu sáng; chỉ dùng sensor khác nếu catalog và nhiệm vụ cho phép. Mô hình chưa mô phỏng đầy đủ radiometry của sensor ban đêm.

### S09 — Ảnh về đầy đủ nhưng bị nhòe

- **Thiết lập:** ADCS có pointing accuracy không đáp ứng yêu cầu payload.
- **Cơ chế:** mô hình blur tăng theo độ không đáp ứng pointing; khi `blur >= 0.35`, ảnh không được tính là bằng chứng dùng được. Sai hướng cũng có thể làm suy giảm link qua adapter RF.
- **Dấu hiệu:** có thời điểm truyền xong nhưng số ảnh dùng được thấp; dossier có thể là `pointing` tùy các nguyên nhân cạnh tranh.
- **Khắc phục:** chọn ADCS phù hợp hoặc payload có yêu cầu pointing dễ hơn. Tăng công suất phát không sửa được ảnh đã nhòe.
- **Giới hạn:** blur là chỉ số gameplay, chưa phải mô phỏng jitter/exposure và chất lượng ảnh quang học.

### S10 — Vệ tinh hỏng trước khi ảnh cuối về mặt đất

- **Thiết lập:** giữ hàng đợi pending đến mốc campaign có nguồn suy yếu, vượt ngưỡng bức xạ hoặc hết tuổi thọ quỹ đạo.
- **Cơ chế:** campaign dừng ở `BLACKOUT`, `OBC_DEAD` hoặc `REENTRY`; các lần giao ảnh sau mốc đó không được tính cho nhiệm vụ.
- **Dấu hiệu:** `outcome.alive = false`, `killer` nêu subsystem; ảnh chưa nhận không được tự chuyển sang received khi kéo playback.
- **Kết quả:** nếu chưa đủ 3 ảnh rõ đã nhận thì thất bại; nếu đã đủ trước khi hỏng, nhiệm vụ ảnh hiện vẫn có thể thành công, dù vệ tinh đã chết.
- **Khắc phục:** vừa tăng độ bền nhiệm vụ vừa giảm thời gian chờ dữ liệu, không chỉ tăng tuổi thọ danh nghĩa.
- **Giới hạn:** sự kiện bức xạ/lão hóa đang là mô hình campaign đơn giản; không phải mô phỏng xác suất lỗi linh kiện từ dữ liệu qualification.

### S11 — Cứu tín hiệu bằng tăng công suất, rồi mất cơ hội vì pin

- **Thiết lập:** dùng cùng thiết kế sát ngưỡng RF, so sánh `tx_scale = 0.25` và `1.0`, giữ rate/strategy/seed giống nhau.
- **Chuỗi nhân quả cần kiểm tra:** margin tốt hơn → phát được nhiều hơn → tiêu điện nhiều hơn → chạm reserve sớm → bỏ phần còn lại của pass → ảnh còn pending.
- **Kết quả không mặc định:** công suất cao có thể có lợi hoặc bất lợi; phải so `delivered`, `tx_energy_wh`, `min_soc`, `power_holds`, không chỉ nhìn margin.
- **Bài học:** thiết kế tối ưu là số bằng chứng có ích về mặt đất trong ngân sách năng lượng, không phải công suất phát lớn nhất.
- **Trạng thái:** các cơ chế đã có; chưa có fixture A/B bảo đảm chuỗi này xảy ra với một preset cụ thể.

### S12 — Giữ pin quá kỹ cũng có thể trượt nhiệm vụ

- **Thiết lập:** so `balanced` và `save_power` trên cùng thiết kế có ít contact, pin thường nằm trong khoảng 25–55%.
- **Cơ chế:** `save_power` không cho phát ở vùng pin mà `balanced` vẫn có thể dùng.
- **Dấu hiệu:** pin còn nhiều hơn nhưng số ảnh nhận đủ có thể thấp hơn, backlog cao hơn.
- **Kết quả:** vệ tinh còn sống nhưng không hoàn thành mục tiêu ảnh; không nên hiển thị “thành công” chỉ vì pin chưa cạn.
- **Khắc phục:** cân đối reserve với thời điểm sạc và contact; không mặc định `data_first` luôn tốt hơn vì nó giữ lại ít điện hơn cho tải nền.
- **Trạng thái:** có cơ chế, cần fixture A/B và test chốt kết quả trước khi đưa thành màn chơi chính thức.

## 4. Kịch bản nâng cao đề xuất — chưa triển khai

Đây là backlog thiết kế theo hướng gần thực tế hơn. Không hiển thị như khả năng đã có của branch và không dùng sự kiện ngẫu nhiên để che một nguyên nhân chưa được mô phỏng.

| ID | Kịch bản | Đại lượng/điều kiện cần bổ sung | Hậu quả và cách phục hồi đề xuất |
| --- | --- | --- | --- |
| P01 | Không bắt được sóng do Doppler chưa bù | Vận tốc xuyên tâm, tần số mang, residual frequency error, acquisition bandwidth của receiver | Mất lock dù received power tốt; bù tần số hoặc bắt lại sóng. Chỉ kích hoạt khi lỗi vượt giới hạn receiver |
| P02 | Suy hao thời tiết tại trạm | Tần số, elevation, thời tiết hoặc trace suy hao có nguồn và nhãn độ tin cậy | Margin giảm theo thời gian; giảm rate, chờ lượt khác hoặc chuyển trạm nếu được hỗ trợ. Không áp một mức “mưa làm mất sóng” chung cho mọi băng |
| P03 | Radio quá nhiệt khi phát dài | Nhiệt độ, nhiệt dung, cân bằng nhiệt và giới hạn phần cứng | Hạ công suất hoặc dừng làm mát; cần telemetry nhiệt và hysteresis để tránh bật/tắt liên tục |
| P04 | Còn SOC nhưng bus sụt áp lúc bật PA | Nội trở pin theo nhiệt độ/tuổi, dòng đỉnh, điện áp bus, ngưỡng undervoltage | Reset hoặc load shedding; giảm tải đồng thời. Không dùng SOC đơn thuần để khẳng định đã mô phỏng brownout vật lý |
| P05 | Antenna không bung hoặc mất attitude lock | Trạng thái deployment, antenna pattern, attitude theo thời gian | Giảm gain/mất pointing; thử recovery hoặc radio dự phòng nếu thiết kế có, không tự coi mọi trường hợp là hỏng vĩnh viễn |
| P06 | Có pass nhưng trạm đang bận/hỏng | Lịch cấp slot, availability và thời gian acquisition của từng trạm | Mất một phần/toàn bộ contact; chờ slot, đổi trạm trong mạng được cấu hình |
| P07 | Có sóng nhưng frame không giải mã được | Modulation/coding, BER/FER theo Eb/N0, CRC, retransmission, protocol overhead | Goodput thấp hơn bitrate; chỉ giao packet đã xác nhận đầy đủ, lưu phần tiến độ hợp lệ |
| P08 | Bức xạ làm reset giữa một lần downlink | Event timeline có seed, reset duration, quy tắc buffer bền vững/volatile | Ngừng phát rồi khôi phục; mất phần chưa commit nếu mô hình bộ nhớ cho phép. Tách SEU phục hồi được khỏi hư hỏng vĩnh viễn |

Định hướng này phù hợp với cách NASA đặt communications trong quan hệ với pointing, thermal, power và fault recovery; chi tiết trigger và các ngưỡng ở đây vẫn là **đề xuất của dự án**, cần dữ liệu phần cứng để hiệu chỉnh. Tham khảo [NASA Communications subsystem design](https://s3vi.ndc.nasa.gov/ssri-kb/topics/31/).

## 5. Thiết kế thông báo thất bại cho gameplay/UI mới

**Đề xuất khi tích hợp:** mỗi sự kiện phải phân biệt ba mức:

- **Bình thường:** ngoài vùng phủ, chưa có dữ liệu, đang đợi ánh sáng.
- **Có thể phục hồi:** yếu tín hiệu, giữ pin, đầy buffer, mất một pass.
- **Kết thúc:** phần cứng không còn hoạt động hoặc hết thời hạn mà thiếu bằng chứng.

Một dossier nên có: **triệu chứng → nguyên nhân trực tiếp → telemetry tại sự kiện → hệ quả nhiệm vụ → thay đổi thiết kế để thử lại**. Giữ cả nguyên nhân chính và yếu tố góp phần; ví dụ đầy buffer có thể là hậu quả của thiếu pin, không nhất thiết radio quá chậm.

Ví dụ UI **minh họa, không phải log đã chạy**:

> **Chưa gửi xong ảnh #3 — radio đang giữ pin.** Link margin 5 dB vẫn đủ, nhưng SOC 24% thấp hơn dự trữ 25% của Balanced. Ảnh còn 0,018 GB. Hãy cải thiện nguồn/pin hoặc giảm tải; giảm bitrate chỉ có ích nếu link yếu, và có thể làm lần truyền kéo dài hơn.

Đề xuất bổ sung reason code riêng cho `CAPTURE_DARK`, `CAPTURE_LOW_POWER`, `TARGET_OUT_OF_FOOTPRINT`, `CONTACT_ENDED_PARTIAL` và `MISSION_DEADLINE`. Đây **chưa phải enum/API contract hiện tại**. Không đồng nhất `summary.delivered` của cửa sổ 7 ngày với `outcome.evidence_usable` sau khi campaign cắt timeline.

## 6. API và cách chạy

Yêu cầu: Python ≥3.11 theo [pyproject.toml](be/pyproject.toml), môi trường Node/npm tương thích [package.json](fe/package.json). Các lệnh dưới đây là hướng dẫn, không phải xác nhận đã cài hoặc chạy thành công trong lần viết README.

Backend — từ thư mục gốc repository, dùng Python trong môi trường ảo đã chọn:

```powershell
python -m pip install -e "./be[api,dev]"
python be/run_server.py
```

Backend mặc định tại `http://127.0.0.1:8000`; kiểm tra `/health` và xem API tại `/docs`.

Frontend — terminal thứ hai:

```powershell
cd fe
npm ci
npm run dev
```

Vite cấu hình cổng 5173; dùng URL terminal in ra. **Lưu ý hiện có:** [vite.config.js](fe/vite.config.js) proxy `/campaign` nhưng chưa có `/radio-link`; RF lab gọi đường dẫn tương đối có thể không hoạt động trong dev cho đến khi bổ sung proxy. Có thể kiểm tra trực tiếp API RF trên backend. Backend có hỗ trợ phục vụ frontend đã build khi tồn tại [fe/dist](fe/dist/).

| Endpoint | Vai trò |
| --- | --- |
| `GET /missions/{mission_id}` | Metadata/preset và `communications_targets` |
| `POST /campaign/communications` | Simulation 7 ngày, samples, contact windows, evidence, diagnostics |
| `POST /campaign/lifetime` | Campaign có tích hợp communications và kết quả nhiệm vụ |
| `POST /radio-link/solve` | RF solver theo schema riêng, không dùng envelope campaign |
| `GET /radio-link` | Thông tin solver |
| `GET /radio-link/schema/request` và `/response` | Hợp đồng JSON RF |

Envelope campaign cần `mission_id` và một `design` đầy đủ từ preset/catalog. Phần dưới chỉ là **object con để thêm vào design**, không phải request hoàn chỉnh:

```json
{
  "communications": {
    "station_id": "GS-GOLDSTONE",
    "target_id": "all",
    "tx_scale": 1.0,
    "rate_scale": 1.0,
    "strategy": "balanced"
  }
}
```

`tx_scale`: 0,25–1; `rate_scale`: 0,1–1; strategy: `balanced`, `data_first`, `save_power`. ID trạm/mục tiêu phải tồn tại trong dữ liệu tương ứng. Báo cáo communications hiện dùng schema `mission-comms/1`; lifetime dùng `lifetime/2`.

## 7. Kiểm thử và tiêu chí nghiệm thu

Chạy từ root với môi trường đã cài dependencies:

```powershell
python -m pytest be/tests/test_mission_comms.py be/tests/test_comms_power.py be/tests/test_api_e2e.py
node --test fe/src/components/missionPlayback.test.js
```

Trước khi merge vào gameplay mới, chạy toàn bộ backend và build frontend:

```powershell
python -m pytest be/tests
npm --prefix fe run build
```

Các test hiện có thể hiện các bất biến: không xuyên Trái Đất, ECI/ECEF đúng phép quay, margin thay đổi theo rate/power, ray khí quyển thực sự được tính, bảo toàn dữ liệu FIFO, truyền dở không nhận đủ, pin thấp giữ radio, trạm/mục tiêu không tiếp cận được, cấu hình sai trả lỗi client và playback không nhận ảnh trước thời điểm hoàn tất.

**Cần bổ sung khi phát triển các scenario:** fixture baseline thành công, mỗi ca chỉ đổi một biến, lưu seed/cấu hình/duration, test phục hồi sau contact/power hold, test S04–S12 có điều kiện tái lập. Không coi test công thức RF là bằng chứng mọi tình huống gameplay đã được kiểm thử.

Checklist nghiệm thu:

- [ ] Thiết kế cũ không có `communications` vẫn chạy bằng mặc định.
- [ ] Không phát khi không có contact hoặc margin không đủ; kiểm tra ngưỡng riêng của manual OPS.
- [ ] SOC trong [0,1]; buffer trong giới hạn; dữ liệu gửi + còn lại khớp dữ liệu nhận vào queue trong sai số cho phép.
- [ ] Ảnh chỉ tính khi nhận đủ và đủ rõ; campaign chết không giao thêm ảnh về sau.
- [ ] Không lấy diagnostic cuối 7 ngày hiển thị như telemetry tương lai đã xảy ra tại đầu playback.
- [ ] Không đồng nhất mất contact/giữ pin tạm thời với vệ tinh đã chết.
- [ ] Chạy lại luồng BUILD, launch, tách vệ tinh, orbit, review của `main` sau tích hợp.

## 8. Kế hoạch gộp vào main mà giữ gameplay/UI của nhóm

**Phạm vi:** đưa backend physics, contract và hành vi communications vào phiên bản mới; không thay nguyên bộ giao diện mới bằng giao diện local cũ.

1. **Chụp mốc local trên branch riêng.** Tạo `signal/communications` từ HEAD hiện tại và commit có chọn lọc các thay đổi liên quan cùng tài liệu. Branch Git thông thường vẫn giữ lịch sử chung; không cần orphan branch. Một branch trỏ tới HEAD không tự sao lưu các file chưa commit.
2. **Loại môi trường/build/cache khỏi commit.** Không dùng `git add be fe` một cách mù quáng: thư mục [venv.broken-20261114](be/venv.broken-20261114/) đang untracked và mẫu ignore `venv/` không bao phủ tên này. Kiểm tra dependency/lockfile riêng, không tự bỏ lockfile chỉ vì nó mới.
3. **Fetch trước khi kết luận main đang ở đâu.** `origin/main` trong local chỉ là lần cập nhật gần nhất; kiểm tra trước đó chưa fetch nên không chứng minh được trạng thái mới nhất của GitHub.
4. **Tạo branch tích hợp từ `origin/main` mới nhất**, sau khi local đã được lưu. Chuyển các commit communications sang đó theo từng lớp, xử lý conflict trong branch tích hợp, không push trực tiếp vào `main`.
5. **Ưu tiên contract/backend trước**, rồi nối UI mới vào API. Đối chiếu catalog, ID component, ruleset và model design giữa hai phía. Giữ default cho dữ liệu thiết kế cũ.
6. **Review thủ công file chung.** Đặc biệt [App.jsx](fe/src/App.jsx), [styles.css](fe/src/styles.css), [CampaignPanels.jsx](fe/src/components/CampaignPanels.jsx), [EvidenceGallery.jsx](fe/src/components/EvidenceGallery.jsx), [app.py](be/engine/mission_engine/api/app.py), [service.py](be/engine/mission_engine/service.py) và [lifetime.py](be/engine/mission_engine/campaign/lifetime.py). Không chọn toàn bộ “ours/theirs” vì có thể mất tính năng một phía.
7. **Test, demo S01–S03 cùng một baseline thành công, rồi mở Pull Request vào main.** Nội dung PR ghi rõ đã triển khai, giới hạn mô hình, kết quả test thực tế và các scenario mới chỉ là thiết kế.

Các điểm cần thống nhất trước merge:

- Communications từ chối ảnh mới khi đầy buffer, nhưng thông báo legacy trong campaign còn mô tả “ghi đè ảnh cũ”. Cần thống nhất lời giải thích và nguồn dữ liệu của UI.
- Pin/tuổi thọ campaign và pin operations chưa là một mô hình duy nhất; không trình bày chúng như một chuỗi telemetry liên tục.
- Manual OPS và campaign chưa dùng cùng hoàn toàn thuật toán path/state. Nếu muốn kết quả nhất quán, cần quyết định rõ rồi thêm regression test.
- Mô hình sơ bộ của luồng cũ không được ghi đè các bằng chứng capture/downlink thật của luồng communications mới.

Tài liệu kỹ thuật ngắn bổ sung: [Mission communications](be/COMMUNICATIONS.md).
