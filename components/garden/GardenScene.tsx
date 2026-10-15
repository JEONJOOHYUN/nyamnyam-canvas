"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { motion, type MotionValue } from "motion/react";
import "./garden.css";
import { THEMES, type GardenThemeKey } from "./themes";
import { Chick, POSE_LABELS, type ChickPose } from "./Chick";
import { visiblePieces } from "./growth";

export { CHICK_POSES } from "./Chick";
export type { ChickPose } from "./Chick";

export interface GardenSceneProps {
  theme?: GardenThemeKey;
  progress: number;
  layout: "wide" | "tall";
  bubble: string | null;
  pose: ChickPose;
  onChickTap?: () => void;
  /** 0..1 speech level from `speak()`; opens the beak while talking. */
  mouth?: MotionValue<number>;
}

export function GardenScene({
  theme = "post",
  progress,
  layout,
  bubble,
  pose,
  onChickTap,
  mouth,
}: GardenSceneProps) {
  const tall = layout === "tall";
  const titleId = useId();
  const selected = THEMES[theme];
  const { Background, Scenery } = selected;
  const visible = visiblePieces(progress, selected.events);
  const latest = visible.at(-1);
  const target = latest?.[layout];
  const chickX = tall ? 145 : 250;
  const chickEyeY = tall ? 680 : 404;
  const scene = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.intersectionRatio > 0.5);
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={scene}
      data-garden-active={active}
      className="garden-scene relative isolate size-full overflow-hidden bg-[#91dfff]"
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <Background tall={tall} />
      </svg>
      <svg
        className="relative size-full"
        viewBox={tall ? "0 0 520 1000" : "0 0 1000 700"}
        role="group"
        aria-labelledby={titleId}
      >
        <title
          id={titleId}
        >{`냠냠이와 ${selected.title}. ${POSE_LABELS[pose]} ${selected.description}`}</title>
        <Scenery tall={tall} />
        <g strokeLinejoin="round" strokeLinecap="round">
          {visible
            .toSorted((a, b) => (a.layer ?? 0) - (b.layer ?? 0))
            .map((piece) => {
              const [x, y] = piece[layout];
              return (
                <g
                  key={piece.key}
                  data-piece={piece.key}
                  transform={`translate(${x} ${y}) scale(${tall ? 0.86 : 1})`}
                >
                  <g
                    className={piece === latest ? "garden-arrival" : undefined}
                  >
                    {selected.pieces[piece.key]}
                  </g>
                  <g
                    className={`garden-sparkles ${piece === latest ? "garden-highlight" : ""}`}
                    fill="#fff3ac"
                    stroke="#edb94b"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m-20-24 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
                    <path d="m29-38 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
                    <circle cx="38" cy="9" r="4" />
                  </g>
                </g>
              );
            })}
        </g>
        <g
          transform={
            tall
              ? "translate(145 830) scale(1.1)"
              : "translate(250 559) scale(1.13)"
          }
        >
          <g
            {...(onChickTap && {
              role: "button",
              tabIndex: 0,
              "aria-label": "냠냠이",
              className: "cursor-pointer",
              onClick: onChickTap,
              onKeyDown: (event: KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") onChickTap();
              },
            })}
          >
            <Chick
              pose={pose}
              mouth={
                mouth && (
                  <motion.path
                    d="M-7-111Q0-97 7-111"
                    fill="#9b411c"
                    stroke="none"
                    style={{
                      scaleY: mouth,
                      transformBox: "fill-box",
                      transformOrigin: "50% 0%",
                    }}
                  />
                )
              }
              lookDown={target ? target[1] > chickEyeY : false}
              lookAt={
                target ? [target[0] - chickX, target[1] - chickEyeY] : undefined
              }
            />
          </g>
          {bubble && (
            <g
              transform={
                tall ? "translate(78 -61) scale(.93)" : "translate(-125 -292)"
              }
            >
              <path
                d={
                  tall
                    ? "M17 0H233Q250 0 250 17V43Q250 60 233 60H17Q0 60 0 43V31l-13-11 13 1V17Q0 0 17 0Z"
                    : "M17 0H233Q250 0 250 17V43Q250 60 233 60H145l-15 13-3-13H17Q0 60 0 43V17Q0 0 17 0Z"
                }
                fill="white"
              />
              <foreignObject x="12" y="5" width="226" height="51">
                <div
                  aria-live="polite"
                  className="flex h-full items-center justify-center text-center font-kid text-[21px] leading-tight text-[#244c50]"
                >
                  {bubble}
                </div>
              </foreignObject>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
