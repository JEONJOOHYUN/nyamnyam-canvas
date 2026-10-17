"use client";

import { useEffect, useRef } from "react";
import type { GardenCharacterKey } from "@/components/garden/characters";
import type { GardenThemeKey } from "@/components/garden/themes";
import type { SimulatorSource } from "@/lib/weight/simulator";

// Auto demo (/demo/auto): a meal plays itself on the simulator, over and over, for an
// exhibition screen. It only moves the fake load cell, so the real filter, meal machine,
// cheers, celebration and stamp all run exactly as with a child at the table.

export const AUTO_ROUNDS: {
  character: GardenCharacterKey;
  theme: GardenThemeKey;
}[] = [
  { character: "nyamnyam", theme: "post" },
  { character: "pongdang", theme: "sea" },
  { character: "banjjak", theme: "space" },
];

// Timings follow the machine: a weight must hold 3s (+ ~1.5s filter settle) to count.
export const AUTO_TIMING = {
  traySettleMs: 5500, // empty tray found
  servedG: 200,
  servedSettleMs: 6500, // food counted as served
  biteG: 10, // small enough never to look like dumping (5% of the serving)
  biteEveryMs: 2200,
  afterMealMs: 11000, // completion cheer, confetti and stamp
} as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Plays one meal for `round` on `sim`, then calls onDone. A new round restarts it;
// leaving the page (or a new sim) cancels it.
export function useAutoMeal(
  sim: SimulatorSource | null,
  round: number,
  onDone: () => void,
) {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    if (!sim) return;
    let cancelled = false;
    const t = AUTO_TIMING;
    const run = async () => {
      sim.setLifted(false);
      sim.setNoise(false);
      sim.setFood(0);
      await sleep(t.traySettleMs);
      if (cancelled) return;
      sim.setFood(t.servedG);
      await sleep(t.servedSettleMs);
      while (!cancelled && sim.foodG > 0) {
        sim.bite(t.biteG);
        await sleep(t.biteEveryMs);
      }
      await sleep(t.afterMealMs);
      if (!cancelled) done.current();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [sim, round]);
}
