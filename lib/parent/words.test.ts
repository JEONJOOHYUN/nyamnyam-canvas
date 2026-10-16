import { describe, expect, it } from "vitest";
import { mealTime, possessive } from "./words";

describe("possessive", () => {
  it("adds 이 after a final consonant", () => {
    expect(possessive("하린")).toBe("하린이의");
    expect(possessive("도윤 ")).toBe("도윤이의");
  });

  it("does not after an open syllable or a non-Hangul name", () => {
    expect(possessive("지아")).toBe("지아의");
    expect(possessive("Mia")).toBe("Mia의");
  });
});

describe("mealTime", () => {
  it("names the meal by the hour", () => {
    expect(mealTime(new Date(2026, 9, 16, 8, 5))).toBe("아침 8:05");
    expect(mealTime(new Date(2026, 9, 16, 12, 40))).toBe("점심 12:40");
    expect(mealTime(new Date(2026, 9, 16, 18, 20))).toBe("저녁 6:20");
  });
});
