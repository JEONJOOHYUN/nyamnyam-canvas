import { describe, expect, it } from "vitest";
import { visiblePieces } from "./growth";
import { THEMES, type GardenThemeKey } from "./themes";
import { DEFAULT_STAGE_THRESHOLDS, sceneFor, stageFor } from "@/lib/meal/stage";

// The piece each stage cheer names (content/lines.ts): it must arrive with the cheer.
const CHEERED: Record<GardenThemeKey, string[]> = {
  post: [
    "flying-letter",
    "mailbox",
    "house",
    "pinwheel",
    "telescope",
    "boat",
    "lanterns",
  ],
  sea: [
    "bubble-high",
    "fish-school",
    "palace",
    "turtle",
    "treasure",
    "seahorse",
    "whale-finale",
  ],
  space: [
    "first-stars",
    "comet",
    "dome-base",
    "rocket-nose",
    "alien-astronaut",
    "moon-buggy",
    "launch-finale",
  ],
};

describe("stage cheers", () => {
  for (const thresholds of [
    DEFAULT_STAGE_THRESHOLDS,
    [5, 20, 30, 50, 60, 80, 90],
  ])
    for (const theme of Object.keys(CHEERED) as GardenThemeKey[])
      it(`land with the piece they name (${theme}, ${thresholds.join("/")})`, () => {
        const { events } = THEMES[theme];
        CHEERED[theme].forEach((key, i) => {
          const at = thresholds[i] / 100;
          const before = at - 0.001;
          expect(stageFor(at, thresholds)).toBe(i + 1);
          expect(stageFor(before, thresholds)).toBe(i);
          expect(
            visiblePieces(sceneFor(at, thresholds), events).at(-1)?.key,
          ).toBe(key);
          expect(
            visiblePieces(sceneFor(before, thresholds), events).map(
              (p) => p.key,
            ),
          ).not.toContain(key);
        });
      });

  it("keeps the default scene at progress / 95%, finished at the last threshold", () => {
    for (const p of [0, 0.03, 0.1, 0.33, 0.5, 0.94])
      expect(sceneFor(p)).toBeCloseTo(p / 0.95, 9);
    expect(sceneFor(0.95)).toBe(1);
    expect(sceneFor(1)).toBe(1);
    expect(sceneFor(0.9, [5, 20, 30, 50, 60, 80, 90])).toBe(1);
  });
});
