// Mirrors the firmware pipeline so the simulator behaves like the real device.
import {
  AVERAGE_WINDOW,
  MEDIAN_WINDOW,
  SEND_DELTA_G,
  SEND_MAX_INTERVAL_MS,
  SEND_MIN_INTERVAL_MS,
  STABLE_BAND_G,
  STABLE_WINDOW_MS,
} from "./constants";

export type FilterState = {
  raws: number[];
  medians: number[];
  history: { t: number; g: number }[];
  startedAt: number | null;
};

export const initialFilterState: FilterState = {
  raws: [],
  medians: [],
  history: [],
  startedAt: null,
};

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function filterStep(state: FilterState, raw: number, t: number) {
  const raws = [...state.raws, raw].slice(-MEDIAN_WINDOW);
  const medians = [...state.medians, median(raws)].slice(-AVERAGE_WINDOW);
  const grams = mean(medians);
  const history = [
    ...state.history.filter((h) => h.t > t - STABLE_WINDOW_MS),
    { t, g: grams },
  ];
  const startedAt = state.startedAt ?? t;
  const gs = history.map((h) => h.g);
  const stable =
    t - startedAt >= STABLE_WINDOW_MS &&
    Math.max(...gs) - Math.min(...gs) <= 2 * STABLE_BAND_G;
  return { state: { raws, medians, history, startedAt }, grams, stable };
}

export type LastSent = { at: number; grams: number; stable: boolean } | null;

export function shouldTransmit(
  last: LastSent,
  now: number,
  grams: number,
  stable: boolean,
): boolean {
  if (!last) return true;
  const since = now - last.at;
  if (since < SEND_MIN_INTERVAL_MS) return false;
  return (
    since >= SEND_MAX_INTERVAL_MS ||
    Math.abs(grams - last.grams) >= SEND_DELTA_G ||
    stable !== last.stable
  );
}
