"use client";

import { motion } from "motion/react";
import { forest, ROOT } from "./palette";

function Cloud({
  x,
  y,
  s = 1,
  drift = 40,
  duration = 26,
}: {
  x: number;
  y: number;
  s?: number;
  drift?: number;
  duration?: number;
}) {
  return (
    <motion.g
      animate={{ x: [0, drift, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      <g transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFFFF">
        <ellipse cx="0" cy="8" rx="62" ry="22" opacity="0.95" />
        <circle cx="-22" cy="-4" r="26" />
        <circle cx="16" cy="-12" r="32" />
        <circle cx="44" cy="4" r="20" />
      </g>
    </motion.g>
  );
}

// Sky, sun, clouds, hills and the soil mound. Draws past the viewBox so any aspect ratio is filled.
export function Background() {
  return (
    <g>
      <defs>
        <linearGradient
          id="forest-sky"
          x1="0"
          y1="0"
          x2="0"
          y2="440"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={forest.sky} />
          <stop offset="1" stopColor="#E6F7FF" />
        </linearGradient>
        <radialGradient id="forest-sun">
          <stop offset="0" stopColor="#FFF6C2" />
          <stop offset="1" stopColor="#FFD95A" />
        </radialGradient>
        <linearGradient
          id="forest-ground"
          x1="0"
          y1="440"
          x2="0"
          y2="700"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={forest.grass} />
          <stop offset="1" stopColor="#5FB04E" />
        </linearGradient>
        <linearGradient id="forest-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C2906A" />
          <stop offset="1" stopColor={forest.wood} />
        </linearGradient>
      </defs>

      <rect
        x="-1200"
        y="-1200"
        width="3200"
        height="1700"
        fill="url(#forest-sky)"
      />

      <motion.circle
        cx="655"
        cy="110"
        r="78"
        fill="#FFE27A"
        opacity="0.3"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx="655" cy="110" r="48" fill="url(#forest-sun)" />

      <Cloud x={150} y={110} />
      <Cloud x={500} y={70} s={0.75} drift={-50} duration={32} />
      <Cloud x={-150} y={160} s={0.9} drift={60} duration={30} />
      <Cloud x={950} y={140} s={0.8} drift={-40} />

      <path
        d="M-1200 395 Q-700 330 -300 385 T 400 372 T 1100 368 T 2000 390 V 1600 H -1200 Z"
        fill="#B5E59A"
      />
      <path
        d="M-1200 432 Q-400 380 150 428 T 900 420 T 2000 430 V 1600 H -1200 Z"
        fill="#98DA7C"
      />
      <path
        d="M-1200 456 Q 400 432 2000 456 V 1600 H -1200 Z"
        fill="url(#forest-ground)"
      />
      <path
        d="M-1200 456 Q 400 432 2000 456"
        fill="none"
        stroke="#A6E58C"
        strokeWidth="5"
        opacity="0.7"
      />

      {[
        [120, 520],
        [235, 470],
        [610, 530],
        [700, 474],
        [40, 480],
        [770, 545],
      ].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x - 10} ${y} q4 -16 6 -2 q3 -20 6 0 q4 -14 6 2 z`}
          fill="#5FB04E"
        />
      ))}

      <ellipse
        cx={ROOT.x}
        cy={ROOT.y + 2}
        rx="74"
        ry="17"
        fill="url(#forest-soil)"
      />
      <ellipse
        cx={ROOT.x - 14}
        cy={ROOT.y - 4}
        rx="40"
        ry="6"
        fill="#D9AE88"
        opacity="0.6"
      />
    </g>
  );
}
