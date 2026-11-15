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
    levelTag: {
      vi: 'CHIẾN DỊCH CỨU HỘ RỪNG NHIỆT ĐỚI',
      en: 'TROPICAL FOREST RESCUE CAMPAIGN',
    },
    fail: {
      badge: {
        vi: 'THẢM HỌA SINH THÁI & DÂN SINH',
        en: 'ECOLOGICAL & HUMAN DISASTER',
      },
      headline: {
        vi: 'MÙ THÔNG TIN GIỮA MÙA LỬA ĐỎ: 142.000 HA RỪNG HÓA TRO TÀN',
        en: 'BLACKOUT IN THE FIRE SEASON: 142,000 HECTARES REDUCED TO ASHES',
      },
      causeByFailure: {
        data: {
          vi: 'Vệ tinh chụp được đám cháy nhưng ăng-ten UHF băng thông hẹp làm nghẽn toàn bộ dữ liệu trên quỹ đạo — không một bức ảnh tọa độ lửa nào kịp truyền về trạm mặt đất.',
          en: 'The satellite captured wildfire thermal imagery, but the narrow-bandwidth UHF antenna choked orbital downlink — not a single fire coordinate reached the ground station in time.',
        },
        power: {
          vi: 'Tấm pin mặt trời công suất thấp khiến vệ tinh sập nguồn khi bay qua vùng tối đúng vào thời điểm đám cháy bùng phát.',
          en: 'Underpowered solar arrays caused a power blackout during eclipse right when the wildfire erupted.',
        },
        pointing: {
          vi: 'Hệ thống điều khiển tư thế thiếu bánh đà phản ứng làm ảnh chụp bị nhòe nặng, không thể xác định tọa độ tâm lửa.',
          en: 'Attitude control without reaction wheels caused severe motion blur, making it impossible to determine fire front coordinates.',
        },
        blur: {
          vi: 'Hệ thống điều khiển tư thế thiếu bánh đà phản ứng làm ảnh chụp bị nhòe nặng, không thể xác định tọa độ tâm lửa.',
          en: 'Attitude control without reaction wheels caused severe motion blur, making it impossible to determine fire front coordinates.',
        },
        radiation: {
          vi: 'Máy tính trên tàu treo cứng do bức xạ không gian, bỏ lỡ toàn bộ các lượt bay qua vùng rừng đang cháy.',
          en: 'The on-board computer froze from ionizing radiation, missing all crucial passes over the burning forest corridor.',
        },
        inspection_fault: {
          vi: 'Lỗi lắp ráp bị bỏ sót từ xưởng kiểm định khiến vệ tinh mất khả năng vận hành ngay khi vừa tách tầng.',
          en: 'Assembly flaws missed during pre-flight inspection crippled the spacecraft immediately after stage separation.',
        },
        launch: {
          vi: 'Vệ tinh không thể lên tới quỹ đạo làm việc, để lại khoảng trống quan trắc hoàn toàn trên bầu trời suốt mùa khô.',
          en: 'The launch vehicle failed to reach operating orbit, leaving an observation blackout across the entire dry season.',
        },
        default: {
          vi: 'Vệ tinh không thể lên tới quỹ đạo làm việc, để lại khoảng trống quan trắc hoàn toàn trên bầu trời suốt mùa khô.',
          en: 'The launch vehicle failed to reach operating orbit, leaving an observation blackout across the entire dry season.',
        },
      },
      paragraphs: {
        vi: [
          'Trong 72 giờ vàng đầu tiên của đợt hạn hán kỷ lục, Sở Chỉ huy Cứu hỏa Liên vùng chờ đợi tín hiệu cảnh báo nhiệt từ quỹ đạo nhưng màn hình trạm mặt đất chỉ toàn nhiễu trắng. Không có tọa độ điểm nóng sớm, đám cháy âm ỉ ở sườn Tây khu bảo tồn đã gặp gió phơn khô nóng và bùng lên thành siêu đám cháy vượt ngoài tầm khống chế.',
          'Khi trực thăng tuần tra phát hiện bằng mắt thường thì bức tường lửa đã cao tới 40 mét. Lệnh sơ tán đưa ra quá muộn khiến hàng chục thị trấn ven rừng rơi vào hỗn loạn trong đêm khói đặc quánh.',
        ],
        en: [
          'During the critical first 72 hours of a record drought, regional fire command waited for orbital thermal alerts, but ground station screens showed only static. Without early coordinates, a smoldering fire on the reserve western ridge met hot dry winds and exploded into an uncontrollable inferno.',
          'By the time patrol helicopters spotted flames visually, the wall of fire was 40 meters high. Late evacuation orders threw dozens of perimeter towns into panic amidst dense smoke.',
        ],
      },
      metrics: [
        {
          label: { vi: 'THẢM RỪNG BỊ THIÊU RỤI', en: 'FOREST CANOPY BURNED' },
          value: '142.000 ha',
          sub: {
            vi: 'Rừng nguyên sinh và hệ sinh thái cổ thụ mất trắng',
            en: 'Old-growth rainforest and ancient ecosystem completely lost',
          },
        },
        {
          label: { vi: 'CƯ DÂN PHẢI DI TẢN KHẨN CẤP', en: 'RESIDENTS EVACUATED' },
          value: '38.500',
          sub: {
            vi: '14 thị trấn bị cô lập, 1.200 mái nhà cháy rụi',
            en: '14 towns isolated, 1,200 homes destroyed by flames',
          },
        },
        {
          label: { vi: 'KHÓI ĐỘC & CO₂ PHÁT TÁN', en: 'TOXIC SMOKE & CO₂' },
          value: '410M t',
          sub: {
            vi: 'Bụi mịn bao phủ thung lũng suốt 21 ngày',
            en: 'Dense particulate haze choking valleys for 21 days',
          },
        },
      ],
      moral: {
        vi: 'Một vệ tinh chụp được ảnh nhưng không truyền nổi dữ liệu về mặt đất thì chỉ là nhân chứng câm trên bầu trời. Cắt xén vài trăm nghìn đô tiền ăng-ten và nguồn điện đã bắt nhân loại trả giá bằng cả một đại ngàn trăm tuổi.',
        en: 'A satellite that snaps photos but cannot downlink data is merely a silent bystander in the sky. Cutting minor funds on antennas and power forced humanity to pay with centuries-old virgin forests.',
      },
    },
    ok: {
      badge: {
        vi: 'SỨ MỆNH BẢO VỆ TRÁI ĐẤT THÀNH CÔNG',
        en: 'EARTH DEFENSE MISSION SUCCESS',
      },
      headline: {
        vi: '14 PHÚT VÀNG TỪ QUỸ ĐẠO: CỨU SỐNG 142.000 HA RỪNG NGUYÊN SINH',
        en: '14 GOLDEN MINUTES FROM ORBIT: 142,000 HECTARES OF RAINFOREST SAVED',
      },
      causeBridge: {
        vi: 'Nhờ đường truyền tốc độ cao, nguồn điện ổn định và hệ thống bánh đà giữ hướng chuẩn xác, đủ 3 gói ảnh tọa độ đám cháy độ phân giải cao đã về tới Sở Chỉ huy ngay trong lượt bay đầu tiên.',
        en: 'Thanks to high-speed downlink, stable power, and precise attitude stabilization, three high-resolution wildfire coordinate packets reached command on the very first orbital pass.',
      },
      paragraphs: {
        vi: [
          'Chỉ 14 phút sau khi đám lửa đầu tiên bén vào thảm thực vật khô ở sườn Tây, vệ tinh đã khóa mục tiêu và truyền thẳng tọa độ nhiệt về Trung tâm Cứu hộ Mặt đất. Đội máy bay thả nước và lực lượng kiểm lâm lập tức khoanh vùng dập tắt ngọn lửa trước khi gió phơn kịp thổi bùng.',
          'Toàn bộ hành lang rừng già và 14 thị trấn ven núi đã đi qua mùa khô khắc nghiệt nhất thập kỷ mà không mất một sinh mạng nào.',
        ],
        en: [
          'Just 14 minutes after embers caught dry brush on the western ridge, the satellite locked target and downlinked infrared coordinates directly to emergency dispatch. Aerial water bombers and ranger units contained the blaze before canyon winds could ignite an inferno.',
          'The entire virgin forest corridor and 14 perimeter towns weathered the decade harshest dry season without a single casualty.',
        ],
      },
      metrics: [
        {
          label: { vi: 'THẢM RỪNG ĐƯỢC BẢO VỆ', en: 'FOREST CANOPY PROTECTED' },
          value: '142.000 ha',
          sub: {
            vi: 'Dập tắt sớm 100% điểm nóng ngay từ vành đai ngoài',
            en: '100% of perimeter hotspots neutralized immediately',
          },
        },
        {
          label: { vi: 'CƯ DÂN ĐƯỢC AN TOÀN', en: 'RESIDENTS SECURED' },
          value: '38.500',
          sub: {
            vi: '14 thị trấn ven rừng không phải sơ tán trong đêm',
            en: '14 foothill towns protected from midnight evacuation',
          },
        },
        {
          label: { vi: 'KHÍ THẢI ĐƯỢC NGĂN CHẶN', en: 'CARBON EMISSIONS PREVENTED' },
          value: '410M t',
          sub: {
            vi: 'Giữ nguyên lá phổi xanh cho toàn vùng hạ lưu',
            en: 'Green canopy fully preserved for the entire watershed',
          },
        },
      ],
      moral: {
        vi: 'Dữ liệu đúng lúc là ranh giới giữa một đốm lửa nhỏ và một thảm họa quốc gia. Khi kỹ sư bảo vệ được đường truyền từ quỹ đạo, hàng vạn sinh mạng dưới mặt đất được bình yên.',
        en: 'Timely data is the boundary between a small spark and a national tragedy. When engineers safeguard downlink from orbit, tens of thousands of lives rest safe on the ground.',
      },
    },
  },

  'MP-SC03-SPACE-WEATHER': {
    missionKey: 'space_weather',
    levelTag: {
      vi: 'PHÒNG TUYẾN BÃO ĐỊA TỪ BẮC BÁN CẦU',
      en: 'NORTHERN GEOMAGNETIC SHIELD DEFENSE',
    },
    fail: {
      badge: {
        vi: 'THẢM HỌA HẠ TẦNG & HÀNG KHÔNG',
        en: 'INFRASTRUCTURE & AVIATION DISASTER',
      },
      headline: {
        vi: 'ĐÊM ĐEN BẮC BÁN CẦU: BÃO TỪ G5 ĐÁNH SẬP LƯỚI ĐIỆN VÌ TRẠM GÁC CÂM LẶNG',
        en: 'NORTHERN HEMISPHERE BLACKOUT: G5 SUPERSTORM CRIPPLES POWER GRIDS',
      },
      causeByFailure: {
        radiation: {
          vi: 'Bộ máy tính trên tàu không đạt chuẩn chống bức xạ đã bị hạt năng lượng cao trong vành đai bức xạ bắn hỏng mạch, làm trạm gác chết lâm sàng trước khi bão Mặt Trời ập tới.',
          en: 'Non-radiation-hardened flight avionics suffered logic breakdown inside the radiation belt, rendering the observatory comatose before the solar storm struck.',
        },
        power: {
          vi: 'Hệ thống nguồn và pin sụt áp giữa quỹ đạo tầm trung, làm ngắt mạch từ kế trước giờ G.',
          en: 'Power bus voltage collapsed in medium Earth orbit, disabling the magnetometer payload right before storm arrival.',
        },
        inspection_fault: {
          vi: 'Lỗi lắp ráp không được khắc phục tại phòng kiểm định khiến trạm gác mất liên lạc ngay sau khi tách khỏi tầng đẩy.',
          en: 'Unresolved assembly defects from pre-flight inspection severed telemetry immediately following stage separation.',
        },
        launch: {
          vi: 'Trạm gác thời tiết không gian không thể duy trì hoạt động tại quỹ đạo tầm trung, để mặc Trái Đất không có lá chắn cảnh báo sớm.',
          en: 'The space weather sentinel could not sustain operations in medium Earth orbit, leaving Earth defenseless without early warning.',
        },
        default: {
          vi: 'Trạm gác thời tiết không gian không thể duy trì hoạt động tại quỹ đạo tầm trung, để mặc Trái Đất không có lá chắn cảnh báo sớm.',
          en: 'The space weather sentinel could not sustain operations in medium Earth orbit, leaving Earth defenseless without early warning.',
        },
      },
      paragraphs: {
        vi: [
          'Khi khối vật chất nhật hoa khổng lồ lao về phía Trái Đất với vận tốc 2.100 km/s, nhân loại hoàn toàn không nhận được cảnh báo trước 18 giờ từ trạm gác trên quỹ đạo tầm trung. Dòng điện cảm ứng địa từ bất ngờ tràn vào hệ thống truyền tải điện cao thế trên khắp Bắc Bán Cầu.',
          'Hàng loạt máy biến áp trung tâm phát nổ trong đêm tuyết trắng. Cùng lúc đó, tầng điện ly bị nhiễu loạn dữ dội làm đứt gãy toàn bộ liên lạc vô tuyến và tín hiệu dẫn đường của hàng trăm máy bay dân dụng đang bay qua vùng cực.',
        ],
        en: [
          'When a massive coronal mass ejection barreled toward Earth at 2,100 km/s, humanity received no 18-hour warning from the orbital sentinel. Geomagnetically induced currents surged unchecked across high-voltage transmission grids throughout the Northern Hemisphere.',
          'Core power transformers exploded through a freezing winter night. Ionospheric turmoil severed high-frequency radio and satellite navigation across hundreds of trans-polar commercial airliners.',
        ],
      },
      metrics: [
        {
          label: { vi: 'HỘ DÂN MẤT ĐIỆN GIỮA MÙA ĐÔNG', en: 'HOUSEHOLDS IN FREEZING BLACKOUT' },
          value: '6.4M',
          sub: {
            vi: '14 trạm biến áp siêu cao áp cháy hỏng, 210 bệnh viện chạy máy phát',
            en: '14 substation transformers melted, 210 hospitals forced on generators',
          },
        },
        {
          label: { vi: 'CHUYẾN BAY MÙ LIÊN LẠC & ĐỊNH VỊ', en: 'POLAR FLIGHTS BLINDED' },
          value: '340',
          sub: {
            vi: 'Mất sóng liên lạc xuyên cực suốt 6 giờ, buộc hạ cánh khẩn cấp',
            en: 'Lost trans-polar radio for 6 hours, forced emergency diversions',
          },
        },
        {
          label: { vi: 'THIỆT HẠI HẠ TẦNG & VỆ TINH', en: 'INFRASTRUCTURE & ORBITAL LOSS' },
          value: '$4.8B',
          sub: {
            vi: '18 vệ tinh viễn thông hỏng mạch vì không kịp vào chế độ an toàn',
            en: '18 commercial satellites damaged before entering safe mode',
          },
        },
      ],
      moral: {
        vi: 'Giữa vành đai bức xạ, linh kiện giá rẻ không chỉ làm hỏng một dự án — nó tháo bỏ chiếc chuông báo động duy nhất của cả nền văn minh công nghệ trước cơn thịnh nộ của Mặt Trời.',
        en: 'Inside the radiation belt, cheap parts do not just break a project — they strip away civilization lone alarm bell against the wrath of the Sun.',
      },
    },
    ok: {
      badge: {
        vi: 'LÁ CHẮN ĐỊA TỪ HOẠT ĐỘNG HOÀN HẢO',
        en: 'GEOMAGNETIC SHIELD FULLY OPERATIONAL',
      },
      headline: {
        vi: 'CẢNH BÁO TRƯỚC 18 GIỜ: 6,4 TRIỆU HỘ DÂN & 340 CHUYẾN BAY VƯỢT QUA BÃO TỪ G5',
        en: '18-HOUR EARLY WARNING: 6.4 MILLION HOMES AND 340 FLIGHTS WEATHER G5 STORM',
      },
      causeBridge: {
        vi: 'Nhờ bộ xử lý chống bức xạ và nguồn pin dung lượng lớn, từ kế trên quỹ đạo tầm trung đã hoạt động xuyên suốt cơn bão proton và gửi bản tin cảnh báo đỏ về Trái Đất đúng hạn.',
        en: 'Thanks to radiation-hardened processors and resilient power, the orbital magnetometer monitored the proton deluge and beamed a red alert to Earth on schedule.',
      },
      paragraphs: {
        vi: [
          'Ngay khi đám mây plasma từ Mặt Trời quét qua quỹ đạo xa, trạm gác đã giải mã chính xác cường độ từ trường liên hành tinh và phát lệnh báo động toàn cầu trước 18 giờ. Các trung tâm điều độ điện lực kịp thời phân tải và đóng rơ-le bảo vệ toàn bộ 14 lưới điện quốc gia.',
          'Toàn bộ các hãng hàng không đã chuyển hướng 340 chuyến bay thương mại ra khỏi vùng cực trước khi bão từ chạm tầng điện ly, và 18 vệ tinh quỹ đạo thấp kịp gập cánh về chế độ an toàn.',
        ],
        en: [
          'As the solar plasma front swept past medium orbit, the observatory decoded interplanetary magnetic fields and sounded a global alert 18 hours in advance. Grid operators preemptively shed loads and tripped isolation relays across 14 national power grids.',
          'Airlines rerouted 340 polar flights before geomagnetic storming struck the upper atmosphere, while 18 low-Earth-orbit satellites feathered arrays safely into survival mode.',
        ],
      },
      metrics: [
        {
          label: { vi: 'LƯỚI ĐIỆN ĐƯỢC BẢO VỆ', en: 'POWER GRIDS SHIELDED' },
          value: '6.4M',
          sub: {
            vi: 'Không có trạm biến áp bị cháy, 210 bệnh viện duy trì điện lưới 100%',
            en: 'Zero transformers lost, 210 hospitals maintained uninterrupted power',
          },
        },
        {
          label: { vi: 'CHUYẾN BAY CHUYỂN HƯỚNG AN TOÀN', en: 'COMMERCIAL FLIGHTS REROUTED' },
          value: '340',
          sub: {
            vi: 'Không một máy bay nào bị kẹt trong vùng mất sóng vùng cực',
            en: 'Zero flights stranded in polar communications blackout',
          },
        },
        {
          label: { vi: 'TÀI SẢN CÔNG NGHỆ ĐƯỢC CỨU', en: 'ORBITAL ASSETS SAVED' },
          value: '$4.8B',
          sub: {
            vi: '18 vệ tinh viễn thông vào chế độ an toàn kịp thời',
            en: '18 telecom satellites transitioned safely to survival mode',
          },
        },
      ],
      moral: {
        vi: 'Đầu tư cho linh kiện chống bức xạ chuẩn không gian chính là mua bảo hiểm sinh mạng cho hàng triệu con người phụ thuộc vào điện lưới và bầu trời dưới mặt đất.',
        en: 'Investing in flight-proven radiation tolerance is insurance for millions of people who depend upon power grids and safe skies.',
      },
    },
  },

  'MP-SC04-GHG': {
    missionKey: 'ghg',
    levelTag: {
      vi: 'HỒ SƠ KHÍ HẬU & AN NINH LƯƠNG THỰC TOÀN CẦU',
      en: 'GLOBAL CLIMATE & FOOD SECURITY DOSSIER',
    },
    fail: {
      badge: {
        vi: 'THẢM HỌA KHÍ HẬU & MÙA MÀNG',
        en: 'CLIMATE & HARVEST CRISIS',
      },
      headline: {
        vi: 'BÓNG MA KHÍ METHANE: VẾT RÒ RỈ VÔ HÌNH ĐẨY 850.000 NÔNG DÂN VÀO ĐẠI HẠN',
        en: 'METHANE GHOST PLUMES: INVISIBLE LEAKS THROW 850,000 FARMERS INTO DROUGHT',
      },
      causeByFailure: {
        pointing: {
          vi: 'Quang phổ kế hồng ngoại đòi hỏi giữ hướng cực chuẩn nhưng bộ điều khiển tư thế thiếu độ chính xác làm vệt quét lệch hàng chục kilomet, biến toàn bộ dữ liệu phát thải thành nhiễu vô giá trị.',
          en: 'The infrared spectrometer required micro-radian pointing, but coarse attitude control smeared swath scans by tens of kilometers, turning plume data into useless noise.',
        },
        blur: {
          vi: 'Quang phổ kế hồng ngoại đòi hỏi giữ hướng cực chuẩn nhưng bộ điều khiển tư thế thiếu độ chính xác làm vệt quét lệch hàng chục kilomet, biến toàn bộ dữ liệu phát thải thành nhiễu vô giá trị.',
          en: 'The infrared spectrometer required micro-radian pointing, but coarse attitude control smeared swath scans by tens of kilometers, turning plume data into useless noise.',
        },
        power: {
          vi: 'Quang phổ kế công suất lớn rút cạn nguồn điện khi quét liên tục, làm vệ tinh sập nguồn ngay trên vùng công nghiệp trọng điểm.',
          en: 'The high-draw spectrometer drained battery reserves during continuous scanning, causing payload shutdown directly over industrial emitters.',
        },
        data: {
          vi: 'Khối lượng dữ liệu phổ khổng lồ bị ứ đọng trên tàu vì thiếu đường truyền băng thông cao, không thể gửi bản đồ phát thải về hội nghị khí hậu.',
          en: 'Massive hyperspectral data cubes clogged on-board storage without high-rate downlink, failing to deliver emission maps to climate authorities.',
        },
        inspection_fault: {
          vi: 'Lỗi lắp ráp bị bỏ sót từ khâu kiểm định làm lệch chuẩn ống kính quang phổ, khiến mọi dữ liệu đo khí nhà kính bị sai lệch hoàn toàn.',
          en: 'Assembly flaws missed during pre-flight inspection misaligned the optical boresight, completely corrupting greenhouse gas concentration measurements.',
        },
        launch: {
          vi: 'Sứ mệnh quan trắc khí nhà kính thất bại khiến hệ thống giám sát phát thải độc lập của nhân loại bị tê liệt.',
          en: 'Mission failure crippled humanity independent greenhouse gas monitoring infrastructure from orbit.',
        },
        default: {
          vi: 'Sứ mệnh quan trắc khí nhà kính thất bại khiến hệ thống giám sát phát thải độc lập của nhân loại bị tê liệt.',
          en: 'Mission failure crippled humanity independent greenhouse gas monitoring infrastructure from orbit.',
        },
      },
      paragraphs: {
        vi: [
          'Không có ảnh phổ định vị độ phân giải cao từ quỹ đạo đồng bộ Mặt Trời, các tổ hợp khai thác khí đốt và khu công nghiệp nặng tiếp tục xả trộm một lượng khổng lồ khí Methane không màu, không mùi vào bầu khí quyển mà không ai có bằng chứng pháp lý để buộc dừng lại.',
          'Hiệu ứng nhà kính tăng vọt cục bộ mạnh gấp 84 lần khí CO₂ đã kích hoạt chuỗi nắng nóng cực đoan và xâm nhập mặn kỷ lục vào mùa vụ kế tiếp, biến những cánh đồng trù phú thành đất nứt nẻ.',
        ],
        en: [
          'Without pinpoint hyperspectral imaging from sun-synchronous orbit, gas drilling complexes and heavy industrial corridors continued dumping massive plumes of odorless, colorless methane with zero accountability.',
          'A localized greenhouse surge over 80 times more potent than carbon dioxide triggered blistering heatwaves and historic saltwater intrusion, turning fertile delta farmlands into barren cracked earth.',
        ],
      },
      metrics: [
        {
          label: { vi: 'KHÍ METHANE RÒ RỈ VÔ HÌNH', en: 'UNCHECKED METHANE LEAKAGE' },
          value: '1.8M t',
          sub: {
            vi: 'Gây hiệu ứng giữ nhiệt tương đương 150 triệu tấn CO₂',
            en: 'Trapped heat equivalent to 150 million tons of carbon dioxide',
          },
        },
        {
          label: { vi: 'ĐỒNG BẰNG CANH TÁC HẠN MẶN', en: 'FARMLAND HIT BY SALINITY' },
          value: '2.3M ha',
          sub: {
            vi: 'Đất nông nghiệp ven biển mất khả năng canh tác do nhiệt độ cực đoan',
            en: 'Coastal agricultural plains ruined by heatwaves and salinity',
          },
        },
        {
          label: { vi: 'NÔNG DÂN MẤT TRẮNG MÙA VỤ', en: 'FARMERS FACING CROP LOSS' },
          value: '850.000',
          sub: {
            vi: 'Khủng hoảng lương thực khu vực và đứt gãy chuỗi cung ứng',
            en: 'Regional food crisis and agricultural supply breakdown',
          },
        },
      ],
      moral: {
        vi: 'Khí nhà kính vô hình trước mắt thường — nếu con mắt quang phổ trên quỹ đạo lệch đi chỉ một phần mười độ, những kẻ đầu độc bầu khí quyển sẽ thoát tội và người nông dân phải trả giá bằng những cánh đồng chết khát.',
        en: 'Greenhouse gases are invisible to the naked eye. If the orbital spectrometer wavers by a tenth of a degree, polluters walk free while farmers pay with parched fields.',
      },
    },
    ok: {
      badge: {
        vi: 'ĐỘT PHÁ MINH BẠCH KHÍ HẬU TOÀN CẦU',
        en: 'GLOBAL CLIMATE TRANSPARENCY TRIUMPH',
      },
      headline: {
        vi: 'BẰNG CHỨNG THÉP TỪ QUỸ ĐẠO: KHÓA CHẶT 27 SIÊU NGUỒN RÒ RỈ KHÍ METHANE',
        en: 'IRONCLAD EVIDENCE FROM ORBIT: 27 METHANE SUPER-EMITTERS SHUT DOWN',
      },
      causeBridge: {
        vi: 'Nhờ bộ điều khiển tư thế siêu chính xác, nguồn điện dồi dào và đường truyền quang học tốc độ cao, vệ tinh đã khóa mục tiêu ổn định suốt 20 giây mỗi lượt quét và gửi về bản đồ phổ sắc nét tới từng đường ống.',
        en: 'With ultra-precise attitude control, ample power, and high-bandwidth optical downlink, the spacecraft locked target for 20-second sweeps, transmitting crisp plume maps down to individual pipelines.',
      },
      paragraphs: {
        vi: [
          'Bản đồ phổ hồng ngoại từ độ cao 600 km đã chỉ đích danh 27 điểm siêu phát thải đang âm thầm rò rỉ khí Methane trên khắp các lục địa. Với tọa độ sai số dưới 50 mét không thể chối cãi, Ủy ban Khí hậu Quốc tế đã buộc các tập đoàn năng lượng khóa van và hàn kín đường ống ngay trong tháng đầu tiên.',
          'Lượng phát thải tương đương 150 triệu tấn CO₂ đã bị chặn đứng kịp thời, bảo vệ nguồn nước ngọt và sinh kế cho hàng triệu cư dân vùng đồng bằng nông nghiệp.',
        ],
        en: [
          'Orbital infrared spectrometry pinpointed 27 massive super-emitter leaks across continents. Armed with sub-50-meter coordinates, international environmental authorities compelled operators to seal ruptured pipelines within weeks.',
          'Emissions equal to 150 million tons of carbon dioxide were stopped in their tracks, safeguarding freshwater tables and family livelihoods across delta agriculture.',
        ],
      },
      metrics: [
        {
          label: { vi: 'KHÍ METHANE BỊ KHÓA CHẶT', en: 'METHANE EMISSIONS HALTED' },
          value: '1.8M t',
          sub: {
            vi: 'Ngăn chặn tương đương 150 triệu tấn CO₂ đi vào khí quyển',
            en: 'Prevented the greenhouse impact of 150 million tons of CO₂',
          },
        },
        {
          label: { vi: 'DIỆN TÍCH NÔNG NGHIỆP ĐƯỢC CỨU', en: 'ARABLE CROPLAND PRESERVED' },
          value: '2.3M ha',
          sub: {
            vi: 'Duy trì dữ liệu cảnh báo hạn mặn và bảo vệ cân bằng nhiệt',
            en: 'Preserved vital delta irrigation and crop yields',
          },
        },
        {
          label: { vi: 'NÔNG DÂN GIỮ VỮNG SINH KẾ', en: 'FARMERS SAFEGUARDED' },
          value: '850.000',
          sub: {
            vi: '27 siêu nguồn phát thải buộc phải khắc phục dưới sự giám sát vệ tinh',
            en: '27 super-emitters capped under continuous satellite surveillance',
          },
        },
      ],
      moral: {
        vi: 'Độ chính xác phần nghìn độ của kỹ sư không gian trên quỹ đạo chính là thước đo công lý dưới mặt đất — buộc mọi nguồn phát thải phải bước ra ánh sáng để bảo vệ tương lai của nhân loại.',
        en: 'Sub-arcsecond pointing by space engineers translates directly to justice on Earth — dragging polluters into daylight to secure humanity future.',
      },
    },
  },
};

function normalizeFailureKey(failureId, outcome) {
  const raw = String(failureId || outcome?.killer || outcome?.review_fail?.[0] || '').toLowerCase();
  if (!raw) return 'default';
  if (raw === 'structural_maxq' || raw === 'dv_shortfall' || raw === 'wrong_plane') return 'launch';
  return raw;
}

function resolveLangField(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field.map((item) => resolveLangField(item, lang));
  if (typeof field === 'object') {
    return lang === 'en' ? field.en || field.vi || '' : field.vi || field.en || '';
  }
  return String(field);
}

/**
 * Trả về nội dung storytelling cố định gắn với màn chơi và kết quả kỹ thuật.
 * Hỗ trợ cả 2 dạng gọi:
 * getHumanityImpact(missionId, { success, failureId, outcome, lang })
 * hoặc getHumanityImpact(missionId, success, failureId, outcome, lang)
 */
export function getHumanityImpact(missionId, options = {}, maybeLang) {
  let opts = {};
  let lang = 'vi';

  if (typeof options === 'boolean') {
    opts = { success: options, failureId: arguments[2], outcome: arguments[3] };
    lang = arguments[4] || 'vi';
  } else {
    opts = options || {};
    lang = opts.lang || maybeLang || 'vi';
  }

  const success = Boolean(opts.success);
  const entry = HUMANITY_STORIES[missionId] || HUMANITY_STORIES['MP-SC01-FIRST-EYES'];
  const branch = success ? entry.ok : entry.fail;
  const key = normalizeFailureKey(opts.failureId, opts.outcome);

  let rawCause = '';
  if (success) {
    rawCause = branch.causeBridge;
  } else {
    rawCause =
      branch.causeByFailure?.[key] ||
      branch.causeByFailure?.default ||
      branch.causeByFailure?.launch ||
      '';
  }

  const causeBridge = resolveLangField(rawCause, lang);
  const paragraphs = (resolveLangField(branch.paragraphs, lang) || []);
  const metrics = (branch.metrics || []).map((m) => ({
    label: resolveLangField(m.label, lang),
    value: m.value,
    sub: resolveLangField(m.sub, lang),
  }));

  return {
    missionId: missionId || 'MP-SC01-FIRST-EYES',
    missionKey: entry.missionKey,
    levelTag: resolveLangField(entry.levelTag, lang),
    success,
    badge: resolveLangField(branch.badge, lang),
    headline: resolveLangField(branch.headline, lang),
    causeBridge,
    paragraphs: Array.isArray(paragraphs) ? paragraphs : [paragraphs],
    metrics,
    moral: resolveLangField(branch.moral, lang),
  };
}
