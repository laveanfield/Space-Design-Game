import React, { useEffect, useRef, useState } from 'react';

/**
 * EvidenceGallery -- anh dam chay rung ve tinh TU DONG chup (du lieu tu /campaign/lifetime).
 *
 * Anh goc lay tu bo anh minh hoa fe/public/imagery (sinh bang be/tools/14-11-2026-render_imagery.py,
 * KHONG phai anh ve tinh that). Sau do anh bi "lam xau" dung theo tinh trang that cua chuyen bay:
 *   - chua toi tram mat dat (duong truyen cham)   -> o trong, dang cho tai ve
 *   - chi huong kem (blur)                         -> nhoe chuyen dong + mo + nhieu hat
 *   - may tinh dang SEU                            -> dong anh bi lech, soc mau, diem chet
 *   - cam bien it du lieu (GB/ngay thap)           -> do phan giai thap, vo hat (muc do: minh hoa)
 * Dung luong moi anh ~ GB/ngay cua cam bien / so vong bay moi ngay (uoc tinh, xem gbPerShot).
 */

const BLUR_USABLE = 0.35;
const VARIANTS = 3;                       // so bien the anh moi vung trong bo imagery
const R_EARTH_KM = 6371.0;
const MU_KM3_S2 = 398600.4418;            // hang so hap dan Trai Dat

function rng(seed) {
  let s = (Math.abs(seed | 0) % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** So vong bay/ngay tu do cao (dinh luat Kepler 3, quy dao tron). */
function orbitsPerDay(altKm) {
  const a = R_EARTH_KM + (altKm || 500);
  return 86400 / (2 * Math.PI * Math.sqrt(a ** 3 / MU_KM3_S2));
}

/** Uoc tinh dung luong 1 anh: du lieu cam bien sinh ra trong 1 vong bay. */
export function gbPerShot(gbPerDay, altKm) {
  return gbPerDay ? gbPerDay / orbitsPerDay(altKm) : null;
}

/** Dung luong dang chu de doc: 2.68 GB / 21 MB / 400 KB. */
export function fmtSize(gb) {
  if (gb == null) return '';
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  if (gb >= 0.001) return `${(gb * 1024).toFixed(0)} MB`;
  return `${(gb * 1024 * 1024).toFixed(0)} KB`;
}

/** Do phan giai tuong doi theo luong du lieu cam bien (minh hoa: cam bien sinh nhieu GB -> anh nhieu diem anh). */
function resOf(gbPerDay, theme) {
  // khung du lieu cua tu ke / may do hat vi nhieu it GB/ngay theo ban chat, khong phai vi chat luong kem -> giu nguyen do phan giai
  if (theme === 'space_weather') return 1;
  if (!gbPerDay) return 0.5;
  return Math.max(0.22, Math.min(1, 0.3 + 0.35 * Math.log10(1 + gbPerDay * 3)));
}

const cache = new Map();
function loadImg(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    }));
  }
  return cache.get(src);
}

function srcOf(shot, thermal) {
  const v = Math.abs(shot.seed || 0) % VARIANTS;
  // nhiem vu khi nha kinh: anh pho chum khi methane (khong co ban hong ngoai nhiet)
  if (shot.theme === 'methane') return `/imagery/ch4_${shot.target_id}_${v}.jpg`;
  // nhiem vu bao Mat Troi: khung quan trac cua tu ke / may do hat (do thi, ban do vanh dai buc xa, cuc quang)
  if (shot.theme === 'space_weather') return `/imagery/sw_${shot.target_id}_${v}.jpg`;
  return `/imagery/fire_${shot.target_id}_${v}${thermal ? '_ir' : ''}.jpg`;
}

/** Ve anh len canvas roi lam xau theo tinh trang ve tinh. */
function paint(cv, im, shot, res) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d');
  const r = rng(shot.seed || 1);
  const blur = shot.blur || 0;
  // 1) cat mot khung ngau nhien (moi lan chup lech vi tri mot chut) va thu nho theo do phan giai
  const whole = shot.theme === 'space_weather';       // do thi / ban do co truc, nhan: giu nguyen ca khung, khong cat
  const cw = whole ? im.width : im.width * 0.72, ch = whole ? im.height : im.height * 0.72;
  // dam chay nam gan giua anh goc -> chi lech quanh tam de khong cat mat tuyen lua
  const sx = whole ? 0 : (im.width - cw) * (0.5 + (r() - 0.5) * 0.6), sy = whole ? 0 : (im.height - ch) * (0.5 + (r() - 0.5) * 0.6);
  const tw = Math.max(16, Math.round(W * res)), th = Math.max(10, Math.round(H * res));
  const tmp = document.createElement('canvas');
  tmp.width = tw; tmp.height = th;
  const t = tmp.getContext('2d');
  t.filter = blur > 0 ? `blur(${(1 + blur * 5) * res * (W / 200)}px)` : 'none';
  t.drawImage(im, sx, sy, cw, ch, 0, 0, tw, th);
  // 2) nhoe chuyen dong: ve tinh rung khi chup -> nhieu ban sao lech theo mot huong
  if (blur > 0) {
    const a = r() * Math.PI;
    t.globalAlpha = 0.3;
    for (let i = 1; i <= 5; i++) {
      const d = i * blur * 3.5 * res * (W / 200);
      t.drawImage(im, sx, sy, cw, ch, Math.cos(a) * d, Math.sin(a) * d, tw, th);
    }
    t.globalAlpha = 1;
  }
  t.filter = 'none';
  // 3) phong to: do phan giai thap thi khong lam min -> vo hat ro rang
  g.imageSmoothingEnabled = res > 0.85;
  g.clearRect(0, 0, W, H);
  g.drawImage(tmp, 0, 0, W, H);
  if (shot.sensor === 'radar_sar') { g.globalCompositeOperation = 'saturation'; g.fillStyle = '#888'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  // 4) nhieu hat + soc SEU
  const img = g.getImageData(0, 0, W, H), d = img.data;
  const amp = 5 + blur * 45 + (shot.seu ? 22 : 0) + (1 - res) * 22;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amp;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
    if (blur > 0) { d[i] = d[i] * 0.85 + 30; d[i + 1] = d[i + 1] * 0.85 + 30; d[i + 2] = d[i + 2] * 0.85 + 32; }   // mo suong (giam tuong phan)
  }
  if (shot.seu) {
    const rowLen = W * 4;
    for (let k = 0; k < 9; k++) {
      const y0 = Math.floor(r() * H), hh = 1 + Math.floor(r() * (H / 40)), off = Math.floor((r() - 0.5) * W * 0.25) * 4;
      for (let y = y0; y < Math.min(H, y0 + hh); y++) {
        const row = y * rowLen, copy = d.slice(row, row + rowLen);
        for (let x = 0; x < rowLen; x += 4) {
          const p = (x + off + rowLen) % rowLen;
          d[row + x] = copy[p] + 70; d[row + x + 1] = copy[p + 1] * 0.6; d[row + x + 2] = copy[p + 2] + 50;
        }
      }
    }
    for (let k = 0; k < W * H * 0.004; k++) {
      const p = (Math.floor(r() * W) + Math.floor(r() * H) * W) * 4;
      const v = r() < 0.5 ? 0 : 255;
      d[p] = v; d[p + 1] = v; d[p + 2] = v;
    }
  }
  g.putImageData(img, 0, 0);
  // 5) khung ngam + toa do (giong anh tram mat dat)
  const k = W / 200;
  if (shot.theme === 'space_weather') return finishLabel(g, shot, W, H, k);
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = Math.max(1, k * 0.8);
  const cx = W / 2, cy = H / 2, q = 14 * k;
  g.beginPath();
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { g.moveTo(cx + a * q, cy + b * q * 0.6); g.lineTo(cx + a * q, cy + b * q); g.lineTo(cx + a * q * 0.6, cy + b * q); });
  g.stroke();
  const fk = Math.min(k, 1.5);
  g.font = `${Math.round(9 * fk)}px monospace`; g.fillStyle = 'rgba(255,255,255,0.9)';
  const hasGeo = Number.isFinite(shot.lat) && Number.isFinite(shot.lon);
  if (hasGeo) g.fillText(`${shot.lat.toFixed(2)}°, ${shot.lon.toFixed(2)}°`, 5 * fk, H - 6 * fk);
  else g.fillText(shot.target_id, 5 * fk, 14 * fk);   // khung bao Mat Troi khong co toa do dia ly: ghi ma khung
}

function finishLabel(g, shot, W, H, k) {
  const fk = Math.min(k, 1.5);
  g.font = `${Math.round(9 * fk)}px monospace`; g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillText(shot.target_id, 5 * fk, 14 * fk);
}

function ShotCanvas({ shot, thermal, res, w, h }) {
  const ref = useRef(null);
  useEffect(() => {
    let alive = true;
    loadImg(srcOf(shot, thermal)).then((im) => alive && ref.current && paint(ref.current, im, shot, res)).catch(() => {});
    return () => { alive = false; };
  }, [shot, thermal, res, w]);
  return <canvas ref={ref} width={w} height={h} />;
}

function Photo({ shot, shown, thermal, res, gb, onOpen }) {
  const blurred = shot.blur >= BLUR_USABLE;
  const state = !shown ? 'pending' : blurred ? 'bad' : 'ok';
  return (
    <button className={`evidence-card ${state}`} disabled={!shown} onClick={onOpen}
            title={`${shot.target} · tháng ${shot.month}${shot.seu ? ' · SEU' : ''}`}>
      {shown ? <ShotCanvas shot={shot} thermal={thermal} res={res} w={200} h={132} />
             : <div className="evidence-pending"><span className="ev-spin" />⇣</div>}
      <div className="evidence-cap">
        <span className={`ev-dot ${state}`}>{state === 'ok' ? '✔' : state === 'bad' ? '✕' : '…'}</span>
        <span>#{shot.n}</span>
        {gb != null && <span className="ev-gb">💾 {fmtSize(gb)}</span>}
      </div>
    </button>
  );
}

/** step: moc dang hien (1..12). Chi hien anh da chup toi moc nay; anh hien khi delivered_k <= step. */
export default function EvidenceGallery({ evidence, need, step, sensorName, imaging, altKm }) {
  const [open, setOpen] = useState(null);
  const thermal = /thermal|hồng ngoại|infrared/i.test(sensorName || imaging?.name || '');
  const res = resOf(imaging?.gb_per_day, imaging?.theme);
  const gb = gbPerShot(imaging?.gb_per_day, altKm);
  const taken = evidence.filter((s) => s.k <= step);
  const isShown = (s) => s.delivered_k != null && s.delivered_k <= step;
  const usable = taken.filter((s) => isShown(s) && s.blur < BLUR_USABLE).length;
  const sensor = imaging?.sensor;
  return (
    <div className="evidence">
      <div className="evidence-head">
        <span>{imaging?.theme === 'space_weather' ? '📡' : '📷'} {sensorName || imaging?.name}</span>
        <span className="ev-meter" title="ảnh rõ đã về / ảnh cần">
          {Array.from({ length: need }, (_, i) => <i key={i} className={i < usable ? 'on' : ''} />)}
          <b className={usable >= need ? 'ok-text' : ''}>{usable}/{need}</b>
        </span>
      </div>
      {usable >= need && <div className="ok-banner" style={{ margin: '0 0 8px 0' }}>✔ ĐỦ BẰNG CHỨNG</div>}
      <div className="evidence-grid">
        {taken.length === 0 && <div className="small muted">{{ methane: 'CH₄', space_weather: '☀' }[evidence[0]?.theme] || '🔥'} —</div>}
        {taken.map((s) => (
          <Photo key={s.n} shot={{ ...s, sensor }} shown={isShown(s)} thermal={thermal} res={res} gb={gb} onOpen={() => setOpen(s)} />
        ))}
      </div>
      <div className="small muted" style={{ marginTop: 4 }}>ảnh minh họa · dung lượng ≈ GB/ngày ÷ số vòng/ngày</div>
      {open && (
        <div className="evidence-lightbox" onClick={() => setOpen(null)}>
          <div className="evidence-big" onClick={(e) => e.stopPropagation()}>
            <ShotCanvas shot={{ ...open, sensor }} thermal={thermal} res={res} w={640} h={422} />
            <div className="evidence-big-cap">
              <b>#{open.n} {open.target}</b>
              <span>tháng {open.month}</span>
              {gb != null && <span>💾 {fmtSize(gb)}</span>}
              <span className={open.blur >= BLUR_USABLE ? 'err-text' : 'ok-text'}>{open.blur >= BLUR_USABLE ? '✕ nhòe' : '✔ rõ'}</span>
              {open.seu && <span className="err-text">☢ SEU</span>}
              <button className="btn" onClick={() => setOpen(null)}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
