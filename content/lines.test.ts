import { describe, expect, it } from "vitest";
import { lines } from "./lines";

// Word starts that scold, hurry, compare, or talk about body/weight (spec §12).
const BANNED = [
  "빨리",
  "얼른",
  "어서",
  "혼나",
  "혼날",
  "안 돼",
  "왜 안",
  "뚱뚱",
  "살찌",
  "살이 ",
  "몸무게",
  "체중",
  "날씬",
  "누구보다",
  "형처럼",
  "언니처럼",
  "벌 줄",
  "벌이야",
];

describe("content/lines", () => {
  for (const [character, byKey] of Object.entries(lines)) {
    const all = Object.values(byKey).flat();
    it(`${character}: line ids are unique`, () =>
      expect(new Set(all.map((l) => l.id)).size).toBe(all.length));
    it(`${character}: lines are short`, () =>
      all.forEach((l) => expect(l.text.length, l.id).toBeLessThanOrEqual(25)));
    it(`${character}: no scolding, hurrying or body talk`, () =>
      all.forEach((l) =>
        BANNED.forEach((w) =>
          expect(` ${l.text}`, l.id).not.toContain(` ${w}`),
        ),
      ));
  }
});
