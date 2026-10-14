"use client";

import { motion } from "motion/react";

const COLORS = [
  "#FF9AA2",
  "#FFC48A",
  "#FFE58A",
  "#A8E6A3",
  "#9AD4FF",
  "#C7B3FF",
];
// Deterministic spread so render stays pure.
const PIECES = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 13) % 10) / 20,
  drift: ((i * 29) % 60) - 30,
  spin: ((i * 53) % 2 ? 1 : -1) * (180 + ((i * 17) % 360)),
  round: i % 3 === 0,
  color: COLORS[i % COLORS.length],
}));

// ~3.5s confetti shower over the whole screen.
export function Confetti() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden
    >
      {PIECES.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute top-0 block h-4 w-2.5 ${p.round ? "rounded-full" : "rounded-sm"}`}
          style={{ left: `${p.left}%`, backgroundColor: p.color }}
          initial={{ y: "-10vh", x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: "110vh",
            x: p.drift,
            rotate: p.spin,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 3, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

// "참 잘했어요" stamp that thumps down.
export function Stamp() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-40 grid place-items-center"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 2.4, opacity: 0, rotate: -4 }}
        animate={{ scale: 1, opacity: 1, rotate: -12 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="grid size-[clamp(9rem,32vmin,14rem)] place-items-center rounded-full border-[clamp(6px,1.4vmin,10px)] border-[#F0605D] bg-white/85 text-center text-[clamp(1.6rem,6vmin,2.6rem)] leading-tight text-[#F0605D] shadow-lg"
      >
        참 잘<br />
        했어요
      </motion.div>
    </motion.div>
  );
}
