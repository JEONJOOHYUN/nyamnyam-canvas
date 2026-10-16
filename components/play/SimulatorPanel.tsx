"use client";

import { useState } from "react";
import type { MealState } from "@/lib/meal/machine";
import type { SimulatorSource } from "@/lib/weight/simulator";
import type { WeightReading } from "@/lib/weight/types";

const btn =
  "min-h-12 rounded-lg bg-white px-3 text-sm font-medium text-neutral-800 shadow-sm active:translate-y-px";

// Dev-only remote for the fake load cell (spec §2: slider, bite, press, lift, noise).
export function SimulatorPanel({
  sim,
  reading,
  meal,
  onReset,
}: {
  sim: SimulatorSource;
  reading: WeightReading | null;
  meal: MealState;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [, rerender] = useState(0);
  const act = (fn: () => void) => () => {
    fn();
    rerender((n) => n + 1);
  };

  return (
    <div className="fixed top-[calc(max(0.75rem,env(safe-area-inset-top))+2.25rem)] left-3 z-50 font-sans">
      <button type="button" className={btn} onClick={() => setOpen(!open)}>
        {open ? "시뮬레이터 닫기" : "🧪 시뮬레이터"}
      </button>
      {open && (
        <div className="mt-2 w-72 space-y-3 rounded-xl bg-neutral-100/95 p-3 text-sm text-neutral-800 shadow-lg backdrop-blur">
          <label className="block">
            음식 {Math.round(sim.foodG)}g
            <input
              type="range"
              min={0}
              max={500}
              step={5}
              value={sim.foodG}
              onChange={(e) => act(() => sim.setFood(Number(e.target.value)))()}
              className="block h-12 w-full"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={btn}
              onClick={act(() => sim.bite(15))}
            >
              한 입 (−15g)
            </button>
            <button
              type="button"
              className={btn}
              onClick={act(() => sim.press())}
            >
              꾹 누르기
            </button>
            <button
              type="button"
              className={btn}
              onClick={act(() =>
                sim.handG ? sim.putDown(20) : sim.pickUp(60),
              )}
            >
              {sim.handG ? "빵 내려놓기 (20g 먹음)" : "빵 들기 (60g)"}
            </button>
            <button
              type="button"
              className={btn}
              onClick={act(() => sim.setLifted(!sim.lifted))}
            >
              {sim.lifted ? "식판 내려놓기" : "식판 들기 (0g)"}
            </button>
            <button
              type="button"
              className={btn}
              onClick={act(() => sim.setNoise(!sim.noise))}
            >
              노이즈 ±2g {sim.noise ? "끄기" : "켜기"}
            </button>
            <button
              type="button"
              className={btn}
              onClick={act(() => void sim.sendCommand({ type: "tare" }))}
            >
              영점
            </button>
            <button type="button" className={btn} onClick={onReset}>
              식사 처음부터
            </button>
          </div>
          <p className="font-mono text-xs leading-relaxed">
            {reading
              ? `${reading.grams}g ${reading.stable ? "안정" : "흔들림"} #${reading.seq}`
              : "대기 중"}
            <br />
            {meal.phase} 식판 {meal.trayG ?? "-"}g 음식 {Math.round(meal.foodG)}
            g
            <br />
            먹음 {Math.round(meal.eatenG)}g 손·보류 {Math.round(meal.heldG)}g
            {meal.heldSuspect ? "(쏟음?)" : ""} {meal.lifted ? "(들림)" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
