import { STABLE_BAND_G, STABLE_WINDOW_MS } from "@/lib/weight/constants";
import type { WeightReading } from "@/lib/weight/types";

export const START_HOLD_MS = 3000; // a weight must hold this long to count as tray / served / refill
export const NEAR_ZERO_G = 10; // at or below: tray lifted off the scale
export const MIN_FOOD_G = 20; // smallest serving we accept
export const BITE_MIN_G = 3; // smaller drops are treated as drift
export const REFILL_MIN_G = 30;
export const ANOMALY_WINDOW_MS = 2000;
export const ANOMALY_RATIO = 0.5; // losing half the serving within the window looks like dumping
// Food eaten from the hand (bread, fruit) leaves the plate at once and may come back partly eaten.
export const HAND_MIN_G = 30; // a quick drop this big is taken in hand, not one bite
export const HAND_COUNT_MS = 60_000; // still not put back: count it as eaten
export const RETURN_WINDOW_MS = 180_000; // food counted that way can still be put back (as credit)

export type MealPhase = "EMPTY_TRAY" | "SERVED" | "EATING" | "ENDED";
export type MealEndedBy = "auto" | "full_button" | "parent";
export type MealConfig = {
  refillPolicy: "count" | "ignore";
  anomalyDetection: boolean;
};

export const defaultMealConfig: MealConfig = {
  refillPolicy: "count",
  anomalyDetection: true,
};

// Scale is tared empty, so readings include the tray. food = served weight - tray.
// Food that left the plate at once and is not counted yet: in a hand, or dumped.
export type HeldFood = { g: number; since: number; suspect: boolean };
// Food counted after HAND_COUNT_MS that may still come back until `until`.
export type ReturnableFood = { g: number; until: number };

export type MealState = {
  phase: MealPhase;
  trayG: number | null;
  foodG: number; // food counted as served (start + counted refills)
  lowG: number; // lowest accepted stable weight; eating is measured below it
  lowAt: number;
  eatenG: number;
  held: HeldFood[];
  heldG: number; // sum of held
  heldSuspect: boolean; // some held food looked like dumping: never counted by time
  returnable: ReturnableFood[];
  returnG: number; // sum of returnable
  // Counted food that came back onto the plate. Eating it again is not counted twice;
  // eatenG itself never goes down, so neither does any picture built from it.
  creditG: number;
  progress: number; // 0..1, never decreases
  lifted: boolean;
  hold: { g: number; since: number } | null;
  unstableSince: number | null; // first unstable reading after the last stable one
  endedBy: MealEndedBy | null;
};

export const initialMealState: MealState = {
  phase: "EMPTY_TRAY",
  trayG: null,
  foodG: 0,
  lowG: 0,
  lowAt: 0,
  eatenG: 0,
  held: [],
  heldG: 0,
  heldSuspect: false,
  returnable: [],
  returnG: 0,
  creditG: 0,
  progress: 0,
  lifted: false,
  hold: null,
  unstableSince: null,
  endedBy: null,
};

export type MealEvent =
  | { type: "reading"; reading: WeightReading }
  | { type: "end"; by: MealEndedBy };

const sum = (list: { g: number }[]) => list.reduce((n, x) => n + x.g, 0);

function withHeld(s: MealState, held: HeldFood[]): MealState {
  return {
    ...s,
    held,
    heldG: sum(held),
    heldSuspect: held.some((h) => h.suspect),
  };
}

function withReturnable(s: MealState, returnable: ReturnableFood[]): MealState {
  return { ...s, returnable, returnG: sum(returnable) };
}

// Recomputes progress and the automatic end after eatenG changes. canFinish is false while
// the current weight is above the low mark: a put-back or refill must be checked first.
function tally(s: MealState, canFinish = true): MealState {
  // Food in a hand, or counted food put back on the plate, blocks the automatic end.
  const finished =
    canFinish &&
    s.foodG - s.eatenG <= BITE_MIN_G &&
    s.heldG === 0 &&
    s.creditG <= BITE_MIN_G;
  return {
    ...s,
    phase: finished ? "ENDED" : s.eatenG > 0 ? "EATING" : s.phase,
    endedBy: finished ? "auto" : null,
    progress: finished
      ? 1
      : Math.max(s.progress, Math.min(1, s.eatenG / s.foodG)),
  };
}

// Counts grams as eaten, using up credit first.
function eat(s: MealState, g: number): MealState {
  const fromCredit = Math.min(g, s.creditG);
  return {
    ...s,
    eatenG: s.eatenG + g - fromCredit,
    creditG: s.creditG - fromCredit,
  };
}

// Whether the current weight could be food coming back onto the plate.
function mayBePutBack(s: MealState, g: number): boolean {
  const rise = g - s.lowG;
  const away = s.heldG + s.returnG;
  return away > 0 && rise >= BITE_MIN_G && rise <= away + STABLE_BAND_G;
}

// Held food that was not dumped counts as eaten a minute after it was taken; counted food
// stops being returnable after its window. Each item keeps its own clock.
function settleHand(s: MealState, g: number, t: number): MealState {
  const back = mayBePutBack(s, g);
  // A put-back already being checked keeps returnable food whose window closed meanwhile.
  const holdSince =
    back && s.hold && Math.abs(g - s.hold.g) <= STABLE_BAND_G
      ? s.hold.since
      : null;
  let next = s;
  const open = s.returnable.filter(
    (r) => t < r.until || (holdSince !== null && holdSince < r.until),
  );
  if (open.length !== s.returnable.length) next = withReturnable(next, open);
  // While the weight may be food coming back, check that first: it changes what was eaten.
  const canFinish = g - s.lowG < BITE_MIN_G;
  if (back && mayBePutBack(next, g)) return tally(next, canFinish);
  const due = s.held.filter((h) => !h.suspect && t - h.since >= HAND_COUNT_MS);
  if (due.length) {
    next = eat(next, sum(due));
    next = withHeld(
      next,
      s.held.filter((h) => !due.includes(h)),
    );
    next = withReturnable(next, [
      ...next.returnable,
      ...due.map((h) => ({ g: h.g, until: t + RETURN_WINDOW_MS })),
    ]);
  }
  return tally(next, canFinish);
}

// Food coming back onto the plate, matched to the newest piece taken first (food in a hand
// before food that looked dumped). A piece that came back only in part was eaten in part:
// decided now when it was the only piece taken, otherwise it stays held on its own clock.
// Whatever is left over was food already counted, and becomes credit.
function putBack(s: MealState, rise: number): MealState {
  let left = rise;
  let eatenNow = 0;
  const only = s.held.length === 1;
  const after = new Map<HeldFood, HeldFood | null>(); // null: settled
  const order = [
    ...s.held.filter((h) => !h.suspect).reverse(),
    ...s.held.filter((h) => h.suspect).reverse(),
  ];
  for (const h of order) {
    if (left <= 0) break;
    const back = Math.min(left, h.g);
    left -= back;
    const rest = h.g - back;
    if (rest > 0 && !only) after.set(h, { ...h, g: rest, suspect: false });
    else {
      eatenNow += rest;
      after.set(h, null);
    }
  }
  const held = s.held.flatMap((h) => {
    const next = after.get(h);
    return next === undefined ? [h] : next ? [next] : [];
  });
  let next = withHeld(eat(s, eatenNow), held);
  const fromCounted = Math.min(left, s.returnG);
  // Returnable food that came back is no longer returnable (oldest first).
  let used = fromCounted;
  const returnable = s.returnable.flatMap((r) => {
    const n = Math.min(used, r.g);
    used -= n;
    return r.g - n > 0 ? [{ ...r, g: r.g - n }] : [];
  });
  next = withReturnable(next, returnable);
  return { ...next, creditG: next.creditG + fromCounted };
}

// Restarts the hold when the weight leaves the stable band; done after START_HOLD_MS.
function holdStep(hold: MealState["hold"], g: number, t: number) {
  if (!hold || Math.abs(g - hold.g) > STABLE_BAND_G)
    return { hold: { g, since: t }, done: false };
  return { hold, done: t - hold.since >= START_HOLD_MS };
}

export function mealReducer(
  s: MealState,
  e: MealEvent,
  config: MealConfig,
): MealState {
  if (s.phase === "ENDED") return s;
  if (e.type === "end") {
    // Food still in a hand when the meal ends was most likely eaten; suspected dumping stays held.
    const hand = s.held.filter((h) => !h.suspect);
    const next = withHeld(
      eat(s, sum(hand)),
      s.held.filter((h) => h.suspect),
    );
    return {
      ...next,
      phase: "ENDED",
      endedBy: e.by,
      progress:
        s.foodG > 0
          ? Math.max(s.progress, Math.min(1, next.eatenG / s.foodG))
          : s.progress,
    };
  }

  const { grams: g, stable, ts: t } = e.reading;
  if (g <= NEAR_ZERO_G)
    return s.phase === "EMPTY_TRAY"
      ? { ...s, trayG: null, hold: null }
      : { ...s, lifted: true, hold: null, unstableSince: null };
  if (s.lifted) s = { ...s, lifted: false };
  // Holds must be 3s of continuous stability, so any unstable reading restarts them.
  if (!stable) return { ...s, hold: null, unstableSince: s.unstableSince ?? t };
  const unstableSince = s.unstableSince;
  if (unstableSince !== null) s = { ...s, unstableSince: null };

  if (s.phase === "EMPTY_TRAY") {
    if (s.trayG !== null && g < s.trayG + MIN_FOOD_G)
      return s.hold ? { ...s, hold: null } : s;
    const { hold, done } = holdStep(s.hold, g, t);
    if (!done) return { ...s, hold };
    if (s.trayG === null) return { ...s, trayG: g, hold: null };
    return {
      ...s,
      phase: "SERVED",
      foodG: g - s.trayG,
      lowG: g,
      lowAt: t,
      hold: null,
    };
  }

  // SERVED / EATING
  s = settleHand(s, g, t);
  if (s.phase === "ENDED") return s;

  // Food taken off the plate coming back: whatever did not come back was eaten.
  // Food already counted that comes back becomes credit instead of lowering eatenG.
  if (mayBePutBack(s, g)) {
    const { hold, done } = holdStep(s.hold, g, t);
    if (!done) return { ...s, hold };
    return tally({ ...putBack(s, g - s.lowG), lowG: g, lowAt: t, hold: null });
  }

  if (g >= s.lowG + REFILL_MIN_G) {
    if (config.refillPolicy === "ignore") return s;
    const { hold, done } = holdStep(s.hold, g, t);
    if (!done) return { ...s, hold };
    return {
      ...s,
      foodG: s.foodG + g - s.lowG,
      lowG: g,
      lowAt: t,
      hold: null,
    };
  }

  const drop = s.lowG - g;
  if (drop < BITE_MIN_G) return { ...s, lowAt: t, hold: null };

  // Time the change itself: the filter needs STABLE_WINDOW_MS of steady data after it.
  const changeMs =
    unstableSince === null ? t - s.lowAt : t - unstableSince - STABLE_WINDOW_MS;
  const quick = changeMs <= ANOMALY_WINDOW_MS;
  const dumped =
    config.anomalyDetection && quick && drop >= ANOMALY_RATIO * s.foodG;
  if (dumped || (quick && drop >= HAND_MIN_G))
    return withHeld({ ...s, lowG: g, lowAt: t, hold: null }, [
      ...s.held,
      { g: drop, since: t, suspect: dumped },
    ]);
  return tally({ ...eat(s, drop), lowG: g, lowAt: t, hold: null });
}
