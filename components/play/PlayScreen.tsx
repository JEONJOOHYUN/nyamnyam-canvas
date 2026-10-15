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
import type { GardenCharacterKey } from "@/components/garden/characters";
import { GardenScene, type ChickPose } from "@/components/garden/GardenScene";
import type { GardenThemeKey } from "@/components/garden/themes";
import { visiblePieces } from "@/components/garden/growth";
import { pickLine, type LineKey } from "@/content/lines";
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
import { StartScreen } from "./StartScreen";

// shortcut: parent settings arrive in stage 6; until then these are the spec defaults.
const SETTINGS = { showPercent: true, fullButton: true, stampAt: 0.7 };
// Vercel Preview deploys (dev branch) keep the simulator so the screen can be tried on a tablet.
const SHOW_SIMULATOR =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

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
  const [character, setCharacter] = useState<GardenCharacterKey | null>(null);
  const [theme, setTheme] = useState<GardenThemeKey | null>(null);
  const started = theme !== null;
  const [greeted, setGreeted] = useState(false);
  const [reading, setReading] = useState<WeightReading | null>(null);
  const [meal, dispatch] = useReducer(reduce, initialMealState);
  const [bubble, setBubble] = useState<string | null>(null);
  const [celebrationOver, setCelebrationOver] = useState(false);
  const [stamped, setStamped] = useState(false);
  const mouth = useMotionValue(0);
  const turn = useRef(0);
  const pick = useRef(0);
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
      const who = character ?? "nyamnyam";
      const line = pickLine(who, key, turn.current++, theme ?? "post");
      setBubble(line.text);
      return speak(who, line, mouth);
    },
    [mouth, character, theme],
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
    };
  }, [started, source]);

  // The greeting already talks on the start screen, so silence on any unmount.
  useEffect(() => stopSpeaking, []);

  // Guide the grown-up through placing the tray, then cheer when food is served.
  const guide: LineKey | null =
    !started || !greeted
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

  const pickCharacter = (chosen: GardenCharacterKey) => {
    unlockAudio();
    sfx.tap();
    setCharacter(chosen);
    // Greet in the chosen voice right inside the tap, which also unlocks speech on iOS.
    const line = pickLine(chosen, "hello");
    setBubble(line.text);
    // Only the latest pick opens the guide, however its greeting ends; one left
    // behind by "back" or a re-pick is ignored.
    const id = ++pick.current;
    void speak(chosen, line, mouth).then(() => {
      if (pick.current === id) setGreeted(true);
    });
  };

  const start = (chosen: GardenThemeKey) => {
    sfx.tap();
    setTheme(chosen);
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
        {/* Behind the start screen the meal scene is out of reach for taps and screen readers. */}
        <div className="contents" inert={!started} aria-hidden={!started}>
          <GardenScene
            theme={theme ?? "post"}
            character={character ?? "nyamnyam"}
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
        </div>

        {celebrating && <Confetti />}
        {stamped && <Stamp />}

        {!started && (
          <StartScreen
            character={character}
            onCharacter={pickCharacter}
            onBack={() => {
              sfx.tap();
              pick.current++;
              stopSpeaking();
              setGreeted(false);
              setCharacter(null);
            }}
            onTheme={start}
          />
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
