import React, { useEffect, useMemo, useState } from 'react';
import { playSoundAsset } from '../api/client';
import { BossPortrait, EngineerPortrait } from './Portraits';
import { CAST, fill } from './14-11-2026-script';
import { getHumanityImpact } from './humanityImpact';

/**
 * StoryScene -- Cua so Terminal Comm-Link dong bo phong cach CRT Mission Control.
 * Hien thi kenh lien lac giua ENG-01 (Ky su truong) va DIR-01 (Sep ke toan) kem nhat ky lenh.
 */
const TYPE_SPEED = 36; // ky tu / giay cho cam giac terminal nhanh gon

export default function StoryScene({ lines, ctx, header, audioOn, onClose }) {
  const script = useMemo(() => (lines || []).map((l) => ({ ...l, text: fill(l.text, ctx || {}) })), [lines, ctx]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(0);
  const line = script[i];

  useEffect(() => {
    setI(0);
  }, [lines]);

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
  }, [i, line, audioOn]);

  const next = () => {
    if (!line) return onClose?.();
    if (typed < line.text.length) return setTyped(line.text.length);
    if (i + 1 >= script.length) return onClose?.();
    return setI(i + 1);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
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
  const history = script.slice(0, i);
  const impact = ctx?.showImpact
    ? getHumanityImpact(ctx?.mission, {
        success: Boolean(ctx?.success),
        failureId: ctx?.failureId || '',
      })
    : null;

  return (
    <div className="term-comm-overlay" role="dialog" aria-modal="true" onClick={next}>
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
          <div className={`term-node ${speaking === 'eng' ? 'speaking eng' : ''}`}>
            <EngineerPortrait mood={mood.eng || (speaking === 'eng' ? 'calm' : 'worried')} />
            <div className="term-node-label">
              [ENG-01] {CAST.eng.name}
            </div>
          </div>
          <div className={`term-node ${speaking === 'boss' ? 'speaking boss' : ''}`}>
            <BossPortrait mood={mood.boss || 'smug'} />
            <div className="term-node-label">
              [DIR-01] {CAST.boss.name}
            </div>
          </div>
        </div>

        <div className="term-comm-log" onClick={next}>
          {history.map((h, idx) => (
            <div key={idx} className={`term-log-line muted ${h.who}`}>
              <span className="term-tag">[{h.who === 'boss' ? 'DIR-01' : 'ENG-01'}]</span> {h.text}
            </div>
          ))}
          <div className={`term-log-active ${speaking}`}>
            <span className="term-tag">[{speaking === 'boss' ? 'DIR-01' : 'ENG-01'}]:&gt;</span>{' '}
            {line.text.slice(0, typed)}
            <span className="story-caret">▍</span>
          </div>
        </div>

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
            MSG {i + 1}/{script.length} • [ENTER/CLICK] TIẾP TỤC • [ESC] BỎ QUA
          </span>
          <div className="row-wrap">
            <button className="btn small" onClick={onClose}>
              BYPASS [ESC]
            </button>
            <button className="btn small primary" onClick={next}>
              {i + 1 >= script.length && typed >= line.text.length ? 'ACKNOWLEDGE [DONE]' : 'ACK / NEXT >>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
