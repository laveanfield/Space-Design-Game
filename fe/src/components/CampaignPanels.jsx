import React, { useEffect, useRef, useState } from 'react';
import { playSoundAsset } from '../api/client';
import { useGame } from '../core/GameContext';
import { localizeLogText, tr, tx as baseTx } from '../core/i18n';
import OrbitOps3DCanvas from './OrbitOps3DCanvas';
import EvidenceGallery from './EvidenceGallery';
import HumanityImpactCard from './HumanityImpactCard';

/**
 * CampaignPanels -- cac bang telemetry CRT Terminal dung chung giua man che tao, quy dao 12 moc va tong ket.
 */

export function tx(value, lang = 'vi') {
  return baseTx(value, lang);
}

function cleanEventText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\((?:SEU|LATCH-UP|NO SCIENCE|AUTO-CALC)\)/gi, '')
    .replace(/[()[\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
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
  const { lang } = useGame();
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
        <strong className="small">{tr(lang, 'RÀNG BUỘC KẾ TOÁN // QUYỀN HẠN', 'DIRECTOR CONSTRAINTS // AUTHORITY')}</strong>
        <span
          className="rep-pips"
          title={tr(
            lang,
            'Uy tín với Sếp: mất tên lửa hoặc vệ tinh sẽ bị trừ 1 vạch. Hết 3 vạch sẽ hủy chiến dịch.',
            'Director Authority: losing rocket or spacecraft deducts 1 pip. 0 pips aborts campaign.'
          )}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className={`rep-pip ${i < reputation ? 'on' : ''}`} />
          ))}
        </span>
        <span className="small muted">
          {tr(lang, 'LẦN THỬ', 'ATTEMPT')} #{attempts + 1}
        </span>
      </div>
      <div className="boss-meter" title={tr(lang, 'Chi phí thiết kế / Ngân sách cho phép', 'Design cost / Authorized budget')}>
        <span className="small muted">{tr(lang, 'NGÂN SÁCH', 'BUDG')}</span>
        <div className="gauge-bar">
          <div className={`gauge-fill ${overBudget ? 'err' : ''}`} style={{ width: bar(cost, budget) }} />
        </div>
        <b className={overBudget ? 'over' : ''}>
          ${num(cost)}/{budget || '-'}M
        </b>
      </div>
      <div
        className="boss-meter"
        title={tr(lang, 'Thời gian đặt linh kiện / Hạn chót: trễ hạn sẽ bị trừ giờ kiểm định', 'Lead time / Deadline: delays reduce inspection window')}
      >
        <span className="small muted">{tr(lang, 'HẠN CHÓT', 'DEAD')}</span>
        <div className="gauge-bar">
          <div className={`gauge-fill ${overTime ? 'warn' : ''}`} style={{ width: bar(months, deadline) }} />
        </div>
        <b className={overTime ? 'over' : ''}>
          {num(months, 0)}/{deadline || '-'} {tr(lang, 'THÁNG', 'MO')}
        </b>
      </div>
      {overTime && (
        <div className="small err-text" style={{ marginTop: 4 }}>
          ! {tr(lang, 'TRỄ HẠN', 'OVERDUE')} {num(months - deadline, 0)} {tr(lang, 'THÁNG → GIỜ SOI LỖI GIẢM', 'MO → INSPECTION REDUCED')} -{inspectCut}s
        </div>
      )}
    </div>
  );
}

/** 4 thanh chi so song con 10-nac kieu Terminal (POWER, MASS, SIGNAL, INTEGRITY). */
export function CoreTelemetryBars({ bars }) {
  const { lang } = useGame();
  if (!bars) return null;
  const rows = [
    ['POWER', bars.power, tr(lang, 'Cân bằng điện phát, tiêu thụ và dự trữ vùng tối', 'Power generation, load balance and eclipse margin')],
    ['MASS', bars.mass, tr(lang, 'Khối lượng tàu so với tải trọng tên lửa và khung', 'Spacecraft mass vs launch vehicle and bus limits')],
    ['SIGNAL', bars.signal, tr(lang, 'Tốc độ truyền dữ liệu và độ chính xác chỉ hướng', 'Data transmission speed and pointing accuracy')],
    ['INTEGRITY', bars.integrity, tr(lang, 'Độ bền bức xạ và tuổi thọ quỹ đạo', 'Radiation tolerance and orbital lifetime')],
  ];
  return (
    <div
      className="core-bars-panel"
      title={tr(lang, '4 chỉ số sinh tồn hệ thống — chưa gồm lỗi lắp ráp ngẫu nhiên', '4 system survival meters — excludes random assembly defects')}
    >
      <div className="small muted" style={{ marginBottom: 6 }}>
        {tr(lang, 'CHỈ SỐ SINH TỒN HỆ THỐNG', 'SYSTEM INTEGRITY METERS')}
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
  const { lang } = useGame();
  if (!metrics) return null;
  const rows = [
    ['MASS_DRY', tr(lang, 'Khối lượng khô', 'Dry Mass'), `${num(metrics['mass.dry_kg'], 1)} kg`],
    ['PWR_GEN', tr(lang, 'Điện phát TB', 'Avg Power Gen'), `${num(metrics['power.gen_avg_w'])} W`],
    ['PWR_LOAD', tr(lang, 'Tải tiêu thụ', 'Power Load'), `${num(metrics['power.load_w'])} W`],
    ['DATA_GEN', tr(lang, 'Sinh dữ liệu', 'Data Gen'), `${num(metrics['data.generated_gb_per_day'], 2)} GB/d`],
    ['DOWNLINK', tr(lang, 'Băng thông', 'Downlink'), `${num(metrics['comm.downlink_mbps'], 2)} Mbps`],
    ['ORBIT_ALT', tr(lang, 'Độ cao', 'Altitude'), `${num(metrics['orbit.altitude_km'], 0)} km`],
  ];
  return (
    <div
      className="datasheet"
      title={tr(lang, 'Cộng số liệu phần cứng thô — chưa kiểm chứng trên quỹ đạo', 'Raw hardware metrics — unverified in orbit')}
    >
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
  const { lang } = useGame();
  return (
    <div className="logbook">
      <div className="small muted" style={{ marginBottom: 4 }}>
        {tr(lang, 'NHẬT KÝ SỰ CỐ BAY', 'FLIGHT INCIDENT LOG')} • {entries.length}
      </div>
      {entries.length === 0 && (
        <div className="small muted">— {tr(lang, 'CHƯA CÓ NHẬT KÝ', 'NO LOG ENTRIES')} —</div>
      )}
      <div className="constraint-list" style={{ maxHeight: 200 }}>
        {entries.map((e) => {
          const headlineText = localizeLogText(e.headline, lang);
          const lessonText = localizeLogText(e.lesson, lang);
          return (
            <div key={e.n} className={`constraint-row ${e.success ? 'pass' : 'fail'}`}>
              <div className="row-between small">
                <strong>
                  #{e.n} • {headlineText}
                </strong>
                <span className="muted">{e.when}</span>
              </div>
              <div className="small muted">{e.build}</div>
              {lessonText && (
                <div className="small" style={{ marginTop: 2 }}>
                  → {lessonText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Ho so nguyen nhan goc (chi hien SAU khi hau qua da xay ra). */
export function Dossier({ dossier }) {
  const { lang } = useGame();
  if (!dossier) return null;
  const titleText = localizeLogText(dossier.title, lang);
  const causeText = localizeLogText(dossier.cause, lang);
  const lessonText = localizeLogText(dossier.lesson, lang);
  return (
    <div className="dossier">
      <div className="dossier-title">
        {tr(lang, 'SỰ CỐ:', 'FAILURE:')} {titleText}
      </div>
      {dossier.subsystem && (
        <div className="small muted">
          {tr(lang, 'PHÂN HỆ:', 'SUB-SYSTEM:')} {dossier.subsystem}
        </div>
      )}
      <p className="small" style={{ margin: '8px 0' }}>
        <strong>{tr(lang, 'NGUYÊN NHÂN GỐC:', 'ROOT-CAUSE:')}</strong> {causeText}
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
      {lessonText && (
        <p className="small" style={{ margin: '8px 0 0 0' }}>
          <strong>{tr(lang, 'BÀI HỌC:', 'LESSON:')}</strong> {lessonText}
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
  const { lang } = useGame();
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
        <div className="rivet-plaque title">
          {tr(lang, 'GIAI ĐOẠN 3 MÔ PHỎNG QUỸ ĐẠO // GIÁM SÁT VẬN HÀNH', 'PHASE 3 ORBIT SIMULATION // ORBITAL SURVEILLANCE')}
        </div>
        <div className={`rivet-plaque ${dead ? 'crit' : ''}`}>
          {dead
            ? tr(lang, '⚠ MÔ PHỎNG DỪNG', '⚠ SIMULATION HALTED')
            : cur
              ? `${tr(lang, 'THÁNG', 'MONTH')} ${cur.month} / ${life.steps_total}`
              : tr(lang, 'ĐANG TRIỂN KHAI...', 'DEPLOYING...')}
        </div>
      </div>

      <div className="ops-grid">
        <section className={`panel ${dead ? 'halted' : ''}`} data-tutorial="orbit-canvas">
          <h2 className="panel-title">
            <span>
              {tr(lang, 'GIÁM SÁT QUỸ ĐẠO //', 'ORBIT SURVEILLANCE //')}{' '}
              {total === life.steps_total && !dead
                ? `${life.steps_total} ${tr(lang, 'MỐC', 'STEPS')}`
                : tr(lang, 'VÒNG ĐỜI', 'LIFECYCLE')}
            </span>
            <span className={`badge ${dead ? 'err' : 'info'}`}>
              {cur ? `${tr(lang, 'THÁNG', 'MONTH')} ${cur.month}` : tr(lang, 'TÁCH VỆ TINH', 'SEPARATION')}
            </span>
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
          {dead && (
            <div className="halt-banner">
              ⚠ {tr(lang, 'MÔ PHỎNG DỪNG — MẤT VỆ TINH Ở THÁNG', 'SIMULATION HALTED — SATELLITE LOST AT MONTH')} {cur.month}
            </div>
          )}
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
                {paused ? tr(lang, 'TIẾP TỤC', 'RESUME') : tr(lang, 'TẠM DỪNG', 'PAUSE')}
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
              ▶ {dead ? tr(lang, 'TRÌNH BẰNG CHỨNG CHO SẾP', 'PRESENT PROOF TO DIRECTOR') : tr(lang, 'HỌP TỔNG KẾT VỚI SẾP', 'MISSION DEBRIEF WITH DIRECTOR')}
            </button>
          </div>
        </section>

        <section className="panel" data-tutorial="orbit-telemetry">
          <h2 className="panel-title">
            <span>{tr(lang, 'DÒNG DỮ LIỆU ĐO XA QUỸ ĐẠO', 'ORBIT TELEMETRY STREAM')}</span>
            <span className="small muted">
              {cur ? `${tr(lang, 'BƯỚC', 'STEP')} ${cur.k}/${life.steps_total}` : '...'}
            </span>
          </h2>
          <div className="telemetry-grid">
            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'MỨC PIN', 'BATTERY SOC')}</div>
              <div className="kpi-val">{(soc * 100).toFixed(0)}%</div>
              <div className="gauge-bar">
                <div className={`gauge-fill ${soc < 0.3 ? 'err' : ''}`} style={{ width: `${soc * 100}%` }} />
              </div>
              <div className="small muted">
                {tr(lang, 'DƯ NGUỒN', 'MARGIN')} {cur ? num(cur.margin_w) : '-'} W
              </div>
            </div>
            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'LIỀU BỨC XẠ', 'RADIATION DOSE')}</div>
              <div className="kpi-val">{cur ? num(cur.dose_krad, 2) : '0'} krad</div>
              <div className="gauge-bar">
                <div className={`gauge-fill ${doseFrac > 0.8 ? 'err' : ''}`} style={{ width: `${doseFrac * 100}%` }} />
              </div>
              <div className="small muted">
                {tr(lang, 'CHỊU ĐƯỢC', 'TOL')} {cur ? num(cur.tolerance_krad, 0) : '-'} krad
              </div>
            </div>
            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'ĐỘ CAO QUỸ ĐẠO', 'ORBIT ALTITUDE')}</div>
              <div className="kpi-val">{cur ? num(cur.alt_km, 0) : num(alt0, 0)} km</div>
              <div className="gauge-bar">
                <div
                  className="gauge-fill"
                  style={{ width: `${Math.min(100, ((cur ? cur.alt_km : alt0) / alt0) * 100)}%` }}
                />
              </div>
              <div className="small muted">
                {tr(lang, 'PHÓNG ĐẾN', 'DEPLOY')} {num(alt0, 0)} km
              </div>
            </div>
            <div className="kpi-box">
              <div className="kpi-label">{tr(lang, 'DỮ LIỆU ĐÃ TRUYỀN', 'DATA DOWNLINK')}</div>
              <div className="kpi-val">{cur ? num(cur.delivered_gb, 2) : '0'} GB</div>
              <div className="gauge-bar">
                <div
                  className="gauge-fill"
                  style={{
                    width: `${cur ? Math.min(100, (cur.delivered_gb / Math.max(1e-6, cur.delivered_gb + cur.lost_gb)) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="small muted">
                {tr(lang, 'MẤT', 'LOST')} {cur ? num(cur.lost_gb, 2) : '0'} GB
              </div>
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
            {tr(lang, 'NHẬT KÝ SỰ KIỆN QUỸ ĐẠO', 'ORBIT EVENT LOG')}
          </div>
          <div className="constraint-list" style={{ maxHeight: 220 }}>
            {feed.map((e, i) => (
              <div
                key={i}
                className={`constraint-row small ${e.level === 'crit' ? 'fail' : e.level === 'warn' ? 'warnrow' : 'pass'}`}
              >
                <span className="muted">M{e.month} • </span> {cleanEventText(tx(e.text, lang))}
              </div>
            ))}
            {feed.length === 0 && (
              <div className="small muted">
                {tr(lang, 'ĐANG CHỜ GÓI DỮ LIỆU ĐO XA ĐẦU TIÊN...', 'AWAITING FIRST TELEMETRY PACKET...')}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
