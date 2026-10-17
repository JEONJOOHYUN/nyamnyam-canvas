"use client";

import {
  CHARACTERS,
  type GardenCharacterKey,
} from "@/components/garden/characters";
import { GardenScene } from "@/components/garden/GardenScene";
import { THEMES, type GardenThemeKey } from "@/components/garden/themes";
import "./start.css";

const THEME_COLOR: Record<GardenThemeKey, string> = {
  post: "#e8892b",
  sea: "#167f9d",
  space: "#6a4fc4",
};
const TITLE = "냠냠캔버스";

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
}) {
  const buddy = character && CHARACTERS[character].theme;
  const themes = (Object.keys(THEMES) as GardenThemeKey[]).toSorted(
    (a, b) => Number(b === buddy) - Number(a === buddy),
  );

  return (
    <div className="start-screen fixed inset-0 z-50 overflow-hidden">
      <StartDecor />
      <div className="relative grid size-full place-items-center overflow-y-auto p-6">
        <div className="flex w-full flex-col items-center gap-[clamp(0.5rem,2.5vmin,1.5rem)] text-center">
          <h1
            aria-label={TITLE}
            className="text-[clamp(2.5rem,9vmin,4.5rem)] text-[#006b86]"
          >
            {[...TITLE].map((letter, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="start-letter inline-block"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {letter}
              </span>
            ))}
          </h1>

          {failed ? (
            <div role="alert" className="grid justify-items-center gap-3">
              <p className="text-[clamp(1.2rem,4vmin,1.6rem)]">
                보호자 설정을 불러오지 못했어요
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={onRetry}
                  className="tap-pop min-h-12 rounded-full bg-[#006b86] px-6 text-white"
                >
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={onDemo}
                  className="tap-pop min-h-12 rounded-full bg-white px-6 text-[#006b86]"
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
              className="flex w-[min(80vw,24rem)] flex-col overflow-hidden rounded-3xl border-4 bg-white shadow-lg tap-pop"
              style={{ borderColor: THEME_COLOR[locked.theme] }}
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
            <>
              <p className="text-[clamp(1.4rem,4.5vmin,2rem)]">
                누구랑 먹을까?
              </p>
              <div className="flex w-full flex-wrap justify-center gap-4 portrait:flex-col portrait:items-center">
                {(Object.keys(CHARACTERS) as GardenCharacterKey[]).map(
                  (key) => {
                    const { Component, name, theme } = CHARACTERS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onCharacter(key)}
                        className="flex w-[clamp(10rem,24vw,15rem)] flex-col items-center overflow-hidden rounded-3xl border-4 bg-white shadow-lg tap-pop portrait:w-[min(80vw,20rem)] portrait:flex-row"
                        style={{ borderColor: THEME_COLOR[theme] }}
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
            </>
          ) : (
            <>
              <p className="text-[clamp(1.4rem,4.5vmin,2rem)]">
                오늘은 어디로 놀러 갈까?
              </p>
              {/* One tap picks the world and starts the meal. */}
              <div className="flex w-full flex-wrap justify-center gap-4 portrait:flex-col portrait:items-center">
                {themes.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onTheme(key)}
                    className="flex w-[clamp(11rem,26vw,17rem)] flex-col overflow-hidden rounded-3xl border-4 bg-white shadow-lg tap-pop portrait:w-[min(80vw,20rem)] portrait:flex-row portrait:items-center"
                    style={{ borderColor: THEME_COLOR[key] }}
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
                className="tap-pop min-h-12 rounded-full bg-white/80 px-5 text-[clamp(1rem,3vmin,1.3rem)] text-[#006b86]"
              >
                다른 친구 고르기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// A little of each world around the edges: clouds and a letter, bubbles, stars.
function StartDecor() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="white" opacity=".9">
        <g className="start-drift">
          <ellipse cx="130" cy="110" rx="62" ry="24" />
          <ellipse cx="160" cy="92" rx="38" ry="28" />
        </g>
        <g className="start-drift" style={{ animationDelay: "-6s" }}>
          <ellipse cx="820" cy="80" rx="54" ry="20" />
          <ellipse cx="846" cy="64" rx="32" ry="24" />
        </g>
      </g>
      <g className="start-drift" style={{ animationDelay: "-3s" }}>
        <g transform="translate(250 190) rotate(-10)">
          <rect
            x="-22"
            y="-15"
            width="44"
            height="30"
            rx="4"
            fill="white"
            stroke="#e8892b"
            strokeWidth="3"
          />
          <path
            d="M-20-12 0 3 20-12"
            fill="none"
            stroke="#e8892b"
            strokeWidth="3"
          />
        </g>
      </g>
      <g fill="#bfeeff" stroke="#1a8fb0" strokeWidth="2.5">
        {[
          [70, 520, 14],
          [110, 455, 9],
          [930, 470, 12],
          [890, 400, 7],
        ].map(([x, y, r], i) => (
          <circle
            key={i}
            className="start-rise"
            style={{ animationDelay: `${-i * 1.7}s` }}
            cx={x}
            cy={y}
            r={r}
          />
        ))}
      </g>
      <g fill="#ffe27a" stroke="#c49a1c" strokeWidth="2">
        {[
          [720, 170, 1],
          [930, 230, 0.7],
          [60, 300, 0.8],
          [640, 36, 0.6],
        ].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <path
              className="chick-twinkle"
              style={{ animationDelay: `${i * 0.3}s` }}
              d="M0-16Q4-4 16 0Q4 4 0 16Q-4 4-16 0Q-4-4 0-16Z"
            />
          </g>
        ))}
      </g>
      {/* Three hills at the bottom: meadow, sand, moon. */}
      <path d="M0 640Q170 590 360 630T720 625 1000 615V700H0Z" fill="#c6efb7" />
      <path d="M300 670Q500 630 700 668V700H300Z" fill="#f7dfa3" />
      <path d="M680 672Q850 638 1000 660V700H680Z" fill="#d9ccf5" />
    </svg>
  );
}
