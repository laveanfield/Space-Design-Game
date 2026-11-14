import React from 'react';

/**
 * Chan dung minh hoa (SVG, ve tay) cho 2 vai: Ky su truong va Sep Ke Toan.
 * Muon thay bang tranh rieng cua nhom: sua 2 ham duoi day tra ve <img src=...> la xong (StoryScene khong can doi).
 * mood: 'calm' | 'worried' | 'smug' | 'angry' | 'happy'
 */

export function EngineerPortrait({ mood = 'calm' }) {
  const brow = mood === 'worried' ? 'M110 120 q14 -10 28 -2 M162 118 q14 -8 28 2' : 'M110 118 q14 -6 28 0 M162 118 q14 -6 28 0';
  const mouth = mood === 'happy' ? 'M135 172 q15 12 30 0' : mood === 'worried' ? 'M136 176 q14 -6 28 0' : 'M137 173 q13 4 26 0';
  return (
    <svg viewBox="0 0 300 380" className="portrait" aria-label="Kỹ sư trưởng">
      <defs>
        <linearGradient id="eh" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2b2420" /><stop offset="1" stopColor="#15110f" /></linearGradient>
        <linearGradient id="es" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3f4f6" /><stop offset="1" stopColor="#d5d9de" /></linearGradient>
      </defs>
      {/* toc phia sau */}
      <path d="M78 150 q-6 -110 72 -112 q78 2 72 112 l8 92 q-30 18 -58 6 l-6 -60 h-34 l-6 60 q-28 12 -56 -6z" fill="url(#eh)" />
      {/* than, ao so mi trang */}
      <path d="M40 380 q4 -96 70 -118 l40 -10 l40 10 q66 22 70 118z" fill="url(#es)" stroke="#9aa3ab" strokeWidth="1.5" />
      <path d="M128 252 l22 36 l22 -36" fill="none" stroke="#b9c0c7" strokeWidth="2" />
      {/* co + mat */}
      <rect x="132" y="200" width="36" height="52" rx="14" fill="#e8bfa0" />
      <ellipse cx="150" cy="140" rx="54" ry="66" fill="#f0c9a8" />
      <path d="M96 128 q-2 -74 56 -78 q60 2 56 76 q-14 -30 -46 -40 q-36 20 -66 42z" fill="url(#eh)" />
      <path d={brow} fill="none" stroke="#2b2420" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="124" cy="136" rx="7" ry="8" fill="#2c2420" /><ellipse cx="176" cy="136" rx="7" ry="8" fill="#2c2420" />
      <circle cx="126" cy="133" r="2" fill="#fff" /><circle cx="178" cy="133" r="2" fill="#fff" />
      <path d="M150 140 q-4 14 2 20" fill="none" stroke="#c99a7c" strokeWidth="2.5" strokeLinecap="round" />
      <path d={mouth} fill="none" stroke="#a5503f" strokeWidth="3.5" strokeLinecap="round" />
      {/* day deo the + the nhan vien */}
      <path d="M120 256 L140 330 M180 256 L160 330" stroke="#2f6fb0" strokeWidth="5" />
      <rect x="132" y="326" width="36" height="44" rx="4" fill="#e9eef3" stroke="#6b7884" strokeWidth="1.5" />
      <rect x="138" y="333" width="24" height="16" rx="2" fill="#9db3c8" />
      <rect x="138" y="354" width="24" height="3" fill="#6b7884" /><rect x="138" y="361" width="16" height="3" fill="#6b7884" />
      {/* bang kep giay ban ve */}
      <g transform="rotate(-14 230 320)">
        <rect x="196" y="262" width="78" height="104" rx="5" fill="#c8a477" stroke="#7d6340" strokeWidth="2" />
        <rect x="204" y="274" width="62" height="86" fill="#f6f2e6" />
        <rect x="222" y="256" width="26" height="12" rx="3" fill="#8a9097" />
        <path d="M212 292 h44 M212 304 h34 M212 316 h40 M212 330 l14 -10 l12 8 l16 -14" stroke="#4f7ca8" strokeWidth="2" fill="none" />
      </g>
      <path d="M196 300 q22 6 30 28" fill="none" stroke="#f0c9a8" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );
}

export function BossPortrait({ mood = 'smug' }) {
  const brow = mood === 'angry' ? 'M108 112 q16 10 30 4 M162 116 q14 6 30 -4' : 'M108 112 q15 -6 30 0 M162 112 q15 -6 30 0';
  const mouth = mood === 'angry' ? 'M132 182 q18 -10 36 0' : mood === 'happy' || mood === 'smug' ? 'M130 176 q20 16 40 -2' : 'M134 178 h32';
  return (
    <svg viewBox="0 0 300 380" className="portrait" aria-label="Sếp kế toán">
      <defs>
        <linearGradient id="bs" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f6f7f9" /><stop offset="1" stopColor="#d8dde3" /></linearGradient>
      </defs>
      {/* than: ao so mi trang + ca vat toi */}
      <path d="M36 380 q4 -100 74 -122 l40 -8 l40 8 q70 22 74 122z" fill="url(#bs)" stroke="#9aa3ab" strokeWidth="1.5" />
      <path d="M150 252 l-12 14 l12 96 l12 -96z" fill="#2a3340" />
      <path d="M138 252 l12 12 l12 -12 l-12 -4z" fill="#1d242e" />
      <path d="M112 256 l38 10 l-20 26z M188 256 l-38 10 l20 26z" fill="#eef1f4" stroke="#aab2ba" strokeWidth="1.2" />
      <rect x="132" y="200" width="36" height="54" rx="14" fill="#e6bb9c" />
      <ellipse cx="150" cy="138" rx="56" ry="68" fill="#efc5a4" />
      {/* toc vuot nguoc + mai */}
      <path d="M94 128 q-4 -82 60 -84 q58 2 54 82 q-10 -40 -56 -44 q-36 4 -58 46z" fill="#3b3631" />
      <path d="M100 112 q30 -38 92 -22" fill="none" stroke="#5a524a" strokeWidth="3" />
      <path d={brow} fill="none" stroke="#3b3631" strokeWidth="4.5" strokeLinecap="round" />
      {/* kinh gong den */}
      <rect x="106" y="122" width="38" height="28" rx="6" fill="rgba(200,220,235,0.25)" stroke="#1f2328" strokeWidth="4" />
      <rect x="156" y="122" width="38" height="28" rx="6" fill="rgba(200,220,235,0.25)" stroke="#1f2328" strokeWidth="4" />
      <path d="M144 134 h12" stroke="#1f2328" strokeWidth="4" />
      <circle cx="125" cy="137" r="5" fill="#2c2420" /><circle cx="175" cy="137" r="5" fill="#2c2420" />
      <path d="M150 146 q-5 14 3 20" fill="none" stroke="#c99a7c" strokeWidth="2.5" strokeLinecap="round" />
      <path d={mouth} fill="none" stroke="#9c4a3c" strokeWidth="3.5" strokeLinecap="round" />
      {mood === 'angry' && <path d="M206 92 l10 -10 M214 104 l14 -4 M200 82 l2 -14" stroke="#d33" strokeWidth="4" strokeLinecap="round" />}
      {/* may tinh cam tay */}
      <g transform="rotate(10 84 318)">
        <rect x="44" y="270" width="80" height="104" rx="8" fill="#2b2f35" stroke="#111" strokeWidth="2" />
        <rect x="54" y="282" width="60" height="22" rx="3" fill="#a8c3a0" />
        <text x="110" y="299" fontSize="14" textAnchor="end" fontFamily="monospace" fill="#203020">-$$$</text>
        {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={56 + c * 20} y={312 + r * 15} width="15" height="10" rx="2" fill={c === 2 && r === 3 ? '#d98a2b' : '#5d646d'} />))}
      </g>
      <path d="M86 300 q-6 22 18 34" fill="none" stroke="#efc5a4" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );
}
