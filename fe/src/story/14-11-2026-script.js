/**
 * Kich ban hoi thoai co tuong tac: Ky su truong (BAN - nguoi choi) <-> Sep Ke Toan (Director Penny-Pincher).
 * Nguoi choi duoc chon cau phan bien/de xuat (choices), nhung Sep luon bac bo voi con dau [TU CHOI PHE DUYET]
 * de lam ro boi canh bi chen ep truoc khi bay va tao dong luc chat van Sep o man 06.REVIEW.
 */

export const CAST = {
  eng: { name: 'KỸ SƯ TRƯỞNG (BẠN)', side: 'left' },
  boss: { name: 'SẾP KẾ TOÁN', side: 'right' },
};

const INTRO = {
  'MP-SC01-FIRST-EYES': [
    {
      who: 'boss',
      text: 'Mùa cháy rừng sắp tới, bên cứu hộ cần ảnh từ trên trời làm bằng chứng. Ngân sách chỉ có {budget} triệu đô, hạn chót {deadline} tháng — cứ lắp đồ tồn kho giá rẻ mà phóng cho tôi!',
      choices: [
        {
          tag: 'ĐÒI ĂNG-TEN S-BAND',
          text: 'Sếp ơi, ăng-ten UHF tồn kho băng thông quá hẹp! Chụp được ảnh cháy rừng cũng sẽ bị nghẽn không gửi kịp về trạm mặt đất đâu.',
          stamp: 'TỪ CHỐI NÂNG CẤP ĂNG-TEN',
          bossReply: 'Sóng nào chẳng là sóng! Không có tiền mua S-Band đâu, tự xoay xở trong {budget} triệu đô đi!',
          engNote: '(Sếp gạt phắt đi. Vào xưởng mình sẽ xem có gánh nổi chi phí truyền thông hay không — hoặc phải lấy bằng chứng thực tế để đòi tiền sau.)',
        },
        {
          tag: 'CẢNH BÁO 142.000 HA RỪNG',
          text: 'Nếu vệ tinh mất liên lạc trong 72 giờ vàng đầu mùa khô, 142.000 ha rừng nguyên sinh và 38.500 dân vùng ven sẽ lâm nguy đấy Sếp!',
          stamp: 'BÁC BỎ CẢNH BÁO RỦI RO',
          bossReply: 'Đừng đem chuyện cháy rừng ra dọa tôi để vòi thêm tiền! Hội đồng chỉ duyệt đúng {budget} triệu đô, xong việc quý này tôi mới thưởng!',
          engNote: '(Nói lý không xong với kế toán rồi. Chỉ có báo cáo thất bại hoặc dữ liệu bay thật mới khóa miệng được ông ta.)',
        },
        {
          tag: 'XIN THÊM PIN & BÁNH ĐÀ',
          text: 'Thưa Sếp, cần thêm kinh phí lắp tấm pin mở rộng và bánh đà phản ứng ADCS; không thì thiếu điện vùng tối và ảnh bị nhòe hết.',
          stamp: 'KHÓA TRẦN NGÂN SÁCH {budget}M',
          bossReply: 'Bánh đà gì mà đắt thế! Cứ gắn nam châm từ rẻ tiền vào, miễn phóng đúng hạn {deadline} tháng cho báo chí chụp ảnh!',
          engNote: '(Mọi đề xuất nâng cấp đều bị đóng dấu từ chối. Mình phải tự chịu trách nhiệm kỹ thuật trong xưởng thôi.)',
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    {
      who: 'boss',
      text: 'Trạm gác thời tiết không gian tại quỹ đạo xa MEO-20200. Quỹ đạo xa, đắt, tôi biết — nhưng {budget} triệu đô và hạn {deadline} tháng là hết mức, không lùi!',
      choices: [
        {
          tag: 'YÊU CẦU CHIP CHỐNG BỨC XẠ',
          text: 'Quỹ đạo MEO-20200 nằm ngay giữa vành đai bức xạ Van Allen! Dùng chip thường không phải chuẩn Rad-Hard sẽ bị hạt proton bắn treo cứng đấy Sếp!',
          stamp: 'TỪ CHỐI MUA OBC-RADHARD',
          bossReply: 'Trên vũ trụ toàn chân không làm gì có vành đai nào! Cứ lắp cái máy tính rẻ nhất, hỏng thì phóng cái khác, cấm vượt {budget} triệu!',
          engNote: '(Ông ta coi thường cả vành đai Van Allen. Vào xưởng chắc chắn mình sẽ bị kẹt ngân sách vì con chip OBC-RADHARD.)',
        },
        {
          tag: 'CẢNH BÁO SẬP LƯỚI ĐIỆN G5',
          text: 'Sếp phải hiểu: nếu trạm gác câm lặng khi bão từ G5 ập tới, 6,4 triệu hộ dân sẽ mất điện mùa đông và 340 chuyến bay vùng cực mù sóng GPS!',
          stamp: 'BÁC BỎ DỰ BÁO BÃO TỪ',
          bossReply: 'Bão Mặt Trời trăm năm mới có một lần, đừng vẽ chuyện rung cây nhát khỉ! Đúng {deadline} tháng phải phóng, chấm hết!',
          engNote: '(Bác bỏ thẳng thừng. Một khi lên quỹ đạo, hạt năng lượng cao sẽ không nghe lệnh của Sếp đâu.)',
        },
        {
          tag: 'XIN NỚI HẠN CHÓT {deadline} THÁNG',
          text: 'Linh kiện chịu bức xạ cần thời gian đặt hàng lâu hơn {deadline} tháng; ép tiến độ gấp sẽ cắt mất thời gian soi lỗi trước giờ phóng!',
          stamp: 'GIỮ NGUYÊN DEADLINE {deadline} THÁNG',
          bossReply: 'Tôi chốt lịch truyền hình trực tiếp rồi! Anh mà làm trễ một tháng nào thì tự chịu cắt thời gian kiểm định trước phóng ráng chịu!',
          engNote: '(Hạn chót bị khóa cứng. Nếu lắp đồ đặt lâu sẽ bị phạt trừ giờ ở phòng Soi Lỗi 03.INSPECT.)',
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    {
      who: 'boss',
      text: 'Giám sát khí nhà kính, dự án được báo chí quốc tế để ý. Có {budget} triệu đô và đúng {deadline} tháng, đừng để tôi mất mặt!',
      choices: [
        {
          tag: 'ĐỀ XUẤT ADCS SIÊU CHÍNH XÁC',
          text: 'Đo quang phổ khí Methane từ độ cao 600 km đòi hỏi giữ hướng cực chuẩn bằng ADCS-FINE và đường truyền quang học, nếu lệch sẽ hỏng sạch dữ liệu!',
          stamp: 'TỪ CHỐI PHỤ KIỆN CAO CẤP',
          bossReply: 'Tôi không hiểu mấy chuyện phần nghìn độ với chả phút! Miễn có ảnh gửi lên hội nghị trong {budget} triệu đô và {deadline} tháng!',
          engNote: '(Sếp vẫn không hiểu vật lý không gian. Mình phải cân đối giữa độ chính xác chỉ hướng, công suất và hạn chót trong xưởng.)',
        },
        {
          tag: 'CẢNH BÁO 850.000 NÔNG DÂN',
          text: 'Nếu ảnh phổ bị nhòe, 1,8 triệu tấn khí Methane xả trộm sẽ lọt lưới, gây hạn mặn khiến 850.000 nông dân mất trắng mùa vụ đấy Sếp!',
          stamp: 'GẠT BỎ LẬP LUẬN KHÍ HẬU',
          bossReply: 'Chuyện mùa màng là việc của Bộ Nông nghiệp, việc của tôi là giữ bảng cân đối kế toán quý này đừng bị âm!',
          engNote: '(Không thể thuyết phục bằng nhân đạo lúc này — chỉ có cấu hình chuẩn xác ở Xưởng 02.BUILD mới cứu được sứ mệnh.)',
        },
        {
          tag: 'XIN NÂNG CẤP NGUỒN ĐIỆN',
          text: 'Quang phổ kế hồng ngoại ngốn công suất rất lớn; dùng tấm pin nhỏ sẽ gây sập nguồn ngay khi bay qua vùng tối Trái Đất!',
          stamp: 'BÁC BỎ YÊU CẦU TĂNG NGUỒN',
          bossReply: 'Bay trên trời nắng suốt ngày mà còn sợ thiếu điện à?! Đừng kiếm cớ tiêu lố {budget} triệu đô của tôi!',
          engNote: '(Sếp tưởng trên quỹ đạo không bao giờ đi vào vùng bóng Trái Đất... Tự mình tính toán cân bằng nguồn thôi.)',
        },
      ],
    },
  ],
};

const LAUNCH_FAIL_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    { who: 'boss', text: 'Cái gì vừa nổ ngoài kia vậy?! {cost} triệu đô tiền cứu hỏa rừng bốc cháy ngay trên trời!' },
    { who: 'eng', text: 'Báo cáo: {failure}. Không đưa được vệ tinh lên quỹ đạo nghĩa là 142.000 ha rừng mùa khô năm nay không có mắt thần cảnh báo.' },
    {
      who: 'boss',
      text: 'Hồ sơ thì giữ lấy. Uy tín của anh với tôi còn {rep} vạch — lo sửa ngay đi!',
      choices: [
        {
          tag: 'ĐÒI BỔ SUNG NGÂN SÁCH TÊN LỬA',
          text: 'Tải trọng cần tên lửa và khung đỡ lớn hơn! Sếp ép {budget} triệu thì sao đủ nâng cấu hình an toàn lên quỹ đạo được?',
          stamp: 'TỪ CHỐI CẤP TIỀN ĐỢT NÀY',
          bossReply: 'Chưa bay tới quỹ đạo lấy bằng chứng về thì đừng hòng xin thêm một xu! Về xưởng chỉnh lại khối lượng hoặc soi sạch lỗi trước phóng đi!',
          engNote: '(Sếp khước từ mọi yêu cầu trước khi tên lửa vào quỹ đạo. Mình phải sửa lỗi tải/lắp ráp trước đã.)',
        },
        {
          tag: 'NHẬN TRÁCH NHIỆM KỸ THUẬT',
          text: 'Tôi sẽ rà soát lại giới hạn khối lượng khung bus, khớp nối tầng đẩy và lỗi kiểm định 03.INSPECT để phóng lại ngay.',
          stamp: 'GHI SỔ KỶ LUẬT (-1 UY TÍN)',
          bossReply: 'Nhanh lên đấy! Anh chỉ còn {rep} vạch uy tín thôi, cháy thêm quả nữa là tôi giao dự án cho người khác!',
          engNote: '(Quay lại Xưởng 02.BUILD kiểm tra đồ thị quỹ đạo và đường bao khối lượng ngay.)',
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'boss', text: '{cost} triệu đô rơi thẳng xuống biển! Tôi vừa hứa với truyền thông về trạm gác bão Mặt Trời xong!' },
    { who: 'eng', text: 'Báo cáo: {failure}. Nếu không có vệ tinh này ở MEO, 6,4 triệu hộ dân và 340 chuyến bay vùng cực sẽ hoàn toàn mù thông tin trước bão từ G5.' },
    {
      who: 'boss',
      text: 'Tôi không muốn nghe con số dân sinh nữa. Uy tín của anh còn {rep} vạch!',
      choices: [
        {
          tag: 'XIN ĐỔI TÊN LỬA HẠNG NẶNG',
          text: 'Quỹ đạo MEO-20200 cần delta-v rất lớn; với gói tiền hiện tại tên lửa bị thiếu lực đẩy hoặc quá tải khung!',
          stamp: 'BÁC BỎ ĐƠN CẤP THÊM TIỀN',
          bossReply: 'Chừng nào vệ tinh chưa lên tới quỹ đạo và chết vì bức xạ có hồ sơ rõ ràng, ngân sách vẫn khóa chặt ở {budget} triệu!',
          engNote: '(Phải đưa vệ tinh lên được MEO trước mới có bằng chứng bức xạ đập bàn với Sếp.)',
        },
        {
          tag: 'RÀ SOÁT LẠI KHỐI LƯỢNG & LỖI SOI',
          text: 'Tôi sẽ kiểm tra lại tỷ lệ khối lượng đẩy, bãi phóng phù hợp độ nghiêng và soi kỹ 3/3 lỗi ở pha kiểm định.',
          stamp: 'KHẤU TRỪ UY TÍN: CÒN {rep} VẠCH',
          bossReply: 'Liệu hồn mà làm cho chuẩn, hội đồng không kiên nhẫn mãi đâu!',
          engNote: '(Quay lại xưởng tối ưu lại tên lửa và quy trình soi X-Ray.)',
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    { who: 'boss', text: 'Lại mất {cost} triệu đô trên bệ phóng! Hội nghị khí hậu quốc tế đang dí sát sau lưng tôi kia kìa!' },
    { who: 'eng', text: 'Báo cáo: {failure}. Vệ tinh đo khí Methane chưa lên được SSO-600 — 850.000 nông dân vùng hạn mặn vẫn chưa có bằng chứng truy vết nguồn xả.' },
    {
      who: 'boss',
      text: 'Sửa ngay chiếc khác đi. Uy tín của anh chỉ còn {rep} vạch thôi đấy!',
      choices: [
        {
          tag: 'YÊU CẦU TĂNG NGÂN SÁCH TÊN LỬA',
          text: 'Thiết bị đo khí nhà kính rất nặng, Sếp phải nới ngân sách để dùng khung BUS-SMALL500 và tên lửa đồng bộ SSO-600!',
          stamp: 'TỪ CHỐI MỞ NGÂN SÁCH KHẨN',
          bossReply: 'Tên lửa nổ ngay dưới tầng thấp thì lấy đâu ra chứng cứ thuyết phục hội đồng?! Tự cân đối lại khối lượng và kiểm tra trước phóng đi!',
          engNote: '(Sếp vẫn giữ chặt két tiền. Cần qua khỏi giai đoạn phóng trước.)',
        },
        {
          tag: 'CAM KẾT PHÓNG LẠI AN TOÀN',
          text: 'Rõ. Tôi sẽ cân bằng lại trọng lượng tàu và rà soát toàn bộ van nhiên liệu trước khi rời bệ.',
          stamp: 'CẢNH CÁO CUỐI // CÒN {rep} VẠCH',
          bossReply: 'Đừng để tôi thấy khói đen trên màn hình thêm lần nữa!',
          engNote: '(Về Xưởng 02.BUILD chỉnh lại cấu hình phóng ngay.)',
        },
      ],
    },
  ],
};

const REVIEW_OK_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    { who: 'eng', text: 'Đã có {evidence} ảnh tọa độ cháy rừng rõ nét truyền thẳng về mặt đất. Lực lượng cứu hỏa đã khoanh vùng cứu sống 142.000 ha rừng và bảo vệ 38.500 cư dân!' },
    { who: 'boss', text: 'Tuyệt vời! Báo chí đang ca ngợi hết lời! Tôi biết mà, cứ giao cho đội của tôi là xong!' },
    { who: 'eng', text: '(Không phải nhờ may mắn — mà nhờ đủ đường truyền, đủ pin và giữ hướng chuẩn xác.)' },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'eng', text: 'Trạm gác MEO đã đứng vững qua bão bức xạ và phát cảnh báo đỏ trước 18 giờ: 6,4 triệu hộ dân giữ nguyên lưới điện, 340 chuyến bay vùng cực đổi hướng an toàn!' },
    { who: 'boss', text: 'Cái đầu tôi giữ được trên ghế rồi! Xem ra đống linh kiện đắt tiền đó cũng... đáng đồng tiền đấy chứ.' },
    { who: 'eng', text: '(Trên vành đai Van Allen, chỉ chuẩn chống bức xạ thật sự mới cứu được nền văn minh dưới mặt đất.)' },
  ],
  'MP-SC04-GHG': [
    { who: 'eng', text: 'Quang phổ kế đã khóa chặt 27 siêu nguồn rò rỉ khí Methane! 1,8 triệu tấn CH4 bị chặn đứng, bảo vệ 2,3 triệu ha đất nông nghiệp cho 850.000 nông dân!' },
    { who: 'boss', text: 'Cả Ủy ban Khí hậu vừa gọi chúc mừng tôi rồi! Dự án này đưa tôi lên trang nhất!' },
    { who: 'eng', text: '(Độ chính xác phần nghìn độ trên quỹ đạo đã mang lại công lý cho những cánh đồng dưới Trái Đất.)' },
  ],
};

const REVIEW_FAIL_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    { who: 'boss', text: 'Vệ tinh bay lên được rồi mà mặt đất không nhận nổi ảnh cháy rừng? Anh giải thích thế nào?!' },
    { who: 'eng', text: 'Nguyên nhân gốc: {failure}. Hậu quả là mất liên lạc suốt 72 giờ vàng — 142.000 ha rừng nguyên sinh hóa tro tàn và 38.500 người dân phải di tản trong khói độc.' },
    {
      who: 'boss',
      text: 'Tôi... tôi cắt ngân sách thật nhưng lỗi ở anh chứ? Uy tín của anh còn {rep} vạch. Mở hồ sơ ra tôi xem!',
      choices: [
        {
          tag: 'PHẢN BÁC: DO SẾP CẮT TIỀN',
          text: 'Ngay từ đầu tôi đã cảnh báo ngân sách {budget}M và linh kiện tồn kho sẽ làm nghẽn dữ liệu / sập nguồn rồi mà Sếp bác bỏ!',
          stamp: 'BÁC BỎ BẰNG MIỆNG // ĐÒI BẰNG CHỨNG',
          bossReply: 'Nói suông không có giá trị! Vào bàn Chất Vấn Sếp (06.REVIEW) đưa đúng thẻ chứng cứ khớp báo cáo lỗi ra đây thì tôi mới duyệt thêm tiền!',
          engNote: '(Được rồi! Mình đã có hồ sơ nguyên nhân trên tay — hãy chọn đúng thẻ chứng cứ ở màn Chất Vấn Sếp để buộc ông ta mở két!)',
        },
        {
          tag: 'ĐÒI MỞ KHÓA NGÂN SÁCH ĐỂ SỬA',
          text: 'Để cứu mùa cháy rừng tới, Sếp buộc phải cấp thêm ngân sách nâng cấp ăng-ten S-Band và nguồn điện ngay lập tức!',
          stamp: 'TỪ CHỐI MỞ KÉT TỰ ĐỘNG',
          bossReply: 'Muốn mở khóa két tiền hả? Chứng minh lỗi đó thuộc trách nhiệm quản lý của tôi ở màn 06.REVIEW trước đi đã!',
          engNote: '(Sếp vẫn cố cãi chày cối. Hãy dùng hồ sơ kỹ thuật tấn công trực diện trong màn BOSS CONFRONTATION!)',
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'boss', text: 'Đưa trạm lên tận MEO rồi mà sao bão Mặt Trời đánh sập nửa lưới điện Bắc Bán Cầu vẫn không thấy báo động?!' },
    { who: 'eng', text: 'Nguyên nhân gốc: {failure}. Hạt năng lượng cao đánh thủng chip giá rẻ mà sếp ép dùng: 6,4 triệu hộ mất điện giữa mùa đông và 340 chuyến bay vùng cực mù sóng GPS.' },
    {
      who: 'boss',
      text: 'Đừng đổ hết lên đầu tôi! Uy tín còn {rep} vạch — đưa bằng chứng kỹ thuật lên bàn ngay!',
      choices: [
        {
          tag: 'NHẮC LẠI CẢNH BÁO VAN ALLEN',
          text: 'Tôi đã nói trước là dùng chip không chống bức xạ ở quỹ đạo MEO-20200 sẽ chết vì Latch-up nhưng Sếp nhất quyết mua đồ rẻ!',
          stamp: 'TỪ CHỐI NHẬN LỖI QUA ĐIỆN ĐÀM',
          bossReply: 'Hội đồng cần giấy trắng mực đen! Trình thẻ chứng cứ lỗi bức xạ và hóa đơn cắt xén ở màn 06.REVIEW rồi tôi mới nhả thêm ngân sách!',
          engNote: '(Ông ta sắp hết đường chối rồi. Sang màn Chất Vấn Sếp 06.REVIEW chốt hạ bằng hồ sơ nguyên nhân!)',
        },
        {
          tag: 'YÊU CẦU CẤP CHIP RAD-HARD',
          text: 'Sếp phải mở khóa ngay khoản chi cho OBC-RADHARD và nới hạn chót để không lặp lại thảm họa mất điện này!',
          stamp: 'BÁC BỎ ĐƠN XIN MIỄN TRỪ',
          bossReply: 'Không có chuyện xin miệng! Đưa chứng cứ hợp lệ lên bàn chất vấn bên dưới đi!',
          engNote: '(Chuẩn bị đối chất trực tiếp tại BOSS CONFRONTATION.)',
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    { who: 'boss', text: 'Hội đồng Khí hậu vừa bác bỏ toàn bộ tập dữ liệu của ta! Hàng chục triệu đô đổ xuống biển hết rồi!' },
    { who: 'eng', text: 'Nguyên nhân gốc: {failure}. Chúng ta bỏ lọt 1,8 triệu tấn khí Methane vô hình, đẩy 2,3 triệu ha đồng bằng vào hạn mặn và 850.000 nông dân mất trắng mùa vụ.' },
    {
      who: 'boss',
      text: 'Đừng dọa tôi bằng mấy con số nông nghiệp đó! Uy tín còn {rep} vạch — trình báo cáo chất vấn đi!',
      choices: [
        {
          tag: 'CHỈ TRÍCH LỆNH ÉP DEADLINE & TIỀN',
          text: 'Chính trần ngân sách {budget}M và hạn chót {deadline} tháng của Sếp đã trói tay không cho lắp ADCS-FINE và nguồn đủ chuẩn!',
          stamp: 'BÁC BỎ LỜI CÁO BUỘC',
          bossReply: 'Mồm mép không giải quyết được biên bản kiểm toán! Vào 06.REVIEW chọn đúng chứng cứ chứng minh đi rồi nói chuyện mở khóa ngân sách!',
          engNote: '(Giờ là lúc lôi hồ sơ lỗi và sổ đen của Sếp ra đối chất trực tiếp ở 06.REVIEW.)',
        },
        {
          tag: 'XIN CƠ HỘI PHÓNG LẠI CẤU HÌNH CHUẨN',
          text: 'Hãy nới trần chi phí và tiến độ để tôi thay quang phổ kế và hệ điều khiển tư thế chính xác hơn!',
          stamp: 'TỪ CHỐI MỞ KHÓA NGAY',
          bossReply: 'Chỉ khi nào anh chứng minh được nút thắt nằm ở quyết định cắt giảm của tôi trong phần Chất Vấn thì tôi mới ký duyệt bổ sung!',
          engNote: '(Tiến vào màn 06.REVIEW để chất vấn trực diện.)',
        },
      ],
    },
  ],
};

export const SCENES = {
  intro: (ctx) => INTRO[ctx.mission] || [
    {
      who: 'boss',
      text: 'Dự án mới, ngân sách {budget} triệu, hạn {deadline} tháng. Làm đi.',
      choices: [
        {
          tag: 'XIN TĂNG NGÂN SÁCH',
          text: 'Với {budget} triệu và hạn {deadline} tháng thì biên dự phòng kỹ thuật rất mỏng, Sếp cân nhắc nới thêm giúp đội.',
          stamp: 'TỪ CHỐI PHÊ DUYỆT',
          bossReply: 'Không thêm bớt gì hết! Đúng {budget} triệu và {deadline} tháng, tự thiết kế mà chịu trách nhiệm!',
          engNote: '(Rõ. Tôi sẽ tự chịu trách nhiệm thiết kế trong xưởng.)',
        },
        {
          tag: 'CHẤP NHẬN NHIỆM VỤ',
          text: 'Rõ. Tôi sẽ kiểm chứng mọi giới hạn vật lý trực tiếp trên mô hình bay.',
          stamp: 'XÁC NHẬN ÁP TRẦN {budget}M',
          bossReply: 'Tốt, đừng để tôi phải chờ lâu!',
          engNote: '(Bắt đầu lắp ráp tại Xưởng 02.BUILD.)',
        },
      ],
    },
  ],
  prelaunch: () => [
    {
      who: 'boss',
      text: 'Đã lắp xong rồi chứ? Báo chí đang chờ ngoài cổng. Phóng ngay cho tôi!',
      choices: [
        {
          tag: 'CẢNH BÁO RỦI RO LẦN CUỐI',
          text: 'Thưa Sếp, các chỉ số nguy cơ vẫn đang nằm trên vai kỹ thuật; nếu phóng cấu hình chưa tối ưu, vệ tinh có thể hỏng giữa đường.',
          stamp: 'BÁC BỎ CẢNH BÁO // CẤM HOÃN',
          bossReply: 'Báo chí đang quay phim trực tiếp rồi! Không hoãn hiếc gì hết — kích hoạt đếm ngược phóng ngay!',
          engNote: '(Từ giây phút này, không ai sửa được gì nữa. Vật lý sẽ định đoạt số phận chuyến bay.)',
        },
        {
          tag: 'XÁC NHẬN RỜI BỆ PHÓNG',
          text: 'Hệ thống kiểm định đã khóa hồ sơ. Bàn giao trình tự đánh lửa ra bệ phóng ngay bây giờ.',
          stamp: 'LỆNH PHÓNG ĐƯỢC DUYỆT',
          bossReply: 'Phóng đi! Tôi muốn thấy tên lửa vút lên trời ngay lập tức!',
          engNote: '(Bắt đầu mô phỏng phóng 3D.)',
        },
      ],
    },
  ],
  launch_fail: (ctx) => LAUNCH_FAIL_BY_MISSION[ctx.mission] || [
    { who: 'boss', text: 'Cái gì vừa nổ ngoài kia vậy?! {cost} triệu đô của tôi bốc cháy trên trời!' },
    { who: 'eng', text: 'Báo cáo: {failure}. Tôi đã có hồ sơ nguyên nhân.' },
    { who: 'boss', text: 'Hồ sơ thì giữ lấy. Uy tín của anh với tôi còn {rep} vạch.' },
  ],
  abort_scrub: (ctx) => [
    { who: 'boss', text: 'Hoãn?! Anh có biết chuẩn bị một lần phóng tốn bao nhiêu không?' },
    { who: 'eng', text: 'Tôi chịu trách nhiệm. Thà hoãn còn hơn mất tên lửa.' },
    { who: 'boss', text: 'Lần này tôi ghi sổ. Uy tín còn {rep} vạch.' },
  ],
  abort_fts: (ctx) => [
    { who: 'boss', text: 'Anh tự tay cho nổ tên lửa của tôi?!' },
    { who: 'eng', text: 'Hệ thống tự hủy an toàn đã kích hoạt theo lệnh tôi. Không ai dưới mặt đất bị thương.' },
    { who: 'boss', text: 'Tên lửa thì mất rồi. Uy tín của anh còn {rep} vạch.' },
  ],
  review_ok: (ctx) => REVIEW_OK_BY_MISSION[ctx.mission] || [
    { who: 'eng', text: 'Đã có {evidence} ảnh rõ nét về tới trạm mặt đất. Sứ mệnh hoàn thành trọn vẹn.' },
    { who: 'boss', text: 'Tốt! Báo chí sẽ thích cái này. Tôi biết mà, cứ tiết kiệm là được.' },
    { who: 'eng', text: '(Không phải nhờ tiết kiệm. Nhưng thôi, để sổ tay ghi lại.)' },
  ],
  review_fail: (ctx) => REVIEW_FAIL_BY_MISSION[ctx.mission] || [
    { who: 'boss', text: 'Vệ tinh lên được rồi mà vẫn không có kết quả? Anh giải thích đi.' },
    { who: 'eng', text: 'Nguyên nhân gốc: {failure}.' },
    { who: 'boss', text: 'Tôi không quan tâm nguyên nhân. Uy tín của anh còn {rep} vạch.' },
  ],
  fired: () => [
    { who: 'boss', text: 'Đủ rồi. Dự án bị hủy. Hội đồng sẽ giao nhiệm vụ này cho người khác.' },
    { who: 'eng', text: '(Sổ tay vẫn còn đây. Lần sau mình sẽ làm khác.)' },
  ],
};

/** Thay {bien} trong cau thoai. */
export function fill(text, ctx) {
  return String(text || '').replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? String(ctx[k]) : `{${k}}`));
}
