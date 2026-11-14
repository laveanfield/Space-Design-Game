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

const LAUNCH_FAIL_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    { who: 'boss', text: 'Cái gì vừa nổ ngoài kia vậy?! {cost} triệu đô tiền cứu hỏa rừng bốc cháy ngay trên trời!' },
    { who: 'eng', text: 'Báo cáo: {failure}. Không đưa được vệ tinh lên quỹ đạo nghĩa là 142.000 ha rừng mùa khô năm nay không có mắt thần cảnh báo.' },
    { who: 'boss', text: 'Hồ sơ thì giữ lấy. Uy tín của anh với tôi còn {rep} vạch — lo sửa ngay đi!' },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'boss', text: '{cost} triệu đô rơi thẳng xuống biển! Tôi vừa hứa với truyền thông về trạm gác bão Mặt Trời xong!' },
    { who: 'eng', text: 'Báo cáo: {failure}. Nếu không có vệ tinh này ở MEO, 6,4 triệu hộ dân và 340 chuyến bay vùng cực sẽ hoàn toàn mù thông tin trước bão từ G5.' },
    { who: 'boss', text: 'Tôi không muốn nghe con số dân sinh nữa. Uy tín của anh còn {rep} vạch!' },
  ],
  'MP-SC04-GHG': [
    { who: 'boss', text: 'Lại mất {cost} triệu đô trên bệ phóng! Hội nghị khí hậu quốc tế đang dí sát sau lưng tôi kia kìa!' },
    { who: 'eng', text: 'Báo cáo: {failure}. Vệ tinh đo khí Methane chưa lên được SSO-600 — 850.000 nông dân vùng hạn mặn vẫn chưa có bằng chứng truy vết nguồn xả.' },
    { who: 'boss', text: 'Sửa ngay chiếc khác đi. Uy tín của anh chỉ còn {rep} vạch thôi đấy!' },
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
    { who: 'boss', text: 'Tôi... tôi cắt ngân sách thật nhưng lỗi ở anh chứ? Uy tín của anh còn {rep} vạch. Mở hồ sơ ra tôi xem!' },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'boss', text: 'Đưa trạm lên tận MEO rồi mà sao bão Mặt Trời đánh sập nửa lưới điện Bắc Bán Cầu vẫn không thấy báo động?!' },
    { who: 'eng', text: 'Nguyên nhân gốc: {failure}. Hạt năng lượng cao đánh thủng chip giá rẻ mà sếp ép dùng: 6,4 triệu hộ mất điện giữa mùa đông và 340 chuyến bay vùng cực mù sóng GPS.' },
    { who: 'boss', text: 'Đừng đổ hết lên đầu tôi! Uy tín còn {rep} vạch — đưa bằng chứng kỹ thuật lên bàn ngay!' },
  ],
  'MP-SC04-GHG': [
    { who: 'boss', text: 'Hội đồng Khí hậu vừa bác bỏ toàn bộ tập dữ liệu của ta! Hàng chục triệu đô đổ xuống biển hết rồi!' },
    { who: 'eng', text: 'Nguyên nhân gốc: {failure}. Chúng ta bỏ lọt 1,8 triệu tấn khí Methane vô hình, đẩy 2,3 triệu ha đồng bằng vào hạn mặn và 850.000 nông dân mất trắng mùa vụ.' },
    { who: 'boss', text: 'Đừng dọa tôi bằng mấy con số nông nghiệp đó! Uy tín còn {rep} vạch — trình báo cáo chất vấn đi!' },
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
  return text.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? String(ctx[k]) : `{${k}}`));
}
