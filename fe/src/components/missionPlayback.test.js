import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMissionTime, evidenceAtTime } from './missionPlayback.js';

test('accelerated clock stops at capture, contact and fractional delivery times', () => {
  const report = { events: [{ t_s: 1200 }, { t_s: 1863.5 }], samples: [{ t_s: 1800, state: 'TRANSMITTING' }, { t_s: 1860, state: 'TRANSMITTING' }] };
  let now = 0;
  const times = [];
  while (now < 2500) { now = nextMissionTime(report, now, 2500); times.push(now); }
  assert.deepEqual(times, [1200, 1800, 1860, 1863.5, 2500]);
});

test('no photos before capture, no received photo before complete downlink or after campaign failure', () => {
  const shots = [{ t_s: 100, delivered_t_s: 200, delivered_k: 1 }, { t_s: 120, delivered_t_s: 300, delivered_k: null }];
  assert.equal(evidenceAtTime(shots, 99).length, 0);
  assert.equal(evidenceAtTime(shots, 199)[0].received, false);
  assert.equal(evidenceAtTime(shots, 200)[0].received, true);
  assert.equal(evidenceAtTime(shots, 400)[1].received, false);
});

test('quiet arcs accelerate and playback stops at mission cutoff', () => {
  assert.equal(nextMissionTime({ events: [], samples: [] }, 0, 5000), 1800);
  assert.equal(nextMissionTime({ events: [{ t_s: 6000 }], samples: [] }, 4900, 5000), 5000);
});
