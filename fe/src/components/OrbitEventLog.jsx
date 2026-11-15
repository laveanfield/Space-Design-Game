import React, { useEffect, useRef } from 'react';

/**
 * OrbitEventLog -- "may tinh cu" hien cac su kien tren quy dao (thay cho danh sach chu nho cu).
 *
 * Mot khung may (vo nhua be, den bao, nut vặn) bao quanh man hinh CRT toi: chu to mau lan quang xanh / hổ phách / do,
 * su kien moi chay vao o cuoi nhu terminal that, co con tro nhap nhay. KHONG ve soc ngang (scanline).
 * `lines` la danh sach THEO THU TU THOI GIAN [{ k, month, level: 'info'|'warn'|'crit', text, code }]: da dich san sang hien.
 */

const TAG = { info: 'INFO', warn: 'CANH BAO', crit: 'NGUY CAP' };
const pad2 = (n) => String(n).padStart(2, '0');
const fmtMonth = (m) => (Number.isInteger(Number(m)) ? pad2(m) : Number(m).toFixed(1)); // thang tren quy dao

export default function OrbitEventLog({ lines, status, dead, total }) {
  const scrollRef = useRef(null);
  const worst = lines.some((l) => l.level === 'crit') ? 'crit' : lines.some((l) => l.level === 'warn') ? 'warn' : 'info';
  const latest = lines.length ? lines[lines.length - 1].level : 'info';

  // su kien moi -> cuon xuong cuoi, nhu terminal
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <div className={`crt ${dead ? 'crt-dead' : ''}`} role="log" aria-live="polite">
      <div className="crt-case">
        <div className="crt-brand">
          <span className="crt-plate">ORBITAL EVENT TERMINAL</span>
          <span className="crt-model">OET-12</span>
          <span className="crt-leds" title="Indicators: PWR (power), WRN (warning), ERR (critical fault)">
            <i className="crt-led on green" />
            <i className={`crt-led amber ${worst !== 'info' ? 'on' : ''}`} />
            <i className={`crt-led red ${worst === 'crit' ? 'on blink' : ''}`} />
          </span>
        </div>

        <div className="crt-bezel">
          <div className={`crt-screen lv-${latest}`}>
            <div className="crt-status">
              <span>{status}</span>
              <span>EVENTS {pad2(lines.length)}</span>
            </div>
            <div className="crt-lines" ref={scrollRef}>
              {lines.length === 0 && (
                <div className="crt-line info">
                  <span className="crt-tx">AWAITING FIRST TELEMETRY PACKET...</span>
                </div>
              )}
              {lines.map((l, i) => (
                <div key={i} className={`crt-line ${l.level} ${i === lines.length - 1 ? 'fresh' : ''}`}>
                  <span className="crt-ts">M{fmtMonth(l.month)}</span>
                  <span className="crt-tag">[{TAG[l.level] || 'INFO'}]</span>
                  <span className="crt-tx">{l.text}</span>
                </div>
              ))}
              <div className="crt-prompt">
                &gt;<span className="crt-cursor" />
              </div>
            </div>
          </div>
        </div>

        <div className="crt-foot">
          <span className="crt-knob" />
          <span className="crt-knob small" />
          <span className="crt-grille" />
          <span className="crt-keys">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}
