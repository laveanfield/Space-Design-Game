import React, { useEffect, useState } from 'react';
import { playSoundAsset } from '../api/client';

export const MISSION_BRIEFING_SPECS = {
  'MP-SC01-FIRST-EYES': {
    id: 'MP-SC01-FIRST-EYES',
    code: 'MISSION DOSSIER // MP-SC01-FIRST-EYES',
    titleEn: 'The First Eyes Looking Back at Earth',
    subtitle: 'Wildfire Emergency Reconnaissance Satellite',
    context:
      'A massive complex of simulated wildfires is sweeping across wide forest corridors. Thick smoke plumes and rugged terrain have paralyzed ground lookout stations and aerial reconnaissance. Emergency Command needs orbital imagery from low Earth orbit to map fire fronts and dispatch rescue crews.',
    targetOrbit: 'Low Earth Orbit LEO 400 km (ORB-LEO-400) or Sun-Synchronous Orbit SSO 550 km (ORB-SSO-550)',
    primaryObjective:
      'Design, launch, and operate a CubeSat Earth-observation spacecraft to automatically capture wildfire imagery and successfully downlink at least 3 clear frames to ground stations within mission lifetime.',
    payloadCapabilities:
      'Basic Multispectral Imager INS-01, 3-axis reaction wheel attitude control ADCS-WHEEL (for sharp, blur-free pointing), and deployable solar array PWR-SA-DEP for positive power balance.',
    observationReqs:
      'Sweep across coastal/forest fire target corridors (target_set: coast), keep pointing error low to prevent motion blur, and collect at least 3 valid frames.',
    commReqs:
      'Onboard flight computer storage (OBC-CUBE) retains imagery using Store-and-Forward buffering, paired with an S-Band transmitter (COM-S-CUBE) capable of transferring 100% of captured frames during ground station Line-of-Sight (LOS) windows.',
    constraintsText: 'Max Budget $18M | Build Deadline 12 months | Minimum Mission Life 1 year (12 orbital epochs)',
    successCriteria: [
      'Execute a proper gravity-turn ascent and inject the spacecraft into a valid LEO orbit.',
      'Survive orbital power and thermal cycles across all operational epochs.',
      'Capture at least 3 clear wildfire evidence frames into onboard storage.',
      'Establish ground station link and complete 100% downlink delivery of at least 3 evidence frames.',
    ],
  },
  'MP-SC03-SPACE-WEATHER': {
    id: 'MP-SC03-SPACE-WEATHER',
    code: 'MISSION DOSSIER // MP-SC03-SPACE-WEATHER',
    titleEn: 'Space Weather Sentinel',
    subtitle: 'Magnetosphere & Radiation Belt Early Warning',
    context:
      'Solar coronal mass ejection (CME) activity is surging, threatening high-voltage power grids, GPS navigation timing, and polar aviation corridors. Space Weather Command requires a hardened spacecraft operating directly inside the radiation belts for early warning.',
    targetOrbit: 'Medium Earth Orbit MEO 20,200 km (ORB-MEO-20200) traversing the Van Allen radiation belts',
    primaryObjective:
      'Maintain continuous magnetometer and high-energy particle sensor operations inside intense radiation, survive solar storms, and downlink at least 3 clear science observations.',
    payloadCapabilities:
      'Magnetometer & Radiation Sensor INS-08, shielded BUS-ESPA spacecraft bus, radiation-hardened flight computer OBC-RADHARD (required to survive MEO Single Event Upsets), BAT-L battery, and PWR-SA-SMALL solar array.',
    observationReqs:
      'Collect at least 3 validated magnetic-field and particle-flux datasets while traversing peak radiation zones without power collapse or computer lockups.',
    commReqs:
      'Store observations in OBC-RADHARD memory and use COM-S-CUBE or higher communications hardware to complete 100% downlink of 3 evidence frames from MEO 20,200 km range.',
    constraintsText: 'Max Budget $95M | Build Deadline 24 months | Mandatory Radiation Hardening',
    successCriteria: [
      'Launch and inject the spacecraft accurately into Medium Earth Orbit MEO 20,200 km.',
      'Withstand cumulative Total Ionizing Dose (TID) and solar storm upsets without losing the spacecraft.',
      'Capture and store at least 3 valid space weather science datasets.',
      'Successfully downlink 100% of at least 3 observation datasets from MEO to ground control.',
    ],
  },
  'MP-SC04-GHG': {
    id: 'MP-SC04-GHG',
    code: 'MISSION DOSSIER // MP-SC04-GHG',
    titleEn: 'Greenhouse Gas Monitor',
    subtitle: 'High-Precision CH4 / CO2 Plume Spectrometer',
    context:
      'Major industrial methane (CH4) and carbon dioxide (CO2) super-emitters and pipeline leaks must be pinpointed accurately from orbit to seal leaks rapidly and protect critical agricultural zones.',
    targetOrbit: 'Sun-Synchronous Orbit SSO 600 km (ORB-SSO-600) providing consistent solar illumination angle (>25 deg)',
    primaryObjective:
      'Operate a high-sensitivity SWIR greenhouse gas spectrometer in SSO, maintain ultra-fine 20-second target dwell stability over emission hotspots, and downlink large spectral datasets to Earth.',
    payloadCapabilities:
      'Greenhouse Gas Spectrometer INS-04 (high mass & power draw), Star-Tracker fine attitude control ADCS-FINE, large solar array PWR-SA-LARGE + BAT-L on heavy BUS-SMALL500 bus.',
    observationReqs:
      'Hold steady 20-second dwell pointing over emission hotspots (target_set: ghg_hotspots) at solar elevation >= 25 deg, capturing at least 3 sharp CH4/CO2 absorption spectra.',
    commReqs:
      'Spectrometer datasets require high storage & bandwidth: pair OBC-SPACE flight memory with a high-rate optical/X-Band downlink (COM-OPT-LEO or equivalent) to transfer 100% of 3 spectral frames to ground stations.',
    constraintsText: 'Max Budget $180M | Build Deadline 36 months | Requires Fine Pointing & High Power Margin',
    successCriteria: [
      'Deliver the heavy spectrometer spacecraft cleanly into Sun-Synchronous Orbit SSO 600 km.',
      'Maintain positive orbital power balance for INS-04 spectrometer and ADCS-FINE.',
      'Capture at least 3 sharp greenhouse gas spectral frames over hotspot sites.',
      'Complete 100% downlink delivery of at least 3 spectral evidence frames to Earth.',
    ],
  },
};

export function getMissionBriefingSpec(missionId, missionDetail = null, scenario = null) {
  const id = missionId || missionDetail?.id || 'MP-SC01-FIRST-EYES';
  const base = MISSION_BRIEFING_SPECS[id] || MISSION_BRIEFING_SPECS['MP-SC01-FIRST-EYES'];
  const sc = scenario || missionDetail?.scenario || {};
  const allowedOrbits =
    Array.isArray(sc.allowed_orbit_ids) && sc.allowed_orbit_ids.length > 0
      ? sc.allowed_orbit_ids.join(', ')
      : null;
  const budget = sc.budget_musd ?? null;
  const deadline = sc.deadline_months ?? null;
  const minLife = missionDetail?.life_years ?? sc.min_mission_life_years ?? 1;

  return {
    ...base,
    id,
    titleEn: missionDetail?.meta?.title?.en || base.titleEn,
    targetOrbit: allowedOrbits ? `${base.targetOrbit} [Allowed: ${allowedOrbits}]` : base.targetOrbit,
    primaryObjective: missionDetail?.objective?.statement?.en || base.primaryObjective,
    constraintsText:
      budget != null && deadline != null
        ? `Max Budget $${budget}M | Build Deadline ${deadline} months | Minimum Life ${minLife} yr`
        : base.constraintsText,
  };
}

export function MissionBriefingDossier({ missionId, missionDetail, scenario, compact = false, lang = 'en' }) {
  const spec = getMissionBriefingSpec(missionId, missionDetail, scenario);
  const [expanded, setExpanded] = useState(!compact);
  const isVi = lang === 'vi';

  return (
    <div
      className={`mission-dossier-sheet mission-letter ${compact ? 'compact' : ''} ${expanded ? 'is-expanded' : 'is-brief'}`}
      data-testid="mission-briefing-dossier"
    >
      <div className="mission-dossier-top">
        <div>
          <div className="mission-dossier-code">
            ✉ {isVi ? 'THƯ CHỈ THỊ NHIỆM VỤ' : 'OFFICIAL MISSION DISPATCH'} // {spec.id}
          </div>
          <h2 className="mission-dossier-title">{spec.titleEn}</h2>
          <div className="mission-dossier-sub">{spec.subtitle}</div>
        </div>
        <span className="mission-letter-seal">{spec.id}</span>
      </div>

      <div className="mission-letter-brief">
        <div className="mission-dossier-label">
          {isVi ? '1. TÓM TẮT NHIỆM VỤ' : '1. MISSION BRIEF'}
        </div>
        <p>{spec.context}</p>
        {!expanded && (
          <p className="mission-letter-brief-goal">
            <strong>{isVi ? 'Mục tiêu chính:' : 'Primary Goal:'}</strong> {spec.primaryObjective}
          </p>
        )}
      </div>

      {expanded && (
        <div className="mission-dossier-grid" style={{ marginTop: 10 }}>
          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">2. TARGET ORBIT</div>
            <p>{spec.targetOrbit}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">3. PRIMARY SCIENTIFIC OBJECTIVE</div>
            <p>{spec.primaryObjective}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">4. PAYLOAD &amp; HARDWARE REQUIREMENTS</div>
            <p>{spec.payloadCapabilities}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">5. OBSERVATION REQUIREMENTS</div>
            <p>{spec.observationReqs}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">6. COMMUNICATION &amp; DOWNLINK REQUIREMENTS</div>
            <p>{spec.commReqs}</p>
          </div>

          <div className="mission-dossier-cell">
            <div className="mission-dossier-label">7. CONSTRAINTS &amp; SCHEDULE</div>
            <p>{spec.constraintsText}</p>
          </div>

          <div className="mission-dossier-cell full">
            <div className="mission-dossier-label">8. MISSION SUCCESS CRITERIA</div>
            <ul className="mission-dossier-list">
              {spec.successCriteria.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mission-letter-foot">
        <span className="mission-letter-sign">
          {isVi ? '— Ban Điều Hành Chuyến Bay' : '— Flight Operations Command'}
        </span>
        <button
          type="button"
          className="btn small mission-letter-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? isVi
              ? '▲ THU GỌN BỨC THƯ'
              : '▲ FOLD LETTER (BRIEF)'
            : isVi
              ? '📜 MỞ XEM CHI TIẾT NHIỆM VỤ'
              : '📜 OPEN FULL LETTER DETAILS'}
        </button>
      </div>
    </div>
  );
}

const MISSION_CHECKLIST_ITEMS = [
  {
    id: 'CHK-1',
    title: '1. SPACECRAFT & LAUNCH ARCHITECTURE [02.BUILD]',
    desc: 'Assemble all 9 spacecraft and launch vehicle subsystems to match payload mass, power, radiation, and orbit constraints.',
    alert: null,
  },
  {
    id: 'CHK-2',
    title: '2. PRE-FLIGHT HARDWARE INSPECTION [03.INSPECT]',
    desc: 'Perform audio leak scan, X-ray weld crack repair, and optical mirror calibration before moving to the launch pad.',
    alert: null,
  },
  {
    id: 'CHK-3',
    title: '3. GRAVITY-TURN ASCENT & ORBITAL INSERTION [04.LAUNCH]',
    desc: 'Guide the launch vehicle along a realistic curved gravity turn through max-Q, stage separation, and safe perigee injection.',
    alert: null,
  },
  {
    id: 'CHK-4',
    title: '4. ORBITAL CAPTURE & STORE-AND-FORWARD OPS [05.ORBIT]',
    desc: 'Monitor onboard storage, manage battery cycles, capture clear target imagery, and downlink 100% of required evidence to ground stations.',
    alert:
      'WARNING: REACHING ORBIT IS ONLY HALF THE MISSION — THE MISSION SUCCEEDS ONLY WHEN ALL REQUIRED EVIDENCE REACHES GROUND STATIONS.',
  },
];

export default function CrisisIntro({
  missionId = 'MP-SC01-FIRST-EYES',
  missionDetail = null,
  scenario = null,
  phase = 'home',
  lang = 'en',
  audioOn,
  onComplete,
  onSkip,
}) {
  const effectiveMissionId = missionId || missionDetail?.id || 'MP-SC01-FIRST-EYES';
  const isWildfire = effectiveMissionId === 'MP-SC01-FIRST-EYES';
  const totalScenes = isWildfire ? 3 : 1;
  const [index, setIndex] = useState(0);
  const [checkedIds, setCheckedIds] = useState(() => ['CHK-1', 'CHK-2', 'CHK-3', 'CHK-4']);

  useEffect(() => {
    setIndex(0);
  }, [effectiveMissionId]);

  const last = index >= totalScenes - 1;

  useEffect(() => {
    playSoundAsset(
      audioOn,
      isWildfire && index === 0 ? '08-11-2026-alarm.wav' : '06-11-2026-blip.wav',
      isWildfire && index === 0 ? 0.22 : 0.14
    );
  }, [audioOn, index, isWildfire]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onSkip?.();
      if (event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault();
        if (last) onComplete?.();
        else setIndex((value) => value + 1);
      }
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last, onComplete, onSkip]);

  const toggleCheckItem = (id) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div
      className={`crisis-intro ${isWildfire && index === 0 ? 'scene-desk' : 'scene-control'}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Mission Briefing ${effectiveMissionId}`}
    >
      <div className="crisis-intro-backdrop" />

      {isWildfire && index === 0 && (
        <div className="desk-scene-stage">
          <div className="desk-lamp-glow" aria-hidden="true" />
          <div className="desk-coffee-ring" aria-hidden="true" />
          <div className="desk-pen" aria-hidden="true" />

          <article className="physical-newspaper" aria-label="Printed morning emergency newspaper">
            <div className="paper-fold-horizontal" aria-hidden="true" />
            <div className="paper-fold-vertical" aria-hidden="true" />

            <header className="paper-masthead">
              <div className="paper-ears">
                <span>MORNING EMERGENCY EDITION</span>
                <span>FICTIONAL IN-GAME SCENARIO</span>
                <span>INTERNAL DISPATCH</span>
              </div>
              <div className="paper-title">THE GLOBAL CHRONICLE</div>
              <div className="paper-subline">
                <span>SATURDAY, NOVEMBER 15, 2026</span>
                <span>|</span>
                <span>GLOBAL CLIMATE &amp; EMERGENCY DISPATCH</span>
                <span>|</span>
                <span>FRONT PAGE</span>
              </div>
            </header>

            <div className="paper-banner-kicker">
              <span>URGENT BULLETIN</span>
              <span>GROUND MONITORING NETWORKS BLINDED BY DENSE SMOKE</span>
            </div>

            <h1 className="paper-main-headline">
              LARGEST WILDFIRES IN OVER 3 CENTURIES...
            </h1>
            <p className="paper-deck">
              Massive wildfire fronts are erupting across coastal and mountain timberlines. Heavy smoke plumes have blinded aerial spotters and ground lookout towers across the affected corridors.
            </p>

            <div className="paper-columns">
              <div className="paper-col paper-col-lead">
                <figure className="paper-photo-frame">
                  <img
                    src="/mission_art/wildfire-ground.jpg"
                    alt="Ground photograph showing wildfire flames burning across a mountain ridge at night"
                    draggable={false}
                  />
                  <figcaption>
                    Ground view of an advancing ridge fire — thick smoke blankets nearby valleys and cuts off visual reconnaissance.
                  </figcaption>
                </figure>
                <p className="paper-dropcap">
                  Over the past 72 hours, dry hot winds have fanned the largest simulated wildfire outbreak recorded in three centuries. Regional weather stations and remote communication relays have gone silent across three coastal zones.
                </p>
              </div>

              <div className="paper-col">
                <h3 className="paper-subhead">RESCUE TEAMS OPERATING BLIND</h3>
                <p>
                  Fire command officials report that ground responders are navigating without updated thermal maps. &ldquo;We cannot tell which fire line is advancing toward populated towns and which flanks have stalled under the smoke canopy,&rdquo; the emergency dispatch bulletin stated.
                </p>
                <p>
                  The only remaining option is an urgent orbital reconnaissance launch into Low Earth Orbit (LEO) to image the active corridors from space and downlink coordinates directly to ground stations.
                </p>
              </div>

              <div className="paper-col paper-col-box">
                <div className="paper-dispatch-box">
                  <div className="paper-dispatch-tag">URGENT SPACE COMMAND DISPATCH</div>
                  <h4>LEAD ENGINEER SUMMONED</h4>
                  <p>
                    The Emergency Council has greenlit rapid-response satellite program{' '}
                    <strong>MP-SC01 &ldquo;The First Eyes Looking Back at Earth&rdquo;</strong>.
                  </p>
                  <p>
                    A Lead Rocket &amp; Spacecraft Engineer has been appointed to take over integration and flight operations immediately.
                  </p>
                </div>
                <p className="paper-disclaimer">
                  * Note: Fictional in-game newspaper and emergency event created for the NASA Space Apps Challenge mission design simulation.
                </p>
              </div>
            </div>

            <footer className="paper-action-bar">
              <span className="paper-scene-indicator">SCENE 01 / 03 — MORNING BRIEFING DESK</span>
              <div className="row-wrap">
                <button type="button" className="btn small" onClick={onSkip}>
                  SKIP INTRO [ESC]
                </button>
                <button type="button" className="btn primary crisis-continue" onClick={() => setIndex(1)}>
                  OPEN MISSION CHECKLIST
                </button>
              </div>
            </footer>
          </article>
        </div>
      )}

      {isWildfire && index === 1 && (
        <div className="crisis-clipboard-stage">
          <section className="panel clipboard-panel crisis-clipboard-panel" aria-label="Mission Assignment Checklist">
            <div className="clipboard-clip" aria-hidden="true" />
            <div className="clipboard-sheet">
              <h2 className="clipboard-title">
                <span>{MISSION_CHECKLIST_ITEMS.length} MISSION ASSIGNMENTS</span>
                <span className={`badge ${checkedIds.length === MISSION_CHECKLIST_ITEMS.length ? 'ok' : 'warn'}`}>
                  {checkedIds.length}/{MISSION_CHECKLIST_ITEMS.length} ACKNOWLEDGED
                </span>
              </h2>

              <div className="small muted-ink" style={{ marginBottom: 10 }}>
                MISSION CONTROL DIRECTIVE [DIR-01]: Ground networks are overloaded. You are appointed{' '}
                <strong>Lead Rocket &amp; Spacecraft Engineer</strong> for MP-SC01.
              </div>

              <div className="checklist-box">
                {MISSION_CHECKLIST_ITEMS.map((item) => {
                  const isChecked = checkedIds.includes(item.id);
                  const rowClass = item.alert ? 'check-row detected' : isChecked ? 'check-row' : 'check-row';
                  return (
                    <div
                      key={item.id}
                      className={`${rowClass} crisis-check-item`}
                      onClick={() => toggleCheckItem(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleCheckItem(item.id);
                        }
                      }}
                    >
                      <div className="row-between" style={{ gap: 8 }}>
                        <span>{item.title}</span>
                        <span className="small muted-ink">[{isChecked ? 'READY' : 'PENDING'}]</span>
                      </div>
                      <div className="small muted-ink">{item.desc}</div>
                      {item.alert && (
                        <div className="small err-ink" style={{ marginTop: 4 }}>
                          ⚠ {item.alert}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="clipboard-footer-actions">
                <button type="button" className="btn small" onClick={() => setIndex(0)}>
                  BACK TO NEWSPAPER
                </button>
                <div className="row-wrap">
                  <button type="button" className="btn small" onClick={onSkip}>
                    SKIP [ESC]
                  </button>
                  <button type="button" className="btn primary crisis-continue" onClick={() => setIndex(2)}>
                    OPEN MISSION DOSSIER
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {(!isWildfire || index === 2) && (
        <article className="crisis-intro-card briefing-modal-card">
          <header className="crisis-intro-header">
            <span className="crisis-live-dot" />
            <strong>
              {isWildfire
                ? 'SCENE 03 / 03 // DETAILED MISSION BRIEFING DOSSIER'
                : `DETAILED MISSION BRIEFING // ${effectiveMissionId}`}
            </strong>
            <span>{isWildfire ? '03 / 03' : '01 / 01'}</span>
          </header>

          <div className="crisis-briefing-scroll">
            <MissionBriefingDossier
              missionId={effectiveMissionId}
              missionDetail={missionDetail}
              scenario={scenario}
            />
          </div>

          <footer className="crisis-intro-footer">
            <span className="small muted">
              {isWildfire
                ? 'Confirm the engineering dossier to begin the interactive Chief Engineer walkthrough'
                : 'Confirm the engineering dossier to begin mission design'}
            </span>
            <div className="row-wrap">
              <button type="button" className="btn small" onClick={onSkip}>
                CLOSE [ESC]
              </button>
              {isWildfire && (
                <button type="button" className="btn small" onClick={() => setIndex(1)}>
                  BACK TO CHECKLIST
                </button>
              )}
              <button type="button" className="btn primary crisis-continue" onClick={onComplete}>
                {phase === 'home'
                  ? lang === 'vi'
                    ? 'XÁC NHẬN & VÀO SẢNH CHÍNH'
                    : 'CONFIRM & ENTER MAIN MENU'
                  : isWildfire
                    ? 'CONFIRM & START TUTORIAL'
                    : 'CONFIRM & ENTER MISSION'}
              </button>
            </div>
          </footer>
        </article>
      )}
    </div>
  );
}
