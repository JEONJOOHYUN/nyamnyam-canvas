import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultMealConfig,
  initialMealState,
  mealReducer,
} from "@/lib/meal/machine";
import { SimulatorSource } from "./simulator";
import type { WeightReading } from "./types";

// Filtered ±2g noise can leave about ±1.2g.
const near = (v: number | null, want: number, tol = 2) =>
  expect(Math.abs((v ?? NaN) - want)).toBeLessThanOrEqual(tol);

// Deterministic noise source (LCG).
function lcg(seed = 1) {
  let x = seed;
  return () => (x = (x * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
}

describe("SimulatorSource → meal state machine", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("plays a whole meal with noise, a press and a lift", async () => {
    const sim = new SimulatorSource(lcg());
    sim.noise = true;
    const readings: WeightReading[] = [];
    let meal = initialMealState;
    sim.subscribe((r) => {
      readings.push(r);
      meal = mealReducer(
        meal,
        { type: "reading", reading: r },
        defaultMealConfig,
      );
    });
    await sim.connect();

    await vi.advanceTimersByTimeAsync(6000); // empty tray
    near(meal.trayG, 350);

    sim.setFood(200);
    await vi.advanceTimersByTimeAsync(6000);
    expect(meal.phase).toBe("SERVED");
    near(meal.foodG, 200);

    sim.press();
    await vi.advanceTimersByTimeAsync(4000);
    expect(meal.eatenG).toBeLessThan(3);

    sim.bite(50);
    await vi.advanceTimersByTimeAsync(4000);
    near(meal.progress, 0.25, 0.02);

    sim.lifted = true;
    await vi.advanceTimersByTimeAsync(2000);
    expect(meal.lifted).toBe(true);
    sim.lifted = false;
    await vi.advanceTimersByTimeAsync(4000);
    expect(meal.lifted).toBe(false);
    near(meal.progress, 0.25, 0.02);

    // Send rules: never faster than ~4Hz, increasing seq.
    for (let i = 1; i < readings.length; i++) {
      expect(readings[i].ts - readings[i - 1].ts).toBeGreaterThanOrEqual(250);
      expect(readings[i].seq).toBe(readings[i - 1].seq + 1);
    }
    sim.disconnect();
  });

  it("flags an instant large drop as dumping despite filter delay", async () => {
    const sim = new SimulatorSource();
    let meal = initialMealState;
    sim.subscribe((r) => {
      meal = mealReducer(
        meal,
        { type: "reading", reading: r },
        defaultMealConfig,
      );
    });
    await sim.connect();
    await vi.advanceTimersByTimeAsync(6000);
    sim.setFood(200);
    await vi.advanceTimersByTimeAsync(6100);
    expect(meal.phase).toBe("SERVED");
    sim.bite(120);
    await vi.advanceTimersByTimeAsync(4000);
    expect(meal).toMatchObject({ eatenG: 0, heldG: 120 });
    sim.disconnect();
  });

  it("demo steps: tray, food, eat in bites, all faster at 3x", async () => {
    const sim = new SimulatorSource();
    sim.setTray(false);
    sim.setSpeed(3);
    let meal = initialMealState;
    sim.subscribe((r) => {
      meal = mealReducer(
        meal,
        { type: "reading", reading: r },
        defaultMealConfig,
      );
    });
    await sim.connect();
    await vi.advanceTimersByTimeAsync(1000);
    expect(meal.trayG).toBeNull(); // nothing on the scale yet

    sim.setTray(true);
    await vi.advanceTimersByTimeAsync(2000); // ~6s of simulator time
    near(meal.trayG, 350);

    sim.setFood(200);
    await vi.advanceTimersByTimeAsync(2100);
    expect(meal.phase).toBe("SERVED");

    // 100g in 10g bites every 2.2s of simulator time: never held back as dumping.
    sim.eat(100);
    expect(sim.eatingLeftG).toBe(100);
    await vi.advanceTimersByTimeAsync(9000);
    expect(sim.eatingLeftG).toBe(0);
    expect(sim.foodG).toBe(100);
    expect(meal.heldG).toBe(0);
    near(meal.progress, 0.5, 0.02);
    sim.disconnect();
  });

  it("clamps the speed and never eats more than is on the plate", () => {
    const sim = new SimulatorSource();
    sim.setSpeed(10);
    expect(sim.speed).toBe(3);
    sim.setSpeed(0.1);
    expect(sim.speed).toBe(0.5);
    sim.setFood(40);
    sim.eat(100);
    expect(sim.eatingLeftG).toBe(40);
    sim.stopEating();
    expect(sim.eatingLeftG).toBe(0);
  });

  it("tare zeroes the current load", async () => {
    const sim = new SimulatorSource();
    let last: WeightReading | undefined;
    sim.subscribe((r) => (last = r));
    await sim.connect();
    await sim.sendCommand({ type: "tare" });
    await vi.advanceTimersByTimeAsync(3000);
    expect(last).toMatchObject({ grams: 0, stable: true });
    sim.disconnect();
  });
});
