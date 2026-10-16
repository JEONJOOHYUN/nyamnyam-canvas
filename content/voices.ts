// How each character sounds. `scripts/generate-voices.mts` turns every line in
// content/lines.ts into public/voices/<character>/<lineId>.mp3 with these settings;
// the app falls back to browser TTS (`tts`) only when a file is missing.
//
// Goal (2026-10-16): bright, soft and friendly for toddlers, clear words, never fast or
// shrill, each character easy to tell apart. ElevenLabs has no child voices (library
// policy), so the voices are young adult Korean speakers. Voices and models were picked by
// ear by the user from side-by-side samples. A child-like pitch comes from `pitch`, done
// by asking for slower speech and speeding the file back up (tape-style), which keeps the
// sound clean instead of the "tuned" ring of pitch-shift filters. Every file is then
// brought to the same loudness.

import type { CharacterId } from "./lines";

export type CharacterVoice = {
  /** ElevenLabs Voice Library voice (needs a paid plan for API use). */
  voiceId: string;
  voiceName: string;
  /** eleven_v4 sounds most natural; only eleven_multilingual_v2 takes `speed`. */
  model: "eleven_v4" | "eleven_multilingual_v2";
  /**
   * multilingual_v2 only: speaking speed after the pitch step (sent as speed / pitch,
   * 0.7..1.2). null = the model's own pace, with the voice's own settings.
   */
  speed: number | null;
  /** Playback speed-up after generation; raises pitch and timbre together. 1 = untouched. */
  pitch: number;
  /** High-shelf gain in dB above 5 kHz; negative softens a sharp voice. 0 = untouched. */
  treble: number;
  /** Browser speech fallback when an mp3 is missing. */
  tts: { pitch: number; rate: number };
};

// Sent with every eleven_multilingual_v2 request.
export const V2_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
};
// Every file gets one plain gain to this average level (dB), capped so its loudest peak
// stays under `peak`, so no character is quieter than another.
export const LOUDNESS = { mean: -20, peak: -1.5 };

export const voices: Record<CharacterId, CharacterVoice> = {
  // Chick, the bright and curious main character: a soft, cute young voice with a dry,
  // close sound; v4 gives it the liveliest delivery. No pitch change.
  nyamnyam: {
    voiceId: "Lb7qkOn5hF8p7qfCDH8q",
    voiceName: "Annie - Friendly, Soft and Clear",
    model: "eleven_v4",
    speed: null,
    pitch: 1,
    treble: 0,
    tts: { pitch: 1.4, rate: 0.9 },
  },
  // Baby sea otter, a sunny easy-going prankster: a joyful, unhurried young male voice
  // raised to a boyish pitch, the only boy of the three. Raising it brightens the top end,
  // so it is softened back. 0.7 x 1.3 = 0.91 is as slow as this pitch allows.
  pongdang: {
    voiceId: "IAETYMYM3nJvjnlkVTKI",
    voiceName: "Deoksu - Joyful, Clear and Rich",
    model: "eleven_multilingual_v2",
    speed: 0.91,
    pitch: 1.3,
    treble: -4,
    tts: { pitch: 1.2, rate: 0.9 },
  },
  // Big-sister star who praises gently: a tender, calm and clear grown-up voice, the
  // lowest of the three. (Jiyoung was tried first but its recording rings like an empty
  // room: its sound faded ~5x slower after each phrase than the others.)
  banjjak: {
    voiceId: "uyVNoMrnUku1dZyVEXwD",
    voiceName: "Anna Kim - Tender, Calm and Clear",
    model: "eleven_v4",
    speed: null,
    pitch: 1,
    treble: 0,
    tts: { pitch: 1.05, rate: 0.85 },
  },
};
