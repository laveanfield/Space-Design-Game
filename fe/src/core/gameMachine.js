/**
 * gameMachine -- Finite State Machine, hardware trade-off notes,
 * 9-step sequential build unlocking, and 3 pre-flight inspection tasks.
 */

export const REP_MAX = 3;
export const INSPECT_BASE_SEC = 60;

export const PHASES = [
  { id: 'brief', label: '01.BRIEF' },
  { id: 'design', label: '02.BUILD' },
  { id: 'inspect', label: '03.INSPECT' },
  { id: 'launch', label: '04.LAUNCH_3D' },
  { id: 'life', label: '05.ORBIT_12M' },
  { id: 'review', label: '06.REVIEW' },
];

/**
 * 9 subsystem slots in sequential unlock order:
 * 1.ORBIT -> 2.LAUNCH -> 3.BUS -> 4.INSTR -> 5.POWER -> 6.BATT -> 7.COMM -> 8.OBC -> 9.ADCS
 */
export const SLOTS = [
  {
    id: 'orbit',
    label: '1.ORBIT',
    step: 0,
    title: 'STEP 1/9 | TARGET ORBIT (ORBIT)',
    shortDesc: 'Select orbital altitude and inclination around Earth.',
    highlight: 'Determines imaging coverage, eclipse duration, atmospheric drag, and radiation dose.',
    lockHint: '',
    nextLabel: '2.LAUNCH (Launch Vehicle)',
  },
  {
    id: 'launch',
    label: '2.LAUNCH',
    step: 1,
    title: 'STEP 2/9 | LAUNCH SYSTEM (LAUNCH VEHICLE)',
    shortDesc: 'Select booster and pad to inject the spacecraft into target orbit.',
    highlight: 'Must exceed total mass (CAP kg) at target orbit and fit fairing diameter (FAIR m).',
    lockHint: 'Review and click [NEXT] in 1.ORBIT first to unlock!',
    nextLabel: '3.BUS (Spacecraft Bus)',
  },
  {
    id: 'bus',
    label: '3.BUS',
    step: 2,
    title: 'STEP 3/9 | SPACECRAFT BUS (BUS)',
    shortDesc: 'Select the structural frame housing all spacecraft subsystems.',
    highlight: 'Sets maximum dry-mass limit (<= kg) and payload power delivery capability.',
    lockHint: 'Complete step 2.LAUNCH first to unlock the Spacecraft Bus!',
    nextLabel: '4.INSTR (Payload / Sensor)',
  },
  {
    id: 'instruments',
    label: '4.INSTR',
    step: 3,
    title: 'STEP 4/9 | PAYLOAD INSTRUMENT (CAMERA / SENSOR)',
    shortDesc: 'Select optical camera or science sensor to collect mission evidence.',
    highlight: 'Drives daily data volume (GB/day), power draw, and pointing precision (PT deg).',
    lockHint: 'Complete step 3.BUS first to unlock Payload Instruments!',
    nextLabel: '5.POWER (Solar Array)',
  },
  {
    id: 'power',
    label: '5.POWER',
    step: 4,
    title: 'STEP 5/9 | SOLAR ARRAY (POWER)',
    shortDesc: 'Generate electrical power in sunlight to run avionics and charge batteries.',
    highlight: 'Generated wattage (GEN W) must sustain loads plus orbital eclipse recharging.',
    lockHint: 'Complete step 4.INSTR first to unlock Solar Arrays!',
    nextLabel: '6.BATT (Battery Pack)',
  },
  {
    id: 'battery',
    label: '6.BATT',
    step: 5,
    title: 'STEP 6/9 | ENERGY STORAGE (BATTERY)',
    shortDesc: 'Store power to keep payload and communications alive through Earth eclipse.',
    highlight: 'Undersized capacity (CAP Wh) causes brownouts in Earth shadow.',
    lockHint: 'Complete step 5.POWER first to unlock Batteries!',
    nextLabel: '7.COMM (Downlink Radio)',
  },
  {
    id: 'comm',
    label: '7.COMM',
    step: 6,
    title: 'STEP 7/9 | COMMUNICATIONS (RADIO / LASER)',
    shortDesc: 'Downlink imagery and telemetry from orbit to ground receiving stations.',
    highlight: 'Downlink rate (DL Mbps) must keep pace with generated daily data volume.',
    lockHint: 'Complete step 6.BATT first to unlock Communications!',
    nextLabel: '8.OBC (Flight Computer)',
  },
  {
    id: 'obc',
    label: '8.OBC',
    step: 7,
    title: 'STEP 8/9 | ON-BOARD COMPUTER (OBC)',
    shortDesc: 'Store frames (Store-and-Forward) and command spacecraft operations.',
    highlight: 'Low radiation tolerance (RAD krad) causes processor lockups in high radiation.',
    lockHint: 'Complete step 7.COMM first to unlock Flight Computer (OBC)!',
    nextLabel: '9.ADCS (Attitude Control)',
  },
  {
    id: 'adcs',
    label: '9.ADCS',
    step: 8,
    title: 'STEP 9/9 | ATTITUDE CONTROL (ADCS)',
    shortDesc: 'Stabilize spacecraft orientation so optics lock onto ground targets.',
    highlight: 'Pointing error (PT deg) must be tighter than camera requirement to prevent blur.',
    lockHint: 'Complete step 8.OBC first to unlock ADCS!',
    nextLabel: 'GO TO INSPECTION (03.INSPECT)',
  },
];

export function isSlotUnlocked(slotId, buildStage = 0) {
  const slot = SLOTS.find((s) => s.id === slotId);
  if (!slot) return true;
  return buildStage >= slot.step;
}

/**
 * Detailed hardware insight database: usage, pros, cons/risks.
 */
export const PART_INSIGHTS = {
  // --- 1. ORBITS ---
  'ORB-LEO-400': {
    where: 'Low Earth Orbit at 400 km (ISS-like) — suited for short-duration CubeSat wildfire/Earth imaging.',
    pros: 'Very easy to reach (small boosters lift high mass), low radiation (1 krad/yr), close sharp imaging.',
    cons: 'Noticeable atmospheric drag (~2 yr natural decay without reboost) and 37% eclipse time.',
  },
  'ORB-LEO-500': {
    where: 'Standard 500 km Low Earth Orbit — balanced baseline for small Earth observation missions.',
    pros: 'Good longevity (~10 yr), manageable booster demand, low radiation (1.5 krad/yr).',
    cons: 'Local solar lighting angle drifts seasonally; 37% eclipse fraction.',
  },
  'ORB-SSO-600': {
    where: 'Sun-Synchronous 600 km Orbit (10:30 AM node) — gold standard for forestry, coast, and GHG monitoring.',
    pros: 'Passes every site at the same local sun time for consistent imagery; ~25 yr orbital life.',
    cons: 'Higher delta-v/polar inclination required; radiation increases to 3 krad/yr.',
  },
  'ORB-SSO-DD-600': {
    where: 'Dawn-Dusk 600 km Sun-Synchronous Orbit — built for space telescopes or high-power SAR radar.',
    pros: 'Near-continuous sunlight (only ~3% eclipse) so solar arrays generate power almost constantly.',
    cons: 'Oblique low-angle ground shadows; requires high-inclination polar launch.',
  },
  'ORB-POLAR-800': {
    where: '800 km Polar Orbit — suited for global radar/mapping across both poles.',
    pros: '100% global Earth coverage with long ground-station pass durations (65 min/day).',
    cons: 'Passes polar radiation horns (8 krad/yr) and requires higher booster energy.',
  },
  'ORB-MEO-20200': {
    where: '20,200 km Medium Earth Orbit (GPS belt) — used for Space Weather & radiation belt science.',
    pros: 'Hemispheric view and long ground contact windows (240 min/day).',
    cons: 'Sits deep inside the Van Allen radiation belts (25 krad/yr — fries non-hardened chips) and costs high delta-v.',
  },
  'ORB-GTO': {
    where: 'Geostationary Transfer Orbit (250 x 35,786 km) — magnetosphere sweeps or GEO transfer.',
    pros: 'Samples multiple magnetospheric layers with long apogee visibility.',
    cons: 'Repeatedly cuts through Van Allen belts (15 krad/yr) and demands medium/heavy lift.',
  },
  'ORB-GEO': {
    where: '35,786 km Geostationary Orbit — fixed 24/7 dwell over one continent for weather/telecom.',
    pros: 'Fixed sky position (1,440 min/day contact) with minimal ~1% eclipse.',
    cons: 'Extreme distance (standard imagers blur out; requires large antennas and heavy launchers).',
  },

  // --- 2. LAUNCH VEHICLES ---
  'LV-ELECTRON': {
    where: 'Light Rocket Lab Electron — built for CubeSats (3U–12U) and microsatellites to LEO/SSO.',
    pros: 'Very low cost ($7.5M) and rapid 6-month lead time, ideal for tight-budget LEO missions.',
    cons: 'Tight lift cap (300 kg LEO max) and narrow 1.2 m fairing — oversized stacks risk fairing rupture at Max-Q.',
  },
  'LV-VEGAC': {
    where: 'Small-to-medium Vega-C — suited for ESPA / SmallSat science payloads to SSO & polar orbits.',
    pros: 'Lifts 3,300 kg to LEO with a 3.3 m fairing for $40M.',
    cons: 'Lower reliability rating (88%) and 18-month integration lead time.',
  },
  'LV-LVM3': {
    where: 'Medium-heavy ISRO LVM3 — reliable workhorse for mid-to-heavy spacecraft to LEO, MEO, or GTO.',
    pros: 'Strong price-to-mass ratio ($42M for 8,000 kg LEO, 5.0 m fairing) with 97% reliability.',
    cons: '24-month procurement timeline can cut into tight deadlines.',
  },
  'LV-H3-24L': {
    where: 'JAXA H3-24L heavy booster — suited for bulky satellites needing a 5.2 m fairing.',
    pros: 'High lift capacity (16,500 kg LEO, 6,500 kg GTO) at $65M.',
    cons: '85% catalog reliability and 24-month lead time.',
  },
  'LV-NEWGLENN': {
    where: 'Super-heavy Blue Origin New Glenn — designed for massive observatories or heavy GEO spacecraft.',
    pros: 'Huge 7.0 m fairing and 45,000 kg LEO capacity at $90M.',
    cons: '90% catalog reliability and heavily oversized for small satellites.',
  },
  'LV-ARIANE62': {
    where: 'Ariane 62 (2 boosters) — European baseline for large science and Earth observation satellites.',
    pros: '97% reliability, 5.4 m fairing, 10,300 kg LEO / 4,500 kg GTO capacity.',
    cons: 'High $95M price easily exceeds early-mission budgets.',
  },
  'LV-VULCAN-VC6': {
    where: 'Heavy ULA Vulcan Centaur VC6 — built for high-energy MEO/GEO upper-stage insertion.',
    pros: '27,200 kg LEO and 14,500 kg GTO capacity with an 18-month build time.',
    cons: 'Expensive ($110M).',
  },
  'LV-ARIANE64': {
    where: 'Heavy Ariane 64 (4 boosters) — maximum lift for heavy observatories and distant orbits.',
    pros: '21,600 kg LEO / 11,500 kg GTO capacity with 5.4 m fairing.',
    cons: 'Most expensive ($125M) with 24-month build schedule.',
  },

  // --- 3. SATELLITE BUSES ---
  'BUS-3U': {
    where: 'Shoebox-sized 3U CubeSat bus — starter low-cost platform for tiny RGB imagers.',
    pros: 'Ultra-cheap ($0.4M), light (1 kg dry), 6-month build time.',
    cons: 'Hard 6 kg total mass cap and only 6 W payload power — heavy instruments overload immediately.',
  },
  'BUS-6U': {
    where: '6U CubeSat bus — compact frame for small imagers or magnetometers.',
    pros: 'Affordable ($1.2M), supports up to 12 kg total mass and 25 W payload power.',
    cons: 'Too small for multispectral imagers or radar payloads.',
  },
  'BUS-12U': {
    where: 'Large 12U CubeSat bus — budget-friendly frame for mid-weight payloads.',
    pros: '$3.0M cost, up to 24 kg total mass and 50 W payload power.',
    cons: 'Still too tight for 25 kg multispectral imagers or SAR radar.',
  },
  'BUS-ESPA': {
    where: 'Microsatellite ESPA bus (~180 kg class) — built for multispectral, thermal IR, or MEO science.',
    pros: 'Handles up to 180 kg total mass and 150 W payload power; fits mid-size boosters.',
    cons: 'Costs $18M with a 24-month build duration.',
  },
  'BUS-SMALL500': {
    where: '500 kg SmallSat bus — tailored for SAR radar, greenhouse gas spectrometers, or astronomy.',
    pros: 'Rugged 500 kg mass ceiling and 500 W payload power.',
    cons: '130 kg dry mass, $60M cost, and 30-month schedule.',
  },
  'BUS-LARGE-LEO': {
    where: 'Large 2,000 kg LEO Observatory bus — multi-instrument heavy remote sensing platforms.',
    pros: '2,000 kg capacity and 2,500 W power capability.',
    cons: 'Very costly ($220M), 48-month build, requires heavy lift.',
  },
  'BUS-GEO': {
    where: '4,000 kg Geostationary bus — built for 10–15 yr service at 35,786 km.',
    pros: '4,000 kg mass capacity and 5,000 W power output.',
    cons: '$450M cost and 60-month lead time.',
  },

  // --- 4. INSTRUMENTS (PAYLOAD) ---
  'INS-01': {
    where: 'Compact RGB camera — entry-level Earth observation in Low Earth Orbit (LEO/SSO).',
    pros: 'Ultra-light (0.8 kg), low draw (4 W), small data footprint (0.4 GB/day), $0.3M.',
    cons: 'Basic optical tier: coarse resolution and alignment mounts drift easily during integration!',
  },
  'INS-02': {
    where: 'Multispectral Imager — coastal, agriculture, forestry, and flood monitoring.',
    pros: 'Multi-band sensing yields high science value (40 pts) with solid reliability.',
    cons: '25 kg mass, 45 W draw, generates 12 GB/day, and needs <= 0.1 deg ADCS pointing.',
  },
  'INS-03': {
    where: 'Thermal Infrared Camera — detects wildfires, volcanic hotspots, and nocturnal heat.',
    pros: 'Penetrates smoke haze to locate fire fronts; moderate 12 kg / 30 W footprint.',
    cons: 'Requires <= 0.1 deg pointing accuracy and produces 8 GB/day.',
  },
  'INS-04': {
    where: 'Hyperspectral / GHG Spectrometer — precision chemical, mineral, and emission mapping.',
    pros: 'Top-tier spectral sensitivity (70+ pts) across hundreds of narrow channels.',
    cons: 'Heavy (60 kg, 120 W), generates 40 GB/day, demands <= 0.05 deg pointing.',
  },
  'INS-05': {
    where: 'Small X-Band SAR Radar — all-weather day/night imaging through clouds and storms.',
    pros: 'Weather-independent operations (80 pts), unaffected by smoke or cloud cover.',
    cons: 'Draws 450 W and generates 150 GB/day — requires large solar wings and Ka/Optical downlink.',
  },
  'INS-06': {
    where: 'Atmospheric Gas Sounder — global CO2 and CH4 column monitoring.',
    pros: 'Extremely sensitive trace-gas detection (75 pts).',
    cons: 'Heavy (140 kg), 150 W draw, $90M cost, 42-month lead time.',
  },
  'INS-07': {
    where: 'Fluxgate Magnetometer — measures Earth magnetic field and geomagnetic storms.',
    pros: 'Tiny footprint (1.5 kg, 2 W) and relaxed pointing (+/-10 deg).',
    cons: 'Telemetry-only science sensor; captures no surface optical imagery.',
  },
  'INS-08': {
    where: 'Charged Particle & Magnetometer Sensor — built for MEO/GTO Space Weather.',
    pros: 'Lightweight (3 kg, 5 W), minimal data (0.05 GB/day), thrives in high orbits.',
    cons: 'Measures space environment only, not surface optical frames.',
  },
  'INS-09': {
    where: '0.3 m UV/Optical Space Telescope — deep-sky galaxy and stellar science.',
    pros: 'Outstanding astronomical resolution (80 pts).',
    cons: 'Requires ADCS-FINE (<= 0.001 deg) and $120M budget.',
  },
  'INS-10': {
    where: 'Near-IR Sky Survey Spectrometer — all-sky cosmology in Dawn-Dusk orbit.',
    pros: 'Maximum science score (85 pts).',
    cons: 'Restricted to ORB-SSO-DD-600, 110 kg mass, $100M price.',
  },

  // --- 5. SOLAR ARRAYS (POWER) ---
  'PWR-SA-BODY': {
    where: 'Body-mounted 3U solar panels — for low-power CubeSats running basic sensors.',
    pros: 'Inexpensive ($0.25M), 0.3 kg, zero deployment hinge risk.',
    cons: 'Generates only 12 W — cameras plus S-Band radio will drain batteries rapidly.',
  },
  'PWR-SA-DEP': {
    where: 'Deployable 6U–12U solar wings — ideal for imaging CubeSats and small sats.',
    pros: 'Produces 60 W for 1.5 kg and $1.0M — comfortably powers RGB imagers + S-Band radio.',
    cons: 'Insufficient for heavy multispectral or radar payloads.',
  },
  'PWR-SA-SMALL': {
    where: 'SmallSat solar array (350 W) — built for ESPA and medium remote-sensing buses.',
    pros: '350 W steady generation with low 1.5%/yr degradation.',
    cons: '11 kg array mass will not fit small 3U/6U CubeSat buses.',
  },
  'PWR-SA-LARGE': {
    where: 'Large 2,500 W LEO array — built for SAR radar and multi-sensor observatories.',
    pros: 'Delivers generous 2.5 kW orbital power.',
    cons: '65 kg mass and $18M price tag.',
  },
  'PWR-SA-GEO': {
    where: 'High-capacity 6,000 W GEO wings — built for 10+ yr geostationary platforms.',
    pros: 'Massive 6 kW continuous output.',
    cons: '150 kg mass and $45M cost.',
  },

  // --- 6. BATTERIES ---
  'BAT-S': {
    where: 'Small 40 Wh Li-ion pack — carries tiny CubeSats across short orbital eclipses.',
    pros: 'Light (0.3 kg), cheap ($0.1M), fast 3-month delivery.',
    cons: 'Only 40 Wh — loads above ~15 W risk complete brownout in Earth shadow.',
  },
  'BAT-M': {
    where: 'Mid-size 200 Wh Li-ion battery — standard storage for 12U and small satellites.',
    pros: '200 Wh safety cushion for 1.4 kg and $0.4M.',
    cons: 'Insufficient for >100 W radar loads across eclipse.',
  },
  'BAT-L': {
    where: 'High-capacity 1,000 Wh Li-ion battery — built for medium and heavy payloads.',
    pros: '1 kWh reserve sustains heavy sensors safely through eclipse transitions.',
    cons: '6.5 kg weight requires checking small CubeSat mass budgets.',
  },
  'BAT-XL': {
    where: '8,000 Wh GEO battery bank — heavy-duty long-life storage.',
    pros: 'Massive 8 kWh capacity rated to 60% depth of discharge.',
    cons: '55 kg weight and $12M cost.',
  },

  // --- 7. COMMUNICATIONS (COMM) ---
  'COM-UHF': {
    where: 'UHF Transceiver — beacon telemetry and tiny health packets only.',
    pros: 'Ultra-cheap ($0.1M), 0.1 kg, forgiving +/-30 deg antenna pattern.',
    cons: 'Tiny 0.0096 Mbps throughput — CANNOT downlink images, causing storage overflow!',
  },
  'COM-S-CUBE': {
    where: 'CubeSat S-Band Transmitter — downlinks RGB wildfire imagery (INS-01) from LEO.',
    pros: '2 Mbps speed clears small camera frames reliably for 0.4 kg and $0.3M.',
    cons: '3,000 km max range (too weak for MEO/GEO) and throttles heavy multispectral/radar frames.',
  },
  'COM-X-SMALL': {
    where: 'SmallSat 50 Mbps X-Band radio — downlinks multispectral & thermal IR frames in LEO/SSO.',
    pros: 'Fast 50 Mbps rate keeps onboard queues clear for most mid-tier sensors.',
    cons: 'Draws 35 W, weighs 3 kg, range capped at <= 3,000 km.',
  },
  'COM-KA-LEO': {
    where: 'High-rate 500 Mbps Ka-Band terminal — built for SAR radar and hyperspectral missions.',
    pros: 'Massive 500 Mbps pipeline eliminates LEO data bottlenecks.',
    cons: 'Draws 120 W, 12 kg mass, needs <= 0.5 deg pointing.',
  },
  'COM-OPT-LEO': {
    where: '1,000 Mbps Laser Optical Terminal — maximum LEO throughput.',
    pros: 'Fastest 1 Gbps link in the catalog.',
    cons: 'Demands ultra-tight <= 0.01 deg pointing and clear skies.',
  },
  'COM-X-MGA': {
    where: 'Medium-gain X-Band terminal — closes long links from MEO 20,200 km & GTO.',
    pros: '60,000 km operating range reaches ground stations reliably from MEO/GTO.',
    cons: 'Draws 90 W and weighs 8 kg.',
  },
  'COM-X-HGA': {
    where: '1.5 m High-Gain X-Band dish — GEO and deep-space communications.',
    pros: '400,000 km reach at 60 Mbps.',
    cons: 'Large dish checks fairing diameter; 25 kg mass and 150 W draw.',
  },
  'COM-KA-GEO': {
    where: 'GEO Ka-Band wideband link — high-rate 35,786 km broadcasting.',
    pros: '100,000 km range at 300 Mbps.',
    cons: '40 kg mass, 280 W power draw, $45M price.',
  },

  // --- 8. ON-BOARD COMPUTER (OBC) ---
  'OBC-BASIC': {
    where: 'Entry microcontroller — short-duration CubeSats in low radiation (LEO 400–500 km).',
    pros: 'Ultra-cheap ($0.05M), 50 g, 0.5 W draw.',
    cons: 'Weak 10 krad tolerance and 4 GB storage — locks up quickly in high radiation orbits.',
  },
  'OBC-CUBE': {
    where: 'CubeSat Linux Flight Computer — imaging missions in LEO and SSO.',
    pros: '32 GB Store-and-Forward buffer, 20 krad tolerance, low $0.15M price.',
    cons: 'Cannot survive multi-year MEO/GTO radiation belts.',
  },
  'OBC-SPACE': {
    where: 'Space-grade avionics processor — reliable 3–5 yr remote sensing campaigns.',
    pros: '50 krad tolerance and 128 GB onboard storage.',
    cons: '$1.5M cost and 8 W draw.',
  },
  'OBC-RADHARD': {
    where: 'Radiation-hardened Rad-Hard processor — mandatory for MEO, GTO, and GEO.',
    pros: 'Withstands 200 krad inside Van Allen belts without SEU lockups.',
    cons: '8 kg mass, 25 W draw, and $12M cost.',
  },

  // --- 9. ATTITUDE CONTROL (ADCS) ---
  'ADCS-MAG': {
    where: 'Magnetorquers + Sun Sensors — coarse orientation for particle/field probes.',
    pros: 'Cheap ($0.1M), light (0.2 kg), mechanically simple.',
    cons: 'Coarse +/-5.0 deg jitter — optical camera photos will BLUR beyond usability!',
  },
  'ADCS-WHEEL': {
    where: '3-Axis Reaction Wheels — built for CubeSat optical cameras like INS-01.',
    pros: 'Holds +/-1.0 deg pointing stability (meets INS-01 specs) for 1 kg and $0.6M.',
    cons: 'Too coarse for high-res multispectral (+/-0.1 deg) or GHG spectrometers.',
  },
  'ADCS-STAR': {
    where: 'Reaction Wheels + Star Tracker — precision pointing for multispectral, IR, and SAR.',
    pros: 'High +/-0.05 deg stability eliminates motion blur across Earth imagers.',
    cons: '6 kg mass, 15 W draw, $4.0M cost.',
  },
  'ADCS-FINE': {
    where: 'Fine-Pointing Star-Tracker Suite — built for GHG spectrometers and space telescopes.',
    pros: 'Sub-arcsecond +/-0.001 deg lock on targets.',
    cons: 'Heavy (30 kg), 60 W draw, $25M cost.',
  },
};

export function getPartInsight(slot, item) {
  if (!item) return null;
  if (PART_INSIGHTS[item.id]) return PART_INSIGHTS[item.id];
  return {
    where: item.description_simple || `Used for subsystem ${slot.toUpperCase()}.`,
    pros: `Meets nominal specifications for ${item.name || item.id}.`,
    cons: item.cost_musd > 50 ? 'High procurement cost and mass.' : 'Verify power and mass margin compatibility.',
  };
}

/**
 * 3 specialized pre-flight diagnostics (Phase 03.INSPECT):
 * 1. GAS_LEAK_AUDIO: Locate pressurant leak purely by proximity hiss audio.
 * 2. STRUCT_CRACK_XRAY: Toggle wireframe X-Ray Mesh to spot and weld yellow cracks.
 * 3. CAMERA_TILT_ALIGN: Drag optical mirror back to 0.0 deg alignment and hold steady.
 */
export const CHECKLIST_TEMPLATES = [
  {
    id: 'GAS_LEAK_AUDIO',
    kind: 'audio_leak',
    label: '1. GAS LEAK [AUDIO SCAN]',
    group: 'rocket',
    basePos: [-0.11, -0.28, 0.18],
    meter: 'pressureDiff',
    symptom: 'No visual clue! Sweep your pointer over the booster and listen for the loudest hiss peak, then click to seal.',
  },
  {
    id: 'STRUCT_CRACK_XRAY',
    kind: 'xray_crack',
    label: '2. STRUCTURAL CRACK [YELLOW X-RAY]',
    group: 'sat',
    basePos: [0.06, 0.56, 0.15],
    meter: 'structVib',
    symptom: 'Enable [X-RAY MESH] and click every jagged yellow weld crack (low-reliability rockets carry multiple cracks!).',
  },
  {
    id: 'CAMERA_TILT_ALIGN',
    kind: 'camera_align',
    label: '3. CAMERA MIRROR ALIGNMENT [0°]',
    group: 'sat',
    basePos: [0.0, 0.72, 0.16],
    meter: 'emiNoise',
    symptom: 'Optical mirror assembly is skewed with gear backlash — drag smoothly to 0.0 deg and hold steady until locked.',
  },
];

export function canEnterPhase(targetPhase, { currentPhase, launchResult, design, inspectReport, flightData, lifeData, outcome }) {
  if (currentPhase === 'launch' && !launchResult) return false;
  if (targetPhase === 'design' || targetPhase === 'inspect') return Boolean(design);
  if (targetPhase === 'launch') return Boolean(flightData && inspectReport);
  if (targetPhase === 'life') return Boolean(lifeData);
  if (targetPhase === 'review') return Boolean(outcome);
  return true;
}

export function resolvePresetDesign(presets, presetId, missionDetail) {
  if (presetId === 'starter' && missionDetail?.starter && typeof missionDetail.starter === 'object') {
    return {
      schema_version: 'design/1',
      mission: missionDetail.id || missionDetail.starter.mission,
      seed: missionDetail.hazards?.seed ?? missionDetail.starter.seed ?? 0,
      ...structuredClone(missionDetail.starter),
    };
  }
  const map = Object.fromEntries((presets || []).map((p) => [p.id, p]));
  const pick = (typeof presetId === 'string' && map[presetId]) || presets?.[0];
  if (!pick) {
    if (missionDetail?.starter && typeof missionDetail.starter === 'object') {
      return {
        schema_version: 'design/1',
        mission: missionDetail.id,
        seed: missionDetail.hazards?.seed ?? 0,
        ...structuredClone(missionDetail.starter),
      };
    }
    return null;
  }

  let base = pick.design ? structuredClone(pick.design) : null;
  if (!base && pick.from && map[pick.from]?.design) {
    base = structuredClone(map[pick.from].design);
    if (pick.swap) {
      Object.entries(pick.swap).forEach(([k, v]) => {
        base[k] = structuredClone(v);
      });
    }
  }
  if (!base) return null;
  return {
    schema_version: 'design/1',
    mission: missionDetail?.id || base.mission,
    seed: missionDetail?.hazards?.seed ?? 0,
    ...base,
  };
}

/** Computes 4 live telemetry bars (POWER, MASS, SIGNAL, INTEGRITY) for 02.BUILD. */
export function computeCoreBars(metrics, fitOk = true) {
  if (!metrics) return null;
  const loadW = Math.max(0.1, Number(metrics['power.load_w'] || 0));
  const marginW = Number(metrics['power.margin_w'] || 0);
  const pwrPct = Math.max(8, Math.min(100, ((marginW + loadW) / (loadW * 1.4)) * 100));
  const pwrStatus = marginW < 0 ? 'err' : marginW < loadW * 0.15 ? 'warn' : 'ok';

  const dryKg = Number(metrics['mass.dry_kg'] || 0);
  const capKg = Number(metrics['mass.capacity_kg'] || 0);
  const busLimit = Number(metrics['mass.bus_limit_kg'] || 1e9);
  const compat = Number(metrics['launch.compatible'] ?? 1) > 0.5;
  const effLimit = capKg > 0 ? Math.min(capKg, busLimit) : busLimit;
  const massOver = !fitOk || !compat || dryKg > effLimit;
  const massFrac = dryKg / Math.max(1, effLimit);
  const massPct = massOver ? 18 : Math.max(25, Math.min(100, (1.12 - massFrac) * 100));
  const massStatus = massOver ? 'err' : massFrac > 0.88 ? 'warn' : 'ok';

  const genGb = Math.max(0.01, Number(metrics['data.generated_gb_per_day'] || 0));
  const dlGb = Number(metrics['data.downlink_gb_per_day'] || 0);
  const dlRatio = Math.min(1, dlGb / genGb);
  const adcsDeg = Number(metrics['pointing.adcs_deg'] || 1);
  const reqDeg = Math.max(0.001, Number(metrics['pointing.required_deg'] || 1));
  const ptRatio = adcsDeg <= reqDeg ? 1 : Math.max(0.1, reqDeg / adcsDeg);
  const sigPct = Math.max(10, Math.min(100, (0.5 * dlRatio + 0.5 * ptRatio) * 100));
  const sigStatus = dlRatio < 0.85 || adcsDeg > reqDeg ? 'err' : dlRatio < 1.0 ? 'warn' : 'ok';

  const dose = Math.max(0.1, Number(metrics['radiation.dose_krad'] || 0));
  const tol = Number(metrics['radiation.tolerance_krad'] || 0);
  const radRatio = tol / dose;
  const lifeY = Number(metrics['lifetime.years'] || 0);
  const intPct = Math.max(10, Math.min(100, (Math.min(radRatio, 1.5) / 1.5) * 80 + Math.min(1, lifeY / 1.5) * 20));
  const intStatus = radRatio < 1.05 || lifeY < 0.8 ? 'err' : radRatio < 1.4 ? 'warn' : 'ok';

  return {
    power: { pct: pwrPct, status: pwrStatus, tag: `${marginW >= 0 ? '+' : ''}${marginW.toFixed(0)}W` },
    mass: {
      pct: massPct,
      status: massStatus,
      tag: !fitOk ? 'NO-FIT' : dryKg > busLimit ? 'BUS-OVER' : `${dryKg.toFixed(0)}kg`,
    },
    signal: {
      pct: sigPct,
      status: sigStatus,
      tag: dlRatio < 0.9 ? 'DL-LOW' : adcsDeg > reqDeg ? 'BLUR' : 'LOCK',
    },
    integrity: {
      pct: intPct,
      status: intStatus,
      tag: radRatio < 1 ? 'RAD-FAIL' : lifeY < 1 ? 'DECAY' : `${tol.toFixed(0)}krad`,
    },
  };
}

/**
 * Generates 3 deterministic-per-salt pre-flight inspection tasks for Phase 03.INSPECT.
 */
export function generateInspectionDefects(salt = Date.now(), design = null, catalog = null) {
  let state = (Math.floor(salt) ^ 0x9e3779b9) >>> 0;
  const rnd = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const firstInsId = design?.instruments?.[0] || 'INS-01';
  const insItem = catalog?.tables?.instruments?.[firstInsId];
  const tier = insItem?.tier || 'basic';
  let tiltMagnitude = 22;
  let mirrorIssue = '';
  if (tier === 'basic') {
    tiltMagnitude = Math.round(20 + rnd() * 8);
    mirrorIssue =
      'Basic Camera Tier: Mirror mount suffers from Gear Backlash and stiff spring return — drag firmly to 0.0 deg and hold steady or it springs out of alignment!';
  } else if (tier === 'advanced') {
    tiltMagnitude = Math.round(12 + rnd() * 5);
    mirrorIssue =
      'Advanced Camera Tier: Friction lock drifted during transit — pull smoothly to 0.0 deg and hold to engage detent.';
  } else {
    tiltMagnitude = Math.round(7 + rnd() * 5);
    mirrorIssue =
      'Expert Camera Tier: Minor optical axis offset — align cleanly to 0.0 deg to lock collar.';
  }
  const tiltSign = rnd() > 0.5 ? 1 : -1;
  const initialTiltDeg = tiltSign * tiltMagnitude;

  const lvId = design?.launch?.vehicle || 'LV-ELECTRON';
  const lvItem = catalog?.tables?.launch_vehicles?.[lvId];
  const lvRel = Number(lvItem?.reliability ?? 0.95);
  const lvCost = Number(lvItem?.cost_musd ?? 10);
  const isCheapRocket = lvRel < 0.96 || lvCost <= 40 || lvId === 'LV-ELECTRON' || lvId === 'LV-VEGAC' || lvId === 'LV-H3-24L';
  const crackCount = isCheapRocket ? (rnd() > 0.45 ? 3 : 2) : 1;

  const cracks = [];
  for (let i = 0; i < crackCount; i++) {
    const inPayload = crackCount === 1 ? rnd() > 0.45 : i === crackCount - 1;
    const cy = inPayload ? -0.08 + rnd() * 0.34 : -0.68 + (i * 0.42 + rnd() * 0.28);
    const cx = (rnd() - 0.5) * 0.16;
    cracks.push({
      subId: `CRACK_${i + 1}`,
      mode: inPayload ? 'payload' : 'stack',
      pos: [cx, cy, 0.19],
      seed: Math.floor(rnd() * 10000),
    });
  }

  const leakY = -0.6 + rnd() * 0.75;
  const leakX = (rnd() - 0.5) * 0.14;

  return [
    {
      ...CHECKLIST_TEMPLATES[0],
      requiredMode: 'stack',
      pos: [leakX, leakY, 0.18],
    },
    {
      ...CHECKLIST_TEMPLATES[1],
      isCheapRocket,
      rocketName: lvItem?.name || lvId,
      cracks,
      hiddenInPayload: cracks.some((c) => c.mode === 'payload'),
      pos: cracks[0].pos,
    },
    {
      ...CHECKLIST_TEMPLATES[2],
      requiredMode: 'payload',
      initialTiltDeg,
      cameraName: insItem?.name || firstInsId,
      cameraTier: tier,
      mirrorIssue,
      pos: [0.0, 0.18, 0.2],
    },
  ];
}

/** Evaluates consequences when leaving Phase 03.INSPECT. */
export function evaluateInspectionOutcome(defects, fixedIds) {
  const unfixed = (defects || []).filter((d) => !fixedIds.includes(d.id));
  if (unfixed.length === 0) {
    return { mode: 'clean', unfixed: [], flightFailure: null, orbitFault: null };
  }
  const hasRocketFault = unfixed.some((d) => d.id === 'GAS_LEAK_AUDIO' || (d.id === 'STRUCT_CRACK_XRAY' && !d.hiddenInPayload));
  if (unfixed.length >= 2 || hasRocketFault) {
    const shortName = (label) => String(label || '').replace(/^\d+\.\s*/, '').replace(/\s*\[[^\]]*\]\s*$/, '');
    const names = unfixed.map((d) => shortName(d.label)).join(', ');
    return {
      mode: 'launch_explode',
      unfixed,
      flightFailure: {
        kind: 'inspection_catastrophe',
        t: 26.0,
        explode: true,
        constraint: 'inspection',
        title: {
          en: `VEHICLE EXPLOSION: MISSED PRE-FLIGHT DEFECTS (${names})`,
          vi: `VEHICLE EXPLOSION: MISSED PRE-FLIGHT DEFECTS (${names})`,
        },
        cause: {
          en: `Pre-flight inspection missed critical hardware defects (${names}). The stack suffered catastrophic failure in flight.`,
          vi: `Pre-flight inspection missed critical hardware defects (${names}). The stack suffered catastrophic failure in flight.`,
        },
        numbers: unfixed.map((d) => ({ label: shortName(d.label), value: 'UNFIXED' })),
      },
      orbitFault: null,
    };
  }
  return {
    mode: 'orbit_early_fail',
    unfixed,
    flightFailure: null,
    orbitFault: unfixed[0],
  };
}
