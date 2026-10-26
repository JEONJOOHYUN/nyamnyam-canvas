"use client";

import { useState } from "react";
import { AUTO_TIMING } from "./autoDemo";
import type { MealState } from "@/lib/meal/machine";
import {
  MAX_SPEED,
  MIN_SPEED,
  type SimulatorSource,
} from "@/lib/weight/simulator";

const SERVE_G = AUTO_TIMING.servedG;
const PRESETS = [1, 1.25, 1.5, 2, 3];
const STEP = 0.25;

const action =
  "min-h-12 rounded-xl bg-white/15 px-3 text-sm font-semibold text-white active:translate-y-px disabled:opacity-35";

// What the presenter should do next, in one line.
function hint(sim: SimulatorSource, meal: MealState) {
  if (meal.phase === "ENDED") return "식사가 끝났어요";
  if (!sim.trayOn) return "식판을 올려 주세요";
  if (meal.phase === "EMPTY_TRAY")
    return meal.trayG === null
      ? "식판 무게를 재는 중…"
      : sim.foodG > 0
        ? "음식 무게를 재는 중…"
        : "음식을 올려 주세요";
  if (sim.eatingLeftG > 0)
    return `먹는 중… ${Math.round(sim.eatingLeftG)}g 남음`;
  return `남은 음식 ${Math.round(sim.foodG)}g`;
}

// Demo-mode remote (/demo): the four steps of a meal plus a playback speed, nothing else.
export function DemoPanel({
  sim,
  meal,
  speed,
  onSpeed,
  onReset,
}: {
  sim: SimulatorSource;
  meal: MealState;
  speed: number;
  onSpeed: (v: number) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [eatG, setEatG] = useState("30");
  const [, rerender] = useState(0);
  const act = (fn: () => void) => () => {
    fn();
    rerender((n) => n + 1);
  };

  const left = Math.round(sim.foodG);
  const eatingNow = sim.eatingLeftG > 0;
  const servedReady =
    sim.trayOn && meal.phase === "EMPTY_TRAY" && meal.trayG !== null;
  const canEat =
    (meal.phase === "SERVED" || meal.phase === "EATING") &&
    !eatingNow &&
    left > 0;
  const grams = Math.round(Number(eatG));
  const eatValid = Number.isFinite(grams) && grams >= 1 && grams <= left;
  const setSpeed = (v: number) =>
    onSpeed(
      Math.round(Math.min(MAX_SPEED, Math.max(MIN_SPEED, v)) * 100) / 100,
    );

  return (
    <div className="fixed top-[calc(max(0.75rem,env(safe-area-inset-top))+2.25rem)] left-[max(0.75rem,env(safe-area-inset-left))] z-50 font-[system-ui,sans-serif]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="min-h-11 rounded-full bg-black/65 px-4 text-sm font-semibold text-white backdrop-blur"
      >
        {open ? "시연 도구 닫기" : "시연 도구"}
      </button>
      {open && (
        <div className="mt-2 w-[min(19rem,calc(100vw-1.5rem))] space-y-3 rounded-2xl bg-black/65 p-3 text-white shadow-lg backdrop-blur">
          <p className="text-sm" aria-live="polite">
            {hint(sim, meal)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={action}
              disabled={sim.trayOn}
              onClick={act(() => sim.setTray(true))}
            >
              식판 두기
            </button>
            <button
              type="button"
              className={action}
              disabled={!servedReady || sim.foodG > 0}
              onClick={act(() => sim.setFood(SERVE_G))}
            >
              음식 두기 ({SERVE_G}g)
            </button>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (canEat && eatValid) act(() => sim.eat(grams))();
            }}
          >
            <label className="flex min-h-12 flex-1 items-center gap-1 rounded-xl bg-white px-3 text-neutral-900">
              <span className="sr-only">먹을 양 (g)</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={Math.max(1, left)}
                value={eatG}
                onChange={(e) => setEatG(e.target.value)}
                className="w-full min-w-0 bg-transparent text-base outline-none"
              />
              <span className="text-sm text-neutral-500">g</span>
            </label>
            <button
              type="submit"
              className={`${action} shrink-0 bg-white/25`}
              disabled={!canEat || !eatValid}
            >
              음식 먹기
            </button>
          </form>
          <button
            type="button"
            className={`${action} w-full`}
            onClick={act(onReset)}
          >
            처음부터
          </button>

          <div className="space-y-2 border-t border-white/15 pt-3">
            <p className="text-sm text-white/80">재생 속도</p>
            <p className="text-center text-2xl font-bold tabular-nums">
              {speed.toFixed(2)}x
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="느리게"
                className="grid size-11 shrink-0 place-items-center rounded-full text-2xl disabled:opacity-35"
                disabled={speed <= MIN_SPEED}
                onClick={() => setSpeed(speed - STEP)}
              >
                −
              </button>
              <input
                type="range"
                aria-label="재생 속도"
                min={MIN_SPEED}
                max={MAX_SPEED}
                step={0.05}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="h-11 w-full min-w-0 accent-white"
              />
              <button
                type="button"
                aria-label="빠르게"
                className="grid size-11 shrink-0 place-items-center rounded-full text-2xl disabled:opacity-35"
                disabled={speed >= MAX_SPEED}
                onClick={() => setSpeed(speed + STEP)}
              >
                +
              </button>
            </div>
            <div className="flex justify-between gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={speed === p}
                  onClick={() => setSpeed(p)}
                  className={`min-h-10 flex-1 rounded-full text-sm font-semibold tabular-nums ${
                    speed === p ? "bg-white text-neutral-900" : "bg-white/15"
                  }`}
                >
                  {p % 1 ? String(p) : p.toFixed(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
