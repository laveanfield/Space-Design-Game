import React, { useEffect, useMemo, useRef, useState } from 'react';
import { playSoundAsset } from '../api/client';
import AccidentNewspaper from '../components/AccidentNewspaper';
import { tr, tx } from '../core/i18n';
import { BossPortrait, EngineerPortrait } from './Portraits';
import { CAST, fill } from './14-11-2026-script';

const TYPE_SPEED = 42;

export function getCast(lang = 'en') {
  return {
    eng: {
      name: tx(CAST.eng.name, lang),
      side: CAST.eng.side,
    },
    boss: {
      name: tx(CAST.boss.name, lang),
      side: CAST.boss.side,
    },
  };
}

function resolveField(val, lang) {
  if (val == null) return '';
  if (typeof val === 'object') {
    return lang === 'en' ? val.en || val.vi || '' : val.vi || val.en || '';
  }
  return String(val);
}

function hydrateLines(lines, ctx) {
  const c = ctx || {};
  const lang = c.lang || 'vi';
  return (lines || []).map((l) => ({
    ...l,
    text: fill(resolveField(l.text, lang), c),
    stamp: l.stamp ? fill(resolveField(l.stamp, lang), c) : undefined,
    choicePicked: false,
    choices: Array.isArray(l.choices)
      ? l.choices.map((ch) => ({
          ...ch,
          tag: fill(resolveField(ch.tag, lang), c),
          text: fill(resolveField(ch.text, lang), c),
          stamp: ch.stamp
            ? fill(resolveField(ch.stamp, lang), c)
            : lang === 'en'
            ? 'REQUEST DENIED // OVERRIDDEN'
            : 'TỪ CHỐI PHÊ DUYỆT',
          bossReply: fill(resolveField(ch.bossReply, lang), c),
          engNote: ch.engNote ? fill(resolveField(ch.engNote, lang), c) : '',
        }))
      : undefined,
  }));
}

export default function StoryScene({ lines, ctx, header, audioOn, onClose }) {
  const lang = ctx?.lang || 'vi';
  const cast = getCast(lang);
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
  const showNews = Boolean(ctx?.showImpact);
  const accident = ctx?.accident || null;

  return (
    <div className="term-comm-overlay" role="dialog" aria-modal="true" onClick={waitingChoice ? undefined : next}>
      <div className={`term-comm-window ${showNews ? 'has-news' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="term-comm-header">
          <span className="term-comm-title">
            <span className="brand-dot" />
            {tr(lang, 'KÊNH TRUYỀN BẢO MẬT', 'SECURE COMM-LINK')} // {header?.level || (lang === 'en' ? 'LEVEL 1' : 'MÀN 1')}: {tx(header?.title, lang) || (lang === 'en' ? 'MISSION' : 'NHIỆM VỤ')}
          </span>
          <span className="small">
            {tr(lang, 'TRẦN', 'CAP')}: <strong className="ok-text">${header?.budget ?? '-'}M</strong> | {tr(lang, 'HẠN CHÓT', 'DEADLINE')}:{' '}
            <strong className="err-text">{header?.deadline ?? '-'} {tr(lang, 'THÁNG', 'MO')}</strong>
          </span>
        </div>

        <div className="term-comm-nodes">
          <div className={`term-node ${speaking === 'eng' || waitingChoice ? 'speaking eng' : ''}`}>
            <span className="term-role-pill player">{tr(lang, 'KỸ SƯ TRƯỞNG', 'YOUR ROLE // PLAYER')}</span>
            <EngineerPortrait mood={mood.eng || (speaking === 'eng' || waitingChoice ? 'calm' : 'worried')} />
            <div className="term-node-label">{tr(lang, 'BẠN — KỸ SƯ TRƯỞNG', '[YOU // ENG-01] LEAD ENGINEER')}</div>
          </div>
          <div className={`term-node ${speaking === 'boss' && !waitingChoice ? 'speaking boss' : ''}`}>
            <span className="term-role-pill npc">{tr(lang, 'BAN GIÁM ĐỐC', 'MANAGEMENT // NPC')}</span>
            <BossPortrait mood={line.stamp ? 'angry' : mood.boss || 'smug'} />
            <div className="term-node-label">{cast.boss.name}</div>
          </div>
        </div>

        <div ref={logRef} className="term-comm-log" onClick={waitingChoice ? undefined : next}>
          {history.map((h, idx) => (
            <div key={idx} className={`term-log-line muted ${h.who}`}>
              <span className="term-tag">
                [{h.who === 'boss' ? cast.boss.name : cast.eng.name}]
              </span>{' '}
              {h.choiceTag && <span className="term-choice-echo">[{h.choiceTag}]</span>}{' '}
              {h.stamp && <span className="term-reject-stamp">⚠ {h.stamp}</span>} {h.text}
            </div>
          ))}
          <div className={`term-log-active ${speaking} ${line.isThought ? 'thought' : ''}`}>
            <span className="term-tag">
              [{speaking === 'boss' ? cast.boss.name : cast.eng.name}]:&gt;
            </span>{' '}
            {line.stamp && <span className="term-reject-stamp">⚠ {line.stamp}</span>} {line.text.slice(0, typed)}
            <span className="story-caret">▍</span>
          </div>
        </div>

        {waitingChoice && (
          <div className="term-choices-box">
            <div className="term-choices-title">
              {tr(
                lang,
                `CHỌN LỜI PHẢN HỒI — Phím 1-${line.choices.length} hoặc nhấp chuột:`,
                `SELECT YOUR RESPONSE [YOU // ENG-01] (Press 1-${line.choices.length} or click):`
              )}
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
                  <span className="term-choice-text">&ldquo;{ch.text}&rdquo;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showNews && accident && (
          <div className="story-news single">
            <div className="story-news-item">
              <AccidentNewspaper info={accident} variant="compact" />
            </div>
          </div>
        )}

        <div className="term-comm-footer">
          <span className="small muted">
            {waitingChoice
              ? tr(
                  lang,
                  `Chọn phản hồi 1-${line.choices.length} để nói với sếp • Phím ESC để bỏ qua`,
                  `CHOOSE RESPONSE [1-${line.choices.length}] TO REPLY TO DIRECTOR | [ESC] SKIP`
                )
              : tr(
                  lang,
                  `Tin ${i + 1}/${activeScript.length} • Enter hoặc nhấp chuột để tiếp tục • Phím ESC để bỏ qua`,
                  `MSG ${i + 1}/${activeScript.length} | [ENTER/CLICK] CONTINUE | [ESC] SKIP`
                )}
          </span>
          <div className="row-wrap">
            <button className="btn small" onClick={onClose}>
              {tr(lang, 'BỎ QUA', 'SKIP')}
            </button>
            <button className={`btn small ${waitingChoice ? '' : 'primary'}`} onClick={next}>
              {waitingChoice
                ? tr(lang, 'CHỌN PHẢN HỒI Ở TRÊN', 'SELECT RESPONSE ABOVE')
                : i + 1 >= activeScript.length && typed >= line.text.length
                ? tr(lang, 'XÁC NHẬN HOÀN TẤT', 'ACKNOWLEDGE [DONE]')
                : tr(lang, 'TIẾP TỤC →', 'ACK / NEXT >>')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
