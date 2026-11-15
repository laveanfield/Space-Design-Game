/**
 * Interactive dialogue scripts: Lead Engineer (YOU) <-> Finance Director (Director Penny-Pincher).
 * Players can challenge budget/schedule cuts in pre-launch comm-links, setting up confrontation evidence in 06.REVIEW.
 */

export const CAST = {
  eng: { name: 'LEAD ENGINEER (YOU)', side: 'left' },
  boss: { name: 'FINANCE DIRECTOR', side: 'right' },
};

const INTRO = {
  'MP-SC01-FIRST-EYES': [
    {
      who: 'boss',
      text: 'Wildfire season is breaking out and rescue teams demand orbital imagery. We only have ${budget}M and a strict {deadline}-month deadline — slap cheap surplus parts together and launch it!',
      choices: [
        {
          tag: 'DEMAND S-BAND RADIO',
          text: 'Director, surplus UHF radio has almost zero bandwidth! Even if the camera captures fires, frames will bottleneck in orbit and never reach Earth.',
          stamp: 'RADIO UPGRADE DENIED',
          bossReply: 'Radio is radio! There is zero extra money for S-Band hardware — make it work inside ${budget}M!',
          engNote: '(He waved it off. Let’s evaluate the real link budget in the workshop — or gather flight evidence to force his hand.)',
        },
        {
          tag: 'WARN: 142,000 HA AT RISK',
          text: 'If the spacecraft loses downlink during the critical first 72 hours, 142,000 hectares of forest and 38,500 residents face disaster!',
          stamp: 'RISK WARNING OVERRIDDEN',
          bossReply: 'Spare me the wildfire speeches to pad your budget! The board capped us at ${budget}M — hit the milestone so I make my quarterly bonus!',
          engNote: '(Reasoning with accounting goes nowhere. Only hard telemetry or flight failure will move him.)',
        },
        {
          tag: 'REQUEST SOLAR & WHEELS',
          text: 'Sir, we need deployable solar panels and ADCS reaction wheels; otherwise eclipse brownouts and pointing blur will ruin every image.',
          stamp: 'CAP LOCKED AT ${budget}M',
          bossReply: 'Reaction wheels cost too much! Bolt on cheap magnetorquers as long as it clears the pad inside {deadline} months for press day!',
          engNote: '(Every upgrade was stamped rejected. The technical responsibility sits squarely in our build bay.)',
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    {
      who: 'boss',
      text: 'Space Weather Sentinel at MEO-20200. High orbit, expensive — I know. But ${budget}M and {deadline} months are non-negotiable!',
      choices: [
        {
          tag: 'DEMAND RAD-HARD OBC',
          text: 'MEO-20200 sits straight inside the Van Allen radiation belts! Standard non-hardened chips will suffer proton latch-ups and crash!',
          stamp: 'OBC-RADHARD REJECTED',
          bossReply: 'Space is empty vacuum — quit inventing hazards! Put the cheapest computer onboard and never cross ${budget}M!',
          engNote: '(He brushed aside the Van Allen belts. In the bay we will have to solve the radiation vs budget squeeze ourselves.)',
        },
        {
          tag: 'WARN: G5 GRID BLACKOUT',
          text: 'Director, if the sentinel goes dark during a G5 storm, 6.4 million households lose winter power and 340 polar flights lose GPS!',
          stamp: 'STORM FORECAST DISMISSED',
          bossReply: 'Once-a-century storms can wait until next quarter! Launch inside {deadline} months — end of discussion!',
          engNote: '(Dismissed flat out. Once we reach MEO, high-energy protons will not care about his ledger.)',
        },
        {
          tag: 'REQUEST DEADLINE BUFFER',
          text: 'Radiation-hardened components have lead times beyond {deadline} months; rushing integration cuts pre-flight inspection time!',
          stamp: 'DEADLINE HELD AT {deadline} MO',
          bossReply: 'Broadcast cameras are already booked! Slip one month and your pre-launch inspection clock gets docked automatically!',
          engNote: '(Schedule locked. Late procurement will directly cut our inspection timer in 03.INSPECT.)',
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    {
      who: 'boss',
      text: 'Greenhouse Gas Monitor — international climate summit eyes are watching. You get ${budget}M and exactly {deadline} months. Do not embarrass me!',
      choices: [
        {
          tag: 'REQUEST FINE POINTING',
          text: 'Measuring methane plumes from 600 km requires sub-arcsecond ADCS-FINE dwell stability and high-speed optical downlink, or data turns to noise!',
          stamp: 'PRECISION HARDWARE DENIED',
          bossReply: 'Save the arcsecond lectures! Deliver spectra for the summit inside ${budget}M and {deadline} months!',
          engNote: '(Management still ignores orbital physics. We have to balance pointing, power, and schedule in the workshop.)',
        },
        {
          tag: 'WARN: 850,000 FARMERS',
          text: 'If spectrometer scans blur, 1.8M tons of methane leaks will go unverified, driving drought and crop collapse for 850,000 farmers!',
          stamp: 'CLIMATE PLEA OVERRIDDEN',
          bossReply: 'Harvest forecasts belong to Agriculture — my job is keeping this quarter’s balance sheet in the black!',
          engNote: '(Humanitarian arguments bounced off. Only precision engineering in 02.BUILD can save the mission.)',
        },
        {
          tag: 'UPGRADE POWER MARGIN',
          text: 'The SWIR spectrometer draws massive power; undersized solar arrays will trigger eclipse brownouts over target industrial regions!',
          stamp: 'POWER UPGRADE REJECTED',
          bossReply: 'The sun shines in space all day — stop making excuses to overspend my ${budget}M cap!',
          engNote: '(He forgot orbital eclipses exist. Let’s run the full power balance carefully.)',
        },
      ],
    },
  ],
};

const LAUNCH_FAIL_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    { who: 'boss', text: 'What just blew up on the pad?! ${cost}M of wildfire relief funding just vanished into smoke!' },
    { who: 'eng', text: 'Report: {failure}. Without orbital insertion, 142,000 ha of forest have zero early thermal warning this dry season.' },
    {
      who: 'boss',
      text: 'Spare me the report. Your reputation bar is down to {rep} — fix it immediately!',
      choices: [
        {
          tag: 'REQUEST LAUNCH BUDGET',
          text: 'Payload mass needs a capable booster and bus structure! Under your ${budget}M cap, margins are razor-thin!',
          stamp: 'EXTRA FUNDS DENIED',
          bossReply: 'Reach orbit with telemetry first before asking for another dime! Fix your mass budget and pre-flight defects back in the bay!',
          engNote: '(No extra cash until we clear launch. Back to 02.BUILD and 03.INSPECT.)',
        },
        {
          tag: 'OWN ENGINEERING RECOVERY',
          text: 'Understood. I will re-check structural load envelopes, fairing fit, and complete 3/3 inspection fixes before the next countdown.',
          stamp: 'REPUTATION PENALTY (-1)',
          bossReply: 'Move fast! You have {rep} reputation left — one more fireball and someone else takes your console!',
          engNote: '(Back to 02.BUILD to verify mass limits and ascent clearances.)',
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'boss', text: '${cost}M straight into the ocean! I just briefed the press on our Solar Storm Sentinel!' },
    { who: 'eng', text: 'Report: {failure}. Without a sentinel in MEO, 6.4M households and 340 polar flights remain blind to G5 storms.' },
    {
      who: 'boss',
      text: 'Do not quote civilian metrics at me. You are down to {rep} reputation!',
      choices: [
        {
          tag: 'REQUEST HEAVY BOOSTER',
          text: 'MEO-20200 demands huge delta-v; under this budget cap the launch stack lacks lift capacity or structural margin!',
          stamp: 'BOOSTER UPGRADE DENIED',
          bossReply: 'Until a satellite actually reaches orbit and records a documented fault there, the budget stays locked at ${budget}M!',
          engNote: '(We have to achieve valid MEO insertion first.)',
        },
        {
          tag: 'REVIEW MASS & INSPECTION',
          text: 'I will audit upper-stage mass limits, orbital inclination fit, and verify all 3 inspection fixes before ignition.',
          stamp: 'REPUTATION LOGGED: {rep} LEFT',
          bossReply: 'Get it right — the board’s patience is running out!',
          engNote: '(Returning to integration bay to tune launch vehicle and inspection.)',
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    { who: 'boss', text: 'Another ${cost}M lost on ascent! The climate summit delegates are breathing down my neck!' },
    { who: 'eng', text: 'Report: {failure}. Our methane spectrometer never reached SSO-600 — 850,000 farmers remain without emission accountability.' },
    {
      who: 'boss',
      text: 'Build another stack now. Your reputation is down to {rep}!',
      choices: [
        {
          tag: 'REQUEST BOOSTER MARGIN',
          text: 'The GHG spectrometer is heavy; we need proper bus margin and an SSO-capable launch vehicle!',
          stamp: 'EMERGENCY FUNDS DENIED',
          bossReply: 'Rockets exploding in the lower atmosphere do not win board approvals! Re-balance mass and re-inspect before launch!',
          engNote: '(He still guards the safe. We need a clean ascent first.)',
        },
        {
          tag: 'COMMIT TO CLEAN ASCENT',
          text: 'Copy. I will re-balance payload mass margins and clear every inspection fault prior to liftoff.',
          stamp: 'FINAL WARNING // {rep} LEFT',
          bossReply: 'I do not want to see another plume of black smoke on telemetry!',
          engNote: '(Head back to 02.BUILD to verify flight margins.)',
        },
      ],
    },
  ],
};

const REVIEW_OK_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    { who: 'eng', text: '{evidence} clear wildfire evidence frames verified at ground stations. Fire crews saved 142,000 ha of forest and protected 38,500 residents!' },
    { who: 'boss', text: 'Magnificent! Press is praising my program management! I knew letting my team hustle would pay off!' },
    { who: 'eng', text: '(Not luck — adequate downlink bandwidth, positive power, and steady pointing.)' },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'eng', text: 'The MEO sentinel held firm through peak proton flux and issued an 18-hour warning: 6.4M homes kept power and 340 polar flights diverted safely!' },
    { who: 'boss', text: 'Saved my neck with the board! Looks like those radiation-hardened parts earned their price tag after all.' },
    { who: 'eng', text: '(Inside the Van Allen belts, only true flight-grade radiation hardening keeps civilization safe.)' },
  ],
  'MP-SC04-GHG': [
    { who: 'eng', text: 'The spectrometer pinpointed 27 methane super-emitters! 1.8M tons of CH4 leaks halted, protecting 2.3M ha of farmland and 850,000 farmers!' },
    { who: 'boss', text: 'The Climate Commission just called to congratulate me! Front-page glory!' },
    { who: 'eng', text: '(Sub-arcsecond discipline in orbit delivered accountability on Earth.)' },
  ],
};

const REVIEW_FAIL_BY_MISSION = {
  'MP-SC01-FIRST-EYES': [
    { who: 'boss', text: 'The spacecraft reached orbit — why did ground control never receive the wildfire photos?! Explain yourself!' },
    { who: 'eng', text: 'Root cause: {failure}. Blind communications across the golden 72 hours cost 142,000 ha of forest and forced 38,500 residents to flee.' },
    {
      who: 'boss',
      text: 'I cut corners here and there, sure — aren’t you still at fault?! You have {rep} reputation left. Show me the file!',
      choices: [
        {
          tag: 'CONFRONT BUDGET CUTS',
          text: 'From day one I warned your ${budget}M cap and cheap surplus parts would choke downlink and power — and you stamped it rejected!',
          stamp: 'VERBAL CLAIM REJECTED // SHOW PROOF',
          bossReply: 'Words mean nothing! Open 06.REVIEW and match the exact technical failure card to my budget log if you want emergency funding unlocked!',
          engNote: '(Right! We have telemetry proof — present the matching root-cause evidence card in 06.REVIEW!)',
        },
        {
          tag: 'DEMAND S-BAND UNLOCK',
          text: 'To protect next season, you must unlock budget for S-Band communications and power upgrades immediately!',
          stamp: 'AUTO-UNLOCK DENIED',
          bossReply: 'Want the safe opened? Prove in Boss Confrontation at 06.REVIEW that my cuts directly triggered that failure!',
          engNote: '(Take the evidence straight into BOSS CONFRONTATION at 06.REVIEW!)',
        },
      ],
    },
  ],
  'MP-SC03-SPACE-WEATHER': [
    { who: 'boss', text: 'We made it all the way to MEO and still failed to warn the northern grid before the storm?!' },
    { who: 'eng', text: 'Root cause: {failure}. High-energy particles fried the cheap non-hardened computer you insisted on — 6.4M homes lost power.' },
    {
      who: 'boss',
      text: 'Don’t pin everything on me! Reputation is {rep} — lay the technical proof on my desk!',
      choices: [
        {
          tag: 'CITE VAN ALLEN WARNING',
          text: 'I explicitly warned that commercial avionics at MEO-20200 would latch up, yet you rejected OBC-RADHARD!',
          stamp: 'VOICE CLAIM DENIED',
          bossReply: 'The board needs documented correlation! Present the radiation failure card against my ledger in 06.REVIEW first!',
          engNote: '(He is out of excuses. Match the evidence card in 06.REVIEW!)',
        },
        {
          tag: 'DEMAND RAD-HARD FUNDING',
          text: 'Unlock emergency funds for OBC-RADHARD and extend the build schedule immediately!',
          stamp: 'WAIVER DENIED',
          bossReply: 'No verbal favors! Submit matching failure evidence in Boss Confrontation below!',
          engNote: '(Time for direct confrontation in 06.REVIEW.)',
        },
      ],
    },
  ],
  'MP-SC04-GHG': [
    { who: 'boss', text: 'The Climate Commission just threw out our entire methane dataset! Tens of millions wasted!' },
    { who: 'eng', text: 'Root cause: {failure}. We missed 1.8M tons of methane leaks, pushing 2.3M ha of delta farmland and 850,000 farmers into drought.' },
    {
      who: 'boss',
      text: 'Don’t wave harvest numbers at me! Reputation left: {rep} — present the audit report!',
      choices: [
        {
          tag: 'INDICT SCHEDULE & CAP',
          text: 'Your ${budget}M cap and {deadline}-month crunch blocked ADCS-FINE and optical downlink from day one!',
          stamp: 'ACCUSATION OVERRIDDEN',
          bossReply: 'Blame won’t clear an audit! Prove which constraint broke the mission in 06.REVIEW before asking to unlock budget!',
          engNote: '(Match the telemetry failure card to his cut-rate directive in 06.REVIEW.)',
        },
        {
          tag: 'REQUEST FULL SPEC REFLY',
          text: 'Lift the cost and schedule ceiling so we can fly proper fine-pointing and high-rate downlink!',
          stamp: 'IMMEDIATE UNLOCK DENIED',
          bossReply: 'Only when you prove my directive caused the bottleneck in Boss Confrontation will I sign an amendment!',
          engNote: '(Proceed to 06.REVIEW for direct confrontation.)',
        },
      ],
    },
  ],
};

export const SCENES = {
  intro: (ctx) => INTRO[ctx.mission] || [
    {
      who: 'boss',
      text: 'New mission: ${budget}M cap, {deadline}-month deadline. Execute.',
      choices: [
        {
          tag: 'REQUEST MARGIN',
          text: 'With ${budget}M and {deadline} months, technical margin is dangerously thin — please authorize a buffer.',
          stamp: 'REQUEST DENIED',
          bossReply: 'Zero buffer! Work inside ${budget}M and {deadline} months and own the design!',
          engNote: '(Copy. Engineering margins will be verified directly in the build bay.)',
        },
        {
          tag: 'ACCEPT ASSIGNMENT',
          text: 'Understood. I will validate every physical limit directly against simulation telemetry.',
          stamp: 'CAP LOCKED AT ${budget}M',
          bossReply: 'Good — do not keep the launch team waiting!',
          engNote: '(Entering Integration Bay 02.BUILD.)',
        },
      ],
    },
  ],
  prelaunch: () => [
    {
      who: 'boss',
      text: 'Integration wrapped? Press crews are waiting outside the fence. Launch now!',
      choices: [
        {
          tag: 'FINAL RISK WARNING',
          text: 'Director, warning flags remain active; flying a marginal configuration risks total loss in flight.',
          stamp: 'HOLD REJECTED // LAUNCH ORDERED',
          bossReply: 'Cameras are rolling live! Zero holds allowed — start terminal countdown now!',
          engNote: '(From ignition onward, physics takes total control.)',
        },
        {
          tag: 'CLEAR FOR IGNITION',
          text: 'Inspection dossier locked. Handing ignition sequence over to launch control now.',
          stamp: 'LAUNCH AUTHORIZED',
          bossReply: 'Light the engines! I want to see telemetry climb!',
          engNote: '(Initiating 3D ascent simulation.)',
        },
      ],
    },
  ],
  launch_fail: (ctx) => LAUNCH_FAIL_BY_MISSION[ctx.mission] || [
    { who: 'boss', text: 'What exploded on the pad?! ${cost}M gone in seconds!' },
    { who: 'eng', text: 'Report: {failure}. Telemetry dossier is ready.' },
    { who: 'boss', text: 'Keep your notes. You have {rep} reputation left.' },
  ],
  abort_scrub: () => [
    { who: 'boss', text: 'Scrubbed?! Do you have any idea what recycling a launch pad costs?!' },
    { who: 'eng', text: 'I take responsibility. Better a pad scrub than losing the entire spacecraft.' },
    { who: 'boss', text: 'Noted in your permanent file. Reputation left: {rep}.' },
  ],
  abort_fts: () => [
    { who: 'boss', text: 'You hit Range Safety destruct on my launch vehicle?!' },
    { who: 'eng', text: 'Flight Termination System fired per safety protocol. Zero casualties downrange.' },
    { who: 'boss', text: 'The rocket is gone. You have {rep} reputation left.' },
  ],
  review_ok: (ctx) => REVIEW_OK_BY_MISSION[ctx.mission] || [
    { who: 'eng', text: '{evidence} clear evidence frames confirmed on Earth. Mission objectives 100% met.' },
    { who: 'boss', text: 'Outstanding! Press is going to love this.' },
    { who: 'eng', text: '(Not luck — sound engineering from build to downlink.)' },
  ],
  review_fail: (ctx) => REVIEW_FAIL_BY_MISSION[ctx.mission] || [
    { who: 'boss', text: 'We reached orbit and still failed to deliver mission evidence? Explain!' },
    { who: 'eng', text: 'Root cause: {failure}.' },
    { who: 'boss', text: 'Excuses do not fix telemetry. Reputation left: {rep}.' },
  ],
  fired: () => [
    { who: 'boss', text: 'Enough. Program canceled — the board is reassigning command.' },
    { who: 'eng', text: '(The mission logbook remains. Next cycle we rebuild properly.)' },
  ],
};

/** Substitutes {var} tokens inside script strings. */
export function fill(text, ctx) {
  return String(text || '').replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? String(ctx[k]) : `{${k}}`));
}
