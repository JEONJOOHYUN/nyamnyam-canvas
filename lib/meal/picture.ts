// How a meal turns into picture progress under the parent's completion mode (spec §4-2).
// A "amount": one meal = one picture. B "meals": N good meals = one picture.
// C "cumulative": X grams over any number of meals = one picture.

export type CompletionMode = "amount" | "meals" | "cumulative";

export type CompletionRule = {
  mode: CompletionMode;
  mealsPerPicture: number;
  mealCompletePct: number;
  cumulativeTargetG: number;
};

// What earlier meals already added to the picture in progress.
export type PictureCarry = {
  completedMeals: number;
  eatenG: number;
  mealIds: string[];
  // Highest progress already shown, so a short meal never shrinks the picture.
  shown: number;
};

export const EMPTY_CARRY: PictureCarry = {
  completedMeals: 0,
  eatenG: 0,
  mealIds: [],
  shown: 0,
};

// Whether a 0..1 progress reaches a whole percentage. Tolerant of float error:
// 57 / 100 * 100 is 56.99999999999999, which must still count as 57%.
function reaches(progress: number, pct: number): boolean {
  return progress * 100 >= pct - 1e-9;
}

// 0..1, where 1 means the picture is complete. Never below what was already shown.
export function pictureProgress(
  rule: CompletionRule,
  carry: PictureCarry,
  meal: { progress: number; eatenG: number },
): number {
  switch (rule.mode) {
    case "amount":
      return meal.progress;
    case "meals": {
      const thisMeal = reaches(meal.progress, rule.mealCompletePct)
        ? 1
        : (meal.progress * 100) / rule.mealCompletePct;
      const p = (carry.completedMeals + thisMeal) / rule.mealsPerPicture;
      return Math.min(1, Math.max(carry.shown, p));
    }
    case "cumulative": {
      const p = (carry.eatenG + meal.eatenG) / rule.cumulativeTargetG;
      return Math.min(1, Math.max(carry.shown, p));
    }
  }
}

// Progress fed to the stage thresholds. In mode A the scene finishes at the last
// threshold (a plate is rarely licked clean); in B/C it finishes exactly at the goal.
export function stageProgress(
  rule: CompletionRule,
  picture: number,
  lastThresholdPct: number,
): number {
  if (rule.mode === "amount") return picture;
  // Exactly 1 at the goal: 0.57 * 100 is 56.999..., which would miss a 57% stage.
  return picture >= 1 ? 1 : (picture * lastThresholdPct) / 100;
}

// Whether a finished meal counts as "done" for the record and for mode B.
export function mealCompleted(
  rule: CompletionRule,
  mealProgress: number,
  lastThresholdPct: number,
): boolean {
  const bar = rule.mode === "meals" ? rule.mealCompletePct : lastThresholdPct;
  return reaches(mealProgress, bar);
}

// Carry for the next meal once this one has ended.
export function nextCarry(
  rule: CompletionRule,
  carry: PictureCarry,
  meal: { id: string; progress: number; eatenG: number; completed: boolean },
  pictureDone: boolean,
): PictureCarry {
  if (pictureDone) return EMPTY_CARRY;
  return {
    completedMeals: carry.completedMeals + (meal.completed ? 1 : 0),
    eatenG: carry.eatenG + meal.eatenG,
    mealIds: [...carry.mealIds, meal.id],
    shown: pictureProgress(rule, carry, meal),
  };
}
