"use client";

import { Maximize } from "lucide-react";
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
import { THEMES, type GardenThemeKey } from "@/components/garden/themes";
import { visiblePieces } from "@/components/garden/growth";
import { pickLine, type LineKey } from "@/content/lines";
import { sfx, unlockAudio } from "@/lib/audio/sfx";
import { speak, stopSpeaking } from "@/lib/audio/voice";
import { setSfxVolume } from "@/lib/audio/sfx";
import { setVoiceRate, setVoiceVolume } from "@/lib/audio/voice";
import {
  initialMealState,
  mealReducer,
  NEAR_ZERO_G,
  type MealEvent,
  type MealState,
} from "@/lib/meal/machine";
import {
  EMPTY_CARRY,
  mealCompleted,
  nextCarry,
  pictureProgress,
  stageProgress,
  type PictureCarry,
} from "@/lib/meal/picture";
import {
  sceneFor,
  shouldPromptIdle,
  STAGE_COUNT,
  stageFor,
} from "@/lib/meal/stage";
import {
  loadPlayConfig,
  loadUnsaved,
  newId,
  saveMeal,
  storeUnsaved,
  type MealSave,
} from "@/lib/parent/data";
import { DEFAULT_SETTINGS, type PlaySettings } from "@/lib/parent/settings";
import { enterFullscreen, useCanGoFullscreen, useWakeLock } from "@/lib/screen";
import { getSupabase } from "@/lib/supabase/client";
import type { ChildRow } from "@/lib/supabase/types";
import {
  choiceKey,
  createWeightSource,
  offlineChoice,
  resolveWeightChoice,
  type WeightChoice,
} from "@/lib/weight";
import { SimulatorSource } from "@/lib/weight/simulator";
import type { WeightReading, WeightSource } from "@/lib/weight/types";
import { Confetti, Stamp } from "./Celebration";
import {
  AUTO_ROUNDS,
  setAutoSpeed,
  useAutoMeal,
  useAutoSpeed,
} from "./autoDemo";
import { AutoDemoStart } from "./AutoDemoStart";
import { DemoPanel } from "./DemoPanel";
import { SimulatorPanel } from "./SimulatorPanel";
import { StartScreen } from "./StartScreen";

// Vercel Preview deploys (dev branch) keep the simulator so the screen can be tried on a tablet.
const SHOW_SIMULATOR =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

const PORTRAIT = "(orientation: portrait)";
const subscribePortrait = (onChange: () => void) => {
  const query = window.matchMedia(PORTRAIT);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

type Action = MealEvent | { type: "reset" };
type Config = {
  settings: PlaySettings;
  child: ChildRow | null;
  carry: PictureCarry;
};
const DEMO: Config = {
  settings: DEFAULT_SETTINGS,
  child: null,
  carry: EMPTY_CARRY,
};
const lastThreshold = (s: PlaySettings) => s.stageThresholds[STAGE_COUNT - 1];
const baselineStage = ({ settings, carry }: Config) =>
  stageFor(
    stageProgress(
      settings,
      pictureProgress(settings, carry, { progress: 0, eatenG: 0 }),
      lastThreshold(settings),
    ),
    settings.stageThresholds,
  );

// The start overlay stays this long after the meal starts so it can fade out (.start-leave).
const START_LEAVE_MS = 240;
// A stage cheer waits for the chime and the new piece settling (550ms), so the voice never
// talks over them; the last one waits for the fanfare's main chord.
const CHEER_DELAY_MS = 700;
const FINALE_CHEER_DELAY_MS = 1200;

// True for a moment after `started` turns on. Set while rendering (not in an effect) so the
// overlay never disappears for a frame before it fades.
function useLeaving(started: boolean) {
  const [leaving, setLeaving] = useState(false);
  const [was, setWas] = useState(started);
  if (was !== started) {
    setWas(started);
    setLeaving(started);
  }
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setLeaving(false), START_LEAVE_MS);
    return () => clearTimeout(id);
  }, [leaving]);
  return leaving;
}

// Demo mode (/demo) never touches the parent's account: no settings, no saved meals.
const dbOf = (demo: boolean) => (demo ? null : getSupabase());

const statusText = (source: WeightSource, demo: boolean, auto: boolean) =>
  auto
    ? "자동 시연"
    : demo
      ? "시연 모드"
      : source instanceof SimulatorSource
        ? "시뮬레이터"
        : source.status === "online"
          ? "저울 연결됨"
          : source.status === "connecting"
            ? "저울 찾는 중…"
            : "저울을 기다리고 있어요";

export function PlayScreen({
  demo: demoProp = false,
  auto = false,
}: {
  demo?: boolean;
  // Auto demo (/demo/auto): meals play themselves, round after round (autoDemo.ts).
  auto?: boolean;
}) {
  const demo = demoProp || auto;
  // The simulator stands in (same on server and client) until this device's pick is
  // known: from the parent's account once loaded, or at the start tap without Supabase.
  const [weight, setWeight] = useState(() => ({
    key: "simulator",
    source: createWeightSource({ kind: "simulator" }, null),
  }));
  const source = weight.source;
  const applyWeight = useCallback(
    (choice: WeightChoice) => {
      const key = choiceKey(choice);
      setWeight((w) =>
        w.key === key
          ? w
          : { key, source: createWeightSource(choice, dbOf(demo)) },
      );
    },
    [demo],
  );
  const subscribeStatus = useCallback(
    (cb: () => void) => source.onStatus(cb),
    [source],
  );
  const statusLabel = useSyncExternalStore(
    subscribeStatus,
    () => statusText(source, demo, auto),
    () => statusText(source, demo, auto),
  );
  // Demo defaults until (and unless) a signed-in parent's child settings load.
  const [config, setConfig] = useState<Config>(DEMO);
  const { settings, carry } = config;
  // A signed-in parent's settings must be in place before the child can start.
  const [ready, setReady] = useState(() => dbOf(demo) === null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Meals whose save failed, kept until a retry goes through.
  // Finished meals not yet confirmed by the server, mirrored in localStorage.
  const [unsaved, setUnsaved] = useState<MealSave[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);
  // The signed-in parent the queue belongs to (null in demo).
  const userId = useRef<string | null>(null);
  const updateUnsaved = (change: (list: MealSave[]) => MealSave[]) =>
    setUnsaved((list) => {
      const next = change(list);
      if (userId.current) storeUnsaved(userId.current, next);
      return next;
    });
  const [character, setCharacter] = useState<GardenCharacterKey | null>(null);
  const [theme, setTheme] = useState<GardenThemeKey | null>(null);
  const started = theme !== null;
  const leavingStart = useLeaving(started);
  // The screen stays on from the first tap on a theme until the page is left.
  useWakeLock(started);
  const canFullscreen = useCanGoFullscreen();
  const [greeted, setGreeted] = useState(false);
  const [reading, setReading] = useState<WeightReading | null>(null);
  const [meal, dispatch] = useReducer(
    (s: MealState, a: Action) =>
      a.type === "reset" ? initialMealState : mealReducer(s, a, settings),
    initialMealState,
  );
  const [bubble, setBubble] = useState<string | null>(null);
  const [celebrationOver, setCelebrationOver] = useState(false);
  const [stamped, setStamped] = useState(false);
  const mouth = useMotionValue(0);
  const turn = useRef(0);
  const pick = useRef(0);
  const prevStage = useRef(0);
  const idle = useRef({ changedAt: 0, promptAt: 0, count: 0 });
  // The "resting" line while the tray is up, and the turn right after it (any later line moves it).
  const pauseLine = useRef<{ said: Promise<boolean>; turn: number } | null>(
    null,
  );
  const servedAt = useRef(0);
  // Applied on "new meal", never while the finished meal is still on screen.
  const pendingCarry = useRef<PictureCarry | null>(null);
  const saved = useRef(false);

  // Picture progress under the parent's completion mode (A/B/C), never below what's carried.
  const thresholds = settings.stageThresholds;
  const picture = pictureProgress(settings, carry, meal);
  const staged = stageProgress(settings, picture, lastThreshold(settings));
  const stage = stageFor(staged, thresholds);
  const eating = meal.phase === "SERVED" || meal.phase === "EATING";
  const celebrating = stage === STAGE_COUNT && !celebrationOver;
  const portrait = useSyncExternalStore(
    subscribePortrait,
    () => window.matchMedia(PORTRAIT).matches,
    () => false,
  );

  useEffect(() => {
    const db = dbOf(demo);
    if (!db) return;
    let live = true;
    // The page keeps its state across visits (cacheComponents) and this effect runs again
    // on every return, so each visit starts over from fresh settings and the start screen:
    // the parent may have switched the child, the lock, or the mode, and saved meals are
    // already in the carry the server returns.
    const restart = (next: Config) => {
      stopSpeaking();
      pick.current++;
      pendingCarry.current = null;
      saved.current = false;
      setTheme(null);
      setCharacter(null);
      setGreeted(false);
      setStamped(false);
      setCelebrationOver(false);
      setBubble(null);
      dispatch({ type: "reset" });
      // Stages already earned by earlier meals are not cheered again.
      prevStage.current = baselineStage(next);
      setConfig(next);
    };
    // Meals left over from an earlier visit go to the server first, so the picture carry
    // rebuilt from the server includes them. If any still fail, progress can't be trusted.
    const flushThenLoad = async () => {
      const { data } = await db.auth.getSession();
      const uid = data.session?.user.id ?? null;
      userId.current = uid;
      if (!uid) return { config: null, weight: offlineChoice() };
      const pending = loadUnsaved(uid);
      const results = await Promise.allSettled(
        pending.map((r) => saveMeal(db, r)),
      );
      const left = pending.filter((_, i) => results[i].status === "rejected");
      storeUnsaved(uid, left);
      if (left.length) throw new Error(`${left.length} meal(s) still unsaved`);
      const [config, weight] = await Promise.all([
        loadPlayConfig(db),
        resolveWeightChoice(db),
      ]);
      return { config, weight };
    };
    flushThenLoad()
      .then((loaded) => {
        if (!live) return;
        applyWeight(loaded.weight);
        restart(loaded.config ?? DEMO);
        setUnsaved([]);
        setSaveFailed(false);
        setReady(true);
      })
      .catch((e: unknown) => {
        if (!live) return;
        console.warn("parent settings not loaded", e);
        // Never carry on with the previous child's settings; ask to retry or demo.
        applyWeight(offlineChoice());
        restart(DEMO);
        setLoadFailed(true);
      });
    return () => {
      live = false;
      // Leaving (or the page being hidden for another route): stop the session now, so
      // nothing plays on with stale settings until the next visit has loaded fresh ones.
      restart(DEMO);
      setReady(false);
      setLoadFailed(false);
    };
  }, [attempt, applyWeight, demo]);

  useEffect(() => {
    setSfxVolume(settings.sfxVolume);
    setVoiceVolume(settings.voiceVolume);
  }, [settings.sfxVolume, settings.voiceVolume]);

  // Each stage cheer lands with the piece it names; the scene finishes at the last threshold.
  // Point at each newly added piece for a moment (adjusting state during render, no effect).
  const sceneProgress = sceneFor(staged, thresholds);
  const pieceCount = visiblePieces(
    sceneProgress,
    THEMES[theme ?? "post"].events,
  ).length;
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
  const pct = Math.round(picture * 100);

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
        ? meal.trayG !== null
          ? "trayFood"
          : // Only ask for the tray while the scale is empty: one already on it is still
            // being weighed (3s hold), and asking would be cut off by "trayFood".
            reading && reading.grams <= NEAR_ZERO_G
            ? "trayEmpty"
            : null
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
    const last = stage === STAGE_COUNT;
    if (last) setTimeout(sfx.complete, 600);
    let live = true;
    // A quicker next stage replaces a cheer that hasn't started yet, and any line said in
    // the meantime (배불러요, a tap) wins over it.
    const at = turn.current;
    const talk = setTimeout(
      () => {
        if (turn.current !== at) return;
        const cheer = say(`stage${stage}` as LineKey);
        // Only follow up when the cheer finished on its own (not cut off by a tap or unmount).
        if (last)
          void cheer.then((finished) => {
            if (live && finished) void say("complete");
          });
      },
      last ? FINALE_CHEER_DELAY_MS : CHEER_DELAY_MS,
    );
    const over = last
      ? setTimeout(() => setCelebrationOver(true), 3800)
      : undefined;
    return () => {
      live = false;
      clearTimeout(talk);
      clearTimeout(over);
    };
  }, [stage, say]);

  const stampEarned = meal.progress * 100 >= settings.stampPct;
  useEffect(() => {
    if (meal.phase === "SERVED") servedAt.current = Date.now();
  }, [meal.phase]);

  // Record the finished meal once, and queue what it adds to the next meal's picture.
  const pictureDone = stage === STAGE_COUNT;
  const ended = meal.phase === "ENDED";
  useEffect(() => {
    if (!ended || saved.current) return;
    saved.current = true;
    const completed = mealCompleted(
      settings,
      meal.progress,
      thresholds[STAGE_COUNT - 1],
    );
    const id = newId();
    pendingCarry.current = nextCarry(
      settings,
      carry,
      { id, progress: meal.progress, eatenG: meal.eatenG, completed },
      pictureDone,
    );
    const db = dbOf(demo);
    const { child } = config;
    if (!db || !child || meal.foodG === 0) return;
    const now = new Date();
    const record: MealSave = {
      meal: {
        id,
        child_id: child.id,
        started_at: new Date(servedAt.current || now.getTime()).toISOString(),
        ended_at: now.toISOString(),
        served_g: Math.round(meal.foodG),
        eaten_g: Math.round(meal.eatenG),
        max_progress: Math.min(1, meal.progress),
        completed,
        ended_by: meal.endedBy ?? "auto",
      },
      picture: pictureDone
        ? {
            id: newId(),
            map: theme ?? child.theme_map,
            character: character ?? child.theme_character,
            earlierMealIds: carry.mealIds,
          }
        : null,
      stamp: stampEarned,
    };
    // Kept on the device before the request, so closing the tab mid-save loses nothing.
    updateUnsaved((list) => [...list, record]);
    saveMeal(db, record)
      .then(() => updateUnsaved((list) => list.filter((r) => r.meal.id !== id)))
      .catch((e: unknown) => {
        console.warn("meal not saved", e);
        setSaveFailed(true);
      });
    // Runs once per meal: the guard above keeps later renders from saving again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  // Stamp for a meal that ended at or above the stamp threshold.
  useEffect(() => {
    if (meal.phase !== "ENDED" || !stampEarned) return;
    const t = setTimeout(
      () => {
        setStamped(true);
        sfx.stamp();
      },
      meal.endedBy === "auto" ? 4000 : 300,
    );
    return () => clearTimeout(t);
  }, [meal.phase, stampEarned, meal.endedBy]);

  useEffect(() => {
    if (meal.lifted) {
      const said = say("pause");
      pauseLine.current = { said, turn: turn.current };
      return;
    }
    const resting = pauseLine.current;
    if (!resting) return;
    pauseLine.current = null;
    // Tray back: the quiet spell starts over (lifted time is not idle time), and the
    // "resting" bubble goes once it has been said, unless another line took its place.
    idle.current.changedAt = Date.now();
    void resting.said.then(() => {
      if (turn.current === resting.turn) setBubble(null);
    });
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
      if (
        !shouldPromptIdle(
          c.changedAt,
          c.promptAt,
          c.count,
          now,
          settings.idleSeconds,
          settings.idleMaxPrompts,
        )
      )
        return;
      c.promptAt = now;
      c.count++;
      void say("idle");
    }, 1000);
    return () => clearInterval(id);
  }, [eating, meal.lifted, say, settings.idleSeconds, settings.idleMaxPrompts]);

  const pickCharacter = (chosen: GardenCharacterKey) => {
    unlockAudio();
    sfx.tap();
    setCharacter(chosen);
    // The tray guide waits for this greeting (the auto demo picks again with one done).
    setGreeted(false);
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
    if (!dbOf(demo))
      applyWeight(demo ? { kind: "simulator" } : offlineChoice());
    setTheme(chosen);
  };

  const full = () => {
    sfx.tap();
    dispatch({ type: "end", by: "full_button" });
    void say(stampEarned ? "fullStamp" : "full");
  };

  const reset = () => {
    sfx.tap();
    setStamped(false);
    setCelebrationOver(false);
    const next = pendingCarry.current;
    pendingCarry.current = null;
    saved.current = false;
    if (next) {
      const nextConfig = { ...config, carry: next };
      prevStage.current = baselineStage(nextConfig);
      setConfig(nextConfig);
    }
    dispatch({ type: "reset" });
  };

  // Hand-driven demo (/demo): it starts on an empty scale (the presenter places the tray,
  // then the food) and has a playback speed for the simulator's clock and the voices.
  const manualDemo = demo && !auto;
  const demoSim =
    manualDemo && source instanceof SimulatorSource ? source : null;
  const [speed, setSpeed] = useState(1);
  // The auto demo's speed is picked on its start tap and remembered on this device.
  const autoSpeed = useAutoSpeed();
  const playSpeed = manualDemo ? speed : auto ? autoSpeed : 1;
  const speedSim = demo && source instanceof SimulatorSource ? source : null;
  useEffect(() => {
    if (!speedSim) return;
    speedSim.setSpeed(playSpeed);
    setVoiceRate(playSpeed);
    return () => setVoiceRate(1);
  }, [speedSim, playSpeed]);
  useEffect(() => {
    if (!demoSim || !started) return;
    demoSim.stopEating();
    demoSim.setFood(0);
    demoSim.setTray(false);
    // Leaving keeps the page state (cacheComponents) and this runs again on the way back:
    // the meal starts over too, so it never disagrees with the emptied scale.
    return () => {
      prevStage.current = 0;
      pendingCarry.current = null;
      setStamped(false);
      setCelebrationOver(false);
      dispatch({ type: "reset" });
    };
  }, [demoSim, started]);
  // A new meal clears the plate; "처음부터" also takes the tray off.
  const newMeal = () => {
    demoSim?.stopEating();
    demoSim?.setFood(0);
    reset();
  };
  const demoRestart = () => {
    demoSim?.setTray(false);
    newMeal();
  };

  // Auto demo: the next friend and world once a meal and its celebration are over.
  const [round, setRound] = useState(0);
  useAutoMeal(
    auto && started && source instanceof SimulatorSource ? source : null,
    round,
    autoSpeed,
    () => {
      reset();
      const next = AUTO_ROUNDS[(round + 1) % AUTO_ROUNDS.length];
      pickCharacter(next.character);
      setTheme(next.theme);
      setRound(round + 1);
    },
  );

  // The page keeps its state when left and revisited (cacheComponents), but the loop
  // starts over: so leaving the auto demo returns it to the start tap with a fresh meal.
  useEffect(() => {
    if (!auto) return;
    return () => {
      stopSpeaking();
      prevStage.current = 0;
      pendingCarry.current = null;
      setTheme(null);
      setCharacter(null);
      setGreeted(false);
      setStamped(false);
      setCelebrationOver(false);
      setBubble(null);
      dispatch({ type: "reset" });
      setRound(0);
    };
  }, [auto]);

  // Retries are safe: every row carries its own id and saves are insert-or-skip.
  const retrySaves = () => {
    const db = dbOf(demo);
    if (!db) return;
    setSaveFailed(false);
    for (const record of unsaved)
      saveMeal(db, record)
        .then(() =>
          updateUnsaved((list) =>
            list.filter((r) => r.meal.id !== record.meal.id),
          ),
        )
        .catch((e: unknown) => {
          console.warn("meal still not saved", e);
          setSaveFailed(true);
        });
  };

  const touch = () => {
    sfx.touch();
    void say("touch");
  };

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
          <span className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] rounded-full bg-white/70 px-3 py-1 font-kid text-xs text-[#245964]">
            {statusLabel}
          </span>
          {saveFailed && unsaved.length > 0 && (
            <button
              type="button"
              onClick={retrySaves}
              className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[calc(max(0.75rem,env(safe-area-inset-top))+2.25rem)] min-h-11 rounded-full bg-white/90 px-4 font-kid text-sm text-[#7a4b00]"
            >
              기록 {unsaved.length}개 저장 안 됨 · 다시 저장
            </button>
          )}
          {/* Top-right keeps the bottom of the scene, where pieces grow, uncovered. */}
          <div className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] flex flex-col items-end gap-3">
            <span
              role="progressbar"
              aria-label={
                settings.mode === "amount" ? "먹은 만큼" : "그림 완성까지"
              }
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className={
                settings.showPercent
                  ? "rounded-full bg-white/80 px-4 py-1 text-[clamp(1rem,3vmin,1.4rem)]"
                  : "sr-only"
              }
            >
              {pct}%
            </span>
            {settings.fullButton && eating && !auto && (
              <button
                type="button"
                onClick={full}
                className="tap-pop btn-solid min-h-14 min-w-36 rounded-full border-2 border-white/90 px-6 text-[clamp(1.2rem,3.6vmin,1.6rem)] [--btn:#006b86]"
              >
                배불러요
              </button>
            )}
            {meal.phase === "ENDED" && !auto && (
              <button
                type="button"
                onClick={newMeal}
                className="tap-pop btn-solid min-h-14 min-w-36 rounded-full border-2 border-white/90 px-6 text-[clamp(1.2rem,3.6vmin,1.6rem)] [--btn:#3f9b3c]"
              >
                {pictureDone || settings.mode === "amount"
                  ? "새 그림 시작"
                  : "다음 식사"}
              </button>
            )}
          </div>
        </div>

        {celebrating && <Confetti />}
        {stamped && <Stamp />}

        {!started && canFullscreen && !auto && (
          <button
            type="button"
            onClick={enterFullscreen}
            aria-label="전체화면으로 보기"
            className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-[60] tap-pop grid size-11 place-items-center rounded-full bg-white/80 text-[#245964] shadow-sm"
          >
            <Maximize className="size-5" />
          </button>
        )}

        {(!started || leavingStart) && auto && (
          <AutoDemoStart
            leaving={started}
            speed={autoSpeed}
            onSpeed={setAutoSpeed}
            onStart={() => {
              if (canFullscreen) enterFullscreen();
              const first = AUTO_ROUNDS[0];
              pickCharacter(first.character);
              start(first.theme);
            }}
          />
        )}

        {(!started || leavingStart) && !auto && (
          <StartScreen
            leaving={started}
            ready={ready}
            failed={loadFailed}
            onRetry={() => {
              setLoadFailed(false);
              setAttempt((n) => n + 1);
            }}
            onDemo={() => {
              setLoadFailed(false);
              setReady(true);
            }}
            character={character}
            locked={
              config.child && !settings.childPicksTheme
                ? {
                    character: config.child.theme_character,
                    theme: config.child.theme_map,
                  }
                : null
            }
            onLockedStart={(locked) => {
              pickCharacter(locked.character);
              start(locked.theme);
            }}
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

        {started && demoSim && (
          <DemoPanel
            sim={demoSim}
            meal={meal}
            speed={speed}
            onSpeed={setSpeed}
            onReset={demoRestart}
          />
        )}
        {SHOW_SIMULATOR &&
          !demo &&
          started &&
          source instanceof SimulatorSource && (
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
