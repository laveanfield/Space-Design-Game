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

export function beep(enabled, freq = 880, durationSec = 0.055, type = 'square', gain = 0.035) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    const osc = sharedAudioCtx.createOscillator();
    const g = sharedAudioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, sharedAudioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, sharedAudioCtx.currentTime + durationSec);
    osc.connect(g);
    g.connect(sharedAudioCtx.destination);
    osc.start();
    osc.stop(sharedAudioCtx.currentTime + durationSec);
  } catch {
    // Audio playback can fail cleanly if blocked by browser autoplay policy
  }
}

export function playSoundAsset(enabled, filename, volume = 0.35) {
  if (!enabled || typeof window === 'undefined' || !filename) return;
  try {
    const audio = new Audio(`/sounds/${filename}`);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {
    // ignore playback errors
  }
}
