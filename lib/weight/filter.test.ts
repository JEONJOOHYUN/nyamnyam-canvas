import { describe, expect, it } from "vitest";
import { filterStep, initialFilterState, shouldTransmit } from "./filter";

function feed(samples: number[], stepMs = 100) {
  let state = initialFilterState;
  return samples.map((raw, i) => {
    const f = filterStep(state, raw, i * stepMs);
    state = f.state;
    return f;
  });
}

describe("filterStep", () => {
  it("removes a single-sample spike with the median", () => {
    const out = feed([300, 300, 300, 300, 300, 420, 300, 300, 300]);
    expect(out.every((f) => f.grams === 300)).toBe(true);
  });

  it("is not stable before one second of data", () => {
    const out = feed(Array(10).fill(300));
    expect(out.at(-1)?.stable).toBe(false);
    expect(feed(Array(11).fill(300)).at(-1)?.stable).toBe(true);
  });

  it("goes unstable after a jump and settles again", () => {
    const out = feed([...Array(15).fill(300), ...Array(30).fill(250)]);
    expect(out[14].stable).toBe(true);
    expect(out[18].stable).toBe(false); // median delays a step by 2 samples
    expect(out.at(-1)).toMatchObject({ grams: 250, stable: true });
  });

  it("stays stable under ±2g noise", () => {
    const noisy = Array.from({ length: 40 }, (_, i) => 300 + (i % 2 ? 2 : -2));
    expect(
      feed(noisy)
        .slice(10)
        .every((f) => f.stable),
    ).toBe(true);
  });
});

describe("shouldTransmit", () => {
  const last = { at: 0, grams: 100, stable: true };
  it("sends the first reading", () =>
    expect(shouldTransmit(null, 0, 100, true)).toBe(true));
  it("caps the rate at ~4Hz", () =>
    expect(shouldTransmit(last, 200, 150, true)).toBe(false));
  it("sends on a 1g change", () =>
    expect(shouldTransmit(last, 300, 101, true)).toBe(true));
  it("skips small changes until the 1s heartbeat", () => {
    expect(shouldTransmit(last, 900, 100.5, true)).toBe(false);
    expect(shouldTransmit(last, 1000, 100.5, true)).toBe(true);
  });
  it("sends when stability flips", () =>
    expect(shouldTransmit(last, 300, 100, false)).toBe(true));
});
