"use client";

import {
  motion,
  useAnimate,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useId } from "react";

type Props = {
  mouth: MotionValue<number>; // 0 closed .. 1 wide open, driven by the voice
  jump: number; // bump to make it jump
  dancing?: boolean;
  onTouch?: () => void;
  className?: string;
};

// 냠냠이: an original round chick. Kept as one component so it can be swapped for a designer file later.
export function Nyamnyam({
  mouth,
  jump,
  dancing = false,
  onTouch,
  className,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [scope, animate] = useAnimate<SVGGElement>();
  const beakY = useTransform(mouth, [0, 1], [0, 8]);
  const mouthRy = useTransform(mouth, [0, 1], [0.5, 7]);

  useEffect(() => {
    if (jump > 0)
      void animate(
        scope.current,
        { y: [0, -36, 0], scaleY: [1, 1.06, 0.94, 1] },
        { duration: 0.6, ease: "easeOut" },
      );
  }, [jump, animate, scope]);

  const touch = () => {
    void animate(
      scope.current,
      { rotate: [0, -9, 8, -4, 0] },
      { duration: 0.5 },
    );
    onTouch?.();
  };

  return (
    <button
      type="button"
      onClick={touch}
      aria-label="냠냠이"
      className={`touch-manipulation rounded-full outline-offset-4 ${className ?? ""}`}
    >
      <svg viewBox="0 0 200 200" className="size-full overflow-visible">
        <defs>
          <radialGradient id={`${uid}body`} cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stopColor="#FFF4B8" />
            <stop offset="0.55" stopColor="#FFDA4D" />
            <stop offset="1" stopColor="#F4B630" />
          </radialGradient>
        </defs>
        <ellipse
          cx="100"
          cy="192"
          rx="52"
          ry="7"
          fill="#000000"
          opacity="0.08"
        />
        <motion.g ref={scope} style={{ originX: 0.5, originY: 1 }}>
          <motion.g
            animate={dancing ? { rotate: [-7, 7, -7] } : { rotate: 0 }}
            transition={
              dancing ? { duration: 0.6, repeat: Infinity } : { duration: 0.3 }
            }
            style={{ originX: 0.5, originY: 1 }}
          >
            <ellipse cx="82" cy="184" rx="11" ry="5" fill="#FF9A3C" />
            <ellipse cx="118" cy="184" rx="11" ry="5" fill="#FF9A3C" />
            <motion.g
              animate={{ scaleY: [1, 1.03, 1] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: 0.5, originY: 1 }}
            >
              <path
                d="M100 54 C 90 30 102 20 108 34 C 114 22 128 30 114 52 Z"
                fill="#FFD84D"
              />
              <ellipse
                cx="36"
                cy="122"
                rx="15"
                ry="26"
                transform="rotate(20 36 122)"
                fill="#F7C53A"
              />
              <ellipse
                cx="164"
                cy="122"
                rx="15"
                ry="26"
                transform="rotate(-20 164 122)"
                fill="#F7C53A"
              />
              <ellipse
                cx="100"
                cy="116"
                rx="70"
                ry="68"
                fill={`url(#${uid}body)`}
              />
              <ellipse
                cx="100"
                cy="140"
                rx="40"
                ry="30"
                fill="#FFF1A8"
                opacity="0.7"
              />
              <ellipse
                cx="74"
                cy="70"
                rx="18"
                ry="9"
                fill="#FFFFFF"
                opacity="0.35"
              />

              <motion.g
                animate={{ scaleY: [1, 1, 0.1, 1] }}
                transition={{
                  duration: 4,
                  times: [0, 0.92, 0.96, 1],
                  repeat: Infinity,
                }}
                style={{ originX: 0.5, originY: 0.5 }}
              >
                <ellipse cx="76" cy="100" rx="8" ry="11" fill="#3B2A20" />
                <ellipse cx="124" cy="100" rx="8" ry="11" fill="#3B2A20" />
                <circle cx="79" cy="95" r="3" fill="#FFFFFF" />
                <circle cx="127" cy="95" r="3" fill="#FFFFFF" />
              </motion.g>
              <ellipse
                cx="58"
                cy="124"
                rx="11"
                ry="7"
                fill="#FF9AA2"
                opacity="0.6"
              />
              <ellipse
                cx="142"
                cy="124"
                rx="11"
                ry="7"
                fill="#FF9AA2"
                opacity="0.6"
              />

              <motion.ellipse
                cx="100"
                cy="121"
                rx="8"
                ry={mouthRy}
                fill="#8C3B1E"
              />
              <motion.path
                d="M89 117 Q100 130 111 117 Q100 121 89 117 Z"
                fill="#F07C2A"
                style={{ y: beakY }}
              />
              <path
                d="M86 114 Q100 102 114 114 Q100 122 86 114 Z"
                fill="#FF9A3C"
              />
            </motion.g>
          </motion.g>
        </motion.g>
      </svg>
    </button>
  );
}
