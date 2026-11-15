export const LANG_KEY = 'smdg.lang.v1';

export function readLang() {
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    return v === 'vi' ? 'vi' : 'en';
  } catch {
    return 'en';
  }
}

export function tr(lang, viText, enText) {
  return lang === 'en' ? enText : viText;
}

export function tx(value, lang = 'en') {
  if (value == null) return '';
  if (typeof value === 'object') {
    return lang === 'en' ? value.en || value.vi || '' : value.vi || value.en || '';
  }
  return String(value);
}

const LOGBOOK_PAIRS = [
  [
    'CHẾT MÁY TÍNH VÌ BỨC XẠ (SEU / LATCH-UP)',
    'CHẾT MÁY TÍNH VÌ BỨC XẠ',
    'COMPUTER KILLED BY RADIATION',
    'COMPUTER KILLED BY RADIATION (SEU / LATCH-UP)',
  ],
  [
    'Biên dự trữ bức xạ phải tính cho cả vòng đời và cả bão Mặt Trời, không chỉ ngày đầu.',
    'Radiation margin must cover the whole life and solar storms, not day one.',
  ],
  [
    'SẬP NGUỒN TRONG VÙNG TỐI (BROWN-OUT)',
    'SẬP NGUỒN TRONG VÙNG TỐI',
    'POWER BROWN-OUT IN ECLIPSE',
  ],
  [
    'Điện phải đủ cho cả lúc Trái Đất che Mặt Trời, và còn dư khi pin, tấm pin già đi.',
    'Power must cover eclipse and still have margin as cells and battery age.',
  ],
  ['RƠI QUỸ ĐẠO, CHÁY TRONG KHÍ QUYỂN', 'ORBIT DECAY, RE-ENTRY'],
  [
    'Quỹ đạo càng thấp, lực cản khí quyển càng kéo vệ tinh xuống nhanh.',
    'The lower the orbit, the faster drag pulls the satellite down.',
  ],
  [
    'DỮ LIỆU NGHẼN: CHỤP ĐƯỢC NHƯNG KHÔNG GỬI VỀ KỊP',
    'DATA BOTTLENECK: CAPTURED BUT NEVER DOWNLINKED',
  ],
  [
    'Thiết bị sinh dữ liệu bao nhiêu thì đường truyền mỗi ngày phải gửi về được bấy nhiêu.',
    'The link must carry per day what the instruments produce per day.',
  ],
  ['ẢNH NHÒE: CHỈ HƯỚNG KHÔNG ĐỦ CHÍNH XÁC', 'BLURRED DATA: POINTING NOT ACCURATE ENOUGH'],
  [
    'Thiết bị càng tinh thì hệ điều khiển tư thế càng phải giữ hướng chính xác.',
    'The finer the instrument, the tighter the attitude control must hold.',
  ],
  ['KHÔNG ĐẠT MỤC TIÊU KHOA HỌC', 'SCIENCE GOAL NOT MET'],
  [
    'Thiết bị phải đủ năng lực cho đúng câu hỏi khoa học của nhiệm vụ.',
    "The instruments must be capable of answering the mission's science question.",
  ],
  ['SAI QUỸ ĐẠO NHIỆM VỤ', 'WRONG MISSION ORBIT'],
  [
    'Quỹ đạo quyết định vệ tinh nhìn thấy gì và bao lâu một lần.',
    'The orbit decides what the satellite sees and how often.',
  ],
  ['VƯỢT NGÂN SÁCH', 'OVER BUDGET'],
  [
    'Sếp không quyết toán phần vượt: uy tín của bạn trả giá.',
    'The Director will not sign off the overrun.',
  ],
  ['TRỄ TIẾN ĐỘ', 'BEHIND SCHEDULE'],
  ['Linh kiện đặt lâu kéo cả dự án trễ hạn.', 'Long-lead parts push the whole project late.'],
  ['GÃY KHUNG VỆ TINH TẠI MAX-Q', 'PAYLOAD STRUCTURAL FAILURE AT MAX-Q'],
  [
    'Tổng khối lượng linh kiện vượt sức chịu của khung vệ tinh. Ở Max-Q (áp suất động lớn nhất) khung gãy, tải trọng va vào fairing, tên lửa mất cân bằng và hệ thống an toàn bãi phóng phải hủy chuyến bay.',
    'Tổng khối lượng linh kiện vượt sức chịu của khung vệ tinh. Ở Max-Q khung gãy, tải trọng va vào fairing, tên lửa mất cân bằng và hệ thống an toàn bãi phóng phải hủy chuyến bay.',
    'The parts outweigh what the bus structure can carry. At Max-Q the frame fails, the payload hits the fairing, the vehicle goes unstable and range safety terminates the flight.',
  ],
  ['KHÔNG VÀO ĐƯỢC MẶT PHẲNG QUỸ ĐẠO', 'TARGET ORBIT PLANE NOT REACHABLE'],
  [
    'Từ bãi phóng này không thể phóng trực tiếp vào quỹ đạo có độ nghiêng nhỏ hơn vĩ độ của bãi. Tầng trên cháy hết nhiên liệu ở sai mặt phẳng, vệ tinh trôi mất khỏi vùng nhiệm vụ.',
    'A launch site cannot inject directly into an inclination below its own latitude. The upper stage burns out in the wrong plane and the satellite is lost to the mission.',
  ],
  ['HỤT VẬN TỐC, RƠI LẠI KHÍ QUYỂN', 'VELOCITY SHORTFALL, RE-ENTRY BREAKUP'],
  [
    'Tên lửa cháy hết nhiên liệu khi chưa đủ vận tốc quỹ đạo: tải quá nặng hoặc quỹ đạo quá cao so với sức đẩy. Cả tầng trên lẫn vệ tinh rơi lại và vỡ tan khi vào khí quyển.',
    'The vehicle runs dry before orbital velocity: too much payload or too high an orbit for this rocket. Upper stage and satellite fall back and break up on re-entry.',
  ],
  [
    'Hãy dùng đèn X-Ray soi kỹ toàn bộ vệ tinh và tên lửa trước khi cho phép phóng.',
    'Scan the full vehicle carefully during Pre-Flight Inspection.',
  ],
  [
    'Hoàn thành nhiệm vụ, nhưng vượt trần Sếp giao',
    'Mission complete, but exceeded constraints',
  ],
  ['Nhiệm vụ hoàn thành trọn vẹn', 'Mission accomplished'],
  ['Nhiệm vụ thất bại', 'Mission failed'],
  ['Mất tên lửa', 'Rocket loss'],
];

function stripParenTags(s) {
  return String(s || '')
    .replace(/\s*\((?:SEU\s*\/\s*LATCH-UP|SEU|LATCH-UP|BROWN-OUT|áp suất động lớn nhất)\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const LOGBOOK_TRANSLATIONS = (() => {
  const map = new Map();
  for (const group of LOGBOOK_PAIRS) {
    const vi = stripParenTags(group[0]);
    const en = stripParenTags(group[group.length - 1]);
    // For pairs without parens cleanly match last as EN, first as VI; special handling when 4 forms exist:
    const viClean = group.length >= 3 ? stripParenTags(group[1]) : vi;
    const enClean =
      group[0] === 'CHẾT MÁY TÍNH VÌ BỨC XẠ (SEU / LATCH-UP)'
        ? group[2]
        : group.length >= 3
          ? group[group.length - 1]
          : group[1];
    const target = { vi: viClean, en: stripParenTags(enClean) };
    for (const variant of group) {
      map.set(variant, target);
      map.set(stripParenTags(variant), target);
    }
  }
  return map;
})();

export function localizeLogText(value, lang = 'vi') {
  if (value == null) return '';
  if (typeof value === 'object') {
    const picked = lang === 'en' ? value.en || value.vi || '' : value.vi || value.en || '';
    const mapped = LOGBOOK_TRANSLATIONS.get(String(picked).trim());
    return mapped ? mapped[lang === 'en' ? 'en' : 'vi'] : stripParenTags(picked);
  }
  const raw = String(value).trim();
  const mapped = LOGBOOK_TRANSLATIONS.get(raw) || LOGBOOK_TRANSLATIONS.get(stripParenTags(raw));
  if (mapped) return mapped[lang === 'en' ? 'en' : 'vi'];

  if (raw.startsWith('HỎNG TRÊN QUỸ ĐẠO DO SÓT LỖI ')) {
    const suffix = raw.slice('HỎNG TRÊN QUỸ ĐẠO DO SÓT LỖI '.length);
    return lang === 'en' ? `ORBIT FAILURE: MISSED ${suffix}` : raw;
  }
  if (raw.startsWith('ORBIT FAILURE: MISSED ')) {
    const suffix = raw.slice('ORBIT FAILURE: MISSED '.length);
    return lang === 'en' ? raw : `HỎNG TRÊN QUỸ ĐẠO DO SÓT LỖI ${suffix}`;
  }
  return stripParenTags(raw);
}
