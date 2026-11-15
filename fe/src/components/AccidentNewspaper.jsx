import React from 'react';
import { BossPortrait, EngineerPortrait } from '../story/Portraits';
import PadExplosionArt from './PadExplosionArt';

/**
 * AccidentNewspaper -- TO BAO TAI NAN khi tên lửa gặp sự cố (nổ ở bệ phóng lúc lift-off, tự hủy FTS, hụt vận tốc, hoãn phóng...).
 * Trình bày như trang nhất báo in cỡ lớn (đầu báo, tít khổng lồ, ảnh lớn có chú thích, cột chữ, khung số liệu, dòng thời gian,
 * chân dung): bố cục học theo trang nhất báo mẫu, nhưng ĐẦU BÁO "The Spaceport Courier" là HƯ CẤU (không dùng tên / logo tờ báo thật nào).
 *
 * Số liệu hiển thị (thời điểm sự cố, khối lượng, fairing, Δv, chi phí, các mốc bay) lấy từ KẾT QUẢ BAY THẬT của engine.
 * Lời kể, lời dẫn, tranh vẽ là minh họa cho câu chuyện trong trò chơi (có ghi chú ở chân báo).
 *
 *   variant="extended" : lấp đầy ô trống bên dưới khung 3D ở màn LAUNCH (3 cột: chữ | ảnh lớn | số liệu)
 *   variant="compact"  : bản gọn đặt cạnh tờ báo hậu quả trong cửa sổ hội thoại
 */

const tx = (o) => (o && typeof o === 'object' ? o.vi || o.en || '' : o || '');

const LABEL_VI = {
  'mass.dry_kg': 'Khối lượng khô vệ tinh',
  'mass.bus_limit_kg': 'Giới hạn chịu tải của khung',
  need_fairing_m: 'Bề rộng fairing cần',
  usable_fairing_m: 'Bề rộng fairing dùng được',
  dv_needed_ms: 'Δv cần để vào quỹ đạo',
  dv_ideal_ms: 'Δv tên lửa đạt được',
  dv_short_ms: 'Δv còn thiếu',
};

const EVENT_VI = {
  LIFTOFF: 'Rời bệ phóng (LIFTOFF)',
  MAXQ: 'Áp suất động lớn nhất (MAX-Q)',
  MECO: 'Tắt động cơ tầng 1 (MECO)',
  STAGE_SEP: 'Tách tầng',
  SECO2: 'Tắt động cơ tầng trên (SECO)',
  PAYLOAD_SEP: 'Tách vệ tinh',
};

function fmt(v, unit) {
  const n = Number(v);
  const s = Number.isFinite(n) ? (Math.abs(n) >= 100 ? Math.round(n).toLocaleString('vi-VN') : String(Math.round(n * 100) / 100).replace('.', ',')) : String(v);
  return unit ? `${s} ${unit}` : s;
}

function editionDate() {
  try {
    return new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Gom dữ liệu thật của một sự cố phóng thành một đối tượng đơn giản cho tờ báo.
 * failure: { kind, t, explode, title, cause, numbers } (từ backend /fly hoặc từ nút HỦY PHÓNG);
 * flight: kết quả /fly (meta.vehicle, meta.site, meta.payload_kg, events); catalog: bảng tên tên lửa / bãi phóng.
 */
export function buildAccidentInfo({ failure, flight, catalog, cost }) {
  if (!failure) return null;
  const vehId = flight?.meta?.vehicle;
  const siteId = flight?.meta?.site;
  const veh = catalog?.tables?.launch_vehicles?.[vehId]?.name || vehId || 'Tên lửa';
  const siteFull = catalog?.tables?.launch_sites?.[siteId]?.name || siteId || 'Bãi phóng';
  const siteShort = (siteFull.match(/\(([^)]+)\)/)?.[1] || siteFull).toUpperCase();
  const t = Number(failure.t);
  const hasT = Number.isFinite(t) && failure.kind !== 'scrub' && failure.kind !== 'fts';
  const kind = failure.kind || 'launch';
  // no sat bai phong (structural_maxq, inspection_catastrophe hoac no som trong 60 s dau) -> ve canh no NGAY TREN BE PHONG
  const nearPad = kind === 'structural_maxq' || kind === 'inspection_catastrophe' || (failure.explode && hasT && t <= 60);
  const scene = kind === 'scrub' ? 'pad-hold' : kind === 'wrong_plane' ? 'air-lost' : nearPad ? 'pad-boom' : failure.explode ? 'air-boom' : 'air-lost';

  // dòng thời gian thật: IGNITION -> các mốc đã qua -> sự cố
  const timeline = [];
  if (kind !== 'scrub') {
    timeline.push({ t: 'T-1 s', text: 'Đánh lửa động cơ (IGNITION)' });
    if (hasT) {
      const before = (flight?.events || []).filter((e) => e.name !== 'PAYLOAD_SEP' && Number(e.t) < t - 0.5);
      const same = (flight?.events || []).find((e) => Math.abs(Number(e.t) - t) <= 0.5 && e.name !== 'PAYLOAD_SEP');
      before.forEach((e) => timeline.push({ t: `T+${Math.round(e.t)} s`, text: EVENT_VI[e.name] || e.name }));
      timeline.push({
        t: `T+${Math.round(t)} s`,
        text: `${failure.explode ? 'NỔ TUNG' : 'SỰ CỐ'}${same ? ` tại ${EVENT_VI[same.name] || same.name}` : ''}`,
        fail: true,
      });
    } else {
      timeline.push({ t: 'ĐANG BAY', text: failure.explode ? 'LỆNH TỰ HỦY → NỔ' : 'SỰ CỐ', fail: true });
    }
  } else {
    timeline.push({ t: 'T-0', text: 'Kỹ sư trưởng dừng đếm ngược', fail: true });
  }

  // khung "những con số" thật
  const facts = [];
  if (hasT) facts.push({ v: `T+${Math.round(t)} s`, l: 'Thời điểm sự cố' });
  const byLabel = {};
  (failure.numbers || []).forEach((n) => { byLabel[n.label] = n; });
  (failure.numbers || []).forEach((n) => {
    if (n.label === 'dv_short_ms' && byLabel.dv_needed_ms) return; // gọn: đã có cần / đạt được
    if (n.value === 'UNFIXED') {
      facts.push({ v: 'CHƯA SỬA', l: `Lỗi bị bỏ sót: ${n.label}` }); // lỗi kiểm định chưa sửa trước giờ phóng
      return;
    }
    facts.push({ v: fmt(n.value, n.unit), l: LABEL_VI[n.label] || n.label });
  });
  const dry = byLabel['mass.dry_kg']?.value;
  const lim = byLabel['mass.bus_limit_kg']?.value;
  if (Number.isFinite(Number(dry)) && Number.isFinite(Number(lim)) && Number(lim) > 0) {
    facts.push({ v: `+${fmt(Number(dry) - Number(lim), 'kg')}`, l: `Vượt giới hạn khung (${fmt(((Number(dry) / Number(lim)) - 1) * 100, '%')})` });
  }
  const payloadKg = Number(flight?.meta?.payload_kg);
  if (Number.isFinite(payloadKg) && payloadKg > 0) facts.push({ v: fmt(payloadKg, 'kg'), l: 'Tải trọng vệ tinh' });
  const money = Number(cost);
  if (Number.isFinite(money) && money > 0) facts.push({ v: `${money.toFixed(1).replace('.', ',')} triệu USD`, l: 'Thiệt hại của dự án' });

  return {
    kind,
    scene,
    explode: Boolean(failure.explode),
    titleVi: tx(failure.title),
    causeVi: tx(failure.cause),
    vehicle: veh,
    siteFull,
    siteShort,
    t: hasT ? Math.round(t) : null,
    payloadKg: Number.isFinite(payloadKg) ? payloadKg : null,
    cost: Number.isFinite(money) && money > 0 ? money : null,
    timeline,
    facts,
  };
}

/** Soạn chữ cho tờ báo theo loại sự cố (lời kể hư cấu, KHÔNG thêm con số nào ngoài số liệu thật ở trên). */
function compose(info) {
  const V = info.vehicle;
  const VU = V.toUpperCase();
  const at = info.t != null ? `ở giây thứ ${info.t}` : 'giữa chuyến bay';
  const loss = info.cost != null
    ? `Chuyến bay được coi là mất trắng: tên lửa, vệ tinh và khoản đầu tư ${info.cost.toFixed(1).replace('.', ',')} triệu USD đều không thể thu hồi.`
    : 'Chuyến bay được coi là mất trắng: tên lửa và vệ tinh đều không thể thu hồi.';
  const fix = 'Kỹ sư trưởng đã nộp hồ sơ nguyên nhân và quay lại xưởng sửa thiết kế.';
  const cause = info.causeVi ? `Theo hồ sơ sự cố của dự án, kết luận sơ bộ là “${info.titleVi}”. ${info.causeVi}` : `Kết luận sơ bộ: ${info.titleVi}.`;

  if (info.kind === 'structural_maxq' || info.kind === 'inspection_catastrophe') {
    const maxq = info.kind === 'structural_maxq';
    return {
      kicker: 'TIN KHẨN TỪ BÃI PHÓNG',
      headline: `${VU} NỔ TUNG NGAY TRÊN BỆ PHÓNG`,
      deck: maxq
        ? `Vụ nổ xảy ra ${at}, đúng lúc tên lửa đi vào vùng áp suất động lớn nhất (Max-Q); tên lửa và vệ tinh mất trắng.`
        : `Vụ nổ xảy ra ${at} sau lệnh đánh lửa; đội kiểm định đã bỏ sót lỗi phần cứng trước giờ phóng.`,
      caption: `quả cầu lửa nuốt chửng ${V} ngay trên bệ phóng; thân tên lửa vỡ đôi, tầng trên và chóp bị hất tung.`,
      paragraphs: [
        `Một quả cầu lửa nuốt chửng tên lửa ${V} ngay tại bệ phóng ${at}${maxq ? ', khi tên lửa đi vào vùng Max-Q' : ', ngay sau lệnh đánh lửa'}. Cột khói đen cuộn lên, sóng xung kích quét qua bãi phóng.`,
        cause,
        `${loss} ${fix}`,
      ],
    };
  }
  if (info.kind === 'fts') {
    return {
      kicker: 'TIN KHẨN GIỮA CHUYẾN BAY',
      headline: `LỆNH TỰ HỦY: ${VU} BỊ PHÁ HỦY GIỮA CHỪNG`,
      deck: 'Kỹ sư trưởng kích hoạt hệ thống tự hủy an toàn (FTS) khi tên lửa đang bay, để mảnh vỡ rơi xa khu dân cư.',
      caption: `${V} bị phá hủy trên không theo lệnh tự hủy; vệt khói và mảnh vỡ rơi xa khỏi bãi phóng.`,
      paragraphs: [
        `Hệ thống tự hủy an toàn đã phá hủy tên lửa ${V} giữa chuyến bay theo lệnh của Kỹ sư trưởng. Một quả cầu lửa sáng rực xuất hiện trên bầu trời, theo sau là các vệt khói trắng của mảnh vỡ.`,
        info.causeVi || 'Lệnh hủy chuyến bay được đưa ra khi tên lửa đang bay.',
        `${loss} ${fix}`,
      ],
    };
  }
  if (info.kind === 'dv_shortfall') {
    return {
      kicker: 'TIN KHẨN GIỮA CHUYẾN BAY',
      headline: `HỤT VẬN TỐC: ${VU} RƠI LẠI KHÍ QUYỂN VÀ VỠ TAN`,
      deck: 'Tên lửa cháy hết nhiên liệu khi chưa đủ vận tốc quỹ đạo; tầng trên và vệ tinh vỡ tan khi vào lại khí quyển.',
      caption: `${V} vỡ tan trên cao khi rơi lại khí quyển; các mảnh vỡ để lại nhiều vệt khói dài.`,
      paragraphs: [
        `Tên lửa ${V} đã cháy hết nhiên liệu trước khi đạt vận tốc quỹ đạo. Tầng trên cùng vệ tinh rơi ngược vào khí quyển và vỡ tan thành nhiều mảnh phát sáng.`,
        cause,
        `${loss} ${fix}`,
      ],
    };
  }
  if (info.kind === 'scrub') {
    return {
      kicker: 'TIN TỪ BÃI PHÓNG',
      headline: `HOÃN PHÓNG PHÚT CHÓT: ${VU} AN TOÀN TRÊN BỆ`,
      deck: 'Kỹ sư trưởng dừng đếm ngược trước khi đánh lửa. Tên lửa nguyên vẹn, nhưng chi phí chuẩn bị chuyến bay coi như mất.',
      caption: `${V} đứng yên trên bệ sau lệnh hoãn; hơi lạnh của nhiên liệu xả ra hai bên bệ phóng.`,
      paragraphs: [
        `Đếm ngược đã bị dừng ngay trước khi động cơ ${V} đánh lửa. Không có vụ nổ nào xảy ra và không ai bị thương, nhưng cả đội phải thu dọn bệ phóng.`,
        info.causeVi || 'Chuyến bay được hoãn theo lệnh của Kỹ sư trưởng.',
        'Ban giám đốc dự án ghi nhận lần hoãn này vào sổ uy tín của đội thiết kế.',
      ],
    };
  }
  if (info.kind === 'wrong_plane') {
    return {
      kicker: 'TIN KHẨN TỪ TRUNG TÂM ĐIỀU HÀNH',
      headline: 'VỆ TINH LẠC MẶT PHẲNG QUỸ ĐẠO',
      deck: 'Tên lửa bay đúng kế hoạch nhưng không thể đưa vệ tinh vào mặt phẳng quỹ đạo mục tiêu từ bãi phóng này.',
      caption: `vệt khói của ${V} và vệ tinh trôi dần ra khỏi vùng nhiệm vụ.`,
      paragraphs: [
        `Tên lửa ${V} bay hết hành trình nhưng tầng trên cháy hết nhiên liệu ở sai mặt phẳng quỹ đạo, vệ tinh trôi ra khỏi vùng nhiệm vụ.`,
        cause,
        `${loss} ${fix}`,
      ],
    };
  }
  return {
    kicker: 'TIN KHẨN TỪ BÃI PHÓNG',
    headline: `SỰ CỐ PHÓNG: ${info.titleVi || VU}`,
    deck: `Chuyến bay của ${V} không thể hoàn thành.`,
    caption: `${V} gặp sự cố trong chuyến bay.`,
    paragraphs: [`Chuyến bay của ${V} gặp sự cố ${at}.`, cause, `${loss} ${fix}`],
  };
}

export default function AccidentNewspaper({ info, variant = 'extended', seed = 7 }) {
  if (!info) return null;
  const compact = variant === 'compact';
  const story = compose(info);
  const paragraphs = compact ? story.paragraphs.slice(0, 2) : story.paragraphs;
  const facts = compact ? info.facts.slice(0, 3) : info.facts.slice(0, 6);

  return (
    <article className={`acc-paper ${variant}`} data-scene={info.scene}>
      <header className="acc-masthead">
        <div className="acc-ears">
          <span>ẤN BẢN ĐẶC BIỆT</span>
          <span>{story.kicker}</span>
          {!compact && <span>{editionDate()}</span>}
        </div>
        <h2 className="acc-name">The Spaceport Courier</h2>
        <div className="acc-dateline">
          <span>{info.siteFull}</span>
          <span>ẤN BẢN MINH HỌA</span>
        </div>
      </header>

      <h1 className="acc-headline">{story.headline}</h1>
      <p className="acc-deck">{story.deck}</p>

      <div className="acc-body">
        <div className="acc-col acc-col-a acc-text">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? 'lead' : ''}>
              {i === 0 && <span className="acc-place">{info.siteShort} —</span>} {p}
            </p>
          ))}
        </div>

        <figure className="acc-photo">
          <div className="acc-photo-frame">
            <PadExplosionArt scene={info.scene} seed={seed} label={`Tranh minh họa: ${story.caption}`} />
          </div>
          <figcaption>
            <b>Tranh minh họa:</b> {story.caption}
          </figcaption>
        </figure>

        <div className="acc-col acc-col-c">
          <div className="acc-box facts">
            <div className="acc-box-title">NHỮNG CON SỐ</div>
            <div className={compact ? 'acc-facts-row' : 'acc-facts'}>
              {facts.map((f) => (
                <div key={f.l} className="acc-fact">
                  <div className="acc-fact-v">{f.v}</div>
                  <div className="acc-fact-l">{f.l}</div>
                </div>
              ))}
            </div>
          </div>
          {!compact && (
            <div className="acc-box time">
              <div className="acc-box-title">DÒNG THỜI GIAN</div>
              <ul className="acc-timeline">
                {info.timeline.map((e, i) => (
                  <li key={i} className={e.fail ? 'fail' : ''}>
                    <b>{e.t}</b>
                    <span>{e.text}</span>
                  </li>
                ))}
              </ul>
              <div className="acc-mugs">
                <figure className="acc-mug">
                  <EngineerPortrait mood="worried" />
                  <figcaption><b>Kỹ sư trưởng</b> nộp hồ sơ nguyên nhân.</figcaption>
                </figure>
                <figure className="acc-mug">
                  <BossPortrait mood="angry" />
                  <figcaption><b>Sếp Kế toán</b> triệu tập họp khẩn (lời dẫn minh họa).</figcaption>
                </figure>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="acc-foot">
        Số liệu lấy từ kết quả bay của trò chơi; lời kể, lời dẫn và tranh vẽ là minh họa, không phải tin tức thật.
      </footer>
    </article>
  );
}
