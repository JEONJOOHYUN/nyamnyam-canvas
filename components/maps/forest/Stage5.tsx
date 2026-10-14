import { Sway } from "../Appear";
import { forest } from "./palette";

const COLORS = [forest.blossom, "#C9A7FF", "#FFB27A"];

function Flower({
  x,
  y,
  r,
  color,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle
          key={a}
          cx={Math.cos((a * Math.PI) / 180) * r}
          cy={Math.sin((a * Math.PI) / 180) * r}
          r={r * 0.75}
          fill={color}
        />
      ))}
      <circle r={r * 0.6} fill="#FFE27A" />
      <circle
        cx={-r * 0.2}
        cy={-r * 0.25}
        r={r * 0.2}
        fill="#FFFFFF"
        opacity="0.7"
      />
    </g>
  );
}

const GROUND: [number, number][] = [
  [250, 486],
  [300, 512],
  [520, 494],
  [575, 515],
  [195, 520],
  [628, 482],
];
const CANOPY: [number, number][] = [
  [338, 205],
  [458, 150],
  [478, 286],
  [322, 290],
  [412, 252],
  [390, 140],
];

// Flowers on the ground and blossoms on the tree.
export function Stage5() {
  return (
    <g>
      {GROUND.map(([x, y], i) => (
        <Sway key={`g${x}`} deg={5} duration={3 + (i % 3)} delay={i * 0.3}>
          <path
            d={`M${x} ${y + 30} Q ${x - 4} ${y + 14} ${x} ${y}`}
            stroke="#4FAE57"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <Flower x={x} y={y} r={10} color={COLORS[i % 3]} />
        </Sway>
      ))}
      {CANOPY.map(([x, y], i) => (
        <Flower
          key={`c${x}`}
          x={x}
          y={y}
          r={7}
          color={i % 2 ? "#FFFFFF" : forest.blossom}
        />
      ))}
    </g>
  );
}
