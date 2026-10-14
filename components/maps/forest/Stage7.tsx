"use client";

import { motion } from "motion/react";
import { forest } from "./palette";

const RAINBOW = [
  "#FF9AA2",
  "#FFC48A",
  "#FFE58A",
  "#A8E6A3",
  "#9AD4FF",
  "#C7B3FF",
];

// Rainbow arc drawn behind the tree.
export function Stage7Back() {
  return (
    <motion.g opacity={0.85} exit={{ opacity: 0 }}>
      {RAINBOW.map((c, i) => {
        const r = 340 - i * 14;
        return (
          <motion.path
            key={c}
            d={`M ${400 - r} 456 A ${r} ${r} 0 0 1 ${400 + r} 456`}
            stroke={c}
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: i * 0.08, ease: "easeOut" }}
          />
        );
      })}
    </motion.g>
  );
}

function Bird({
  x,
  y,
  flip = false,
}: {
  x: number;
  y: number;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d="M-18 4 L-32 -4 L-30 10 Z" fill="#4FA3E0" />
      <circle r="18" fill={forest.bird} />
      <circle cx="12" cy="-12" r="12" fill={forest.bird} />
      <ellipse cx="-2" cy="6" rx="10" ry="8" fill="#BFE6FF" />
      <motion.ellipse
        cx="-4"
        cy="-2"
        rx="11"
        ry="7"
        fill="#4FA3E0"
        animate={{ rotate: [0, -25, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
        style={{ originX: 1, originY: 0.5 }}
      />
      <circle cx="16" cy="-14" r="2.6" fill="#2F2A26" />
      <circle cx="16.8" cy="-14.8" r="0.9" fill="#FFFFFF" />
      <path d="M23 -10 l9 3 l-9 3 z" fill="#FFB25B" />
    </g>
  );
}

// Birds: one perched on the tree, one hovering nearby.
export function Stage7() {
  return (
    <g>
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        <Bird x={505} y={150} />
      </motion.g>
      <motion.g
        animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Bird x={230} y={170} flip />
      </motion.g>
    </g>
  );
}
