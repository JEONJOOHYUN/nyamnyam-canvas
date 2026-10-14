"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// Springs a layer up from its bottom edge when it first shows.
export function Appear({ children }: { children: ReactNode }) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 180, damping: 13 }}
      style={{ originX: 0.5, originY: 1 }}
    >
      {children}
    </motion.g>
  );
}

// Gentle endless sway around the bottom edge (leaves, flowers).
export function Sway({
  children,
  deg = 2,
  duration = 4,
  delay = 0,
}: {
  children: ReactNode;
  deg?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.g
      animate={{ rotate: [-deg, deg, -deg] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      style={{ originX: 0.5, originY: 1 }}
    >
      {children}
    </motion.g>
  );
}

const STAR = "M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10Z";
const BURST = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  const r = 70 + (i % 3) * 25;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 0.6 + (i % 4) * 0.25 };
});

// One-shot sparkle burst; remount (new key) to play again.
export function Sparkles({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      {BURST.map((p, i) => (
        <motion.path
          key={i}
          d={STAR}
          fill={i % 2 ? "#FFE27A" : "#FFFFFF"}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: [0, p.s, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 1.1, ease: "easeOut", delay: (i % 3) * 0.05 }}
        />
      ))}
    </g>
  );
}
