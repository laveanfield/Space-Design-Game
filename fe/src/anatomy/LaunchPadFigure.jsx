import React, { useEffect, useMemo, useRef } from 'react';
import { armSvg, clampParts, launchPadSvg, ISO_CSS, ARM_Z } from './14-11-2026-launchpad.mjs';
import { translateAlong } from './kit/iso-kit.mjs';

/**
 * LaunchPadFigure -- hinh be phong ve bang skill /anatomy (14-11-2026-launchpad.mjs), song trong React.
 *  - static: ve 1 lan (cho canh hoi thoai, nhin qua cua xuong).
 *  - live: theo dong ho chuyen bay: can noi quay rut ra trong dem nguoc, kep mo luc LIFTOFF, ten lua nhac len.
 * Chi phan dong (2 can noi, 4 kep, ten lua) duoc cap nhat moi khung; phan con lai la chuoi SVG co dinh.
 */

let cssInjected = false;
function useIsoCss() {
  useEffect(() => {
    if (cssInjected) return;
    cssInjected = true;
    const tag = document.createElement('style');
    tag.dataset.anatomy = 'iso';
    tag.textContent = ISO_CSS;
    document.head.appendChild(tag);
  }, []);
}

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function LaunchPadStatic({ theme = 'light' }) {
  useIsoCss();
  const svg = useMemo(() => launchPadSvg({ state: { arm: 0, clamp: 0, lift: 0 } }).svg, []);
  return <div className="iso anatomy-pad" data-theme={theme} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/**
 * fired: danh sach su kien da xay ra cua chuyen bay (IGNITION, LIFTOFF, SCRUB, FTS...).
 * Dong ho rieng cua hinh bat dau khi component mount (cung luc voi dem nguoc 3 giay cua canh 3D).
 */
export function LaunchPadLive({ fired = [], theme = 'dark' }) {
  useIsoCss();
  const ref = useRef(null);
  const readRef = useRef(null);
  const firedRef = useRef(fired);
  firedRef.current = fired;
  const { svg, P } = useMemo(() => launchPadSvg({ state: { arm: 0, clamp: 0, lift: 0 } }), []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const q = (name) => root.querySelector(`[data-part="${name}"]`);
    const arms = [q('arm0'), q('arm1')];
    const clamps = [0, 1, 2, 3].map((i) => q(`clamp${i}`));
    const rocket = q('rocket');
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let liftAt = null, raf = 0, lastArm = -1, lastClamp = -1;
    const tick = (now) => {
      const t = (now - t0) / 1000;
      const f = firedRef.current;
      const scrub = f.includes('SCRUB');
      const lifted = f.includes('LIFTOFF');
      if (lifted && liftAt === null) liftAt = t;
      // can noi rut ra trong khoang 0.6 -> 2.9 s sau khi bat dau dem nguoc (giong canh 3D)
      const arm = scrub ? lastArm < 0 ? 0 : lastArm : still ? (lifted ? 1 : 0) : smooth(0.6, 2.9, t);
      const clamp = liftAt === null ? 0 : still ? 1 : smooth(liftAt, liftAt + 0.35, t);
      const lift = liftAt === null ? 0 : still ? 0 : 260 * Math.pow(Math.max(0, t - liftAt - 0.2), 2) * 0.35;
      if (Math.abs(arm - lastArm) > 1e-3) { arms.forEach((g, i) => g && (g.innerHTML = armSvg(P, i, arm))); lastArm = arm; }
      if (Math.abs(clamp - lastClamp) > 1e-3) { clamps.forEach((g, i) => g && (g.innerHTML = clampParts(P, i, clamp).svg)); lastClamp = clamp; }
      if (rocket) {
        rocket.setAttribute('transform', translateAlong(P, [0, 0, lift]));
        rocket.style.opacity = String(Math.max(0, 1 - lift / 520));
      }
      if (readRef.current) {
        const deg = Math.round(arm * 80);
        readRef.current.textContent = scrub ? 'HOÃN PHÓNG — đếm ngược dừng' : lifted ? `kẹp mở • rời bệ` : `cần nối ${deg}° • kẹp đóng`;
      }
      if (!(lifted && lift > 520)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [P]);

  return (
    <div className="pad-card">
      <div className="row-between small muted" style={{ marginBottom: 4 }}>
        <span>LAUNCH COMPLEX // PAD 1</span>
        <span ref={readRef}>cần nối 0° • kẹp đóng</span>
      </div>
      <div ref={ref} className="iso anatomy-pad" data-theme={theme} dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="small muted" style={{ marginTop: 4 }}>
        {ARM_Z.length} cần nối quay ra trước T-0, 4 kẹp giữ chân mở khi đánh lửa đủ lực. Hình minh họa (skill /anatomy).
      </div>
    </div>
  );
}
