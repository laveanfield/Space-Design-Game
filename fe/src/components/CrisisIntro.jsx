import React, { useEffect, useState } from 'react';
import { playSoundAsset } from '../api/client';
import { tr, tx } from '../core/i18n';

export const MISSION_BRIEFING_SPECS = {
  'MP-SC01-FIRST-EYES': {
    id: 'MP-SC01-FIRST-EYES',
    code: 'MISSION DOSSIER // MP-SC01-FIRST-EYES',
    title: {
      vi: 'Đôi Mắt Đầu Tiên Nhìn Lại Trái Đất',
      en: 'The First Eyes Looking Back at Earth',
    },
    subtitle: {
      vi: 'Vệ tinh Trinh sát Khẩn cấp Cháy rừng',
      en: 'Wildfire Emergency Reconnaissance Satellite',
    },
    context: {
      vi: 'Một tổ hợp cháy rừng quy mô lớn chưa từng có đang bùng phát và càn quét dữ dội qua các hành lang rừng trọng yếu. Khói dày đặc và địa hình hiểm trở đã làm tê liệt hoàn toàn các trạm quan sát mặt đất lẫn máy bay trinh sát. Bộ Chỉ huy Khẩn cấp cần ảnh vệ tinh từ quỹ đạo Trái Đất thấp ngay lập tức để lập bản đồ các mặt trận lửa và điều phối lực lượng cứu hộ.',
      en: 'An unprecedented, massive wildfire complex is erupting across wide forest corridors. Thick smoke plumes and rugged terrain have completely paralyzed ground lookout stations and aerial reconnaissance. Emergency Command urgently needs orbital imagery from low Earth orbit to map fire fronts and dispatch rescue crews.',
    },
    targetOrbit: {
      vi: 'Quỹ đạo Trái Đất Thấp LEO 400 km (ORB-LEO-400) hoặc Quỹ đạo Đồng bộ Mặt Trời SSO 550 km (ORB-SSO-550)',
      en: 'Low Earth Orbit LEO 400 km (ORB-LEO-400) or Sun-Synchronous Orbit SSO 550 km (ORB-SSO-550)',
    },
    primaryObjective: {
      vi: 'Thiết kế, phóng và vận hành một vệ tinh quan sát Trái Đất CubeSat để tự động chụp ảnh cháy rừng và truyền tải thành công tối thiểu 3 khung hình rõ nét về các trạm mặt đất trong vòng đời nhiệm vụ.',
      en: 'Design, launch, and operate a CubeSat Earth-observation spacecraft to automatically capture wildfire imagery and successfully downlink at least 3 clear frames to ground stations within mission lifetime.',
    },
    payloadCapabilities: {
      vi: 'Máy ảnh Đa phổ Cơ bản INS-01, hệ thống điều khiển tư thế bánh đà phản ứng 3 trục ADCS-WHEEL (giúp giữ hướng sắc nét, chống nhòe ảnh), và tấm pin mặt trời bung mở PWR-SA-DEP để đảm bảo cân bằng năng lượng dương.',
      en: 'Basic Multispectral Imager INS-01, 3-axis reaction wheel attitude control ADCS-WHEEL (for sharp, blur-free pointing), and deployable solar array PWR-SA-DEP for positive power balance.',
    },
    observationReqs: {
      vi: 'Quét qua các hành lang mục tiêu cháy rừng ven biển/rừng núi (target_set: coast), giữ sai số chỉ hướng thấp để tránh nhòe chuyển động và thu thập tối thiểu 3 khung hình hợp lệ.',
      en: 'Sweep across coastal/forest fire target corridors (target_set: coast), keep pointing error low to prevent motion blur, and collect at least 3 valid frames.',
    },
    commReqs: {
      vi: 'Bộ nhớ máy tính bay trên tàu (OBC-CUBE) lưu giữ ảnh bằng cơ chế đệm Lưu-và-Chuyển tiếp (Store-and-Forward), kết hợp với bộ phát băng tần S (COM-S-CUBE) đủ năng lực truyền 100% số khung hình đã chụp trong các cửa sổ nhìn thấy thẳng (LOS) với trạm mặt đất.',
      en: 'Onboard flight computer storage (OBC-CUBE) retains imagery using Store-and-Forward buffering, paired with an S-Band transmitter (COM-S-CUBE) capable of transferring 100% of captured frames during ground station Line-of-Sight (LOS) windows.',
    },
    constraintsText: {
      vi: 'Ngân sách tối đa $18M | Hạn chế tạo 12 tháng | Tuổi thọ nhiệm vụ tối thiểu 1 năm (12 mốc quỹ đạo)',
      en: 'Max Budget $18M | Build Deadline 12 months | Minimum Mission Life 1 year (12 orbital epochs)',
    },
    successCriteria: [
      {
        vi: 'Thực hiện quỹ đạo bay lên theo đường cong trọng lực (gravity-turn) chuẩn xác và đưa tàu vào quỹ đạo LEO hợp lệ.',
        en: 'Execute a proper gravity-turn ascent and inject the spacecraft into a valid LEO orbit.',
      },
      {
        vi: 'Sống sót qua các chu kỳ năng lượng và nhiệt độ trên quỹ đạo trong toàn bộ các mốc vận hành.',
        en: 'Survive orbital power and thermal cycles across all operational epochs.',
      },
      {
        vi: 'Chụp và lưu trữ ít nhất 3 khung hình bằng chứng cháy rừng rõ nét vào bộ nhớ trên tàu.',
        en: 'Capture at least 3 clear wildfire evidence frames into onboard storage.',
      },
      {
        vi: 'Thiết lập liên kết với trạm mặt đất và hoàn tất truyền tải 100% tối thiểu 3 khung hình bằng chứng.',
        en: 'Establish ground station link and complete 100% downlink delivery of at least 3 evidence frames.',
      },
    ],
  },
  'MP-SC03-SPACE-WEATHER': {
    id: 'MP-SC03-SPACE-WEATHER',
    code: 'MISSION DOSSIER // MP-SC03-SPACE-WEATHER',
    title: {
      vi: 'Vệ Tinh Canh Gác Thời Tiết Vũ Trụ',
      en: 'Space Weather Sentinel',
    },
    subtitle: {
      vi: 'Cảnh báo Sớm Từ quyển & Vành đai Bức xạ',
      en: 'Magnetosphere & Radiation Belt Early Warning',
    },
    context: {
      vi: 'Hoạt động phun trào khối lượng nhật hoa (CME) của Mặt Trời đang tăng mạnh, đe dọa lưới điện cao thế, định thời dẫn đường GPS và các hành lang hàng không vùng cực. Bộ Chỉ huy Thời tiết Vũ trụ cần một tàu vũ trụ chống chịu bức xạ hoạt động trực tiếp bên trong các vành đai bức xạ để cảnh báo sớm.',
      en: 'Solar coronal mass ejection (CME) activity is surging, threatening high-voltage power grids, GPS navigation timing, and polar aviation corridors. Space Weather Command requires a hardened spacecraft operating directly inside the radiation belts for early warning.',
    },
    targetOrbit: {
      vi: 'Quỹ đạo Trái Đất Trung bình MEO 20.200 km (ORB-MEO-20200) đi xuyên qua các vành đai bức xạ Van Allen',
      en: 'Medium Earth Orbit MEO 20,200 km (ORB-MEO-20200) traversing the Van Allen radiation belts',
    },
    primaryObjective: {
      vi: 'Duy trì hoạt động liên tục của từ kế và cảm biến hạt năng lượng cao trong môi trường bức xạ cường độ lớn, vượt qua bão Mặt Trời và truyền tải tối thiểu 3 bộ quan sát khoa học rõ ràng.',
      en: 'Maintain continuous magnetometer and high-energy particle sensor operations inside intense radiation, survive solar storms, and downlink at least 3 clear science observations.',
    },
    payloadCapabilities: {
      vi: 'Từ kế & Cảm biến Bức xạ INS-08, khung tàu bọc chắn BUS-ESPA, máy tính bay chống bức xạ OBC-RADHARD (bắt buộc để sống sót qua lỗi đảo bit SEU ở MEO), pin BAT-L và tấm pin mặt trời PWR-SA-SMALL.',
      en: 'Magnetometer & Radiation Sensor INS-08, shielded BUS-ESPA spacecraft bus, radiation-hardened flight computer OBC-RADHARD (required to survive MEO Single Event Upsets), BAT-L battery, and PWR-SA-SMALL solar array.',
    },
    observationReqs: {
      vi: 'Thu thập tối thiểu 3 bộ dữ liệu từ trường và thông lượng hạt hợp lệ khi bay qua vùng đỉnh bức xạ mà không bị sập nguồn hay treo máy tính.',
      en: 'Collect at least 3 validated magnetic-field and particle-flux datasets while traversing peak radiation zones without power collapse or computer lockups.',
    },
    commReqs: {
      vi: 'Lưu trữ dữ liệu quan sát trong bộ nhớ OBC-RADHARD và sử dụng phần cứng truyền thông COM-S-CUBE trở lên để hoàn tất truyền tải 100% 3 khung bằng chứng từ cự ly MEO 20.200 km.',
      en: 'Store observations in OBC-RADHARD memory and use COM-S-CUBE or higher communications hardware to complete 100% downlink of 3 evidence frames from MEO 20,200 km range.',
    },
    constraintsText: {
      vi: 'Ngân sách tối đa $95M | Hạn chế tạo 24 tháng | Bắt buộc Chống Bức Xạ',
      en: 'Max Budget $95M | Build Deadline 24 months | Mandatory Radiation Hardening',
    },
    successCriteria: [
      {
        vi: 'Phóng và đưa tàu vũ trụ vào chính xác Quỹ đạo Trái Đất Trung bình MEO 20.200 km.',
        en: 'Launch and inject the spacecraft accurately into Medium Earth Orbit MEO 20,200 km.',
      },
      {
        vi: 'Chịu được tổng liều ion hóa tích lũy (TID) và sự cố bão Mặt Trời mà không làm mất tàu.',
        en: 'Withstand cumulative Total Ionizing Dose (TID) and solar storm upsets without losing the spacecraft.',
      },
      {
        vi: 'Thu thập và lưu trữ tối thiểu 3 bộ dữ liệu khoa học thời tiết vũ trụ hợp lệ.',
        en: 'Capture and store at least 3 valid space weather science datasets.',
      },
      {
        vi: 'Truyền tải thành công 100% tối thiểu 3 bộ dữ liệu quan sát từ MEO về trung tâm mặt đất.',
        en: 'Successfully downlink 100% of at least 3 observation datasets from MEO to ground control.',
      },
    ],
  },
  'MP-SC04-GHG': {
    id: 'MP-SC04-GHG',
    code: 'MISSION DOSSIER // MP-SC04-GHG',
    title: {
      vi: 'Vệ Tinh Giám Sát Khí Nhà Kính',
      en: 'Greenhouse Gas Monitor',
    },
    subtitle: {
      vi: 'Phổ Kế Chùm Khí CH4 / CO2 Độ Chính Xác Cao',
      en: 'High-Precision CH4 / CO2 Plume Spectrometer',
    },
    context: {
      vi: 'Các nguồn siêu phát thải khí mê-tan (CH4) và carbon dioxide (CO2) công nghiệp quy mô lớn cùng các điểm rò rỉ đường ống cần được định vị chính xác từ quỹ đạo để bịt kín kịp thời và bảo vệ các vùng nông nghiệp trọng yếu.',
      en: 'Major industrial methane (CH4) and carbon dioxide (CO2) super-emitters and pipeline leaks must be pinpointed accurately from orbit to seal leaks rapidly and protect critical agricultural zones.',
    },
    targetOrbit: {
      vi: 'Quỹ đạo Đồng bộ Mặt Trời SSO 600 km (ORB-SSO-600) đảm bảo góc chiếu sáng Mặt Trời ổn định (>25 độ)',
      en: 'Sun-Synchronous Orbit SSO 600 km (ORB-SSO-600) providing consistent solar illumination angle (>25 deg)',
    },
    primaryObjective: {
      vi: 'Vận hành phổ kế khí nhà kính SWIR độ nhạy cao tại SSO, duy trì ổn định bám mục tiêu siêu chính xác trong 20 giây trên các điểm nóng phát thải và truyền các bộ dữ liệu phổ dung lượng lớn về Trái Đất.',
      en: 'Operate a high-sensitivity SWIR greenhouse gas spectrometer in SSO, maintain ultra-fine 20-second target dwell stability over emission hotspots, and downlink large spectral datasets to Earth.',
    },
    payloadCapabilities: {
      vi: 'Phổ kế Khí nhà kính INS-04 (khối lượng & công suất tiêu thụ lớn), hệ thống điều khiển tư thế chính xác bằng cảm biến sao ADCS-FINE, tấm pin lớn PWR-SA-LARGE + pin BAT-L trên khung tàu hạng nặng BUS-SMALL500.',
      en: 'Greenhouse Gas Spectrometer INS-04 (high mass & power draw), Star-Tracker fine attitude control ADCS-FINE, large solar array PWR-SA-LARGE + BAT-L on heavy BUS-SMALL500 bus.',
    },
    observationReqs: {
      vi: 'Giữ vững hướng bám mục tiêu liên tục 20 giây qua các điểm nóng phát thải (target_set: ghg_hotspots) ở góc cao Mặt Trời >= 25 độ, thu thập tối thiểu 3 ảnh phổ hấp thụ CH4/CO2 sắc nét.',
      en: 'Hold steady 20-second dwell pointing over emission hotspots (target_set: ghg_hotspots) at solar elevation >= 25 deg, capturing at least 3 sharp CH4/CO2 absorption spectra.',
    },
    commReqs: {
      vi: 'Dữ liệu phổ kế đòi hỏi bộ nhớ và băng thông lớn: kết hợp bộ nhớ bay OBC-SPACE với đường truyền tốc độ cao quang học/băng tần X (COM-OPT-LEO hoặc tương đương) để truyền 100% 3 khung phổ về trạm mặt đất.',
      en: 'Spectrometer datasets require high storage & bandwidth: pair OBC-SPACE flight memory with a high-rate optical/X-Band downlink (COM-OPT-LEO or equivalent) to transfer 100% of 3 spectral frames to ground stations.',
    },
    constraintsText: {
      vi: 'Ngân sách tối đa $180M | Hạn chế tạo 36 tháng | Yêu cầu Chỉ hướng Tinh & Biên Công suất Lớn',
      en: 'Max Budget $180M | Build Deadline 36 months | Requires Fine Pointing & High Power Margin',
    },
    successCriteria: [
      {
        vi: 'Đưa tàu vũ trụ mang phổ kế hạng nặng vào Quỹ đạo Đồng bộ Mặt Trời SSO 600 km an toàn.',
        en: 'Deliver the heavy spectrometer spacecraft cleanly into Sun-Synchronous Orbit SSO 600 km.',
      },
      {
        vi: 'Duy trì cân bằng năng lượng quỹ đạo dương cho phổ kế INS-04 và ADCS-FINE.',
        en: 'Maintain positive orbital power balance for INS-04 spectrometer and ADCS-FINE.',
      },
      {
        vi: 'Thu thập tối thiểu 3 khung phổ khí nhà kính sắc nét tại các điểm nóng phát thải.',
        en: 'Capture at least 3 sharp greenhouse gas spectral frames over hotspot sites.',
      },
      {
        vi: 'Hoàn tất truyền tải 100% tối thiểu 3 khung phổ bằng chứng về Trái Đất.',
        en: 'Complete 100% downlink delivery of at least 3 spectral evidence frames to Earth.',
      },
    ],
  },
};

export function getMissionBriefingSpec(missionId, missionDetail = null, scenario = null, lang = 'en') {
  const id = missionId || missionDetail?.id || 'MP-SC01-FIRST-EYES';
  const base = MISSION_BRIEFING_SPECS[id] || MISSION_BRIEFING_SPECS['MP-SC01-FIRST-EYES'];
  const sc = scenario || missionDetail?.scenario || {};
  const allowedOrbits =
    Array.isArray(sc.allowed_orbit_ids) && sc.allowed_orbit_ids.length > 0
      ? sc.allowed_orbit_ids.join(', ')
      : null;
  const budget = sc.budget_musd ?? null;
  const deadline = sc.deadline_months ?? null;
  const minLife = missionDetail?.life_years ?? sc.min_mission_life_years ?? 1;
  const resolvedTitle = tx(missionDetail?.meta?.title, lang) || tx(base.title, lang);
  const baseTargetOrbit = tx(base.targetOrbit, lang);
  const allowedLabel = lang === 'vi' ? 'Cho phép' : 'Allowed';

  return {
    ...base,
    id,
    title: resolvedTitle,
    titleEn: resolvedTitle,
    subtitle: tx(base.subtitle, lang),
    context: tx(base.context, lang),
    targetOrbit: allowedOrbits ? `${baseTargetOrbit} [${allowedLabel}: ${allowedOrbits}]` : baseTargetOrbit,
    primaryObjective: tx(missionDetail?.objective?.statement, lang) || tx(base.primaryObjective, lang),
    payloadCapabilities: tx(base.payloadCapabilities, lang),
    observationReqs: tx(base.observationReqs, lang),
    commReqs: tx(base.commReqs, lang),
    constraintsText:
      budget != null && deadline != null
        ? lang === 'vi'
          ? `Ngân sách tối đa $${budget}M | Hạn chế tạo ${deadline} tháng | Tuổi thọ tối thiểu ${minLife} năm`
          : `Max Budget $${budget}M | Build Deadline ${deadline} months | Minimum Life ${minLife} yr`
        : tx(base.constraintsText, lang),
    successCriteria: (base.successCriteria || []).map((item) => tx(item, lang)),
  };
}

export function MissionBriefingDossier({ missionId, missionDetail, scenario, compact = false, lang = 'en' }) {
  const spec = getMissionBriefingSpec(missionId, missionDetail, scenario, lang);
  const [expanded, setExpanded] = useState(!compact);
  const isVi = lang === 'vi';

  return (
    <div
      className={`mission-dossier-sheet mission-letter ${compact ? 'compact' : ''} ${expanded ? 'is-expanded' : 'is-brief'}`}
      data-testid="mission-briefing-dossier"
    >
      <div className="mission-dossier-top">
        <div>
          <div className="mission-dossier-code">
            ✉ {isVi ? 'THƯ CHỈ THỊ NHIỆM VỤ' : 'OFFICIAL MISSION DISPATCH'} // {spec.id}
          </div>
          <h2 className="mission-dossier-title">{spec.title}</h2>
          <div className="mission-dossier-sub">{spec.subtitle}</div>
        </div>
        <span className="mission-letter-seal">{spec.id}</span>
      </div>

      <div className="mission-letter-brief">
        <div className="mission-dossier-label">
          {isVi ? '1. TÓM TẮT NHIỆM VỤ' : '1. MISSION BRIEF'}
        </div>
        <p>{spec.context}</p>
        {!expanded && (
          <p className="mission-letter-brief-goal">
            <strong>{isVi ? 'Mục tiêu chính:' : 'Primary Goal:'}</strong> {spec.primaryObjective}
          </p>
        )}
      </div>

      {expanded && (
        <div className="mission-dossier-grid" style={{ marginTop: 10 }}>
          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">
              {isVi ? '2. QUỸ ĐẠO MỤC TIÊU' : '2. TARGET ORBIT'}
            </div>
            <p>{spec.targetOrbit}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">
              {isVi ? '3. MỤC TIÊU KHOA HỌC CHÍNH' : '3. PRIMARY SCIENTIFIC OBJECTIVE'}
            </div>
            <p>{spec.primaryObjective}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">
              {isVi ? '4. YÊU CẦU TẢI TRỌNG & PHẦN CỨNG' : '4. PAYLOAD & HARDWARE REQUIREMENTS'}
            </div>
            <p>{spec.payloadCapabilities}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">
              {isVi ? '5. YÊU CẦU QUAN SÁT' : '5. OBSERVATION REQUIREMENTS'}
            </div>
            <p>{spec.observationReqs}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">
              {isVi ? '6. YÊU CẦU TRUYỀN THÔNG & TẢI DỮ LIỆU' : '6. COMMUNICATION & DOWNLINK REQUIREMENTS'}
            </div>
            <p>{spec.commReqs}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">
              {isVi ? '7. RÀNG BUỘC & TIẾN ĐỘ' : '7. CONSTRAINTS & SCHEDULE'}
            </div>
            <p>{spec.constraintsText}</p>
          </div>

          <div className="mission-dossier-cell full">
            <div className="mission-dossier-label">
              {isVi ? '8. TIÊU CHÍ THÀNH CÔNG NHIỆM VỤ' : '8. MISSION SUCCESS CRITERIA'}
            </div>
            <ul className="mission-dossier-list">
              {spec.successCriteria.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mission-letter-foot">
        <span className="mission-letter-sign">
          {isVi ? '— Ban Điều Hành Chuyến Bay' : '— Flight Operations Command'}
        </span>
        <button
          type="button"
          className="btn small mission-letter-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? isVi
              ? '▲ THU GỌN BỨC THƯ'
              : '▲ FOLD LETTER (BRIEF)'
            : isVi
              ? '📜 MỞ XEM CHI TIẾT NHIỆM VỤ'
              : '📜 OPEN FULL LETTER DETAILS'}
        </button>
      </div>
    </div>
  );
}

const MISSION_CHECKLIST_ITEMS = [
  {
    id: 'CHK-1',
    title: {
      vi: '1. KIẾN TRÚC TÀU VŨ TRỤ & TÊN LỬA ĐẨY [02.THIẾT KẾ]',
      en: '1. SPACECRAFT & LAUNCH ARCHITECTURE [02.BUILD]',
    },
    desc: {
      vi: 'Lắp ráp đủ 9 phân hệ tàu vũ trụ và tên lửa đẩy phù hợp với khối lượng tải trọng, năng lượng, bức xạ và ràng buộc quỹ đạo.',
      en: 'Assemble all 9 spacecraft and launch vehicle subsystems to match payload mass, power, radiation, and orbit constraints.',
    },
    alert: null,
  },
  {
    id: 'CHK-2',
    title: {
      vi: '2. KIỂM ĐỊNH PHẦN CỨNG TIỀN PHÓNG [03.KIỂM ĐỊNH]',
      en: '2. PRE-FLIGHT HARDWARE INSPECTION [03.INSPECT]',
    },
    desc: {
      vi: 'Thực hiện quét âm thanh rò rỉ khí, hàn sửa vết nứt qua X-Ray và hiệu chỉnh gương quang học trước khi đưa ra bệ phóng.',
      en: 'Perform audio leak scan, X-ray weld crack repair, and optical mirror calibration before moving to the launch pad.',
    },
    alert: null,
  },
  {
    id: 'CHK-3',
    title: {
      vi: '3. PHÓNG CONG TRỌNG LỰC & VÀO QUỸ ĐẠO [04.PHÓNG TÀU]',
      en: '3. GRAVITY-TURN ASCENT & ORBITAL INSERTION [04.LAUNCH]',
    },
    desc: {
      vi: 'Điều khiển tên lửa theo quỹ đạo cong trọng lực thực tế vượt qua Max-Q, tách tầng và đưa vào cận điểm quỹ đạo an toàn.',
      en: 'Guide the launch vehicle along a realistic curved gravity turn through max-Q, stage separation, and safe perigee injection.',
    },
    alert: null,
  },
  {
    id: 'CHK-4',
    title: {
      vi: '4. CHỤP ẢNH QUỸ ĐẠO & LƯU-CHUYỂN TIẾP [05.QUỸ ĐẠO]',
      en: '4. ORBITAL CAPTURE & STORE-AND-FORWARD OPS [05.ORBIT]',
    },
    desc: {
      vi: 'Theo dõi bộ nhớ trên tàu, quản lý chu kỳ pin, chụp ảnh mục tiêu rõ nét và truyền 100% bằng chứng yêu cầu về trạm mặt đất.',
      en: 'Monitor onboard storage, manage battery cycles, capture clear target imagery, and downlink 100% of required evidence to ground stations.',
    },
    alert: {
      vi: 'CẢNH BÁO: LÊN ĐƯỢC QUỸ ĐẠO CHỈ MỚI LÀ MỘT NỬA CHẶNG ĐƯỜNG — NHIỆM VỤ CHỈ THÀNH CÔNG KHI TOÀN BỘ BẰNG CHỨNG YÊU CẦU ĐƯỢC TRUYỀN VỀ TRẠM MẶT ĐẤT.',
      en: 'WARNING: REACHING ORBIT IS ONLY HALF THE MISSION — THE MISSION SUCCEEDS ONLY WHEN ALL REQUIRED EVIDENCE REACHES GROUND STATIONS.',
    },
  },
];

export default function CrisisIntro({
  missionId = 'MP-SC01-FIRST-EYES',
  missionDetail = null,
  scenario = null,
  phase = 'home',
  lang = 'en',
  audioOn,
  onComplete,
  onSkip,
}) {
  const effectiveMissionId = missionId || missionDetail?.id || 'MP-SC01-FIRST-EYES';
  const isWildfire = effectiveMissionId === 'MP-SC01-FIRST-EYES';
  const totalScenes = isWildfire ? 3 : 1;
  const [index, setIndex] = useState(0);
  const [checkedIds, setCheckedIds] = useState(() => ['CHK-1', 'CHK-2', 'CHK-3', 'CHK-4']);
  const isVi = lang === 'vi';

  useEffect(() => {
    setIndex(0);
  }, [effectiveMissionId]);

  const last = index >= totalScenes - 1;

  useEffect(() => {
    playSoundAsset(
      audioOn,
      isWildfire && index === 0 ? '08-11-2026-alarm.wav' : '06-11-2026-blip.wav',
      isWildfire && index === 0 ? 0.22 : 0.14
    );
  }, [audioOn, index, isWildfire]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onSkip?.();
      if (event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault();
        if (last) onComplete?.();
        else setIndex((value) => value + 1);
      }
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last, onComplete, onSkip]);

  const toggleCheckItem = (id) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div
      className={`crisis-intro ${isWildfire && index === 0 ? 'scene-desk' : 'scene-control'}`}
      role="dialog"
      aria-modal="true"
      aria-label={tr(lang, `Hồ sơ nhiệm vụ ${effectiveMissionId}`, `Mission Briefing ${effectiveMissionId}`)}
    >
      <div className="crisis-intro-backdrop" />

      {isWildfire && index === 0 && (
        <div className="desk-scene-stage">
          <div className="desk-lamp-glow" aria-hidden="true" />
          <div className="desk-coffee-ring" aria-hidden="true" />
          <div className="desk-pen" aria-hidden="true" />

          <article
            className="physical-newspaper"
            aria-label={tr(lang, 'Tờ báo khẩn cấp buổi sáng', 'Printed morning emergency newspaper')}
          >
            <div className="paper-fold-horizontal" aria-hidden="true" />
            <div className="paper-fold-vertical" aria-hidden="true" />

            <header className="paper-masthead">
              <div className="paper-ears">
                <span>{tr(lang, 'ẤN BẢN KHẨN CẤP BUỔI SÁNG', 'MORNING EMERGENCY EDITION')}</span>
                <span>{tr(lang, 'BÁO ĐỘNG ĐỎ TOÀN CẦU', 'GLOBAL RED ALERT')}</span>
                <span>{tr(lang, 'CÔNG ĐIỆN NỘI BỘ', 'INTERNAL DISPATCH')}</span>
              </div>
              <div className="paper-title">{tr(lang, 'NHẬT BÁO TOÀN CẦU', 'THE GLOBAL CHRONICLE')}</div>
              <div className="paper-subline">
                <span>{tr(lang, 'THỨ BẢY, 15 THÁNG 11, 2026', 'SATURDAY, NOVEMBER 15, 2026')}</span>
                <span>|</span>
                <span>{tr(lang, 'BẢN TIN KHÍ HẬU & KHẨN CẤP TOÀN CẦU', 'GLOBAL CLIMATE & EMERGENCY DISPATCH')}</span>
                <span>|</span>
                <span>{tr(lang, 'TRANG NHẤT', 'FRONT PAGE')}</span>
              </div>
            </header>

            <div className="paper-banner-kicker">
              <span>{tr(lang, 'TIN KHẨN CẤP', 'URGENT BULLETIN')}</span>
              <span>
                {tr(
                  lang,
                  'MẠNG LƯỚI QUAN TRẮC MẶT ĐẤT BỊ MÙ VÌ KHÓI DÀY ĐẶC',
                  'GROUND MONITORING NETWORKS BLINDED BY DENSE SMOKE'
                )}
              </span>
            </div>

            <h1 className="paper-main-headline">
              {tr(
                lang,
                'CHÁY RỪNG LỚN NHẤT TRONG HƠN 3 THẾ KỶ...',
                'LARGEST WILDFIRES IN OVER 3 CENTURIES...'
              )}
            </h1>
            <p className="paper-deck">
              {tr(
                lang,
                'Các mặt trận cháy rừng khổng lồ đang bùng phát dọc theo các dải rừng ven biển và vùng núi. Những cột khói dày đặc đã làm mù hoàn toàn máy bay trinh sát và các trạm quan sát mặt đất trên toàn bộ khu vực bị ảnh hưởng.',
                'Massive wildfire fronts are erupting across coastal and mountain timberlines. Heavy smoke plumes have blinded aerial spotters and ground lookout towers across the affected corridors.'
              )}
            </p>

            <div className="paper-columns">
              <div className="paper-col paper-col-lead">
                <figure className="paper-photo-frame">
                  <img
                    src="/mission_art/wildfire-ground.jpg"
                    alt={tr(
                      lang,
                      'Ảnh chụp mặt đất cho thấy ngọn lửa cháy rừng bùng phát qua sườn núi vào ban đêm',
                      'Ground photograph showing wildfire flames burning across a mountain ridge at night'
                    )}
                    draggable={false}
                  />
                  <figcaption>
                    {tr(
                      lang,
                      'Góc nhìn mặt đất về đám cháy đang lan trên sườn núi — khói dày bao phủ các thung lũng lân cận và cắt đứt khả năng trinh sát bằng mắt thường.',
                      'Ground view of an advancing ridge fire — thick smoke blankets nearby valleys and cuts off visual reconnaissance.'
                    )}
                  </figcaption>
                </figure>
                <p className="paper-dropcap">
                  {tr(
                    lang,
                    'Trong 72 giờ qua, gió nóng khô đã thổi bùng đợt cháy rừng tàn khốc nhất được ghi nhận trong ba thế kỷ. Các trạm thời tiết khu vực và trạm tiếp sóng liên lạc từ xa đã mất tín hiệu trên cả ba vùng ven biển.',
                    'Over the past 72 hours, dry hot winds have fanned the largest, most devastating wildfire outbreak recorded in three centuries. Regional weather stations and remote communication relays have gone silent across three coastal zones.'
                  )}
                </p>
              </div>

              <div className="paper-col">
                <h3 className="paper-subhead">
                  {tr(lang, 'CÁC ĐỘI CỨU HỘ TÁC CHIẾN TRONG MÙ MỊT', 'RESCUE TEAMS OPERATING BLIND')}
                </h3>
                <p>
                  {tr(
                    lang,
                    'Giới chức chỉ huy cứu hỏa cho biết lực lượng ứng cứu mặt đất đang phải di chuyển mà không có bản đồ nhiệt cập nhật. “Chúng tôi không thể phân biệt tuyến lửa nào đang tiến về khu dân cư và cánh lửa nào đã chững lại dưới lớp màn khói,” thông cáo khẩn cấp nêu rõ.',
                    'Fire command officials report that ground responders are navigating without updated thermal maps. “We cannot tell which fire line is advancing toward populated towns and which flanks have stalled under the smoke canopy,” the emergency dispatch bulletin stated.'
                  )}
                </p>
                <p>
                  {tr(
                    lang,
                    'Lựa chọn duy nhất còn lại là phóng khẩn cấp một vệ tinh trinh sát lên Quỹ đạo Trái Đất Thấp (LEO) để chụp ảnh các hành lang cháy từ không gian và truyền tọa độ trực tiếp về trạm mặt đất.',
                    'The only remaining option is an urgent orbital reconnaissance launch into Low Earth Orbit (LEO) to image the active corridors from space and downlink coordinates directly to ground stations.'
                  )}
                </p>
              </div>

              <div className="paper-col paper-col-box">
                <div className="paper-dispatch-box">
                  <div className="paper-dispatch-tag">
                    {tr(lang, 'CÔNG ĐIỆN KHẨN TỪ BỘ CHỈ HUY KHÔNG GIAN', 'URGENT SPACE COMMAND DISPATCH')}
                  </div>
                  <h4>{tr(lang, 'TRIỆU TẬP KỸ SƯ TRƯỞNG', 'LEAD ENGINEER SUMMONED')}</h4>
                  <p>
                    {tr(
                      lang,
                      'Hội đồng Khẩn cấp đã bật đèn xanh cho chương trình vệ tinh phản ứng nhanh ',
                      'The Emergency Council has greenlit rapid-response satellite program '
                    )}
                    <strong>
                      MP-SC01 &ldquo;{isVi ? 'Đôi Mắt Đầu Tiên Nhìn Lại Trái Đất' : 'The First Eyes Looking Back at Earth'}&rdquo;
                    </strong>.
                  </p>
                  <p>
                    {tr(
                      lang,
                      'Một Kỹ sư Trưởng Tên lửa & Tàu vũ trụ đã được bổ nhiệm để tiếp quản ngay công tác tích hợp và điều hành bay.',
                      'A Lead Rocket & Spacecraft Engineer has been appointed to take over integration and flight operations immediately.'
                    )}
                  </p>
                </div>
                <p className="paper-disclaimer">
                  {tr(
                    lang,
                    'Bản tin đặc biệt — Mọi trung tâm điều hành quỹ đạo được lệnh trực chiến 24/7 cho tới khi khống chế hoàn toàn các mặt trận lửa.',
                    'Special Bulletin — All orbital operations centers are placed on 24/7 emergency standby until all fire fronts are contained.'
                  )}
                </p>
              </div>
            </div>

            <footer className="paper-action-bar">
              <span className="paper-scene-indicator">
                {tr(lang, 'CẢNH 01 / 03 — BÀN LÀM VIỆC BUỔI SÁNG', 'SCENE 01 / 03 — MORNING BRIEFING DESK')}
              </span>
              <div className="row-wrap">
                <button type="button" className="btn small" onClick={onSkip}>
                  {tr(lang, 'BỎ QUA [ESC]', 'SKIP INTRO [ESC]')}
                </button>
                <button type="button" className="btn primary crisis-continue" onClick={() => setIndex(1)}>
                  {tr(lang, 'MỞ DANH SÁCH NHIỆM VỤ', 'OPEN MISSION CHECKLIST')}
                </button>
              </div>
            </footer>
          </article>
        </div>
      )}

      {isWildfire && index === 1 && (
        <div className="crisis-clipboard-stage">
          <section
            className="panel clipboard-panel crisis-clipboard-panel"
            aria-label={tr(lang, 'Bảng kiểm nhiệm vụ được giao', 'Mission Assignment Checklist')}
          >
            <div className="clipboard-clip" aria-hidden="true" />
            <div className="clipboard-sheet">
              <h2 className="clipboard-title">
                <span>
                  {MISSION_CHECKLIST_ITEMS.length} {tr(lang, 'NHIỆM VỤ ĐƯỢC GIAO', 'MISSION ASSIGNMENTS')}
                </span>
                <span className={`badge ${checkedIds.length === MISSION_CHECKLIST_ITEMS.length ? 'ok' : 'warn'}`}>
                  {checkedIds.length}/{MISSION_CHECKLIST_ITEMS.length}{' '}
                  {tr(lang, 'ĐÃ XÁC NHẬN', 'ACKNOWLEDGED')}
                </span>
              </h2>

              <div className="small muted-ink" style={{ marginBottom: 10 }}>
                {tr(
                  lang,
                  'CHỈ THỊ TRUNG TÂM ĐIỀU HÀNH [DIR-01]: Mạng lưới mặt đất đang quá tải. Bạn được bổ nhiệm làm ',
                  'MISSION CONTROL DIRECTIVE [DIR-01]: Ground networks are overloaded. You are appointed '
                )}
                <strong>{tr(lang, 'Kỹ sư Trưởng Tên lửa & Tàu vũ trụ', 'Lead Rocket & Spacecraft Engineer')}</strong>
                {tr(lang, ' cho nhiệm vụ MP-SC01.', ' for MP-SC01.')}
              </div>

              <div className="checklist-box">
                {MISSION_CHECKLIST_ITEMS.map((item) => {
                  const isChecked = checkedIds.includes(item.id);
                  const rowClass = item.alert ? 'check-row detected' : isChecked ? 'check-row' : 'check-row';
                  return (
                    <div
                      key={item.id}
                      className={`${rowClass} crisis-check-item`}
                      onClick={() => toggleCheckItem(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleCheckItem(item.id);
                        }
                      }}
                    >
                      <div className="row-between" style={{ gap: 8 }}>
                        <span>{tx(item.title, lang)}</span>
                        <span className="small muted-ink">
                          [{isChecked ? tr(lang, 'SẴN SÀNG', 'READY') : tr(lang, 'CHỜ XÁC NHẬN', 'PENDING')}]
                        </span>
                      </div>
                      <div className="small muted-ink">{tx(item.desc, lang)}</div>
                      {item.alert && (
                        <div className="small err-ink" style={{ marginTop: 4 }}>
                          ⚠ {tx(item.alert, lang)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="clipboard-footer-actions">
                <button type="button" className="btn small" onClick={() => setIndex(0)}>
                  {tr(lang, 'QUAY LẠI TỜ BÁO', 'BACK TO NEWSPAPER')}
                </button>
                <div className="row-wrap">
                  <button type="button" className="btn small" onClick={onSkip}>
                    {tr(lang, 'BỎ QUA [ESC]', 'SKIP [ESC]')}
                  </button>
                  <button type="button" className="btn primary crisis-continue" onClick={() => setIndex(2)}>
                    {tr(lang, 'MỞ HỒ SƠ NHIỆM VỤ', 'OPEN MISSION DOSSIER')}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {(!isWildfire || index === 2) && (
        <article className="crisis-intro-card briefing-modal-card">
          <header className="crisis-intro-header">
            <span className="crisis-live-dot" />
            <strong>
              {isWildfire
                ? tr(
                    lang,
                    'CẢNH 03 / 03 // HỒ SƠ CHỈ THỊ NHIỆM VỤ CHI TIẾT',
                    'SCENE 03 / 03 // DETAILED MISSION BRIEFING DOSSIER'
                  )
                : tr(
                    lang,
                    `HỒ SƠ NHIỆM VỤ CHI TIẾT // ${effectiveMissionId}`,
                    `DETAILED MISSION BRIEFING // ${effectiveMissionId}`
                  )}
            </strong>
            <span>{isWildfire ? '03 / 03' : '01 / 01'}</span>
          </header>

          <div className="crisis-briefing-scroll">
            <MissionBriefingDossier
              missionId={effectiveMissionId}
              missionDetail={missionDetail}
              scenario={scenario}
              lang={lang}
            />
          </div>

          <footer className="crisis-intro-footer">
            <span className="small muted">
              {isWildfire
                ? tr(
                    lang,
                    'Xác nhận hồ sơ kỹ thuật để bắt đầu phần hướng dẫn tương tác cùng Kỹ sư trưởng',
                    'Confirm the engineering dossier to begin the interactive Chief Engineer walkthrough'
                  )
                : tr(
                    lang,
                    'Xác nhận hồ sơ kỹ thuật để bắt đầu thiết kế nhiệm vụ',
                    'Confirm the engineering dossier to begin mission design'
                  )}
            </span>
            <div className="row-wrap">
              <button type="button" className="btn small" onClick={onSkip}>
                {tr(lang, 'ĐÓNG [ESC]', 'CLOSE [ESC]')}
              </button>
              {isWildfire && (
                <button type="button" className="btn small" onClick={() => setIndex(1)}>
                  {tr(lang, 'QUAY LẠI BẢNG KIỂM', 'BACK TO CHECKLIST')}
                </button>
              )}
              <button type="button" className="btn primary crisis-continue" onClick={onComplete}>
                {phase === 'home'
                  ? tr(lang, 'XÁC NHẬN & VÀO SẢNH CHÍNH', 'CONFIRM & ENTER MAIN MENU')
                  : isWildfire
                    ? tr(lang, 'XÁC NHẬN & BẮT ĐẦU HƯỚNG DẪN', 'CONFIRM & START TUTORIAL')
                    : tr(lang, 'XÁC NHẬN & VÀO NHIỆM VỤ', 'CONFIRM & ENTER MISSION')}
              </button>
            </div>
          </footer>
        </article>
      )}
    </div>
  );
}
