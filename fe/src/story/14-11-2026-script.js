/**
 * Kịch bản hội thoại tương tác: Kỹ sư trưởng vs Giám đốc tài chính.
 * Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh ('vi' | 'en') hoàn chỉnh.
 * Toàn bộ ghi chú thiết kế và chú giải trong ngoặc đơn đã được loại bỏ khỏi văn bản hiển thị.
 */

export const CAST = {
  eng: {
    name: { vi: 'KỸ SƯ TRƯỞNG', en: 'CHIEF ENGINEER' },
    side: 'left',
  },
  boss: {
    name: { vi: 'SẾP KẾ TOÁN', en: 'BUDGET DIRECTOR' },
    side: 'right',
  },
};

const INTRO = {
  'MP-SC01-FIRST-EYES': [
    {
      who: 'boss',
      text: {
        vi: 'Mùa cháy rừng sắp tới, bên cứu hộ cần ảnh từ trên trời làm bằng chứng. Ngân sách chỉ có {budget} triệu đô, hạn chót {deadline} tháng — cứ lắp đồ tồn kho giá rẻ mà phóng cho tôi!',
        en: 'Fire season is approaching, emergency command needs orbital imagery for verification. The budget is capped at ${budget}M, deadline {deadline} months — assemble low-cost inventory parts and get it launched!',
      },
      choices: [
        {
          tag: { vi: 'ĐÒI ĂNG-TEN BĂNG THÔNG CAO', en: 'DEMAND HIGH-BANDWIDTH ANTENNA' },
          text: {
            vi: 'Thưa Sếp, ăng-ten UHF tồn kho băng thông quá hẹp. Chụp được ảnh cháy rừng cũng sẽ bị nghẽn không gửi kịp về trạm mặt đất.',
            en: 'Director, stock UHF antennas have narrow bandwidth. Even if we image wildfires, downlink will choke and nothing will reach the ground station in time.',
          },
          stamp: { vi: 'TỪ CHỐI NÂNG CẤP ĂNG-TEN', en: 'ANTENNA UPGRADE REJECTED' },
          bossReply: {
            vi: 'Sóng nào chẳng là sóng! Không có tiền mua ăng-ten xịn đâu, tự xoay xở trong {budget} triệu đô đi!',
            en: 'Signal is signal! No extra money for expensive dishes, make it work within ${budget}M!',
          },
          engNote: {
            vi: 'Sếp gạt phắt đi. Vào xưởng mình sẽ xem có gánh nổi chi phí truyền thông hay không — hoặc phải lấy bằng chứng thực tế để đòi tiền sau.',
            en: 'The Director brushed it off. In the hangar, I must see if we can balance communications costs or gather flight proof to confront him later.',
          },
        },
        {
          tag: { vi: 'CẢNH BÁO 142.000 HA RỪNG', en: 'WARN OF 142,000 HA FOREST THREAT' },
          text: {
            vi: 'Nếu vệ tinh mất liên lạc trong 72 giờ vàng đầu mùa khô, 142.000 ha rừng nguyên sinh và 38.500 dân vùng ven sẽ lâm nguy đấy Sếp!',
            en: 'If the satellite loses downlink during the first 72 hours of drought, 142,000 hectares of virgin forest and 38,500 residents will be in grave danger!',
          },
          stamp: { vi: 'BÁC BỎ CẢNH BÁO RỦI RO', en: 'RISK WARNING DISMISSED' },
          bossReply: {
            vi: 'Đừng đem chuyện cháy rừng ra dọa tôi để vòi thêm tiền! Hội đồng chỉ duyệt đúng {budget} triệu đô, xong việc quý này tôi mới thưởng!',
            en: 'Stop using wildfires to shake down more funding! The board approved exactly ${budget}M, deliver this quarter and we will talk bonuses!',
          },
          engNote: {
            vi: 'Nói lý không xong với kế toán rồi. Chỉ có báo cáo thất bại hoặc dữ liệu bay thật mới khóa miệng được ông ta.',
            en: 'Reasoning with accounting failed. Only flight data or root cause dossiers will silence him.',
          },
        },
        {
          tag: { vi: 'XIN THÊM PIN & BÁNH ĐÀ', en: 'REQUEST EXTRA BATTERIES & WHEELS' },
          text: {
            vi: 'Thưa Sếp, cần thêm kinh phí lắp tấm pin mở rộng và bánh đà phản ứng; không thì thiếu điện vùng tối và ảnh bị nhòe hết.',
            en: 'Director, we need funds for expanded solar arrays and reaction wheels, otherwise eclipse blackouts and attitude blur will ruin images.',
          },
          stamp: { vi: 'KHÓA TRẦN NGÂN SÁCH {budget}M', en: 'BUDGET CAP LOCKED AT ${budget}M' } ,
          bossReply: {
            vi: 'Bánh đà gì mà đắt thế! Cứ gắn nam châm từ rẻ tiền vào, miễn phóng đúng hạn {deadline} tháng cho báo chí chụp ảnh!',
            en: 'Why are reaction wheels so costly! Stick to cheap magnetic torquers and launch on time in {deadline} months for press coverage!',
          },
          engNote: {
            vi: 'Mọi đề xuất nâng cấp đều bị đóng dấu từ chối. Mình phải tự chịu trách nhiệm kỹ thuật trong xưởng thôi.',
            en: 'Every upgrade request stamped denied. I will have to bear technical responsibility alone in the workshop.',
          },
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    {
      who: 'boss',
      text: {
        vi: 'Trạm gác thời tiết không gian tại quỹ đạo xa. Quỹ đạo xa, đắt đỏ, tôi biết — nhưng {budget} triệu đô và hạn {deadline} tháng là hết mức, không lùi!',
        en: 'Space weather monitoring station in medium orbit. Distant and costly, I know — but ${budget}M and {deadline} months is final, no extension!',
      },
      choices: [
        {
          tag: { vi: 'YÊU CẦU CHIP CHỐNG BỨC XẠ', en: 'REQUIRE RAD-HARD AVIONICS' },
          text: {
            vi: 'Quỹ đạo này nằm ngay giữa vành đai bức xạ! Dùng chip thường không có chuẩn chống bức xạ sẽ bị hạt proton bắn treo cứng đấy Sếp!',
            en: 'This orbit sits squarely inside the radiation belt! Commercial off-the-shelf chips without radiation hardening will lock up from energetic protons!',
          },
          stamp: { vi: 'TỪ CHỐI MUA CHIP RAD-HARD', en: 'RAD-HARD AVIONICS REJECTED' },
          bossReply: {
            vi: 'Trên vũ trụ toàn chân không làm gì có vành đai nào! Cứ lắp máy tính rẻ nhất, hỏng thì phóng cái khác, cấm vượt {budget} triệu!',
            en: 'Space is a vacuum, what belt! Install the cheapest computer, if it dies we launch another, do not exceed ${budget}M!',
          },
          engNote: {
            vi: 'Ông ta coi thường cả vành đai bức xạ. Vào xưởng chắc chắn mình sẽ bị kẹt ngân sách vì con chip chống bức xạ.',
            en: 'He dismisses the radiation belt entirely. In the workshop, the budget will certainly pinch on rad-hard avionics.',
          },
        },
        {
          tag: { vi: 'CẢNH BÁO SẬP LƯỚI ĐIỆN G5', en: 'WARN OF G5 POWER GRID COLLAPSE' },
          text: {
            vi: 'Sếp phải hiểu: nếu trạm gác câm lặng khi bão từ G5 ập tới, 6,4 triệu hộ dân sẽ mất điện mùa đông và 340 chuyến bay vùng cực mù sóng định vị!',
            en: 'Director, if the sentinel stays silent when a G5 superstorm hits, 6.4 million households lose power in winter and 340 polar flights lose navigation!',
          },
          stamp: { vi: 'BÁC BỎ DỰ BÁO BÃO TỪ', en: 'SOLAR STORM FORECAST DISMISSED' },
          bossReply: {
            vi: 'Bão Mặt Trời trăm năm mới có một lần, đừng vẽ chuyện dọa tôi! Đúng {deadline} tháng phải phóng, chấm hết!',
            en: 'Solar storms happen once a century, stop exaggerating threats! Launch in {deadline} months, period!',
          },
          engNote: {
            vi: 'Bác bỏ thẳng thừng. Một khi lên quỹ đạo, hạt năng lượng cao sẽ không nghe lệnh của sếp đâu.',
            en: 'Flat rejection. Once on orbit, energetic particles will not take orders from the director.',
          },
        },
        {
          tag: { vi: 'XIN NỚI HẠN CHÓT {deadline} THÁNG', en: 'REQUEST DEADLINE EXTENSION' },
          text: {
            vi: 'Linh kiện chịu bức xạ cần thời gian đặt hàng lâu hơn; ép tiến độ gấp sẽ cắt mất thời gian kiểm định trước giờ phóng!',
            en: 'Radiation-hardened components carry longer lead times; rushing the schedule eats into pre-flight inspection time!',
          },
          stamp: { vi: 'GIỮ NGUYÊN HẠN CHÓT {deadline} THÁNG', en: 'DEADLINE LOCKED AT {deadline} MO' },
          bossReply: {
            vi: 'Tôi chốt lịch truyền hình rồi! Anh mà làm trễ một tháng nào thì tự chịu cắt thời gian kiểm định trước phóng ráng chịu!',
            en: 'Broadcast schedules are fixed! Any monthly delay comes directly out of your inspection window!',
          },
          engNote: {
            vi: 'Hạn chót bị khóa cứng. Nếu chọn linh kiện đặt hàng lâu sẽ bị trừ bớt thời gian kiểm định tiền phóng.',
            en: 'Deadlines are locked tight. Long-lead parts will penalize our pre-flight diagnostic window.',
          },
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    {
      who: 'boss',
      text: {
        vi: 'Giám sát khí nhà kính, dự án được báo chí quốc tế để ý. Có {budget} triệu đô và đúng {deadline} tháng, đừng để tôi mất mặt!',
        en: 'Greenhouse gas surveillance, international press is watching. You have ${budget}M and {deadline} months, do not embarrass me!',
      },
      choices: [
        {
          tag: { vi: 'ĐỀ XUẤT ĐIỀU KHIỂN HƯỚNG CHÍNH XÁC', en: 'PROPOSE PRECISION ATTITUDE CONTROL' },
          text: {
            vi: 'Đo quang phổ khí Methane từ độ cao 600 km đòi hỏi giữ hướng cực chuẩn và đường truyền tốc độ cao, nếu lệch sẽ hỏng sạch dữ liệu!',
            en: 'Methane spectroscopy from 600 km altitude requires micro-precision pointing and high-speed downlink; pointing drift corrupts all data!',
          },
          stamp: { vi: 'TỪ CHỐI PHỤ KIỆN CAO CẤP', en: 'HIGH-TIER HARDWARE DENIED' },
          bossReply: {
            vi: 'Tôi không hiểu mấy chuyện phần nghìn độ! Miễn có ảnh gửi lên hội nghị trong {budget} triệu đô và {deadline} tháng!',
            en: 'I do not care about arcseconds! Just ensure data arrives at the summit within ${budget}M and {deadline} months!',
          },
          engNote: {
            vi: 'Sếp vẫn không hiểu vật lý không gian. Mình phải tự cân đối giữa độ chính xác chỉ hướng, công suất và hạn chót trong xưởng.',
            en: 'The Director ignores orbital physics. I must balance pointing accuracy, power, and lead times in the workshop.',
          },
        },
        {
          tag: { vi: 'CẢNH BÁO 850.000 NÔNG DÂN', en: 'WARN OF 850,000 FARMERS' },
          text: {
            vi: 'Nếu ảnh phổ bị nhòe, 1,8 triệu tấn khí Methane xả trộm sẽ lọt lưới, gây hạn mặn khiến 850.000 nông dân mất trắng mùa vụ đấy Sếp!',
            en: 'If spectrometry smears, 1.8 million tons of illicit methane bypass detection, driving drought that wipes out 850,000 farmers!',
          },
          stamp: { vi: 'GẠT BỎ LẬP LUẬN KHÍ HẬU', en: 'CLIMATE ARGUMENTS DISMISSED' },
          bossReply: {
            vi: 'Chuyện mùa màng là việc của Bộ Nông nghiệp, việc của tôi là giữ bảng cân đối kế toán quý này đừng bị âm!',
            en: 'Crops are the Ministry of Agriculture problem, my job is keeping this quarter balance sheet in the black!',
          },
          engNote: {
            vi: 'Không thể thuyết phục bằng lời lúc này — chỉ có cấu hình chuẩn xác trong xưởng mới cứu được sứ mệnh.',
            en: 'Words will not persuade him now — only a precise configuration in the workshop can save the mission.',
          },
        },
        {
          tag: { vi: 'XIN NÂNG CẤP NGUỒN ĐIỆN', en: 'REQUEST POWER UPGRADE' },
          text: {
            vi: 'Quang phổ kế hồng ngoại ngốn công suất rất lớn; dùng tấm pin nhỏ sẽ gây sập nguồn ngay khi bay qua vùng tối Trái Đất!',
            en: 'The infrared spectrometer draws substantial wattage; undersized panels will trigger power collapse during orbital eclipse!',
          },
          stamp: { vi: 'BÁC BỎ YÊU CẦU TĂNG NGUỒN', en: 'POWER EXPANSION REJECTED' },
          bossReply: {
            vi: 'Bay trên trời nắng suốt ngày mà còn sợ thiếu điện à?! Đừng kiếm cớ tiêu lố {budget} triệu đô của tôi!',
            en: 'Flying in sunlight all day and afraid of blackouts?! Stop finding excuses to exceed my ${budget}M!',
          },
          engNote: {
            vi: 'Sếp tưởng trên quỹ đạo không bao giờ đi vào vùng bóng Trái Đất. Tự mình tính toán cân bằng nguồn thôi.',
            en: 'He thinks orbit never enters Earth shadow. I will calculate power margins myself.',
          },
        },
      ],
    },
  ],
};

const LAUNCH_FAIL_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    {
      who: 'boss',
      text: {
        vi: 'Cái gì vừa nổ ngoài kia vậy?! {cost} triệu đô tiền cứu hỏa rừng bốc cháy ngay trên trời!',
        en: 'What just exploded out there?! {cost} million dollars of wildfire response burned up in the sky!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Báo cáo: {failure}. Không đưa được vệ tinh lên quỹ đạo nghĩa là 142.000 ha rừng mùa khô năm nay không có mắt thần cảnh báo.',
        en: 'Report: {failure}. Failing to reach orbit leaves 142,000 hectares of forest with zero early warning eyes this dry season.',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Hồ sơ thì giữ lấy. Uy tín của anh với tôi còn {rep} vạch — lo sửa ngay đi!',
        en: 'Keep the paperwork. Your authority credits stand at {rep} — fix this immediately!',
      },
      choices: [
        {
          tag: { vi: 'ĐÒI BỔ SUNG NGÂN SÁCH TÊN LỬA', en: 'DEMAND LAUNCHER BUDGET' },
          text: {
            vi: 'Tải trọng cần tên lửa và khung đỡ lớn hơn! Sếp ép {budget} triệu thì sao đủ nâng cấu hình an toàn lên quỹ đạo được?',
            en: 'The payload required a heavier launcher and bus! With ${budget}M we lacked margin to place it safely in orbit!',
          },
          stamp: { vi: 'TỪ CHỐI CẤP TIỀN ĐỢT NÀY', en: 'ADDITIONAL FUNDS REJECTED' },
          bossReply: {
            vi: 'Chưa bay tới quỹ đạo lấy bằng chứng về thì đừng hòng xin thêm một xu! Về xưởng chỉnh lại khối lượng hoặc soi sạch lỗi trước phóng đi!',
            en: 'Until you reach orbit and return telemetry proof, do not expect a dime! Adjust mass or clear defects before liftoff!',
          },
          engNote: {
            vi: 'Sếp khước từ mọi yêu cầu trước khi tên lửa vào quỹ đạo. Mình phải sửa lỗi tải và lắp ráp trước đã.',
            en: 'Director rejects all claims before orbital insertion. I must resolve payload and assembly defects first.',
          },
        },
        {
          tag: { vi: 'NHẬN TRÁCH NHIỆM KỸ THUẬT', en: 'ACCEPT ENGINEERING RESPONSIBILITY' },
          text: {
            vi: 'Tôi sẽ rà soát lại giới hạn khối lượng khung, khớp nối tầng đẩy và lỗi kiểm định để phóng lại ngay.',
            en: 'I will re-verify bus mass limits, interstage couplings, and inspection anomalies to relaunch immediately.',
          },
          stamp: { vi: 'GHI SỔ KỶ LUẬT', en: 'DISCIPLINARY RECORD' },
          bossReply: {
            vi: 'Nhanh lên đấy! Anh chỉ còn {rep} vạch uy tín thôi, cháy thêm quả nữa là tôi giao dự án cho người khác!',
            en: 'Make it quick! You only have {rep} authority credits left; one more fireball and I reassign the project!',
          },
          engNote: {
            vi: 'Quay lại xưởng kiểm tra đồ thị quỹ đạo và đường bao khối lượng ngay.',
            en: 'Returning to workshop to inspect orbit trajectory and mass envelopes.',
          },
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    {
      who: 'boss',
      text: {
        vi: '{cost} triệu đô rơi thẳng xuống biển! Tôi vừa hứa với truyền thông về trạm gác bão Mặt Trời xong!',
        en: '{cost} million dollars plunged into the ocean! I just promised the media an operational solar storm sentinel!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Báo cáo: {failure}. Nếu không có vệ tinh này ở quỹ đạo tầm trung, 6,4 triệu hộ dân và 340 chuyến bay vùng cực sẽ hoàn toàn mù thông tin trước bão từ G5.',
        en: 'Report: {failure}. Without this sentinel in medium orbit, 6.4M homes and 340 polar flights remain blind before a G5 storm.',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Tôi không muốn nghe con số dân sinh nữa. Uy tín của anh còn {rep} vạch!',
        en: 'I do not want to hear civilian statistics. Your authority credits stand at {rep}!',
      },
      choices: [
        {
          tag: { vi: 'XIN ĐỔI TÊN LỬA HẠNG NẶNG', en: 'REQUEST HEAVY LAUNCH VEHICLE' },
          text: {
            vi: 'Quỹ đạo này cần delta-v rất lớn; với gói tiền hiện tại tên lửa bị thiếu lực đẩy hoặc quá tải khung!',
            en: 'This orbit requires substantial delta-v; under current budget the rocket suffered thrust shortfall or structural overload!',
          },
          stamp: { vi: 'BÁC BỎ ĐƠN CẤP THÊM TIỀN', en: 'CAPITAL REQUEST DENIED' },
          bossReply: {
            vi: 'Chừng nào vệ tinh chưa lên tới quỹ đạo và chết vì bức xạ có hồ sơ rõ ràng, ngân sách vẫn khóa chặt ở {budget} triệu!',
            en: 'Until the satellite reaches orbit and presents verified radiation failure dossiers, budget stays locked at ${budget}M!',
          },
          engNote: {
            vi: 'Phải đưa vệ tinh lên được quỹ đạo tầm trung trước mới có bằng chứng bức xạ đối chất với sếp.',
            en: 'Must reach medium orbit first before having radiation proof to confront management.',
          },
        },
        {
          tag: { vi: 'RÀ SOÁT LẠI KHỐI LƯỢNG & LỖI SOI', en: 'RECHECK MASS & DIAGNOSTIC FAULTS' },
          text: {
            vi: 'Tôi sẽ kiểm tra lại tỷ lệ khối lượng đẩy, bãi phóng phù hợp độ nghiêng và soi kỹ các lỗi ở pha kiểm định.',
            en: 'I will re-evaluate propellant mass fraction, inclination match at launch site, and all pre-flight inspection defects.',
          },
          stamp: { vi: 'KHẤU TRỪ UY TÍN', en: 'AUTHORITY DEDUCTED' },
          bossReply: {
            vi: 'Liệu hồn mà làm cho chuẩn, hội đồng không kiên nhẫn mãi đâu!',
            en: 'Make sure you get it right, the board will not stay patient forever!',
          },
          engNote: {
            vi: 'Quay lại xưởng tối ưu lại tên lửa và quy trình quét lỗi.',
            en: 'Returning to workshop to optimize vehicle and diagnostic inspection.',
          },
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    {
      who: 'boss',
      text: {
        vi: 'Lại mất {cost} triệu đô trên bệ phóng! Hội nghị khí hậu quốc tế đang dí sát sau lưng tôi kia kìa!',
        en: 'Another {cost} million dollars lost on the pad! The international climate conference is breathing down my neck!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Báo cáo: {failure}. Vệ tinh đo khí Methane chưa lên được quỹ đạo — 850.000 nông dân vùng hạn mặn vẫn chưa có bằng chứng truy vết nguồn xả.',
        en: 'Report: {failure}. The methane spectrometer failed to reach orbit — 850,000 farmers in drought zones still lack evidence to hold polluters accountable.',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Sửa ngay chiếc khác đi. Uy tín của anh chỉ còn {rep} vạch thôi đấy!',
        en: 'Build another stack immediately. Your authority credits stand at {rep}!',
      },
      choices: [
        {
          tag: { vi: 'YÊU CẦU TĂNG NGÂN SÁCH TÊN LỬA', en: 'DEMAND LAUNCHER BUDGET INCREASE' },
          text: {
            vi: 'Thiết bị đo khí nhà kính rất nặng, Sếp phải nới ngân sách để dùng khung thân lớn và tên lửa chuyên dụng!',
            en: 'Greenhouse instruments are heavy; you must expand budget for a larger bus structure and dedicated launcher!',
          },
          stamp: { vi: 'TỪ CHỐI MỞ NGÂN SÁCH KHẨN', en: 'EMERGENCY BUDGET DENIED' },
          bossReply: {
            vi: 'Tên lửa nổ ngay dưới tầng thấp thì lấy đâu ra chứng cứ thuyết phục hội đồng?! Tự cân đối lại khối lượng và kiểm tra trước phóng đi!',
            en: 'With the vehicle exploding in lower atmosphere where is proof for the board?! Rebalance mass and inspect before flight!',
          },
          engNote: {
            vi: 'Sếp vẫn giữ chặt két tiền. Cần qua khỏi giai đoạn phóng trước.',
            en: 'The Director clings to the vault. We must clear ascent first.',
          },
        },
        {
          tag: { vi: 'CAM KẾT PHÓNG LẠI AN TOÀN', en: 'PLEDGE SAFE RELAUNCH' },
          text: {
            vi: 'Rõ. Tôi sẽ cân bằng lại trọng lượng tàu và rà soát toàn bộ van nhiên liệu trước khi rời bệ.',
            en: 'Understood. I will rebalance payload weight and inspect propellant lines before leaving the pad.' } ,
          stamp: { vi: 'CẢNH CÁO CUỐI CÙNG', en: 'FINAL WARNING' },
          bossReply: {
            vi: 'Đừng để tôi thấy khói đen trên màn hình thêm lần nữa!',
            en: 'Do not let me see black smoke on monitor screens again!',
          },
          engNote: {
            vi: 'Về xưởng chỉnh lại cấu hình phóng ngay.',
            en: 'Returning to workshop to adjust launch configuration immediately.',
          },
        },
      ],
    },
  ],
};

const REVIEW_OK_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    {
      who: 'eng',
      text: {
        vi: 'Đã có {evidence} ảnh tọa độ cháy rừng rõ nét truyền thẳng về mặt đất. Lực lượng cứu hỏa đã khoanh vùng cứu sống 142.000 ha rừng và bảo vệ 38.500 cư dân!',
        en: 'Downlinked {evidence} crisp wildfire coordinate images straight to ground stations. Firefighters contained the perimeter, saving 142,000 ha of forest and 38,500 residents!',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Tuyệt vời! Báo chí đang ca ngợi hết lời! Tôi biết mà, cứ giao cho đội của tôi là xong!',
        en: 'Fantastic! The press is praising us everywhere! I knew it, leave it to my team and it gets done!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Không phải nhờ may mắn — mà nhờ đủ đường truyền, đủ pin và giữ hướng chuẩn xác.',
        en: 'Not luck — but adequate downlink, reliable power, and accurate attitude stabilization.',
      },
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    {
      who: 'eng',
      text: {
        vi: 'Trạm gác đã đứng vững qua bão bức xạ và phát cảnh báo đỏ trước 18 giờ: 6,4 triệu hộ dân giữ nguyên lưới điện, 340 chuyến bay vùng cực đổi hướng an toàn!',
        en: 'The sentinel weathered the radiation storm and issued red alerts 18 hours early: 6.4M homes maintained power, 340 polar flights rerouted safely!',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Cái đầu tôi giữ được trên ghế rồi! Xem ra đống linh kiện đắt tiền đó cũng... đáng đồng tiền đấy chứ.',
        en: 'My head stays on my shoulders! Turns out those premium components were... actually worth every cent.',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Trong vành đai bức xạ, chỉ linh kiện chống bức xạ thật sự mới bảo vệ được nền văn minh dưới mặt đất.',
        en: 'Inside the radiation belt, only genuine radiation-hardened parts can protect civilization on the ground.',
      },
    },
  ],
  'MP-SC04-GHG': [
    {
      who: 'eng',
      text: {
        vi: 'Quang phổ kế đã khóa chặt 27 siêu nguồn rò rỉ khí Methane! 1,8 triệu tấn phát thải bị chặn đứng, bảo vệ 2,3 triệu ha đất nông nghiệp cho 850.000 nông dân!',
        en: 'Spectrometry pinpointed 27 methane super-emitters! 1.8M tons of emissions halted, preserving 2.3M ha of agricultural plains for 850,000 farmers!',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Cả Ủy ban Khí hậu vừa gọi chúc mừng tôi rồi! Dự án này đưa tôi lên trang nhất!',
        en: 'The Climate Committee just called to congratulate me! This project lands me on the front page!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Độ chính xác phần nghìn độ trên quỹ đạo đã mang lại công lý cho những cánh đồng dưới Trái Đất.',
        en: 'Sub-arcsecond accuracy in orbit delivered justice to parched farmlands on Earth.',
      },
    },
  ],
};

const REVIEW_FAIL_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    {
      who: 'boss',
      text: {
        vi: 'Vệ tinh bay lên được rồi mà mặt đất không nhận nổi ảnh cháy rừng? Anh giải thích thế nào?!',
        en: 'The satellite made orbit yet ground stations received zero wildfire images? How do you explain this?!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Nguyên nhân gốc: {failure}. Hậu quả là mất liên lạc suốt 72 giờ vàng — 142.000 ha rừng nguyên sinh hóa tro tàn và 38.500 người dân phải di tản trong khói độc.',
        en: 'Root cause: {failure}. Lost communications over 72 golden hours — 142,000 ha of forest burned and 38,500 residents evacuated in toxic smoke.',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Tôi... tôi cắt ngân sách thật nhưng lỗi ở anh chứ? Uy tín của anh còn {rep} vạch. Mở hồ sơ ra tôi xem!',
        en: 'I... I trimmed the budget, but you are the engineer! Your authority credits stand at {rep}. Open the dossier!',
      },
      choices: [
        {
          tag: { vi: 'PHẢN BÁC: DO SẾP CẮT TIỀN', en: 'REFUTE: YOU CUT FUNDS' },
          text: {
            vi: 'Ngay từ đầu tôi đã cảnh báo ngân sách {budget}M và linh kiện tồn kho sẽ làm nghẽn dữ liệu hoặc sập nguồn rồi mà Sếp bác bỏ!',
            en: 'From the start I warned that ${budget}M and stock parts would choke downlink or collapse power, but you dismissed it!',
          },
          stamp: { vi: 'BÁC BỎ BẰNG MIỆNG // ĐÒI BẰNG CHỨNG', en: 'VERBAL CLAIM REJECTED // DEMAND PROOF' },
          bossReply: {
            vi: 'Nói suông không có giá trị! Vào bàn chất vấn đưa đúng thẻ chứng cứ khớp báo cáo lỗi ra đây thì tôi mới duyệt thêm tiền!',
            en: 'Talk is cheap! Enter the director audit with proof matching the failure report before I approve more funds!',
          },
          engNote: {
            vi: 'Được rồi! Mình đã có hồ sơ nguyên nhân trên tay — hãy chọn đúng thẻ chứng cứ ở màn chất vấn để buộc ông ta mở két!',
            en: 'Alright! We have the root cause dossier in hand — select matching evidence during the audit to force open the vault!',
          },
        },
        {
          tag: { vi: 'ĐÒI MỞ KHÓA NGÂN SÁCH ĐỂ SỬA', en: 'DEMAND BUDGET UNLOCK' },
          text: {
            vi: 'Để cứu mùa cháy rừng tới, Sếp buộc phải cấp thêm ngân sách nâng cấp ăng-ten băng thông cao và nguồn điện ngay lập tức!',
            en: 'To protect the coming fire season, you must release funds immediately for high-gain antennas and power upgrades!',
          },
          stamp: { vi: 'TỪ CHỐI MỞ KÉT TỰ ĐỘNG', en: 'AUTOMATIC OVERRIDE DENIED' },
          bossReply: {
            vi: 'Muốn mở khóa két tiền hả? Chứng minh lỗi đó thuộc trách nhiệm quản lý của tôi trong phiên chất vấn trước đi đã!',
            en: 'Want the safe unlocked? Prove that failure stems from my fiscal constraints in the audit first!',
          },
          engNote: {
            vi: 'Sếp vẫn cố cãi chày cối. Hãy dùng hồ sơ kỹ thuật chất vấn trực diện!',
            en: 'The Director still deflects. Use engineering dossiers to confront him directly!',
          },
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    {
      who: 'boss',
      text: {
        vi: 'Đưa trạm lên tận quỹ đạo xa rồi mà sao bão Mặt Trời đánh sập nửa lưới điện Bắc Bán Cầu vẫn không thấy báo động?!',
        en: 'Station reached medium orbit, yet a solar storm downed half the northern grid with zero alerts?!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Nguyên nhân gốc: {failure}. Hạt năng lượng cao đánh thủng chip giá rẻ mà sếp ép dùng: 6,4 triệu hộ mất điện giữa mùa đông và 340 chuyến bay vùng cực mù sóng định vị.',
        en: 'Root cause: {failure}. Energetic particles fried unhardened chips you forced us to use: 6.4M homes froze without power and 340 flights lost navigation.',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Đừng đổ hết lên đầu tôi! Uy tín còn {rep} vạch — đưa bằng chứng kỹ thuật lên bàn ngay!',
        en: 'Do not pin this on me! Your authority credits stand at {rep} — put technical evidence on the table!',
      },
      choices: [
        {
          tag: { vi: 'NHẮC LẠI CẢNH BÁO BỨC XẠ', en: 'RECALL RADIATION WARNING' },
          text: {
            vi: 'Tôi đã nói trước là dùng chip không chống bức xạ ở quỹ đạo này sẽ chết vì quá tải hạt năng lượng nhưng Sếp nhất quyết mua đồ rẻ!',
            en: 'I warned you that unhardened chips in this orbit would freeze under particle bombardment, but you insisted on cheap parts!',
          },
          stamp: { vi: 'TỪ CHỐI NHẬN LỖI', en: 'FAULT ADMISSION DENIED' },
          bossReply: {
            vi: 'Hội đồng cần giấy trắng mực đen! Trình thẻ chứng cứ lỗi bức xạ và hóa đơn cắt xén trong phiên chất vấn rồi tôi mới nhả thêm ngân sách!',
            en: 'The board demands black and white documentation! Present radiation failure evidence and cut invoices in the audit before I release budget!',
          },
          engNote: {
            vi: 'Ông ta sắp hết đường chối rồi. Hãy chốt hạ bằng hồ sơ nguyên nhân trong phiên chất vấn!',
            en: 'His excuses are running thin. Close the case with root cause dossiers in the director audit!',
          },
        },
        {
          tag: { vi: 'YÊU CẦU CẤP CHIP CHỐNG BỨC XẠ', en: 'DEMAND RAD-HARD AVIONICS' },
          text: {
            vi: 'Sếp phải mở khóa ngay khoản chi cho chip chống bức xạ và nới hạn chót để không lặp lại thảm họa mất điện này!',
            en: 'You must unlock budget for rad-hard processors and extend deadlines to prevent another catastrophic blackout!',
          },
          stamp: { vi: 'BÁC BỎ ĐƠN XIN MIỄN TRỪ', en: 'WAIVER REQUEST REJECTED' },
          bossReply: {
            vi: 'Không có chuyện xin miệng! Đưa chứng cứ hợp lệ lên bàn chất vấn bên dưới đi!',
            en: 'No verbal exemptions! Bring valid evidence to the audit table below!',
          },
          engNote: {
            vi: 'Chuẩn bị đối chất trực tiếp với giám đốc.',
            en: 'Prepare for direct confrontation with the director.',
          },
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    {
      who: 'boss',
      text: {
        vi: 'Hội đồng Khí hậu vừa bác bỏ toàn bộ tập dữ liệu của ta! Hàng chục triệu đô đổ xuống biển hết rồi!',
        en: 'The Climate Committee threw out our entire dataset! Tens of millions down the drain!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Nguyên nhân gốc: {failure}. Chúng ta bỏ lọt 1,8 triệu tấn khí Methane vô hình, đẩy 2,3 triệu ha đồng bằng vào hạn mặn và 850.000 nông dân mất trắng mùa vụ.',
        en: 'Root cause: {failure}. We let 1.8M tons of invisible methane escape, driving 2.3M ha of farmland into salinity and 850,000 farmers into ruin.',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Đừng dọa tôi bằng mấy con số nông nghiệp đó! Uy tín còn {rep} vạch — trình báo cáo chất vấn đi!',
        en: 'Stop scaring me with agricultural numbers! Your authority credits stand at {rep} — submit audit filings!',
      },
      choices: [
        {
          tag: { vi: 'CHỈ TRÍCH LỆNH ÉP TIẾN ĐỘ & TIỀN', en: 'CALL OUT SCHEDULE & BUDGET SQUEEZE' },
          text: {
            vi: 'Chính trần ngân sách {budget}M và hạn chót {deadline} tháng của Sếp đã trói tay không cho lắp bộ điều khiển hướng chính xác và nguồn đủ chuẩn!',
            en: 'Your ${budget}M cap and {deadline}-month deadline tied our hands from installing precision attitude control and adequate power!',
          },
          stamp: { vi: 'BÁC BỎ LỜI CÁO BUỘC', en: 'ALLEGATION REJECTED' },
          bossReply: {
            vi: 'Mồm mép không giải quyết được biên bản kiểm toán! Hãy chọn đúng chứng cứ chứng minh trong phiên chất vấn rồi nói chuyện mở khóa ngân sách!',
            en: 'Rhetoric does not satisfy auditors! Present matching evidence in the audit before talking about budget overrides!',
          },
          engNote: {
            vi: 'Giờ là lúc lôi hồ sơ lỗi và sổ đen của sếp ra đối chất trực tiếp.',
            en: 'Now is the time to bring the failure dossier and blackbook to direct confrontation.',
          },
        },
        {
          tag: { vi: 'XIN CƠ HỘI PHÓNG LẠI CẤU HÌNH CHUẨN', en: 'REQUEST FLIGHT RETRY WITH VALID CONFIG' },
          text: {
            vi: 'Hãy nới trần chi phí và tiến độ để tôi thay quang phổ kế và hệ điều khiển tư thế chính xác hơn!',
            en: 'Extend cost and schedule caps so I can integrate precision spectrometers and fine attitude control!',
          },
          stamp: { vi: 'TỪ CHỐI MỞ KHÓA NGAY', en: 'IMMEDIATE OVERRIDE DENIED' },
          bossReply: {
            vi: 'Chỉ khi nào anh chứng minh được nút thắt nằm ở quyết định cắt giảm của tôi trong phần chất vấn thì tôi mới ký duyệt bổ sung!',
            en: 'Only when you prove the failure bottleneck stemmed from my cuts during the audit will I authorize supplements!',
          },
          engNote: {
            vi: 'Tiến vào phiên chất vấn trực diện.',
            en: 'Proceed to direct confrontation audit.',
          },
        },
      ],
    },
  ],
};

export const SCENES = {
  intro: (ctx) =>
    INTRO[ctx?.mission] || [
      {
        who: 'boss',
        text: {
          vi: 'Dự án mới, ngân sách {budget} triệu, hạn {deadline} tháng. Làm đi.',
          en: 'New mission, ${budget}M budget, {deadline} month deadline. Get to work.',
        },
        choices: [
          {
            tag: { vi: 'XIN TĂNG NGÂN SÁCH', en: 'REQUEST EXTRA BUDGET' },
            text: {
              vi: 'Với {budget} triệu và hạn {deadline} tháng thì biên dự phòng rất mỏng, Sếp cân nhắc nới thêm giúp đội ngũ.',
              en: 'With ${budget}M and {deadline} months engineering margins are razor thin, please consider expanding budget.',
            },
            stamp: { vi: 'TỪ CHỐI PHÊ DUYỆT', en: 'REQUEST DENIED' },
            bossReply: {
              vi: 'Không thêm bớt gì hết! Đúng {budget} triệu và {deadline} tháng, tự thiết kế mà chịu trách nhiệm!',
              en: 'Not a penny more! Exactly ${budget}M and {deadline} months, design it and take responsibility!',
            },
            engNote: {
              vi: 'Rõ. Tôi sẽ tự chịu trách nhiệm thiết kế trong xưởng.',
              en: 'Understood. I will shoulder design responsibility in the workshop.',
            },
          },
          {
            tag: { vi: 'CHẤP NHẬN NHIỆM VỤ', en: 'ACCEPT MISSION' },
            text: {
              vi: 'Rõ. Tôi sẽ kiểm chứng mọi giới hạn vật lý trực tiếp trên mô hình bay.',
              en: 'Understood. I will verify physical limits directly on the flight model.',
            },
            stamp: { vi: 'XÁC NHẬN ÁP TRẦN {budget}M', en: 'CAP CONFIRMED AT ${budget}M' },
            bossReply: {
              vi: 'Tốt, đừng để tôi phải chờ lâu!',
              en: 'Good, do not keep me waiting!',
            },
            engNote: {
              vi: 'Bắt đầu lắp ráp trong xưởng.',
              en: 'Commencing assembly in the workshop.',
            },
          },
        ],
      },
    ],

  prelaunch: () => [
    {
      who: 'boss',
      text: {
        vi: 'Đã lắp xong rồi chứ? Báo chí đang chờ ngoài cổng. Phóng ngay cho tôi!',
        en: 'Assembly complete? Press is waiting at the gate. Launch immediately!',
      },
      choices: [
        {
          tag: { vi: 'CẢNH BÁO RỦI RO LẦN CUỐI', en: 'FINAL RISK WARNING' },
          text: {
            vi: 'Thưa Sếp, các chỉ số nguy cơ vẫn đang nằm trên vai kỹ thuật; nếu phóng cấu hình chưa tối ưu, vệ tinh có thể hỏng giữa đường.',
            en: 'Director, risk margins remain precarious; launching an unoptimized stack risks in-flight failure.',
          },
          stamp: { vi: 'BÁC BỎ CẢNH BÁO // CẤM HOÃN', en: 'WARNING REJECTED // NO DELAYS' },
          bossReply: {
            vi: 'Báo chí đang quay phim trực tiếp rồi! Không hoãn hiếc gì hết — kích hoạt đếm ngược phóng ngay!',
            en: 'Broadcast cameras are live! No delays whatsoever — activate countdown now!',
          },
          engNote: {
            vi: 'Từ giây phút này, không ai sửa được gì nữa. Vật lý sẽ định đoạt số phận chuyến bay.',
            en: 'From this moment, nothing can be patched. Physics will decide the mission.',
          },
        },
        {
          tag: { vi: 'XÁC NHẬN RỜI BỆ PHÓNG', en: 'CONFIRM LIFTOFF SEQUENCE' },
          text: {
            vi: 'Hệ thống kiểm định đã khóa hồ sơ. Bàn giao trình tự đánh lửa ra bệ phóng ngay bây giờ.',
            en: 'Pre-flight diagnostics are locked. Transferring ignition sequencing to the launch pad now.',
          },
          stamp: { vi: 'LỆNH PHÓNG ĐƯỢC DUYỆT', en: 'LAUNCH CLEARANCE APPROVED' },
          bossReply: {
            vi: 'Phóng đi! Tôi muốn thấy tên lửa vút lên trời ngay lập tức!',
            en: 'Launch! I want to see the rocket soaring right now!',
          },
          engNote: {
            vi: 'Bắt đầu mô phỏng phóng.',
            en: 'Ascent simulation initiated.',
          },
        },
      ],
    },
  ],

  launch_fail: (ctx) =>
    LAUNCH_FAIL_BY_MISSION[ctx?.mission] || [
      {
        who: 'boss',
        text: {
          vi: 'Cái gì vừa nổ ngoài kia vậy?! {cost} triệu đô của tôi bốc cháy trên trời!',
          en: 'What just exploded out there?! {cost} million dollars burned up in the sky!',
        },
      },
      {
        who: 'eng',
        text: {
          vi: 'Báo cáo: {failure}. Tôi đã có hồ sơ nguyên nhân.',
          en: 'Report: {failure}. I have the root cause dossier.',
        },
      },
      {
        who: 'boss',
        text: {
          vi: 'Hồ sơ thì giữ lấy. Uy tín của anh với tôi còn {rep} vạch.',
          en: 'Keep the report. Your authority credits stand at {rep}.',
        },
      },
    ],

  abort_scrub: () => [
    {
      who: 'boss',
      text: {
        vi: 'Hoãn phóng?! Anh có biết chuẩn bị một lần phóng tốn bao nhiêu tiền không?',
        en: 'Launch scrubbed?! Do you have any idea what pad preparation costs?',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Tôi chịu trách nhiệm. Thà hoãn phóng còn hơn để nổ tên lửa.',
        en: 'I take full responsibility. Better a scrub than losing the rocket.',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Lần này tôi ghi sổ. Uy tín của anh còn {rep} vạch.',
        en: 'I am logging this. Your authority credits stand at {rep}.',
      },
    },
  ],

  abort_fts: () => [
    {
      who: 'boss',
      text: {
        vi: 'Anh tự tay kích hoạt nổ tên lửa của tôi?!',
        en: 'You manually detonated my rocket?!',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Hệ thống tự hủy an toàn kích hoạt theo đúng quy trình. Không ai dưới mặt đất bị thương.',
        en: 'Flight termination system activated strictly according to range safety protocol. Zero casualties on the ground.',
      },
    },
    {
      who: 'boss',
      text: {
        vi: 'Tên lửa thì mất rồi. Uy tín của anh còn {rep} vạch.',
        en: 'The rocket is gone. Your authority credits stand at {rep}.',
      },
    },
  ],

  review_ok: (ctx) =>
    REVIEW_OK_BY_MISSION[ctx?.mission] || [
      {
        who: 'eng',
        text: {
          vi: 'Đã có {evidence} gói dữ liệu rõ nét về tới trạm mặt đất. Sứ mệnh hoàn thành trọn vẹn.',
          en: 'Successfully downlinked {evidence} data packets to ground stations. Mission fully accomplished.',
        },
      },
      {
        who: 'boss',
        text: {
          vi: 'Tốt! Báo chí sẽ thích cái này. Tôi biết mà, cứ tiết kiệm là được.',
          en: 'Good! The press will love this. I knew sticking to budget cuts would work.',
        },
      },
      {
        who: 'eng',
        text: {
          vi: 'Không phải nhờ tiết kiệm, mà nhờ tính toán kỹ thuật chính xác.',
          en: 'Not budget cuts, but precise engineering calculation.',
        },
      },
    ],

  review_fail: (ctx) =>
    REVIEW_FAIL_BY_MISSION[ctx?.mission] || [
      {
        who: 'boss',
        text: {
          vi: 'Vệ tinh lên được rồi mà vẫn không có kết quả? Anh giải thích đi.',
          en: 'The satellite reached orbit yet produced no results? Explain yourself.',
        },
      },
      {
        who: 'eng',
        text: {
          vi: 'Nguyên nhân gốc: {failure}.',
          en: 'Root cause: {failure}.',
        },
      },
      {
        who: 'boss',
        text: {
          vi: 'Tôi không quan tâm nguyên nhân. Uy tín của anh còn {rep} vạch.',
          en: 'I do not care about excuses. Your authority credits stand at {rep}.',
        },
      },
    ],

  fired: () => [
    {
      who: 'boss',
      text: {
        vi: 'Đủ rồi. Dự án bị hủy bỏ. Hội đồng sẽ giao nhiệm vụ này cho người khác.',
        en: 'Enough. The project is scrubbed. The board is reassigning this mission.',
      },
    },
    {
      who: 'eng',
      text: {
        vi: 'Hồ sơ kỹ thuật vẫn còn đây. Lần sau mình sẽ làm khác.',
        en: 'The flight logs remain. Next time I will approach this differently.',
      },
    },
  ],
};

/** Thay {bien} trong cau thoai. */
export function fill(text, ctx) {
  return String(text || '').replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? String(ctx[k]) : `{${k}}`));
}
