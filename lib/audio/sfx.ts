// Synthesized sound effects (no files, no licensing). Soft sine/triangle tones with short envelopes.
let ctx: AudioContext | null = null;
let sfxVolume = 0.6;

// Must run inside a user gesture (iOS keeps audio locked until then).
export function unlockAudio(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const getAudioContext = () => ctx;

export function setSfxVolume(v: number) {
  sfxVolume = Math.min(1, Math.max(0, v));
}

type Tone = {
  f: number; // Hz
  at: number; // start offset (s)
  dur: number; // s
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
};

function tones(list: Tone[]) {
  if (!ctx || sfxVolume === 0) return;
  const t0 = ctx.currentTime + 0.01;
  for (const n of list) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const start = t0 + n.at;
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.f, start);
    if (n.slideTo)
      osc.frequency.exponentialRampToValueAtTime(n.slideTo, start + n.dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(
      (n.gain ?? 0.25) * sfxVolume,
      start + 0.012,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + n.dur + 0.05);
  }
}

// Short filtered noise bursts that read as soft clapping.
function claps(times: number[]) {
  if (!ctx || sfxVolume === 0) return;
  const len = Math.floor(ctx.sampleRate * 0.12);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const t0 = ctx.currentTime + 0.01;
  for (const at of times) {
    const src = ctx.createBufferSource();
    const band = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = buf;
    band.type = "bandpass";
    band.frequency.value = 1400 + Math.random() * 400;
    g.gain.value = 0.18 * sfxVolume;
    src.connect(band).connect(g).connect(ctx.destination);
    src.start(t0 + at);
  }
}

// Xylophone-ish note: fundamental plus a quiet 4th harmonic that dies fast.
const xylo = (f: number, at: number, dur = 0.5): Tone[] => [
  { f, at, dur, gain: 0.22 },
  { f: f * 4, at, dur: 0.08, gain: 0.04 },
];

export const sfx = {
  stageUp: () =>
    tones([...xylo(784, 0), ...xylo(1047, 0.12), ...xylo(1319, 0.24, 0.7)]),
  sparkle: () =>
    tones([
      { f: 2093, at: 0, dur: 0.25, gain: 0.07 },
      { f: 2637, at: 0.06, dur: 0.3, gain: 0.05 },
    ]),
  complete: () => {
    tones([
      { f: 523, at: 0, dur: 0.18, type: "triangle", gain: 0.2 },
      { f: 659, at: 0.15, dur: 0.18, type: "triangle", gain: 0.2 },
      { f: 784, at: 0.3, dur: 0.18, type: "triangle", gain: 0.2 },
      { f: 1047, at: 0.45, dur: 0.7, type: "triangle", gain: 0.22 },
      { f: 784, at: 0.45, dur: 0.7, gain: 0.1 },
    ]);
    claps([0.9, 1.05, 1.18, 1.34, 1.47, 1.63, 1.75, 1.92]);
  },
  touch: () => tones([{ f: 520, at: 0, dur: 0.16, slideTo: 1100, gain: 0.2 }]),
  stamp: () =>
    tones([
      { f: 130, at: 0, dur: 0.28, slideTo: 60, gain: 0.45 },
      ...xylo(1047, 0.22),
      ...xylo(1319, 0.3, 0.6),
    ]),
  tap: () => tones([{ f: 880, at: 0, dur: 0.06, gain: 0.12 }]),
};
