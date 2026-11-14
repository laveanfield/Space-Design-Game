import React, { useEffect, useMemo, useRef } from 'react';
import { decodeF32 } from '../api/client';

/**
 * TrajectoryScope -- Oscilloscope CRT ve TU DONG quy dao phong du kien moi khi doi linh kien.
 * Doi mau xanh/vang/do va danh dau vi tri su co neu du kien vo fairing, qua tai MAX-Q hoac hut delta-v.
 */
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Tu chuoi so lieu -> cac diem (tam xa km, do cao km) + moc su kien + diem su co (neu co). */
function pathOf(flight) {
  const s = flight.series;
  const alt = decodeF32(s.alt_km);
  const vel = decodeF32(s.v_inertial_ms);
  const vMax = Math.max(1, vel[s.n - 1]);
  const pts = [];
  let range = 0;
  for (let i = 0; i < s.n; i++) {
    const pitch = ((80 * Math.PI) / 180) * smooth(0.03, 0.92, vel[i] / vMax);
    range += (vel[i] * Math.sin(pitch) * s.dt_s) / 1000;
    pts.push({ t: i * s.dt_s, x: range, y: alt[i] });
  }
  const end = pts[pts.length - 1] || { t: 0, x: 0, y: 0 };
  const burnEnd = pts.length;
  const vEnd = vel[s.n - 1] / 1000;
  if (flight.meta?.reaches_orbit) {
    for (let k = 1; k <= 36; k++) pts.push({ t: end.t + k * 8, x: end.x + vEnd * k * 8, y: end.y });
  } else {
    for (let k = 1; k <= 36; k++) {
      const u = k / 36;
      pts.push({ t: end.t + u * 260, x: end.x + vEnd * 260 * (u - 0.35 * u * u), y: end.y * (1 - u * u) });
    }
  }
  const marks = (flight.events || [])
    .filter((e) => ['MAXQ', 'MECO', 'STAGE_SEP', 'SECO2'].includes(e.name))
    .map((e) => {
      const p = pts[Math.min(burnEnd - 1, Math.round(e.t / s.dt_s))];
      return { name: e.name, x: p.x, y: p.y };
    });

  let failMark = null;
  if (flight.failure) {
    const idx = Math.min(pts.length - 1, Math.max(0, Math.round((flight.failure.t || 0) / s.dt_s)));
    const p = pts[idx];
    const tag =
      flight.failure.kind === 'structural_maxq'
        ? '✕ MAX-Q BREAKUP'
        : flight.failure.kind === 'wrong_plane'
          ? '✕ PLANE ERR'
          : '✕ IMPACT / DV SHORT';
    failMark = { x: p.x, y: p.y, tag };
  }

  return { pts, marks, failMark, altEnd: end.y, vEnd, burnEnd };
}

export default function TrajectoryScope({ flight, runs = 0, updating = false }) {
  const canvasRef = useRef(null);
  const data = useMemo(() => (flight?.series ? pathOf(flight) : null), [flight]);
  const failure = flight?.failure || null;
  const reaches = Boolean(flight?.meta?.reaches_orbit && !failure);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = cv.clientWidth || 480;
    const H = cv.clientHeight || 190;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(cv);
    const accent = css.getPropertyValue('--accent').trim() || '#38e594';
    const warn = css.getPropertyValue('--warn').trim() || '#ffb84d';
    const err = css.getPropertyValue('--err').trim() || '#ff5c6c';
    const C = {
      line: failure?.explode ? err : failure || !reaches ? warn : accent,
      dim: css.getPropertyValue('--text-dim').trim() || '#7da895',
      grid: css.getPropertyValue('--border').trim() || '#1e3d31',
      err,
    };
    const pad = { l: 38, r: 12, t: 14, b: 22 };
    const xMax = data ? Math.max(100, ...data.pts.map((p) => p.x)) * 1.04 : 3000;
    const yMax = data ? Math.max(160, ...data.pts.map((p) => p.y)) * 1.22 : 500;
    const X = (x) => pad.l + (x / xMax) * (W - pad.l - pad.r);
    const Y = (y) => H - pad.b - (y / yMax) * (H - pad.t - pad.b);

    const frame = (upto) => {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = C.grid;
      g.lineWidth = 1;
      g.fillStyle = C.dim;
      g.font = '10px monospace';
      for (let i = 0; i <= 4; i++) {
        const y = (yMax * i) / 4;
        g.beginPath();
        g.moveTo(pad.l, Y(y));
        g.lineTo(W - pad.r, Y(y));
        g.stroke();
        g.fillText(`${y.toFixed(0)}`, 4, Y(y) + 3);
      }
      g.fillText('km', 4, pad.t - 2);
      g.fillText(`DOWNRANGE → ${xMax.toFixed(0)} km`, W - pad.r - 134, H - 6);
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(pad.l, Y(100));
      g.lineTo(W - pad.r, Y(100));
      g.stroke();
      g.setLineDash([]);
      g.fillText('KARMAN 100 km', pad.l + 4, Y(100) - 3);

      if (!data) {
        g.fillText('AWAITING ASCENT TELEMETRY...', pad.l + 8, H / 2);
        return;
      }

      const n = Math.max(2, Math.floor(data.pts.length * upto));
      g.strokeStyle = C.line;
      g.lineWidth = 1.8;
      g.shadowColor = C.line;
      g.shadowBlur = 6;
      if (failure || !reaches) g.setLineDash([7, 4]);
      g.beginPath();
      data.pts.slice(0, n).forEach((p, i) => (i ? g.lineTo(X(p.x), Y(p.y)) : g.moveTo(X(p.x), Y(p.y))));
      g.stroke();
      g.setLineDash([]);
      g.shadowBlur = 0;

      const head = data.pts[n - 1];
      g.fillStyle = C.line;
      g.beginPath();
      g.arc(X(head.x), Y(head.y), 3, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = C.dim;
      for (const m of data.marks) {
        if (X(m.x) > X(head.x)) continue;
        g.beginPath();
        g.arc(X(m.x), Y(m.y), 2.4, 0, Math.PI * 2);
        g.fill();
        g.fillText(m.name, X(m.x) + 5, Y(m.y) + 10);
      }

      if (data.failMark && X(data.failMark.x) <= X(head.x)) {
        const fx = X(data.failMark.x);
        const fy = Y(data.failMark.y);
        g.strokeStyle = C.err;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(fx - 5, fy - 5);
        g.lineTo(fx + 5, fy + 5);
        g.moveTo(fx + 5, fy - 5);
        g.lineTo(fx - 5, fy + 5);
        g.stroke();
        g.fillStyle = C.err;
        g.fillText(data.failMark.tag, Math.min(W - 125, fx + 7), Math.max(pad.t + 10, fy - 6));
      }
    };

    if (!data) {
      frame(1);
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now) => {
      const u = Math.min(1, (now - t0) / 550);
      frame(u);
      if (u < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [data, failure, reaches]);

  const meta = flight?.meta;
  return (
    <div className="scope-box">
      <div className="row-between small muted" style={{ marginBottom: 4 }}>
        <span>LIVE ASCENT TRAJECTORY SCOPE [AUTO-CALC]</span>
        <span className={failure ? 'err-text' : reaches ? 'ok-text' : ''}>
          {updating
            ? 'SYNCING...'
            : failure
              ? `WARN: ${failure.kind.toUpperCase()}`
              : reaches
                ? `ORBIT INSERTION OK (#${runs})`
                : 'STANDBY'}
        </span>
      </div>
      <canvas ref={canvasRef} className="scope-canvas" />
      {data && (
        <div className="scope-readout small">
          <span>
            APOGEE <strong>{data.altEnd.toFixed(0)} km</strong>
          </span>
          <span>
            V_FIN <strong>{data.vEnd.toFixed(2)} km/s</strong>
          </span>
          <span>
            Δv_AVAIL <strong>{Number(meta?.dv_ideal_ms || 0).toFixed(0)} m/s</strong>
          </span>
          <span>
            Δv_REQ <strong>{Number(meta?.dv_needed_ms || 0).toFixed(0)} m/s</strong>
          </span>
          <span>
            PAYLOAD <strong>{Number(meta?.payload_kg || 0).toFixed(1)} kg</strong>
          </span>
        </div>
      )}
    </div>
  );
}
