"use client";

import { MotionConfig, useMotionValue } from "motion/react";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Chick } from "@/components/garden/Chick";
import { GardenScene, type ChickPose } from "@/components/garden/GardenScene";
import { visiblePieces } from "@/components/garden/growth";
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
import {
  DEFAULT_STAGE_THRESHOLDS,
  shouldPromptIdle,
  STAGE_COUNT,
  stageFor,
} from "@/lib/meal/stage";
import { createWeightSource } from "@/lib/weight";
import { SimulatorSource } from "@/lib/weight/simulator";
import type { WeightReading } from "@/lib/weight/types";
import { Confetti, Stamp } from "./Celebration";
import { SimulatorPanel } from "./SimulatorPanel";

// shortcut: parent settings arrive in stage 6; until then these are the spec defaults.
const SETTINGS = { showPercent: true, fullButton: true, stampAt: 0.7 };
const CHARACTER: CharacterId = "nyamnyam";
const SHOW_SIMULATOR = process.env.NODE_ENV !== "production";

// The scene finishes at the last stage threshold, when the completion cheer plays.
const SCENE_DONE_AT = DEFAULT_STAGE_THRESHOLDS[STAGE_COUNT - 1] / 100;
const PORTRAIT = "(orientation: portrait)";
const subscribePortrait = (onChange: () => void) => {
  const query = window.matchMedia(PORTRAIT);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

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
  const portrait = useSyncExternalStore(
    subscribePortrait,
    () => window.matchMedia(PORTRAIT).matches,
    () => false,
  );

  // Point at each newly added piece for a moment (adjusting state during render, no effect).
  const sceneProgress = Math.min(1, meal.progress / SCENE_DONE_AT);
  const pieceCount = visiblePieces(sceneProgress).length;
  const [seenPieces, setSeenPieces] = useState(pieceCount);
  const [pointing, setPointing] = useState(false);
  if (pieceCount !== seenPieces) {
    setSeenPieces(pieceCount);
    setPointing(pieceCount > 0);
  }
  useEffect(() => {
    if (!pointing) return;
    const t = setTimeout(() => setPointing(false), 2400);
    return () => clearTimeout(t);
  }, [pointing, seenPieces]);
  const pose: ChickPose = celebrating
    ? "celebrate"
    : meal.lifted || meal.phase === "ENDED"
      ? "wait"
      : pointing
        ? "point"
        : "hello";
  const pct = Math.round(meal.progress * 100);

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
      <main className="relative h-dvh select-none overflow-hidden bg-[#91dfff] font-kid text-[#244c50]">
        <GardenScene
          progress={sceneProgress}
          layout={portrait ? "tall" : "wide"}
          pose={pose}
          bubble={bubble}
          onChickTap={touch}
          mouth={mouth}
        />
        <span className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] rounded-full bg-white/70 px-3 py-1 font-sans text-xs text-[#245964]">
          {statusLabel}
        </span>
        {/* Top-right keeps the bottom of the scene, where pieces grow, uncovered. */}
        <div className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] flex flex-col items-end gap-3">
          <span
            role="progressbar"
            aria-label="먹은 만큼"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className={
              SETTINGS.showPercent
                ? "rounded-full bg-white/80 px-4 py-1 text-[clamp(1rem,3vmin,1.4rem)]"
                : "sr-only"
            }
          >
            {pct}%
          </span>
          {SETTINGS.fullButton && eating && (
            <button
              type="button"
              onClick={full}
              className="min-h-14 min-w-36 rounded-full border-2 border-white bg-[#006b86] px-6 text-[clamp(1.2rem,3.6vmin,1.6rem)] text-white shadow-[0_4px_0_#004759] active:translate-y-px"
            >
              배불러요
            </button>
          )}
          {meal.phase === "ENDED" && (
            <button
              type="button"
              onClick={reset}
              className="min-h-14 min-w-36 rounded-full border-2 border-white bg-[#3f9b3c] px-6 text-[clamp(1.2rem,3.6vmin,1.6rem)] text-white shadow-[0_4px_0_#2a6d28] active:translate-y-px"
            >
              새 그림 시작
            </button>
          )}
        </div>

        {celebrating && <Confetti />}
        {stamped && <Stamp />}

        {!started && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#d4f3ff] p-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <h1 className="text-[clamp(2.5rem,9vmin,4.5rem)] text-[#006b86]">
                냠냠캔버스
              </h1>
              <svg
                viewBox="-130 -240 260 270"
                aria-hidden="true"
                className="size-[clamp(9rem,32vmin,15rem)]"
              >
                <Chick pose="hello" />
              </svg>
              <button
                type="button"
                onClick={start}
                className="min-h-16 rounded-full bg-[#006b86] px-12 text-[clamp(1.6rem,5vmin,2.2rem)] text-white shadow-lg active:translate-y-px"
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
