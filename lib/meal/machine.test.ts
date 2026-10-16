import { describe, expect, it } from "vitest";
import {
  defaultMealConfig,
  HAND_COUNT_MS,
  initialMealState,
  mealReducer,
  type MealConfig,
  type MealEvent,
  type MealState,
  RETURN_WINDOW_MS,
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

  it("counts the same drop after a minute when anomaly detection is off", () => {
    const config: MealConfig = {
      ...defaultMealConfig,
      anomalyDetection: false,
    };
    let s = run([reading(380, 14_000)], config, served(config));
    expect(s).toMatchObject({ eatenG: 0, heldG: 120, heldSuspect: false });
    s = run([reading(380, 14_000 + HAND_COUNT_MS)], config, s);
    expect(s).toMatchObject({ eatenG: 120, heldG: 0, progress: 0.6 });
  });

  describe("food eaten from the hand", () => {
    // Bread 60g of the 200g serving picked up at 20s (unstable while the hand moves).
    const picked = () =>
      run(
        [reading(450, 19_000, false), reading(440, 20_000)],
        undefined,
        served(),
      );

    it("waits while the bread is in the hand", () => {
      const s = picked();
      expect(s).toMatchObject({ eatenG: 0, heldG: 60, heldSuspect: false });
      expect(s.phase).not.toBe("ENDED");
    });

    it("counts only what did not come back when it is put down", () => {
      let s = run(steady(480, 30_000), undefined, picked()); // 20g eaten
      expect(s).toMatchObject({ eatenG: 20, heldG: 0, foodG: 200, lowG: 480 });
      expect(s.progress).toBe(0.1);
      s = run(steady(470, 40_000), undefined, s); // a bite from the plate
      expect(s.eatenG).toBe(30);
    });

    it("does not take the put-down for a refill", () => {
      const s = run(steady(500, 30_000), undefined, picked()); // not eaten at all
      expect(s).toMatchObject({ eatenG: 0, foodG: 200, lowG: 500 });
    });

    it("waits 3s before taking the put-down", () => {
      const s = run(steady(480, 30_000, 2000), undefined, picked());
      expect(s).toMatchObject({ eatenG: 0, heldG: 60 });
    });

    it("counts bread held for a minute; what comes back is not counted twice", () => {
      let s = run([reading(440, 20_000 + HAND_COUNT_MS)], undefined, picked());
      expect(s).toMatchObject({ eatenG: 60, heldG: 0, returnG: 60 });
      expect(s.progress).toBe(0.3);
      s = run(steady(480, 90_000), undefined, s); // 40g comes back
      expect(s).toMatchObject({ eatenG: 60, creditG: 40, returnG: 20 });
      expect(s.foodG).toBe(200); // not a refill
      s = run(steady(450, 100_000), undefined, s); // eats 30g of it again
      expect(s).toMatchObject({ eatenG: 60, creditG: 10 });
      s = run(steady(430, 110_000), undefined, s); // 10g more credit, then 10g new
      expect(s).toMatchObject({ eatenG: 70, creditG: 0, progress: 0.35 });
    });

    it("does not end by itself while counted food sits back on the plate", () => {
      let s = served();
      for (const g of [460, 420, 380, 340])
        s = run(steady(g, s.lowAt + 5000), undefined, s);
      s = run([reading(300, s.lowAt + 1000)], undefined, s); // last 40g picked up
      s = run([reading(300, s.lowAt + HAND_COUNT_MS)], undefined, s);
      expect(s.phase).toBe("ENDED"); // counted after a minute
      let t = served();
      for (const g of [460, 420, 380])
        t = run(steady(g, t.lowAt + 5000), undefined, t);
      t = run([reading(320, t.lowAt + 1000)], undefined, t); // 60g picked up
      t = run([reading(320, t.lowAt + HAND_COUNT_MS)], undefined, t);
      t = run(steady(340, t.lowAt + HAND_COUNT_MS + 1000), undefined, t); // 20g back
      expect(t).toMatchObject({ phase: "EATING", eatenG: 180, creditG: 20 });
      t = run(steady(300, t.lowAt + 5000), undefined, t);
      expect(t).toMatchObject({ phase: "ENDED", endedBy: "auto" });
    });

    it("checks a put-back before counting the held food by time", () => {
      const s = run(
        steady(480, 20_000 + HAND_COUNT_MS - 2000),
        undefined,
        picked(),
      );
      expect(s).toMatchObject({ eatenG: 20, heldG: 0, returnG: 0 });
    });

    it("finishes a put-back that started just before the return window closed", () => {
      let s = run([reading(440, 20_000 + HAND_COUNT_MS)], undefined, picked());
      const closes = 20_000 + HAND_COUNT_MS + RETURN_WINDOW_MS;
      s = run(steady(480, closes - 1000), undefined, s);
      expect(s).toMatchObject({ eatenG: 60, creditG: 40, foodG: 200 });
    });

    it("treats a later rise as a refill once the return window is over", () => {
      let s = run([reading(440, 20_000 + HAND_COUNT_MS)], undefined, picked());
      const late = 20_000 + HAND_COUNT_MS + RETURN_WINDOW_MS;
      s = run([reading(440, late), ...steady(480, late + 1000)], undefined, s);
      expect(s).toMatchObject({ eatenG: 60, returnG: 0, foodG: 240 });
    });

    it("treats a rise first seen after the window as a refill", () => {
      let s = run([reading(440, 20_000 + HAND_COUNT_MS)], undefined, picked());
      const late = 20_000 + HAND_COUNT_MS + RETURN_WINDOW_MS;
      s = run(steady(480, late), undefined, s); // no reading in between
      expect(s).toMatchObject({ eatenG: 60, creditG: 0, foodG: 240 });
    });

    it("still counts held food by time while a refill sits on the plate", () => {
      const config: MealConfig = {
        ...defaultMealConfig,
        refillPolicy: "ignore",
      };
      let s = run(
        [reading(450, 19_000, false), reading(440, 20_000)],
        config,
        served(config),
      );
      s = run(steady(540, 30_000, 60_000), config, s); // 100g added, ignored
      expect(s).toMatchObject({ eatenG: 60, heldG: 0 });
    });

    it("checks a put-back first seen after the minute before ending", () => {
      let s = served();
      for (const g of [460, 420, 380, 340])
        s = run(steady(g, s.lowAt + 5000), undefined, s);
      const at = s.lowAt + 1000;
      s = run([reading(300, at)], undefined, s); // last 40g picked up
      // 20g comes back; the first stable reading lands just after the minute.
      s = run(steady(320, at + HAND_COUNT_MS + 500), undefined, s);
      expect(s).toMatchObject({ phase: "EATING", eatenG: 180, heldG: 0 });
    });

    it("keeps food in a hand apart from food that looked dumped", () => {
      let s = picked(); // 60g in a hand
      s = run(
        [reading(400, 24_000, false), reading(320, 25_000)],
        undefined,
        s,
      ); // 120g gone at once
      expect(s).toMatchObject({ heldG: 180, heldSuspect: true });
      s = run([reading(320, 20_000 + HAND_COUNT_MS)], undefined, s);
      expect(s).toMatchObject({ eatenG: 60, heldG: 120, heldSuspect: true });
    });

    it("gives each piece taken its own minute", () => {
      let s = picked(); // 60g at 20s
      s = run(
        [reading(430, 69_000, false), reading(400, 70_000)],
        undefined,
        s,
      ); // 40g more at 70s
      s = run([reading(400, 20_000 + HAND_COUNT_MS)], undefined, s);
      expect(s).toMatchObject({ eatenG: 60, heldG: 40 });
      s = run([reading(400, 70_000 + HAND_COUNT_MS)], undefined, s);
      expect(s).toMatchObject({ eatenG: 100, heldG: 0 });
    });

    it("ignores a small rise when nothing was taken", () => {
      let s = run(steady(503, 20_000), undefined, served());
      s = run(steady(500, 30_000), undefined, s);
      expect(s).toMatchObject({ eatenG: 0, lowG: 500 });
    });

    it("keeps the other piece held when one piece comes back whole", () => {
      let s = picked(); // 60g at 20s
      s = run(
        [reading(420, 24_000, false), reading(400, 25_000)],
        undefined,
        s,
      ); // 40g at 25s
      s = run(steady(440, 30_000), undefined, s); // the 40g comes back
      expect(s).toMatchObject({ eatenG: 0, heldG: 60 });
      s = run(steady(500, 40_000), undefined, s); // the 60g comes back
      expect(s).toMatchObject({ eatenG: 0, heldG: 0, foodG: 200 });
    });

    it("checks a refill before ending on the last piece's minute", () => {
      let s = served();
      for (const g of [460, 420, 380, 340])
        s = run(steady(g, s.lowAt + 5000), undefined, s);
      const at = s.lowAt + 1000;
      s = run([reading(300, at)], undefined, s); // last 40g picked up
      s = run(steady(400, at + HAND_COUNT_MS - 500), undefined, s); // 100g added
      expect(s).toMatchObject({ phase: "EATING", eatenG: 200, foodG: 300 });
    });

    it("counts a sandwich-only meal from what comes back", () => {
      // The whole 200g is picked up at once: looks like dumping until it comes back.
      let s = run(
        [reading(250, 19_000, false), reading(300, 20_000)],
        undefined,
        served(),
      );
      expect(s).toMatchObject({ eatenG: 0, heldG: 200, heldSuspect: true });
      s = run([reading(300, 20_000 + HAND_COUNT_MS * 5)], undefined, s);
      expect(s.eatenG).toBe(0); // suspected dumping is never counted by time
      s = run(steady(450, 400_000), undefined, s); // put back with 50g eaten
      expect(s).toMatchObject({ eatenG: 50, heldG: 0, heldSuspect: false });
    });

    it("does not end by itself while the last piece is in the hand", () => {
      let s = served();
      for (const g of [460, 420, 380, 340])
        s = run(steady(g, s.lowAt + 5000), undefined, s);
      s = run([reading(300, s.lowAt + 1000)], undefined, s); // last 40g picked up
      expect(s).toMatchObject({ phase: "EATING", heldG: 40 });
      s = run([reading(300, s.lowAt + HAND_COUNT_MS)], undefined, s);
      expect(s).toMatchObject({ phase: "ENDED", endedBy: "auto", eatenG: 200 });
    });

    it("counts the bread in the hand when the meal is ended", () => {
      const s = run([{ type: "end", by: "full_button" }], undefined, picked());
      expect(s).toMatchObject({ phase: "ENDED", eatenG: 60, heldG: 0 });
      expect(s.progress).toBe(0.3);
    });
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
