import React from 'react';
import { getHumanityImpact } from '../story/humanityImpact';

function MissionImpactArt({ missionKey, success }) {
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
            NO GPS
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
          {success ? '14 NATIONAL GRIDS PROTECTED' : 'G5 BLACKOUT // VAN ALLEN BREACH'}
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
              27 LEAKS SEALED
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
          {success ? 'CH4 SUPER-EMITTERS STOPPED' : 'METHANE PLUME // CROP DROUGHT'}
        </text>
      </svg>
    );
  }

  // Default / missionKey === 'wildfire' (MP-SC01-FIRST-EYES)
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
        {success ? '142,000 HA PROTECTED // EARLY LOCK' : '142,000 HA LOST // NO DOWNLINK'}
      </text>
    </svg>
  );
}

/** Ngay thang tren dau bao (theo dong ho may nguoi choi). */
function editionDate() {
  try {
    return new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * HumanityImpactCard -- bao cao hau qua trinh bay nhu MOT TRANG BAO "tin nong" (kieu bao in khổ lon):
 * ten bao chu gothic, tit lon chu co chan, sapo, anh dau trang, bai viet chia cot co chu cai dau to,
 * khung "nhung con so" va trich dan noi bat. Ten bao "The Orbital Times" la HU CAU (khong dung ten / logo
 * cua to bao that nao). Noi dung cau chuyen giu nguyen tu story/humanityImpact.js.
 */
export default function HumanityImpactCard({ missionId, success, failureId, outcome, compact = false }) {
  const story = getHumanityImpact(missionId, { success, failureId, outcome });
  const toneClass = story.success ? 'ok' : 'fail';
  const paragraphs = compact ? story.paragraphs.slice(0, 1) : story.paragraphs;

  return (
    <article className={`news-paper ${toneClass} ${compact ? 'compact' : ''}`}>
      <header className="news-masthead">
        {!compact && (
          <div className="news-ears">
            <span>ẤN BẢN TRÁI ĐẤT</span>
            <span>“Mọi tin tức đều bắt đầu từ quỹ đạo”</span>
          </div>
        )}
        <h2 className="news-name">The Orbital Times</h2>
        <div className="news-dateline">
          <span>{story.levelTag}</span>
          <span>{editionDate()}</span>
          <span>ẤN BẢN MINH HỌA</span>
        </div>
      </header>

      <div className="news-breaking">
        <b>{story.success ? 'TIN NÓNG' : 'TIN KHẨN'}</b>
        <span>{story.badge}</span>
      </div>

      <h1 className="news-headline">{story.headline}</h1>
      {story.causeBridge && <p className="news-deck">{story.causeBridge}</p>}
      <div className="news-byline">Bản tin Không gian &amp; Trái Đất · Trạm điều hành mặt đất</div>

      <div className="news-body">
        <div className="news-main">
          <figure className="news-photo">
            <img src={`/mission_art/${missionId}.jpg`} alt="" draggable={false} />
            <figcaption>Ảnh minh họa vùng nhiệm vụ nhìn từ quỹ đạo.</figcaption>
          </figure>
          <div className="news-columns">
            {paragraphs.map((p, idx) => (
              <p key={idx} className={idx === 0 ? 'lead' : ''}>
                {p}
              </p>
            ))}
          </div>
        </div>
        <aside className="news-sidebar">
          <div className="news-sidebar-title">NHỮNG CON SỐ</div>
          {story.metrics.map((m) => (
            <div key={m.label} className="news-figure">
              <div className="news-figure-value">{m.value}</div>
              <div className="news-figure-label">{m.label}</div>
              {!compact && <div className="news-figure-sub">{m.sub}</div>}
            </div>
          ))}
          {!compact && (
            <div className="news-infographic">
              <MissionImpactArt missionKey={story.missionKey} success={story.success} />
            </div>
          )}
        </aside>
      </div>

      {!compact && <blockquote className="news-pullquote">{story.moral}</blockquote>}
      <footer className="news-foot">Bài báo và số liệu là minh họa cho câu chuyện trong trò chơi, không phải thống kê thật.</footer>
    </article>
  );
}
