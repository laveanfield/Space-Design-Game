import React, { useEffect, useState } from 'react';
import { partThumb } from '../three/partThumbs';

/**
 * PartCard -- the linh kien gon cho danh sach chon: anh 3D + ten + toi da 3 chi so ngan (bieu tuong + so).
 * Khong co cau van dai; chi so day du nam trong tooltip (title) khi re chuot.
 */

const ICON = { mass: '⚖', power: '⚡', gen: '☀', wh: '🔋', data: '💾', rate: '📡', point: '🎯', rad: '☢', alt: '⤒', lead: '⏱', cap: '🚀', fair: '⌀' };

/** Chon 3 chi so quan trong nhat theo tung loai linh kien. */
export function statsOf(slot, item) {
  const s = [];
  const add = (k, v) => v != null && v !== '' && s.push([k, v]);
  switch (slot) {
    case 'orbit': add('alt', `${item.altitude_km} km`); add('point', `${item.inclination_deg}°`); break;
    case 'instruments': add('data', `${item.data_generated_gb_per_day} GB/ng`); add('point', `±${item.pointing_required_deg}°`); add('power', `${item.power_operating_w} W`); break;
    case 'bus': add('mass', `≤${item.max_total_mass_kg} kg`); add('power', `${item.max_payload_power_w} W`); break;
    case 'power': add('gen', `${item.generation_w} W`); add('mass', `${item.mass_kg} kg`); break;
    case 'battery': add('wh', `${item.capacity_wh} Wh`); add('mass', `${item.mass_kg} kg`); break;
    case 'comm': add('rate', `${item.downlink_mbps} Mbps`); add('power', `${item.power_w} W`); break;
    case 'obc': add('rad', `${item.rad_tolerance_krad} krad`); add('power', `${item.power_w} W`); break;
    case 'adcs': add('point', `±${item.pointing_accuracy_deg}°`); add('power', `${item.power_w} W`); break;
    case 'launch': add('cap', `${item.leo_capacity_kg} kg`); add('fair', `${item.fairing_diameter_m} m`); break;
    default: break;
  }
  return s.slice(0, 3);
}

export function PartThumb({ slot, id }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    if (slot === 'orbit') return undefined;
    partThumb(slot, id).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [slot, id]);
  if (slot === 'orbit') return <OrbitIcon />;
  return url ? <img className="part-thumb" src={url} alt="" draggable={false} /> : <div className="part-thumb loading" />;
}

/** Quy dao: bieu tuong 2D (Trai Dat + vong quy dao), khong can model 3D. */
function OrbitIcon() {
  return (
    <svg className="part-thumb" viewBox="0 0 96 70" aria-hidden="true">
      <defs><radialGradient id="eg" cx="40%" cy="35%"><stop offset="0" stopColor="#7fc4ff" /><stop offset="1" stopColor="#1b4f8a" /></radialGradient></defs>
      <circle cx="48" cy="35" r="17" fill="url(#eg)" />
      <ellipse cx="48" cy="35" rx="38" ry="13" fill="none" stroke="#38e594" strokeWidth="1.6" transform="rotate(-18 48 35)" />
      <circle cx="82" cy="24" r="2.6" fill="#e8f5ff" />
    </svg>
  );
}

export default function PartCard({ slot, item, selected, disabled, noFitText, onPick }) {
  const stats = statsOf(slot, item);
  const tip = [item.name, item.description_simple, noFitText].filter(Boolean).join('\n');
  return (
    <button className={`part-card ${selected ? 'selected' : ''} ${disabled ? 'disallowed' : ''}`} disabled={disabled && !selected} title={tip} onClick={onPick}>
      <PartThumb slot={slot} id={item.id} />
      <div className="part-body">
        <div className="part-name">{item.name || item.id}</div>
        <div className="part-stats">
          {stats.map(([k, v]) => <span key={k} className="part-stat"><i>{ICON[k]}</i>{v}</span>)}
          {item.cost_musd != null && <span className="part-stat cost">${Number(item.cost_musd).toFixed(1)}M</span>}
        </div>
        {noFitText && <div className="part-nofit">✕ không lắp được</div>}
      </div>
    </button>
  );
}
