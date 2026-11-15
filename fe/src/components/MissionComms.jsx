import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api/client';

const labels = { NO_PASS: 'OUT OF STATION VIEW', LOCK: 'LINK MARGIN LOCKED', TRANSMITTING: 'TRANSMITTING DATA', CAPTURE: 'CAPTURE & BUFFER', POWER_HOLD: 'POWER HOLD · TX DEFERRED', WEAK_SIGNAL: 'WEAK SIGNAL' };
const colors = { NO_PASS: '#687e88', LOCK: '#38e594', TRANSMITTING: '#38e594', CAPTURE: '#ffc36a', POWER_HOLD: '#ffb84d', WEAK_SIGNAL: '#ff5c6c' };
const fmt = (v, d = 1) => v == null ? '—' : Number(v).toFixed(d);
const clock = (t) => `D${Math.floor(t / 86400) + 1} ${String(Math.floor(t % 86400 / 3600)).padStart(2, '0')}:${String(Math.floor(t % 3600 / 60)).padStart(2, '0')}`;
const x = (lon) => (lon + 180) * 2;
const y = (lat) => (90 - lat) * 2;

function Sparkline({ samples, field, max, color, label }) {
  const path = samples.map((s, i) => `${i ? 'L' : 'M'}${i / Math.max(1, samples.length - 1) * 700},${45 - Math.min(1, s[field] / max) * 40}`).join(' ');
  return <div className="comms-chart"><div className="small muted">{label}</div><svg viewBox="0 0 700 50" role="img" aria-label={label}><path d="M0 45H700" stroke="currentColor" opacity=".2" /><path d={path} fill="none" stroke={color} strokeWidth="2" /></svg></div>;
}

export default function MissionComms({ design, catalog, mission, onChange, data, maxFraction = 1, setupOnly = false, live = false }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const generation = useRef(0);
  const signature = JSON.stringify(design);
  useEffect(() => { generation.current += 1; setResult(null); setIndex(0); setPlaying(false); setBusy(false); setError(''); }, [signature]);
  const report = data || result;
  const all = report?.samples || [];
  const samples = all.filter((s) => s.t_s <= (report?.duration_s || 0) * maxFraction);
  const currentIndex = live ? samples.length - 1 : Math.min(index, samples.length - 1);
  const current = samples[currentIndex];
  useEffect(() => { if (data) setIndex(Math.max(0, samples.length - 1)); }, [data, maxFraction, samples.length]);
  useEffect(() => {
    if (!playing || !samples.length) return undefined;
    const timer = setInterval(() => setIndex((i) => {
      if (i >= samples.length - 1) { setPlaying(false); return i; }
      return Math.min(samples.length - 1, i + 3);
    }), 80);
    return () => clearInterval(timer);
  }, [playing, samples.length]);
  const run = async () => {
    const revision = ++generation.current;
    setBusy(true); setError(''); setPlaying(false);
    try {
      const output = await apiFetch('/campaign/communications', { method: 'POST', body: { design, mission_id: mission?.id } });
      if (revision === generation.current) { setResult(output); setIndex(0); }
    } catch (err) { if (revision === generation.current) setError(err.message); }
    finally { if (revision === generation.current) setBusy(false); }
  };
  const cfg = design?.communications || {};
  const stations = Object.values(catalog?.tables?.ground_stations || {});
  const targets = mission?.communications_targets || report?.targets || [];
  const update = (key, value) => onChange((d) => { d.communications = { ...(d.communications || {}), [key]: value }; });
  const now = live ? (report?.duration_s || 0) * maxFraction : current?.t_s || 0;
  const events = report?.events.filter((e) => e.t_s <= now).slice(-8).reverse() || [];
  const completed = report?.evidence.filter((s) => s.delivered_t_s != null && s.delivered_t_s <= now && s.blur < .35).length || 0;
  const captured = report?.evidence.filter((s) => s.t_s <= now).length || 0;
  const goto = (t) => {
    const i = samples.findIndex((s) => s.t_s >= t);
    setIndex(i < 0 ? samples.length - 1 : i); setPlaying(false);
  };
  const track = samples.map((s, i) => `${i === 0 || Math.abs(s.lon - samples[i - 1].lon) > 180 ? 'M' : 'L'}${x(s.lon)},${y(s.lat)}`).join(' ');
  const station = report?.station;
  const Root = setupOnly ? 'div' : 'section';
  return <Root className={`${setupOnly ? 'comms-setup' : 'panel'} comms-panel`}>
    <h2 className="panel-title"><span>{setupOnly ? 'AUTONOMOUS DOWNLINK POLICY' : 'AUTONOMOUS OPS // CAPTURE - STORE - DOWNLINK'}</span><span className="badge info">{setupOnly ? 'TRADE-OFF' : '7-DAY REPRESENTATIVE'}</span></h2>
    <p className="small muted">Capturing an image is only half the mission. Data must wait for a ground station pass with adequate link margin and battery reserve for complete delivery.</p>
    {onChange && <>
      <div className="comms-controls">
        <label>GROUND STATION<select value={cfg.station_id || stations[0]?.id || ''} onChange={(e) => update('station_id', e.target.value)}>{stations.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.lat_deg}°</option>)}</select></label>
        <label>TARGET<select value={cfg.target_id || 'all'} onChange={(e) => update('target_id', e.target.value)}><option value="all">All mission targets</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label>STRATEGY<select value={cfg.strategy || 'balanced'} onChange={(e) => update('strategy', e.target.value)}><option value="balanced">Balanced · reserve 25% SOC</option><option value="data_first">Data priority · reserve 6% SOC</option><option value="save_power">Power saver · reserve 55% SOC</option></select></label>
        <label>TX POWER · {fmt((cfg.tx_scale ?? 1) * (catalog?.tables?.comms?.[design?.comm]?.tx_power_w || 0))} W<input aria-label="Transmit power" type="range" min="0.25" max="1" step="0.25" value={cfg.tx_scale ?? 1} onChange={(e) => update('tx_scale', Number(e.target.value))} /></label>
        <label>DOWNLINK RATE · {fmt((cfg.rate_scale ?? 1) * (catalog?.tables?.comms?.[design?.comm]?.downlink_mbps || 0), 3)} Mbps<input aria-label="Downlink rate" type="range" min="0.1" max="1" step="0.1" value={cfg.rate_scale ?? 1} onChange={(e) => update('rate_scale', Number(e.target.value))} /></label>
      </div>
      {!setupOnly && <div className="row-wrap"><button className="btn primary" disabled={busy} onClick={run}>{busy ? 'COMPUTING PASSES & RAY TRACE...' : 'SIMULATE 7-DAY COMMS'}</button></div>}
      <p className="small muted">After launch, the spacecraft captures automatically over targets and downlinks when passing a ground station with sufficient margin and battery. Limits scale with selected hardware.</p>
      <p className="small muted">Lowering rate improves link margin at lower throughput. Higher TX power boosts link margin but draws more battery. Station latitude sets pass geometry.</p>
    </>}
    {error && <p role="alert" className="error-banner">{error}</p>}
    {report && current && <>
      <div className="comms-status" style={{ borderColor: colors[current.state] }}><strong style={{ color: colors[current.state] }}>{labels[current.state]}</strong><span>{clock(current.t_s)} · {station?.name}</span></div>
      <div className="comms-verdict" aria-live="polite"><strong>WHY IS THE SPACECRAFT DOING THIS?</strong><p className="small">{{
        NO_PASS: 'Out of ground station line-of-sight: imagery stays buffered onboard. Higher RF power cannot penetrate Earth; orbit and station location govern contact windows.',
        CAPTURE: 'Target inside field of view: capturing and buffering imagery. Collecting extra data spends battery and storage; frames do not count until delivered.',
        TRANSMITTING: 'In station contact with healthy link margin and battery: downlinking queued data in order. Faster transfer frees buffer sooner but requires stronger signal.',
        POWER_HOLD: 'Station in view, but battery hit minimum reserve threshold. Protecting bus power preserves the satellite at the cost of skipping this downlink window.',
        WEAK_SIGNAL: 'Station in view, but link margin is below threshold. Lowering bitrate helps close the link over longer passes; raising TX power costs battery.',
        LOCK: 'Downlink channel ready. With an empty queue, the spacecraft waits for the next target observation.',
      }[current.state]}</p></div>
      <div className="comms-layout">
        <div>
          <svg className="comms-map" viewBox="0 0 720 360" role="img" aria-label="Ground track, observation targets, and ground station on lat/lon map">
            <defs><pattern id="comms-grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#325466" strokeWidth=".6" /></pattern></defs>
            <rect width="720" height="360" fill="#081c29" />
            <image href="/earth_bluemarble.jpg" width="720" height="360" opacity=".48" preserveAspectRatio="none" />
            <rect width="720" height="360" fill="url(#comms-grid)" />
            <path d={track} fill="none" stroke="#6397aa" strokeWidth="1" opacity=".55" />
            {report.targets.map((t) => <g key={t.id}><circle cx={x(t.lon_deg)} cy={y(t.lat_deg)} r="5" fill="#ffc36a" /><title>{t.name}</title></g>)}
            {station && <><circle cx={x(station.lon_deg)} cy={y(station.lat_deg)} r="7" fill="#38e594" /><text x={Math.min(615, x(station.lon_deg) + 10)} y={y(station.lat_deg) - 10} fill="#bfffe5" fontSize="12">{station.name}</text></>}
            {station && current.el_deg >= (station.min_elevation_deg || 0) && Math.abs(current.lon - station.lon_deg) < 180 && <line x1={x(station.lon_deg)} y1={y(station.lat_deg)} x2={x(current.lon)} y2={y(current.lat)} stroke={colors[current.state]} strokeWidth="2" strokeDasharray={current.state === 'TRANSMITTING' ? '' : '5 4'} />}
            <circle cx={x(current.lon)} cy={y(current.lat)} r="6" fill="#fff" stroke={colors[current.state]} strokeWidth="3" />
            <text x="12" y="345" fill="#b8ced8" fontSize="12">White: Spacecraft · Amber: Targets · Green: Ground Station</text>
          </svg>
          {!live && <div className="row-wrap comms-playback"><button className="btn" onClick={() => setPlaying((v) => !v)}>{playing ? 'PAUSE' : 'PLAYBACK'}</button><input aria-label="Communications simulation time" type="range" min="0" max={Math.max(0, samples.length - 1)} value={Math.min(index, samples.length - 1)} onChange={(e) => { setIndex(Number(e.target.value)); setPlaying(false); }} /><span className="small">{clock(current.t_s)}</span></div>}
          <div className="small muted">GROUND STATION PASS WINDOWS</div>
          <svg viewBox="0 0 720 26" className="comms-windows" role="img" aria-label="7-day downlink contact windows"><rect width="720" height="24" fill="#14232b" />{report.windows.filter((w) => w.start_s <= report.duration_s * maxFraction).map((w, i) => <rect key={i} x={w.start_s/report.duration_s*720} width={Math.max(3, (w.end_s-w.start_s)/report.duration_s*720)} height="24" fill={w.end_s > now ? '#6397aa' : w.sent_gb > 0 ? '#38e594' : '#ffb84d'} onClick={live ? undefined : () => goto((w.start_s+w.end_s)/2)}><title>{clock(w.start_s)} - {clock(w.end_s)} · {fmt(w.peak_el_deg)}° · {w.end_s <= now ? `${fmt(w.sent_gb, 3)} GB` : 'in progress'}</title></rect>)}<line x1={current.t_s/report.duration_s*720} x2={current.t_s/report.duration_s*720} y2="26" stroke="white" strokeWidth="2" /></svg>
          <Sparkline samples={samples.slice(0, currentIndex + 1)} field="soc" max={1} color="#38e594" label="BATTERY SOC · 0-100%" />
          <Sparkline samples={samples.slice(0, currentIndex + 1)} field="buffer_gb" max={8} color="#ffc36a" label="ONBOARD QUEUE BUFFER · 0-8 GB" />
        </div>
        <div>
          <div className="telemetry-grid">
            {[['CLEAR DELIVERED / CAPTURED', `${completed} / ${captured}`], ['ELEVATION ANGLE', `${fmt(current.el_deg)}°`], ['LINK MARGIN · NEED >=3 dB', `${fmt(current.margin_db)} dB`], ['SLANT RANGE', `${fmt(current.range_km, 0)} km`], ['BATTERY SOC', `${fmt(current.soc*100, 0)}%`], ['BUFFERED QUEUE', `${fmt(current.buffer_gb, 3)} GB`], ['DOWNLINKED TOTAL', `${fmt(current.sent_gb, 3)} GB`], ['FREE-SPACE LOSS', `${fmt(current.fspl_db)} dB`]].map(([name, value]) => <div key={name} className="kpi-box"><div className="kpi-label">{name}</div><div className="kpi-val">{value}</div></div>)}
          </div>
          <div className="small muted" style={{ marginTop: 12 }}>CAPTURE & DOWNLINK LOG</div>
          <div className="comms-events">{events.length ? events.map((e, i) => <p key={i} className="small"><span className="muted">{clock(e.t_s)}</span> · {e.text}</p>) : <p className="small muted">Waiting for first target flyover...</p>}</div>
        </div>
      </div>
      {maxFraction === 1 && <>
        <div className="comms-verdict"><strong>REPRESENTATIVE WINDOW RESULT · {report.summary.delivered} clear frames delivered · {report.summary.pending} queued</strong><p className="small">{report.windows.length} passes · {fmt(report.summary.contact_min)} min contact · {fmt(report.summary.usable_min)} min above margin · TX used {fmt(report.summary.tx_energy_wh)} Wh · min battery {fmt(report.summary.min_soc*100, 0)}%</p>{report.diagnostics.map((d) => <p key={d} className="small">- {d}</p>)}</div>
        <details className="comms-details"><summary>Atmospheric ray-trace & physics assumptions</summary><p className="small muted">ITU-R P.834 ray trace at peak elevation per pass; geometric visibility masks schedule downlinks. Unmeasured weather losses are flagged as modeling assumptions.</p><div className="comms-table"><table><thead><tr><th>Window</th><th>Peak El</th><th>Margin</th><th>Refraction</th><th>Ray Status</th></tr></thead><tbody>{report.windows.map((w, i) => <tr key={i}><td>{clock(w.start_s)}</td><td>{fmt(w.peak_el_deg)}°</td><td>{fmt(w.ray.margin_db)} dB</td><td>{w.ray.neutral_ray ? `${fmt(w.ray.neutral_ray.bending_deg, 4)}°` : 'Out of model range'}</td><td>{w.ray.neutral_ray?.status || 'Geometric'}</td></tr>)}</tbody></table></div>{report.assumptions.map((a) => <p className="small muted" key={a}>- {a}</p>)}</details>
      </>}
    </>}
  </Root>;
}
