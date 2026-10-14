import { forest } from "./palette";

// Round leafy crown built from overlapping circles, shared by the small and big tree.
export function Canopy({ blobs }: { blobs: [number, number, number][] }) {
  const [hx, hy, hr] = blobs[0];
  return (
    <g>
      <defs>
        <radialGradient id="forest-canopy" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#8FDB7A" />
          <stop offset="0.7" stopColor={forest.leaf} />
          <stop offset="1" stopColor="#4FA85A" />
        </radialGradient>
      </defs>
      {blobs.map(([x, y, r]) => (
        <circle
          key={`s${x}-${y}`}
          cx={x}
          cy={y + r * 0.12}
          r={r}
          fill="#3F8F4C"
          opacity="0.35"
        />
      ))}
      {blobs.map(([x, y, r]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={r}
          fill="url(#forest-canopy)"
        />
      ))}
      <ellipse
        cx={hx - hr * 0.3}
        cy={hy - hr * 0.45}
        rx={hr * 0.35}
        ry={hr * 0.2}
        fill="#FFFFFF"
        opacity="0.28"
      />
    </g>
  );
}
