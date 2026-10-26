"use client";

import { CHARACTERS } from "@/components/garden/characters";
import { AUTO_ROUNDS, AUTO_SPEEDS } from "./autoDemo";
import { BouncyTitle, StartDecor } from "./StartDecor";

// One tap before the auto demo: browsers only play sound (and go fullscreen) after a tap.
// The playback speed is picked here only; while it runs the screen shows no controls.
export function AutoDemoStart({
  onStart,
  speed,
  onSpeed,
  leaving = false,
}: {
  onStart: () => void;
  speed: number;
  onSpeed: (v: number) => void;
  // The demo has started: fade out over the scene (PlayScreen unmounts it right after).
  leaving?: boolean;
}) {
  return (
    <div
      className={`start-screen fixed inset-0 z-50 overflow-hidden ${leaving ? "start-leave" : ""}`}
      inert={leaving}
    >
      <StartDecor />
      <div className="relative grid size-full place-items-center overflow-y-auto p-6">
        <div className="flex w-full flex-col items-center gap-[clamp(0.75rem,3vmin,1.5rem)] text-center">
          <BouncyTitle />
          <p className="text-[clamp(1.3rem,4.2vmin,1.9rem)]">자동 시연</p>
          <div className="flex items-end justify-center gap-[clamp(0.25rem,2vmin,1rem)]">
            {AUTO_ROUNDS.map(({ character }, i) => {
              const { Component } = CHARACTERS[character];
              return (
                <span
                  key={character}
                  className="start-chick home-friend block w-[clamp(5rem,15vmin,8rem)] [@media(max-height:480px)]:w-16"
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  <svg
                    viewBox="-130 -240 260 270"
                    aria-hidden="true"
                    className="size-full"
                  >
                    <Component pose="hello" />
                  </svg>
                </span>
              );
            })}
          </div>
          <p className="max-w-[28rem] text-[clamp(1rem,3vmin,1.2rem)] text-[#006b86]">
            세 친구가 번갈아 밥을 먹으며 그림을 완성해요. 켜 두면 계속 이어져요.
          </p>
          <div
            role="group"
            aria-label="재생 속도"
            className="flex flex-col items-center gap-2 [@media(max-height:480px)]:flex-row"
          >
            <span className="text-[clamp(0.95rem,2.6vmin,1.1rem)] text-[#245964]">
              속도
            </span>
            <div className="flex justify-center gap-1.5">
              {AUTO_SPEEDS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={speed === v}
                  onClick={() => onSpeed(v)}
                  className={`tap-pop min-h-11 min-w-[3.25rem] rounded-full px-2 text-[clamp(1rem,2.8vmin,1.2rem)] tabular-nums ${
                    speed === v
                      ? "btn-solid [--btn:#6a4fc4]"
                      : "btn-plain text-[#245964]"
                  }`}
                >
                  {v % 1 ? `${v}x` : `${v.toFixed(1)}x`}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="tap-pop btn-solid min-h-14 rounded-full px-10 py-3 text-[clamp(1.5rem,4.5vmin,2rem)] [--btn:#6a4fc4]"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
