import React from 'react';

/**
 * Chan dung minh hoa phong cach xuong co khi (matching concept art):
 * - Ky su truong: mu bao ho vang, kinh han, quan yếm, cam bao cao ky thuat.
 * - Sep ke toan: mu tru cao, kinh 1 trong, cam so sach va tien mat.
 * mood: 'calm' | 'worried' | 'smug' | 'angry' | 'happy'
 */

export function EngineerPortrait({ mood = 'calm' }) {
  const angryOrFirm = mood === 'worried' || mood === 'calm';
  const brow = angryOrFirm ? 'M76 92 L96 98 M124 92 L104 98' : 'M76 90 Q86 86 96 90 M104 90 Q114 86 124 90';
  const mouth =
    mood === 'happy'
      ? 'M88 128 Q100 138 112 128'
      : mood === 'worried'
        ? 'M88 132 Q100 124 112 132'
        : 'M89 130 L111 130';

  return (
    <svg viewBox="0 0 220 175" className="portrait" aria-label="Chief Engineer">
      <defs>
        <linearGradient id="engBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#352a1e" />
          <stop offset="100%" stopColor="#1b1815" />
        </linearGradient>
        <linearGradient id="engHat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3bd52" />
          <stop offset="100%" stopColor="#b87b22" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="216" height="171" rx="4" fill="url(#engBg)" stroke="#70583c" strokeWidth="2" />
      <radialGradient id="engGlow" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stopColor="rgba(255,190,90,0.28)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
      <rect x="2" y="2" width="216" height="171" fill="url(#engGlow)" />

      {/* Tattered technical report held up in left hand */}
      <g transform="rotate(-10 38 122)">
        <rect x="14" y="76" width="50" height="68" rx="2" fill="#e8dcc0" stroke="#2c241b" strokeWidth="2.5" />
        <text x="39" y="93" fontSize="6.5" fontWeight="800" fill="#2c241b" textAnchor="middle" fontFamily="monospace">
          TECHNICAL
        </text>
        <text x="39" y="102" fontSize="6.5" fontWeight="800" fill="#2c241b" textAnchor="middle" fontFamily="monospace">
          REPORT
        </text>
        <path d="M22 112 h34 M22 120 h26 M22 128 h30" stroke="#5f5240" strokeWidth="2" />
        <circle cx="48" cy="130" r="8" fill="none" stroke="#c0392b" strokeWidth="1.6" />
      </g>

      {/* Body & Work Overalls */}
      <path d="M58 173 L66 138 L134 138 L142 173 Z" fill="#9ea3a8" stroke="#221e1a" strokeWidth="2.5" />
      <rect x="74" y="142" width="52" height="31" fill="#6d6452" stroke="#221e1a" strokeWidth="2" />
      <rect x="74" y="138" width="11" height="28" fill="#5b5344" stroke="#221e1a" strokeWidth="1.8" />
      <rect x="115" y="138" width="11" height="28" fill="#5b5344" stroke="#221e1a" strokeWidth="1.8" />
      <circle cx="80" cy="152" r="2.2" fill="#e8b84b" />
      <circle cx="120" cy="152" r="2.2" fill="#e8b84b" />

      {/* Pointing arm */}
      <path d="M132 146 L186 138" stroke="#e4bfa0" strokeWidth="12" strokeLinecap="round" />
      <path d="M132 146 L186 138" stroke="#221e1a" strokeWidth="12" strokeLinecap="round" opacity="0.12" />
      <circle cx="192" cy="138" r="6" fill="#e4bfa0" stroke="#221e1a" strokeWidth="2" />

      {/* Messy dark hair + head */}
      <path d="M62 112 Q54 76 100 72 Q146 76 138 112 Q144 126 132 132 L68 132 Q56 126 62 112 Z" fill="#2d2621" stroke="#181310" strokeWidth="2" />
      <ellipse cx="100" cy="108" rx="30" ry="30" fill="#e7c2a3" stroke="#221e1a" strokeWidth="2.5" />
      <path d="M66 96 L78 86 L92 94 L106 84 L122 94 L134 86 L132 74 Q100 66 68 74 Z" fill="#2d2621" />

      {/* Eyes + Dark under-eye circles + Brows */}
      <path d={brow} fill="none" stroke="#1d1815" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="86" cy="107" rx="7" ry="6" fill="#fff" stroke="#1d1815" strokeWidth="2" />
      <ellipse cx="114" cy="107" rx="7" ry="6" fill="#fff" stroke="#1d1815" strokeWidth="2" />
      <circle cx="88" cy="107" r="3" fill="#1d1815" />
      <circle cx="116" cy="107" r="3" fill="#1d1815" />
      <path d="M78 114 Q86 118 94 114 M106 114 Q114 118 122 114" fill="none" stroke="#8a6250" strokeWidth="1.5" />
      <path d="M98 112 Q96 119 101 121" fill="none" stroke="#8a6250" strokeWidth="2" strokeLinecap="round" />
      <path d={mouth} fill="none" stroke="#632f25" strokeWidth="2.8" strokeLinecap="round" />

      {/* Hard hat + Brass goggles */}
      <path d="M60 72 Q62 32 100 30 Q138 32 140 72 Z" fill="url(#engHat)" stroke="#221e1a" strokeWidth="2.5" />
      <path d="M94 31 L106 31 L109 64 L91 64 Z" fill="#f7cf6c" stroke="#221e1a" strokeWidth="2" />
      <rect x="54" y="68" width="92" height="9" rx="4" fill="#c98d2b" stroke="#221e1a" strokeWidth="2.5" />
      <rect x="70" y="53" width="24" height="17" rx="5" fill="#70808c" stroke="#221e1a" strokeWidth="2.2" />
      <rect x="106" y="53" width="24" height="17" rx="5" fill="#70808c" stroke="#221e1a" strokeWidth="2.2" />
      <circle cx="82" cy="61.5" r="6" fill="#3a4b56" />
      <circle cx="118" cy="61.5" r="6" fill="#3a4b56" />
      <rect x="94" y="59" width="12" height="5" fill="#3d352c" />
    </svg>
  );
}

/**
 * Avatar hinh tron cua Ky su truong (zoom can canh khuon mat & mu bao ho)
 * dung cho hop huong dan (Tutorial) o goc phai man hinh.
 */
export function EngineerCircleAvatar({ mood = 'happy' }) {
  const brow =
    mood === 'worried'
      ? 'M76 92 L96 98 M124 92 L104 98'
      : 'M76 89 Q86 84 96 89 M104 89 Q114 84 124 89';
  const mouth =
    mood === 'happy'
      ? 'M87 126 Q100 137 113 126'
      : mood === 'worried'
        ? 'M88 132 Q100 124 112 132'
        : 'M89 129 L111 129';

  return (
    <svg viewBox="46 22 108 124" className="eng-circle-svg" aria-label="Chief Engineer Guide">
      <defs>
        <radialGradient id="engCircleBg" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#1e3b2b" />
          <stop offset="100%" stopColor="#0b1510" />
        </radialGradient>
        <linearGradient id="engCircleHat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6c75c" />
          <stop offset="100%" stopColor="#b87b22" />
        </linearGradient>
      </defs>
      <rect x="40" y="18" width="120" height="134" fill="url(#engCircleBg)" />

      {/* Shoulders & Overalls */}
      <path d="M56 150 L66 135 L134 135 L144 150 Z" fill="#9ea3a8" stroke="#221e1a" strokeWidth="2.5" />
      <rect x="74" y="138" width="52" height="16" fill="#6d6452" stroke="#221e1a" strokeWidth="2" />
      <rect x="74" y="135" width="11" height="15" fill="#5b5344" stroke="#221e1a" strokeWidth="1.8" />
      <rect x="115" y="135" width="11" height="15" fill="#5b5344" stroke="#221e1a" strokeWidth="1.8" />

      {/* Hair + Head */}
      <path
        d="M62 112 Q54 76 100 72 Q146 76 138 112 Q144 126 132 132 L68 132 Q56 126 62 112 Z"
        fill="#2d2621"
        stroke="#181310"
        strokeWidth="2"
      />
      <ellipse cx="100" cy="108" rx="30" ry="29" fill="#e7c2a3" stroke="#221e1a" strokeWidth="2.5" />
      <path d="M66 96 L78 86 L92 94 L106 84 L122 94 L134 86 L132 74 Q100 66 68 74 Z" fill="#2d2621" />

      {/* Eyes & Smile */}
      <path d={brow} fill="none" stroke="#1d1815" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="86" cy="106" rx="7" ry="6" fill="#fff" stroke="#1d1815" strokeWidth="2" />
      <ellipse cx="114" cy="106" rx="7" ry="6" fill="#fff" stroke="#1d1815" strokeWidth="2" />
      <circle cx="87" cy="106" r="3.2" fill="#1d1815" />
      <circle cx="115" cy="106" r="3.2" fill="#1d1815" />
      <circle cx="88.5" cy="104.5" r="1.1" fill="#fff" />
      <circle cx="116.5" cy="104.5" r="1.1" fill="#fff" />
      <path d="M98 111 Q96 118 101 120" fill="none" stroke="#8a6250" strokeWidth="2" strokeLinecap="round" />
      <path d={mouth} fill="none" stroke="#632f25" strokeWidth="2.8" strokeLinecap="round" />

      {/* Hard hat + Brass goggles */}
      <path d="M60 72 Q62 32 100 30 Q138 32 140 72 Z" fill="url(#engCircleHat)" stroke="#221e1a" strokeWidth="2.5" />
      <path d="M94 31 L106 31 L109 64 L91 64 Z" fill="#f7cf6c" stroke="#221e1a" strokeWidth="2" />
      <rect x="54" y="68" width="92" height="9" rx="4" fill="#c98d2b" stroke="#221e1a" strokeWidth="2.5" />
      <rect x="70" y="53" width="24" height="17" rx="5" fill="#70808c" stroke="#221e1a" strokeWidth="2.2" />
      <rect x="106" y="53" width="24" height="17" rx="5" fill="#70808c" stroke="#221e1a" strokeWidth="2.2" />
      <circle cx="82" cy="61.5" r="6" fill="#39ff14" opacity="0.82" />
      <circle cx="118" cy="61.5" r="6" fill="#39ff14" opacity="0.82" />
      <rect x="94" y="59" width="12" height="5" fill="#3d352c" />
    </svg>
  );
}

export function BossPortrait({ mood = 'smug' }) {
  const isAlert = mood === 'angry' || mood === 'worried';
  const mouth = isAlert ? 'M100 128 Q114 121 128 129' : 'M100 124 Q114 134 128 122';

  return (
    <svg viewBox="0 0 220 175" className="portrait" aria-label="Finance Director">
      <defs>
        <linearGradient id="bossBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#35251d" />
          <stop offset="100%" stopColor="#191614" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="216" height="171" rx="4" fill="url(#bossBg)" stroke="#70583c" strokeWidth="2" />

      {/* Sweat drops when confronted */}
      {isAlert && (
        <g fill="#a9dcff" stroke="#243a47" strokeWidth="1.2">
          <path d="M68 88 Q62 98 68 103 Q74 98 68 88 Z" />
          <path d="M160 80 Q155 89 160 94 Q165 89 160 80 Z" />
        </g>
      )}

      {/* Suit & Tie */}
      <path d="M58 173 L68 134 L158 134 L168 173 Z" fill="#2c333c" stroke="#14181d" strokeWidth="2.5" />
      <path d="M100 134 L114 156 L128 134 Z" fill="#eae5d5" stroke="#14181d" strokeWidth="1.8" />
      <path d="M114 138 L108 168 L114 173 L120 168 Z" fill="#8b2b2b" stroke="#14181d" strokeWidth="1.5" />

      {/* Face */}
      <ellipse cx="114" cy="108" rx="33" ry="30" fill="#ecc4a6" stroke="#221e1a" strokeWidth="2.5" />
      <path d="M84 92 L102 96 M142 91 L126 96" stroke="#2b2623" strokeWidth="3.2" strokeLinecap="round" />

      {/* Eyes + Monocle */}
      <ellipse cx="99" cy="106" rx="7" ry="6.5" fill="#fff" stroke="#221e1a" strokeWidth="2" />
      <ellipse cx="129" cy="106" rx="8.5" ry="8" fill="#d8edf5" stroke="#d49b38" strokeWidth="2.6" />
      <circle cx="98" cy="106" r="2.8" fill="#1f1b18" />
      <circle cx="128" cy="106" r="2.8" fill="#1f1b18" />
      <path d="M137 112 Q144 132 135 148" fill="none" stroke="#d49b38" strokeWidth="1.6" />

      {/* Mustache & mouth */}
      <path d="M98 119 Q106 113 114 118 Q122 113 130 119" fill="none" stroke="#453b34" strokeWidth="4.2" strokeLinecap="round" />
      <path d={mouth} fill="none" stroke="#753429" strokeWidth="2.5" strokeLinecap="round" />

      {/* Top Hat */}
      <path d="M78 76 L85 24 L143 24 L150 76 Z" fill="#20252c" stroke="#111317" strokeWidth="2.5" />
      <rect x="81" y="64" width="66" height="10" fill="#5e4b32" stroke="#111317" strokeWidth="1.5" />
      <rect x="64" y="74" width="100" height="8" rx="4" fill="#1b2026" stroke="#111317" strokeWidth="2.5" />

      {/* Ledger & Cash clutched in hands */}
      <g transform="rotate(-12 68 150)">
        <rect x="40" y="122" width="44" height="50" rx="3" fill="#464d55" stroke="#15181c" strokeWidth="2.2" />
        <rect x="46" y="130" width="32" height="32" fill="#e9dfc4" />
        <path d="M51 138 h22 M51 146 h18 M51 154 h22" stroke="#5a4f3f" strokeWidth="2" />
      </g>
      <g transform="rotate(14 166 146)">
        <rect x="148" y="132" width="38" height="22" rx="2" fill="#77966c" stroke="#1f291c" strokeWidth="2" />
        <circle cx="167" cy="143" r="5" fill="#9fc490" />
      </g>
    </svg>
  );
}
