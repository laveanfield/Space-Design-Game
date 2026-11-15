import React from 'react';
import { BossPortrait, EngineerPortrait } from '../story/Portraits';
import PadExplosionArt from './PadExplosionArt';

/**
 * AccidentNewspaper -- Fictional front-page incident paper when a launch fails
 * (pad explosion, FTS termination, velocity shortfall, or scrub).
 * Masthead "The Spaceport Courier" is fictional. Telemetry numbers match real flight outputs.
 */

const tx = (o) => (o && typeof o === 'object' ? o.en || o.vi || '' : o || '');

const LABEL_EN = {
  'mass.dry_kg': 'Spacecraft dry mass',
  'mass.bus_limit_kg': 'Bus structural mass limit',
  need_fairing_m: 'Required fairing width',
  usable_fairing_m: 'Usable fairing width',
  dv_needed_ms: 'Required orbital Δv',
  dv_ideal_ms: 'Vehicle Δv capability',
  dv_short_ms: 'Δv shortfall',
};

const EVENT_EN = {
  LIFTOFF: 'Liftoff (LIFTOFF)',
  MAXQ: 'Max dynamic pressure (MAX-Q)',
  MECO: 'First-stage cutoff (MECO)',
  STAGE_SEP: 'Stage separation',
  SECO2: 'Upper-stage cutoff (SECO)',
  PAYLOAD_SEP: 'Spacecraft separation',
};

function fmt(v, unit) {
  const n = Number(v);
  const s = Number.isFinite(n) ? (Math.abs(n) >= 100 ? Math.round(n).toLocaleString('en-US') : String(Math.round(n * 100) / 100)) : String(v);
  return unit ? `${s} ${unit}` : s;
}

function editionDate() {
  try {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

export function buildAccidentInfo({ failure, flight, catalog, cost }) {
  if (!failure) return null;
  const vehId = flight?.meta?.vehicle;
  const siteId = flight?.meta?.site;
  const veh = catalog?.tables?.launch_vehicles?.[vehId]?.name || vehId || 'Launch Vehicle';
  const siteFull = catalog?.tables?.launch_sites?.[siteId]?.name || siteId || 'Launch Complex';
  const siteShort = (siteFull.match(/\(([^)]+)\)/)?.[1] || siteFull).toUpperCase();
  const t = Number(failure.t);
  const hasT = Number.isFinite(t) && failure.kind !== 'scrub' && failure.kind !== 'fts';
  const kind = failure.kind || 'launch';
  const nearPad = kind === 'structural_maxq' || kind === 'inspection_catastrophe' || (failure.explode && hasT && t <= 60);
  const scene = kind === 'scrub' ? 'pad-hold' : kind === 'wrong_plane' ? 'air-lost' : nearPad ? 'pad-boom' : failure.explode ? 'air-boom' : 'air-lost';

  const timeline = [];
  if (kind !== 'scrub') {
    timeline.push({ t: 'T-1 s', text: 'Main engine ignition (IGNITION)' });
    if (hasT) {
      const before = (flight?.events || []).filter((e) => e.name !== 'PAYLOAD_SEP' && Number(e.t) < t - 0.5);
      const same = (flight?.events || []).find((e) => Math.abs(Number(e.t) - t) <= 0.5 && e.name !== 'PAYLOAD_SEP');
      before.forEach((e) => timeline.push({ t: `T+${Math.round(e.t)} s`, text: EVENT_EN[e.name] || e.name }));
      timeline.push({
        t: `T+${Math.round(t)} s`,
        text: `${failure.explode ? 'EXPLOSION' : 'ANOMALY'}${same ? ` at ${EVENT_EN[same.name] || same.name}` : ''}`,
        fail: true,
      });
    } else {
      timeline.push({ t: 'IN FLIGHT', text: failure.explode ? 'FTS COMMAND - DESTRUCT' : 'FLIGHT ANOMALY', fail: true });
    }
  } else {
    timeline.push({ t: 'T-0', text: 'Chief Engineer halted countdown', fail: true });
  }

  const facts = [];
  if (hasT) facts.push({ v: `T+${Math.round(t)} s`, l: 'Time of incident' });
  const byLabel = {};
  (failure.numbers || []).forEach((n) => { byLabel[n.label] = n; });
  (failure.numbers || []).forEach((n) => {
    if (n.label === 'dv_short_ms' && byLabel.dv_needed_ms) return;
    if (n.value === 'UNFIXED') {
      facts.push({ v: 'UNFIXED', l: `Missed defect: ${n.label}` });
      return;
    }
    facts.push({ v: fmt(n.value, n.unit), l: LABEL_EN[n.label] || n.label });
  });
  const dry = byLabel['mass.dry_kg']?.value;
  const lim = byLabel['mass.bus_limit_kg']?.value;
  if (Number.isFinite(Number(dry)) && Number.isFinite(Number(lim)) && Number(lim) > 0) {
    facts.push({ v: `+${fmt(Number(dry) - Number(lim), 'kg')}`, l: `Over bus limit (${fmt(((Number(dry) / Number(lim)) - 1) * 100, '%')})` });
  }
  const payloadKg = Number(flight?.meta?.payload_kg);
  if (Number.isFinite(payloadKg) && payloadKg > 0) facts.push({ v: fmt(payloadKg, 'kg'), l: 'Spacecraft mass' });
  const money = Number(cost);
  if (Number.isFinite(money) && money > 0) facts.push({ v: `$${money.toFixed(1)}M`, l: 'Program loss' });

  return {
    kind,
    scene,
    explode: Boolean(failure.explode),
    titleEn: tx(failure.title),
    causeEn: tx(failure.cause),
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

function compose(info) {
  const V = info.vehicle;
  const VU = V.toUpperCase();
  const at = info.t != null ? `at T+${info.t} seconds` : 'mid-flight';
  const loss = info.cost != null
    ? `The mission is declared a total loss: vehicle, payload, and $${info.cost.toFixed(1)}M in program funds cannot be recovered.`
    : 'The mission is declared a total loss: both vehicle and spacecraft are unrecoverable.';
  const fix = 'The Chief Engineer has filed the preliminary anomaly dossier and returned to the design floor.';
  const cause = info.causeEn ? `Preliminary board findings point to "${info.titleEn}". ${info.causeEn}` : `Preliminary finding: ${info.titleEn}.`;

  if (info.kind === 'structural_maxq' || info.kind === 'inspection_catastrophe') {
    const maxq = info.kind === 'structural_maxq';
    return {
      kicker: 'BREAKING FROM LAUNCH COMPLEX',
      headline: `${VU} DESTROYED ABOVE THE PAD`,
      deck: maxq
        ? `Structural failure occurred ${at} as aerodynamic pressure peaked at Max-Q; launcher and spacecraft are lost.`
        : `A critical failure struck ${at} right after ignition; an unresolved defect slipped past pre-flight inspection.`,
      caption: `a fireball engulfs ${V} above the pad as airframe and upper stage break apart.`,
      paragraphs: [
        `A massive fireball swallowed the ${V} launcher ${at}${maxq ? ', right as dynamic pressure crossed Max-Q' : ', moments after main engine ignition'}. Dark smoke plumed over the pad while shockwaves swept the perimeter.`,
        cause,
        `${loss} ${fix}`,
      ],
    };
  }
  if (info.kind === 'fts') {
    return {
      kicker: 'RANGE SAFETY BULLETIN',
      headline: `RANGE DESTRUCT: ${VU} TERMINATED IN FLIGHT`,
      deck: 'The Chief Engineer triggered the Flight Termination System mid-ascent to keep debris clear of populated zones.',
      caption: `${V} destroyed downrange under Flight Termination System command; contrails scatter over open ocean.`,
      paragraphs: [
        `Range safety destruct charges terminated the ${V} flight mid-ascent on orders from the Chief Engineer. A bright flash flared high downrange followed by dispersing debris trails.`,
        info.causeEn || 'Flight termination was commanded while the vehicle was in powered ascent.',
        `${loss} ${fix}`,
      ],
    };
  }
  if (info.kind === 'dv_shortfall') {
    return {
      kicker: 'FLIGHT TELEMETRY ALERT',
      headline: `ORBITAL SHORTFALL: ${VU} FALLS BACK INTO ATMOSPHERE`,
      deck: 'Propellant exhausted short of orbital velocity; upper stage and spacecraft broke up during premature reentry.',
      caption: `${V} fragments high over the downrange track during atmospheric breakup.`,
      paragraphs: [
        `The ${V} upper stage burned to depletion before achieving orbital insertion speed. Both stage and payload slipped back into the upper atmosphere and disintegrated.`,
        cause,
        `${loss} ${fix}`,
      ],
    };
  }
  if (info.kind === 'scrub') {
    return {
      kicker: 'LAUNCH PAD DISPATCH',
      headline: `LATE SCRUB: ${VU} HELD ON PAD`,
      deck: 'Countdown halted seconds before ignition. Hardware remains intact, though campaign launch readiness fees are lost.',
      caption: `${V} stands motionless on the pad after hold call while cryogenic venting drifts across the flame trench.`,
      paragraphs: [
        `Flight controllers halted the terminal count just before ${V} main engine ignition. No damage or injuries occurred, though range turnaround costs must be written off.`,
        info.causeEn || 'Launch was scrubbed under Chief Engineer authority.',
        'Program leadership recorded the scrub against the engineering team reputation ledger.',
      ],
    };
  }
  if (info.kind === 'wrong_plane') {
    return {
      kicker: 'ORBIT OPERATIONS ALERT',
      headline: 'SPACECRAFT STRANDED IN WRONG ORBITAL PLANE',
      deck: 'Launch sequence executed nominally, but the chosen launch site could not place the payload in the target inclination.',
      caption: `${V} exhaust trail fades as the deployed spacecraft drifts out of mission coverage.`,
      paragraphs: [
        `Although ${V} flew its ascent profile cleanly, upper-stage propellant ran dry outside the target orbital plane, stranding the satellite clear of its mission corridor.`,
        cause,
        `${loss} ${fix}`,
      ],
    };
  }
  return {
    kicker: 'LAUNCH ANOMALY REPORT',
    headline: `FLIGHT FAILURE: ${info.titleEn || VU}`,
    deck: `The ${V} mission failed to complete orbital insertion.`,
    caption: `${V} suffered an in-flight anomaly.`,
    paragraphs: [`The ${V} flight experienced a critical anomaly ${at}.`, cause, `${loss} ${fix}`],
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
          <span>SPECIAL EDITION</span>
          <span>{story.kicker}</span>
          {!compact && <span>{editionDate()}</span>}
        </div>
        <h2 className="acc-name">The Spaceport Courier</h2>
        <div className="acc-dateline">
          <span>{info.siteFull}</span>
          <span>SIMULATION DISPATCH</span>
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
            <PadExplosionArt scene={info.scene} seed={seed} label={`Illustration: ${story.caption}`} />
          </div>
          <figcaption>
            <b>Illustration:</b> {story.caption}
          </figcaption>
        </figure>

        <div className="acc-col acc-col-c">
          <div className="acc-box facts">
            <div className="acc-box-title">KEY FIGURES</div>
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
              <div className="acc-box-title">FLIGHT TIMELINE</div>
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
                  <figcaption><b>Chief Engineer</b> filed the root-cause dossier.</figcaption>
                </figure>
                <figure className="acc-mug">
                  <BossPortrait mood="angry" />
                  <figcaption><b>Accounting Director</b> called an emergency review.</figcaption>
                </figure>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="acc-foot">
        Telemetry figures come from flight simulation output; editorial prose and artwork are fictionalized game illustrations.
      </footer>
    </article>
  );
}
