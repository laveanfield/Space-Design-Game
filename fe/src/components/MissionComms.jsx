import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api/client';

const labels = { NO_PASS: 'NGOÀI VÙNG LIÊN LẠC', LOCK: 'ĐỦ BIÊN TÍN HIỆU', TRANSMITTING: 'ĐANG TRUYỀN ẢNH', CAPTURE: 'CHỤP & LƯU ẢNH', POWER_HOLD: 'GIỮ PIN · HOÃN TRUYỀN', WEAK_SIGNAL: 'TÍN HIỆU YẾU' };
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
  return <section className="panel comms-panel">
    <h2 className="panel-title"><span>{setupOnly ? 'THIẾT KẾ CHÍNH SÁCH TỰ ĐỘNG' : 'TỰ ĐỘNG // CHỤP → LƯU → TRUYỀN'}</span><span className="badge info">{setupOnly ? 'TRADE-OFF' : '7 NGÀY ĐẠI DIỆN'}</span></h2>
    <p className="small muted">Chụp được ảnh mới là một nửa nhiệm vụ. Ảnh phải chờ đúng cửa sổ nhìn thấy trạm, đủ tín hiệu và đủ pin để truyền trọn gói.</p>
    {onChange && <>
      <div className="comms-controls">
        <label>TRẠM THU<select value={cfg.station_id || stations[0]?.id || ''} onChange={(e) => update('station_id', e.target.value)}>{stations.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.lat_deg}°</option>)}</select></label>
        <label>MỤC TIÊU<select value={cfg.target_id || 'all'} onChange={(e) => update('target_id', e.target.value)}><option value="all">Mạng mục tiêu cháy rừng</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label>CHIẾN LƯỢC<select value={cfg.strategy || 'balanced'} onChange={(e) => update('strategy', e.target.value)}><option value="balanced">Cân bằng · giữ 25% pin</option><option value="data_first">Ưu tiên dữ liệu · giữ 6% pin</option><option value="save_power">Giữ năng lượng · giữ 55% pin</option></select></label>
        <label>CÔNG SUẤT PHÁT · {fmt((cfg.tx_scale ?? 1) * (catalog?.tables?.comms?.[design?.comm]?.tx_power_w || 0))} W<input aria-label="Công suất phát" type="range" min="0.25" max="1" step="0.25" value={cfg.tx_scale ?? 1} onChange={(e) => update('tx_scale', Number(e.target.value))} /></label>
        <label>TỐC ĐỘ · {fmt((cfg.rate_scale ?? 1) * (catalog?.tables?.comms?.[design?.comm]?.downlink_mbps || 0), 3)} Mbps<input aria-label="Tốc độ truyền" type="range" min="0.1" max="1" step="0.1" value={cfg.rate_scale ?? 1} onChange={(e) => update('rate_scale', Number(e.target.value))} /></label>
      </div>
      {!setupOnly && <div className="row-wrap"><button className="btn primary" disabled={busy} onClick={run}>{busy ? 'ĐANG TÍNH CỬA SỔ & RAY TRACE…' : 'MÔ PHỎNG LIÊN LẠC 7 NGÀY'}</button></div>}
      <p className="small muted">Sau launch thành công, vệ tinh tự chụp khi qua mục tiêu và tự gửi khi thấy trạm, đủ tín hiệu, đủ pin. Giới hạn công suất và tốc độ theo phần cứng đang lắp.</p>
      <p className="small muted">Giảm tốc độ tăng biên tín hiệu nhưng gửi được ít dữ liệu hơn. Tăng công suất cải thiện liên kết nhưng rút pin nhanh hơn. Trạm khác tạo lịch liên lạc khác.</p>
    </>}
    {error && <p role="alert" className="error-banner">{error}</p>}
    {report && current && <>
      <div className="comms-status" style={{ borderColor: colors[current.state] }}><strong style={{ color: colors[current.state] }}>{labels[current.state]}</strong><span>{clock(current.t_s)} · {station?.name}</span></div>
      <div className="comms-verdict" aria-live="polite"><strong>VÌ SAO VỆ TINH LÀM VẬY?</strong><p className="small">{{
        NO_PASS: 'Ngoài vùng trạm thu: ảnh nằm trong bộ nhớ. Công suất lớn hơn không thể truyền xuyên Trái Đất; vị trí trạm và quỹ đạo quyết định cơ hội gửi.',
        CAPTURE: 'Mục tiêu vào vùng quan sát: tự chụp và lưu ảnh. Thu thêm dữ liệu tiêu tốn pin và bộ nhớ; ảnh chưa phải kết quả cho tới khi gửi về đủ.',
        TRANSMITTING: 'Đã vào vùng liên lạc, đủ biên tín hiệu và pin: tự gửi ảnh theo thứ tự. Truyền nhanh giải phóng bộ nhớ, nhưng cần tín hiệu mạnh hơn.',
        POWER_HOLD: 'Đang thấy trạm nhưng pin chạm mức dự trữ. Giữ pin giúp duy trì vệ tinh, đổi lại bỏ lỡ thời gian gửi ảnh.',
        WEAK_SIGNAL: 'Thấy trạm nhưng biên tín hiệu chưa đủ. Giảm tốc độ giúp bắt tín hiệu dễ hơn nhưng kéo dài thời gian gửi; tăng công suất tiêu tốn thêm pin.',
        LOCK: 'Đường truyền đã sẵn sàng. Nếu chưa có ảnh trong hàng đợi, vệ tinh chờ lần qua mục tiêu tiếp theo.',
      }[current.state]}</p></div>
      <div className="comms-layout">
        <div>
          <svg className="comms-map" viewBox="0 0 720 360" role="img" aria-label="Vệt quỹ đạo, mục tiêu chụp ảnh và trạm mặt đất trên bản đồ kinh vĩ độ">
            <defs><pattern id="comms-grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#325466" strokeWidth=".6" /></pattern></defs>
            <rect width="720" height="360" fill="#081c29" />
            <image href="/earth_bluemarble.jpg" width="720" height="360" opacity=".48" preserveAspectRatio="none" />
            <rect width="720" height="360" fill="url(#comms-grid)" />
            <path d={track} fill="none" stroke="#6397aa" strokeWidth="1" opacity=".55" />
            {report.targets.map((t) => <g key={t.id}><circle cx={x(t.lon_deg)} cy={y(t.lat_deg)} r="5" fill="#ffc36a" /><title>{t.name}</title></g>)}
            {station && <><circle cx={x(station.lon_deg)} cy={y(station.lat_deg)} r="7" fill="#38e594" /><text x={Math.min(615, x(station.lon_deg) + 10)} y={y(station.lat_deg) - 10} fill="#bfffe5" fontSize="12">{station.name}</text></>}
            {station && current.el_deg >= (station.min_elevation_deg || 0) && Math.abs(current.lon - station.lon_deg) < 180 && <line x1={x(station.lon_deg)} y1={y(station.lat_deg)} x2={x(current.lon)} y2={y(current.lat)} stroke={colors[current.state]} strokeWidth="2" strokeDasharray={current.state === 'TRANSMITTING' ? '' : '5 4'} />}
            <circle cx={x(current.lon)} cy={y(current.lat)} r="6" fill="#fff" stroke={colors[current.state]} strokeWidth="3" />
            <text x="12" y="345" fill="#b8ced8" fontSize="12">● Vệ tinh trắng · Mục tiêu vàng · Trạm xanh</text>
          </svg>
          {!live && <div className="row-wrap comms-playback"><button className="btn" onClick={() => setPlaying((v) => !v)}>{playing ? 'TẠM DỪNG' : '▶ PHÁT LẠI'}</button><input aria-label="Thời gian mô phỏng liên lạc" type="range" min="0" max={Math.max(0, samples.length - 1)} value={Math.min(index, samples.length - 1)} onChange={(e) => { setIndex(Number(e.target.value)); setPlaying(false); }} /><span className="small">{clock(current.t_s)}</span></div>}
          <div className="small muted">CỬA SỔ NHÌN THẤY TRẠM</div>
          <svg viewBox="0 0 720 26" className="comms-windows" role="img" aria-label="Các cửa sổ truyền trên 7 ngày"><rect width="720" height="24" fill="#14232b" />{report.windows.filter((w) => w.start_s <= report.duration_s * maxFraction).map((w, i) => <rect key={i} x={w.start_s/report.duration_s*720} width={Math.max(3, (w.end_s-w.start_s)/report.duration_s*720)} height="24" fill={w.end_s > now ? '#6397aa' : w.sent_gb > 0 ? '#38e594' : '#ffb84d'} onClick={live ? undefined : () => goto((w.start_s+w.end_s)/2)}><title>{clock(w.start_s)} – {clock(w.end_s)} · {fmt(w.peak_el_deg)}° · {w.end_s <= now ? `${fmt(w.sent_gb, 3)} GB` : "đang diễn ra"}</title></rect>)}<line x1={current.t_s/report.duration_s*720} x2={current.t_s/report.duration_s*720} y2="26" stroke="white" strokeWidth="2" /></svg>
          <Sparkline samples={samples.slice(0, currentIndex + 1)} field="soc" max={1} color="#38e594" label="PIN · 0–100%" />
          <Sparkline samples={samples.slice(0, currentIndex + 1)} field="buffer_gb" max={8} color="#ffc36a" label="BỘ NHỚ CHỜ TRUYỀN · 0–8 GB" />
        </div>
        <div>
          <div className="telemetry-grid">
            {[["ẢNH RÕ ĐÃ VỀ / ĐÃ CHỤP", `${completed} / ${captured}`], ['GÓC NGẨNG', `${fmt(current.el_deg)}°`], ['LINK MARGIN · CẦN ≥3 dB', `${fmt(current.margin_db)} dB`], ['KHOẢNG CÁCH', `${fmt(current.range_km, 0)} km`], ['PIN', `${fmt(current.soc*100, 0)}%`], ['BỘ NHỚ CHỜ', `${fmt(current.buffer_gb, 3)} GB`], ['ĐÃ TRUYỀN', `${fmt(current.sent_gb, 3)} GB`], ['SUY HAO KHÔNG GIAN', `${fmt(current.fspl_db)} dB`]].map(([name, value]) => <div key={name} className="kpi-box"><div className="kpi-label">{name}</div><div className="kpi-val">{value}</div></div>)}
          </div>
          <div className="small muted" style={{ marginTop: 12 }}>NHẬT KÝ CHỤP & TRUYỀN</div>
          <div className="comms-events">{events.length ? events.map((e, i) => <p key={i} className="small"><span className="muted">{clock(e.t_s)}</span> · {e.text}</p>) : <p className="small muted">Chờ lần bay qua mục tiêu đầu tiên…</p>}</div>
        </div>
      </div>
      {maxFraction === 1 && <>
        <div className="comms-verdict"><strong>KẾT QUẢ CỬA SỔ ĐẠI DIỆN · {report.summary.delivered} ảnh rõ đã về · {report.summary.pending} ảnh còn chờ</strong><p className="small">{report.windows.length} lượt qua trạm · {fmt(report.summary.contact_min)} phút nhìn thấy · {fmt(report.summary.usable_min)} phút đủ margin · phát sóng dùng {fmt(report.summary.tx_energy_wh)} Wh · pin thấp nhất {fmt(report.summary.min_soc*100, 0)}%</p>{report.diagnostics.map((d) => <p key={d} className="small">→ {d}</p>)}</div>
        <details className="comms-details"><summary>Tia khúc xạ & giả định vật lý</summary><p className="small muted">Ray trace P.834 tại đỉnh từng lượt qua trạm; mặt nạ hình học quyết định lịch truyền. Các suy hao thời tiết chưa có dữ liệu được ghi rõ là giả định.</p><div className="comms-table"><table><thead><tr><th>Cửa sổ</th><th>Góc đỉnh</th><th>Margin</th><th>Khúc xạ</th><th>Trạng thái tia</th></tr></thead><tbody>{report.windows.map((w, i) => <tr key={i}><td>{clock(w.start_s)}</td><td>{fmt(w.peak_el_deg)}°</td><td>{fmt(w.ray.margin_db)} dB</td><td>{w.ray.neutral_ray ? `${fmt(w.ray.neutral_ray.bending_deg, 4)}°` : 'Ngoài dải mô hình'}</td><td>{w.ray.neutral_ray?.status || 'Hình học'}</td></tr>)}</tbody></table></div>{report.assumptions.map((a) => <p className="small muted" key={a}>• {a}</p>)}</details>
      </>}
    </>}
  </section>;
}
