import { describe, expect, it } from "vitest";
import { stageFor } from "./stage";
import {
  EMPTY_CARRY,
  mealCompleted,
  nextCarry,
  pictureProgress,
  stageProgress,
  type CompletionRule,
} from "./picture";

const rule = (mode: CompletionRule["mode"]): CompletionRule => ({
  mode,
  mealsPerPicture: 4,
  mealCompletePct: 70,
  cumulativeTargetG: 1000,
});
const carry = (over: Partial<typeof EMPTY_CARRY>) => ({
  ...EMPTY_CARRY,
  ...over,
});

describe("pictureProgress", () => {
  it("amount: follows the meal", () => {
    expect(
      pictureProgress(rule("amount"), EMPTY_CARRY, {
        progress: 0.4,
        eatenG: 80,
      }),
    ).toBe(0.4);
  });

  it("meals: each good meal fills 1/N, partial meals fill toward the bar", () => {
    const c = carry({ completedMeals: 2, shown: 0.5 });
    expect(pictureProgress(rule("meals"), c, { progress: 0, eatenG: 0 })).toBe(
      0.5,
    );
    expect(
      pictureProgress(rule("meals"), c, { progress: 0.35, eatenG: 0 }),
    ).toBeCloseTo(0.625);
    // Past the bar a meal never counts for more than one.
    expect(pictureProgress(rule("meals"), c, { progress: 1, eatenG: 0 })).toBe(
      0.75,
    );
  });

  it("cumulative: grams over meals, capped at 1", () => {
    const c = carry({ eatenG: 700, shown: 0.7 });
    expect(
      pictureProgress(rule("cumulative"), c, { progress: 0, eatenG: 200 }),
    ).toBeCloseTo(0.9);
    expect(
      pictureProgress(rule("cumulative"), c, { progress: 0, eatenG: 900 }),
    ).toBe(1);
  });
});

describe("the picture never shrinks between meals", () => {
  it("keeps a short meal's growth in mode B", () => {
    const short = { id: "m1", progress: 0.35, eatenG: 50, completed: false };
    const shown = pictureProgress(rule("meals"), EMPTY_CARRY, short);
    expect(shown).toBeCloseTo(0.125);
    const next = nextCarry(rule("meals"), EMPTY_CARRY, short, false);
    expect(
      pictureProgress(rule("meals"), next, { progress: 0, eatenG: 0 }),
    ).toBeCloseTo(shown);
  });
});

describe("completion", () => {
  const last = 95;
  const done = (r: CompletionRule, p: number) =>
    stageFor(stageProgress(r, p, last)) === 7;

  it("mode A finishes at the last threshold", () => {
    expect(done(rule("amount"), 0.95)).toBe(true);
    expect(done(rule("amount"), 0.94)).toBe(false);
  });

  it("modes B/C finish only when the goal is met", () => {
    const b = rule("meals");
    const almost = pictureProgress(
      b,
      carry({ completedMeals: 3, shown: 0.75 }),
      {
        progress: 0.69,
        eatenG: 0,
      },
    );
    expect(done(b, almost)).toBe(false);
    expect(
      done(
        b,
        pictureProgress(b, carry({ completedMeals: 3 }), {
          progress: 0.7,
          eatenG: 0,
        }),
      ),
    ).toBe(true);
    const c = rule("cumulative");
    expect(done(c, 0.96)).toBe(false);
    expect(done(c, 1)).toBe(true);
  });

  it("reaches the last stage for any last threshold", () => {
    for (const lastPct of [29, 57, 58, 95, 100]) {
      const t = [1, 2, 3, 4, 5, 6, lastPct];
      expect(stageFor(stageProgress(rule("meals"), 1, lastPct), t)).toBe(7);
    }
  });

  it("uses the meals bar in mode B and the last stage elsewhere", () => {
    expect(mealCompleted(rule("meals"), 0.7, last)).toBe(true);
    expect(mealCompleted(rule("amount"), 0.7, last)).toBe(false);
    expect(mealCompleted(rule("amount"), 0.95, last)).toBe(true);
  });

  it("counts a meal that lands exactly on the bar despite float error", () => {
    // 57 / 100 * 100 is 56.99999999999999.
    const r = { ...rule("meals"), mealCompletePct: 57, mealsPerPicture: 2 };
    const meal = { id: "m1", progress: 57 / 100, eatenG: 57, completed: true };
    expect(mealCompleted(r, meal.progress, last)).toBe(true);
    const after = nextCarry(r, EMPTY_CARRY, meal, false);
    expect(after.completedMeals).toBe(1);
    expect(pictureProgress(r, after, meal)).toBe(1);
  });

  it("starts over once the picture is done", () => {
    const meal = { id: "m1", progress: 1, eatenG: 120, completed: true };
    expect(nextCarry(rule("meals"), EMPTY_CARRY, meal, true)).toBe(EMPTY_CARRY);
    expect(nextCarry(rule("meals"), EMPTY_CARRY, meal, false)).toMatchObject({
      completedMeals: 1,
      eatenG: 120,
      mealIds: ["m1"],
    });
  });
});
