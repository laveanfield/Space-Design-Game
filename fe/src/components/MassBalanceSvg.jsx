import React from 'react';

export default function MassBalanceSvg({ mass, metrics }) {
  if (!mass) return null;
  const dryKg = Number(mass.dry_kg || 0);
  const ballastKg = Number(mass.ballast_kg || 0);
  const busLimitKg = Number(mass.bus_limit_kg || 0);
  const lvCapKg = Number(mass.capacity_kg || 0);
  const lvCapLibKg = Number(mass.capacity_library_kg || lvCapKg);

  const scaleMax = Math.max(dryKg + ballastKg, busLimitKg, lvCapKg, 1) * 1.08;
  const pct = (val) => `${Math.max(0, Math.min(100, (val / scaleMax) * 100)).toFixed(1)}%`;

  const overBus = busLimitKg > 0 && dryKg > busLimitKg;
  const overLv = lvCapKg > 0 && dryKg + ballastKg > lvCapKg;

  return (
    <div style={{ marginTop: 10 }}>
      <div className="row-between small muted" style={{ marginBottom: 4 }}>
        <span>MASS_BALANCE (kg)</span>
        <span>
          Dry {dryKg.toFixed(1)} kg / BusMax {busLimitKg.toFixed(1)} kg / LV OrbitCap{' '}
          {lvCapKg.toFixed(0)} kg
        </span>
      </div>
      <svg width="100%" height="54" viewBox="0 0 400 54" preserveAspectRatio="none">
        <rect x="0" y="14" width="400" height="16" fill="var(--bg-card)" stroke="var(--border)" />
        {/* Dry Spacecraft Mass */}
        <rect
          x="0"
          y="15"
          width={`${Math.max(1, (dryKg / scaleMax) * 400)}`}
          height="14"
          fill={overBus || overLv ? 'var(--err)' : 'var(--accent)'}
          opacity="0.88"
        />
        {/* Ballast if any */}
        {ballastKg > 0 && (
          <rect
            x={`${(dryKg / scaleMax) * 400}`}
            y="15"
            width={`${(ballastKg / scaleMax) * 400}`}
            height="14"
            fill="var(--warn)"
            opacity="0.7"
          />
        )}
        {/* Bus Limit Line */}
        {busLimitKg > 0 && (
          <line
            x1={(busLimitKg / scaleMax) * 400}
            y1="8"
            x2={(busLimitKg / scaleMax) * 400}
            y2="36"
            stroke="var(--accent-2)"
            strokeWidth="2"
          />
        )}
        {/* LV Orbit Capacity Line */}
        {lvCapKg > 0 && (
          <line
            x1={(lvCapKg / scaleMax) * 400}
            y1="6"
            x2={(lvCapKg / scaleMax) * 400}
            y2="38"
            stroke="var(--warn)"
            strokeWidth="2"
            strokeDasharray="3,2"
          />
        )}
        <text x="2" y="48" fontSize="10" fill="var(--text-dim)" fontFamily="monospace">
          0 kg
        </text>
        <text x="150" y="48" fontSize="10" fill="var(--accent-2)" fontFamily="monospace">
          | BusMax ({busLimitKg.toFixed(0)})
        </text>
        <text x="285" y="48" fontSize="10" fill="var(--warn)" fontFamily="monospace">
          : LV ({lvCapKg.toFixed(0)}{lvCapLibKg !== lvCapKg ? ` / lib ${lvCapLibKg}` : ''})
        </text>
      </svg>
      <div className="small muted" style={{ marginTop: 2 }}>
        Cost: ${Number(metrics?.['cost.total_musd'] || 0).toFixed(1)}M | Power Margin:{' '}
        {pct(Number(metrics?.['power.margin_pct'] || 0))} | Pointing:{' '}
        {Number(metrics?.['adcs.pointing_deg'] || 0).toFixed(3)}°
      </div>
    </div>
  );
}
