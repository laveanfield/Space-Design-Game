import React, { useEffect, useRef, useState } from 'react';
import { playSoundAsset } from '../api/client';
import OrbitOps3DCanvas from './OrbitOps3DCanvas';
import EvidenceGallery from './EvidenceGallery';
import HumanityImpactCard from './HumanityImpactCard';

/**
 * CampaignPanels -- cac bang telemetry CRT Terminal dung chung giua man che tao, quy dao 12 moc va tong ket.
 */

export function tx(value) {
  if (value == null) return '';
  if (typeof value === 'object') return value.vi || value.en || '';
  return String(value);
}

const num = (v, digits = 1) => (Number.isFinite(Number(v)) ? Number(v).toFixed(digits) : '-');

/** Bang quan ly ngan sach, han chot (co tinh them phan mo khoa tu Chat van Sep) va uy tin. */
export function BossPanel({
  scenario,
  metrics,
  reputation,
  attempts,
  budgetBonus = 0,
  deadlineBonus = 0,
}) {
  const cost = Number(metrics?.['cost.total_musd'] || 0);
  const budget = Number(scenario?.budget_musd || 0) + Number(budgetBonus || 0);
  const months = Number(metrics?.['schedule.months'] || 0);
  const deadline = Number(scenario?.deadline_months || 0) + Number(deadlineBonus || 0);
  const bar = (v, max) => `${Math.min(100, max ? (v / max) * 100 : 0)}%`;
  const overBudget = Boolean(budget && cost > budget);
  const overTime = Boolean(deadline && months > deadline);
  const inspectCut = overTime ? Math.min(30, (months - deadline) * 5) : 0;

  return (
    <div className="boss-panel">
      <div className="row-between">
        <strong className="small">DIR-01 CONSTRAINTS // AUTHORITY</strong>
        <span className="rep-pips" title="Uy tín với Sếp: mất tên lửa hoặc vệ tinh → trừ 1 vạch. Hết 3 vạch → hủy dự án.">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`rep-pip ${i < reputation ? 'on' : ''}`} />
          ))}
        </span>
        <span className="small muted">ATTEMPT #{attempts + 1}</span>
      </div>
      <div className="boss-meter" title="Chi phí thiết kế / Ngân sách cho phép">
        <span className="small muted">BUDG</span>
        <div className="gauge-bar">
          <div className={`gauge-fill ${overBudget ? 'err' : ''}`} style={{ width: bar(cost, budget) }} />
        </div>
        <b className={overBudget ? 'over' : ''}>
          ${num(cost)}/{budget || '-'}M
        </b>
      </div>
      <div className="boss-meter" title="Thời gian đặt linh kiện / Hạn chót (vượt hạn sẽ bị trừ giờ kiểm định)">
        <span className="small muted">DEAD</span>
        <div className="gauge-bar">
          <div className={`gauge-fill ${overTime ? 'warn' : ''}`} style={{ width: bar(months, deadline) }} />
        </div>
        <b className={overTime ? 'over' : ''}>
          {num(months, 0)}/{deadline || '-'} MO
        </b>
      </div>
      {overTime && (
        <div className="small err-text" style={{ marginTop: 4 }}>
          ! TRỄ HẠN {num(months - deadline, 0)} THÁNG → GIỜ SOI LỖI GIẢM -{inspectCut}s
        </div>
      )}
    </div>
  );
}

/** 4 thanh chi so song con 10-nac kieu Terminal (POWER, MASS, SIGNAL, INTEGRITY). */
export function CoreTelemetryBars({ bars }) {
  if (!bars) return null;
  const rows = [
    ['POWER', bars.power, 'Cân bằng điện phát / tiêu thụ & dự trữ vùng tối'],
    ['MASS', bars.mass, 'Khối lượng tàu so với tải trọng tên lửa & khung'],
    ['SIGNAL', bars.signal, 'Tốc độ truyền dữ liệu & độ chính xác chỉ hướng'],
    ['INTEGRITY', bars.integrity, 'Độ bền bức xạ & tuổi thọ quỹ đạo'],
  ];
  return (
    <div className="core-bars-panel" title="4 chỉ số sinh tồn hệ thống (chưa gồm lỗi lắp ráp ngẫu nhiên)">
      <div className="small muted" style={{ marginBottom: 6 }}>
        SYSTEM INTEGRITY METERS [NO SCIENCE]
      </div>
      {rows.map(([label, item, tip]) => {
        const pct = Math.max(0, Math.min(100, item?.pct ?? 0));
        const activePips = Math.round(pct / 10);
        const cls = item?.status || 'ok';
        return (
          <div key={label} className="seg-row" title={tip}>
            <span className="seg-label">{label}</span>
            <div className="seg-pips">
              {Array.from({ length: 10 }, (_, idx) => (
                <span key={idx} className={`seg-pip ${idx < activePips ? `on ${cls}` : ''}`} />
              ))}
            </div>
            <span className={`seg-val ${cls}`}>{item?.tag || `${pct.toFixed(0)}%`}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Bang thong so datasheet tho (da bo diem science). */
export function DatasheetTotals({ metrics }) {
  if (!metrics) return null;
  const rows = [
    ['MASS_DRY', 'Khối lượng khô', `${num(metrics['mass.dry_kg'], 1)} kg`],
    ['PWR_GEN', 'Điện phát TB', `${num(metrics['power.gen_avg_w'])} W`],
    ['PWR_LOAD', 'Tải tiêu thụ', `${num(metrics['power.load_w'])} W`],
    ['DATA_GEN', 'Sinh dữ liệu', `${num(metrics['data.generated_gb_per_day'], 2)} GB/d`],
    ['DOWNLINK', 'Băng thông', `${num(metrics['comm.downlink_mbps'], 2)} Mbps`],
    ['ORBIT_ALT', 'Độ cao', `${num(metrics['orbit.altitude_km'], 0)} km`],
  ];
  return (
    <div className="datasheet" title="Cộng số liệu phần cứng thô — chưa kiểm chứng trên quỹ đạo">
      <div className="datasheet-grid">
        {rows.map(([code, name, v]) => (
          <div key={code} className="datasheet-cell" title={name}>
            <span className="ds-code">{code}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/** So tay ky su: bai hoc tu cac chuyen bay truoc (luu trong trinh duyet). */
export function Logbook({ entries }) {
  return (
    <div className="logbook">
      <div className="small muted" style={{ marginBottom: 4 }}>
        FLIGHT INCIDENT LOG ({entries.length})
      </div>
      {entries.length === 0 && <div className="small muted">— NO LOG ENTRIES —</div>}
      <div className="constraint-list" style={{ maxHeight: 200 }}>
        {entries.map((e) => (
          <div key={e.n} className={`constraint-row ${e.success ? 'pass' : 'fail'}`}>
            <div className="row-between small">
              <strong>
                #{e.n} • {e.headline}
              </strong>
              <span className="muted">{e.when}</span>
            </div>
            <div className="small muted">{e.build}</div>
            {e.lesson && (
              <div className="small" style={{ marginTop: 2 }}>
                → {e.lesson}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Ho so nguyen nhan goc (chi hien SAU khi hau qua da xay ra). */
export function Dossier({ dossier }) {
  if (!dossier) return null;
  return (
    <div className="dossier">
      <div className="dossier-title">FAILURE: {tx(dossier.title)}</div>
      {dossier.subsystem && <div className="small muted">SUB-SYSTEM: {dossier.subsystem}</div>}
      <p className="small" style={{ margin: '8px 0' }}>
        <strong>ROOT-CAUSE:</strong> {tx(dossier.cause)}
      </p>
      {(dossier.numbers || []).length > 0 && (
        <div className="dossier-numbers">
          {dossier.numbers.map((n) => (
            <div key={n.label} className="row-between small">
              <span className="muted">{n.label}</span>
              <strong>
                {String(n.value)}
                {n.unit ? ` ${n.unit}` : ''}
              </strong>
            </div>
          ))}
        </div>
      )}
      {tx(dossier.lesson) && (
        <p className="small" style={{ margin: '8px 0 0 0' }}>
          <strong>BÀI HỌC:</strong> {tx(dossier.lesson)}
        </p>
      )}
    </div>
  );
}

const EVENT_SOUND = {
  SOLAR_STORM: '08-11-2026-seu_crackle.wav',
  SEU_RESET: '08-11-2026-reboot_beeps.wav',
  BROWNOUT: '08-11-2026-power_down.wav',
  BUFFER_FULL: '08-11-2026-data_glitch.wav',
  BLUR: '08-11-2026-static_noise.wav',
  DECAY: '08-11-2026-gyro_whine.wav',
};

/** 12 moc tren quy dao: vong doi ve tinh chay dan, dong ho rung theo so lieu that. */
export function LifePhase({ life, design, catalog, audioOn, onDone }) {
  const [shown, setShown] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const audioRef = useRef(audioOn);
  audioRef.current = audioOn;
  const total = life.steps.length;
  const finished = shown >= total;
  const cur = shown > 0 ? life.steps[shown - 1] : null;
  const dead = Boolean(cur && !cur.alive);

  useEffect(() => {
    setShown(0);
  }, [life]);

  useEffect(() => {
    if (finished || paused) return undefined;
    const id = setTimeout(() => {
      const step = life.steps[shown];
      const crit = step.events.find((e) => e.level === 'crit');
      const warn = step.events.find((e) => e.level === 'warn');
      if (crit) {
        playSoundAsset(audioRef.current, '08-11-2026-alarm.wav', 0.35);
        playSoundAsset(audioRef.current, '08-11-2026-link_lost.wav', 0.3);
      } else if (warn) {
        playSoundAsset(audioRef.current, EVENT_SOUND[warn.code] || '06-11-2026-blip.wav', 0.28);
      } else if (step.events.some((e) => e.code === 'EVIDENCE_OK')) {
        playSoundAsset(audioRef.current, '06-11-2026-chime.wav', 0.35);
      } else if (step.events.some((e) => e.code === 'FIRE_CAPTURED')) {
        playSoundAsset(audioRef.current, '08-11-2026-shutter.wav', 0.35);
      } else {
        playSoundAsset(audioRef.current, '08-11-2026-link_regained.wav', 0.12);
      }
      setShown((s) => s + 1);
    }, shown === 0 ? 700 : 1400 / speed);
    return () => clearTimeout(id);
  }, [shown, finished, paused, speed, life]);

  const snapshot = {
    auto: true,
    dead,
    link: {
      state: dead ? 'DEGRADED' : cur?.events.some((e) => e.level === 'warn') ? 'MARGINAL' : 'LOCK',
      station: 'GS',
    },
    power: { eclipse: false },
  };
  const soc = cur ? cur.soc : 1;
  const doseFrac = cur ? Math.min(1, cur.dose_krad / Math.max(1e-6, cur.tolerance_krad)) : 0;
  const alt0 = life.steps[0]?.alt_km || 1;
  const feed = life.steps
    .slice(0, shown)
    .flatMap((s) => s.events.map((e) => ({ ...e, month: s.month, k: s.k })))
    .reverse();

  return (
    <div className="phase-stage">
      <div className="phase-header-plaques row-between-wide">
        <div className="rivet-plaque title">PHASE 3 ORBIT SIMULATION // DEPT. OF ORBITAL SURVEILLANCE</div>
        <div className={`rivet-plaque ${dead ? 'crit' : ''}`}>
          {dead ? '⚠ SIMULATION HALTED' : cur ? `MONTH ${cur.month} / ${life.steps_total}` : 'DEPLOYING...'}
        </div>
      </div>

      <div className="ops-grid">
        <section className={`panel ${dead ? 'halted' : ''}`} data-tutorial="orbit-canvas">
          <h2 className="panel-title">
            <span>ORBIT SURVEILLANCE // {total === life.steps_total && !dead ? `${life.steps_total} MỐC` : 'VÒNG ĐỜI'}</span>
            <span className={`badge ${dead ? 'err' : 'info'}`}>{cur ? `THÁNG ${cur.month}` : 'TÁCH VỆ TINH'}</span>
          </h2>
          <OrbitOps3DCanvas snapshot={snapshot} design={design} catalog={catalog} />
          <div className="life-timeline">
            {Array.from({ length: life.steps_total }, (_, i) => {
              const s = life.steps[i];
              const state =
                i >= shown ? '' : s && !s.alive ? 'dead' : s?.events.some((e) => e.level === 'warn') ? 'warn' : 'ok';
              return (
                <div key={i} className={`life-seg ${state} ${i === shown - 1 ? 'now' : ''}`}>
                  <span>{i + 1}</span>
                </div>
              );
            })}
          </div>
          {dead && <div className="halt-banner">⚠ SIMULATION HALTED — MẤT VỆ TINH Ở THÁNG {cur.month}</div>}
          {finished && (
            <div style={{ marginTop: 10 }}>
              <HumanityImpactCard
                missionId={design?.mission}
                success={Boolean(life.outcome?.success)}
                failureId={life.dossier?.id || life.outcome?.killer || life.outcome?.review_fail?.[0] || 'launch'}
                outcome={life.outcome}
                compact
              />
            </div>
          )}
          <div className="row-between" style={{ marginTop: 10 }}>
            <div className="row-wrap">
              <button className="btn" disabled={finished} onClick={() => setPaused((p) => !p)}>
                {paused ? 'RESUME' : 'PAUSE'}
              </button>
              {[1, 3].map((w) => (
                <button key={w} className={`btn ${speed === w ? 'primary' : ''}`} onClick={() => setSpeed(w)}>
                  {w}x
                </button>
              ))}
            </div>
            <button
              className="btn primary hazard hazard-cta"
              data-tutorial="orbit-next"
              disabled={!finished}
              onClick={onDone}
            >
              [ {dead ? 'PRESENT PROOF TO DIRECTOR' : 'HỌP TỔNG KẾT VỚI SẾP'} ]
            </button>
          </div>
        </section>

        <section className="panel" data-tutorial="orbit-telemetry">
        <h2 className="panel-title">
          <span>ORBIT TELEMETRY STREAM</span>
          <span className="small muted">{cur ? `STEP ${cur.k}/${life.steps_total}` : '...'}</span>
        </h2>
        <div className="telemetry-grid">
          <div className="kpi-box">
            <div className="kpi-label">BATTERY SOC</div>
            <div className="kpi-val">{(soc * 100).toFixed(0)}%</div>
            <div className="gauge-bar">
              <div className={`gauge-fill ${soc < 0.3 ? 'err' : ''}`} style={{ width: `${soc * 100}%` }} />
            </div>
            <div className="small muted">MARGIN {cur ? num(cur.margin_w) : '-'} W</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">RADIATION DOSE</div>
            <div className="kpi-val">{cur ? num(cur.dose_krad, 2) : '0'} krad</div>
            <div className="gauge-bar">
              <div className={`gauge-fill ${doseFrac > 0.8 ? 'err' : ''}`} style={{ width: `${doseFrac * 100}%` }} />
            </div>
            <div className="small muted">TOL {cur ? num(cur.tolerance_krad, 0) : '-'} krad</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">ORBIT ALTITUDE</div>
            <div className="kpi-val">{cur ? num(cur.alt_km, 0) : num(alt0, 0)} km</div>
            <div className="gauge-bar">
              <div
                className="gauge-fill"
                style={{ width: `${Math.min(100, ((cur ? cur.alt_km : alt0) / alt0) * 100)}%` }}
              />
            </div>
            <div className="small muted">DEPLOY {num(alt0, 0)} km</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">DATA DOWNLINK</div>
            <div className="kpi-val">{cur ? num(cur.delivered_gb, 2) : '0'} GB</div>
            <div className="gauge-bar">
              <div
                className="gauge-fill"
                style={{
                  width: `${cur ? Math.min(100, (cur.delivered_gb / Math.max(1e-6, cur.delivered_gb + cur.lost_gb)) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="small muted">LOST {cur ? num(cur.lost_gb, 2) : '0'} GB</div>
          </div>
        </div>
        {life.imaging && (
          <div style={{ marginTop: 10 }}>
            <EvidenceGallery
              evidence={life.evidence || []}
              need={life.evidence_need}
              step={cur ? cur.k : 0}
              sensorName={life.imaging.name}
              imaging={life.imaging}
              altKm={cur ? cur.alt_km : alt0}
            />
          </div>
        )}
        <div className="small muted" style={{ margin: '10px 0 4px 0' }}>
          ORBIT EVENT LOG
        </div>
        <div className="constraint-list" style={{ maxHeight: 220 }}>
          {feed.map((e, i) => (
            <div key={i} className={`constraint-row small ${e.level === 'crit' ? 'fail' : e.level === 'warn' ? 'warnrow' : 'pass'}`}>
              <span className="muted">[M{e.month}]</span> {tx(e.text)}
            </div>
          ))}
          {feed.length === 0 && <div className="small muted">AWAITING FIRST TELEMETRY PACKET...</div>}
        </div>
      </section>
      </div>
    </div>
  );
}
