"use client";

import {
  CHARACTERS,
  type GardenCharacterKey,
} from "@/components/garden/characters";
import { GardenScene } from "@/components/garden/GardenScene";
import { THEMES, type GardenThemeKey } from "@/components/garden/themes";
import { Fragment } from "react";
import { BouncyTitle, StartDecor } from "./StartDecor";

// Cards of a step rise in one after another (globals.css .step-in).
const stepDelay = (i: number) => ({ animationDelay: `${60 + i * 40}ms` });

const THEME_COLOR: Record<GardenThemeKey, string> = {
  post: "#e8892b",
  sea: "#167f9d",
  space: "#6a4fc4",
};

// Two taps before the meal: who to eat with, then where to play (that friend's world first).
type Locked = { character: GardenCharacterKey; theme: GardenThemeKey };

export function StartScreen({
  ready,
  failed,
  onRetry,
  onDemo,
  character,
  locked,
  onLockedStart,
  onCharacter,
  onBack,
  onTheme,
  leaving = false,
}: {
  // False while a signed-in parent's settings are still loading.
  ready: boolean;
  // Settings could not be read: retry, or play without saving (demo).
  failed: boolean;
  onRetry: () => void;
  onDemo: () => void;
  character: GardenCharacterKey | null;
  // Parent fixed the friend and world: one start button instead of the two pickers.
  locked: Locked | null;
  onLockedStart: (locked: Locked) => void;
  onCharacter: (key: GardenCharacterKey) => void;
  onBack: () => void;
  onTheme: (key: GardenThemeKey) => void;
  // The meal has started: fade out over the scene (PlayScreen unmounts it right after).
  leaving?: boolean;
}) {
  const buddy = character && CHARACTERS[character].theme;
  const themes = (Object.keys(THEMES) as GardenThemeKey[]).toSorted(
    (a, b) => Number(b === buddy) - Number(a === buddy),
  );

  return (
    <div
      className={`start-screen fixed inset-0 z-50 overflow-hidden ${leaving ? "start-leave" : ""}`}
      inert={leaving}
    >
      <StartDecor />
      <div className="relative grid size-full place-items-center overflow-y-auto p-6">
        <div className="flex w-full flex-col items-center gap-[clamp(0.5rem,2.5vmin,1.5rem)] text-center">
          <BouncyTitle />

          {failed ? (
            <div role="alert" className="grid justify-items-center gap-3">
              <p className="text-[clamp(1.2rem,4vmin,1.6rem)]">
                보호자 설정을 불러오지 못했어요
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={onRetry}
                  className="tap-pop btn-solid min-h-12 rounded-full px-6 [--btn:#006b86]"
                >
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={onDemo}
                  className="tap-pop btn-plain min-h-12 rounded-full px-6 text-[#006b86]"
                >
                  기록 없이 시작
                </button>
              </div>
            </div>
          ) : !ready ? (
            <p role="status" className="text-[clamp(1.2rem,4vmin,1.6rem)]">
              준비하고 있어요…
            </p>
          ) : locked ? (
            <button
              type="button"
              onClick={() => onLockedStart(locked)}
              className="step-in flex w-[min(80vw,24rem)] flex-col overflow-hidden rounded-3xl border-4 bg-white shadow-lg tap-pop"
              style={{ borderColor: THEME_COLOR[locked.theme], ...stepDelay(0) }}
            >
              <span
                aria-hidden="true"
                className="theme-card-scene relative block aspect-[4/3] w-full"
              >
                <GardenScene
                  theme={locked.theme}
                  character={locked.character}
                  progress={1}
                  layout="wide"
                  pose="hello"
                  bubble={null}
                />
              </span>
              <span
                className="py-3 text-[clamp(1.4rem,4.5vmin,2rem)] text-white"
                style={{ background: THEME_COLOR[locked.theme] }}
              >
                시작하기
              </span>
            </button>
          ) : character === null ? (
            // Keyed per step so the question and cards play .step-in again on each step.
            <Fragment key="friends">
              <p className="step-in text-[clamp(1.4rem,4.5vmin,2rem)]">
                누구랑 먹을까?
              </p>
              <div className="flex w-full flex-wrap justify-center gap-4 portrait:flex-col portrait:items-center">
                {(Object.keys(CHARACTERS) as GardenCharacterKey[]).map(
                  (key, i) => {
                    const { Component, name, theme } = CHARACTERS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onCharacter(key)}
                        className="step-in flex w-[clamp(10rem,24vw,15rem)] flex-col items-center overflow-hidden rounded-3xl border-4 bg-white shadow-lg tap-pop portrait:w-[min(80vw,20rem)] portrait:flex-row"
                        style={{
                          borderColor: THEME_COLOR[theme],
                          ...stepDelay(i),
                        }}
                      >
                        <span className="start-chick block aspect-square w-full p-2 portrait:w-2/5">
                          <svg
                            viewBox="-130 -240 260 270"
                            aria-hidden="true"
                            className="size-full"
                          >
                            <Component pose="hello" />
                          </svg>
                        </span>
                        <span
                          className="w-full py-2 text-[clamp(1.3rem,3.8vmin,1.8rem)] text-white portrait:flex-1 portrait:self-stretch portrait:content-center"
                          style={{ background: THEME_COLOR[theme] }}
                        >
                          {name}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </Fragment>
          ) : (
            <Fragment key="worlds">
              <p className="step-in text-[clamp(1.4rem,4.5vmin,2rem)]">
                오늘은 어디로 놀러 갈까?
              </p>
              {/* One tap picks the world and starts the meal. */}
              <div className="flex w-full flex-wrap justify-center gap-4 portrait:flex-col portrait:items-center">
                {themes.map((key, i) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onTheme(key)}
                    className="step-in flex w-[clamp(11rem,26vw,17rem)] flex-col overflow-hidden rounded-3xl border-4 bg-white shadow-lg tap-pop portrait:w-[min(80vw,20rem)] portrait:flex-row portrait:items-center"
                    style={{ borderColor: THEME_COLOR[key], ...stepDelay(i) }}
                  >
                    <span
                      aria-hidden="true"
                      className="theme-card-scene relative block aspect-[4/3] w-full portrait:w-1/2"
                    >
                      <GardenScene
                        theme={key}
                        character={character}
                        progress={1}
                        layout="wide"
                        pose="hello"
                        bubble={null}
                      />
                    </span>
                    <span
                      className="px-3 py-2 text-[clamp(1.2rem,3.6vmin,1.6rem)] portrait:flex-1"
                      style={{ color: THEME_COLOR[key] }}
                    >
                      {THEMES[key].title}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onBack}
                className="step-in tap-pop btn-plain min-h-12 rounded-full px-5 text-[clamp(1rem,3vmin,1.3rem)] text-[#006b86]"
                style={stepDelay(themes.length)}
              >
                다른 친구 고르기
              </button>
            </Fragment>
          )}
        </div>
      </div>
    </div>
  );
}
