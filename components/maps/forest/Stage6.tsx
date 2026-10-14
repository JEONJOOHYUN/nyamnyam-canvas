"use client";

import { motion } from "motion/react";
import { forest } from "./palette";

const FRUITS: [number, number][] = [
  [356, 248],
  [432, 212],
  [474, 302],
  [326, 318],
  [404, 300],
  [372, 176],
  [500, 236],
];

// Round fruit hanging on the canopy.
export function Stage6() {
  return (
    <g>
      <defs>
        <radialGradient id="forest-fruit" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#FFB1A6" />
          <stop offset="1" stopColor={forest.fruit} />
        </radialGradient>
      </defs>
      {FRUITS.map(([x, y], i) => (
        <motion.g
          key={x}
          animate={{ y: [0, 3, 0] }}
          transition={{
            duration: 2.4 + (i % 3) * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        >
          <path
            d={`M${x} ${y - 14} q 8 -8 14 -4 q -6 6 -14 4`}
            fill="#4FAE57"
          />
          <circle cx={x} cy={y} r="14" fill="url(#forest-fruit)" />
          <ellipse
            cx={x - 5}
            cy={y - 5}
            rx="4"
            ry="2.5"
            fill="#FFFFFF"
            opacity="0.6"
          />
        </motion.g>
      ))}
    </g>
  );
}
