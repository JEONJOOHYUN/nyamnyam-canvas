import { describe, expect, it } from "vitest";
import { shouldPromptIdle, stageFor } from "./stage";

describe("stageFor", () => {
  it("maps progress to stages 0..7", () => {
    expect(stageFor(0)).toBe(0);
    expect(stageFor(0.099)).toBe(0);
    expect(stageFor(0.1)).toBe(1);
    expect(stageFor(0.54)).toBe(3);
    expect(stageFor(0.95)).toBe(7);
    expect(stageFor(1)).toBe(7);
  });
  it("uses custom thresholds", () => expect(stageFor(0.5, [50, 100])).toBe(1));
});

describe("shouldPromptIdle", () => {
  it("waits idleSeconds after the last change", () => {
    expect(shouldPromptIdle(0, 0, 0, 29_999)).toBe(false);
    expect(shouldPromptIdle(0, 0, 0, 30_000)).toBe(true);
  });
  it("spaces prompts and stops at the maximum", () => {
    expect(shouldPromptIdle(0, 30_000, 1, 45_000)).toBe(false);
    expect(shouldPromptIdle(0, 30_000, 1, 60_000)).toBe(true);
    expect(shouldPromptIdle(0, 60_000, 3, 999_000)).toBe(false);
  });
});
