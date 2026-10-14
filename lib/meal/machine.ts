import { STABLE_BAND_G, STABLE_WINDOW_MS } from "@/lib/weight/constants";
import type { WeightReading } from "@/lib/weight/types";

export const START_HOLD_MS = 3000; // a weight must hold this long to count as tray / served / refill
export const NEAR_ZERO_G = 10; // at or below: tray lifted off the scale
export const MIN_FOOD_G = 20; // smallest serving we accept
export const BITE_MIN_G = 3; // smaller drops are treated as drift
export const REFILL_MIN_G = 30;
export const ANOMALY_WINDOW_MS = 2000;
export const ANOMALY_RATIO = 0.5; // losing half the serving within the window looks like dumping

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
export type MealState = {
  phase: MealPhase;
  trayG: number | null;
  foodG: number; // food counted as served (start + counted refills)
  lowG: number; // lowest accepted stable weight; eating is measured below it
  lowAt: number;
  eatenG: number;
  heldG: number; // drops held back as suspected dumping
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
  heldG: 0,
  progress: 0,
  lifted: false,
  hold: null,
  unstableSince: null,
  endedBy: null,
};

export type MealEvent =
  | { type: "reading"; reading: WeightReading }
  | { type: "end"; by: MealEndedBy };

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
  if (e.type === "end") return { ...s, phase: "ENDED", endedBy: e.by };

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
  const dumped =
    config.anomalyDetection &&
    drop >= ANOMALY_RATIO * s.foodG &&
    changeMs <= ANOMALY_WINDOW_MS;
  const eatenG = dumped ? s.eatenG : s.eatenG + drop;
  const finished = s.foodG - eatenG <= BITE_MIN_G;
  return {
    ...s,
    phase: finished ? "ENDED" : eatenG > 0 ? "EATING" : s.phase,
    endedBy: finished ? "auto" : null,
    lowG: g,
    lowAt: t,
    eatenG,
    heldG: dumped ? s.heldG + drop : s.heldG,
    progress: finished ? 1 : Math.max(s.progress, eatenG / s.foodG),
    hold: null,
  };
}
