import React from 'react';
import { useGame } from '../core/GameContext';
import { tr } from '../core/i18n';
import { getHumanityImpact } from '../story/humanityImpact';

function MissionImpactArt({ missionKey, success, lang = 'vi' }) {
  if (missionKey === 'space_weather') {
    const stroke = success ? '#59d38c' : '#ff6b57';
    const glow = success ? '#89e8ae' : '#ff9a3c';
    return (
      <svg viewBox="0 0 180 116" className="impact-art-svg" aria-hidden="true">
        <rect x="2" y="2" width="176" height="112" rx="4" fill="#13191f" stroke="#3c4650" strokeWidth="1.5" />
        {/* Sun / CME storm arc */}
        <circle cx="26" cy="24" r="14" fill="#d97724" opacity="0.9" />
        <path d="M40 16 Q66 28 50 48" fill="none" stroke={glow} strokeWidth="2.2" strokeDasharray="4 3" />
        <path d="M46 10 Q78 26 60 56" fill="none" stroke={glow} strokeWidth="1.4" opacity="0.6" />
        {/* Polar plane silhouette */}
        <path
          d="M114 22 L134 26 L142 18 L146 26 L156 27 L146 31 L142 38 L135 30 L114 33 Z"
          fill={success ? '#9be8bc' : '#ffb49f'}
        />
        {!success && (
          <text x="140" y="15" fontSize="9" fontWeight="800" fill="#ff6b57" textAnchor="middle">
            {tr(lang, 'MẤT GPS', 'NO GPS')}
          </text>
        )}
        {/* Power grid pylons */}
        <g stroke={stroke} strokeWidth="2" fill="none">
          <path d="M36 98 L46 64 L56 98 M38 74 L54 74 M35 84 L57 84" />
          <path d="M90 98 L100 64 L110 98 M92 74 L108 74 M90 84 L111 84" />
          <path d="M54 74 Q73 82 92 74" strokeWidth="1.5" />
          <path d="M108 74 Q134 80 154 76" strokeWidth="1.5" strokeDasharray={success ? undefined : '3 3'} />
        </g>
        {/* City skyline */}
        <rect x="128" y="80" width="14" height="18" fill={success ? '#2b4738' : '#231819'} stroke={stroke} strokeWidth="1" />
        <rect x="145" y="72" width="16" height="26" fill={success ? '#2b4738' : '#231819'} stroke={stroke} strokeWidth="1" />
        {success ? (
          <>
            <rect x="132" y="84" width="3" height="3" fill="#ffd166" />
            <rect x="149" y="77" width="3" height="3" fill="#ffd166" />
            <rect x="154" y="83" width="3" height="3" fill="#ffd166" />
          </>
        ) : (
          <path d="M95 56 L101 66 L97 66 L104 76" fill="none" stroke="#ffc04d" strokeWidth="2" />
        )}
        <text x="90" y="109" fontSize="8" fontWeight="700" fill="#b7c0c8" textAnchor="middle">
          {success
            ? tr(lang, 'BẢO VỆ 14 LƯỚI ĐIỆN QUỐC GIA', '14 NATIONAL GRIDS PROTECTED')
            : tr(lang, 'SẬP LƯỚI ĐIỆN VÌ BÃO TỪ', 'BLACKOUT // GEOMAGNETIC STORM')}
        </text>
      </svg>
    );
  }

  if (missionKey === 'ghg') {
    const cropFill = success ? '#3f7d52' : '#7a5a33';
    const skyGlow = success ? '#59d38c' : '#ff7a48';
    return (
      <svg viewBox="0 0 180 116" className="impact-art-svg" aria-hidden="true">
        <rect x="2" y="2" width="176" height="112" rx="4" fill="#13191f" stroke="#3c4650" strokeWidth="1.5" />
        {/* Factory stacks & methane cloud */}
        <rect x="22" y="54" width="14" height="40" fill="#2d3640" stroke="#53606e" />
        <rect x="40" y="62" width="12" height="32" fill="#2d3640" stroke="#53606e" />
        <rect x="18" y="74" width="44" height="20" fill="#222930" stroke="#53606e" />
        {!success ? (
          <g fill="#ff8f5c" opacity="0.55">
            <circle cx="32" cy="40" r="10" />
            <circle cx="48" cy="32" r="13" />
            <circle cx="68" cy="27" r="15" />
            <circle cx="92" cy="30" r="12" />
          </g>
        ) : (
          <g>
            <line x1="29" y1="45" x2="88" y2="20" stroke="#59d38c" strokeWidth="1.6" strokeDasharray="3 2" />
            <circle cx="30" cy="48" r="7" fill="none" stroke="#59d38c" strokeWidth="2" />
            <rect x="82" y="14" width="12" height="7" fill="#ffc04d" />
            <text x="118" y="23" fontSize="8" fontWeight="800" fill="#59d38c">
              {tr(lang, '27 ĐIỂM RÒ ĐÃ KHÓA', '27 LEAKS SEALED')}
            </text>
          </g>
        )}
        {/* Agricultural fields */}
        <path d="M68 94 Q120 74 168 84 L168 96 L68 96 Z" fill={cropFill} stroke={skyGlow} strokeWidth="1.2" />
        <path d="M76 92 L162 88" stroke="#182026" strokeWidth="1" opacity="0.6" />
        {!success && (
          <path d="M98 85 L106 91 L101 95 M132 82 L139 89 L135 94" stroke="#2c1d11" strokeWidth="1.5" fill="none" />
        )}
        <text x="90" y="109" fontSize="8" fontWeight="700" fill="#b7c0c8" textAnchor="middle">
          {success
            ? tr(lang, 'CHẶN ĐỨNG SIÊU NGUỒN PHÁT THẢI', 'CH4 SUPER-EMITTERS STOPPED')
            : tr(lang, 'RÒ RỈ METHANE GÂY HẠN MẶN', 'METHANE PLUME // DROUGHT')}
        </text>
      </svg>
    );
  }

  // Default / wildfire (MP-SC01-FIRST-EYES)
  const treeColor = success ? '#3d8254' : '#302119';
  const accent = success ? '#59d38c' : '#ff6b57';
  return (
    <svg viewBox="0 0 180 116" className="impact-art-svg" aria-hidden="true">
      <rect x="2" y="2" width="176" height="112" rx="4" fill="#13191f" stroke="#3c4650" strokeWidth="1.5" />
      {/* Ridge & forest */}
      <path d="M8 94 Q55 68 105 84 T172 80 L172 98 L8 98 Z" fill={success ? '#1f3829' : '#2b1b15'} />
      {[22, 38, 56, 74, 92, 110, 128, 146].map((x, idx) => (
        <polygon
          key={x}
          points={`${x},86 ${x + 7},${idx % 2 === 0 ? 54 : 60} ${x + 14},86`}
          fill={idx >= 2 && idx <= 5 && !success ? '#472115' : treeColor}
          stroke={accent}
          strokeWidth="0.7"
        />
      ))}
      {!success ? (
        <g>
          <path d="M52 84 C48 66, 62 62, 60 44 C70 55, 72 68, 66 84 Z" fill="#ff7338" />
          <path d="M80 84 C75 62, 92 54, 88 34 C99 48, 104 65, 96 84 Z" fill="#ffb648" />
          <path d="M108 84 C104 68, 116 62, 114 48 C122 58, 124 70, 118 84 Z" fill="#ff5533" />
          <circle cx="90" cy="24" r="10" fill="#5e514b" opacity="0.55" />
        </g>
      ) : (
        <g>
          <path d="M90 18 L56 72 L106 72 Z" fill="rgba(89, 211, 140, 0.16)" stroke="#59d38c" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="84" y="13" width="12" height="7" fill="#ffc04d" />
          <circle cx="72" cy="70" r="4" fill="#ffc04d" />
        </g>
      )}
      <text x="90" y="109" fontSize="8" fontWeight="700" fill="#b7c0c8" textAnchor="middle">
        {success
          ? tr(lang, 'BẢO VỆ 142.000 HA RỪNG NGUYÊN SINH', '142,000 HA PROTECTED')
          : tr(lang, 'MẤT TRẮNG 142.000 HA RỪNG', '142,000 HA LOST // NO DOWNLINK')}
      </text>
    </svg>
  );
}

export default function HumanityImpactCard({
  missionId,
  success,
  failureId,
  outcome,
  compact = false,
  lang: propLang,
}) {
  const { lang: gameLang } = useGame();
  const lang = propLang || gameLang || 'vi';

  const story = getHumanityImpact(missionId, { success, failureId, outcome, lang });
  const toneClass = story.success ? 'ok' : 'fail';

  return (
    <section className={`humanity-impact-card ${toneClass} ${compact ? 'compact' : ''}`}>
      <div className="impact-header">
        <div className="impact-header-left">
          <span className="impact-kicker">
            {tr(lang, 'BÁO CÁO TÁC ĐỘNG NHÂN LOẠI', 'EARTH IMPACT REPORT')}
          </span>
          <span className="impact-story-tag">{story.levelTag}</span>
        </div>
        <span className={`badge ${story.success ? 'ok' : 'err'}`}>{story.badge}</span>
      </div>

      <h3 className="impact-headline">{story.headline}</h3>

      {story.causeBridge && (
        <div className="impact-cause-bridge">
          <strong>{tr(lang, 'NGUYÊN NHÂN KỸ THUẬT → TÁC ĐỘNG MẶT ĐẤT:', 'TECHNICAL CAUSE → GROUND IMPACT:')}</strong>{' '}
          {story.causeBridge}
        </div>
      )}

      <div className={`impact-body-grid ${compact ? 'compact' : ''}`}>
        {!compact && (
          <div className="impact-art-wrap">
            <MissionImpactArt missionKey={story.missionKey} success={story.success} lang={lang} />
          </div>
        )}
        <div className="impact-narrative">
          {(compact ? story.paragraphs.slice(0, 1) : story.paragraphs).map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </div>

      <div className="impact-metrics-grid">
        {story.metrics.map((m) => (
          <div key={m.label} className="impact-metric-box">
            <div className="impact-metric-value">{m.value}</div>
            <div className="impact-metric-label">{m.label}</div>
            <div className="impact-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="impact-moral-box">{story.moral}</div>
    </section>
  );
}
