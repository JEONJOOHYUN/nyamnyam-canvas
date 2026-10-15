"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GardenScene, type GardenSceneProps } from "./GardenScene";
import { Chick, CHICK_POSES, POSE_LABELS } from "./Chick";
import { buildProgress, visiblePieces } from "./growth";

export function BuildPreview({ layout }: Pick<GardenSceneProps, "layout">) {
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
      const next = buildProgress(elapsed.current);
      setProgress(visiblePieces(next).at(-1)?.at ?? 0);
    }, 50);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <>
      <GardenScene
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
export function PoseLoop() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % CHICK_POSES.length),
      2400,
    );
    return () => window.clearInterval(timer);
  }, []);
  const pose = CHICK_POSES[index];
  return (
    <figure className="mx-auto w-72 rounded-3xl bg-[#d4f3ff] py-5">
      <svg
        viewBox="-130 -240 260 270"
        role="img"
        aria-label={POSE_LABELS[pose]}
        className="w-full"
      >
        <Chick pose={pose} />
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
          className="absolute bottom-7 right-6 h-16 min-w-40 rounded-full border-2 border-white bg-[#006b86] px-7 font-kid text-xl text-white shadow-[0_4px_0_#004759] hover:bg-[#00556c] sm:bottom-9 sm:right-9"
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
