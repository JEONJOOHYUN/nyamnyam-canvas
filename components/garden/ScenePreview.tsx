"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GardenScene, type GardenSceneProps } from "./GardenScene";
import { CHICK_POSES, POSE_LABELS } from "./Chick";
import { buildProgress } from "./growth";
import { CHARACTERS } from "./characters";
import { THEMES } from "./themes";

export function BuildPreview({
  layout,
  theme = "post",
  character = "nyamnyam",
}: Pick<GardenSceneProps, "layout" | "theme" | "character">) {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsed = useRef(0);

  useEffect(() => {
    if (paused) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      elapsed.current += now - previous;
      previous = now;
      setProgress(buildProgress(elapsed.current, THEMES[theme].events));
    }, 50);
    return () => window.clearInterval(timer);
  }, [paused, theme]);

  return (
    <>
      <GardenScene
        character={character}
        theme={theme}
        progress={progress}
        layout={layout}
        pose={progress === 1 ? "celebrate" : "wonder"}
        bubble={null}
      />
      <Button
        onClick={() => setPaused(!paused)}
        aria-pressed={paused}
        className="absolute bottom-7 right-6 h-14 rounded-full bg-[#006b86] px-6 text-lg text-white hover:bg-[#00556c]"
      >
        {paused ? "짓기 계속 보기" : "잠깐 멈추기"}
      </Button>
    </>
  );
}

// Cycles through every pose so the blend between poses can be watched.
export function PoseLoop({
  theme = "post",
  character = "nyamnyam",
  layout = "wide",
}: Partial<Pick<GardenSceneProps, "theme" | "layout" | "character">>) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % CHICK_POSES.length),
      2400,
    );
    return () => window.clearInterval(timer);
  }, []);
  const pose = CHICK_POSES[index];
  const { Component: Character, name } = CHARACTERS[character];
  if (theme !== "post")
    return (
      <figure className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-[#d4fff2]">
        <div
          className={
            layout === "tall"
              ? "mx-auto aspect-[520/1000] max-w-sm"
              : "aspect-[4/3]"
          }
        >
          <GardenScene
            character={character}
            theme={theme}
            progress={1}
            layout={layout}
            pose={pose}
            bubble={null}
          />
        </div>
        <figcaption
          className="py-3 text-center font-kid text-xl"
          aria-live="polite"
        >
          {POSE_LABELS[pose]}
        </figcaption>
      </figure>
    );
  return (
    <figure className="mx-auto w-72 rounded-3xl bg-[#d4f3ff] py-5">
      <svg
        viewBox="-130 -240 260 270"
        role="img"
        aria-label={
          character === "nyamnyam"
            ? POSE_LABELS[pose]
            : `${name}. ${POSE_LABELS[pose]}`
        }
        className="w-full"
      >
        <Character pose={pose} />
      </svg>
      <figcaption className="text-center font-kid text-xl" aria-live="polite">
        {POSE_LABELS[pose]}
      </figcaption>
    </figure>
  );
}

export function ScenePreview(props: GardenSceneProps) {
  const [resting, setResting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <GardenScene
        {...props}
        pose={resting ? "wait" : props.pose}
        bubble={resting ? "응, 편하게 쉬어도 좋아." : props.bubble}
      />
      <header className="absolute left-0 top-0 p-5 text-[#245964] sm:p-8">
        <Button
          variant="ghost"
          aria-label="보호자 메뉴"
          onClick={() => dialog.current?.showModal()}
          className="size-12 rounded-full border border-white bg-white/90"
        >
          <Menu className="size-5" />
        </Button>
      </header>
      {props.progress < 1 && (
        <Button
          onClick={() => setResting(!resting)}
          aria-pressed={resting}
          className="btn-solid absolute bottom-7 right-6 h-16 min-w-40 rounded-full border-2 border-white/90 px-7 font-kid text-xl [--btn:#006b86] sm:bottom-9 sm:right-9"
        >
          {resting ? "같이 쉴게" : "배불러요"}
        </Button>
      )}
      <dialog
        ref={dialog}
        className="fixed inset-0 m-auto w-[min(90vw,360px)] rounded-3xl bg-[#fffcf2] p-6 text-[#465f54] shadow-xl backdrop:bg-[#293a30]/30"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-kid text-2xl">보호자 메뉴</h2>
          <Button
            variant="ghost"
            aria-label="닫기"
            onClick={() => dialog.current?.close()}
            className="size-12"
          >
            <X />
          </Button>
        </div>
        <p className="mt-4 leading-relaxed">
          식사 화면 디자인 시안입니다. 저울과 식사 기록은 연결되지 않았어요.
        </p>
        <form method="dialog">
          <Button className="mt-6 h-12 w-full rounded-xl bg-[#517d7a] text-white">
            그림으로 돌아가기
          </Button>
        </form>
      </dialog>
    </>
  );
}
