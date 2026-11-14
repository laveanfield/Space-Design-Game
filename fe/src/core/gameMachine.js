/**
 * gameMachine -- Finite State Machine, chi tiet Loi ich / Tac hai tung linh kien,
 * Trinh tu mo khoa 9 buoc & 3 nhiem vu kiem dinh chuyen biet (Audio Gas Leak, X-Ray Crack, Camera Tilt Align).
 */

export const REP_MAX = 3;
export const INSPECT_BASE_SEC = 60;

export const PHASES = [
  { id: 'brief', label: '01.BRIEF' },
  { id: 'design', label: '02.BUILD' },
  { id: 'inspect', label: '03.INSPECT' },
  { id: 'launch', label: '04.LAUNCH_3D' },
  { id: 'life', label: '05.ORBIT_12M' },
  { id: 'review', label: '06.REVIEW' },
];

/**
 * 9 thanh phan theo dung thu tu mo khoa tuan tu:
 * 1.ORBIT -> 2.LAUNCH -> 3.BUS -> 4.INSTR -> 5.POWER -> 6.BATT -> 7.COMM -> 8.OBC -> 9.ADCS
 */
export const SLOTS = [
  {
    id: 'orbit',
    label: '1.ORBIT',
    step: 0,
    title: 'BƯỚC 1/9 • QUỸ ĐẠO BAY (ORBIT)',
    shortDesc: 'Chọn độ cao & góc nghiêng bay quanh Trái Đất.',
    highlight: 'Quyết định vùng chụp ảnh, thời gian khuất nắng (Eclipse) và mức bức xạ.',
    lockHint: '',
    nextLabel: '2.LAUNCH (Tên lửa đẩy)',
  },
  {
    id: 'launch',
    label: '2.LAUNCH',
    step: 1,
    title: 'BƯỚC 2/9 • HỆ THỐNG PHÓNG (LAUNCH VEHICLE)',
    shortDesc: 'Chọn tên lửa đẩy & bãi phóng đưa vệ tinh lên quỹ đạo đã chọn.',
    highlight: 'Phải đủ sức nâng (CAP kg) cho độ cao quỹ đạo và khoang mũi (FAIR m) vừa vệ tinh.',
    lockHint: 'Hãy xem & bấm [TIẾP THEO] ở mục 1.ORBIT trước để mở khóa!',
    nextLabel: '3.BUS (Khung vệ tinh)',
  },
  {
    id: 'bus',
    label: '3.BUS',
    step: 2,
    title: 'BƯỚC 3/9 • KHUNG VỆ TINH (SATELLITE BUS)',
    shortDesc: 'Chọn thân khung chịu lực chính chứa toàn bộ thiết bị.',
    highlight: 'Quyết định trần khối lượng tối đa (≤ kg) và công suất cấp cho Payload.',
    lockHint: 'Hãy hoàn tất bước 2.LAUNCH trước để mở khóa Khung vệ tinh!',
    nextLabel: '4.INSTR (Thiết bị quan sát / Camera)',
  },
  {
    id: 'instruments',
    label: '4.INSTR',
    step: 3,
    title: 'BƯỚC 4/9 • THIẾT BỊ QUAN SÁT (PAYLOAD / CAMERA)',
    shortDesc: 'Chọn camera hoặc cảm biến thu thập dữ liệu nhiệm vụ.',
    highlight: 'Sinh dữ liệu (GB/ngày), đòi hỏi đủ điện và độ chuẩn góc hướng (PT °).',
    lockHint: 'Hãy hoàn tất bước 3.BUS trước để mở khóa Thiết bị quan sát!',
    nextLabel: '5.POWER (Cánh pin Mặt Trời)',
  },
  {
    id: 'power',
    label: '5.POWER',
    step: 4,
    title: 'BƯỚC 5/9 • CÁNH PIN MẶT TRỜI (SOLAR ARRAY)',
    shortDesc: 'Cung cấp nguồn điện nuôi toàn bộ vệ tinh và sạc pin khi có nắng.',
    highlight: 'Điện phát (GEN W) phải đủ bù thời gian khuất bóng Trái Đất.',
    lockHint: 'Hãy hoàn tất bước 4.INSTR trước để mở khóa Cánh pin Mặt Trời!',
    nextLabel: '6.BATT (Pin dự trữ vùng tối)',
  },
  {
    id: 'battery',
    label: '6.BATT',
    step: 5,
    title: 'BƯỚC 6/9 • PIN DỰ TRỮ (BATTERY)',
    shortDesc: 'Tích trữ điện năng nuôi tàu khi bay vào vùng tối (Eclipse).',
    highlight: 'Dung lượng (CAP Wh) quá nhỏ sẽ gây sập nguồn (Brownout) khi mất nắng.',
    lockHint: 'Hãy hoàn tất bước 5.POWER trước để mở khóa Pin dự trữ!',
    nextLabel: '7.COMM (Ăng-ten truyền tin)',
  },
  {
    id: 'comm',
    label: '7.COMM',
    step: 6,
    title: 'BƯỚC 7/9 • ĂNG-TEN TRUYỀN TIN (COMMUNICATION)',
    shortDesc: 'Truyền ảnh & dữ liệu từ quỹ đạo về trạm mặt đất.',
    highlight: 'Tốc độ truyền (DL Mbps) phải kịp gửi hết dữ liệu camera sinh ra mỗi ngày.',
    lockHint: 'Hãy hoàn tất bước 6.BATT trước để mở khóa Ăng-ten truyền tin!',
    nextLabel: '8.OBC (Máy tính điều khiển)',
  },
  {
    id: 'obc',
    label: '8.OBC',
    step: 7,
    title: 'BƯỚC 8/9 • MÁY TÍNH ĐIỀU KHIỂN (ON-BOARD COMPUTER)',
    shortDesc: 'Bộ não lưu trữ dữ liệu và điều khiển mọi hoạt động trên quỹ đạo.',
    highlight: 'Độ chịu bức xạ (RAD krad) thấp sẽ khiến tàu bị treo / cháy chip do bão Mặt Trời.',
    lockHint: 'Hãy hoàn tất bước 7.COMM trước để mở khóa Máy tính OBC!',
    nextLabel: '9.ADCS (Hệ điều khiển tư thế)',
  },
  {
    id: 'adcs',
    label: '9.ADCS',
    step: 8,
    title: 'BƯỚC 9/9 • HỆ ĐIỀU HƯỚNG (ADCS)',
    shortDesc: 'Xoay và giữ ổn định vệ tinh để camera ngắm trúng mục tiêu.',
    highlight: 'Sai số góc (PT °) phải nhỏ hơn hoặc bằng yêu cầu của Camera để ảnh không bị nhòe.',
    lockHint: 'Hãy hoàn tất bước 8.OBC trước để mở khóa Hệ điều hướng ADCS!',
    nextLabel: 'KIỂM ĐỊNH LỖI (03.INSPECT)',
  },
];

export function isSlotUnlocked(slotId, buildStage = 0) {
  const slot = SLOTS.find((s) => s.id === slotId);
  if (!slot) return true;
  return buildStage >= slot.step;
}

/**
 * Co so du lieu chi tiet: Dung o dau (where), Loi ich (pros), Tac hai / Rui ro (cons)
 * cho tung linh kien de nguoi choi hieu sau khi click chon.
 */
export const PART_INSIGHTS = {
  // --- 1. ORBITS ---
  'ORB-LEO-400': {
    where: 'Quỹ đạo thấp 400 km (tương tự Trạm ISS) — dùng cho thử nghiệm CubeSat ngắn hạn, chụp ảnh độ phân giải gần.',
    pros: 'Rất dễ phóng tới (tên lửa nhỏ cũng nâng được nặng), bức xạ thấp (1 krad/năm), ảnh chụp rất gần.',
    cons: 'Khí quyển còn dày gây lực cản lớn (tuổi thọ tự nhiên chỉ ~2 năm là rơi), khuất nắng 37% thời gian.',
  },
  'ORB-LEO-500': {
    where: 'Quỹ đạo thấp tiêu chuẩn 500 km — dùng cho quan sát Trái Đất tầm gần và vệ tinh viễn thám nhỏ.',
    pros: 'Cân bằng tốt: ít lực cản khí quyển hơn 400km (bền ~10 năm), dễ đạt tới, bức xạ thấp (1.5 krad/năm).',
    cons: 'Góc chiếu sáng Mặt Trời thay đổi theo ngày, thời gian khuất bóng Trái Đất (Eclipse) chiếm 37%.',
  },
  'ORB-SSO-600': {
    where: 'Quỹ đạo đồng bộ Mặt Trời 600 km (10:30 sáng) — chuẩn vàng để chụp ảnh nông nghiệp, bờ biển, rừng và khí nhà kính.',
    pros: 'Bay qua mọi điểm trên Trái Đất cùng 1 giờ nắng địa phương giúp so sánh ảnh cực chuẩn; tuổi thọ 25 năm.',
    cons: 'Đòi hỏi tên lửa đẩy mạnh hơn LEO thường và bức xạ tăng lên 3 krad/năm.',
  },
  'ORB-SSO-DD-600': {
    where: 'Quỹ đạo Bình minh – Hoàng hôn 600 km — dùng cho kính thiên văn không gian hoặc radar cần điện liên tục.',
    pros: 'Gần như KHÔNG bao giờ vào bóng tối (Eclipse chỉ 3%), pin Mặt Trời phát điện suốt ngày đêm!',
    cons: 'Góc nhìn xuống mặt đất luôn xiên bóng dài, khó phóng hơn quỹ đạo thấp thường.',
  },
  'ORB-POLAR-800': {
    where: 'Quỹ đạo Cực 800 km — dùng cho vệ tinh Radar quét toàn cầu cả 2 cực Bắc – Nam.',
    pros: 'Bao phủ 100% bề mặt Trái Đất, thời gian liên lạc trạm mặt đất dài (65 phút/ngày).',
    cons: 'Đi qua vùng sừng bức xạ cực làm liều bức xạ tăng cao (8 krad/năm), tốn nhiên liệu tên lửa.',
  },
  'ORB-MEO-20200': {
    where: 'Quỹ đạo Trung bình 20.200 km (vùng GPS) — dùng cho nghiên cứu thời tiết không gian & hạt năng lượng cao.',
    pros: 'Nhìn bao quát nửa bán cầu, thời gian liên lạc mặt đất cực lâu (240 phút/ngày).',
    cons: 'Nằm giữa vành đai bức xạ Van Allen cực độc hại (25 krad/năm — dễ nướng cháy chip thường) và rất tốn sức tên lửa!',
  },
  'ORB-GTO': {
    where: 'Quỹ đạo chuyển tiếp Địa tĩnh (250 × 35.786 km) — dùng làm bước đệm lên GEO hoặc khảo sát từ quyển.',
    pros: 'Cắt ngang qua nhiều tầng từ quyển Trái Đất, thời gian thấy trạm mặt đất lâu.',
    cons: 'Xuyên qua tâm vành đai bức xạ (15 krad/năm), đòi hỏi tên lửa hạng trung/nặng.',
  },
  'ORB-GEO': {
    where: 'Quỹ đạo Địa tĩnh 35.786 km — dùng cho vệ tinh khí tượng/viễn thông đứng yên cố định trên 1 vùng lãnh thổ.',
    pros: 'Đứng yên 24/24 trên bầu trời (liên lạc liên tục 1440 phút/ngày), hầu như không khuất nắng (1%).',
    cons: 'Khoảng cách cực xa (camera thường sẽ chụp mờ, cần ăng-ten chảo lớn và tên lửa siêu mạnh).',
  },

  // --- 2. LAUNCH VEHICLES ---
  'LV-ELECTRON': {
    where: 'Tên lửa hạng nhẹ Rocket Lab Electron — chuyên phóng CubeSat (3U–12U) và vệ tinh siêu nhỏ lên LEO/SSO.',
    pros: 'Giá siêu rẻ ($7.5M), chế tạo nhanh (6 tháng), lý tưởng cho nhiệm vụ ngân sách thấp.',
    cons: 'Sức nâng rất nhỏ (tối đa 300kg LEO) và khoang mũi hẹp (1.2m) — gắn vệ tinh lớn sẽ vỡ fairing khi qua Max-Q!',
  },
  'LV-VEGAC': {
    where: 'Tên lửa hạng trung nhẹ Vega-C — chuyên đưa vệ tinh khoa học tầm trung (ESPA / SmallSat) lên quỹ đạo cực & SSO.',
    pros: 'Nâng được 3.300kg LEO với khoang mũi rộng 3.3m, chi phí hợp lý ($40M).',
    cons: 'Độ tin cậy thấp hơn các dòng cao cấp (88%) và thời gian chuẩn bị 18 tháng.',
  },
  'LV-LVM3': {
    where: 'Tên lửa hạng trung nặng ISRO LVM3 — dùng cho vệ tinh tầm trung/lớn lên LEO, MEO hoặc GTO.',
    pros: 'Giá rất tốt so với sức nâng ($42M cho 8.000kg LEO, khoang mũi 5.0m), độ tin cậy cao (97%).',
    cons: 'Thời gian chờ chế tạo lâu (24 tháng) — dễ gây trễ hạn nếu deadline ngắn.',
  },
  'LV-H3-24L': {
    where: 'Tên lửa đẩy H3-24L (JAXA) — dùng cho vệ tinh lớn cần khoang mũi dài 5.2m.',
    pros: 'Sức nâng mạnh (16.500kg LEO, 6.500kg GTO) với giá tầm trung ($65M).',
    cons: 'Độ tin cậy 85% và thời gian chuẩn bị 24 tháng.',
  },
  'LV-NEWGLENN': {
    where: 'Tên lửa siêu trường Blue Origin New Glenn — dùng cho đài quan sát khổng lồ hoặc vệ tinh GEO nặng.',
    pros: 'Khoang mũi khổng lồ 7.0m và sức nâng 45.000kg LEO với giá $90M.',
    cons: 'Độ tin cậy 90%, quá dư thừa và tốn kém cho các vệ tinh nhỏ.',
  },
  'LV-ARIANE62': {
    where: 'Tên lửa Ariane 62 (2 tầng đẩy phụ) — chuẩn châu Âu cho vệ tinh khoa học và viễn thám lớn.',
    pros: 'Độ tin cậy cao (97%), khoang mũi rộng 5.4m, nâng 10.300kg LEO / 4.500kg GTO.',
    cons: 'Chi phí cao ($95M) — dễ vượt ngân sách ở các màn đầu.',
  },
  'LV-VULCAN-VC6': {
    where: 'Tên lửa hạng nặng ULA Vulcan Centaur VC6 — dùng cho nhiệm vụ MEO/GEO nặng đòi hỏi lực đẩy tầng trên cao.',
    pros: 'Nâng 27.200kg LEO và 14.500kg GTO, thời gian chế tạo 18 tháng.',
    cons: 'Đắt đỏ ($110M).',
  },
  'LV-ARIANE64': {
    where: 'Tên lửa hạng nặng Ariane 64 (4 tầng đẩy phụ) — dùng cho vệ tinh nặng nhất và quỹ đạo xa.',
    pros: 'Cực khỏe (21.600kg LEO / 11.500kg GTO), khoang mũi 5.4m vừa mọi vệ tinh.',
    cons: 'Đắt nhất ($125M) và mất 24 tháng chế tạo.',
  },

  // --- 3. SATELLITE BUSES ---
  'BUS-3U': {
    where: 'Khung CubeSat 3U cỡ hộp sữa — dùng cho nhiệm vụ đầu tay giá rẻ với camera mini.',
    pros: 'Siêu rẻ ($0.4M), siêu nhẹ (1kg), làm xong trong 6 tháng.',
    cons: 'Chỉ chịu được tổng khối lượng ≤ 6kg và cấp tối đa 6W cho Payload — gắn thiết bị lớn sẽ quá tải ngay!',
  },
  'BUS-6U': {
    where: 'Khung CubeSat 6U — dùng cho vệ tinh nhỏ gắn camera cơ bản hoặc cảm biến từ trường.',
    pros: 'Rẻ ($1.2M), gọn nhẹ, chịu tải tới 12kg và cấp 25W cho thiết bị.',
    cons: 'Không chứa nổi các camera đa phổ hoặc radar nặng hàng chục kg.',
  },
  'BUS-12U': {
    where: 'Khung CubeSat 12U cỡ lớn — dùng cho nhiệm vụ tiết kiệm cần gắn cảm biến tầm trung nhẹ.',
    pros: 'Giá chỉ $3.0M, tải tối đa 24kg và cấp 50W điện.',
    cons: 'Vẫn quá nhỏ nếu muốn gắn Multispectral Imager (25kg) hay SAR Radar (85kg).',
  },
  'BUS-ESPA': {
    where: 'Khung vệ tinh vi mô ESPA (~180kg) — dùng cho nhiệm vụ chụp ảnh đa phổ hoặc hồng ngoại nhiệt.',
    pros: 'Chịu tải tới 180kg và cấp 150W điện, vừa với hầu hết tên lửa tầm trung.',
    cons: 'Giá $18M và mất 24 tháng chế tạo.',
  },
  'BUS-SMALL500': {
    where: 'Khung vệ tinh 500kg — dùng cho nhiệm vụ Radar SAR, đo khí nhà kính hoặc thiên văn.',
    pros: 'Rất khỏe: chịu tải 500kg, cấp tới 500W điện cho các cảm biến ngốn điện.',
    cons: 'Nặng (130kg khung rỗng), giá $60M và cần 30 tháng chế tạo.',
  },
  'BUS-LARGE-LEO': {
    where: 'Khung Đài quan sát LEO lớn (2.000kg) — dùng cho tổ hợp đa thiết bị nặng ở quỹ đạo thấp.',
    pros: 'Sức chứa khủng 2.000kg, cấp 2.500W điện.',
    cons: 'Rất đắt ($220M), mất 48 tháng chế tạo và bắt buộc dùng tên lửa lớn.',
  },
  'BUS-GEO': {
    where: 'Khung vệ tinh Địa tĩnh GEO (4.000kg) — chuyên dụng cho nhiệm vụ 10–15 năm ở độ cao 35.786km.',
    pros: 'Sức chứa 4.000kg, cấp 5.000W điện, chịu đựng môi trường khắc nghiệt dài hạn.',
    cons: 'Giá khổng lồ ($450M) và mất 60 tháng chế tạo.',
  },

  // --- 4. INSTRUMENTS (PAYLOAD) ---
  'INS-01': {
    where: 'Camera màu RGB nhỏ gọn — dùng chụp ảnh Trái Đất cơ bản ở quỹ đạo thấp (LEO/SSO).',
    pros: 'Siêu nhẹ (0.8kg), tốn ít điện (4W), sinh ít dữ liệu (0.4 GB/ngày), giá rẻ ($0.3M).',
    cons: 'Hàng giá rẻ (tier Basic): chất lượng quang học cơ bản và ốc giữ camera dễ bị lệch góc nhiều khi lắp ráp!',
  },
  'INS-02': {
    where: 'Camera Đa phổ (Multispectral Imager) — dùng giám sát bờ biển, nông nghiệp, rừng và lũ lụt.',
    pros: 'Chụp nhiều dải bước sóng cho điểm khoa học cao (40 pts), độ tin cậy tốt.',
    cons: 'Nặng 25kg, tốn 45W điện, sinh 12 GB dữ liệu/ngày và cần ADCS giữ góc chuẩn ≤ 0.1°.',
  },
  'INS-03': {
    where: 'Camera Hồng ngoại Nhiệt (Thermal IR) — dùng phát hiện cháy rừng, núi lửa và đảo nhiệt đô thị ban đêm.',
    pros: 'Nhìn xuyên khói mù để bắt điểm nóng cháy rừng, nặng vừa phải (12kg, 30W).',
    cons: 'Đòi hỏi giữ góc ≤ 0.1° và sinh 8 GB dữ liệu/ngày.',
  },
  'INS-04': {
    where: 'Thiết bị Siêu phổ (Hyperspectral) — dùng phân tích thành phần hóa học và khoáng vật chi tiết.',
    pros: 'Điểm khoa học rất cao (70 pts), phân tích hàng trăm kênh màu.',
    cons: 'Rất nặng (60kg, 120W), sinh 40 GB/ngày và đòi hỏi giữ góc cực chuẩn ≤ 0.05°.',
  },
  'INS-05': {
    where: 'Radar khẩu độ tổng hợp (Small SAR X-band) — dùng chụp xuyên mây mù, bão lũ bất kể ngày đêm.',
    pros: 'Hoạt động trong mọi thời tiết (80 pts), không sợ mây che.',
    cons: 'Ngốn tới 450W điện và sinh 150 GB dữ liệu/ngày — bắt buộc dùng cánh pin lớn & ăng-ten Ka/Laser!',
  },
  'INS-06': {
    where: 'Máy đo Khí nhà kính (Atmospheric Gas Sounder) — dùng đo CO2 và CH4 toàn cầu.',
    pros: 'Độ nhạy khí quyển cực cao (75 pts).',
    cons: 'Rất nặng (140kg), tốn 150W điện, giá $90M và chế tạo mất 42 tháng.',
  },
  'INS-07': {
    where: 'Từ kế Fluxgate (Magnetometer) — dùng đo từ trường Trái Đất và bão từ.',
    pros: 'Nhẹ (1.5kg), chỉ tốn 2W điện, gần như không cần giữ góc khắt khe (±10°).',
    cons: 'Không chụp được ảnh bề mặt Trái Đất (chỉ thu số liệu từ trường).',
  },
  'INS-08': {
    where: 'Đầu dò Hạt & Bức xạ (Particle Detector) — dùng cho nhiệm vụ Thời tiết không gian ở MEO/GTO.',
    pros: 'Nhẹ (3kg, 5W), dữ liệu rất nhẹ (0.05 GB/ngày), chịu được quỹ đạo cao.',
    cons: 'Chỉ đo hạt bức xạ, không dùng để chụp ảnh mặt đất.',
  },
  'INS-09': {
    where: 'Kính thiên văn Không gian UV/Quang học 0.3m — dùng quan sát thiên hà và sao xa.',
    pros: 'Độ phân giải thiên văn xuất sắc (80 pts).',
    cons: 'Đòi hỏi hệ điều hướng siêu chính xác ADCS-FINE (≤ 0.001°) và giá $120M.',
  },
  'INS-10': {
    where: 'Phổ kế Khảo sát Bầu trời Hồng ngoại gần — dùng lập bản đồ vũ trụ ở quỹ đạo Dawn-Dusk.',
    pros: 'Điểm khoa học tối đa (85 pts).',
    cons: 'Chỉ hoạt động ở quỹ đạo ORB-SSO-DD-600, nặng 110kg và giá $100M.',
  },

  // --- 5. SOLAR ARRAYS (POWER) ---
  'PWR-SA-BODY': {
    where: 'Pin Mặt Trời dán sát thân (3U) — dùng cho CubeSat siêu nhỏ mang thiết bị vài Watt.',
    pros: 'Rất rẻ ($0.25M), nhẹ (0.3kg), không sợ kẹt bản lề bung cánh.',
    cons: 'Chỉ phát được 12W điện — gắn camera hay ăng-ten mạnh sẽ sập nguồn ngay!',
  },
  'PWR-SA-DEP': {
    where: 'Cánh pin Mặt Trời bung mở (6U–12U) — dùng cho CubeSat và vệ tinh nhỏ.',
    pros: 'Phát 60W điện mà chỉ nặng 1.5kg, giá $1.0M, đủ nuôi camera RGB + ăng-ten S-band.',
    cons: 'Chưa đủ nuôi các camera đa phổ hay radar hàng trăm Watt.',
  },
  'PWR-SA-SMALL': {
    where: 'Cánh pin SmallSat (350W) — dùng cho vệ tinh ESPA và SmallSat tầm trung.',
    pros: 'Phát 350W ổn định, suy hao thấp (1.5%/năm), nuôi tốt camera đa phổ & hồng ngoại.',
    cons: 'Nặng 11kg (không lắp vừa khung CubeSat 3U/6U).',
  },
  'PWR-SA-LARGE': {
    where: 'Cánh pin LEO cỡ lớn (2.500W) — dùng cho vệ tinh Radar SAR hoặc tổ hợp nhiều cảm biến nặng.',
    pros: 'Cung cấp nguồn điện dồi dào 2.5kW.',
    cons: 'Nặng 65kg và giá $18M.',
  },
  'PWR-SA-GEO': {
    where: 'Cánh pin Địa tĩnh khổng lồ (6.000W) — dùng cho đài quan sát GEO hoạt động trên 10 năm.',
    pros: 'Công suất cực đại 6kW.',
    cons: 'Nặng 150kg và giá $45M.',
  },

  // --- 6. BATTERIES ---
  'BAT-S': {
    where: 'Pin Li-ion nhỏ (40 Wh) — dùng giữ nguồn cho CubeSat 3U–6U khi bay qua bóng tối Trái Đất.',
    pros: 'Nhẹ (0.3kg), rẻ ($0.1M), giao hàng nhanh (3 tháng).',
    cons: 'Dung lượng thấp (40 Wh) — nếu tải tiêu thụ > 15W sẽ cạn sạch pin khi vào vùng tối (Eclipse)!',
  },
  'BAT-M': {
    where: 'Pin Li-ion tầm trung (200 Wh) — dùng cho CubeSat 12U và vệ tinh nhỏ ở quỹ đạo thấp.',
    pros: 'Dung lượng 200 Wh an toàn cho thiết bị tầm vừa, chỉ nặng 1.4kg, giá $0.4M.',
    cons: 'Không gánh nổi Radar SAR hay thiết bị > 100W qua vùng tối.',
  },
  'BAT-L': {
    where: 'Pin Li-ion dung lượng lớn (1.000 Wh) — dùng cho vệ tinh viễn thám tầm trung và lớn.',
    pros: 'Dự trữ 1 kWh giúp tàu vượt qua vùng tối an toàn ngay cả khi mang cảm biến lớn.',
    cons: 'Nặng 6.5kg (lưu ý giới hạn khối lượng nếu dùng khung CubeSat nhỏ).',
  },
  'BAT-XL': {
    where: 'Tổ hợp Pin GEO (8.000 Wh) — dùng cho vệ tinh hạng nặng và địa tĩnh.',
    pros: 'Dung lượng 8 kWh cực lớn, xả sâu tới 60%.',
    cons: 'Rất nặng (55kg) và giá $12M.',
  },

  // --- 7. COMMUNICATIONS (COMM) ---
  'COM-UHF': {
    where: 'Bộ đàm vô tuyến UHF — chỉ dùng truyền tín hiệu báo cáo sức khỏe tàu hoặc cảm biến từ trường siêu nhẹ.',
    pros: 'Siêu rẻ ($0.1M), nhẹ (0.1kg), không cần hướng ăng-ten chính xác (±30°).',
    cons: 'Băng thông cực chậm (0.0096 Mbps) — KHÔNG THỂ truyền kịp ảnh chụp, sẽ gây tràn bộ nhớ!',
  },
  'COM-S-CUBE': {
    where: 'Bộ phát S-band CubeSat — dùng tải ảnh từ Camera RGB nhỏ (INS-01) ở quỹ đạo thấp.',
    pros: 'Tốc độ 2 Mbps vừa đủ cho camera nhỏ, nhẹ (0.4kg) và rẻ ($0.3M).',
    cons: 'Tầm phát tối đa 3.000km (không dùng được ở MEO/GEO) và bị nghẽn nếu dùng camera Đa phổ/Radar.',
  },
  'COM-X-SMALL': {
    where: 'Bộ phát X-band SmallSat (50 Mbps) — dùng truyền ảnh Đa phổ & Hồng ngoại ở LEO/SSO.',
    pros: 'Tốc độ nhanh 50 Mbps, tải sạch dữ liệu của hầu hết camera tầm trung.',
    cons: 'Tiêu thụ 35W điện, nặng 3kg và chỉ phủ sóng ≤ 3.000km.',
  },
  'COM-KA-LEO': {
    where: 'Ăng-ten Ka-band tốc độ cao (500 Mbps) — dùng cho vệ tinh Radar SAR và Siêu phổ.',
    pros: 'Băng thông cực lớn 500 Mbps, không bao giờ lo tắc nghẽn dữ liệu ở LEO.',
    cons: 'Ngốn 120W điện, nặng 12kg và cần giữ góc hướng ≤ 0.5°.',
  },
  'COM-OPT-LEO': {
    where: 'Thiết bị truyền tin Laser Quang học (1.000 Mbps) — dùng khi cần tốc độ tối đa ở LEO.',
    pros: 'Tốc độ 1 Gbps nhanh nhất hệ thống.',
    cons: 'Đòi hỏi giữ góc cực kỳ khắt khe (≤ 0.01°) và dễ bị mây che cản tia laser.',
  },
  'COM-X-MGA': {
    where: 'Ăng-ten X-band độ lợi trung bình — dùng cho quỹ đạo xa (MEO 20.200km & GTO).',
    pros: 'Tầm phát xa tới 60.000km (bắt sóng tốt từ MEO/GTO về mặt đất).',
    cons: 'Tốn 90W điện và nặng 8kg.',
  },
  'COM-X-HGA': {
    where: 'Chảo ăng-ten X-band 1.5m — dùng cho quỹ đạo GEO hoặc không gian sâu.',
    pros: 'Tầm phát 400.000km, tốc độ 60 Mbps.',
    cons: 'Chảo lớn (cần kiểm tra vừa khoang mũi tên lửa), nặng 25kg, tốn 150W.',
  },
  'COM-KA-GEO': {
    where: 'Hệ truyền dẫn Ka-band GEO — dùng truyền dữ liệu lớn từ độ cao 35.786km.',
    pros: 'Tầm xa 100.000km với tốc độ 300 Mbps.',
    cons: 'Nặng 40kg, ngốn 280W điện và giá $45M.',
  },

  // --- 8. ON-BOARD COMPUTER (OBC) ---
  'OBC-BASIC': {
    where: 'Vi điều khiển OBC cơ bản — dùng cho CubeSat bay ngắn hạn ở quỹ đạo rất thấp (LEO 400–500km).',
    pros: 'Siêu rẻ ($0.05M), nhẹ 50g, chỉ tốn 0.5W điện.',
    cons: 'Chịu bức xạ rất kém (10 krad) và bộ nhớ chỉ 4GB — lên quỹ đạo cao sẽ bị bão Mặt Trời đánh sập!',
  },
  'OBC-CUBE': {
    where: 'Máy tính CubeSat Linux — dùng cho vệ tinh nhỏ chụp ảnh ở LEO và SSO.',
    pros: 'Bộ nhớ 32GB lưu ảnh tốt, chịu bức xạ 20 krad, giá rẻ ($0.15M).',
    cons: 'Chưa chịu nổi vùng bức xạ nặng ở MEO/GTO trong nhiều năm.',
  },
  'OBC-SPACE': {
    where: 'Bo mạch xử lý chuẩn Không gian (Space-grade) — dùng cho nhiệm vụ viễn thám kéo dài 3–5 năm.',
    pros: 'Chịu bức xạ 50 krad rất an toàn ở LEO/SSO/Polar, bộ nhớ 128GB.',
    cons: 'Giá $1.5M và tiêu thụ 8W điện.',
  },
  'OBC-RADHARD': {
    where: 'Máy tính chống bức xạ cấp Quân sự/Vũ trụ sâu (Rad-Hard) — bắt buộc cho quỹ đạo MEO, GTO, GEO.',
    pros: 'Bất tử trước bão bức xạ (chịu tới 200 krad), hoạt động bền bỉ hàng chục năm.',
    cons: 'Nặng 8kg, tốn 25W điện và giá $12M.',
  },

  // --- 9. ATTITUDE CONTROL (ADCS) ---
  'ADCS-MAG': {
    where: 'Cuộn từ trường + Cảm biến Mặt Trời — dùng cho vệ tinh đo từ trường/bức xạ không cần chụp ảnh nét.',
    pros: 'Rẻ ($0.1M), nhẹ (0.2kg), rất bền.',
    cons: 'Sai số góc rất lớn (±5.0°) — nếu gắn Camera chụp ảnh thì toàn bộ ảnh sẽ bị NHÒE (BLUR)!',
  },
  'ADCS-WHEEL': {
    where: 'Bánh đà phản ứng 3 trục (Reaction Wheels) — dùng cho CubeSat gắn Camera RGB cơ bản (INS-01).',
    pros: 'Giữ góc chuẩn ±1.0° (vừa khít yêu cầu của Camera RGB INS-01), nhẹ (1kg), giá $0.6M.',
    cons: 'Chưa đủ chính xác cho Camera Đa phổ (±0.1°) hay Siêu phổ (±0.05°).',
  },
  'ADCS-STAR': {
    where: 'Bánh đà + Ống ngắm Sao (Star Tracker) — dùng cho hầu hết vệ tinh chụp ảnh Đa phổ, Nhiệt, Radar.',
    pros: 'Độ chính xác cao (±0.05°), đảm bảo ảnh chụp sắc nét không bao giờ bị nhòe ở mọi camera viễn thám.',
    cons: 'Nặng 6kg, tốn 15W điện và giá $4.0M.',
  },
  'ADCS-FINE': {
    where: 'Hệ thống điều hướng siêu tinh (Fine-pointing) — chuyên dụng cho Kính thiên văn không gian (INS-09).',
    pros: 'Độ chính xác tuyệt đối (±0.001°), khóa chết mục tiêu giữa các vì sao.',
    cons: 'Rất nặng (30kg), tốn 60W điện và giá $25M.',
  },
};

export function getPartInsight(slot, item) {
  if (!item) return null;
  if (PART_INSIGHTS[item.id]) return PART_INSIGHTS[item.id];
  return {
    where: item.description_simple || `Sử dụng cho phân hệ ${slot.toUpperCase()}.`,
    pros: `Đáp ứng thông số chuẩn của ${item.name || item.id}.`,
    cons: item.cost_musd > 50 ? 'Chi phí đầu tư và khối lượng lớn.' : 'Cần kiểm tra kỹ tương thích công suất và tải trọng.',
  };
}

/**
 * 3 hang muc kiem dinh chuyen biet (Phase 03.INSPECT):
 * 1. GAS_LEAK_AUDIO: Tim loi xi ga qua am thanh (Audio Hiss khi lia chuot den gan).
 * 2. STRUCT_CRACK_XRAY: Bat che do X-Ray Mesh trang thua de soi vet nut (o FULL STACK hoac giau trong PAYLOAD FOCUS).
 * 3. CAMERA_TILT_ALIGN: Chinh goc nghieng Camera ve 0.0 do bang keo chuot (camera cang dom goc lech cang lon).
 */
export const CHECKLIST_TEMPLATES = [
  {
    id: 'GAS_LEAK_AUDIO',
    kind: 'audio_leak',
    label: '1. RÒ RỈ KHÍ GA [NGHE AUDIO]',
    group: 'rocket',
    basePos: [-0.11, -0.28, 0.18],
    meter: 'pressureDiff',
    symptom: 'Không có dấu hiệu bằng mắt thường! Hãy lia chuột nghe tiếng xì ga TO DẦN rồi NHỎ DẦN để bấm trúng tâm điểm rò.',
  },
  {
    id: 'STRUCT_CRACK_XRAY',
    kind: 'xray_crack',
    label: '2. VẾT NỨT KẾT CẤU [X-RAY VÀNG]',
    group: 'sat',
    basePos: [0.06, 0.56, 0.15],
    meter: 'structVib',
    symptom: 'Bật [X-RAY MESH] tìm đường nứt ngoằn nghoèo nhỏ màu vàng để bấm hàn (Tên lửa dỏm sẽ có nhiều hơn 1 vết nứt!).',
  },
  {
    id: 'CAMERA_TILT_ALIGN',
    kind: 'camera_align',
    label: '3. CÂN CHỈNH GƯƠNG CAMERA [0°]',
    group: 'sat',
    basePos: [0.0, 0.72, 0.16],
    meter: 'emiNoise',
    symptom: 'Gương phản xạ của Camera bị lệch & rơ bánh răng — kéo ghì chuột đưa gương về 0.0° và giữ ổn định để khóa chốt.',
  },
];

export function canEnterPhase(targetPhase, { currentPhase, launchResult, design, inspectReport, flightData, lifeData, outcome }) {
  if (currentPhase === 'launch' && !launchResult) return false;
  if (targetPhase === 'design' || targetPhase === 'inspect') return Boolean(design);
  if (targetPhase === 'launch') return Boolean(flightData && inspectReport);
  if (targetPhase === 'life') return Boolean(lifeData);
  if (targetPhase === 'review') return Boolean(outcome);
  return true;
}

export function resolvePresetDesign(presets, presetId, missionDetail) {
  if (presetId === 'starter' && missionDetail?.starter && typeof missionDetail.starter === 'object') {
    return {
      schema_version: 'design/1',
      mission: missionDetail.id || missionDetail.starter.mission,
      seed: missionDetail.hazards?.seed ?? missionDetail.starter.seed ?? 0,
      ...structuredClone(missionDetail.starter),
    };
  }
  const map = Object.fromEntries((presets || []).map((p) => [p.id, p]));
  const pick = (typeof presetId === 'string' && map[presetId]) || presets?.[0];
  if (!pick) {
    if (missionDetail?.starter && typeof missionDetail.starter === 'object') {
      return {
        schema_version: 'design/1',
        mission: missionDetail.id,
        seed: missionDetail.hazards?.seed ?? 0,
        ...structuredClone(missionDetail.starter),
      };
    }
    return null;
  }

  let base = pick.design ? structuredClone(pick.design) : null;
  if (!base && pick.from && map[pick.from]?.design) {
    base = structuredClone(map[pick.from].design);
    if (pick.swap) {
      Object.entries(pick.swap).forEach(([k, v]) => {
        base[k] = structuredClone(v);
      });
    }
  }
  if (!base) return null;
  return {
    schema_version: 'design/1',
    mission: missionDetail?.id || base.mission,
    seed: missionDetail?.hazards?.seed ?? 0,
    ...base,
  };
}

/** Tinh 4 thanh KPI song con (POWER, MASS, SIGNAL, INTEGRITY) cho Phase 02.BUILD. */
export function computeCoreBars(metrics, fitOk = true) {
  if (!metrics) return null;
  const loadW = Math.max(0.1, Number(metrics['power.load_w'] || 0));
  const marginW = Number(metrics['power.margin_w'] || 0);
  const pwrPct = Math.max(8, Math.min(100, ((marginW + loadW) / (loadW * 1.4)) * 100));
  const pwrStatus = marginW < 0 ? 'err' : marginW < loadW * 0.15 ? 'warn' : 'ok';

  const dryKg = Number(metrics['mass.dry_kg'] || 0);
  const capKg = Number(metrics['mass.capacity_kg'] || 0);
  const busLimit = Number(metrics['mass.bus_limit_kg'] || 1e9);
  const compat = Number(metrics['launch.compatible'] ?? 1) > 0.5;
  const effLimit = capKg > 0 ? Math.min(capKg, busLimit) : busLimit;
  const massOver = !fitOk || !compat || dryKg > effLimit;
  const massFrac = dryKg / Math.max(1, effLimit);
  const massPct = massOver ? 18 : Math.max(25, Math.min(100, (1.12 - massFrac) * 100));
  const massStatus = massOver ? 'err' : massFrac > 0.88 ? 'warn' : 'ok';

  const genGb = Math.max(0.01, Number(metrics['data.generated_gb_per_day'] || 0));
  const dlGb = Number(metrics['data.downlink_gb_per_day'] || 0);
  const dlRatio = Math.min(1, dlGb / genGb);
  const adcsDeg = Number(metrics['pointing.adcs_deg'] || 1);
  const reqDeg = Math.max(0.001, Number(metrics['pointing.required_deg'] || 1));
  const ptRatio = adcsDeg <= reqDeg ? 1 : Math.max(0.1, reqDeg / adcsDeg);
  const sigPct = Math.max(10, Math.min(100, (0.5 * dlRatio + 0.5 * ptRatio) * 100));
  const sigStatus = dlRatio < 0.85 || adcsDeg > reqDeg ? 'err' : dlRatio < 1.0 ? 'warn' : 'ok';

  const dose = Math.max(0.1, Number(metrics['radiation.dose_krad'] || 0));
  const tol = Number(metrics['radiation.tolerance_krad'] || 0);
  const radRatio = tol / dose;
  const lifeY = Number(metrics['lifetime.years'] || 0);
  const intPct = Math.max(10, Math.min(100, (Math.min(radRatio, 1.5) / 1.5) * 80 + Math.min(1, lifeY / 1.5) * 20));
  const intStatus = radRatio < 1.05 || lifeY < 0.8 ? 'err' : radRatio < 1.4 ? 'warn' : 'ok';

  return {
    power: { pct: pwrPct, status: pwrStatus, tag: `${marginW >= 0 ? '+' : ''}${marginW.toFixed(0)}W` },
    mass: {
      pct: massPct,
      status: massStatus,
      tag: !fitOk ? 'NO-FIT' : dryKg > busLimit ? 'BUS-OVER' : `${dryKg.toFixed(0)}kg`,
    },
    signal: {
      pct: sigPct,
      status: sigStatus,
      tag: dlRatio < 0.9 ? 'DL-LOW' : adcsDeg > reqDeg ? 'BLUR' : 'LOCK',
    },
    integrity: {
      pct: intPct,
      status: intStatus,
      tag: radRatio < 1 ? 'RAD-FAIL' : lifeY < 1 ? 'DECAY' : `${tol.toFixed(0)}krad`,
    },
  };
}

/**
 * Sinh 3 nhiem vu kiem dinh ngau nhien cho Phase 03.INSPECT:
 * 1. GAS_LEAK_AUDIO: Vi tri ngau nhien doc than ten lua (FULL STACK).
 * 2. STRUCT_CRACK_XRAY: Vet nut ket cau (ngau nhien o FULL STACK hoac giau trong PAYLOAD FOCUS).
 * 3. CAMERA_TILT_ALIGN: Goc lech ban dau phu thuoc do "dom" (tier) cua Camera dang gan tren tau.
 */
export function generateInspectionDefects(salt = Date.now(), design = null, catalog = null) {
  let state = (Math.floor(salt) ^ 0x9e3779b9) >>> 0;
  const rnd = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  // 1. Xac dinh camera dang gan tren ve tinh -> Goc lech & benh guong phan xa do "dom"
  const firstInsId = design?.instruments?.[0] || 'INS-01';
  const insItem = catalog?.tables?.instruments?.[firstInsId];
  const tier = insItem?.tier || 'basic';
  let tiltMagnitude = 22;
  let mirrorIssue = '';
  if (tier === 'basic') {
    tiltMagnitude = Math.round(20 + rnd() * 8); // 20° .. 28° cho camera dom/re tien
    mirrorIssue =
      'Camera giá rẻ (Basic): Gương phản xạ bị RƠ BÁNH RĂNG & KẸT LÒ XO HỒI VỊ (Gear Backlash) do gia công dỏm — kéo rất nặng tay và nếu thả chuột sớm gương sẽ bị bật lệch trở lại!';
  } else if (tier === 'advanced') {
    tiltMagnitude = Math.round(12 + rnd() * 5); // 12° .. 17° cho camera tam trung
    mirrorIssue =
      'Camera tầm trung (Advanced): Gương hội tụ bị trôi ốc hãm ma sát do rung động vận chuyển — cần kéo chậm và giữ ở 0.0° để khóa chốt.';
  } else {
    tiltMagnitude = Math.round(7 + rnd() * 5); // 7° .. 12° cho camera cao cap
    mirrorIssue =
      'Camera cao cấp (Expert): Gương tinh chỉnh lệch nhẹ khỏi trục chuẩn — kéo mượt về 0.0° để khóa ngàm quang học.';
  }
  const tiltSign = rnd() > 0.5 ? 1 : -1;
  const initialTiltDeg = tiltSign * tiltMagnitude;

  // 2. Xac dinh ten lua dang chon -> Rocket dom/re tien se co hon 1 vet nut ngoan nghoeo mau vang!
  const lvId = design?.launch?.vehicle || 'LV-ELECTRON';
  const lvItem = catalog?.tables?.launch_vehicles?.[lvId];
  const lvRel = Number(lvItem?.reliability ?? 0.95);
  const lvCost = Number(lvItem?.cost_musd ?? 10);
  const isCheapRocket = lvRel < 0.96 || lvCost <= 40 || lvId === 'LV-ELECTRON' || lvId === 'LV-VEGAC' || lvId === 'LV-H3-24L';
  const crackCount = isCheapRocket ? (rnd() > 0.45 ? 3 : 2) : 1;

  const cracks = [];
  for (let i = 0; i < crackCount; i++) {
    // Dam bao neu co >= 2 vet thi co ca o FULL STACK va PAYLOAD FOCUS de nguoi choi phai soi ky ca 2
    const inPayload = crackCount === 1 ? rnd() > 0.45 : i === crackCount - 1;
    const cy = inPayload ? -0.08 + rnd() * 0.34 : -0.68 + (i * 0.42 + rnd() * 0.28);
    const cx = (rnd() - 0.5) * 0.16;
    cracks.push({
      subId: `CRACK_${i + 1}`,
      mode: inPayload ? 'payload' : 'stack',
      pos: [cx, cy, 0.19],
      seed: Math.floor(rnd() * 10000),
    });
  }

  // 3. Vi tri xi ga ngau nhien doc than ten lua (khong hien diem tren man hinh, chi nghe tieng xi to/nho)
  const leakY = -0.6 + rnd() * 0.75;
  const leakX = (rnd() - 0.5) * 0.14;

  return [
    {
      ...CHECKLIST_TEMPLATES[0],
      requiredMode: 'stack',
      pos: [leakX, leakY, 0.18],
    },
    {
      ...CHECKLIST_TEMPLATES[1],
      isCheapRocket,
      rocketName: lvItem?.name || lvId,
      cracks,
      hiddenInPayload: cracks.some((c) => c.mode === 'payload'),
      pos: cracks[0].pos,
    },
    {
      ...CHECKLIST_TEMPLATES[2],
      requiredMode: 'payload',
      initialTiltDeg,
      cameraName: insItem?.name || firstInsId,
      cameraTier: tier,
      mirrorIssue,
      pos: [0.0, 0.18, 0.2],
    },
  ];
}

/** Danh gia hau qua khi ket thuc Phase 03.INSPECT. */
export function evaluateInspectionOutcome(defects, fixedIds) {
  const unfixed = (defects || []).filter((d) => !fixedIds.includes(d.id));
  if (unfixed.length === 0) {
    return { mode: 'clean', unfixed: [], flightFailure: null, orbitFault: null };
  }
  const hasRocketFault = unfixed.some((d) => d.id === 'GAS_LEAK_AUDIO' || (d.id === 'STRUCT_CRACK_XRAY' && !d.hiddenInPayload));
  if (unfixed.length >= 2 || hasRocketFault) {
    const names = unfixed.map((d) => d.label).join(', ');
    return {
      mode: 'launch_explode',
      unfixed,
      flightFailure: {
        kind: 'inspection_catastrophe',
        t: 26.0,
        explode: true,
        constraint: 'inspection',
        title: {
          vi: `NỔ TÊN LỬA DO BỎ SÓT LỖI KIỂM ĐỊNH (${names})`,
          en: `VEHICLE EXPLOSION: MISSED PRE-FLIGHT DEFECTS (${names})`,
        },
        cause: {
          vi: `Đội kiểm định đã bỏ sót ${unfixed.length} lỗi phần cứng nghiêm trọng (${names}) trước khi rời bệ. Tên lửa mất ổn định và phát nổ trên đường bay.`,
          en: `Pre-flight inspection missed critical hardware defects (${names}). The stack suffered catastrophic failure in flight.`,
        },
        numbers: unfixed.map((d) => ({ label: d.label, value: 'UNFIXED' })),
      },
      orbitFault: null,
    };
  }
  return {
    mode: 'orbit_early_fail',
    unfixed,
    flightFailure: null,
    orbitFault: unfixed[0],
  };
}
