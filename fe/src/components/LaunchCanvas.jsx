import React, { useEffect, useRef } from 'react';
import { decodeF32, decodeU8 } from '../api/client';

export default function LaunchCanvas({ flight, cursorIdx }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#060c09';
    ctx.fillRect(0, 0, w, h);

    // Subtle telemetry grid
    ctx.strokeStyle = '#142a21';
    ctx.lineWidth = 1;
    for (let x = 48; x < w - 16; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, h - 32);
      ctx.stroke();
    }
    for (let y = 24; y < h - 32; y += 44) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(w - 16, y);
      ctx.stroke();
    }

    const s = flight?.series;
    if (!s || !s.t) {
      ctx.fillStyle = '#7da895';
      ctx.font = '13px monospace';
      ctx.fillText('AWAITING ASCENT TRAJECTORY SIMULATION...', 64, h / 2);
      return;
    }

    const tArr = decodeF32(s.t);
    const altArr = decodeF32(s.alt_km);
    const velArr = decodeF32(s.v_inertial_ms);
    const stgArr = decodeU8(s.stage_idx);
    const n = tArr.length;
    if (n === 0) return;

    const maxT = Math.max(tArr[n - 1], 1);
    let maxAlt = 10;
    let maxVel = 1000;
    for (let i = 0; i < n; i++) {
      if (altArr[i] > maxAlt) maxAlt = altArr[i];
      if (velArr[i] > maxVel) maxVel = velArr[i];
    }

    const padL = 52;
    const padR = 20;
    const padT = 26;
    const padB = 34;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const toX = (t) => padL + (t / maxT) * plotW;
    const toYAlt = (a) => padT + plotH - (a / (maxAlt * 1.1)) * plotH;
    const toYVel = (v) => padT + plotH - (v / (maxVel * 1.1)) * plotH;

    // Events markers
    (flight.events || []).forEach((ev, idx) => {
      const ex = toX(ev.t);
      ctx.strokeStyle = 'rgba(72, 201, 255, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ex, padT);
      ctx.lineTo(ex, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#48c9ff';
      ctx.font = '10px monospace';
      ctx.fillText(ev.name, Math.min(w - 90, ex + 3), padT + 12 + (idx % 3) * 12);
    });

    // Altitude curve
    ctx.strokeStyle = '#38e594';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(tArr[i]);
      const y = toYAlt(altArr[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Velocity curve
    ctx.strokeStyle = '#ffb84d';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(tArr[i]);
      const y = toYVel(velArr[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Playback cursor
    const ci = Math.max(0, Math.min(n - 1, cursorIdx));
    const cx = toX(tArr[ci]);
    const cyA = toYAlt(altArr[ci]);
    const cyV = toYVel(velArr[ci]);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, padT);
    ctx.lineTo(cx, padT + plotH);
    ctx.stroke();

    ctx.fillStyle = '#38e594';
    ctx.beginPath();
    ctx.arc(cx, cyA, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb84d';
    ctx.beginPath();
    ctx.arc(cx, cyV, 4, 0, Math.PI * 2);
    ctx.fill();

    // Legend & Axes
    ctx.fillStyle = '#d7f5e6';
    ctx.font = '11px monospace';
    ctx.fillText(`ALT (km) max ${maxAlt.toFixed(0)}`, padL, 16);
    ctx.fillStyle = '#ffb84d';
    ctx.fillText(`VEL (km/s) max ${(maxVel / 1000).toFixed(2)}`, padL + 170, 16);
    ctx.fillStyle = '#7da895';
    ctx.fillText(`T+0s`, padL, h - 10);
    ctx.fillText(`T+${maxT.toFixed(0)}s | STG ${(stgArr[ci] ?? 0) + 1}`, w - 155, h - 10);
  }, [flight, cursorIdx]);

  return (
    <canvas
      ref={canvasRef}
      width={720}
      height={340}
      style={{
        width: '100%',
        height: 'auto',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        display: 'block',
      }}
    />
  );
}
