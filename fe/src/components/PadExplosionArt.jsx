import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * PadExplosionArt -- TRANH VE (SVG) dung lam "anh bao" cho to bao tai nan (AccidentNewspaper).
 *
 * Cac canh (prop scene):
 *   'pad-boom' : ten lua no tung NGAY TREN BE PHONG (dung voi su co luc lift-off cua tro choi): bau troi rang dong,
 *                nui rung, thap phuc vu + 4 cot thu loi, ranh thoat lua, qua cau lua, song xung kich, cot khoi, manh vo.
 *   'air-boom' : ten lua vo tan tren khong (lenh tu huy FTS / hut van toc): vet khoi dai + cac vet manh vo rơi.
 *   'air-lost' : chuyen bay binh thuong nhung ve tinh lac mat phang quy dao (khong no): vet khoi + cham sang xa dan.
 *   'pad-hold' : hoan phong (scrub): ten lua con nguyen tren be, hoi lanh LOX xa ra, khong lua.
 *
 * Day la tranh MINH HOA tu ve bang SVG (khong phai anh that, khong theo ban ve ky thuat cua ten lua nao).
 * Hinh co dinh (khong random moi lan ve): cac manh vo / tia lua sinh tu "seed" nen on dinh giua cac lan hien thi.
 */
const W = 960;
const H = 540;
const HZ = 398; // duong chan troi (y)
const CX = 520; // tam canh hanh dong
// Bau troi keo dai them EXTRA don vi phia TREN y = 0: khung anh cao (to bao dang doc) thay them troi + cot khoi,
// khung rong (16:9) chi thay phan 0..H nhu thiet ke (preserveAspectRatio "xMidYMax slice" neo day canh).
const EXTRA = 420;

function rngOf(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r1 = (n) => Math.round(n * 10) / 10;

/** Duong vien tan cay rung gap ghenh (silhouette). */
function ridge(rnd, y0, amp, step) {
  let x = -12;
  let d = `M-12 ${H} L-12 ${r1(y0)}`;
  while (x < W + 12) {
    x += step * (0.55 + rnd() * 0.9);
    d += ` L${r1(x)} ${r1(y0 - rnd() * amp)}`;
  }
  return `${d} L${W + 12} ${H} Z`;
}

/** Hinh nguoi dung xem (bong den) -- cho thay ty le. */
function Watcher({ x, y, s = 1, arm = true }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#050405" stroke="#050405">
      <circle cx="0" cy="-30" r="4.6" stroke="none" />
      <path d="M-6 0 L-5 -24 Q0 -28 5 -24 L6 0 Z" stroke="none" />
      <path d={arm ? 'M4 -22 L9 -36' : 'M4 -22 L7 -10'} strokeWidth="2.4" fill="none" />
      <path d="M-4 -22 L-8 -9" strokeWidth="2.4" fill="none" />
      {arm && <rect x="6" y="-41" width="7" height="5" rx="1" stroke="none" />}
    </g>
  );
}

export default function PadExplosionArt({ scene = 'pad-boom', seed = 7, className = '', label = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (n) => `${uid}-${n}`;
  const u = (n) => `url(#${id(n)})`;
  const isPad = scene === 'pad-boom' || scene === 'pad-hold';
  const boom = scene === 'pad-boom' || scene === 'air-boom';

  // Khung nhin: cat tranh theo ty le THAT cua khung anh (rong / vuong / dung), luon giu "tam hanh dong" o giua.
  const svgRef = useRef(null);
  const [box, setBox] = useState(null);
  const focus = scene === 'pad-boom' ? [CX, 292] : scene === 'pad-hold' ? [CX, 272] : scene === 'air-lost' ? [CX + 40, 205] : [CX + 60, 192];
  useLayoutEffect(() => {
    const host = svgRef.current?.parentElement;
    if (!host) return undefined;
    const calc = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      const a = w / h;
      const vw = Math.min(W, (H + EXTRA) * a);
      const vh = vw / a;
      const x = Math.min(Math.max(focus[0] - vw / 2, 0), W - vw);
      const y = Math.min(Math.max(focus[1] - vh / 2, -EXTRA), H - vh);
      setBox((b) => (b && Math.abs(b.x - x) < 0.5 && Math.abs(b.y - y) < 0.5 && Math.abs(b.w - vw) < 0.5 ? b : { x, y, w: vw, h: vh }));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(host);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // ---- du lieu ngau nhien co dinh (theo seed)
  const gen = useMemo(() => {
    const rnd = rngOf(seed * 7919 + 13);
    const stars = Array.from({ length: 80 }, () => ({ x: rnd() * W, y: -EXTRA + rnd() * (250 + EXTRA), r: 0.5 + rnd() * 1.1, o: 0.25 + rnd() * 0.6 }));
    const far = ridge(rnd, isPad ? 388 : 414, 20, 5);
    const near = ridge(rnd, isPad ? 402 : 428, 24, 8);
    // cot khoi bay len va troi ve ben phai (gio)
    const smoke = Array.from({ length: 24 }, (_, k) => {
      const t = k / 23; // 0 = sat qua cau lua, 1 = tren cung cua khung keo dai
      return { x: CX + 24 + t * t * 300 + (rnd() - 0.5) * 44, y: 300 - t * (300 + EXTRA - 20) + (rnd() - 0.5) * 16, r: 46 + t * 92 + rnd() * 16 };
    });
    // tia lua / manh vo bay xe ra tu qua cau lua
    const cy = scene === 'pad-boom' ? 338 : 178;
    const cx = scene === 'pad-boom' ? CX : CX + 90;
    const streaks = Array.from({ length: 36 }, () => {
      const a = -Math.PI * (0.04 + rnd() * 0.92);
      const r0 = 36 + rnd() * 70;
      const len = 50 + rnd() * (scene === 'pad-boom' ? 190 : 160);
      const w = 0.7 + rnd() * 1.7;
      const x1 = cx + Math.cos(a) * r0;
      const y1 = cy + Math.sin(a) * r0 * 0.9;
      const x2 = cx + Math.cos(a) * (r0 + len);
      const y2 = cy + Math.sin(a) * (r0 + len) * 0.9;
      const mx = x1 + (x2 - x1) * 0.72;
      const my = y1 + (y2 - y1) * 0.72;
      const nx = -Math.sin(a) * w;
      const ny = Math.cos(a) * w;
      return { d: `M${r1(x1)} ${r1(y1)} L${r1(mx + nx)} ${r1(my + ny)} L${r1(x2)} ${r1(y2)} L${r1(mx - nx)} ${r1(my - ny)} Z`, x2, y2, w, hot: rnd() > 0.45 };
    });
    const shards = Array.from({ length: 26 }, () => {
      const a = -Math.PI * (0.02 + rnd() * 0.96);
      const rr = 90 + rnd() * 330;
      return { x: cx + Math.cos(a) * rr, y: Math.min(HZ - 4, cy + Math.sin(a) * rr * 0.85), s: 3 + rnd() * 9, rot: rnd() * 360, lit: rnd() > 0.5 };
    });
    const embers = Array.from({ length: 70 }, () => ({ x: cx + (rnd() - 0.5) * 560, y: 80 + rnd() * 330, r: 0.7 + rnd() * 1.8, o: 0.3 + rnd() * 0.7 }));
    const arcs = Array.from({ length: 8 }, (_, k) => {
      const dir = k % 2 === 0 ? -1 : 1;
      const run = 120 + rnd() * 260;
      const fall = 60 + rnd() * 160;
      return { x0: cx, y0: cy, x1: cx + dir * run, y1: cy + fall, cx: cx + dir * run * 0.55, cy: cy - 60 - rnd() * 80, w: 2 + rnd() * 4 };
    });
    return { stars, far, near, smoke, streaks, shards, embers, arcs, cx, cy };
  }, [seed, scene, isPad]);

  // ---- bau troi theo canh
  const sky = isPad ? 'skyDawn' : 'skyDay';

  const towerPath = useMemo(() => {
    const parts = [];
    for (let y = 404; y > 160; y -= 26) parts.push(`M${CX - 132} ${y} L${CX - 96} ${y - 26} M${CX - 96} ${y} L${CX - 132} ${y - 26} M${CX - 132} ${y} H${CX - 96}`);
    return parts.join(' ');
  }, []);

  return (
    <svg
      ref={svgRef}
      className={`pad-art ${className}`}
      viewBox={box ? `${r1(box.x)} ${r1(box.y)} ${r1(box.w)} ${r1(box.h)}` : `0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label || 'Illustration of launch pad vehicle anomaly'}
    >
      <defs>
        <linearGradient id={id('skyDawn')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={HZ}>
          <stop offset="0" stopColor="#070d26" />
          <stop offset="0.3" stopColor="#17224f" />
          <stop offset="0.55" stopColor="#4a3566" />
          <stop offset="0.72" stopColor="#b04a52" />
          <stop offset="0.86" stopColor="#ee7f3a" />
          <stop offset="1" stopColor="#ffb85a" />
        </linearGradient>
        <linearGradient id={id('skyDay')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={HZ + 30}>
          <stop offset="0" stopColor="#12285e" />
          <stop offset="0.4" stopColor="#2f5a9c" />
          <stop offset="0.72" stopColor="#8aa6c8" />
          <stop offset="0.9" stopColor="#f1c08a" />
          <stop offset="1" stopColor="#ffd9a0" />
        </linearGradient>
        <radialGradient id={id('skyGlow')} gradientUnits="userSpaceOnUse" cx={CX} cy="340" r="500">
          <stop offset="0" stopColor="#ffd080" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#ff8a3a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff5a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('ground')} gradientUnits="userSpaceOnUse" x1="0" y1={HZ} x2="0" y2={H}>
          <stop offset="0" stopColor="#2b1d1a" />
          <stop offset="1" stopColor="#060506" />
        </linearGradient>
        <radialGradient id={id('groundGlow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb25a" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#ff6a1c" stopOpacity="0.38" />
          <stop offset="1" stopColor="#ff4a10" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('fbOuter')} cx="0.5" cy="0.62" r="0.62">
          <stop offset="0" stopColor="#ffa530" />
          <stop offset="0.55" stopColor="#e2531a" />
          <stop offset="1" stopColor="#7a1808" />
        </radialGradient>
        <radialGradient id={id('fbMid')} cx="0.5" cy="0.55" r="0.62">
          <stop offset="0" stopColor="#fff3b8" />
          <stop offset="0.45" stopColor="#ffc43e" />
          <stop offset="1" stopColor="#ff7a1a" />
        </radialGradient>
        <radialGradient id={id('fbCore')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#fff6d0" />
          <stop offset="0.7" stopColor="#ffd27a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffb040" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('smokeG')} cx="0.5" cy="0.88" r="0.78">
          <stop offset="0" stopColor="#ff9646" stopOpacity="0.8" />
          <stop offset="0.35" stopColor="#6e504e" stopOpacity="0.9" />
          <stop offset="1" stopColor="#1c1a24" stopOpacity="0.94" />
        </radialGradient>
        <radialGradient id={id('smokeLight')} cx="0.5" cy="0.8" r="0.8">
          <stop offset="0" stopColor="#fff2e0" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#d9cfd2" stopOpacity="0.6" />
          <stop offset="1" stopColor="#9aa4b4" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id={id('bloom')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff0c8" stopOpacity="0.62" />
          <stop offset="0.35" stopColor="#ffaa50" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ff7a20" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('vig')} gradientUnits="userSpaceOnUse" cx="480" cy="330" r="780">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.66" />
        </radialGradient>
        <linearGradient id={id('trench')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0b0" />
          <stop offset="1" stopColor="#ff6a1c" />
        </linearGradient>
        <linearGradient id={id('hull')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5d636e" />
          <stop offset="0.5" stopColor="#f6f2ea" />
          <stop offset="1" stopColor="#8d94a1" />
        </linearGradient>

        <filter id={id('fireA')} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.018" numOctaves="4" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="64" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="2.4" />
        </filter>
        <filter id={id('fireB')} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.022 0.03" numOctaves="4" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="1.6" />
        </filter>
        <filter id={id('smokeF')} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.014" numOctaves="4" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="58" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="3.5" />
        </filter>
        <filter id={id('wisp')} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="3" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="1.8" />
        </filter>
        <filter id={id('b2')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" /></filter>
        <filter id={id('b4')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
        <filter id={id('b8')} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id={id('b16')} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16" /></filter>
        <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      {/* ===== bau troi ===== */}
      <rect x="0" y={-EXTRA} width={W} height={H + EXTRA} fill={u(sky)} />
      {isPad && gen.stars.map((s, i) => <circle key={i} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill="#fff" opacity={s.o} />)}
      {isPad && (
        <g filter={u('b8')} opacity="0.5">
          <ellipse cx="160" cy="318" rx="170" ry="9" fill="#ff9a6a" />
          <ellipse cx="800" cy="296" rx="190" ry="11" fill="#ff8a60" />
          <ellipse cx="300" cy="262" rx="140" ry="7" fill="#d87aa0" />
        </g>
      )}
      {!isPad && (
        <g filter={u('b8')} opacity="0.55">
          <ellipse cx="170" cy="300" rx="190" ry="14" fill="#ffffff" />
          <ellipse cx="820" cy="250" rx="200" ry="12" fill="#ffffff" />
        </g>
      )}
      {boom && <rect x="0" y={-EXTRA} width={W} height={H + EXTRA} fill={u('skyGlow')} style={{ mixBlendMode: 'screen' }} />}

      {/* ===== nui rung + mat dat ===== */}
      <path d={gen.far} fill={isPad ? '#231d3a' : '#2a3350'} opacity="0.95" />
      <path d={gen.near} fill="#0f0c17" />
      <rect x="0" y={isPad ? HZ + 6 : HZ + 34} width={W} height={H} fill={u('ground')} />

      {/* ===== cot khoi (phia sau lua) ===== */}
      {scene === 'pad-boom' && (
        <g filter={u('smokeF')}>
          {gen.smoke.map((s, i) => (
            <circle key={i} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} fill={u('smokeG')} />
          ))}
        </g>
      )}

      {/* ===== be phong + thap phuc vu + 4 cot thu loi ===== */}
      {isPad && (
        <g>
          {/* mong be + ranh thoat lua */}
          <path d={`M${CX - 210} 412 L${CX + 250} 412 L${CX + 292} 444 L${CX - 252} 444 Z`} fill="#1b1517" />
          <rect x={CX - 52} y="404" width="104" height="14" fill="#060304" />
          {scene === 'pad-boom' && <rect x={CX - 46} y="404" width="92" height="9" fill={u('trench')} filter={u('b2')} />}
          <rect x={CX - 28} y="392" width="56" height="13" fill="#0c0a10" stroke="#3a3038" strokeWidth="1" />
          {/* nha kien truc xa */}
          <rect x={CX + 190} y="376" width="96" height="28" fill="#14111a" />
          <path d={`M${CX + 190} 376 L${CX + 238} 362 L${CX + 286} 376 Z`} fill="#14111a" />
          {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={CX + 202 + k * 16} y="388" width="6" height="5" fill="#ffd45a" opacity="0.8" />)}
          {/* thap phuc vu (long thep) */}
          <g stroke="#0b0910" fill="none">
            <path d={`M${CX - 132} 404 V150 M${CX - 96} 404 V150`} strokeWidth="4.4" />
            <path d={towerPath} strokeWidth="1.6" />
            <path d={`M${CX - 114} 160 V112`} strokeWidth="2.4" />
            <path d={`M${CX - 96} 300 H${CX - 22} M${CX - 96} 244 H${CX - 30} M${CX - 96} 190 H${CX - 36}`} strokeWidth="3.2" />
            <path d={`M${CX - 140} 150 H${CX - 88} L${CX - 100} 136 H${CX - 128} Z`} strokeWidth="2" fill="#0b0910" />
          </g>
          <circle cx={CX - 114} cy="110" r="3" fill="#ff3b2f" />
          <circle cx={CX - 114} cy="110" r="9" fill="#ff3b2f" opacity="0.4" filter={u('b4')} />
          {scene === 'pad-boom' && (
            <path d={`M${CX - 96} 404 V150 M${CX - 96} 300 H${CX - 22}`} stroke="#ff9a3d" strokeWidth="1.3" fill="none" opacity="0.65" />
          )}
          {/* 4 cot thu loi quanh be */}
          {[CX - 300, CX - 226, CX + 232, CX + 316].map((mx, k) => {
            const top = k % 3 === 0 ? 168 : 196;
            return (
              <g key={mx}>
                <path d={`M${mx} 412 V${top}`} stroke="#0b0910" strokeWidth="2.6" />
                <path d={`M${mx - 7} ${top + 22} H${mx + 7}`} stroke="#0b0910" strokeWidth="1.8" />
                <circle cx={mx} cy={top - 2} r="2.4" fill="#ff3b2f" />
                <circle cx={mx} cy={top - 2} r="8" fill="#ff3b2f" opacity="0.35" filter={u('b4')} />
                {scene === 'pad-boom' && <path d={`M${mx + (mx < CX ? 1.6 : -1.6)} 412 V${top}`} stroke="#ff9a3d" strokeWidth="1" opacity="0.55" />}
              </g>
            );
          })}
          {/* den pha mat dat */}
          {[CX - 250, CX + 160, CX + 300].map((lx) => <circle key={lx} cx={lx} cy="418" r="2.2" fill="#ffe9a0" opacity="0.85" />)}
        </g>
      )}

      {/* ===== ten lua con nguyen tren be (hoan phong) ===== */}
      {scene === 'pad-hold' && (
        <g>
          <path d={`M${CX - 96} 300 H${CX - 20}`} stroke="#0b0910" strokeWidth="3.4" />
          <path d={`M${CX - 17} 396 V196 Q${CX - 17} 168 ${CX} 128 Q${CX + 17} 168 ${CX + 17} 196 V396 Z`} fill={u('hull')} stroke="#2a2630" strokeWidth="1" />
          <path d={`M${CX - 17} 330 H${CX + 17} M${CX - 17} 252 H${CX + 17} M${CX - 17} 202 H${CX + 17}`} stroke="#15131a" strokeWidth="5" />
          <path d={`M${CX - 17} 360 H${CX + 17}`} stroke="#c0451f" strokeWidth="3" />
          <path d={`M${CX - 11} 396 L${CX - 15} 410 H${CX + 15} L${CX + 11} 396 Z`} fill="#15131a" />
          <g filter={u('b8')} opacity="0.85">
            <circle cx={CX - 70} cy="394" r="34" fill="#f4f6fb" />
            <circle cx={CX - 120} cy="384" r="40" fill="#e8ecf5" />
            <circle cx={CX - 36} cy="352" r="26" fill="#f4f6fb" />
            <circle cx={CX + 62} cy="396" r="30" fill="#eef1f8" />
          </g>
          <circle cx={CX - 70} cy="292" r="3" fill="#ffd45a" />
          <circle cx={CX - 70} cy="292" r="10" fill="#ffd45a" opacity="0.35" filter={u('b4')} />
        </g>
      )}

      {/* ===== QUA CAU LUA tren be phong ===== */}
      {scene === 'pad-boom' && (
        <>
          <ellipse cx={CX} cy="414" rx="460" ry="46" fill={u('groundGlow')} style={{ mixBlendMode: 'screen' }} />
          <g filter={u('fireA')}>
            <ellipse cx={CX} cy="340" rx="165" ry="122" fill={u('fbOuter')} />
            <circle cx={CX - 98} cy="356" r="74" fill={u('fbOuter')} />
            <circle cx={CX + 96} cy="350" r="78" fill={u('fbOuter')} />
            <circle cx={CX - 40} cy="262" r="84" fill={u('fbOuter')} />
            <circle cx={CX + 52} cy="250" r="70" fill={u('fbOuter')} />
            <circle cx={CX + 4} cy="196" r="52" fill={u('fbOuter')} />
            <circle cx={CX + 36} cy="148" r="32" fill={u('fbOuter')} />
            <ellipse cx={CX} cy="394" rx="290" ry="38" fill={u('fbOuter')} />
          </g>
          <g filter={u('fireB')}>
            <ellipse cx={CX} cy="346" rx="118" ry="86" fill={u('fbMid')} />
            <circle cx={CX - 66} cy="366" r="52" fill={u('fbMid')} />
            <circle cx={CX + 70} cy="360" r="54" fill={u('fbMid')} />
            <circle cx={CX - 26} cy="290" r="56" fill={u('fbMid')} />
            <circle cx={CX + 38} cy="276" r="46" fill={u('fbMid')} />
            <circle cx={CX + 6} cy="226" r="34" fill={u('fbMid')} />
            <ellipse cx={CX} cy="396" rx="200" ry="24" fill={u('fbMid')} />
          </g>

          {/* vet lua + khoi cua tang tren bi hat bay len */}
          <g filter={u('smokeF')} opacity="0.85">
            <path d={`M${CX + 10} 316 Q${CX + 92} 244 ${CX + 168} 170`} stroke="#4a3d44" strokeWidth="34" fill="none" strokeLinecap="round" />
          </g>
          <path d={`M${CX} 330 Q${CX + 74} 262 ${CX + 150} 182`} stroke="#ffb347" strokeWidth="20" fill="none" strokeLinecap="round" filter={u('b4')} opacity="0.9" />
          <path d={`M${CX} 330 Q${CX + 74} 262 ${CX + 150} 182`} stroke="#fff1c0" strokeWidth="6" fill="none" strokeLinecap="round" filter={u('b2')} />

          {/* phan than ten lua con dung tren be: bong den nguoc sang */}
          <g transform={`rotate(-4 ${CX} 400)`}>
            <path
              d={`M${CX - 17} 402 V346 L${CX - 12} 338 L${CX - 8} 350 L${CX - 3} 330 L${CX + 3} 346 L${CX + 8} 326 L${CX + 13} 342 L${CX + 17} 336 V402 Z`}
              fill="#0a0809"
              stroke="#ff9b3d"
              strokeWidth="1"
            />
            <path d={`M${CX - 17} 372 H${CX + 17}`} stroke="#2b2630" strokeWidth="3" />
          </g>
          {/* tang tren + chop bi hat bay */}
          <g transform={`translate(${CX + 154} 174) rotate(41)`}>
            <path d="M-9 -52 Q-9 -84 0 -100 Q9 -84 9 -52 L9 46 L-9 46 Z" fill="#0b0a10" stroke="#ffb25a" strokeWidth="1.1" />
            <path d="M-9 -22 H9 M-9 4 H9" stroke="#2a2630" strokeWidth="2.2" />
            <path d="M-6 46 L-11 62 L11 62 L6 46 Z" fill="#0b0a10" stroke="#ff9b3d" strokeWidth="0.9" />
            <ellipse cx="0" cy="66" rx="10" ry="16" fill="#ffb347" filter={u('b4')} />
          </g>
          {/* 2 manh fairing */}
          <g transform={`translate(${CX - 128} 138) rotate(-38)`}>
            <path d="M0 -42 Q18 -4 2 42 Q-7 -2 0 -42 Z" fill="#0b0a10" stroke="#ffb25a" strokeWidth="1" />
          </g>
          <g transform={`translate(${CX + 268} 112) rotate(64)`}>
            <path d="M0 -38 Q16 -4 2 38 Q-6 -2 0 -38 Z" fill="#0b0a10" stroke="#ffb25a" strokeWidth="1" />
          </g>

          {/* loi trang nong + dom sang */}
          <ellipse cx={CX} cy="356" rx="78" ry="58" fill={u('fbCore')} filter={u('b4')} />
          <ellipse cx={CX - 6} cy="368" rx="34" ry="26" fill="#fff" opacity="0.95" filter={u('b8')} />

          {/* song xung kich + bui */}
          <g fill="none">
            <ellipse cx={CX} cy="404" rx="396" ry="27" stroke="#fff1de" strokeWidth="5" opacity="0.38" filter={u('b2')} />
            <ellipse cx={CX} cy="404" rx="310" ry="20" stroke="#ffd9a8" strokeWidth="3" opacity="0.3" filter={u('b2')} />
          </g>
          <g filter={u('wisp')} opacity="0.5">
            <ellipse cx={CX - 340} cy="396" rx="70" ry="22" fill="#c79a78" />
            <ellipse cx={CX + 350} cy="394" rx="78" ry="24" fill="#c79a78" />
            <ellipse cx={CX} cy="408" rx="300" ry="9" fill="#d8b090" />
          </g>
        </>
      )}

      {/* ===== no tren khong ===== */}
      {scene.startsWith('air') && (
        <>
          {/* vet khoi cua duong bay (tu duoi len) */}
          <g filter={u('wisp')}>
            <path d={`M${CX - 220} 412 C${CX - 180} 330 ${CX - 60} 260 ${gen.cx} ${gen.cy}`} stroke="#ffffff" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.55" />
          </g>
          <path d={`M${CX - 220} 412 C${CX - 180} 330 ${CX - 60} 260 ${gen.cx} ${gen.cy}`} stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.85" filter={u('b2')} />
        </>
      )}
      {scene === 'air-boom' && (
        <>
          <g fill="none" opacity="0.7">
            <circle cx={gen.cx} cy={gen.cy} r="150" stroke="#ffffff" strokeWidth="3" filter={u('b4')} />
            <circle cx={gen.cx} cy={gen.cy} r="205" stroke="#ffffff" strokeWidth="2" filter={u('b8')} opacity="0.6" />
          </g>
          <g filter={u('fireA')}>
            <circle cx={gen.cx} cy={gen.cy} r="92" fill={u('fbOuter')} />
            <circle cx={gen.cx - 62} cy={gen.cy + 22} r="52" fill={u('fbOuter')} />
            <circle cx={gen.cx + 66} cy={gen.cy + 18} r="56" fill={u('fbOuter')} />
            <circle cx={gen.cx + 10} cy={gen.cy - 60} r="48" fill={u('fbOuter')} />
          </g>
          <g filter={u('fireB')}>
            <circle cx={gen.cx} cy={gen.cy} r="60" fill={u('fbMid')} />
            <circle cx={gen.cx - 38} cy={gen.cy + 16} r="34" fill={u('fbMid')} />
            <circle cx={gen.cx + 40} cy={gen.cy + 14} r="36" fill={u('fbMid')} />
          </g>
          <circle cx={gen.cx} cy={gen.cy} r="54" fill={u('fbCore')} filter={u('b4')} />
          {gen.arcs.map((a, i) => (
            <g key={i}>
              <path d={`M${r1(a.x0)} ${r1(a.y0)} Q${r1(a.cx)} ${r1(a.cy)} ${r1(a.x1)} ${r1(a.y1)}`} stroke="#fff" strokeWidth={r1(a.w)} fill="none" opacity="0.72" filter={u('wisp')} />
              <circle cx={r1(a.x1)} cy={r1(a.y1)} r={r1(a.w * 1.1)} fill="#ffb347" filter={u('b2')} />
            </g>
          ))}
        </>
      )}
      {scene === 'air-lost' && (
        <>
          <path d={`M${gen.cx} ${gen.cy} C${gen.cx + 60} ${gen.cy - 50} ${gen.cx + 140} ${gen.cy - 90} ${gen.cx + 260} ${gen.cy - 130}`} stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" filter={u('wisp')} />
          <circle cx={gen.cx + 262} cy={gen.cy - 131} r="14" fill="#ffd9a0" opacity="0.55" filter={u('b8')} />
          <circle cx={gen.cx + 262} cy={gen.cy - 131} r="3" fill="#fff" />
        </>
      )}

      {/* ===== tia lua, manh vo, hat than ===== */}
      {boom && (
        <>
          {gen.streaks.map((s, i) => (
            <g key={i}>
              <path d={s.d} fill={s.hot ? '#fff1c0' : '#ffb347'} opacity="0.86" filter={u('b2')} />
              <circle cx={r1(s.x2)} cy={r1(s.y2)} r={r1(s.w * 1.1)} fill="#fff7dc" />
            </g>
          ))}
          {gen.shards.map((s, i) => (
            <g key={i} transform={`translate(${r1(s.x)} ${r1(s.y)}) rotate(${r1(s.rot)})`}>
              <path d={`M${-s.s} ${-s.s * 0.4} L${s.s * 0.9} ${-s.s * 0.6} L${s.s * 0.6} ${s.s * 0.5} L${-s.s * 0.7} ${s.s * 0.3} Z`} fill={s.lit ? '#d8d2c8' : '#0b0a10'} stroke="#ffb25a" strokeWidth="0.8" />
            </g>
          ))}
          {gen.embers.map((e, i) => <circle key={i} cx={r1(e.x)} cy={r1(e.y)} r={r1(e.r)} fill="#ffb25a" opacity={e.o} />)}
        </>
      )}

      {/* ===== cot khoi tren khong (no tren khong) ===== */}
      {scene === 'air-boom' && (
        <g filter={u('smokeF')} opacity="0.85">
          {[0, 1, 2, 3, 4].map((k) => (
            <circle key={k} cx={gen.cx + 30 + k * 34} cy={gen.cy - 20 - k * 28} r={50 + k * 16} fill={u('smokeG')} />
          ))}
        </g>
      )}

      {/* ===== tien canh: nguoi dung xem + co + hang rao ===== */}
      {isPad && (
        <g>
          <path d={`M0 ${H} L0 486 C60 474 150 472 232 492 L276 ${H} Z`} fill="#050405" />
          <Watcher x={70} y={484} s={1.15} />
          <Watcher x={104} y={487} s={1.05} arm={false} />
          <Watcher x={138} y={489} s={1.1} />
          <path d={`M${W} ${H} L${W} 500 C${W - 120} 490 ${W - 230} 498 ${W - 300} 520 L${W - 330} ${H} Z`} fill="#050405" />
          <g stroke="#050405" strokeWidth="3" fill="none">
            <path d={`M240 512 H${W - 300}`} />
            {Array.from({ length: 17 }, (_, k) => <path key={k} d={`M${250 + k * 24} 500 V${H}`} strokeWidth="3.4" />)}
          </g>
          <g fill="#050405">
            {Array.from({ length: 46 }, (_, k) => {
              const gx = 10 + k * 21;
              const gh = 18 + ((k * 37) % 17);
              return <path key={k} d={`M${gx} ${H} L${gx + 4} ${H - gh} L${gx + 8} ${H}`} />;
            })}
          </g>
        </g>
      )}
      {!isPad && (
        <g fill="#050405">
          {Array.from({ length: 46 }, (_, k) => {
            const gx = 10 + k * 21;
            const gh = 14 + ((k * 37) % 15);
            return <path key={k} d={`M${gx} ${H} L${gx + 4} ${H - gh} L${gx + 8} ${H}`} />;
          })}
        </g>
      )}

      {/* ===== hieu ung ong kinh: lan quang, vignette, hat phim ===== */}
      {boom && <circle cx={gen.cx} cy={gen.cy + 10} r="330" fill={u('bloom')} style={{ mixBlendMode: 'screen' }} />}
      <rect x="0" y={-EXTRA} width={W} height={H + EXTRA} fill={u('vig')} />
      <rect x="0" y={-EXTRA} width={W} height={H + EXTRA} filter={u('grain')} opacity="0.2" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
}
