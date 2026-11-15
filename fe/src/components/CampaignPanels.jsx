import React, { useEffect, useRef, useState } from 'react';
import { playSoundAsset } from '../api/client';
import { useGame } from '../core/GameContext';
import { localizeLogText, tr, tx as baseTx } from '../core/i18n';
import OrbitOps3DCanvas from './OrbitOps3DCanvas';
import EvidenceGallery, { fmtSize } from './EvidenceGallery';
import OrbitEventLog from './OrbitEventLog';

/**
 * CampaignPanels -- cac bang telemetry CRT Terminal dung chung giua man che tao, quy dao 12 moc va tong ket.
 */

export function tx(value, lang = 'en') {
  return baseTx(value, lang);
}

function cleanEventText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\((?:SEU|LATCH-UP|NO SCIENCE|AUTO-CALC|Cài trực tiếp|SIMULATION)\)/gi, '')
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
        <strong className="small">
          {tr(lang, 'RÀNG BUỘC KẾ TOÁN // QUYỀN HẠN', 'DIR-01 CONSTRAINTS // AUTHORITY')}
        </strong>
        <span
          className="rep-pips"
          title={tr(
            lang,
            'Uy tín với Sếp: mất tên lửa hoặc vệ tinh sẽ bị trừ 1 vạch. Hết 3 vạch sẽ hủy chiến dịch.',
            'Director Reputation: losing a rocket or satellite deducts 1 pip. Losing all 3 cancels the program.'
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
      <div className="boss-meter" title={tr(lang, 'Chi phí thiết kế / Ngân sách cho phép', 'Design Cost vs. Approved Budget')}>
        <div className="boss-meter-head">
          <span className="small muted">{tr(lang, 'NGÂN SÁCH', 'BUDGET')}</span>
          <b className={overBudget ? 'over' : ''}>
            ${num(cost)}/{budget || '-'}M
          </b>
        </div>
        <div className="gauge-bar">
          <div className={`gauge-fill ${overBudget ? 'err' : ''}`} style={{ width: bar(cost, budget) }} />
        </div>
      </div>
      <div
        className="boss-meter"
        title={tr(lang, 'Thời gian đặt linh kiện / Hạn chót: trễ hạn sẽ bị trừ giờ kiểm định', 'Procurement Lead Time vs. Deadline (late delivery cuts inspection time)')}
      >
        <div className="boss-meter-head">
          <span className="small muted">{tr(lang, 'HẠN CHÓT', 'DEADLINE')}</span>
          <b className={overTime ? 'over' : ''}>
            {num(months, 0)}/{deadline || '-'} {tr(lang, 'THÁNG', 'MO')}
          </b>
        </div>
        <div className="gauge-bar">
          <div className={`gauge-fill ${overTime ? 'warn' : ''}`} style={{ width: bar(months, deadline) }} />
        </div>
      </div>
      {overTime && (
        <div className="small err-text" style={{ marginTop: 4 }}>
          ⚠ {tr(lang, 'TRỄ HẠN', 'OVERDUE BY')} {num(months - deadline, 0)} {tr(lang, 'THÁNG — GIỜ SOI LỖI GIẢM', 'MO — INSPECTION TIME')} -{inspectCut}s
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
    ['POWER', bars.power, tr(lang, 'Cân bằng điện phát, tiêu thụ và dự trữ vùng tối', 'Power generation vs. load balance and eclipse reserve')],
    ['MASS', bars.mass, tr(lang, 'Khối lượng tàu so với tải trọng tên lửa và khung', 'Spacecraft mass against launcher payload and bus limit')],
    ['SIGNAL', bars.signal, tr(lang, 'Tốc độ truyền dữ liệu và độ chính xác chỉ hướng', 'Downlink data rate and pointing accuracy')],
    ['INTEGRITY', bars.integrity, tr(lang, 'Độ bền bức xạ và tuổi thọ quỹ đạo', 'Radiation tolerance and orbital lifetime')],
  ];
  return (
    <div
      className="core-bars-panel"
      title={tr(lang, '4 chỉ số sinh tồn hệ thống — chưa gồm lỗi lắp ráp ngẫu nhiên', '4 Core Survivability Indices (excluding random assembly defects)')}
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
    ['DOWNLINK', tr(lang, 'Băng thông', 'Downlink Rate'), `${num(metrics['comm.downlink_mbps'], 2)} Mbps`],
    ['ORBIT_ALT', tr(lang, 'Độ cao', 'Altitude'), `${num(metrics['orbit.altitude_km'], 0)} km`],
  ];
  return (
    <div
      className="datasheet"
      title={tr(lang, 'Cộng số liệu phần cứng thô — chưa kiểm chứng trên quỹ đạo', 'Nominal combined hardware specs — unverified in orbit')}
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
                  - {lessonText}
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
          <strong>{tr(lang, 'BÀI HỌC:', 'LESSON LEARNED:')}</strong> {lessonText}
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
export function LifePhase({
  life,
  design,
  catalog,
  audioOn,
  onDone,
  onReturnCampaign,
  tutorialMode = false,
  tutorialPaused = false,
  onResumeFromTutorial,
  onTutorialFinishStep,
}) {
  const { lang } = useGame();
  const [shown, setShown] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const audioRef = useRef(audioOn);
  audioRef.current = audioOn;
  const finishNotifiedRef = useRef(false);
  const total = life.steps.length;
  const finished = shown >= total;
  const effectivePaused = paused || (!finished && tutorialPaused);
  const cur = shown > 0 ? life.steps[shown - 1] : null;
  const dead = Boolean(cur && !cur.alive);
  const communications = life.communications;
  const commTime = communications ? communications.duration_s * Math.min(1, shown / Math.max(1, total)) : 0;
  const commSample = communications?.samples?.findLast((sample) => sample.t_s <= commTime) || null;
  const commEvidenceNow = (communications?.evidence || []).filter((shot) => shot.t_s <= commTime);
  const capturedNow = commEvidenceNow.length;
  const deliveredNow = commEvidenceNow.filter((shot) => shot.delivered_t_s != null && shot.delivered_t_s <= commTime).length;
  const usableEvidenceNow = commEvidenceNow.filter(
    (shot) => shot.delivered_t_s != null && shot.delivered_t_s <= commTime && shot.blur < 0.35
  ).length;
  const bufferGbNow = Number(commSample?.buffer_gb || 0);
  const storageCapacityGb = Number(communications?.summary?.storage_capacity_gb || 0);
  const downlinkMbps = Number(catalog?.tables?.comms?.[design?.comm]?.downlink_mbps || 0)
    * Number(communications?.settings?.rate_scale || 1);
  const contactsNow = (communications?.windows || []).filter((window) => window.start_s <= commTime).length;
  const usableMinutesNow = (communications?.samples || []).filter(
    (sample) => sample.t_s <= commTime && Number(sample.margin_db) >= 3
  ).length * Number(communications?.dt_s || 0) / 60;
  const minSocNow = (communications?.samples || [])
    .filter((sample) => sample.t_s <= commTime)
    .reduce((minimum, sample) => Math.min(minimum, Number(sample.soc)), 1);

  useEffect(() => {
    setShown(0);
    setSpeed(1);
    setPaused(false);
    finishNotifiedRef.current = false;
  }, [life]);

  useEffect(() => {
    if (finished && tutorialMode && !finishNotifiedRef.current) {
      finishNotifiedRef.current = true;
      onTutorialFinishStep?.();
    }
  }, [finished, tutorialMode, onTutorialFinishStep]);

  useEffect(() => {
    if (finished || effectivePaused) return undefined;
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
  }, [shown, finished, effectivePaused, speed, life]);

  const snapshot = {
    auto: true,
    dead,
    link: {
      state: dead
        ? 'DEGRADED'
        : ['WEAK_SIGNAL', 'POWER_HOLD'].includes(commSample?.state)
          ? 'MARGINAL'
          : ['NO_PASS'].includes(commSample?.state)
            ? 'NO_PASS'
            : 'LOCK',
      station: communications?.station?.name || 'GS',
    },
    power: { eclipse: Boolean(commSample?.eclipse) },
  };
  const soc = cur ? cur.soc : 1;
  const doseFrac = cur ? Math.min(1, cur.dose_krad / Math.max(1e-6, cur.tolerance_krad)) : 0;
  const alt0 = life.steps[0]?.alt_km || 1;
  // nhat ky su kien THEO THU TU THOI GIAN (cu o tren, moi o duoi) cho man hinh may tinh cu
  const feed = life.steps
    .slice(0, shown)
    .flatMap((s) => s.events.map((e) => ({
      level: e.level,
      code: e.code,
      text: cleanEventText(tx(e.text, lang)),
      month: s.month,
      k: s.k
    })));
  const linkLabel = dead
    ? tr(lang, 'MẤT LIÊN LẠC', 'LOST CONTACT')
    : commSample?.state === 'POWER_HOLD'
      ? tr(lang, 'GIỮ PIN · HOÃN TRUYỀN', 'POWER HOLD · TX DEFERRED')
      : commSample?.state === 'WEAK_SIGNAL'
        ? tr(lang, 'TÍN HIỆU YẾU', 'WEAK SIGNAL')
        : commSample?.state === 'TRANSMITTING'
          ? tr(lang, 'ĐANG TRUYỀN DỮ LIỆU', 'TRANSMITTING DATA')
          : commSample?.state === 'NO_PASS'
            ? tr(lang, 'NGOÀI VÙNG TRẠM THU', 'OUT OF STATION VIEW')
            : tr(lang, 'LIÊN LẠC TỐT', 'LINK NOMINAL');
  const logStatus = cur
    ? `${linkLabel} · ${tr(lang, 'MỐC', 'STEP')} ${cur.k}/${life.steps_total} · ${tr(lang, 'PIN', 'SOC')} ${(soc * 100).toFixed(0)}%`
    : tr(lang, 'ĐANG TÁCH VỆ TINH...', 'DEPLOYING SATELLITE...');

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
                ? `${life.steps_total} ${tr(lang, 'MỐC', 'MILESTONES')}`
                : tr(lang, 'VÒNG ĐỜI', 'LIFECYCLE')}
            </span>
            <span className={`badge ${dead ? 'err' : 'info'}`}>
              {cur ? `${tr(lang, 'THÁNG', 'MONTH')} ${cur.month}` : tr(lang, 'TÁCH VỆ TINH', 'DEPLOY')}
            </span>
          </h2>
          <OrbitOps3DCanvas snapshot={snapshot} design={design} catalog={catalog} />
          <div className="life-timeline" data-tutorial="orbit-region">
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
          {!finished && tutorialPaused && (
            <div className="ok-banner" style={{ marginTop: 8 }}>
              {tr(
                lang,
                'ĐANG TẠM DỪNG MÔ PHỎNG QUỸ ĐẠO ĐỂ GIỚI THIỆU — XEM XONG BẤM [BẮT ĐẦU / TIẾP TỤC]',
                'ORBIT SIMULATION PAUSED FOR BRIEFING — CLICK [START / RESUME] WHEN READY'
              )}
            </div>
          )}
          {dead && (
            <div className="halt-banner">
              ⚠ {tr(lang, 'MÔ PHỎNG DỪNG — MẤT VỆ TINH Ở THÁNG', 'SIMULATION HALTED — SATELLITE LOST AT MONTH')} {cur.month}
            </div>
          )}
          {finished && tutorialMode && (
            <div className="sandbox-end-inline" style={{ marginTop: 10 }}>
              <div className="row-between" style={{ gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <strong className="neon-green" style={{ fontSize: 15 }}>
                    {tr(lang, 'Kết thúc sandbox, quay về cốt truyện', 'Sandbox complete — return to story campaign')}
                  </strong>
                  <div className="small muted" style={{ marginTop: 2 }}>
                    {tr(
                      lang,
                      'Bạn đã hoàn thành toàn bộ hướng dẫn Sandbox 12 tháng trên quỹ đạo!',
                      'You completed the full 12-month Orbital Operations sandbox tutorial!'
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn neon-btn sandbox-return-btn"
                  onClick={onReturnCampaign || onDone}
                >
                  {tr(lang, 'QUAY VỀ CỐT TRUYỆN', 'RETURN TO STORY')}
                </button>
              </div>
            </div>
          )}
          <div className="row-between" style={{ marginTop: 10 }}>
            <div className="row-wrap" data-tutorial="orbit-speed">
              <button
                className={`btn ${!finished && tutorialPaused ? 'neon-btn' : ''}`}
                disabled={finished}
                onClick={() => {
                  if (!finished && tutorialPaused) {
                    setPaused(false);
                    onResumeFromTutorial?.();
                  } else {
                    setPaused((p) => !p);
                  }
                }}
              >
                {effectivePaused
                  ? tr(lang, 'BẮT ĐẦU / TIẾP TỤC', 'START / RESUME')
                  : tr(lang, 'TẠM DỪNG', 'PAUSE')}
              </button>
              {[1, 2, 5, 10, 30, 100].map((w) => (
                <button key={w} className={`btn ${speed === w ? 'primary' : ''}`} onClick={() => setSpeed(w)}>
                  {w}x
                </button>
              ))}
            </div>
            <button
              className="btn primary hazard hazard-cta"
              data-tutorial="orbit-next"
              disabled={!finished}
              onClick={tutorialMode ? (onReturnCampaign || onDone) : onDone}
            >
              {tutorialMode
                ? tr(lang, 'QUAY VỀ CỐT TRUYỆN', 'RETURN TO STORY CAMPAIGN')
                : dead
                  ? tr(lang, 'TRÌNH BẰNG CHỨNG CHO SẾP', 'PRESENT PROOF TO DIRECTOR')
                  : tr(lang, 'HỌP TỔNG KẾT VỚI SẾP', 'MISSION DEBRIEF WITH DIRECTOR')}
            </button>
          </div>
          {life.imaging && (
            <div style={{ marginTop: 12 }}>
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
            <div className="kpi-box" data-tutorial="orbit-downlink">
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
                {tr(lang, 'TỐC ĐỘ', 'RATE')} {num(downlinkMbps, 3)} Mbps · {tr(lang, 'MẤT', 'LOST')} {cur ? num(cur.lost_gb, 2) : '0'} GB
              </div>
            </div>
          </div>
          {communications && (
            <div className="mission-data-chain" aria-label={tr(lang, 'Chuỗi dữ liệu nhiệm vụ', 'Mission data chain')}>
              <div className="mission-data-stage" data-tutorial="orbit-capture">
                <span className="mission-data-step">01 · {tr(lang, 'QUAN SÁT', 'OBSERVATION')}</span>
                <strong>{capturedNow} {tr(lang, 'ĐÃ CHỤP', 'CAPTURED')}</strong>
                <small>{tr(lang, `Mục tiêu: ${life.evidence_need} khung hình xác thực gửi về Trái Đất`, `Target: ${life.evidence_need} verified frames delivered to Earth`)}</small>
              </div>
              <div className="mission-data-arrow" aria-hidden="true">/</div>
              <div
                className={`mission-data-stage ${storageCapacityGb > 0 && bufferGbNow / storageCapacityGb > 0.85 ? 'warn' : ''}`}
                data-tutorial="orbit-storage"
              >
                <span className="mission-data-step">02 · {tr(lang, 'LƯU TRỮ TRÊN TÀU', 'ONBOARD DATA')}</span>
                <strong>{fmtSize(bufferGbNow)} / {fmtSize(storageCapacityGb)}</strong>
                <small>{tr(lang, `${Math.max(0, capturedNow - deliveredNow)} ảnh đang chờ · OBC ${design?.obc}`, `${Math.max(0, capturedNow - deliveredNow)} frames queued · OBC ${design?.obc}`)}</small>
              </div>
              <div className="mission-data-arrow" aria-hidden="true">/</div>
              <div
                className={`mission-data-stage ${['WEAK_SIGNAL', 'POWER_HOLD', 'NO_PASS'].includes(commSample?.state) ? 'warn' : 'ok'}`}
                data-tutorial="orbit-comm"
              >
                <span className="mission-data-step">03 · {tr(lang, 'TRUYỀN THÔNG', 'COMMUNICATION')}</span>
                <strong>{linkLabel}</strong>
                <small>
                  {commSample?.margin_db == null
                    ? tr(lang, 'Chưa có biên độ đường truyền', 'No link margin yet')
                    : `${tr(lang, 'Biên độ', 'Margin')} ${num(commSample.margin_db, 1)} dB`}
                  {' · '}{num(downlinkMbps, 3)} Mbps
                </small>
              </div>
              <div className="mission-data-arrow" aria-hidden="true">/</div>
              <div
                className={`mission-data-stage ${usableEvidenceNow >= life.evidence_need ? 'ok' : ''}`}
                data-tutorial="orbit-delivered"
              >
                <span className="mission-data-step">04 · {tr(lang, 'BẰNG CHỨNG NHIỆM VỤ', 'MISSION EVIDENCE')}</span>
                <strong>{usableEvidenceNow} / {life.evidence_need} {tr(lang, 'ĐÃ VỀ TRÁI ĐẤT', 'DELIVERED TO EARTH')}</strong>
                <small>{tr(lang, 'Chỉ các gói truyền về hoàn chỉnh mới được tính', 'Only complete downlinked packets count as evidence')}</small>
              </div>
            </div>
          )}
          {communications && (
            <div className="comms-orbit-summary">
              <div className="row-between small">
                <strong>{tr(lang, 'VẬT LÝ TRUYỀN THÔNG · CỬA SỔ 7 NGÀY ĐẠI DIỆN', 'COMMUNICATIONS PHYSICS · 7-DAY REPRESENTATIVE WINDOW')}</strong>
                <span className={`badge ${usableEvidenceNow >= life.evidence_need ? 'ok' : 'warn'}`}>
                  {deliveredNow} {tr(lang, 'ĐÃ VỀ', 'DELIVERED')} · {Math.max(0, capturedNow - deliveredNow)} {tr(lang, 'ĐANG CHỜ', 'QUEUED')}
                </span>
              </div>
              <div className="small muted">
                {contactsNow} {tr(lang, 'lượt qua', 'passes over')} {communications.station.name} · {num(usableMinutesNow)} {tr(lang, 'phút đủ margin · pin thấp nhất', 'min above margin · min battery')} {num(minSocNow * 100, 0)}%
              </div>
              {finished && communications.diagnostics.map((reason) => (
                <div className="small" key={reason}>- {reason}</div>
              ))}
            </div>
          )}
          <div className="small muted" style={{ margin: '12px 0 6px 0' }}>
            {tr(lang, 'NHẬT KÝ SỰ KIỆN QUỸ ĐẠO', 'ORBIT EVENT LOG')}
          </div>
          <OrbitEventLog lines={feed} status={logStatus} dead={dead} total={life.steps_total} />
        </section>
      </div>
    </div>
  );
}
