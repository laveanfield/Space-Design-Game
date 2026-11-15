import React, { useState } from 'react';
import { playSoundAsset } from '../api/client';
import { BossPortrait, EngineerPortrait } from '../story/Portraits';

/**
 * BossConfrontation -- Man chat van Sep theo phong cach Workshop Boss Confrontation:
 * - Bang banner giay cu "BOSS CONFRONTATION // CHAT VAN SEP"
 * - 2 chan dung doi thoai [Kỹ sư trưởng] vs [Sếp kế toán]
 * - 3 the chung cu giay da (BÁO CÁO LỖI / HÓA ĐƠN KHỐNG / SỔ ĐEN CỦA SẾP)
 * - Thanh mo khoa ngan sach + nut [ RÚT LUI ] va [ TẤN CÔNG ]
 */

function EvidenceIcon({ type }) {
  if (type === 'DOC-01') {
    return (
      <svg viewBox="0 0 64 48" className="audit-svg-icon" aria-hidden="true">
        <path d="M12 6 h30 l10 10 v26 h-40 z" fill="#f3ebd2" stroke="#3b3022" strokeWidth="2" />
        <circle cx="32" cy="27" r="9" fill="none" stroke="#6f5a3f" strokeWidth="3.2" strokeDasharray="4 2" />
        <path d="M27 21 l10 12 M37 21 l-10 12" stroke="#a63c2c" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'DOC-02') {
    return (
      <svg viewBox="0 0 64 48" className="audit-svg-icon" aria-hidden="true">
        <g transform="rotate(-8 32 24)">
          <rect x="10" y="13" width="44" height="24" rx="2" fill="#d9c698" stroke="#3b3022" strokeWidth="2" />
          <rect x="14" y="17" width="36" height="16" fill="#ece0be" stroke="#7a684a" strokeWidth="1.2" />
          <circle cx="32" cy="25" r="7" fill="#d4b97c" stroke="#3b3022" strokeWidth="1.6" />
          <text x="32" y="29" fontSize="11" fontWeight="900" fill="#3b3022" textAnchor="middle" fontFamily="monospace">
            ?
          </text>
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 48" className="audit-svg-icon" aria-hidden="true">
      <rect x="16" y="7" width="32" height="36" rx="3" fill="#4f463d" stroke="#211a14" strokeWidth="2.2" />
      <rect x="20" y="11" width="24" height="28" rx="1" fill="#685c4f" />
      <rect x="25" y="22" width="14" height="11" rx="2" fill="#d8a23d" stroke="#211a14" strokeWidth="1.6" />
      <path d="M28 22 v-4 a4 4 0 0 1 8 0 v4" fill="none" stroke="#d8a23d" strokeWidth="2.4" />
    </svg>
  );
}

const EVIDENCE_CARDS = [
  {
    id: 'DOC-01',
    code: 'FAILURE REPORT',
    sub: '[DOC-01]',
    desc: 'Telemetry proving components exceeded radiation, power, or orbital limits.',
    matches: ['radiation', 'power', 'lifetime', 'pointing', 'data', 'science'],
  },
  {
    id: 'DOC-02',
    code: 'INFLATED INVOICE',
    sub: '[DOC-02]',
    desc: 'Budget-cap voucher that forced the workshop onto [CHEAP/UNVERIFIED] hardware.',
    matches: ['radiation', 'power', 'cost', 'data'],
  },
  {
    id: 'DOC-03',
    code: 'DIRECTOR LEDGER',
    sub: '[DOC-03]',
    desc: 'Schedule directive compressing procurement lead time and pre-launch testing.',
    matches: ['schedule', 'lifetime', 'pointing', 'power'],
  },
];

export default function BossConfrontation({
  outcome,
  effectiveBudget,
  effectiveDeadline,
  budgetBonus = 0,
  audioOn,
  onUnlock,
  onReturnBuild,
}) {
  const [selectedDoc, setSelectedDoc] = useState('DOC-02');
  const [reply, setReply] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const killer = outcome?.dossier?.id || outcome?.killer || '';
  const missedInspect = Boolean(outcome?.missedInspection);
  const canConfront = !outcome?.success;

  const submitConfrontation = () => {
    const card = EVIDENCE_CARDS.find((c) => c.id === selectedDoc);
    if (outcome?.success) {
      playSoundAsset(audioOn, '06-11-2026-chime.wav', 0.3);
      setReply({
        ok: true,
        speaker: 'FINANCE DIRECTOR',
        text: 'Acceptance telemetry passed all requirements! No further inquiry needed.',
      });
      return;
    }
    if (missedInspect) {
      playSoundAsset(audioOn, '08-11-2026-alarm.wav', 0.3);
      setReply({
        ok: false,
        speaker: 'FINANCE DIRECTOR',
        text: 'DENIED: Pre-flight logs show unfixed assembly defects from Phase 2 (Inspection)!',
      });
      return;
    }
    if (!card || !card.matches.includes(killer)) {
      playSoundAsset(audioOn, '08-11-2026-data_glitch.wav', 0.3);
      setReply({
        ok: false,
        speaker: 'FINANCE DIRECTOR',
        text: `Evidence ${card?.code || selectedDoc} does not match root cause (${killer.toUpperCase() || 'UNKNOWN'}). Pick matching evidence!`,
      });
      return;
    }
    if (!unlocked) {
      setUnlocked(true);
      onUnlock?.();
    }
    setReply({
      ok: true,
      speaker: 'FINANCE DIRECTOR',
      text: `${card.code} proof is indisputable... Fine! Approving +$80M emergency budget, +18 months schedule, and +1 authorization credit!`,
    });
  };

  const bossLine = reply
    ? reply.text
    : canConfront
      ? 'WAIT... HOLD ON! LET ME CHECK THOSE NUMBERS AGAIN...'
      : 'Good job this time — signing off on the invoice now!';

  const engLine = canConfront
    ? 'WITH THIS TELEMETRY FAILURE, HOW DO YOU EXPLAIN THE BUDGET CUTS?'
    : '100% MISSION TELEMETRY VERIFIED — READY FOR SIGN-OFF!';

  const unlockedPct = unlocked || budgetBonus > 0 ? 100 : canConfront ? 28 : 100;

  return (
    <div className="boss-confront-stage">
      <div className="boss-confront-banner">
        <div className="boss-banner-sub">BOSS CONFRONTATION</div>
        <div className="boss-banner-main">EXECUTIVE AUDIT</div>
      </div>

      <div className="boss-faceoff">
        <div className="faceoff-side eng">
          <div className="faceoff-avatar">
            <EngineerPortrait mood={canConfront ? 'worried' : 'happy'} />
          </div>
          <div className="speech-bubble eng">{engLine}</div>
        </div>

        <div className="faceoff-side boss">
          <div className="speech-bubble boss">{bossLine}</div>
          <div className="faceoff-avatar">
            <BossPortrait mood={reply?.ok === true ? 'worried' : canConfront ? 'angry' : 'smug'} />
          </div>
        </div>
      </div>

      <div className="audit-drawer">
        <div className="audit-drawer-title">SELECT EVIDENCE</div>

        <div className="audit-cards">
          {EVIDENCE_CARDS.map((card) => (
            <button
              key={card.id}
              className={`parchment-card ${selectedDoc === card.id ? 'selected' : ''}`}
              onClick={() => setSelectedDoc(card.id)}
            >
              <div className="parchment-card-title">{card.code}</div>
              <EvidenceIcon type={card.id} />
              <div className="parchment-card-desc">{card.desc}</div>
            </button>
          ))}
        </div>

        <div className="audit-unlock-bar">
          <span className="small">UNLOCKED BUDGET</span>
          <div className="unlock-gauge-row">
            <div className="unlock-dial" aria-hidden="true">BUDGET</div>
            <div className="gauge-bar unlock-track">
              <div className="gauge-fill" style={{ width: `${unlockedPct}%` }} />
            </div>
            <strong className="unlock-amount">
              ${effectiveBudget || '-'}M | {effectiveDeadline || '-'} MO {unlocked || budgetBonus > 0 ? '[UNLOCKED]' : '[LOCKED]'}
            </strong>
          </div>
        </div>

        <div className="row-between" style={{ marginTop: 10 }}>
          <button className="btn" onClick={onReturnBuild}>
            STAND DOWN
          </button>
          <div className="row-wrap">
            {unlocked && (
              <button className="btn primary" onClick={onReturnBuild}>
                APPLY NEW BUDGET &amp; RETURN TO BAY
              </button>
            )}
            <button className="btn warn hazard" disabled={unlocked} onClick={submitConfrontation}>
              PRESENT PROOF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
