import React, { useEffect, useMemo, useState } from 'react';
import { playSoundAsset } from '../api/client';
import { BossPortrait, EngineerPortrait } from './Portraits';
import { CAST, fill } from './14-11-2026-script';
import { LaunchPadStatic } from '../anatomy/LaunchPadFigure';

/**
 * StoryScene -- canh hoi thoai kieu visual novel (theo anh concept cua nhom):
 *   thanh tren: MISSION ARCHITECT - [LEVEL n: ten] | Quy du an | Han
 *   nen: xuong lap rap nhin ra bai phong; 2 khung nhan vat trai/phai; hop thoai duoi cung + "Tiep tuc >>".
 * Bam bat ky dau (hoac Enter / Space) de qua cau; "Bo qua" de dong ngay.
 */

/** Nen xuong + cua lon mo ra bai phong (SVG, khong logo). Ben ngoai cua la hinh be phong ve bang /anatomy. */
function HangarBackdrop({ withPad }) {
  return (
    <div className="story-bg">
      <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" className="story-bg-svg" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#bcd8ee" /><stop offset="1" stopColor="#e9e2d0" /></linearGradient>
          <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5d6a73" /><stop offset="1" stopColor="#3b454d" /></linearGradient>
          <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7d858a" /><stop offset="1" stopColor="#4a5257" /></linearGradient>
        </defs>
        <rect width="1200" height="640" fill="url(#wall)" />
        {/* cua cuon mo -> troi, bai phong o xa */}
        <rect x="380" y="150" width="440" height="330" fill="url(#sky)" />
        <rect x="380" y="430" width="440" height="50" fill="#b9ad8a" />
        {!withPad && (
          <g opacity="0.85" fill="#7b8790">
            <rect x="470" y="250" width="22" height="182" /><rect x="700" y="230" width="26" height="202" />
          </g>
        )}
        <path d="M380 150 h440 v18 h-440z" fill="#2c343a" />
        {/* khung thep tuong, ray cau truc, cau truc mau cam */}
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={40 + i * 230} y="40" width="16" height="460" fill="#2e373e" />)}
        <rect x="0" y="70" width="1200" height="20" fill="#2a3238" />
        <rect x="300" y="96" width="600" height="26" fill="#d8862b" /><rect x="560" y="122" width="60" height="30" fill="#b86f22" />
        <path d="M590 152 v120" stroke="#2a3238" strokeWidth="4" /><rect x="578" y="270" width="24" height="18" fill="#d8862b" />
        {/* bien canh bao */}
        <rect x="300" y="300" width="52" height="34" fill="#f2c230" stroke="#222" strokeWidth="2" />
        <text x="326" y="314" fontSize="9" textAnchor="middle" fontWeight="700" fill="#222">KHU VỰC</text>
        <text x="326" y="327" fontSize="9" textAnchor="middle" fontWeight="700" fill="#222">CẤM</text>
        <rect x="850" y="320" width="48" height="26" fill="#f2c230" stroke="#222" strokeWidth="2" />
        <text x="874" y="337" fontSize="9" textAnchor="middle" fontWeight="700" fill="#222">CẨN THẬN</text>
        {/* san xuong + vach vang */}
        <path d="M0 480 h1200 v160 h-1200z" fill="url(#floor)" />
        <path d="M0 520 h1200" stroke="#e1b320" strokeWidth="6" strokeDasharray="40 20" />
        <path d="M520 480 l-120 160 M680 480 l120 160" stroke="#e1b320" strokeWidth="5" />
      </svg>
      {withPad && (
        <div className="story-pad">
          <LaunchPadStatic theme="light" />
        </div>
      )}
    </div>
  );
}

const typeSpeed = 22; // ky tu / 1000/ms

export default function StoryScene({ lines, ctx, header, audioOn, onClose, withPad = true }) {
  const script = useMemo(() => (lines || []).map((l) => ({ ...l, text: fill(l.text, ctx || {}) })), [lines, ctx]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(0);
  const line = script[i];

  useEffect(() => { setI(0); }, [lines]);
  useEffect(() => {
    if (!line) return undefined;
    setTyped(0);
    playSoundAsset(audioOn, line.who === 'boss' ? '06-11-2026-click.wav' : '08-11-2026-relay_click.wav', 0.18);
    const id = setInterval(() => setTyped((n) => { if (n >= line.text.length) { clearInterval(id); return n; } return n + 1; }), 1000 / typeSpeed);
    return () => clearInterval(id);
  }, [i, line, audioOn]);

  const next = () => {
    if (!line) return onClose?.();
    if (typed < line.text.length) return setTyped(line.text.length); // bam lan 1: hien het cau
    if (i + 1 >= script.length) return onClose?.();
    return setI(i + 1);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!line) return null;
  const speaking = line.who;
  const mood = ctx?.mood || {};
  return (
    <div className="story-overlay" role="dialog" aria-modal="true" onClick={next}>
      <div className="story-frame">
        <div className="story-top">
          <span>MISSION ARCHITECT — [{header?.level || 'LEVEL 1'}: {header?.title || ''}]</span>
          <span>
            Quỹ dự án: <strong className="money">${header?.budget ?? '-'}M</strong> | Hạn: <strong className="deadline">{header?.deadline ?? '-'} Tháng</strong>
          </span>
        </div>
        <HangarBackdrop withPad={withPad} />
        <div className={`story-char left ${speaking === 'eng' ? 'speaking' : ''}`}>
          <EngineerPortrait mood={mood.eng || (speaking === 'eng' ? 'calm' : 'worried')} />
          <div className="story-name">{CAST.eng.name}</div>
        </div>
        <div className={`story-char right ${speaking === 'boss' ? 'speaking' : ''}`}>
          <BossPortrait mood={mood.boss || 'smug'} />
          <div className="story-name">{CAST.boss.name}</div>
        </div>
        <div className="story-box">
          <div className="story-speaker">[{CAST[speaking].name}]</div>
          <div className="story-text">{line.text.slice(0, typed)}<span className="story-caret">▍</span></div>
          <div className="story-actions">
            <button className="btn small" onClick={(e) => { e.stopPropagation(); onClose?.(); }}>Bỏ qua</button>
            <button className="btn small primary" onClick={(e) => { e.stopPropagation(); next(); }}>
              {i + 1 >= script.length && typed >= line.text.length ? 'Đóng' : 'Tiếp tục >>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
