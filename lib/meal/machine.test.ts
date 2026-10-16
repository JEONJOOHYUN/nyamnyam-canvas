import { describe, expect, it } from "vitest";
import {
  defaultMealConfig,
  initialMealState,
  mealReducer,
  type MealConfig,
  type MealEvent,
  type MealState,
} from "./machine";

let seq = 0;
const reading = (grams: number, ts: number, stable = true): MealEvent => ({
  type: "reading",
  reading: { grams, raw: grams, stable, seq: ++seq, ts },
});
// Stable readings every 250ms for `ms`.
const steady = (grams: number, from: number, ms = 3000) =>
  Array.from({ length: ms / 250 + 1 }, (_, i) =>
    reading(grams, from + i * 250),
  );

const run = (
  events: MealEvent[],
  config: MealConfig = defaultMealConfig,
  s: MealState = initialMealState,
) => events.reduce((st, e) => mealReducer(st, e, config), s);

// Tray 300g, then 200g of food. Served at t=13s.
const served = (config?: MealConfig) =>
  run([...steady(300, 0), ...steady(500, 10_000)], config);

describe("meal state machine", () => {
  it("captures the empty tray, then the serving after a 3s hold", () => {
    const tray = run(steady(300, 0));
    expect(tray).toMatchObject({ phase: "EMPTY_TRAY", trayG: 300 });
    expect(run(steady(500, 10_000, 2500), undefined, tray).phase).toBe(
      "EMPTY_TRAY",
    );
    expect(served()).toMatchObject({ phase: "SERVED", foodG: 200, lowG: 500 });
  });

  it("restarts the 3s hold after an unstable reading", () => {
    const tray = run(steady(300, 0));
    const s = run(
      [
        reading(500, 4000),
        reading(550, 5000, false),
        reading(500, 7000),
        reading(500, 8000),
      ],
      undefined,
      tray,
    );
    expect(s.phase).toBe("EMPTY_TRAY");
    expect(run(steady(500, 9000), undefined, s).phase).toBe("SERVED");
  });

  it("ignores unstable readings", () => {
    const s = run([reading(450, 20_000, false)], undefined, served());
    expect(s.eatenG).toBe(0);
  });

  it("counts stable drops and never lowers progress", () => {
    let s = run(steady(450, 20_000), undefined, served());
    expect(s).toMatchObject({ phase: "EATING", eatenG: 50, progress: 0.25 });
    s = run(steady(470, 30_000), undefined, s); // small rise (hand on tray)
    expect(s.progress).toBe(0.25);
  });

  it("ignores a spoon press spike", () => {
    const s = run(
      [reading(620, 20_000, false), reading(500, 20_250, true)],
      undefined,
      served(),
    );
    expect(s).toMatchObject({ eatenG: 0, foodG: 200 });
  });

  it("pauses while the tray is lifted and resumes after", () => {
    let s = run([reading(0, 20_000, false)], undefined, served());
    expect(s.lifted).toBe(true);
    s = run(steady(480, 30_000), undefined, s);
    expect(s).toMatchObject({ lifted: false, eatenG: 20 });
  });

  it("counts a refill after it holds for 3s", () => {
    let s = run(steady(450, 20_000), undefined, served());
    s = run(steady(550, 30_000, 2500), undefined, s);
    expect(s.foodG).toBe(200);
    s = run(steady(550, 33_000, 1000), undefined, s);
    expect(s).toMatchObject({ foodG: 300, lowG: 550, progress: 0.25 });
  });

  it("ignores a refill when the policy says so", () => {
    const config: MealConfig = { ...defaultMealConfig, refillPolicy: "ignore" };
    let s = run(steady(450, 20_000), config, served(config));
    s = run(steady(550, 30_000, 5000), config, s);
    expect(s).toMatchObject({ foodG: 200, lowG: 450 });
    s = run(steady(500, 40_000), config, s); // eating the refill counts for nothing
    expect(s.eatenG).toBe(50);
  });

  it("holds back a sudden large drop as suspected dumping", () => {
    const s = run([reading(380, 14_000)], undefined, served());
    expect(s).toMatchObject({ eatenG: 0, heldG: 120, progress: 0 });
  });

  it("counts the same drop when anomaly detection is off", () => {
    const config: MealConfig = {
      ...defaultMealConfig,
      anomalyDetection: false,
    };
    const s = run([reading(380, 14_000)], config, served(config));
    expect(s).toMatchObject({ eatenG: 120, progress: 0.6 });
  });

  it("ends automatically when the plate is clean", () => {
    let s = served();
    for (const g of [460, 420, 380, 340, 302])
      s = run(steady(g, s.lowAt + 5000), undefined, s);
    expect(s).toMatchObject({ phase: "ENDED", endedBy: "auto", progress: 1 });
  });

  it("ends by the full button and ignores later readings", () => {
    let s = run([{ type: "end", by: "full_button" }], undefined, served());
    s = run(steady(400, 20_000), undefined, s);
    expect(s).toMatchObject({
      phase: "ENDED",
      endedBy: "full_button",
      eatenG: 0,
    });
  });
});
