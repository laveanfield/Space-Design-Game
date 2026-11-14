import React, { useEffect, useMemo, useRef } from 'react';
import { decodeF32 } from '../api/client';

/**
 * TrajectoryScope -- man hinh "oscilloscope" ve TRUOC quy dao phong (ket qua /fly cho thiet ke hien tai).
 *
 * Chi ve DUONG BAY va vai con so do duoc. Khong co chu "dat / khong dat": nguoi choi tu doc hinh.
 * (Day la mo phong duong bay diem-khoi-luong, nen no khong thay duoc su co ket cau hay doi song tren quy dao.)
 */
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Tu chuoi so lieu -> cac diem (tam xa km, do cao km) + moc su kien. */
function pathOf(flight) {
  const s = flight.series;
  const alt = decodeF32(s.alt_km), vel = decodeF32(s.v_inertial_ms);
  const vMax = Math.max(1, vel[s.n - 1]);
  const pts = [];
  let range = 0;
  for (let i = 0; i < s.n; i++) {
    const pitch = (80 * Math.PI) / 180 * smooth(0.03, 0.92, vel[i] / vMax);
    range += (vel[i] * Math.sin(pitch) * s.dt_s) / 1000;
    pts.push({ t: i * s.dt_s, x: range, y: alt[i] });
  }
  const end = pts[pts.length - 1];
  const burnEnd = pts.length;
  const vEnd = vel[s.n - 1] / 1000;
  if (flight.meta?.reaches_orbit) {
    for (let k = 1; k <= 40; k++) pts.push({ t: end.t + k * 8, x: end.x + vEnd * k * 8, y: end.y }); // bay vong: giu do cao
  } else {
    for (let k = 1; k <= 40; k++) { const u = k / 40; pts.push({ t: end.t + u * 260, x: end.x + vEnd * 260 * (u - 0.35 * u * u), y: end.y * (1 - u * u) }); } // roi lai
  }
  const marks = (flight.events || []).filter((e) => ['MAXQ', 'MECO', 'STAGE_SEP', 'SECO2'].includes(e.name)).map((e) => {
    const p = pts[Math.min(burnEnd - 1, Math.round(e.t / s.dt_s))];
    return { name: e.name, x: p.x, y: p.y };
  });
  return { pts, marks, altEnd: end.y, vEnd, burnEnd };
}

export default function TrajectoryScope({ flight, runs = 0 }) {
  const canvasRef = useRef(null);
  const data = useMemo(() => (flight?.series ? pathOf(flight) : null), [flight]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = cv.clientWidth || 480, H = cv.clientHeight || 190;
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(cv);
    const C = { line: css.getPropertyValue('--accent').trim() || '#38e594', dim: css.getPropertyValue('--text-dim').trim() || '#7da895', grid: css.getPropertyValue('--border').trim() || '#1e3d31' };
    const pad = { l: 38, r: 10, t: 12, b: 22 };
    const xMax = data ? Math.max(...data.pts.map((p) => p.x)) * 1.04 : 3000;
    const yMax = data ? Math.max(160, ...data.pts.map((p) => p.y)) * 1.22 : 500;
    const X = (x) => pad.l + (x / xMax) * (W - pad.l - pad.r);
    const Y = (y) => H - pad.b - (y / yMax) * (H - pad.t - pad.b);

    const frame = (upto) => {
      g.clearRect(0, 0, W, H);
      // luoi + truc
      g.strokeStyle = C.grid; g.lineWidth = 1; g.fillStyle = C.dim; g.font = '10px monospace';
      for (let i = 0; i <= 4; i++) {
        const y = (yMax * i) / 4;
        g.beginPath(); g.moveTo(pad.l, Y(y)); g.lineTo(W - pad.r, Y(y)); g.stroke();
        g.fillText(`${y.toFixed(0)}`, 4, Y(y) + 3);
      }
      g.fillText('km', 4, pad.t + 2);
      g.fillText(`tầm xa → ${xMax.toFixed(0)} km`, W - pad.r - 118, H - 6);
      // duong Karman 100 km (ranh gioi khong gian)
      g.setLineDash([4, 4]); g.beginPath(); g.moveTo(pad.l, Y(100)); g.lineTo(W - pad.r, Y(100)); g.stroke(); g.setLineDash([]);
      g.fillText('100 km', pad.l + 4, Y(100) - 3);
      if (!data) { g.fillText('▶ MÔ PHỎNG → xem trước đường bay', pad.l + 8, H / 2); return; }
      // duong bay
      const n = Math.max(2, Math.floor(data.pts.length * upto));
      g.strokeStyle = C.line; g.lineWidth = 1.6; g.shadowColor = C.line; g.shadowBlur = 6;
      g.beginPath();
      data.pts.slice(0, n).forEach((p, i) => (i ? g.lineTo(X(p.x), Y(p.y)) : g.moveTo(X(p.x), Y(p.y))));
      g.stroke(); g.shadowBlur = 0;
      const head = data.pts[n - 1];
      g.fillStyle = C.line; g.beginPath(); g.arc(X(head.x), Y(head.y), 3, 0, Math.PI * 2); g.fill();
      // moc su kien
      g.fillStyle = C.dim;
      for (const m of data.marks) {
        if (X(m.x) > X(head.x)) continue;
        g.beginPath(); g.arc(X(m.x), Y(m.y), 2.4, 0, Math.PI * 2); g.fill();
        g.fillText(m.name, X(m.x) + 5, Y(m.y) + 10);
      }
    };

    if (!data) { frame(1); return undefined; }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now) => {
      const u = Math.min(1, (now - t0) / 1300);
      frame(u);
      if (u < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  const meta = flight?.meta;
  return (
    <div className="scope-box">
      <div className="row-between small muted" style={{ marginBottom: 4 }}>
        <span>LIVE ASCENT TRAJECTORY SCOPE</span>
        <span>{runs > 0 ? `lần chạy #${runs}` : 'chưa chạy'}</span>
      </div>
      <canvas ref={canvasRef} className="scope-canvas" />
      {data && (
        <div className="scope-readout small">
          <span>ĐỘ CAO CUỐI <strong>{data.altEnd.toFixed(0)} km</strong></span>
          <span>VẬN TỐC CUỐI <strong>{data.vEnd.toFixed(2)} km/s</strong></span>
          <span>Δv TÊN LỬA CÓ <strong>{Number(meta?.dv_ideal_ms || 0).toFixed(0)} m/s</strong></span>
          <span>Δv CHUYẾN NÀY CẦN <strong>{Number(meta?.dv_needed_ms || 0).toFixed(0)} m/s</strong></span>
          <span>TẢI <strong>{Number(meta?.payload_kg || 0).toFixed(1)} kg</strong></span>
        </div>
      )}
    </div>
  );
}
