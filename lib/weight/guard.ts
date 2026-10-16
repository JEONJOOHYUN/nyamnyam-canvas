// Order and timing checks for readings that come over the network (spec §2):
// stale or repeated seq is dropped, and a device restart (seq starting over after a
// silence) is accepted with its clock moved onto the same timeline, so the meal
// machine never sees time go backwards.
import { SEND_MAX_INTERVAL_MS } from "./constants";
import type { WeightReading } from "./types";

// A device sends at least every SEND_MAX_INTERVAL_MS, and a reboot (Wi-Fi + TLS + filter
// warm-up) takes several seconds; a lower seq after this much silence is a restart.
export const RESTART_SILENCE_MS = 2 * SEND_MAX_INTERVAL_MS;

export type GuardState = {
  seq: number;
  ts: number; // last ts handed on (already shifted)
  shift: number; // added to the device's ts
  arrivedAt: number; // local clock when it arrived
} | null;

export function guardReading(
  state: GuardState,
  r: WeightReading,
  now: number,
): { state: GuardState; reading: WeightReading | null } {
  if (state && r.seq <= state.seq) {
    if (now - state.arrivedAt < RESTART_SILENCE_MS)
      return { state, reading: null };
    // Restarted: carry on from the last time handed on plus the silence in between.
    const shift = state.ts + (now - state.arrivedAt) - r.ts;
    return accept({ ...state, shift }, r, now);
  }
  return accept(state ?? { seq: 0, ts: 0, shift: 0, arrivedAt: now }, r, now);
}

function accept(state: NonNullable<GuardState>, r: WeightReading, now: number) {
  // Never step back in time, even if the device clock does without a restart.
  const ts = Math.max(state.ts, r.ts + state.shift);
  return {
    state: { seq: r.seq, ts, shift: state.shift, arrivedAt: now },
    reading: { ...r, ts },
  };
}
