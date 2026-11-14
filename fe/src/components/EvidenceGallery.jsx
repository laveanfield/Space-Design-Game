import React, { useEffect, useRef } from 'react';

/**
 * EvidenceGallery -- anh dam chay rung ve tinh TU DONG chup (du lieu tu /campaign/lifetime).
 *
 * Moi anh duoc "ve" bang canvas theo dung tinh trang that cua chuyen bay:
 *   - chua toi tram mat dat (duong truyen cham)   -> o trong "DANG CHO TAI VE"
 *   - chi huong kem (blur)                         -> anh nhoe, khong dung lam bang chung
 *   - may tinh dang SEU                            -> soc nhieu
 *   - loai cam bien: anh mau (RGB), hong ngoai nhiet, radar
 * Anh la minh hoa sinh bang thuat toan (khong phai anh ve tinh that).
 */

const BLUR_USABLE = 0.35;

function rng(seed) {
  let s = (seed % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Ve mot anh ve tinh minh hoa cua dam chay. */
function paintFire(cv, shot) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d');
  const r = rng(shot.seed || 1);
  const thermal = /thermal|hồng ngoại|infrared/i.test(shot.sensorName || '');
  const radar = shot.sensor === 'radar_sar';
  // nen dia hinh: rung (xanh), dat (nau), song
  g.fillStyle = radar ? '#2a2a2a' : thermal ? '#141a3a' : '#3d5a32';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) {
    const x = r() * W, y = r() * H, rad = 6 + r() * 26;
    g.fillStyle = radar ? `rgba(${120 + r() * 80},${120 + r() * 80},${120 + r() * 80},0.25)` : thermal ? `rgba(40,60,${120 + r() * 60},0.35)` : `rgba(${40 + r() * 50},${70 + r() * 50},${30 + r() * 30},0.55)`;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  // song uon luon
  g.strokeStyle = radar ? '#111' : thermal ? '#0a0f26' : '#2c5b7a'; g.lineWidth = 5;
  g.beginPath();
  let y = r() * H;
  g.moveTo(0, y);
  for (let x = 0; x <= W; x += 16) { y += (r() - 0.5) * 18; g.lineTo(x, y); }
  g.stroke();
  // vet chay (vung da chay) + tuyen lua + khoi
  const cx = W * (0.35 + r() * 0.3), cy = H * (0.35 + r() * 0.3), len = W * (0.25 + r() * 0.2), ang = r() * Math.PI;
  g.save(); g.translate(cx, cy); g.rotate(ang);
  g.fillStyle = radar ? 'rgba(20,20,20,0.85)' : thermal ? 'rgba(10,10,20,0.6)' : 'rgba(45,32,24,0.85)';
  g.beginPath(); g.ellipse(-len * 0.2, 0, len * 0.55, len * 0.28, 0, 0, Math.PI * 2); g.fill();
  if (!radar) {
    for (let i = 0; i < 26; i++) {
      const t = i / 25, fx = len * 0.32 + Math.sin(t * 9) * 6, fy = (t - 0.5) * len * 0.6;
      const grad = g.createRadialGradient(fx, fy, 0, fx, fy, 10);
      grad.addColorStop(0, thermal ? 'rgba(255,255,255,1)' : 'rgba(255,240,170,1)');
      grad.addColorStop(0.4, thermal ? 'rgba(255,220,60,0.9)' : 'rgba(255,120,30,0.9)');
      grad.addColorStop(1, 'rgba(255,60,0,0)');
      g.fillStyle = grad; g.beginPath(); g.arc(fx, fy, 10, 0, Math.PI * 2); g.fill();
    }
  }
  g.restore();
  if (!thermal && !radar) {
    // khoi bay theo gio
    const wind = r() * Math.PI * 2;
    for (let i = 0; i < 40; i++) {
      const d = i * 6, sx = cx + Math.cos(wind) * d + (r() - 0.5) * 20, sy = cy + Math.sin(wind) * d + (r() - 0.5) * 20;
      g.fillStyle = `rgba(210,205,195,${0.28 - i * 0.006})`;
      g.beginPath(); g.arc(sx, sy, 10 + i * 0.9, 0, Math.PI * 2); g.fill();
    }
  }
  // nhieu SEU: soc ngang
  if (shot.seu) {
    for (let i = 0; i < 6; i++) { const yy = r() * H; g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, yy, W, 1 + r() * 2); }
  }
  // khung ngam (reticle) + toa do
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1;
  g.strokeRect(cx - 18, cy - 18, 36, 36);
  g.font = '10px monospace'; g.fillStyle = 'rgba(255,255,255,0.85)';
  g.fillText(`${shot.lat.toFixed(1)}°, ${shot.lon.toFixed(1)}°`, 6, H - 8);
}

function Photo({ shot, shown }) {
  const ref = useRef(null);
  const blurred = shot.blur >= BLUR_USABLE;
  useEffect(() => { if (ref.current && shown) paintFire(ref.current, shot); }, [shot, shown]);
  return (
    <div className={`evidence-card ${shown ? '' : 'pending'} ${blurred && shown ? 'blurred' : ''}`}>
      {shown ? (
        <canvas ref={ref} width={200} height={140} style={{ filter: blurred ? `blur(${2 + shot.blur * 6}px)` : 'none' }} />
      ) : (
        <div className="evidence-pending">ĐANG CHỜ TẢI VỀ<br /><span className="small muted">ảnh còn trong bộ nhớ vệ tinh</span></div>
      )}
      <div className="evidence-cap small">
        <strong>#{shot.n}</strong> {shot.target}
        <div className="muted">tháng {shot.month} • {shown ? (blurred ? 'NHÒE — không dùng được' : 'RÕ — bằng chứng hợp lệ') : 'chưa về'}</div>
      </div>
    </div>
  );
}

/** step: moc dang hien (1..12). Chi hien anh da chup toi moc nay; anh "ve" khi delivered_k <= step. */
export default function EvidenceGallery({ evidence, need, step, sensorName }) {
  const taken = evidence.filter((s) => s.k <= step);
  const usable = taken.filter((s) => s.delivered_k != null && s.delivered_k <= step && s.blur < BLUR_USABLE).length;
  return (
    <div className="evidence">
      <div className="row-between small" style={{ marginBottom: 6 }}>
        <span className="muted">ẢNH BẰNG CHỨNG CHÁY RỪNG (tự động chụp)</span>
        <span className={usable >= need ? 'ok-text' : ''}><strong>{usable}</strong> ảnh rõ đã về • cần {need}</span>
      </div>
      {usable >= need && <div className="ok-banner" style={{ margin: '0 0 8px 0' }}>✔ ĐỦ BẰNG CHỨNG — NHIỆM VỤ ĐƯỢC CÔNG NHẬN</div>}
      <div className="evidence-grid">
        {taken.length === 0 && <div className="small muted">Chưa phát hiện đám cháy nào trên quỹ đạo bay qua.</div>}
        {taken.map((s) => (
          <Photo key={s.n} shot={{ ...s, sensorName }} shown={s.delivered_k != null && s.delivered_k <= step} />
        ))}
      </div>
    </div>
  );
}
