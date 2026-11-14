/**
 * Kich ban hoi thoai (vai dien nhu anh concept): Ky su truong (nguoi choi) <-> Sep Ke Toan (Director Penny-Pincher).
 * Moi canh = danh sach cau thoai { who: 'boss' | 'eng', text }. Bien {x} duoc thay luc chay.
 *
 * Nguyen tac: Sep KHONG BAO GIO noi thiet ke dung hay sai. Truoc khi bay chi co ap luc (tien, han chot).
 * Bai hoc ky thuat chi duoc noi ra SAU khi hau qua da xay ra (va lay tu ho so nguyen nhan cua backend).
 */

export const CAST = {
  eng: { name: 'KỸ SƯ TRƯỞNG', side: 'left' },
  boss: { name: 'SẾP KẾ TOÁN', side: 'right' },
};

const INTRO = {
  'MP-SC01-FIRST-EYES': [
    { who: 'boss', text: 'Mùa cháy rừng sắp tới, bên cứu hộ cần ảnh từ trên trời làm bằng chứng. Ngân sách chỉ có {budget} triệu đô thôi nhé.' },
    { who: 'eng', text: 'Một CubeSat có thể làm được. Nhưng nó phải sống đủ lâu, chụp đúng chỗ và gửi được ảnh về.' },
    { who: 'boss', text: 'Bức xạ gì chứ, trên đó toàn khoảng không! Cứ lắp chip tồn kho giá rẻ mà phóng cho tôi. Xong việc quý này tôi thưởng!' },
    { who: 'eng', text: '(Mình là người ký duyệt kỹ thuật. Sếp không cần biết vì sao — chỉ cần biết nó chạy được.)' },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'boss', text: 'Trạm gác thời tiết không gian. Quỹ đạo xa, đắt, tôi biết. {budget} triệu là hết mức.' },
    { who: 'eng', text: 'Ở quỹ đạo đó vệ tinh bị bắn phá bởi hạt năng lượng cao suốt nhiều năm liền.' },
    { who: 'boss', text: 'Thì chọn cái máy tính rẻ nhất, hỏng thì phóng cái khác. Hạn chót {deadline} tháng, không lùi.' },
  ],
  'MP-SC04-GHG': [
    { who: 'boss', text: 'Giám sát khí nhà kính, dự án được báo chí để ý. Có {budget} triệu đô, đừng để tôi mất mặt.' },
    { who: 'eng', text: 'Đo khí nhà kính cần thiết bị rất nhạy và vệ tinh phải giữ hướng cực chuẩn.' },
    { who: 'boss', text: 'Tôi không hiểu mấy chuyện độ với chả phút. Tôi chỉ hiểu hạn chót {deadline} tháng.' },
  ],
};

export const SCENES = {
  intro: (ctx) => INTRO[ctx.mission] || [
    { who: 'boss', text: 'Dự án mới, ngân sách {budget} triệu, hạn {deadline} tháng. Làm đi.' },
    { who: 'eng', text: 'Rõ. Tôi sẽ tự chịu trách nhiệm thiết kế.' },
  ],
  prelaunch: () => [
    { who: 'boss', text: 'Đã lắp xong rồi chứ? Báo chí đang chờ ngoài cổng. Phóng đi!' },
    { who: 'eng', text: 'Từ giây phút này, không ai sửa được gì nữa.' },
  ],
  launch_fail: (ctx) => [
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
  review_ok: (ctx) => [
    { who: 'eng', text: 'Đã có {evidence} ảnh cháy rừng rõ nét về tới trạm mặt đất. Bên cứu hộ đã nhận bằng chứng.' },
    { who: 'boss', text: 'Tốt! Báo chí sẽ thích cái này. Tôi biết mà, cứ tiết kiệm là được.' },
    { who: 'eng', text: '(Không phải nhờ tiết kiệm. Nhưng thôi, để sổ tay ghi lại.)' },
  ],
  review_fail: (ctx) => [
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
  return text.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? String(ctx[k]) : `{${k}}`));
}
