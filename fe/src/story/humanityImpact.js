/**
 * Storytelling cố định (không random) về hậu quả nhân loại & Trái Đất phải gánh chịu (hoặc được cứu giúp)
 * sau mỗi màn chơi trong 3 màn chiến dịch chính:
 * 1. MP-SC01-FIRST-EYES (Cháy rừng & sơ tán dân cư)
 * 2. MP-SC03-SPACE-WEATHER (Bão địa từ G5, sập lưới điện & hàng không vùng cực)
 * 3. MP-SC04-GHG (Rò rỉ khí Methane, hạn mặn & khủng hoảng mùa màng)
 */

export const HUMANITY_STORIES = {
  'MP-SC01-FIRST-EYES': {
    missionKey: 'wildfire',
    levelTag: 'STORY 01 // CHIẾN DỊCH CỨU HỘ RỪNG NHIỆT ĐỚI',
    fail: {
      badge: 'THẢM HỌA SINH THÁI & DÂN SINH',
      headline: 'MÙ THÔNG TIN GIỮA MÙA LỬA ĐỎ: 142.000 HA RỪNG HÓA TRO TÀN',
      causeByFailure: {
        data: 'Vệ tinh chụp được đám cháy nhưng ăng-ten UHF băng thông hẹp làm nghẽn toàn bộ dữ liệu trên quỹ đạo — không một bức ảnh tọa độ lửa nào kịp truyền về trạm mặt đất.',
        power: 'Tấm pin mặt trời công suất thấp khiến vệ tinh sập nguồn (Brown-out) khi bay qua vùng tối đúng vào thời điểm đám cháy bùng phát.',
        pointing: 'Hệ thống điều khiển tư thế (ADCS) thiếu bánh đà phản ứng làm ảnh chụp bị nhòe nặng, không thể xác định tọa độ tâm lửa.',
        blur: 'Hệ thống điều khiển tư thế (ADCS) thiếu bánh đà phản ứng làm ảnh chụp bị nhòe nặng, không thể xác định tọa độ tâm lửa.',
        radiation: 'Máy tính trên tàu (OBC) treo cứng do bức xạ, bỏ lỡ toàn bộ các lượt bay qua vùng rừng đang cháy.',
        inspection_fault: 'Lỗi lắp ráp bị bỏ sót từ xưởng kiểm định khiến vệ tinh mất khả năng vận hành ngay khi vừa tách tầng.',
        launch: 'Vệ tinh không thể lên tới quỹ đạo làm việc, để lại khoảng trống quan trắc hoàn toàn trên bầu trời suốt mùa khô.',
        default: 'Vệ tinh không thể lên tới quỹ đạo làm việc, để lại khoảng trống quan trắc hoàn toàn trên bầu trời suốt mùa khô.',
      },
      paragraphs: [
        'Trong 72 giờ vàng đầu tiên của đợt hạn hán kỷ lục, Sở Chỉ huy Cứu hỏa Liên vùng chờ đợi tín hiệu cảnh báo nhiệt từ quỹ đạo nhưng màn hình trạm mặt đất chỉ toàn nhiễu trắng. Không có tọa độ điểm nóng sớm, đám cháy âm ỉ ở sườn Tây khu bảo tồn đã gặp gió phơn khô nóng và bùng lên thành siêu đám cháy vượt ngoài tầm khống chế.',
        'Khi trực thăng tuần tra phát hiện bằng mắt thường thì bức tường lửa đã cao tới 40 mét. Lệnh sơ tán đưa ra quá muộn khiến hàng chục thị trấn ven rừng rơi vào hỗn loạn trong đêm khói đặc quánh.',
      ],
      metrics: [
        {
          label: 'THẢM RỪNG BỊ THIÊU RỤI',
          value: '142.000 ha',
          sub: 'Rừng nguyên sinh & hệ sinh thái cổ thụ mất trắng',
        },
        {
          label: 'CƯ DÂN PHẢI DI TẢN KHẨN CẤP',
          value: '38.500 người',
          sub: '14 thị trấn bị cô lập, 1.200 mái nhà cháy rụi',
        },
        {
          label: 'KHÓI ĐỘC & CO₂ PHÁT TÁN',
          value: '410 triệu tấn',
          sub: 'Bụi mịn PM2.5 bao phủ hạ lưu suốt 21 ngày',
        },
      ],
      moral:
        'THÔNG ĐIỆP MÀN 1: Một vệ tinh chụp được ảnh nhưng không truyền nổi dữ liệu về mặt đất thì chỉ là nhân chứng câm trên bầu trời. Cắt xén vài trăm nghìn đô tiền ăng-ten và nguồn điện đã bắt nhân loại trả giá bằng cả một đại ngàn trăm tuổi.',
    },
    ok: {
      badge: 'SỨ MỆNH BẢO VỆ TRÁI ĐẤT THÀNH CÔNG',
      headline: '14 PHÚT VÀNG TỪ QUỸ ĐẠO: CỨU SỐNG 142.000 HA RỪNG NGUYÊN SINH',
      causeBridge:
        'Nhờ đường truyền S-Band tốc độ cao, nguồn điện ổn định và hệ thống bánh đà giữ hướng chuẩn xác, đủ 3 gói ảnh tọa độ đám cháy độ phân giải cao đã về tới Sở Chỉ huy ngay trong lượt bay đầu tiên.',
      paragraphs: [
        'Chỉ 14 phút sau khi đám lửa đầu tiên bén vào thảm thực vật khô ở sườn Tây, vệ tinh đã khóa mục tiêu và truyền thẳng tọa độ nhiệt về Trung tâm Cứu hộ Mặt đất. Đội máy bay thả nước và lực lượng kiểm lâm lập tức khoanh vùng dập tắt ngọn lửa trước khi gió phơn kịp thổi bùng.',
        'Toàn bộ hành lang rừng già và 14 thị trấn ven núi đã đi qua mùa khô khắc nghiệt nhất thập kỷ mà không mất một sinh mạng nào.',
      ],
      metrics: [
        {
          label: 'THẢM RỪNG ĐƯỢC BẢO VỆ',
          value: '142.000 ha',
          sub: 'Dập tắt sớm 100% điểm nóng ngay từ vành đai ngoài',
        },
        {
          label: 'CƯ DÂN ĐƯỢC AN TOÀN',
          value: '38.500 người',
          sub: '14 thị trấn ven rừng không phải sơ tán trong đêm',
        },
        {
          label: 'KHÍ THẢI ĐƯỢC NGĂN CHẶN',
          value: '410 triệu tấn',
          sub: 'Giữ nguyên lá phổi xanh cho toàn vùng hạ lưu',
        },
      ],
      moral:
        'THÔNG ĐIỆP MÀN 1: Dữ liệu đúng lúc là ranh giới giữa một đốm lửa nhỏ và một thảm họa quốc gia. Khi kỹ sư bảo vệ được đường truyền từ quỹ đạo, hàng vạn sinh mạng dưới mặt đất được bình yên.',
    },
  },

  'MP-SC03-SPACE-WEATHER': {
    missionKey: 'space_weather',
    levelTag: 'STORY 02 // PHÒNG TUYẾN BÃO ĐỊA TỪ BẮC BÁN CẦU',
    fail: {
      badge: 'THẢM HỌA HẠ TẦNG & HÀNG KHÔNG',
      headline: 'ĐÊM ĐEN BẮC BÁN CẦU: BÃO TỪ G5 ĐÁNH SẬP LƯỚI ĐIỆN VÌ TRẠM GÁC CÂM LẶNG',
      causeByFailure: {
        radiation:
          'Bộ máy tính trên tàu (OBC) không phải chuẩn chống bức xạ (Rad-Hard) đã bị hạt năng lượng cao trong vành đai Van Allen bắn thủng cổng logic (Latch-up), làm trạm gác chết lâm sàng trước khi bão Mặt Trời ập tới.',
        power: 'Hệ thống nguồn và pin sụt áp giữa quỹ đạo tầm trung (MEO), làm ngắt mạch từ kế trước giờ G.',
        inspection_fault:
          'Lỗi lắp ráp không được khắc phục tại phòng kiểm định khiến trạm gác mất liên lạc ngay sau khi tách khỏi tầng đẩy.',
        launch: 'Trạm gác thời tiết không gian không thể duy trì hoạt động tại quỹ đạo MEO-20200, để mặc Trái Đất không có lá chắn cảnh báo sớm.',
        default: 'Trạm gác thời tiết không gian không thể duy trì hoạt động tại quỹ đạo MEO-20200, để mặc Trái Đất không có lá chắn cảnh báo sớm.',
      },
      paragraphs: [
        'Khi khối vật chất nhật hoa (CME) khổng lồ lao về phía Trái Đất với vận tốc 2.100 km/s, nhân loại hoàn toàn không nhận được cảnh báo trước 18 giờ từ trạm gác MEO. Dòng điện cảm ứng địa từ (GIC) bất ngờ tràn vào hệ thống truyền tải điện cao thế trên khắp Bắc Bán Cầu.',
        'Hàng loạt máy biến áp trung tâm phát nổ trong đêm tuyết trắng. Cùng lúc đó, tầng điện ly bị nhiễu loạn dữ dội làm đứt gãy toàn bộ liên lạc vô tuyến HF và tín hiệu dẫn đường GPS của hàng trăm máy bay dân dụng đang bay qua vùng cực.',
      ],
      metrics: [
        {
          label: 'HỘ DÂN MẤT ĐIỆN GIỮA MÙA ĐÔNG',
          value: '6,4 triệu hộ',
          sub: '14 trạm biến áp siêu cao áp cháy hỏng, 210 bệnh viện chạy máy phát',
        },
        {
          label: 'CHUYẾN BAY MÙ LIÊN LẠC & GPS',
          value: '340 chuyến',
          sub: 'Mất sóng HF xuyên cực suốt 6 giờ, buộc hạ cánh khẩn cấp',
        },
        {
          label: 'THIỆT HẠI HẠ TẦNG & VỆ TINH LEO',
          value: '4,8 tỷ USD',
          sub: '18 vệ tinh viễn thông hỏng mạch vì không kịp vào Safe Mode',
        },
      ],
      moral:
        'THÔNG ĐIỆP MÀN 2: Giữa vành đai bức xạ Van Allen, linh kiện giá rẻ không chỉ làm hỏng một dự án — nó tháo bỏ chiếc chuông báo động duy nhất của cả nền văn minh công nghệ trước cơn thịnh nộ của Mặt Trời.',
    },
    ok: {
      badge: 'LÁ CHẮN ĐỊA TỪ HOẠT ĐỘNG HOÀN HẢO',
      headline: 'CẢNH BÁO TRƯỚC 18 GIỜ: 6,4 TRIỆU HỘ DÂN & 340 CHUYẾN BAY VƯỢT QUA BÃO TỪ G5',
      causeBridge:
        'Nhờ bộ xử lý chống bức xạ OBC-RADHARD và nguồn pin dung lượng lớn, từ kế trên quỹ đạo MEO-20200 đã hoạt động xuyên suốt cơn bão proton và gửi bản tin cảnh báo đỏ về Trái Đất đúng hạn.',
      paragraphs: [
        'Ngay khi đám mây plasma từ Mặt Trời quét qua quỹ đạo 20.200 km, trạm gác đã giải mã chính xác cường độ từ trường liên hành tinh và phát lệnh báo động toàn cầu trước 18 giờ. Các trung tâm điều độ điện lực kịp thời phân tải và đóng rơ-le bảo vệ toàn bộ 14 lưới điện quốc gia.',
        'Toàn bộ các hãng hàng không đã chuyển hướng 340 chuyến bay thương mại ra khỏi vùng cực trước khi bão từ chạm tầng điện ly, và 18 vệ tinh quỹ đạo thấp kịp gập cánh về chế độ an toàn.',
      ],
      metrics: [
        {
          label: 'LƯỚI ĐIỆN ĐƯỢC BẢO VỆ',
          value: '6,4 triệu hộ',
          sub: '0 trạm biến áp bị cháy, 210 bệnh viện duy trì điện lưới 100%',
        },
        {
          label: 'CHUYẾN BAY CHUYỂN HƯỚNG AN TOÀN',
          value: '340 chuyến',
          sub: 'Không một máy bay nào bị kẹt trong vùng mất sóng vùng cực',
        },
        {
          label: 'TÀI SẢN CÔNG NGHỆ ĐƯỢC CỨU',
          value: '4,8 tỷ USD',
          sub: '18 vệ tinh viễn thông vào Safe Mode kịp thời',
        },
      ],
      moral:
        'THÔNG ĐIỆP MÀN 2: Đầu tư cho linh kiện chống bức xạ chuẩn không gian (Flight Heritage) chính là mua bảo hiểm sinh mạng cho hàng triệu con người phụ thuộc vào điện lưới và bầu trời dưới mặt đất.',
    },
  },

  'MP-SC04-GHG': {
    missionKey: 'ghg',
    levelTag: 'STORY 03 // HỒ SƠ KHÍ HẬU & AN NINH LƯƠNG THỰC TOÀN CẦU',
    fail: {
      badge: 'THẢM HỌA KHÍ HẬU & MÙA MÀNG',
      headline: 'BÓNG MA KHÍ METHANE: VẾT RÒ RỈ VÔ HÌNH ĐẨY 850.000 NÔNG DÂN VÀO ĐẠI HẠN',
      causeByFailure: {
        pointing:
          'Quang phổ kế hồng ngoại đòi hỏi giữ hướng cực chuẩn nhưng bộ điều khiển tư thế (ADCS) thiếu độ chính xác làm vệt quét lệch hàng chục kilomet, biến toàn bộ dữ liệu phát thải thành nhiễu vô giá trị.',
        blur: 'Quang phổ kế hồng ngoại đòi hỏi giữ hướng cực chuẩn nhưng bộ điều khiển tư thế (ADCS) thiếu độ chính xác làm vệt quét lệch hàng chục kilomet, biến toàn bộ dữ liệu phát thải thành nhiễu vô giá trị.',
        power: 'Quang phổ kế công suất lớn rút cạn nguồn điện khi quét liên tục, làm vệ tinh sập nguồn ngay trên vùng công nghiệp trọng điểm.',
        data: 'Khối lượng dữ liệu phổ khổng lồ bị ứ đọng trên tàu vì thiếu đường truyền quang học/băng thông cao, không thể gửi bản đồ phát thải về hội nghị khí hậu.',
        inspection_fault:
          'Lỗi lắp ráp bị bỏ sót từ khâu kiểm định làm lệch chuẩn ống kính quang phổ, khiến mọi dữ liệu đo khí nhà kính bị sai lệch hoàn toàn.',
        launch: 'Sứ mệnh quan trắc khí nhà kính thất bại khiến hệ thống giám sát phát thải độc lập của nhân loại bị tê liệt.',
        default: 'Sứ mệnh quan trắc khí nhà kính thất bại khiến hệ thống giám sát phát thải độc lập của nhân loại bị tê liệt.',
      },
      paragraphs: [
        'Không có ảnh phổ định vị độ phân giải cao từ quỹ đạo đồng bộ Mặt Trời (SSO-600), các tổ hợp khai thác khí đốt và khu công nghiệp nặng tiếp tục xả trộm một lượng khổng lồ khí Methane (CH₄) không màu, không mùi vào bầu khí quyển mà không ai có bằng chứng pháp lý để buộc dừng lại.',
        'Hiệu ứng nhà kính tăng vọt cục bộ trong 84 lần mạnh hơn CO₂ đã kích hoạt chuỗi nắng nóng cực đoan và xâm nhập mặn kỷ lục vào mùa vụ kế tiếp, biến những cánh đồng trù phú thành đất nứt nẻ.',
      ],
      metrics: [
        {
          label: 'KHÍ METHANE RÒ RỈ VÔ HÌNH',
          value: '1,8 triệu tấn',
          sub: 'Gây hiệu ứng giữ nhiệt tương đương 150 triệu tấn CO₂ (32 triệu xe hơi/năm)',
        },
        {
          label: 'ĐỒNG BẰNG CANH TÁC HẠN MẶN',
          value: '2,3 triệu ha',
          sub: 'Đất nông nghiệp ven biển mất khả năng canh tác do nhiệt độ cực đoan',
        },
        {
          label: 'NÔNG DÂN MẤT TRẮNG MÙA VỤ',
          value: '850.000 người',
          sub: 'Khủng hoảng lương thực khu vực và đứt gãy chuỗi cung ứng',
        },
      ],
      moral:
        'THÔNG ĐIỆP MÀN 3: Khí nhà kính vô hình trước mắt thường — nếu con mắt quang phổ trên quỹ đạo lệch đi chỉ một phần mười độ, những kẻ đầu độc bầu khí quyển sẽ thoát tội và người nông dân phải trả giá bằng những cánh đồng chết khát.',
    },
    ok: {
      badge: 'ĐỘT PHÁ MINH BẠCH KHÍ HẬU TOÀN CẦU',
      headline: 'BẰNG CHỨNG THÉP TỪ QUỸ ĐẠO: KHÓA CHẶT 27 SIÊU NGUỒN RÒ RỈ KHÍ METHANE',
      causeBridge:
        'Nhờ bộ điều khiển tư thế siêu chính xác ADCS-FINE, nguồn điện dồi dào và đường truyền quang học tốc độ cao, vệ tinh đã khóa mục tiêu ổn định suốt 20 giây mỗi lượt quét và gửi về bản đồ phổ sắc nét tới từng đường ống.',
      paragraphs: [
        'Bản đồ phổ hồng ngoại từ độ cao 600 km đã chỉ đích danh 27 điểm siêu phát thải (Super-Emitters) đang âm thầm rò rỉ khí Methane trên khắp các lục địa. Với tọa độ sai số dưới 50 mét không thể chối cãi, Ủy ban Khí hậu Quốc tế đã buộc các tập đoàn năng lượng khóa van và hàn kín đường ống ngay trong tháng đầu tiên.',
        'Lượng phát thải tương đương 150 triệu tấn CO₂ đã bị chặn đứng kịp thời, bảo vệ nguồn nước ngọt và sinh kế cho hàng triệu cư dân vùng đồng bằng nông nghiệp.',
      ],
      metrics: [
        {
          label: 'KHÍ METHANE BỊ KHÓA CHẶT',
          value: '1,8 triệu tấn',
          sub: 'Ngăn chặn tương đương 150 triệu tấn CO₂ đi vào khí quyển',
        },
        {
          label: 'DIỆN TÍCH NÔNG NGHIỆP ĐƯỢC CỨU',
          value: '2,3 triệu ha',
          sub: 'Duy trì dữ liệu cảnh báo hạn mặn & cân bằng bức xạ nhiệt',
        },
        {
          label: 'NÔNG DÂN GIỮ VỮNG SINH KẾ',
          value: '850.000 người',
          sub: '27 siêu nguồn phát thải buộc phải khắc phục dưới sự giám sát vệ tinh',
        },
      ],
      moral:
        'THÔNG ĐIỆP MÀN 3: Độ chính xác phần nghìn độ của kỹ sư không gian trên quỹ đạo chính là thước đo công lý dưới mặt đất — buộc mọi nguồn phát thải phải bước ra ánh sáng để bảo vệ tương lai của nhân loại.',
    },
  },
};

function normalizeFailureKey(failureId, outcome) {
  const raw = String(failureId || outcome?.killer || outcome?.review_fail?.[0] || '').toLowerCase();
  if (!raw) return 'default';
  if (raw === 'structural_maxq' || raw === 'dv_shortfall' || raw === 'wrong_plane') return 'launch';
  return raw;
}

/**
 * Tra ve noi dung storytelling co dinh (khong random) gan voi man choi va ket qua ky thuat.
 */
export function getHumanityImpact(missionId, { success = false, failureId = '', outcome = null } = {}) {
  const entry = HUMANITY_STORIES[missionId] || HUMANITY_STORIES['MP-SC01-FIRST-EYES'];
  const branch = success ? entry.ok : entry.fail;
  const key = normalizeFailureKey(failureId, outcome);
  const causeBridge = success
    ? branch.causeBridge
    : branch.causeByFailure?.[key] || branch.causeByFailure?.default || branch.causeByFailure?.launch || '';

  return {
    missionId: missionId || 'MP-SC01-FIRST-EYES',
    missionKey: entry.missionKey,
    levelTag: entry.levelTag,
    success: Boolean(success),
    badge: branch.badge,
    headline: branch.headline,
    causeBridge,
    paragraphs: branch.paragraphs,
    metrics: branch.metrics,
    moral: branch.moral,
  };
}
