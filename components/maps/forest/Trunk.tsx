import { forest, ROOT } from "./palette";

// Tapered trunk from the root up to `top`; `base` and `tip` are half-widths.
export function Trunk({
  top,
  base,
  tip,
}: {
  top: number;
  base: number;
  tip: number;
}) {
  const { x, y } = ROOT;
  const mid = (y + top) / 2;
  return (
    <g>
      <defs>
        <linearGradient id="forest-trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C08A5E" />
          <stop offset="1" stopColor={forest.wood} />
        </linearGradient>
      </defs>
      <path
        d={`M${x - base} ${y} Q ${x - tip} ${mid} ${x - tip} ${top} L ${x + tip} ${top} Q ${x + tip} ${mid} ${x + base} ${y} Z`}
        fill="url(#forest-trunk)"
      />
      <path
        d={`M${x - tip + 4} ${top + 10} Q ${x - tip + 2} ${mid} ${x - base + 6} ${y - 4}`}
        stroke="#FFFFFF"
        strokeWidth="3"
        opacity="0.25"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}
