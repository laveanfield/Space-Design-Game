import { getSharedAudioCtx } from './client';

/**
 * Gentle procedural ambient space theme ("Orbital Watch") using Web Audio API.
 * - Warm analog pad + felt electric-piano arpeggios + soft starlight chimes
 * - Soft stereo delay reverb tail, zero external audio downloads
 * - Smooth fade in/out on AUDIO toggle and automatic ducking during launch/boss scenes
 */

const BAR_SEC = 3.8; // ~63 BPM, 4 beats per bar -> calm, unhurried pace
const BEAT_SEC = BAR_SEC / 4;

// 8-bar peaceful space progression (frequencies in Hz):
// Cmaj9 -> Am9 -> Fmaj9 -> G6 -> Em7 -> Am9 -> Dm9 -> G13sus4
const PROGRESSION = [
  { pad: [130.81, 196.0, 246.94, 293.66], arp: [261.63, 329.63, 392.0, 493.88, 587.33, 493.88, 392.0, 329.63], bell: 783.99 },
  { pad: [110.0, 164.81, 220.0, 246.94], arp: [220.0, 261.63, 329.63, 392.0, 493.88, 392.0, 329.63, 261.63], bell: 659.25 },
  { pad: [87.31, 130.81, 174.61, 220.0], arp: [174.61, 220.0, 261.63, 329.63, 392.0, 329.63, 261.63, 220.0], bell: 523.25 },
  { pad: [98.0, 146.83, 196.0, 246.94], arp: [196.0, 246.94, 293.66, 329.63, 392.0, 329.63, 293.66, 246.94], bell: 587.33 },
  { pad: [82.41, 123.47, 164.81, 196.0], arp: [164.81, 246.94, 293.66, 392.0, 493.88, 392.0, 293.66, 246.94], bell: 783.99 },
  { pad: [110.0, 164.81, 220.0, 261.63], arp: [220.0, 293.66, 329.63, 440.0, 523.25, 440.0, 329.63, 261.63], bell: 659.25 },
  { pad: [73.42, 110.0, 174.61, 220.0], arp: [174.61, 220.0, 261.63, 329.63, 349.23, 329.63, 261.63, 220.0], bell: 523.25 },
  { pad: [98.0, 146.83, 196.0, 220.0], arp: [196.0, 261.63, 293.66, 329.63, 392.0, 329.63, 293.66, 246.94], bell: 587.33 },
];

const state = {
  initialized: false,
  enabled: true,
  ducked: false,
  running: false,
  ctx: null,
  masterGain: null,
  duckGain: null,
  dryBus: null,
  wetBus: null,
  barIndex: 0,
  nextBarTime: 0,
  timerId: null,
  unlockAttached: false,
};

function ensureGraph() {
  if (state.initialized) return true;
  const ctx = getSharedAudioCtx();
  if (!ctx) return false;
  state.ctx = ctx;

  const master = ctx.createGain();
  master.gain.value = state.enabled ? 0.52 : 0;

  const duck = ctx.createGain();
  duck.gain.value = state.ducked ? 0.32 : 1.0;

  const dry = ctx.createGain();
  dry.gain.value = 0.82;

  const wet = ctx.createGain();
  wet.gain.value = 0.36;

  // Soft stereo-style echo tail
  const delay1 = ctx.createDelay(1.0);
  delay1.delayTime.value = 0.38;
  const delay2 = ctx.createDelay(1.0);
  delay2.delayTime.value = 0.56;
  const fb = ctx.createGain();
  fb.gain.value = 0.28;
  const wetLp = ctx.createBiquadFilter();
  wetLp.type = 'lowpass';
  wetLp.frequency.value = 1150;

  wet.connect(delay1);
  delay1.connect(delay2);
  delay2.connect(wetLp);
  wetLp.connect(fb);
  fb.connect(delay1);
  wetLp.connect(duck);

  dry.connect(duck);
  duck.connect(master);
  master.connect(ctx.destination);

  state.masterGain = master;
  state.duckGain = duck;
  state.dryBus = dry;
  state.wetBus = wet;
  state.initialized = true;
  return true;
}

function playPadChord(freqs, startTime, duration) {
  const { ctx, dryBus, wetBus } = state;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(280, startTime);
  lp.frequency.linearRampToValueAtTime(520, startTime + duration * 0.55);
  lp.frequency.linearRampToValueAtTime(260, startTime + duration);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startTime);
  env.gain.linearRampToValueAtTime(0.055, startTime + duration * 0.38);
  env.gain.linearRampToValueAtTime(0.042, startTime + duration * 0.72);
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.4);

  lp.connect(env);
  env.connect(dryBus);
  env.connect(wetBus);

  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(f, startTime);
    osc.detune.setValueAtTime(idx % 2 === 0 ? -4 : 4, startTime);
    osc.connect(lp);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.45);
  });
}

function playFeltNote(freq, startTime, duration = 2.4, peak = 0.045) {
  const { ctx, dryBus, wetBus } = state;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1400, startTime);
  lp.frequency.exponentialRampToValueAtTime(420, startTime + duration);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startTime);
  env.gain.linearRampToValueAtTime(peak, startTime + 0.025);
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  lp.connect(env);
  env.connect(dryBus);
  env.connect(wetBus);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);
  osc1.connect(lp);
  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.05);

  // Warm soft 2nd harmonic
  const osc2 = ctx.createOscillator();
  const h2Gain = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, startTime);
  h2Gain.gain.value = 0.16;
  osc2.connect(h2Gain);
  h2Gain.connect(lp);
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.05);
}

function playStarBell(freq, startTime) {
  const { ctx, wetBus } = state;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startTime);
  env.gain.linearRampToValueAtTime(0.018, startTime + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + 3.2);
  env.connect(wetBus);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);
  osc.connect(env);
  osc.start(startTime);
  osc.stop(startTime + 3.25);
}

function scheduleNextBar() {
  if (!state.running || !state.enabled || !state.ctx) return;
  const ctx = state.ctx;
  if (ctx.state === 'suspended') return;

  const lookAhead = 0.6;
  while (state.nextBarTime < ctx.currentTime + lookAhead) {
    const chord = PROGRESSION[state.barIndex % PROGRESSION.length];
    const t0 = Math.max(ctx.currentTime + 0.05, state.nextBarTime);

    playPadChord(chord.pad, t0, BAR_SEC);

    // 8 gentle eighth-note felt-piano steps per bar
    const stepSec = BEAT_SEC / 2;
    chord.arp.forEach((note, stepIdx) => {
      // Leave subtle breathing room on step 6
      if (stepIdx === 6 && state.barIndex % 2 === 1) return;
      const accent = stepIdx === 0 || stepIdx === 4 ? 0.044 : 0.03;
      playFeltNote(note, t0 + stepIdx * stepSec, 2.2, accent);
    });

    // Delicate starlight bell every 2 bars
    if (state.barIndex % 2 === 0) {
      playStarBell(chord.bell, t0 + BEAT_SEC * 2.5);
    }

    state.nextBarTime = t0 + BAR_SEC;
    state.barIndex = (state.barIndex + 1) % PROGRESSION.length;
  }
}

function startScheduler() {
  if (state.running) return;
  if (!ensureGraph()) return;
  state.running = true;
  state.nextBarTime = state.ctx.currentTime + 0.08;
  scheduleNextBar();
  state.timerId = window.setInterval(scheduleNextBar, 400);
}

function stopScheduler() {
  state.running = false;
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

export function setAmbientEnabled(enabled) {
  state.enabled = Boolean(enabled);
  if (!state.initialized) {
    if (state.enabled && state.unlockAttached) {
      // Will start on next user gesture
    }
    return;
  }
  const { ctx, masterGain } = state;
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  if (state.enabled) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    masterGain.gain.linearRampToValueAtTime(0.52, now + 0.4);
    startScheduler();
  } else {
    masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    stopScheduler();
  }
}

export function setAmbientDuck(ducked) {
  state.ducked = Boolean(ducked);
  if (!state.initialized || !state.ctx || !state.duckGain) return;
  const now = state.ctx.currentTime;
  state.duckGain.gain.cancelScheduledValues(now);
  state.duckGain.gain.setValueAtTime(state.duckGain.gain.value, now);
  state.duckGain.gain.linearRampToValueAtTime(state.ducked ? 0.32 : 1.0, now + 0.6);
}

export function initAmbientThemeUnlock() {
  if (typeof window === 'undefined' || state.unlockAttached) return () => {};
  state.unlockAttached = true;

  const unlock = () => {
    if (!state.enabled) return;
    if (ensureGraph()) {
      if (state.ctx.state === 'suspended') {
        state.ctx.resume().then(() => {
          if (state.enabled) startScheduler();
        }).catch(() => {});
      } else {
        startScheduler();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    }
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });

  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    stopScheduler();
  };
}
