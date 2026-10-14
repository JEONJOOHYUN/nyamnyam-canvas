"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
} from "motion/react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Nyamnyam } from "@/components/characters/Nyamnyam";
import { ForestMap } from "@/components/maps/forest/ForestMap";
import { pickLine, type CharacterId, type LineKey } from "@/content/lines";
import { sfx, unlockAudio } from "@/lib/audio/sfx";
import { speak, stopSpeaking } from "@/lib/audio/voice";
import {
  defaultMealConfig,
  initialMealState,
  mealReducer,
  type MealEvent,
  type MealState,
} from "@/lib/meal/machine";
import { shouldPromptIdle, STAGE_COUNT, stageFor } from "@/lib/meal/stage";
import { createWeightSource } from "@/lib/weight";
import { SimulatorSource } from "@/lib/weight/simulator";
import type { WeightReading } from "@/lib/weight/types";
import { Confetti, Stamp } from "./Celebration";
import { Progress } from "./Progress";
import { SimulatorPanel } from "./SimulatorPanel";

// shortcut: parent settings arrive in stage 6; until then these are the spec defaults.
const SETTINGS = { showPercent: true, fullButton: true, stampAt: 0.7 };
const CHARACTER: CharacterId = "nyamnyam";
const SHOW_SIMULATOR = process.env.NODE_ENV !== "production";

type Action = MealEvent | { type: "reset" };
const reduce = (s: MealState, a: Action) =>
  a.type === "reset" ? initialMealState : mealReducer(s, a, defaultMealConfig);

export function PlayScreen() {
  const [source] = useState(createWeightSource);
  const [started, setStarted] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [reading, setReading] = useState<WeightReading | null>(null);
  const [meal, dispatch] = useReducer(reduce, initialMealState);
  const [bubble, setBubble] = useState<string | null>(null);
  const [celebrationOver, setCelebrationOver] = useState(false);
  const [stamped, setStamped] = useState(false);
  const mouth = useMotionValue(0);
  const turn = useRef(0);
  const prevStage = useRef(0);
  const idle = useRef({ changedAt: 0, promptAt: 0, count: 0 });

  const stage = stageFor(meal.progress);
  const eating = meal.phase === "SERVED" || meal.phase === "EATING";
  const celebrating = stage === STAGE_COUNT && !celebrationOver;

  const say = useCallback(
    (key: LineKey) => {
      const line = pickLine(CHARACTER, key, turn.current++);
      setBubble(line.text);
      return speak(CHARACTER, line, mouth);
    },
    [mouth],
  );

  useEffect(() => {
    if (!started) return;
    const off = source.subscribe((r) => {
      setReading(r);
      dispatch({ type: "reading", reading: r });
    });
    void source.connect();
    return () => {
      off();
      source.disconnect();
      stopSpeaking();
    };
  }, [started, source]);

  // Guide the grown-up through placing the tray, then cheer when food is served.
  const guide: LineKey | null = !greeted
    ? null
    : meal.phase === "EMPTY_TRAY"
      ? meal.trayG === null
        ? "trayEmpty"
        : "trayFood"
      : meal.phase === "SERVED"
        ? "serve"
        : null;
  useEffect(() => {
    if (guide) void say(guide);
  }, [guide, say]);

  // Stage up: chime, sparkle, jump and a cheer. Stage can only go up (progress is max-held).
  useEffect(() => {
    const prev = prevStage.current;
    prevStage.current = stage;
    if (stage <= prev) return;
    sfx.stageUp();
    setTimeout(sfx.sparkle, 300);
    const cheer = say(`stage${stage}` as LineKey);
    if (stage < STAGE_COUNT) return;
    setTimeout(sfx.complete, 600);
    let live = true;
    // Only follow up when the cheer finished on its own (not cut off by a tap or unmount).
    void cheer.then((finished) => {
      if (live && finished) void say("complete");
    });
    const t = setTimeout(() => setCelebrationOver(true), 3800);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [stage, say]);

  // Stamp for a meal that ended at or above the stamp threshold.
  useEffect(() => {
    if (meal.phase !== "ENDED" || meal.progress < SETTINGS.stampAt) return;
    const t = setTimeout(
      () => {
        setStamped(true);
        sfx.stamp();
      },
      meal.endedBy === "auto" ? 4000 : 300,
    );
    return () => clearTimeout(t);
  }, [meal.phase, meal.progress, meal.endedBy]);

  useEffect(() => {
    if (meal.lifted) void say("pause");
  }, [meal.lifted, say]);

  // Gentle prompts after a quiet spell, capped per meal so it never nags.
  useEffect(() => {
    idle.current.changedAt = Date.now();
  }, [meal.eatenG]);
  useEffect(() => {
    if (meal.phase === "SERVED")
      idle.current = { changedAt: Date.now(), promptAt: 0, count: 0 };
  }, [meal.phase]);
  useEffect(() => {
    if (!eating || meal.lifted) return;
    const id = setInterval(() => {
      const c = idle.current;
      const now = Date.now();
      if (!shouldPromptIdle(c.changedAt, c.promptAt, c.count, now)) return;
      c.promptAt = now;
      c.count++;
      void say("idle");
    }, 1000);
    return () => clearInterval(id);
  }, [eating, meal.lifted, say]);

  const start = () => {
    unlockAudio();
    sfx.tap();
    setStarted(true);
    // Speaking inside the tap also unlocks speech on iOS.
    void say("hello").then(() => setGreeted(true));
  };

  const full = () => {
    sfx.tap();
    dispatch({ type: "end", by: "full_button" });
    void say(meal.progress >= SETTINGS.stampAt ? "fullStamp" : "full");
  };

  const reset = () => {
    sfx.tap();
    setStamped(false);
    setCelebrationOver(false);
    dispatch({ type: "reset" });
  };

  const touch = () => {
    sfx.touch();
    void say("touch");
  };

  const statusLabel =
    source instanceof SimulatorSource
      ? "시뮬레이터"
      : source.status === "online"
        ? "연결됨"
        : "연결 중…";

  return (
    <MotionConfig reducedMotion="user">
      <main className="grid h-dvh select-none grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-[#8FD3FF] font-kid text-[#5B4636] landscape:grid-cols-[7fr_3fr] landscape:grid-rows-1">
        <section className="relative min-h-0 overflow-hidden">
          <ForestMap stage={stage} />
          <span className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] rounded-full bg-white/70 px-3 py-1 font-sans text-xs text-[#7A5C45]">
            {statusLabel}
          </span>
        </section>

        <aside className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-t-[2rem] bg-[#FFF8E8] px-[max(1rem,calc(50%-20rem))] pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(0,0,0,0.08)] landscape:grid-cols-1 landscape:content-center landscape:justify-items-center landscape:rounded-l-[2rem] landscape:rounded-tr-none landscape:pl-4 landscape:pr-[max(1rem,env(safe-area-inset-right))] landscape:shadow-[-6px_0_20px_rgba(0,0,0,0.08)]">
          <Nyamnyam
            mouth={mouth}
            jump={stage}
            dancing={celebrating}
            onTouch={touch}
            className="size-[clamp(6.5rem,24vmin,13rem)]"
          />
          <div
            className="min-h-[3.5rem] landscape:order-first landscape:w-full"
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              {bubble && (
                <motion.p
                  key={bubble}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="relative rounded-3xl bg-white px-4 py-3 text-center text-[clamp(1.15rem,3.6vmin,1.75rem)] leading-snug break-keep text-balance shadow-sm"
                >
                  {bubble}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="col-span-2 w-full landscape:col-span-1">
            <Progress
              progress={meal.progress}
              stage={stage}
              showPercent={SETTINGS.showPercent}
            />
          </div>
          <div className="col-span-2 flex w-full justify-center gap-3 landscape:col-span-1">
            {SETTINGS.fullButton && eating && (
              <button
                type="button"
                onClick={full}
                className="min-h-14 flex-1 rounded-full bg-[#FF9A3C] px-6 text-[clamp(1.2rem,3.6vmin,1.6rem)] text-white shadow-md active:translate-y-px"
              >
                배불러요
              </button>
            )}
            {meal.phase === "ENDED" && (
              <button
                type="button"
                onClick={reset}
                className="min-h-14 flex-1 rounded-full bg-[#6CC36A] px-6 text-[clamp(1.2rem,3.6vmin,1.6rem)] text-white shadow-md active:translate-y-px"
              >
                새 그림 시작
              </button>
            )}
          </div>
        </aside>

        {celebrating && <Confetti />}
        {stamped && <Stamp />}

        {!started && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#FFF8E8] p-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <h1 className="text-[clamp(2.5rem,9vmin,4.5rem)] text-[#F4A62A]">
                냠냠캔버스
              </h1>
              <Nyamnyam
                mouth={mouth}
                jump={0}
                className="size-[clamp(9rem,32vmin,15rem)]"
              />
              <button
                type="button"
                onClick={start}
                className="min-h-16 rounded-full bg-[#FF9A3C] px-12 text-[clamp(1.6rem,5vmin,2.2rem)] text-white shadow-lg active:translate-y-px"
              >
                시작하기
              </button>
            </div>
          </div>
        )}

        {SHOW_SIMULATOR && started && source instanceof SimulatorSource && (
          <SimulatorPanel
            sim={source}
            reading={reading}
            meal={meal}
            onReset={reset}
          />
        )}
      </main>
    </MotionConfig>
  );
}
