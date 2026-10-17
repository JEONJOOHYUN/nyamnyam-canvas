// Shared look of the start screens (child start screen, home page, auto demo): soft sky,
// a little of each world around the edges, and the title that bounces in once.
import "@/components/garden/garden.css";
import "./start.css";

const TITLE = "냠냠캔버스";

export function BouncyTitle({ className = "" }: { className?: string }) {
  return (
    <h1
      aria-label={TITLE}
      className={`text-[clamp(2.5rem,9vmin,4.5rem)] text-[#006b86] ${className}`}
    >
      {[...TITLE].map((letter, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="start-letter inline-block"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          {letter}
        </span>
      ))}
    </h1>
  );
}

// A little of each world around the edges: clouds and a letter, bubbles, stars.
export function StartDecor() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="white" opacity=".9">
        <g className="start-drift">
          <ellipse cx="130" cy="110" rx="62" ry="24" />
          <ellipse cx="160" cy="92" rx="38" ry="28" />
        </g>
        <g className="start-drift" style={{ animationDelay: "-6s" }}>
          <ellipse cx="820" cy="80" rx="54" ry="20" />
          <ellipse cx="846" cy="64" rx="32" ry="24" />
        </g>
      </g>
      <g className="start-drift" style={{ animationDelay: "-3s" }}>
        <g transform="translate(250 190) rotate(-10)">
          <rect
            x="-22"
            y="-15"
            width="44"
            height="30"
            rx="4"
            fill="white"
            stroke="#e8892b"
            strokeWidth="3"
          />
          <path
            d="M-20-12 0 3 20-12"
            fill="none"
            stroke="#e8892b"
            strokeWidth="3"
          />
        </g>
      </g>
      <g fill="#bfeeff" stroke="#1a8fb0" strokeWidth="2.5">
        {[
          [70, 520, 14],
          [110, 455, 9],
          [930, 470, 12],
          [890, 400, 7],
        ].map(([x, y, r], i) => (
          <circle
            key={i}
            className="start-rise"
            style={{ animationDelay: `${-i * 1.7}s` }}
            cx={x}
            cy={y}
            r={r}
          />
        ))}
      </g>
      <g fill="#ffe27a" stroke="#c49a1c" strokeWidth="2">
        {[
          [720, 170, 1],
          [930, 230, 0.7],
          [60, 300, 0.8],
          [640, 36, 0.6],
        ].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <path
              className="chick-twinkle"
              style={{ animationDelay: `${i * 0.3}s` }}
              d="M0-16Q4-4 16 0Q4 4 0 16Q-4 4-16 0Q-4-4 0-16Z"
            />
          </g>
        ))}
      </g>
      {/* Three hills at the bottom: meadow, sand, moon. */}
      <path d="M0 640Q170 590 360 630T720 625 1000 615V700H0Z" fill="#c6efb7" />
      <path d="M300 670Q500 630 700 668V700H300Z" fill="#f7dfa3" />
      <path d="M680 672Q850 638 1000 660V700H680Z" fill="#d9ccf5" />
    </svg>
  );
}
