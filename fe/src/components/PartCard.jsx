import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPartInsight } from '../core/gameMachine';
import { partThumb } from '../three/partThumbs';
import { useGame } from '../core/GameContext';
import { tr } from '../core/i18n';

/**
 * Clean UI string by stripping internal brackets [...] and removing parentheses (...)
 * while preserving capacity numbers / dimensions cleanly.
 */
export function cleanPartText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\s*\((?:BUS|OBC|ADCS|ƯU ĐIỂM|Fairing|ISS-like|SEU|LATCH-UP|NO SCIENCE|AUTO-CALC|Kourou)\)/gi, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\(([0-9]+(?:\.[0-9]+)?\s*(?:Wh|kWh|W|kW|kg|m|T|U|deg|km|min|s|Mbps|kbps|GB|rad|krad)?)\)/gi, ' $1')
    .replace(/\(([0-9]+U(?:-[0-9]+U)?)\)/gi, ' $1')
    .replace(/\(([0-9]{1,2}:[0-9]{2})\)/gi, ' $1')
    .replace(/[()[\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const SLOT_NAMES = {
  orbit: { vi: 'QUỸ ĐẠO', en: 'ORBIT' },
  instruments: { vi: 'CẢM BIẾN TẢI', en: 'PAYLOAD SENSORS' },
  bus: { vi: 'KHUNG VỆ TINH', en: 'SPACECRAFT BUS' },
  power: { vi: 'PIN MẶT TRỜI', en: 'SOLAR ARRAYS' },
  battery: { vi: 'ẮC QUY DỰ PHÒNG', en: 'BACKUP BATTERY' },
  comm: { vi: 'BỘ TRUYỀN TIN', en: 'COMMUNICATIONS' },
  obc: { vi: 'MÁY TÍNH TRUNG TÂM', en: 'FLIGHT COMPUTER' },
  adcs: { vi: 'ĐIỀU HƯỚNG TƯ THẾ', en: 'ATTITUDE CONTROL' },
  launch: { vi: 'TÊN LỬA ĐẨY', en: 'LAUNCH VEHICLE' },
};

/** 1 chi so quan trong nhat tren mat the (cong them Cost se thanh toi da 2 chi so). */
export function primaryStatOf(slot, item, lang = 'vi') {
  switch (slot) {
    case 'orbit':
      return item.altitude_km != null ? { label: tr(lang, 'Độ cao:', 'Alt:'), val: `${item.altitude_km} km` } : null;
    case 'instruments':
      return item.data_generated_gb_per_day != null
        ? { label: tr(lang, 'Dữ liệu:', 'Data:'), val: `${item.data_generated_gb_per_day} GB/d` }
        : item.power_operating_w != null
          ? { label: tr(lang, 'Điện:', 'Power:'), val: `${item.power_operating_w} W` }
          : null;
    case 'bus':
      return item.max_total_mass_kg != null
        ? { label: tr(lang, 'Tải tối đa:', 'Max Mass:'), val: `${item.max_total_mass_kg} kg` }
        : null;
    case 'power':
      return item.generation_w != null ? { label: tr(lang, 'Phát điện:', 'Gen:'), val: `${item.generation_w} W` } : null;
    case 'battery':
      return item.capacity_wh != null ? { label: tr(lang, 'Dung lượng:', 'Capacity:'), val: `${item.capacity_wh} Wh` } : null;
    case 'comm': {
      if (item.downlink_mbps == null) return null;
      const mbps = Number(item.downlink_mbps);
      const val = mbps < 0.1 ? `${(mbps * 1000).toFixed(1)} kbps` : `${mbps} Mbps`;
      return { label: tr(lang, 'Tốc độ:', 'Rate:'), val };
    }
    case 'obc':
      return item.rad_tolerance_krad != null
        ? { label: tr(lang, 'Chống tia:', 'Rad Tol:'), val: `${item.rad_tolerance_krad} krad` }
        : null;
    case 'adcs':
      return item.pointing_accuracy_deg != null
        ? { label: tr(lang, 'Độ lệch:', 'Pointing:'), val: `±${item.pointing_accuracy_deg}°` }
        : null;
    case 'launch':
      return item.leo_capacity_kg != null ? { label: tr(lang, 'Sức chở:', 'LEO Cap:'), val: `${item.leo_capacity_kg} kg` } : null;
    default:
      return null;
  }
}

export function fullSpecsOf(slot, item, lang = 'vi') {
  const rows = [];
  const push = (k, v) => v != null && v !== '' && rows.push([k, v]);
  if (item.cost_musd != null) push(tr(lang, 'Chi phí', 'Cost'), `$${Number(item.cost_musd).toFixed(2)}M`);
  if (item.lead_time_months != null) push(tr(lang, 'Thời gian chế tạo', 'Lead Time'), `${item.lead_time_months} ${tr(lang, 'tháng', 'months')}`);
  if (item.mass_kg != null) push(tr(lang, 'Khối lượng', 'Mass'), `${item.mass_kg} kg`);

  switch (slot) {
    case 'orbit':
      push(tr(lang, 'Độ cao', 'Altitude'), `${item.altitude_km} km`);
      push(tr(lang, 'Góc nghiêng', 'Inclination'), `${item.inclination_deg}°`);
      push(tr(lang, 'Chu kỳ và Vùng tối', 'Period and Eclipse'), `${item.period_min} ${tr(lang, 'phút', 'min')} • ${Math.round((item.eclipse_fraction || 0) * 100)}%`);
      push(tr(lang, 'Liên lạc mặt đất', 'Ground Contact'), `${item.ground_contact_min_per_day} ${tr(lang, 'phút/ngày', 'min/day')}`);
      push(tr(lang, 'Bức xạ hàng năm', 'Annual Radiation'), `${item.radiation_dose_krad_per_year} ${tr(lang, 'krad/năm', 'krad/year')}`);
      push(tr(lang, 'Tuổi thọ tự nhiên', 'Orbital Lifetime'), `${item.orbital_lifetime_years_no_reboost} ${tr(lang, 'năm', 'years')}`);
      break;
    case 'instruments':
      push(tr(lang, 'Dữ liệu sinh ra', 'Data Generation'), `${item.data_generated_gb_per_day} ${tr(lang, 'GB/ngày', 'GB/day')}`);
      push(tr(lang, 'Công suất tiêu thụ', 'Operating Power'), `${item.power_operating_w} W`);
      push(tr(lang, 'Yêu cầu trỏ hướng', 'Pointing Requirement'), `±${item.pointing_required_deg}°`);
      if (item.science_value_pts != null) push(tr(lang, 'Điểm khoa học', 'Science Value'), `${item.science_value_pts} ${tr(lang, 'điểm', 'pts')}`);
      break;
    case 'bus':
      push(tr(lang, 'Tổng tải tối đa', 'Max Total Mass'), `${item.max_total_mass_kg} kg`);
      push(tr(lang, 'Tải cảm biến tối đa', 'Max Payload Mass'), `${item.max_payload_mass_kg} kg`);
      push(tr(lang, 'Nguồn cấp cảm biến', 'Max Payload Power'), `${item.max_payload_power_w} W`);
      break;
    case 'power':
      push(tr(lang, 'Công suất phát', 'Power Generation'), `${item.generation_w} W`);
      push(tr(lang, 'Suy hao mỗi năm', 'Annual Degradation'), `${item.degradation_pct_per_year ?? 2}% ${tr(lang, '/năm', '/year')}`);
      break;
    case 'battery':
      push(tr(lang, 'Dung lượng', 'Capacity'), `${item.capacity_wh} Wh`);
      push(tr(lang, 'Mức xả an toàn', 'Usable Depth of Discharge'), `${Math.round((item.usable_dod || 0.3) * 100)}%`);
      break;
    case 'comm':
      push(tr(lang, 'Băng tần', 'RF Band'), `${item.band || '-'}`);
      push(tr(lang, 'Tốc độ tải xuống', 'Downlink Rate'), `${item.downlink_mbps} Mbps`);
      push(tr(lang, 'Công suất tiêu thụ', 'Power Draw'), `${item.power_w} W`);
      push(tr(lang, 'Góc phủ ăng-ten', 'Beam Pointing'), `±${item.pointing_required_deg}°`);
      break;
    case 'obc':
      push(tr(lang, 'Chống bức xạ', 'Radiation Tolerance'), `${item.rad_tolerance_krad} krad`);
      push(tr(lang, 'Bộ nhớ lưu trữ', 'Onboard Storage'), `${item.storage_gb} GB`);
      push(tr(lang, 'Công suất tiêu thụ', 'Power Draw'), `${item.power_w} W`);
      break;
    case 'adcs':
      push(tr(lang, 'Độ chính xác trỏ', 'Pointing Accuracy'), `±${item.pointing_accuracy_deg}°`);
      push(tr(lang, 'Công suất tiêu thụ', 'Power Draw'), `${item.power_w} W`);
      break;
    case 'launch':
      push(tr(lang, 'Tải LEO tối đa', 'Max LEO Capacity'), `${item.leo_capacity_kg} kg`);
      push(tr(lang, 'Đường kính khoang mũi', 'Fairing Diameter'), `${item.fairing_diameter_m} m`);
      push(tr(lang, 'Độ tin cậy phóng', 'Launch Reliability'), `${Math.round((item.reliability || 0) * 100)}%`);
      if (item.manufacturer) push(tr(lang, 'Hãng chế tạo', 'Manufacturer'), item.manufacturer);
      break;
    default:
      break;
  }
  return rows;
}

export function analyzePartProsCons(slot, item, deadlineMonths, warnText, lang = 'vi') {
  const pros = [];
  const cons = [];
  const cost = Number(item.cost_musd ?? 0);
  const lead = Number(item.lead_time_months ?? 0);

  if (warnText) {
    cons.push(`${tr(lang, 'Cảnh báo hiện tại:', 'Current alert:')} ${cleanPartText(warnText)}.`);
  }

  if (slot !== 'orbit') {
    if (cost > 0 && cost <= 1.5) {
      pros.push(tr(lang, `Rất rẻ $${cost.toFixed(2)}M, dễ bám sát trần ngân sách`, `Low cost $${cost.toFixed(2)}M, fits well within budget constraints`));
    } else if (cost >= 40) {
      cons.push(tr(lang, `Chi phí rất cao $${cost.toFixed(1)}M, dễ làm đội ngân sách`, `High cost $${cost.toFixed(1)}M, risks major budget overrun`));
    }

    if (deadlineMonths && lead > Number(deadlineMonths)) {
      cons.push(
        tr(
          lang,
          `Thời gian chế tạo ${lead} tháng vượt hạn chót ${deadlineMonths} tháng, làm giảm thời gian kiểm định xưởng`,
          `Lead time of ${lead} months exceeds ${deadlineMonths} month deadline, cutting inspection window`
        )
      );
    } else if (lead > 0 && lead <= 6) {
      pros.push(tr(lang, `Thời gian lắp ráp nhanh ${lead} tháng, an toàn tiến độ`, `Fast turnaround of ${lead} months, keeps schedule on track`));
    } else if (lead >= 24) {
      cons.push(tr(lang, `Chế tạo mất nhiều thời gian ${lead} tháng, dễ trễ lịch phóng`, `Long production time of ${lead} months, risks launch delay`));
    }
  }

  switch (slot) {
    case 'orbit': {
      const life = Number(item.orbital_lifetime_years_no_reboost ?? 0);
      const rad = Number(item.radiation_dose_krad_per_year ?? 0);
      const contact = Number(item.ground_contact_min_per_day ?? 0);
      if (Number(item.altitude_km) <= 500) {
        pros.push(tr(lang, 'Quỹ đạo thấp: tiết kiệm chi phí phóng và giảm tải cho tên lửa', 'Low orbit: lower launch cost and easier booster insertion'));
      }
      if (life <= 2) {
        cons.push(tr(lang, `Ma sát khí quyển lớn, vệ tinh tự rơi chỉ sau khoảng ${life} năm`, `High atmospheric drag, satellite decays in roughly ${life} years`));
      } else if (life >= 10) {
        pros.push(tr(lang, `Bền vững lâu dài ${life} năm không cần nâng quỹ đạo`, `High longevity, lasts ${life} years without orbit raising`));
      }
      if (rad >= 8) {
        cons.push(tr(lang, `Bức xạ cực mạnh ${rad} krad/năm: bắt buộc dùng chip máy tính chống bức xạ cao`, `Severe radiation ${rad} krad/year: requires radiation-hardened flight computer`));
      }
      if (contact < 35) {
        cons.push(tr(lang, `Thời gian liên lạc trạm mặt đất ngắn ${contact} phút/ngày, cần bộ truyền tốc độ cao`, `Short ground contact window ${contact} min/day, requires high-speed downlink`));
      } else if (contact >= 45) {
        pros.push(tr(lang, `Liên lạc trạm mặt đất thuận lợi ${contact} phút/ngày`, `Favorable ground contact window ${contact} min/day`));
      }
      break;
    }
    case 'instruments': {
      const data = Number(item.data_generated_gb_per_day ?? 0);
      const pt = Number(item.pointing_required_deg ?? 10);
      const pwr = Number(item.power_operating_w ?? 0);
      if (Number(item.science_value_pts ?? 0) >= 40) {
        pros.push(tr(lang, `Giá trị khoa học cao ${item.science_value_pts} điểm, đáp ứng tốt nhiệm vụ lớn`, `High scientific yield ${item.science_value_pts} pts, delivers strong mission value`));
      } else {
        pros.push(tr(lang, 'Nhỏ gọn, dễ tích hợp trên khung CubeSat giá rẻ', 'Compact size, easily integrates into CubeSat buses'));
      }
      if (data >= 10) {
        cons.push(tr(lang, `Lượng dữ liệu lớn ${data} GB/ngày: cần bộ truyền tốc độ cao và bộ nhớ lớn`, `High data generation ${data} GB/day: requires high-bandwidth downlink and large memory`));
      }
      if (pt <= 0.1) {
        cons.push(tr(lang, `Đòi hỏi điều hướng giữ thăng bằng cực chuẩn ±${pt}°, tránh nhòe ảnh`, `Demands precise pointing stability ±${pt}° to prevent image blur`));
      }
      if (pwr >= 40) {
        cons.push(tr(lang, `Tiêu thụ nhiều điện ${pwr} W: cần diện tích pin lớn và ắc quy dung lượng cao`, `High power draw ${pwr} W: requires large solar arrays and ample battery capacity`));
      }
      break;
    }
    case 'bus': {
      const pMax = Number(item.max_payload_power_w ?? 0);
      const mMax = Number(item.max_payload_mass_kg ?? 0);
      if (mMax >= 100) {
        pros.push(tr(lang, `Khoang chứa rộng ${mMax} kg, cấp nguồn ${pMax} W, gắn được cảm biến lớn`, `Spacious payload bay ${mMax} kg, ${pMax} W, accommodates heavy sensors`));
      } else {
        pros.push(tr(lang, 'Khung nhẹ gọn, tương thích các tên lửa cỡ nhỏ', 'Lightweight compact frame, compatible with small launchers'));
      }
      if (pMax <= 10 || mMax <= 2) {
        cons.push(tr(lang, `Giới hạn tải rất nhỏ: tối đa ${mMax} kg và ${pMax} W, dễ quá tải`, `Very small capacity: max ${mMax} kg and ${pMax} W, easily overloaded`));
      }
      break;
    }
    case 'power': {
      const gen = Number(item.generation_w ?? 0);
      if (gen <= 20) {
        pros.push(tr(lang, 'Gắn cố định thân tàu, không có khớp gập nên không lo kẹt cánh', 'Body-mounted cells without mechanisms, zero deployment failure risk'));
        cons.push(tr(lang, `Công suất hạn chế ${gen} W: dễ sụt nguồn khi truyền tin hoặc bật cảm biến`, `Limited power ${gen} W: risks brownout during peak sensor or transmission loads`));
      } else {
        pros.push(tr(lang, `Cung cấp nguồn điện dồi dào ${gen} W giúp tàu hoạt động ổn định`, `Abundant power generation ${gen} W ensures steady continuous operations`));
        if (gen >= 1000) {
          cons.push(tr(lang, `Cánh pin lớn và nặng ${item.mass_kg} kg, cần khoang mũi tên lửa rộng`, `Large heavy solar wings ${item.mass_kg} kg, requires wide launch fairing`));
        }
      }
      break;
    }
    case 'battery': {
      const wh = Number(item.capacity_wh ?? 0);
      if (wh <= 50) {
        pros.push(tr(lang, 'Siêu nhẹ 0.3 kg, chi phí thấp cho vệ tinh nhỏ', 'Ultra-lightweight 0.3 kg, economical choice for small satellites'));
        cons.push(tr(lang, `Dung lượng nhỏ ${wh} Wh: dễ cạn kiệt điện khi tàu đi qua vùng tối`, `Low capacity ${wh} Wh: risks draining completely during eclipse passage`));
      } else {
        pros.push(tr(lang, `Lưu trữ điện dồi dào ${wh} Wh, duy trì hệ thống ổn định qua chu kỳ tối`, `Ample energy storage ${wh} Wh, keeps systems operating safely through dark cycles`));
      }
      break;
    }
    case 'comm': {
      const dl = Number(item.downlink_mbps ?? 0);
      const pt = Number(item.pointing_required_deg ?? 30);
      if (dl < 0.5) {
        pros.push(tr(lang, `Góc phát rộng ±${pt}°, không đòi hỏi điều hướng tư thế quá chuẩn`, `Broad beamwidth ±${pt}°, tolerates loose pointing alignment`));
        cons.push(tr(lang, `Tốc độ truyền rất chậm ${dl} Mbps: khó tải kịp ảnh độ phân giải cao`, `Very slow data rate ${dl} Mbps: cannot deliver high-resolution imagery in time`));
      } else if (dl >= 50) {
        pros.push(tr(lang, `Tốc độ truyền cực nhanh ${dl} Mbps, tải trọn vẹn dữ liệu ảnh lớn`, `Blazing downlink speed ${dl} Mbps, quickly transmits large image sets`));
        if (pt <= 1) {
          cons.push(tr(lang, `Búp sóng hẹp ±${pt}°: bắt buộc hệ thống điều hướng chính xác cao để không mất liên lạc`, `Narrow beam ±${pt}°: strictly requires fine pointing control to avoid signal loss`));
        }
      } else {
        pros.push(tr(lang, `Tốc độ cân bằng ${dl} Mbps, phù hợp nhu cầu CubeSat thông thường`, `Balanced speed ${dl} Mbps, fits standard CubeSat mission profiles`));
        cons.push(tr(lang, 'Dễ nghẽn băng thông nếu cảm biến sinh nhiều GB dữ liệu mỗi ngày', 'May bottleneck telemetry if sensors produce high daily data volume'));
      }
      break;
    }
    case 'obc': {
      const rad = Number(item.rad_tolerance_krad ?? 0);
      const sto = Number(item.storage_gb ?? 0);
      if (rad <= 20) {
        pros.push(tr(lang, `Chi phí rẻ, tiêu thụ ít điện ${item.power_w} W`, `Budget-friendly cost, low power draw ${item.power_w} W`));
        cons.push(tr(lang, `Chịu bức xạ yếu ${rad} krad: dễ bị lỗi bit hoặc hỏng khi gặp bão mặt trời`, `Low radiation tolerance ${rad} krad: vulnerable to bit flips and storm upsets`));
      } else {
        pros.push(tr(lang, `Chống chịu bức xạ tốt ${rad} krad và bộ nhớ ${sto} GB, hoạt động ổn định trong bão từ`, `High radiation hardness ${rad} krad and ${sto} GB storage, survives severe magnetic storms`));
      }
      if (sto <= 8) {
        cons.push(tr(lang, `Bộ nhớ hạn chế ${sto} GB: nhanh đầy nếu chưa kịp gặp trạm mặt đất`, `Limited storage ${sto} GB: fills rapidly if ground contact is delayed`));
      }
      break;
    }
    case 'adcs': {
      const pt = Number(item.pointing_accuracy_deg ?? 5);
      if (pt >= 3) {
        pros.push(tr(lang, 'Cơ cấu đơn giản, tiết kiệm điện và không lo mòn bánh đà', 'Simple robust design, consumes minimal power with zero wheel wear'));
        cons.push(tr(lang, `Độ lệch hướng lớn ±${pt}°: ảnh chụp dễ nhòe và khó bắt sóng băng thông cao`, `Coarse pointing accuracy ±${pt}°: causes image blur and misses high-speed links`));
      } else {
        pros.push(tr(lang, `Giữ hướng chuẩn xác ±${pt}°, cho ảnh sắc nét và truyền tin tốc độ cao ổn định`, `Precise pointing stability ±${pt}°, ensures crisp imaging and stable downlink`));
      }
      break;
    }
    case 'launch': {
      const rel = Number(item.reliability ?? 1);
      const fair = Number(item.fairing_diameter_m ?? 1);
      if (rel >= 0.95) {
        pros.push(tr(lang, `Độ tin cậy cao ${Math.round(rel * 100)}%, giảm thiểu rủi ro sự cố bệ phóng`, `High reliability ${Math.round(rel * 100)}%, minimizes pad and ascent risks`));
      } else {
        cons.push(tr(lang, `Rủi ro kỹ thuật đáng kể với độ tin cậy ${Math.round(rel * 100)}%, dễ gặp sự cố cất cánh`, `Notable technical risk at ${Math.round(rel * 100)}% reliability, higher chance of launch failure`));
      }
      if (fair <= 1.5) {
        cons.push(tr(lang, `Khoang mũi hẹp ${fair} m, tải tối đa ${item.leo_capacity_kg} kg: chỉ chở được vệ tinh nhỏ`, `Narrow fairing ${fair} m, max ${item.leo_capacity_kg} kg: limited to compact satellites`));
      } else {
        pros.push(tr(lang, `Khoang chứa rộng ${fair} m, sức chở ${item.leo_capacity_kg} kg, vừa mọi vệ tinh lớn`, `Spacious fairing ${fair} m, capacity ${item.leo_capacity_kg} kg, accommodates large satellites`));
      }
      break;
    }
    default:
      break;
  }

  return { pros, cons };
}

export function badgeOf(slot, item, deadlineMonths, lang = 'vi', budgetMusd = null) {
  if (typeof deadlineMonths === 'string') {
    const actualLang = deadlineMonths;
    const actualBudget = lang;
    lang = actualLang;
    budgetMusd = actualBudget;
    deadlineMonths = null;
  }
  if (slot === 'orbit') return { cls: 'ok', text: tr(lang, 'QUỸ ĐẠO', 'ORBIT') };
  if (budgetMusd && item.cost_musd != null && Number(item.cost_musd) > Number(budgetMusd)) {
    return { cls: 'warn', text: tr(lang, 'VƯỢT NGÂN SÁCH', 'OVER-BUDGET') };
  }
  if (deadlineMonths && item.lead_time_months != null && Number(item.lead_time_months) > Number(deadlineMonths)) {
    return { cls: 'warn', text: `${tr(lang, 'TRỄ HẠN', 'DELAYED')} • ${item.lead_time_months} ${tr(lang, 'THÁNG', 'MO')}` };
  }
  const lowRad = item.rad_tolerance_krad != null && Number(item.rad_tolerance_krad) <= 20;
  const lowRel = item.reliability != null && Number(item.reliability) < 0.96;
  if (item.tier === 'basic' || lowRad || lowRel) {
    return { cls: 'cheap', text: tr(lang, 'GIÁ RẺ', 'BUDGET') };
  }
  if (item.tier === 'advanced' || item.tier === 'expert' || Number(item.rad_tolerance_krad) >= 50) {
    return { cls: 'ok', text: tr(lang, 'CHẤT LƯỢNG CAO', 'HIGH GRADE') };
  }
  return { cls: 'std', text: tr(lang, 'TIÊU CHUẨN', 'STANDARD') };
}

export function PartThumb({ slot, id }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    if (slot === 'orbit') return undefined;
    partThumb(slot, id).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [slot, id]);
  if (slot === 'orbit') return <OrbitIcon />;
  return url ? <img className="part-thumb" src={url} alt="" draggable={false} /> : <div className="part-thumb loading" />;
}

/** Quy dao: bieu tuong 2D (Trai Dat + vong quy dao), khong can model 3D. */
function OrbitIcon() {
  return (
    <svg className="part-thumb" viewBox="0 0 96 70" aria-hidden="true">
      <defs>
        <radialGradient id="eg" cx="40%" cy="35%">
          <stop offset="0" stopColor="#7fc4ff" />
          <stop offset="1" stopColor="#1b4f8a" />
        </radialGradient>
      </defs>
      <circle cx="48" cy="35" r="17" fill="url(#eg)" />
      <ellipse cx="48" cy="35" rx="38" ry="13" fill="none" stroke="#6fd08c" strokeWidth="1.6" transform="rotate(-18 48 35)" />
      <circle cx="82" cy="24" r="2.6" fill="#e8f5ff" />
    </svg>
  );
}

export default function PartCard({ slot, item, selected, warnText, deadlineMonths, budgetMusd, onPick }) {
  const { lang } = useGame();
  const [showInfo, setShowInfo] = useState(false);
  const mainStat = primaryStatOf(slot, item, lang);
  const tag = badgeOf(slot, item, deadlineMonths, lang, budgetMusd);
  const analysis = showInfo ? analyzePartProsCons(slot, item, deadlineMonths, warnText, lang) : null;
  const specs = showInfo ? fullSpecsOf(slot, item, lang) : [];
  const insight = showInfo ? getPartInsight(slot, item) : null;

  const displayName = cleanPartText(item.name || item.id);
  const displayDesc = cleanPartText(
    item.description_simple || item.propulsion || tr(lang, 'Linh kiện tiêu chuẩn trong hệ thống chế tạo vệ tinh.', 'Standard aerospace hardware in satellite construction.')
  );

  return (
    <>
      <div className={`part-card-wrap ${selected ? 'selected' : ''} ${warnText ? 'warn-mismatch' : ''}`}>
        <button
          type="button"
          className={`part-card ${selected ? 'selected' : ''} ${warnText ? 'warn-mismatch' : ''}`}
          title={displayDesc}
          onClick={onPick}
        >
          <div className={`part-card-ribbon ${tag.cls}`}>
            <span className="ribbon-label">{tag.text}</span>
          </div>
          <div className="part-card-main">
            <PartThumb slot={slot} id={item.id} />
            <div className="part-body">
              <div className="part-name">{displayName}</div>
              <div className="part-stats">
                {item.cost_musd != null && (
                  <span className="part-stat cost">
                    <i>{tr(lang, 'Giá:', 'Cost:')}</i>${Number(item.cost_musd).toFixed(1)}M
                  </span>
                )}
                {mainStat && (
                  <span className="part-stat">
                    <i>{mainStat.label}</i> {mainStat.val}
                  </span>
                )}
              </div>
              {warnText && <div className="part-nofit">! {cleanPartText(warnText)}</div>}
            </div>
          </div>
        </button>

        <button
          type="button"
          className="part-help-btn"
          aria-label={tr(lang, `Xem chi tiết và lợi hại của ${displayName}`, `View details, pros and cons of ${displayName}`)}
          title={tr(lang, 'Xem chi tiết, điểm lợi và điểm hại', 'View details, pros and cons')}
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo(true);
          }}
        >
          ?
        </button>
      </div>

      {showInfo &&
        createPortal(
          <div
            className="part-info-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowInfo(false)}
          >
            <div className="part-info-modal" onClick={(e) => e.stopPropagation()}>
              <div className="part-info-head">
                <div>
                  <div className="part-info-slot">
                    {SLOT_NAMES[slot]?.[lang] || slot.toUpperCase()} • {item.id}
                  </div>
                  <h2 className="part-info-title">{displayName}</h2>
                </div>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setShowInfo(false)}
                >
                  {tr(lang, 'ĐÓNG', 'CLOSE')}
                </button>
              </div>

              <div className="part-info-overview">
                <div className="part-info-thumb-box">
                  <PartThumb slot={slot} id={item.id} />
                </div>
                <div className="part-info-desc">
                  <div className={`badge ${tag.cls === 'warn' ? 'err' : tag.cls === 'cheap' ? 'warn' : 'ok'}`}>
                    {tag.text}
                  </div>
                  <p>{displayDesc}</p>
                </div>
              </div>

              {lang === 'vi' && insight && (insight.where || insight.pros || insight.cons) && (
                <div
                  className="part-insight-box"
                  style={{
                    margin: '10px 0',
                    padding: '10px 12px',
                    background: 'var(--bg-card)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  {insight.where && (
                    <div className="small" style={{ marginBottom: 4 }}>
                      <b>📍 Vị trí & Công dụng:</b> {insight.where}
                    </div>
                  )}
                  {insight.pros && (
                    <div className="small ok-text" style={{ marginBottom: 4 }}>
                      <b>✅ Lợi ích:</b> {insight.pros}
                    </div>
                  )}
                  {insight.cons && (
                    <div className="small warn-text">
                      <b>⚠️ Tác hại & Nhược điểm:</b> {insight.cons}
                    </div>
                  )}
                </div>
              )}

              <div className="part-info-proscons">
                <div className="part-pros-box">
                  <h3>✅ {tr(lang, 'ĐIỂM LỢI', 'PROS')}</h3>
                  <ul>
                    {analysis.pros.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="part-cons-box">
                  <h3>⚠️ {tr(lang, 'ĐIỂM HẠI & RỦI RO', 'CONS & RISKS')}</h3>
                  <ul>
                    {analysis.cons.length > 0 ? (
                      analysis.cons.map((line, i) => <li key={i}>{line}</li>)
                    ) : (
                      <li>
                        {tr(
                          lang,
                          'Thông số cân bằng, chưa phát hiện điểm yếu rõ rệt ở màn này.',
                          'Balanced specifications, no critical weaknesses identified for this mission.'
                        )}
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="part-info-specs">
                {specs.map(([k, v]) => (
                  <div key={k} className="part-spec-chip">
                    <span className="muted">{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>

              <div className="part-info-foot">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    onPick();
                    setShowInfo(false);
                  }}
                >
                  {selected
                    ? tr(lang, '✓ ĐANG LẮP LINH KIỆN NÀY', '✓ CURRENTLY INSTALLED')
                    : tr(lang, '✓ CHỌN LẮP LINH KIỆN NÀY', '✓ INSTALL THIS PART')}
                </button>
                <button type="button" className="btn" onClick={() => setShowInfo(false)}>
                  {tr(lang, 'ĐÓNG', 'CLOSE')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
