"use client";

import { AnimatePresence } from "motion/react";
import { Appear, Sparkles } from "../Appear";
import { Background } from "./Background";
import { Stage1 } from "./Stage1";
import { Stage2 } from "./Stage2";
import { Stage3 } from "./Stage3";
import { Stage4 } from "./Stage4";
import { Stage5 } from "./Stage5";
import { Stage6 } from "./Stage6";
import { Stage7, Stage7Back } from "./Stage7";

// Stages 1-4 replace each other (seed → big tree); 5-7 add on top.
const PLANTS = [null, Stage1, Stage2, Stage3, Stage4];
const SPARKLE_AT: ([number, number] | null)[] = [
  null,
  [400, 440],
  [400, 400],
  [400, 330],
  [400, 220],
  [400, 260],
  [400, 240],
  [400, 160],
];

export function ForestMap({ stage }: { stage: number }) {
  const plant = Math.min(stage, 4);
  const Plant = PLANTS[plant];
  const sparkle = SPARKLE_AT[stage];
  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className="size-full"
      role="img"
      aria-label={`숲 그림, ${stage}단계`}
    >
      <Background />
      <AnimatePresence>
        {stage >= 7 && <Stage7Back key="rainbow" />}
      </AnimatePresence>
      <AnimatePresence>
        {Plant && (
          <Appear key={plant}>
            <Plant />
          </Appear>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {stage >= 5 && (
          <Appear key="flowers">
            <Stage5 />
          </Appear>
        )}
        {stage >= 6 && (
          <Appear key="fruit">
            <Stage6 />
          </Appear>
        )}
        {stage >= 7 && (
          <Appear key="birds">
            <Stage7 />
          </Appear>
        )}
      </AnimatePresence>
      {sparkle && <Sparkles key={stage} x={sparkle[0]} y={sparkle[1]} />}
    </svg>
  );
}
