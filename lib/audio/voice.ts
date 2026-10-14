import type { MotionValue } from "motion/react";
import type { CharacterId, Line } from "@/content/lines";
import { getAudioContext } from "./sfx";

// Browser TTS stand-in until the Clova Dubbing files exist (spec §13).
const TTS_VOICE: Record<CharacterId, { pitch: number; rate: number }> = {
  nyamnyam: { pitch: 1.6, rate: 0.95 },
};

let voiceVolume = 1;
let stopCurrent: (() => void) | null = null;

export function setVoiceVolume(v: number) {
  voiceVolume = Math.min(1, Math.max(0, v));
}

export function stopSpeaking() {
  stopCurrent?.();
  stopCurrent = null;
}

/**
 * Plays public/voices/<character>/<lineId>.mp3, or reads the line with TTS when the file
 * is missing. Drives `mouth` (0..1) from the audio level so the character's beak moves.
 * Resolves true when the line finished, false when a newer line or stopSpeaking() cut it off.
 */
export function speak(
  character: CharacterId,
  line: Line,
  mouth: MotionValue<number>,
): Promise<boolean> {
  stopSpeaking();
  return new Promise((resolve) => {
    let raf = 0;
    let done = false;
    const finish = (completed: boolean) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      mouth.set(0);
      resolve(completed);
    };
    // Every async step checks `done` so a cancelled line never starts audio or a beak loop.
    const loop = (frame: (t: number) => void) => {
      const tick = (t: number) => {
        if (done) return;
        frame(t);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const audio = new Audio(`/voices/${character}/${line.id}.mp3`);
    stopCurrent = () => {
      audio.pause();
      if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
      finish(false);
    };
    if (voiceVolume === 0) return finish(true);

    audio.volume = voiceVolume;
    audio.onended = () => finish(true);
    audio
      .play()
      .then(() => {
        const ctx = getAudioContext();
        if (done || !ctx) return;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx
          .createMediaElementSource(audio)
          .connect(analyser)
          .connect(ctx.destination);
        const buf = new Uint8Array(analyser.fftSize);
        loop(() => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += ((v - 128) / 128) ** 2;
          mouth.set(Math.min(1, Math.sqrt(sum / buf.length) * 5));
        });
      })
      // shortcut: a missing mp3 is detected by a failed play (404 in the console), fine until voices ship.
      .catch(() => {
        if (done) return;
        if (typeof speechSynthesis === "undefined") return finish(true);
        const u = new SpeechSynthesisUtterance(line.text);
        u.lang = "ko-KR";
        u.voice =
          speechSynthesis.getVoices().find((v) => v.lang.startsWith("ko")) ??
          null;
        u.pitch = TTS_VOICE[character].pitch;
        u.rate = TTS_VOICE[character].rate;
        u.volume = voiceVolume;
        // TTS gives no audio stream to analyse, so flap the beak while it talks.
        u.onstart = () =>
          loop((t) => mouth.set(0.25 + 0.6 * Math.abs(Math.sin(t / 70))));
        u.onend = () => finish(true);
        u.onerror = () => finish(false);
        speechSynthesis.speak(u);
      });
  });
}
