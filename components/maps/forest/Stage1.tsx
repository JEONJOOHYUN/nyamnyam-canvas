import { ROOT } from "./palette";

// Seed resting in the soil.
export function Stage1() {
  return (
    <g transform={`translate(${ROOT.x} ${ROOT.y - 8}) rotate(-18)`}>
      <defs>
        <radialGradient id="forest-seed" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#D9A270" />
          <stop offset="1" stopColor="#8A5A35" />
        </radialGradient>
      </defs>
      <ellipse rx="17" ry="12" fill="url(#forest-seed)" />
      <ellipse cx="-6" cy="-4" rx="6" ry="3" fill="#FFFFFF" opacity="0.45" />
    </g>
  );
}
