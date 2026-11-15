/**
 * Fixed mission narrative outcomes describing the human and planetary impact
 * for the 3 campaign missions:
 * 1. MP-SC01-FIRST-EYES (Wildfire monitoring & civilian evacuation)
 * 2. MP-SC03-SPACE-WEATHER (G5 geomagnetic storm, polar aviation & power grid defense)
 * 3. MP-SC04-GHG (Methane super-emitter detection & agricultural protection)
 */

export const HUMANITY_STORIES = {
  'MP-SC01-FIRST-EYES': {
    missionKey: 'wildfire',
    levelTag: 'STORY 01 // RAINFOREST WILDFIRE EMERGENCY CAMPAIGN',
    fail: {
      badge: 'ECOLOGICAL & CIVILIAN DISASTER',
      headline: 'BLIND IN THE FLAMES: 142,000 HECTARES OF FOREST LOST TO ASH',
      causeByFailure: {
        data: 'The spacecraft photographed the fire corridor, but low-bandwidth UHF radio bottlenecked the data in orbit — not a single fire-front coordinate reached ground control in time.',
        power: 'Under-sized solar generation caused a satellite brownout during orbital eclipse just as the fire front erupted.',
        pointing: 'Attitude control lacked reaction wheels, leaving all thermal and optical frames blurred beyond usable fire localization.',
        blur: 'Attitude control lacked reaction wheels, leaving all thermal and optical frames blurred beyond usable fire localization.',
        radiation: 'Radiation latch-ups froze the onboard computer, missing every overpass across the active burn corridor.',
        inspection_fault: 'An unfixed pre-flight hardware defect disabled the spacecraft immediately after fairing separation.',
        launch: 'The spacecraft failed to enter its operational orbit, leaving emergency command blind throughout peak drought.',
        default: 'The spacecraft failed to enter its operational orbit, leaving emergency command blind throughout peak drought.',
      },
      paragraphs: [
        'Through the critical first 72 hours of a record drought, regional fire command waited for thermal coordinates from orbit while ground monitors showed only static. Without early hotspot localization, a smoldering blaze on the western ridge met dry downslope winds and exploded into an uncontrollable megafire.',
        'By the time spotter helicopters sighted the glow through dense smoke, a 40-meter flame wall had already closed in. Evacuation orders went out late, throwing fourteen forest towns into chaotic midnight evacuations.',
      ],
      metrics: [
        {
          label: 'FOREST TIMBERLINE BURNED',
          value: '142,000 ha',
          sub: 'Old-growth canopy and watershed ecosystems destroyed',
        },
        {
          label: 'CIVILIANS FORCED TO EVACUATE',
          value: '38,500 people',
          sub: '14 towns isolated and 1,200 homes damaged or destroyed',
        },
        {
          label: 'TOXIC SMOKE & CO2 RELEASED',
          value: '410M tons',
          sub: 'Dense PM2.5 haze blanketed downstream basins for 21 days',
        },
      ],
      moral:
        'LESSON 01: A satellite that captures imagery without returning it to Earth is only a silent witness in the sky. Cutting corners on downlink bandwidth and power cost an entire century-old forest.',
    },
    ok: {
      badge: 'PLANETARY PROTECTION MISSION ACCOMPLISHED',
      headline: '14 GOLDEN MINUTES FROM ORBIT: 142,000 HECTARES OF FOREST SAVED',
      causeBridge:
        'With sufficient S-Band downlink throughput, positive power margin, and steady reaction-wheel pointing, 3 crisp fire-coordinate evidence frames reached emergency command on early passes.',
      paragraphs: [
        'Just 14 minutes after ignition along the dry western slope, the spacecraft locked onto the thermal plume and downlinked verified coordinates to ground responders. Water-bomber crews and rangers contained the perimeter before downslope winds could spread the fire.',
        'The entire mountain timber corridor and fourteen nearby communities weathered the harshest drought of the decade without a single casualty.',
      ],
      metrics: [
        {
          label: 'OLD-GROWTH FOREST PROTECTED',
          value: '142,000 ha',
          sub: '100% of perimeter hotspots extinguished before breakout',
        },
        {
          label: 'RESIDENTS KEPT SAFE',
          value: '38,500 people',
          sub: 'All 14 mountain towns remained safe without panic evacuation',
        },
        {
          label: 'EMISSIONS PREVENTED',
          value: '410M tons CO2',
          sub: 'Preserved regional air quality and clean watershed reserves',
        },
      ],
      moral:
        'LESSON 01: Timely orbital data is the thin line between a brush spark and a national disaster. When engineers protect the full data chain from lens to ground dish, thousands of lives stay safe.',
    },
  },

  'MP-SC03-SPACE-WEATHER': {
    missionKey: 'space_weather',
    levelTag: 'STORY 02 // NORTHERN HEMISPHERE GEOMAGNETIC SHIELD',
    fail: {
      badge: 'GRID & AVIATION INFRASTRUCTURE CRISIS',
      headline: 'NORTHERN BLACKOUT: G5 SOLAR STORM SHATTERS POWER GRIDS WITHOUT WARNING',
      causeByFailure: {
        radiation:
          'Commercial-grade avionics lacking radiation hardening suffered Van Allen proton latch-ups and locked up before the solar storm struck.',
        power: 'Battery and array margin collapsed inside MEO eclipse transitions, silencing the magnetometer before storm arrival.',
        inspection_fault:
          'An unresolved integration fault triggered total loss of telemetry shortly after orbital deployment.',
        launch: 'The sentinel never stabilized in MEO-20200, leaving Earth without an early geomagnetic warning beacon.',
        default: 'The sentinel never stabilized in MEO-20200, leaving Earth without an early geomagnetic warning beacon.',
      },
      paragraphs: [
        'As a massive Coronal Mass Ejection hurtled toward Earth at 2,100 km/s, ground operators never received the 18-hour MEO warning bulletin. Geomagnetically induced currents slammed unshielded high-voltage transmission corridors across high latitudes.',
        'Major step-up transformers tripped and failed in freezing night air while severe ionospheric distortion severed polar HF radio and degraded GPS guidance for hundreds of commercial flights.',
      ],
      metrics: [
        {
          label: 'WINTER HOUSEHOLDS WITHOUT POWER',
          value: '6.4 million',
          sub: '14 EHV substations damaged; 210 hospitals switched to backup generators',
        },
        {
          label: 'FLIGHTS HIT BY POLAR BLACKOUT',
          value: '340 flights',
          sub: '6-hour HF blackout forced emergency polar diversions',
        },
        {
          label: 'GRID & LEO SATELLITE LOSSES',
          value: '$4.8 billion',
          sub: '18 commercial satellites damaged without safe-mode lead time',
        },
      ],
      moral:
        'LESSON 02: Deep inside the Van Allen belts, cheap unshielded electronics do not merely fail a budget sheet — they silence humanity’s only alarm bell before solar fury hits.',
    },
    ok: {
      badge: 'GEOMAGNETIC EARLY WARNING VERIFIED',
      headline: '18-HOUR ADVANCE ALERT: 6.4M HOMES & 340 FLIGHTS SHIELDED FROM G5 STORM',
      causeBridge:
        'Equipped with a radiation-hardened OBC-RADHARD computer and robust power reserves, the MEO-20200 magnetometer operated cleanly throughout the proton storm and delivered verified alerts on schedule.',
      paragraphs: [
        'As the solar plasma front swept across 20,200 km altitude, the sentinel resolved interplanetary magnetic polarity and transmitted red-alert bulletins 18 hours before Earth impact. Grid operators balanced loads and isolated vulnerable transformers in advance.',
        'Airlines smoothly rerouted 340 transpolar flights clear of ionospheric blackout corridors while 18 low-orbiting satellites entered safe mode unscathed.',
      ],
      metrics: [
        {
          label: 'POWER CUSTOMERS PROTECTED',
          value: '6.4 million',
          sub: 'Zero substation burnouts; 210 hospitals maintained continuous grid power',
        },
        {
          label: 'FLIGHTS SAFELY REROUTED',
          value: '340 flights',
          sub: 'Continuous communications maintained outside polar blackout zones',
        },
        {
          label: 'INFRASTRUCTURE SAVED',
          value: '$4.8 billion',
          sub: '18 LEO spacecraft safely transitioned to protective mode',
        },
      ],
      moral:
        'LESSON 02: Investing in radiation-hardened flight heritage is life insurance for modern civilization’s power grids and skies.',
    },
  },

  'MP-SC04-GHG': {
    missionKey: 'ghg',
    levelTag: 'STORY 03 // GLOBAL METHANE & FOOD SECURITY AUDIT',
    fail: {
      badge: 'CLIMATE & HARVEST DISASTER',
      headline: 'INVISIBLE METHANE PLUMES PUSH 850,000 FARMERS INTO SEVERE DROUGHT',
      causeByFailure: {
        pointing:
          'SWIR spectrometry requires arcsecond dwell precision; coarse ADCS jitter smeared scans by tens of kilometers, invalidating emissions attribution.',
        blur: 'SWIR spectrometry requires arcsecond dwell precision; coarse ADCS jitter smeared scans by tens of kilometers, invalidating emissions attribution.',
        power: 'High-draw spectrometer operations depleted battery reserves over target industrial basins.',
        data: 'Massive spectral cubes piled up in onboard storage without a high-rate optical/X-band downlink to reach climate regulators.',
        inspection_fault:
          'Unresolved optical mirror misalignment skewed calibration across all greenhouse gas scans.',
        launch: 'Failure to reach SSO-600 paralyzed independent orbital verification of industrial methane leaks.',
        default: 'Failure to reach SSO-600 paralyzed independent orbital verification of industrial methane leaks.',
      },
      paragraphs: [
        'Without sharp spectral evidence from Sun-Synchronous Orbit (SSO-600), major oilfields and industrial manifolds continued venting vast clouds of invisible Methane (CH4) unchecked.',
        'Near-term warming spikes amplified regional drought and saltwater intrusion across lowland deltas during the following growing season.',
      ],
      metrics: [
        {
          label: 'UNREPORTED METHANE LEAKED',
          value: '1.8M tons',
          sub: '20-year warming impact equivalent to ~150M tons of CO2',
        },
        {
          label: 'CROPLAND LOST TO SALINITY',
          value: '2.3M hectares',
          sub: 'Coastal agricultural deltas parched by extreme heatwaves',
        },
        {
          label: 'FARMERS HIT BY CROP LOSS',
          value: '850,000 people',
          sub: 'Severe regional harvest shortfall and supply-chain strain',
        },
      ],
      moral:
        'LESSON 03: Greenhouse leaks are invisible to the naked eye — if orbital optics miss by even tenths of a degree, accountability vanishes and farming communities pay the price.',
    },
    ok: {
      badge: 'GLOBAL CLIMATE TRANSPARENCY BREAKTHROUGH',
      headline: 'PROOF FROM ORBIT: 27 METHANE SUPER-EMITTERS PINPOINTED & SEALED',
      causeBridge:
        'With fine star-tracker pointing (ADCS-FINE), positive solar power margin, and high-throughput downlink, the spectrometer held steady 20-second dwells and delivered unmistakable plume maps.',
      paragraphs: [
        'Precision SWIR maps from 600 km identified 27 industrial super-emitter leaks down to individual pipeline manifolds. Armed with sub-50m coordinates, regulators enforced rapid valve repairs within the first month.',
        'Emissions equivalent to 150M tons of CO2 were halted in time to stabilize regional water tables and harvests.',
      ],
      metrics: [
        {
          label: 'METHANE PLUMES SEALED',
          value: '1.8M tons',
          sub: 'Avoided ~150M tons CO2-equivalent atmospheric warming',
        },
        {
          label: 'FARMLAND PRESERVED',
          value: '2.3M hectares',
          sub: 'Watershed salinity and drought exposure sharply curbed',
        },
        {
          label: 'FARMING LIVELIHOODS SAVED',
          value: '850,000 people',
          sub: 'All 27 super-emitters capped under continuous orbital verification',
        },
      ],
      moral:
        'LESSON 03: Sub-arcsecond engineering discipline in orbit delivers measurable environmental justice on Earth.',
    },
  },
};

function normalizeFailureKey(failureId, outcome) {
  const raw = String(failureId || outcome?.killer || outcome?.review_fail?.[0] || '').toLowerCase();
  if (!raw) return 'default';
  if (raw === 'structural_maxq' || raw === 'dv_shortfall' || raw === 'wrong_plane') return 'launch';
  return raw;
}

/**
 * Returns fixed mission storytelling content tied to mission ID and engineering outcome.
 */
export function getHumanityImpact(missionId, { success = false, failureId = '', outcome = null } = {}) {
  const entry = HUMANITY_STORIES[missionId] || HUMANITY_STORIES['MP-SC01-FIRST-EYES'];
  const branch = success ? entry.ok : entry.fail;
  const key = normalizeFailureKey(failureId, outcome);
  const causeBridge = success
    ? branch.causeBridge
    : branch.causeByFailure?.[key] || branch.causeByFailure?.default || branch.causeByFailure?.launch || '';

  return {
    missionId: missionId || 'MP-SC01-FIRST-EYES',
    missionKey: entry.missionKey,
    levelTag: entry.levelTag,
    success: Boolean(success),
    badge: branch.badge,
    headline: branch.headline,
    causeBridge,
    paragraphs: branch.paragraphs,
    metrics: branch.metrics,
    moral: branch.moral,
  };
}
