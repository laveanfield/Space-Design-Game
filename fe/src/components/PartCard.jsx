import React, { useEffect, useState } from 'react';
import { partThumb } from '../three/partThumbs';

/**
 * PartCard -- The linh kien Terminal gon: anh 3D + tem phan loai + ten + toi da 3 chi so vat ly.
 * Khong khoa lua chon de ho tro triet ly "Launch Anything": canh bao mismatch nhung van cho chon va phong thu.
 */

const TAG_LABEL = {
  mass: 'M:',
  power: 'P:',
  gen: 'GEN:',
  wh: 'CAP:',
  data: 'DATA:',
  rate: 'DL:',
  point: 'PT:',
  rad: 'RAD:',
  alt: 'ALT:',
  lead: 'LEAD:',
  cap: 'CAP:',
  fair: 'FAIR:',
};

/** Chon toi da 3 chi so vat ly quan trong nhat theo tung loai linh kien (bo qua Science). */
export function statsOf(slot, item) {
  const s = [];
  const add = (k, v) => v != null && v !== '' && s.push([k, v]);
  switch (slot) {
    case 'orbit':
      add('alt', `${item.altitude_km}km`);
      add('point', `${item.inclination_deg}°`);
      break;
    case 'instruments':
      add('data', `${item.data_generated_gb_per_day}GB/d`);
      add('point', `±${item.pointing_required_deg}°`);
      add('power', `${item.power_operating_w}W`);
      break;
    case 'bus':
      add('mass', `≤${item.max_total_mass_kg}kg`);
      add('power', `${item.max_payload_power_w}W`);
      break;
    case 'power':
      add('gen', `${item.generation_w}W`);
      add('mass', `${item.mass_kg}kg`);
      break;
    case 'battery':
      add('wh', `${item.capacity_wh}Wh`);
      add('mass', `${item.mass_kg}kg`);
      break;
    case 'comm':
      add('rate', `${item.downlink_mbps}Mbps`);
      add('power', `${item.power_w}W`);
      break;
    case 'obc':
      add('rad', `${item.rad_tolerance_krad}krad`);
      add('power', `${item.power_w}W`);
      break;
    case 'adcs':
      add('point', `±${item.pointing_accuracy_deg}°`);
      add('power', `${item.power_w}W`);
      break;
    case 'launch':
      add('cap', `${item.leo_capacity_kg}kg`);
      add('fair', `${item.fairing_diameter_m}m`);
      break;
    default:
      break;
  }
  return s.slice(0, 3);
}

function badgeOf(slot, item, budgetMusd) {
  if (slot === 'orbit') return { cls: 'ok', text: 'ORBIT PARAMETER' };
  // mot mon linh kien da dat hon ca ngan sach cap tren cho -> canh bao vuot ngan sach
  if (budgetMusd && item.cost_musd != null && Number(item.cost_musd) > Number(budgetMusd)) {
    return { cls: 'warn', text: `OVER-BUDGET ($${Number(item.cost_musd).toFixed(1)}M)` };
  }
  const lowRad = item.rad_tolerance_krad != null && Number(item.rad_tolerance_krad) <= 20;
  const lowRel = item.reliability != null && Number(item.reliability) < 0.96;
  if (item.tier === 'basic' || lowRad || lowRel) {
    return { cls: 'cheap', text: 'CHEAP / UNVERIFIED' };
  }
  if (item.tier === 'advanced' || item.tier === 'expert' || Number(item.rad_tolerance_krad) >= 50) {
    return { cls: 'ok', text: 'FLIGHT-HERITAGE' };
  }
  return { cls: 'std', text: 'WORKSHOP SPEC' };
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
      <ellipse cx="48" cy="35" rx="38" ry="13" fill="none" stroke="#38e594" strokeWidth="1.6" transform="rotate(-18 48 35)" />
      <circle cx="82" cy="24" r="2.6" fill="#e8f5ff" />
    </svg>
  );
}

export default function PartCard({ slot, item, selected, warnText, budgetMusd, onPick }) {
  const stats = statsOf(slot, item);
  const tag = badgeOf(slot, item, budgetMusd);
  const tip = [
    item.name,
    item.description_simple,
    item.lead_time_months != null ? `Lead time: ${item.lead_time_months} mo` : null,
    warnText,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <button
      className={`part-card ${selected ? 'selected' : ''} ${warnText ? 'warn-mismatch' : ''}`}
      title={tip}
      onClick={onPick}
    >
      <div className={`part-card-ribbon ${tag.cls}`}>
        <span className="ribbon-label">[{tag.text}]</span>
      </div>
      <div className="part-card-main">
        <PartThumb slot={slot} id={item.id} />
        <div className="part-body">
          <div className="part-name">{item.name || item.id}</div>
          <div className="part-stats">
            {item.cost_musd != null && (
              <span className="part-stat cost">
                <i>Cost:</i>${Number(item.cost_musd).toFixed(1)}M
              </span>
            )}
            {stats.map(([k, v]) => (
              <span key={k} className="part-stat">
                <i>{TAG_LABEL[k]}</i>
                {v}
              </span>
            ))}
          </div>
          {warnText && <div className="part-nofit">! {warnText}</div>}
        </div>
      </div>
    </button>
  );
}
