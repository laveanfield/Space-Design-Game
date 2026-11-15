/**
 * Backend API client, Float32/Uint8 base64 telemetry decoders, and CRT/Mission audio helpers.
 */

export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, ...rest } = options;
  const init = {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...rest,
  };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(path, init);
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) {
        detail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      } else if (errJson?.error) {
        detail = `${errJson.error.code || 'ERROR'}: ${errJson.error.message || JSON.stringify(errJson.error)}`;
      }
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail);
  }
  return res.json();
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decode backend "f32:<base64>" compressed telemetry series into Float32Array.
 */
export function decodeF32(encoded) {
  if (!encoded) return new Float32Array(0);
  if (Array.isArray(encoded)) return new Float32Array(encoded);
  const raw = encoded.startsWith('f32:') ? encoded.slice(4) : encoded;
  const bytes = base64ToBytes(raw);
  return new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
}

/**
 * Decode backend "u8:<base64>" compressed stage index series into Uint8Array.
 */
export function decodeU8(encoded) {
  if (!encoded) return new Uint8Array(0);
  if (Array.isArray(encoded)) return new Uint8Array(encoded);
  const raw = encoded.startsWith('u8:') ? encoded.slice(3) : encoded;
  return base64ToBytes(raw);
}

let sharedAudioCtx = null;

export function getSharedAudioCtx() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function beep(enabled, freq = 880, durationSec = 0.055, type = 'square', gain = 0.035) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const ctx = getSharedAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec);
  } catch {
    // Audio playback can fail cleanly if blocked by browser autoplay policy
  }
}

const activeAudioRefs = new Set();

export function playSoundAsset(enabled, filename, volume = 0.35) {
  if (!enabled || typeof window === 'undefined' || !filename) return;
  try {
    const audio = new Audio(`/sounds/${filename}`);
    audio.volume = volume;
    activeAudioRefs.add(audio);
    const cleanup = () => activeAudioRefs.delete(audio);
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    audio.play().catch(cleanup);
  } catch {
    // ignore playback errors
  }
}

/**
 * Looping sound controller using shared Web Audio context (gapless loop + smooth gain fade).
 */
export function createLoopingSound(filename, baseVolume = 0.32) {
  let disposed = false;
  let buffer = null;
  let source = null;
  let gainNode = null;
  let wantOn = false;
  let targetVol = baseVolume;

  const ensureStart = () => {
    if (disposed || !buffer || source) return;
    const ctx = getSharedAudioCtx();
    if (!ctx) return;
    gainNode = ctx.createGain();
    gainNode.gain.value = 0.0001;
    gainNode.connect(ctx.destination);
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start();
  };

  if (typeof window !== 'undefined' && filename) {
    fetch(`/sounds/${filename}`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((ab) => {
        if (!ab || disposed) return null;
        const ctx = getSharedAudioCtx();
        return ctx ? ctx.decodeAudioData(ab) : null;
      })
      .then((decoded) => {
        if (!decoded || disposed) return;
        buffer = decoded;
        if (wantOn) apply(true, targetVol);
      })
      .catch(() => {});
  }

  const apply = (on, vol = baseVolume) => {
    wantOn = Boolean(on);
    targetVol = vol;
    if (disposed) return;
    const ctx = getSharedAudioCtx();
    if (!ctx) return;
    if (wantOn && buffer && !source) ensureStart();
    if (!gainNode) return;
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(Math.max(0.0001, gainNode.gain.value), now);
    gainNode.gain.linearRampToValueAtTime(wantOn ? Math.max(0.0001, targetVol) : 0.0001, now + 0.18);
  };

  const dispose = () => {
    disposed = true;
    try {
      if (source) source.stop();
    } catch {
      // ignore
    }
    source = null;
    gainNode = null;
  };

  return { setActive: apply, dispose };
}

/**
 * Phat tieng xi ga ap suat cao (filtered white noise hiss) theo do gan cua chuot voi diem ro ri.
 */
export function playGasHiss(enabled, intensity = 0.5, durationSec = 0.14) {
  if (!enabled || typeof window === 'undefined' || intensity <= 0.02) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    const ctx = sharedAudioCtx;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.max(128, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2600 + intensity * 2800;
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    const vol = Math.min(0.32, 0.02 + intensity * 0.28);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + durationSec);
  } catch {
    // ignore audio block
  }
}
