import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lines, type CharacterId } from "./lines";
import { voices } from "./voices";

const ids = Object.keys(lines) as CharacterId[];

describe("character voices", () => {
  it.each(ids)(
    "%s has a voice file for every line (run `npm run voices`)",
    (c) => {
      const missing = Object.values(lines[c])
        .flat()
        .filter(
          (l) =>
            !fs.existsSync(path.join("public", "voices", c, `${l.id}.mp3`)),
        )
        .map((l) => l.id);
      expect(missing).toEqual([]);
    },
  );

  it.each(ids)("%s speed is reachable at its pitch", (c) => {
    const { model, speed, pitch } = voices[c];
    if (model === "eleven_v4") {
      // v4 ignores speed, so a pitch step would also change the pace uncorrected.
      expect(speed).toBeNull();
      expect(pitch).toBe(1);
      return;
    }
    // ElevenLabs takes 0.7..1.2 and the pitch step multiplies it by `pitch`.
    expect(speed).not.toBeNull();
    expect(speed! / pitch).toBeGreaterThanOrEqual(0.7 - 1e-9);
    expect(speed! / pitch).toBeLessThanOrEqual(1.2);
  });

  it("each character sounds different", () => {
    expect(new Set(ids.map((c) => voices[c].voiceId)).size).toBe(ids.length);
  });
});
