"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
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
  // The celebration runs in real time (stamp 4s after the end), so a faster round still
  // leaves this long to see it.
  minAfterMealMs: 7000,
} as const;

// Playback speeds offered on the start tap; the round's waits are divided by it.
export const AUTO_SPEEDS = [1, 1.25, 1.5, 2, 3] as const;
const SPEED_KEY = "nyamnyam.autoDemoSpeed";
let pickedSpeed: number | null = null; // kept here too, in case storage is blocked
const speedListeners = new Set<() => void>();

const isSpeed = (v: number) => (AUTO_SPEEDS as readonly number[]).includes(v);
function readSpeed() {
  if (pickedSpeed !== null) return pickedSpeed;
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return isSpeed(v) ? v : 1;
  } catch {
    return 1;
  }
}
function subscribeSpeed(cb: () => void) {
  speedListeners.add(cb);
  return () => {
    speedListeners.delete(cb);
  };
}
export function setAutoSpeed(v: number) {
  if (!isSpeed(v)) return;
  pickedSpeed = v;
  try {
    localStorage.setItem(SPEED_KEY, String(v));
  } catch {
    // remembered for this visit only
  }
  speedListeners.forEach((cb) => cb());
}
// The speed picked on this device (1 until the client knows).
export const useAutoSpeed = () =>
  useSyncExternalStore(subscribeSpeed, readSpeed, () => 1);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Plays one meal for `round` on `sim` at `speed`, then calls onDone. A new round restarts
// it; leaving the page (or a new sim) cancels it. The simulator's clock runs at the same
// speed (PlayScreen sets it), so every wait here is divided by it.
export function useAutoMeal(
  sim: SimulatorSource | null,
  round: number,
  speed: number,
  onDone: () => void,
) {
  const done = useRef(onDone);
  const rate = useRef(speed);
  useEffect(() => {
    done.current = onDone;
    rate.current = speed;
  });

  useEffect(() => {
    if (!sim) return;
    let cancelled = false;
    const t = AUTO_TIMING;
    const wait = (ms: number) => sleep(ms / rate.current);
    const run = async () => {
      sim.setLifted(false);
      sim.setNoise(false);
      sim.setFood(0);
      await wait(t.traySettleMs);
      if (cancelled) return;
      sim.setFood(t.servedG);
      await wait(t.servedSettleMs);
      while (!cancelled && sim.foodG > 0) {
        sim.bite(t.biteG);
        await wait(t.biteEveryMs);
      }
      await sleep(Math.max(t.afterMealMs / rate.current, t.minAfterMealMs));
      if (!cancelled) done.current();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [sim, round]);
}
