import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nextMissionTime,
  evidenceAtTime,
  canShowOrbitalTimes,
  createOrbitalTimesGate,
} from './missionPlayback.js';

test('accelerated clock stops at capture, contact and fractional delivery times', () => {
  const report = { events: [{ t_s: 1200 }, { t_s: 1863.5 }], samples: [{ t_s: 1800, state: 'TRANSMITTING' }, { t_s: 1860, state: 'TRANSMITTING' }] };
  let now = 0;
  const times = [];
  while (now < 2500) { now = nextMissionTime(report, now, 2500); times.push(now); }
  assert.deepEqual(times, [1200, 1800, 1860, 1863.5, 2500]);
});

test('no photos before capture, no received photo before complete downlink or after campaign failure', () => {
  const shots = [
    { t_s: 100, delivered_t_s: 200, delivered_k: 1, remaining_gb: 0 },
    { t_s: 120, delivered_t_s: 300, delivered_k: null, remaining_gb: 0.05 },
  ];
  assert.equal(evidenceAtTime(shots, 99).length, 0);
  assert.equal(evidenceAtTime(shots, 199)[0].received, false);
  assert.equal(evidenceAtTime(shots, 200)[0].received, true);
  assert.equal(evidenceAtTime(shots, 400)[1].received, false);
});

test('quiet arcs accelerate and playback stops at mission cutoff', () => {
  assert.equal(nextMissionTime({ events: [], samples: [] }, 0, 5000), 1800);
  assert.equal(nextMissionTime({ events: [{ t_s: 6000 }], samples: [] }, 4900, 5000), 5000);
});

function makeValidWildfireSuccess() {
  const packets = [1, 2, 3].map((n) => ({
    n,
    k: n,
    t_s: n * 1000,
    delivered_k: n + 1,
    delivered_t_s: n * 1000 + 400,
    remaining_gb: 0,
    blur: 0.05,
  }));
  return {
    missionId: 'MP-SC01-FIRST-EYES',
    launchResult: { success: true, failure: null },
    flightData: { meta: { reaches_orbit: true }, failure: null },
    outcome: {
      missionId: 'MP-SC01-FIRST-EYES',
      alive: true,
      success: true,
      evidence_usable: 3,
      evidence_total: 3,
      review_fail: [],
    },
    lifeData: {
      evidence_need: 3,
      imaging: { theme: 'wildfire', sensor: 'imager_rgb' },
      evidence: packets,
      outcome: {
        alive: true,
        success: true,
        evidence_usable: 3,
        evidence_total: 3,
        review_fail: [],
      },
      communications: {
        windows: [{ start_s: 1200, end_s: 1600, sent_gb: 0.3 }],
        evidence: packets,
        summary: {
          captured: 3,
          delivered: 3,
          pending: 0,
          sent_gb: 0.3,
          usable_min: 18.0,
        },
      },
    },
  };
}

test('Orbital Times regression: orbit achieved but no images captured -> no newspaper', () => {
  const ctx = makeValidWildfireSuccess();
  ctx.outcome.success = false;
  ctx.outcome.evidence_usable = 0;
  ctx.lifeData.outcome.success = false;
  ctx.lifeData.outcome.evidence_usable = 0;
  ctx.lifeData.evidence = [];
  ctx.lifeData.communications.evidence = [];
  ctx.lifeData.communications.summary.captured = 0;
  ctx.lifeData.communications.summary.delivered = 0;
  assert.equal(canShowOrbitalTimes(ctx), false);
});

test('Orbital Times regression: images captured and stored onboard but no downlink -> no newspaper', () => {
  const ctx = makeValidWildfireSuccess();
  const undelivered = [1, 2, 3].map((n) => ({
    n,
    k: n,
    t_s: n * 1000,
    delivered_k: null,
    delivered_t_s: null,
    remaining_gb: 0.1,
    blur: 0.05,
  }));
  ctx.outcome.success = false;
  ctx.outcome.evidence_usable = 0;
  ctx.lifeData.outcome.success = false;
  ctx.lifeData.outcome.evidence_usable = 0;
  ctx.lifeData.evidence = undelivered;
  ctx.lifeData.communications.evidence = undelivered;
  ctx.lifeData.communications.windows = [];
  ctx.lifeData.communications.summary = {
    captured: 3,
    delivered: 0,
    pending: 3,
    sent_gb: 0,
    usable_min: 0,
  };
  assert.equal(canShowOrbitalTimes(ctx), false);
});

test('Orbital Times regression: partial required delivery (2 complete, 1 partial) -> no newspaper', () => {
  const ctx = makeValidWildfireSuccess();
  ctx.lifeData.evidence[2] = {
    ...ctx.lifeData.evidence[2],
    delivered_k: null,
    delivered_t_s: null,
    remaining_gb: 0.04,
  };
  ctx.lifeData.communications.evidence[2] = ctx.lifeData.evidence[2];
  ctx.lifeData.communications.summary.delivered = 2;
  ctx.lifeData.communications.summary.pending = 1;
  ctx.outcome.evidence_usable = 2;
  ctx.lifeData.outcome.evidence_usable = 2;
  assert.equal(canShowOrbitalTimes(ctx), false);
});

test('Orbital Times regression: full required delivery and valid success -> newspaper appears once, resets on restart/switch, ignores duplicates', () => {
  const gate = createOrbitalTimesGate();
  const ctx = { ...makeValidWildfireSuccess(), runKey: 'run-1' };

  assert.equal(canShowOrbitalTimes(ctx), true);
  // First check triggers
  assert.equal(gate.shouldShow(ctx), true);
  // Late or duplicate backend update for the same run -> no duplicate trigger
  assert.equal(gate.shouldShow(ctx), false);

  // Mission restart resets gate
  gate.reset('MP-SC01-FIRST-EYES');
  assert.equal(gate.isShownFor('MP-SC01-FIRST-EYES', 'run-1'), false);

  // Switching mission does not preserve stale completion state
  const staleSwitch = {
    ...ctx,
    missionId: 'MP-SC03-SPACE-WEATHER',
  };
  assert.equal(canShowOrbitalTimes(staleSwitch), false);
});
