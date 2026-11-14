import React, { useEffect, useRef, useState } from 'react';
import { playSoundAsset } from '../api/client';
import OrbitOps3DCanvas from './OrbitOps3DCanvas';
import EvidenceGallery from './EvidenceGallery';

/**
 * CampaignPanels -- cac bang cua vong choi "che tao -> phong -> 12 moc tren quy dao -> rut kinh nghiem".
 *
 * Nguyen tac: man che tao chi hien SO LIEU THO (cong tu datasheet), khong phan xet dat/khong dat.
 * Hau qua chi lo ra khi bay; sau do moi co ho so nguyen nhan goc de nguoi choi tu rut kinh nghiem.
 */

/** Chu song ngu {vi, en} -> chuoi (uu tien tieng Viet). Tranh loi React "Objects are not valid as a React child". */
export function tx(value) {
  if (value == null) return '';
  if (typeof value === 'object') return value.vi || value.en || '';
  return String(value);
}

const num = (v, digits = 1) => (Number.isFinite(Number(v)) ? Number(v).toFixed(digits) : '-');

/** Bang "luat cua Sep": ngan sach, han chot, uy tin con lai. Day la luat choi biet truoc, khong phai phan xet ky thuat. */
export function BossPanel({ scenario, metrics, reputation, attempts }) {
  const cost = Number(metrics?.['cost.total_musd'] || 0);
  const budget = Number(scenario?.budget_musd || 0);
  const months = Number(metrics?.['schedule.months'] || 0);
  const deadline = Number(scenario?.deadline_months || 0);
  return (
    <div className="boss-panel">
      <div className="row-between">
        <strong className="small">SẾP PENNY-PINCHER</strong>
        <span className="small muted">chuyến bay #{attempts + 1}</span>
      </div>
      <div className="kpi-grid" style={{ marginTop: 6 }}>
        <div className="kpi-box">
          <div className="kpi-label">ĐÃ CHI / NGÂN SÁCH</div>
          <div className={`kpi-val ${budget && cost > budget ? 'over' : ''}`}>${num(cost)}M / ${budget || '-'}M</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-label">ĐẶT HÀNG / HẠN CHÓT</div>
          <div className={`kpi-val ${deadline && months > deadline ? 'over' : ''}`}>{num(months, 0)} / {deadline || '-'} tháng</div>
        </div>
      </div>
      <div className="rep-row">
        <span className="kpi-label">UY TÍN VỚI SẾP</span>
        <span className="rep-pips">
          {[0, 1, 2].map((i) => <span key={i} className={`rep-pip ${i < reputation ? 'on' : ''}`} />)}
        </span>
      </div>
      <div className="small muted">Mỗi lần mất tên lửa hoặc mất vệ tinh, Sếp trừ một vạch. Hết vạch: dự án bị hủy.</div>
    </div>
  );
}

/** Bang cong datasheet: chi la tong cac con so tren the linh kien. Khong co nguong, khong co mau dat/truot. */
export function DatasheetTotals({ metrics }) {
  if (!metrics) return null;
  const rows = [
    ['KHỐI LƯỢNG KHÔ', `${num(metrics['mass.dry_kg'], 2)} kg`],
    ['ĐIỆN PHÁT (ngoài nắng)', `${num(metrics['power.gen_avg_w'])} W`],
    ['ĐIỆN TIÊU THỤ', `${num(metrics['power.load_w'])} W`],
    ['DỮ LIỆU SINH RA', `${num(metrics['data.generated_gb_per_day'], 2)} GB/ngày`],
    ['TỐC ĐỘ ĐƯỜNG TRUYỀN', `${num(metrics['comm.downlink_mbps'], 3)} Mbps`],
    ['ĐỘ CAO QUỸ ĐẠO', `${num(metrics['orbit.altitude_km'], 0)} km`],
  ];
  return (
    <div className="datasheet">
      <div className="small muted" style={{ marginBottom: 4 }}>BẢNG CỘNG DATASHEET (số thô, chưa ai kiểm chứng trên quỹ đạo)</div>
      {rows.map(([k, v]) => (
        <div key={k} className="row-between small datasheet-row"><span className="muted">{k}</span><strong>{v}</strong></div>
      ))}
    </div>
  );
}

/** So tay ky su: bai hoc tu cac chuyen bay truoc (luu trong trinh duyet). */
export function Logbook({ entries }) {
  return (
    <div className="logbook">
      <div className="small muted" style={{ marginBottom: 4 }}>SỔ TAY KỸ SƯ ({entries.length} chuyến bay)</div>
      {entries.length === 0 && <div className="small muted">Chưa có chuyến bay nào. Mọi bài học sẽ được ghi lại ở đây sau mỗi lần phóng.</div>}
      <div className="constraint-list" style={{ maxHeight: 230 }}>
        {entries.map((e) => (
          <div key={e.n} className={`constraint-row ${e.success ? 'pass' : 'fail'}`}>
            <div className="row-between small"><strong>#{e.n} • {e.headline}</strong><span className="muted">{e.when}</span></div>
            <div className="small muted">{e.build}</div>
            {e.lesson && <div className="small" style={{ marginTop: 2 }}>→ {e.lesson}</div>}
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
      <p className="small" style={{ margin: '8px 0' }}><strong>ROOT-CAUSE:</strong> {tx(dossier.cause)}</p>
      {(dossier.numbers || []).length > 0 && (
        <div className="dossier-numbers">
          {dossier.numbers.map((n) => (
            <div key={n.label} className="row-between small"><span className="muted">{n.label}</span><strong>{String(n.value)}{n.unit ? ` ${n.unit}` : ''}</strong></div>
          ))}
        </div>
      )}
      {tx(dossier.lesson) && <p className="small" style={{ margin: '8px 0 0 0' }}><strong>BÀI HỌC:</strong> {tx(dossier.lesson)}</p>}
    </div>
  );
}

const EVENT_SOUND = { SOLAR_STORM: '08-11-2026-seu_crackle.wav', SEU_RESET: '08-11-2026-reboot_beeps.wav', BROWNOUT: '08-11-2026-power_down.wav', BUFFER_FULL: '08-11-2026-data_glitch.wav', BLUR: '08-11-2026-static_noise.wav', DECAY: '08-11-2026-gyro_whine.wav' };

/**
 * 12 moc tren quy dao: vong doi ve tinh chay dan, dong ho rung/doi dan theo so lieu that cua backend.
 * Khong cho biet truoc ket cuc: nguoi choi nhin pin, lieu buc xa, do cao, du lieu... dien bien tung moc.
 */
export function LifePhase({ life, design, catalog, audioOn, onDone }) {
  const [shown, setShown] = useState(0); // so moc da hien
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const audioRef = useRef(audioOn);
  audioRef.current = audioOn;
  const total = life.steps.length;
  const finished = shown >= total;
  const cur = shown > 0 ? life.steps[shown - 1] : null;
  const dead = Boolean(cur && !cur.alive);

  useEffect(() => { setShown(0); }, [life]);

  useEffect(() => {
    if (finished || paused) return undefined;
    const id = setTimeout(() => {
      const step = life.steps[shown];
      const crit = step.events.find((e) => e.level === 'crit');
      const warn = step.events.find((e) => e.level === 'warn');
      if (crit) { playSoundAsset(audioRef.current, '08-11-2026-alarm.wav', 0.35); playSoundAsset(audioRef.current, '08-11-2026-link_lost.wav', 0.3); }
      else if (warn) playSoundAsset(audioRef.current, EVENT_SOUND[warn.code] || '06-11-2026-blip.wav', 0.28);
      else if (step.events.some((e) => e.code === 'EVIDENCE_OK')) playSoundAsset(audioRef.current, '06-11-2026-chime.wav', 0.35);
      else if (step.events.some((e) => e.code === 'FIRE_CAPTURED')) playSoundAsset(audioRef.current, '08-11-2026-shutter.wav', 0.35);
      else playSoundAsset(audioRef.current, '08-11-2026-link_regained.wav', 0.12);
      setShown((s) => s + 1);
    }, shown === 0 ? 900 : 1700 / speed);
    return () => clearTimeout(id);
  }, [shown, finished, paused, speed, life]);

  const snapshot = { auto: true, dead, link: { state: dead ? 'DEGRADED' : cur?.events.some((e) => e.level === 'warn') ? 'MARGINAL' : 'LOCK', station: 'GS' }, power: { eclipse: false } };
  const soc = cur ? cur.soc : 1;
  const doseFrac = cur ? Math.min(1, cur.dose_krad / Math.max(1e-6, cur.tolerance_krad)) : 0;
  const alt0 = life.steps[0]?.alt_km || 1;
  const feed = life.steps.slice(0, shown).flatMap((s) => s.events.map((e) => ({ ...e, month: s.month, k: s.k }))).reverse();

  return (
    <div className="ops-grid">
      <section className={`panel ${dead ? 'halted' : ''}`}>
        <h2 className="panel-title">
          <span>ORBIT SURVEILLANCE // {total === life.steps_total && !dead ? `${life.steps_total} MỐC` : 'VÒNG ĐỜI'}</span>
          <span className={`badge ${dead ? 'err' : 'info'}`}>{cur ? `THÁNG ${cur.month}` : 'TÁCH VỆ TINH'}</span>
        </h2>
        <OrbitOps3DCanvas snapshot={snapshot} design={design} catalog={catalog} />
        <div className="life-timeline">
          {Array.from({ length: life.steps_total }, (_, i) => {
            const s = life.steps[i];
            const state = i >= shown ? '' : s && !s.alive ? 'dead' : s?.events.some((e) => e.level === 'warn') ? 'warn' : 'ok';
            return <div key={i} className={`life-seg ${state} ${i === shown - 1 ? 'now' : ''}`}><span>{i + 1}</span></div>;
          })}
        </div>
        {dead && <div className="halt-banner">⚠ SIMULATION HALTED — mất vệ tinh ở tháng {cur.month}</div>}
        <div className="row-between" style={{ marginTop: 10 }}>
          <div className="row-wrap">
            <button className="btn" disabled={finished} onClick={() => setPaused((p) => !p)}>{paused ? 'CHẠY TIẾP' : 'TẠM DỪNG'}</button>
            {[1, 3].map((w) => <button key={w} className={`btn ${speed === w ? 'primary' : ''}`} onClick={() => setSpeed(w)}>{w}x</button>)}
          </div>
          <button className="btn primary" disabled={!finished} onClick={onDone}>
            {dead ? 'MỞ HỒ SƠ NGUYÊN NHÂN →' : 'HỌP TỔNG KẾT VỚI SẾP →'}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title"><span>TELEMETRY TỪ QUỸ ĐẠO</span><span className="small muted">{cur ? `mốc ${cur.k}/${life.steps_total}` : '...'}</span></h2>
        <div className="telemetry-grid">
          <div className="kpi-box">
            <div className="kpi-label">PIN (SOC)</div>
            <div className="kpi-val">{(soc * 100).toFixed(0)}%</div>
            <div className="gauge-bar"><div className={`gauge-fill ${soc < 0.3 ? 'err' : ''}`} style={{ width: `${soc * 100}%` }} /></div>
            <div className="small muted">dư điện {cur ? num(cur.margin_w) : '-'} W</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">LIỀU BỨC XẠ TÍCH LŨY</div>
            <div className="kpi-val">{cur ? num(cur.dose_krad, 2) : '0'} krad</div>
            <div className="gauge-bar"><div className={`gauge-fill ${doseFrac > 0.8 ? 'err' : ''}`} style={{ width: `${doseFrac * 100}%` }} /></div>
            <div className="small muted">chip chịu được {cur ? num(cur.tolerance_krad, 0) : '-'} krad</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">ĐỘ CAO QUỸ ĐẠO</div>
            <div className="kpi-val">{cur ? num(cur.alt_km, 0) : num(alt0, 0)} km</div>
            <div className="gauge-bar"><div className="gauge-fill" style={{ width: `${Math.min(100, ((cur ? cur.alt_km : alt0) / alt0) * 100)}%` }} /></div>
            <div className="small muted">lúc tách: {num(alt0, 0)} km</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">DỮ LIỆU ĐÃ VỀ MẶT ĐẤT</div>
            <div className="kpi-val">{cur ? num(cur.delivered_gb, 2) : '0'} GB</div>
            <div className="gauge-bar"><div className="gauge-fill" style={{ width: `${cur ? Math.min(100, (cur.delivered_gb / Math.max(1e-6, cur.delivered_gb + cur.lost_gb)) * 100) : 0}%` }} /></div>
            <div className="small muted">mất {cur ? num(cur.lost_gb, 2) : '0'} GB</div>
          </div>
        </div>
        {life.imaging && (
          <div style={{ marginTop: 10 }}>
            <EvidenceGallery evidence={life.evidence || []} need={life.evidence_need} step={cur ? cur.k : 0} sensorName={life.imaging.name} />
          </div>
        )}
        <div className="small muted" style={{ margin: '10px 0 4px 0' }}>NHẬT KÝ QUỸ ĐẠO</div>
        <div className="constraint-list" style={{ maxHeight: 220 }}>
          {feed.map((e, i) => (
            <div key={i} className={`constraint-row small ${e.level === 'crit' ? 'fail' : e.level === 'warn' ? 'warnrow' : 'pass'}`}>
              <span className="muted">[tháng {e.month}]</span> {tx(e.text)}
            </div>
          ))}
          {feed.length === 0 && <div className="small muted">Đang chờ tín hiệu đầu tiên từ vệ tinh...</div>}
        </div>
      </section>
    </div>
  );
}
