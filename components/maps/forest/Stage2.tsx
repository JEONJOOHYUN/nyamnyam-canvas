import { Sway } from "../Appear";
import { ROOT } from "./palette";

const LEAF = "M0 0 C 10 -26 44 -30 54 -14 C 40 4 12 8 0 0 Z";

// Sprout: a curved stem with two leaves.
export function Stage2() {
  const { x, y } = ROOT;
  return (
    <Sway deg={4} duration={3.5}>
      <defs>
        <linearGradient id="forest-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9BE686" />
          <stop offset="1" stopColor="#4FAE57" />
        </linearGradient>
      </defs>
      <path
        d={`M${x} ${y - 4} C ${x - 6} ${y - 30} ${x + 6} ${y - 50} ${x} ${y - 70}`}
        stroke="#5DB85B"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={LEAF}
        transform={`translate(${x} ${y - 66})`}
        fill="url(#forest-leaf)"
      />
      <path
        d={LEAF}
        transform={`translate(${x} ${y - 60}) scale(-0.85 0.85)`}
        fill="url(#forest-leaf)"
      />
      <path
        d="M0 0 C 14 -10 30 -14 42 -12"
        transform={`translate(${x} ${y - 66})`}
        stroke="#FFFFFF"
        strokeWidth="2"
        opacity="0.4"
        fill="none"
        strokeLinecap="round"
      />
    </Sway>
  );
}
