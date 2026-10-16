import { describe, expect, it } from "vitest";
import { guardReading, RESTART_SILENCE_MS, type GuardState } from "./guard";
import type { WeightReading } from "./types";

const r = (seq: number, ts: number): WeightReading => ({
  grams: 100,
  raw: 100,
  stable: true,
  seq,
  ts,
});

// Feeds [seq, device ts, arrival time] and returns the ts handed on (null = dropped).
function run(steps: [number, number, number][]) {
  let state: GuardState = null;
  return steps.map(([seq, ts, now]) => {
    const next = guardReading(state, r(seq, ts), now);
    state = next.state;
    return next.reading?.ts ?? null;
  });
}

describe("guardReading", () => {
  it("passes readings in order unchanged", () => {
    expect(
      run([
        [1, 1000, 0],
        [2, 1250, 250],
        [3, 2250, 1250],
      ]),
    ).toEqual([1000, 1250, 2250]);
  });

  it("drops repeated and older seq while the device keeps talking", () => {
    expect(
      run([
        [5, 5000, 0],
        [5, 5000, 10],
        [4, 4750, 300],
        [6, 5250, 500],
      ]),
    ).toEqual([5000, null, null, 5250]);
  });

  it("takes a restart after a silence and keeps time moving forward", () => {
    // Device rebooted: seq and millis() start over after 4s of silence.
    const out = run([
      [900, 600_000, 0],
      [1, 1200, 4000],
      [2, 1450, 4250],
    ]);
    expect(out).toEqual([600_000, 604_000, 604_250]);
  });

  it("still drops a lower seq that comes back quickly", () => {
    expect(
      run([
        [900, 600_000, 0],
        [1, 1200, RESTART_SILENCE_MS - 1],
      ]),
    ).toEqual([600_000, null]);
  });

  it("never lets time go backwards without a restart", () => {
    expect(
      run([
        [1, 5000, 0],
        [2, 4000, 250],
      ]),
    ).toEqual([5000, 5000]);
  });
});
