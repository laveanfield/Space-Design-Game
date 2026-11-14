import React, { useEffect, useMemo, useRef, useState } from 'react';
import { playSoundAsset } from '../api/client';
import { BossPortrait, EngineerPortrait } from './Portraits';
import { CAST, fill } from './14-11-2026-script';
import { getHumanityImpact } from './humanityImpact';

/**
 * StoryScene -- Cua so Terminal Comm-Link tuong tac:
 * Nguoi choi [BAN // ENG-01] truc tiep chon loi phan bien / de xuat voi Sep [DIR-01],
 * va chung kien Sep dong dau [TU CHOI PHE DUYET] bac bo de xuat ngay truoc gio phong / sau man choi.
 */
const TYPE_SPEED = 42; // ky tu / giay cho cam giac terminal nhanh nhay

function hydrateLines(lines, ctx) {
  const c = ctx || {};
  return (lines || []).map((l) => ({
    ...l,
    text: fill(l.text, c),
    stamp: l.stamp ? fill(l.stamp, c) : undefined,
    choicePicked: false,
    choices: Array.isArray(l.choices)
      ? l.choices.map((ch) => ({
          ...ch,
          tag: fill(ch.tag, c),
          text: fill(ch.text, c),
          stamp: ch.stamp ? fill(ch.stamp, c) : 'TỪ CHỐI PHÊ DUYỆT // REQUEST DENIED',
          bossReply: fill(ch.bossReply, c),
          engNote: ch.engNote ? fill(ch.engNote, c) : '',
        }))
      : undefined,
  }));
}

export default function StoryScene({ lines, ctx, header, audioOn, onClose }) {
  const hydrated = useMemo(() => hydrateLines(lines, ctx), [lines, ctx]);
  const [activeScript, setActiveScript] = useState(hydrated);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(0);
  const logRef = useRef(null);

  useEffect(() => {
    setActiveScript(hydrated);
    setI(0);
    setTyped(0);
  }, [hydrated]);

  const line = activeScript[i];

  useEffect(() => {
    if (!line) return undefined;
    setTyped(0);
    playSoundAsset(audioOn, line.who === 'boss' ? '06-11-2026-click.wav' : '08-11-2026-relay_click.wav', 0.16);
    const id = setInterval(() => {
      setTyped((n) => {
        if (n >= line.text.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 1000 / TYPE_SPEED);
    return () => clearInterval(id);
  }, [i, line?.text, line?.who, audioOn]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [i, typed, activeScript.length]);

  const waitingChoice = Boolean(line?.choices?.length && !line?.choicePicked && typed >= line.text.length);

  const pickChoice = (choice) => {
    if (!line || !choice) return;
    playSoundAsset(audioOn, '08-11-2026-relay_click.wav', 0.24);
    const inserted = [
      { who: 'eng', text: choice.text, isPlayerChoice: true, choiceTag: choice.tag },
      { who: 'boss', text: choice.bossReply, stamp: choice.stamp },
    ];
    if (choice.engNote) {
      inserted.push({ who: 'eng', text: choice.engNote, isThought: true });
    }
    setActiveScript((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], choicePicked: true };
      copy.splice(i + 1, 0, ...inserted);
      return copy;
    });
    // Nhay thang sang cau bac bo cua Sep (i + 2) de cau ban vua chon hien ngay trong nhat ky phia tren
    setI((prevIdx) => prevIdx + 2);
  };

  const next = () => {
    if (!line) return onClose?.();
    if (typed < line.text.length) return setTyped(line.text.length);
    if (waitingChoice) return pickChoice(line.choices[0]);
    if (i + 1 >= activeScript.length) return onClose?.();
    return setI(i + 1);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (waitingChoice && ['1', '2', '3'].includes(e.key)) {
        const picked = line.choices[Number(e.key) - 1];
        if (picked) {
          e.preventDefault();
          pickChoice(picked);
          return;
        }
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (waitingChoice && e.key === ' ') {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        next();
      }
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!line) return null;
  const speaking = line.who;
  const mood = ctx?.mood || {};
  const history = activeScript.slice(0, i);
  const impact = ctx?.showImpact
    ? getHumanityImpact(ctx?.mission, {
        success: Boolean(ctx?.success),
        failureId: ctx?.failureId || '',
      })
    : null;

  return (
    <div className="term-comm-overlay" role="dialog" aria-modal="true" onClick={waitingChoice ? undefined : next}>
      <div className="term-comm-window" onClick={(e) => e.stopPropagation()}>
        <div className="term-comm-header">
          <span className="term-comm-title">
            <span className="brand-dot" />
            SECURE COMM-LINK // [{header?.level || 'LEVEL 1'}: {header?.title || 'MISSION'}]
          </span>
          <span className="small">
            CAP: <strong className="ok-text">${header?.budget ?? '-'}M</strong> | DEADLINE:{' '}
            <strong className="err-text">{header?.deadline ?? '-'} MO</strong>
          </span>
        </div>

        <div className="term-comm-nodes">
          <div className={`term-node ${speaking === 'eng' || waitingChoice ? 'speaking eng' : ''}`}>
            <span className="term-role-pill player">VAI CỦA BẠN // PLAYER</span>
            <EngineerPortrait mood={mood.eng || (speaking === 'eng' || waitingChoice ? 'calm' : 'worried')} />
            <div className="term-node-label">
              [BẠN // ENG-01] KỸ SƯ TRƯỞNG
            </div>
          </div>
          <div className={`term-node ${speaking === 'boss' && !waitingChoice ? 'speaking boss' : ''}`}>
            <span className="term-role-pill npc">BAN GIÁM ĐỐC // NPC</span>
            <BossPortrait mood={line.stamp ? 'angry' : mood.boss || 'smug'} />
            <div className="term-node-label">
              [DIR-01] {CAST.boss.name}
            </div>
          </div>
        </div>

        <div ref={logRef} className="term-comm-log" onClick={waitingChoice ? undefined : next}>
          {history.map((h, idx) => (
            <div key={idx} className={`term-log-line muted ${h.who}`}>
              <span className="term-tag">[{h.who === 'boss' ? 'DIR-01' : 'BẠN // ENG-01'}]</span>{' '}
              {h.choiceTag && <span className="term-choice-echo">[{h.choiceTag}]</span>}{' '}
              {h.stamp && <span className="term-reject-stamp">⛔ {h.stamp}</span>} {h.text}
            </div>
          ))}
          <div className={`term-log-active ${speaking} ${line.isThought ? 'thought' : ''}`}>
            <span className="term-tag">[{speaking === 'boss' ? 'DIR-01' : 'BẠN // ENG-01'}]:&gt;</span>{' '}
            {line.stamp && <span className="term-reject-stamp">⛔ {line.stamp}</span>} {line.text.slice(0, typed)}
            <span className="story-caret">▍</span>
          </div>
        </div>

        {waitingChoice && (
          <div className="term-choices-box">
            <div className="term-choices-title">
              CHỌN LỜI PHẢN HỒI CỦA BẠN [BẠN // ENG-01] (Bấm phím 1-{line.choices.length} hoặc click):
            </div>
            <div className="term-choices-list">
              {line.choices.map((ch, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="term-choice-btn"
                  onClick={() => pickChoice(ch)}
                >
                  <span className="term-choice-head">
                    <span className="term-choice-key">[{idx + 1}]</span>
                    <span className="term-choice-tag">{ch.tag}</span>
                  </span>
                  <span className="term-choice-text">“{ch.text}”</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {impact && (
          <div className={`story-impact-dispatch ${impact.success ? 'ok' : 'fail'}`}>
            <div className="story-impact-head">
              <strong>THÔNG ĐIỆP HẬU QUẢ NHÂN LOẠI // {impact.levelTag}</strong>
              <span className={`badge ${impact.success ? 'ok' : 'err'}`}>{impact.badge}</span>
            </div>
            <div className="story-impact-title">{impact.headline}</div>
            <div className="story-impact-metrics">
              {impact.metrics.map((m) => (
                <div key={m.label} className="story-impact-metric">
                  <strong>{m.value}</strong>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
            <div className="story-impact-moral">{impact.moral}</div>
          </div>
        )}

        <div className="term-comm-footer">
          <span className="small muted">
            {waitingChoice
              ? `CHỌN PHẢN HỒI [1-${line.choices.length}] ĐỂ NÓI VỚI SẾP • [ESC] BỎ QUA`
              : `MSG ${i + 1}/${activeScript.length} • [ENTER/CLICK] TIẾP TỤC • [ESC] BỎ QUA`}
          </span>
          <div className="row-wrap">
            <button className="btn small" onClick={onClose}>
              BYPASS [ESC]
            </button>
            <button className={`btn small ${waitingChoice ? '' : 'primary'}`} onClick={next}>
              {waitingChoice
                ? '↑ CHỌN CÂU TRẢ LỜI Ở TRÊN'
                : i + 1 >= activeScript.length && typed >= line.text.length
                ? 'ACKNOWLEDGE [DONE]'
                : 'ACK / NEXT >>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
