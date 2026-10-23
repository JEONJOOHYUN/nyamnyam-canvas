import { useId, type ReactNode } from "react";
import type { GrowthPiece } from "./growth";

export const SEA_EVENTS = [
  { key: "bubble-rise", at: 0.03, wide: [110, 150], tall: [140, 90] },
  { key: "kelp-left", at: 0.0488, wide: [62, 550], tall: [55, 550] },
  { key: "coral-orange", at: 0.0676, wide: [95, 640], tall: [55, 930] },
  { key: "shell-peach", at: 0.0864, wide: [440, 540], tall: [90, 585] },
  { key: "bubble-high", at: 0.1052, wide: [865, 80], tall: [410, 90] },
  { key: "jelly-lantern", at: 0.1368, wide: [370, 145], tall: [80, 275] },
  { key: "kelp-right", at: 0.1684, wide: [935, 560], tall: [460, 565] },
  { key: "coral-pink", at: 0.1999, wide: [870, 505], tall: [455, 480] },
  { key: "sea-snails", at: 0.2315, wide: [550, 625], tall: [265, 895] },
  { key: "fish-school", at: 0.2631, wide: [875, 205], tall: [410, 295] },
  { key: "anemone", at: 0.2947, wide: [450, 635], tall: [455, 875] },
  { key: "starfish", at: 0.3263, wide: [365, 625], tall: [160, 905] },
  { key: "shell-purple", at: 0.3578, wide: [940, 640], tall: [170, 975] },
  { key: "blue-fish", at: 0.3894, wide: [490, 265], tall: [190, 340] },
  { key: "palace", at: 0.421, wide: [700, 500], tall: [300, 540] },
  { key: "window-left", at: 0.4526, wide: [615, 435], tall: [226.9, 484.1] },
  { key: "pearl-arch", at: 0.4842, wide: [700, 500], tall: [300, 540] },
  { key: "window-right", at: 0.5157, wide: [785, 435], tall: [373.1, 484.1] },
  { key: "octopus", at: 0.5473, wide: [790, 620], tall: [365, 915] },
  { key: "turtle", at: 0.5789, wide: [470, 395], tall: [420, 625] },
  { key: "crown-tower", at: 0.6105, wide: [700, 335], tall: [300, 398.1] },
  { key: "conch-home", at: 0.6421, wide: [65, 435], tall: [80, 420] },
  { key: "jelly-small", at: 0.6736, wide: [245, 125], tall: [445, 205] },
  { key: "pearl-garden", at: 0.7052, wide: [865, 585], tall: [460, 950] },
  { key: "treasure", at: 0.7368, wide: [635, 635], tall: [260, 957] },
  { key: "tower-pennant", at: 0.7684, wide: [700, 268], tall: [300, 340.48] },
  { key: "crab", at: 0.8, wide: [200, 650], tall: [330, 695] },
  { key: "palace-medallion", at: 0.8315, wide: [700, 375], tall: [300, 432.5] },
  { key: "shell-steps", at: 0.8631, wide: [700, 526], tall: [300, 562.36] },
  { key: "seahorse", at: 0.8947, wide: [935, 425], tall: [470, 380] },
  { key: "bubble-trail", at: 0.921, wide: [540, 480], tall: [25, 745] },
  { key: "coral-purple", at: 0.9474, wide: [35, 650], tall: [48, 985] },
  { key: "gold-shell", at: 0.9737, wide: [575, 535], tall: [185, 550] },
  { key: "whale-finale", at: 1, wide: [700, 500], tall: [300, 540] },
] as const satisfies readonly GrowthPiece[];

export function SeaBackground({ tall }: { tall: boolean }) {
  const waterId = useId();
  return (
    <>
      <defs>
        <linearGradient id={waterId} x2="0" y2="1">
          <stop stopColor="#74f3e4" />
          <stop offset=".55" stopColor="#22bbd8" />
          <stop offset="1" stopColor="#168bc3" />
        </linearGradient>
      </defs>
      <path d="M0 0H1000V700H0Z" fill={`url(#${waterId})`} />
      <path
        d="M110 0h65L390 430H285ZM580 0h36L735 390h-60Z"
        fill="#d4fff1"
        opacity=".18"
      />
      <path
        d={
          tall
            ? "M0 310Q210 270 460 315T1000 290V700H0Z"
            : "M0 448Q210 395 460 445T1000 425V700H0Z"
        }
        fill="#efc277"
      />
      <path
        d={
          tall
            ? "M0 415Q290 350 590 425T1000 405V700H0Z"
            : "M0 545Q240 455 450 540T1000 520V700H0Z"
        }
        fill="#ffe1a0"
      />
      <path d="M0 660Q240 570 520 625T1000 610V700H0Z" fill="#f8cd7e" />
    </>
  );
}

export function SeaScenery({ tall }: { tall: boolean }) {
  return (
    <g fill="#fff0b9">
      {!tall && <path d="M0 451Q65 402 145 449V470H0Z" fill="#efc277" />}
      <ellipse
        cx={tall ? 300 : 700}
        cy={tall ? 542 : 501}
        rx={tall ? 133 : 155}
        ry="22"
      />
      <ellipse
        cx={tall ? 145 : 250}
        cy={tall ? 836 : 565}
        rx={tall ? 120 : 156}
        ry="24"
      />
    </g>
  );
}

function Bubbles() {
  return (
    <g fill="#b9fff6" fillOpacity=".4" stroke="#e2fff6" strokeWidth="2.5">
      <circle r="14" />
      <circle cx="22" cy="-32" r="8" />
      <circle cx="-4" cy="-58" r="5" />
      <path d="M-7-5q2-4 6-4M19-35l2-2" fill="none" />
    </g>
  );
}

function SandShadow({ radius = 30 }: { radius?: number }) {
  return (
    <ellipse
      cy="3"
      rx={radius}
      ry="7"
      fill="#bb813d"
      opacity=".22"
      stroke="none"
    />
  );
}

function Kelp() {
  return (
    <g fill="#36ce78" stroke="#087c70" strokeWidth="4">
      <SandShadow />
      <g className="sea-sway" data-ambient="kelp">
        <path d="M-4 0C-34-22 6-46-24-81Q3-76 7-53C21-72 9-98 24-110Q48-72 20-40C47-58 53-36 38-21Q23-6 16 0Z" />
        <path d="M6-3Q20-47 23-81M4-15-9-46" fill="none" strokeWidth="2.5" />
      </g>
    </g>
  );
}

function Coral({ color = "#ff7345" }: { color?: string }) {
  return (
    <g>
      <SandShadow radius={35} />
      <path
        d="M0-4V-63M0-30Q-30-25-30-55M0-45Q25-40 25-72M-30-41l-13-11M25-54l14-13"
        fill="none"
        stroke="#9f385b"
        strokeWidth="14"
      />
      <path
        d="M0-4V-63M0-30Q-30-25-30-55M0-45Q25-40 25-72M-30-41l-13-11M25-54l14-13"
        fill="none"
        stroke={color}
        strokeWidth="8"
      />
      <path
        d="M-18 0q18-16 36 0"
        fill={color}
        stroke="#9f385b"
        strokeWidth="4"
      />
    </g>
  );
}

function Shell({ color = "#ffae91" }: { color?: string }) {
  return (
    <g fill={color} stroke="#9d4866" strokeWidth="4">
      <SandShadow />
      <path d="M-8 0Q-44-17-28-33Q-22-42-14-34Q-12-53 0-47Q12-53 15-34Q28-44 35-28Q42-13 8 0Z" />
      <path d="M-5-6-21-29M1-7V-36M7-6 24-26" fill="none" strokeWidth="2.5" />
      <path d="M-9 0H10" />
    </g>
  );
}

function Fish({ color = "#ffd441" }: { color?: string }) {
  return (
    <g stroke="#225878" strokeWidth="4" fill={color}>
      <path d="M-22-2-42-18v32l20-11M-10-13 3-26 14-12" />
      <path d="M-25 0Q-14-24 13-14Q29-9 31 0Q13 27-12 14Z" />
      <path d="m-4-3-11 9 14 2" fill="#ff8b44" strokeWidth="2.5" />
      <circle cx="17" cy="-4" r="3.5" fill="#173e61" stroke="none" />
      <path d="m24 5-5 2" fill="none" strokeWidth="2.5" />
    </g>
  );
}

function Jelly() {
  return (
    <g stroke="#7645a5" strokeWidth="4">
      <path
        d="M-18 7q-9 16 1 23t-4 21M0 8q10 17 0 28M19 7q9 15-1 25t4 17"
        fill="none"
      />
      <path
        d="M-33 5C-33-44 33-44 33 5Q23 18 11 7Q0 20-11 7Q-23 18-33 5Z"
        fill="#e88afa"
      />
      <path
        d="M-19-9Q-13-25-3-25"
        fill="none"
        stroke="#ffdcff"
        strokeWidth="5"
      />
      <ellipse cy="-2" rx="14" ry="8" fill="#fff2a5" stroke="none" />
    </g>
  );
}

function Window() {
  return (
    <g stroke="#744a98" strokeWidth="4">
      <circle r="17" fill="#fff5c5" />
      <circle r="11" fill="#22a7c9" />
      <path d="M-5-5 2-9" stroke="#a8fff6" strokeWidth="2.5" />
    </g>
  );
}

function Palace() {
  return (
    <g stroke="#91456c" strokeWidth="5" fill="#ffacb9">
      <SandShadow radius={135} />
      <g data-building-part="palace-towers">
        {[-85, 85].map((x) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <path d="M-27-4V-106Q0-124 27-106V-4Z" fill="#ffcb79" />
            <path
              d="M-33-105Q-35-129-13-140Q-25-162 0-176Q31-160 20-139Q45-119 33-105Z"
              fill="#b78bff"
            />
            <path
              d="M-10-139q29-13 28 7t-29 7M-20-111q21-12 42-2"
              fill="none"
              strokeWidth="2.5"
            />
            <circle cy="-179" r="7" fill="#fff5d7" strokeWidth="2.5" />
          </g>
        ))}
      </g>
      <path
        data-building-part="palace-walls"
        d="M-65-5V-104Q0-134 65-104V-5Z"
      />
      <g data-building-part="palace-shell-roof">
        <path
          d="M-65-100Q-103-135-75-151Q-59-164-43-148Q-49-178-25-178Q-8-186 0-165Q8-186 25-178Q49-178 43-148Q59-164 75-151Q103-135 65-100Z"
          fill="#ff839c"
        />
        <path
          d="M-41-107-65-140M-21-108-30-162M0-108v-44M21-108l9-54M41-107l24-33"
          fill="none"
          strokeWidth="2.5"
        />
        <path d="M-68-100H68" fill="none" />
      </g>
      <path
        data-building-part="palace-door"
        d="M-23-5v-47a23 23 0 0 1 46 0v47Z"
        fill="#2e84c5"
      />
      <path d="M0-58v49" fill="none" strokeWidth="2.5" />
      <circle cx="9" cy="-28" r="3" fill="#ffe25b" stroke="none" />
      <g
        data-building-part="palace-window"
        transform="translate(0 -82) scale(.62)"
      >
        <Window />
      </g>
      <rect
        data-building-part="palace-step"
        x="-120"
        y="-6"
        width="240"
        height="13"
        rx="6"
        fill="#fff0b2"
      />
    </g>
  );
}

// Domed shell over a yellow belly rim, paddle flippers, head peeking out under the rim.
function Turtle() {
  return (
    <g fill="#80dc64" stroke="#28785a" strokeWidth="4">
      <path d="M-28 4Q-48 6-54 20Q-38 26-22 12Z" />
      <path d="M10 6Q18 32 42 32Q48 22 26 2Z" />
      <ellipse cx="42" cy="-10" rx="19" ry="16" />
      <path d="M-44 4Q0 20 40 4Q38 14 0 16Q-40 14-44 4Z" fill="#ffd977" />
      <path d="M-42 5Q-44-38 0-40Q42-38 38 5Q0 14-42 5Z" fill="#1da98e" />
      <g fill="none" strokeWidth="2.5">
        <path
          d="M-12-28H10L19-13 10 2H-12L-21-13ZM-21-13H-40M19-13H36M-12-28-19-37M10-28l7-9M-12 2-17 8M10 2l5 6"
          fill="none"
        />
      </g>
      <circle cx="48" cy="-14" r="4.5" fill="#164747" stroke="none" />
      <circle cx="49.6" cy="-15.6" r="1.6" fill="white" stroke="none" />
      <ellipse
        cx="51"
        cy="-4"
        rx="4.5"
        ry="2.8"
        fill="#ff9a8a"
        opacity=".75"
        stroke="none"
      />
      <path d="M43-4q4 4 9 0" fill="none" strokeWidth="2.5" />
    </g>
  );
}

function Octopus() {
  return (
    <g fill="#e984ed" stroke="#793e98" strokeWidth="4">
      <SandShadow radius={50} />
      <g className="sea-tentacles" data-ambient="octopus-arms">
        <path d="M-27-20Q-34 6-47-9Q-61-13-53 1Q-37 19-21 0Q-27 25-13 20Q-4 17-5 1Q-2 28 9 21Q17 17 13 0Q27 25 38 13Q44 5 31-1Q49 11 54-4Q53-16 44-9Q33-7 27-23Z" />
        <path
          d="m-43 4 4 1M-17 13l2-2M8 14v-3M33 10l-3-3"
          stroke="#ffd4f4"
          strokeWidth="3"
        />
      </g>
      <path d="M-28-22C-42-79 40-79 28-22Q26-5 0-7Q-24-4-28-22Z" />
      <g fill="#382d64" stroke="none">
        <circle cx="-10" cy="-31" r="4" />
        <circle cx="10" cy="-31" r="4" />
      </g>
      <path d="M-5-19q5 6 10 0" fill="none" strokeWidth="2.5" />
      <path d="M-19-46q4-9 12-9" fill="none" stroke="#ffd3f5" strokeWidth="5" />
    </g>
  );
}

function Whale() {
  return (
    <g stroke="#28578d" strokeWidth="5" fill="#698ce9">
      <path d="M88 3Q115-11 110-45Q137-39 138-15Q154-35 174-25Q169 17 129 24L89 36Z" />
      <path d="M-117-9C-104-75 15-68 52-31Q75-6 110 4Q120 58 24 65C-54 75-131 43-117-9Z" />
      <path
        d="M-107 22Q-42 62 103 26Q88 60 23 60Q-64 71-107 22Z"
        fill="#c6eeff"
        stroke="none"
      />
      <path d="M-13 26q29-1 45 24Q5 62-13 26Z" fill="#456bd0" />
      <circle cx="-78" cy="-8" r="6" fill="#20365f" stroke="none" />
      <circle cx="-80" cy="-10" r="2" fill="white" stroke="none" />
      <path d="M-106 9q11 14 25 5" fill="none" strokeWidth="2.5" />
      <path
        d="M-56-61q-17-36-32-19M-56-61q9-40 28-26M-56-61v-34"
        fill="none"
        stroke="#efffff"
        strokeWidth="5"
      />
      <g fill="#dcffff" stroke="#288bb5" strokeWidth="2.5">
        <circle cx="-94" cy="-84" r="6" />
        <circle cx="-21" cy="-91" r="6" />
        <circle cx="-57" cy="-106" r="5" />
      </g>
    </g>
  );
}

export const seaPieces: Record<(typeof SEA_EVENTS)[number]["key"], ReactNode> =
  {
    "bubble-rise": (
      <g className="sea-rise" data-ambient="bubbles">
        <Bubbles />
      </g>
    ),
    "kelp-left": <Kelp />,
    "bubble-high": <Bubbles />,
    "coral-orange": <Coral />,
    "fish-school": (
      <g className="sea-swim" data-ambient="fish-school">
        <Fish />
        <g transform="translate(-49 37) scale(.6)">
          <Fish />
        </g>
        <g transform="translate(19 43) scale(.5)">
          <Fish color="#ff9775" />
        </g>
      </g>
    ),
    "shell-peach": <Shell />,
    "jelly-lantern": (
      <g className="sea-float" data-ambient="jelly-lantern">
        <Jelly />
      </g>
    ),
    "kelp-right": <Kelp />,
    "coral-pink": <Coral color="#ff66b4" />,
    "sea-snails": (
      <g stroke="#b5527a" strokeWidth="3">
        <SandShadow />
        {(
          [
            [-15, 0, 1, "#ff9cc2"],
            [17, 3, 0.75, "#ffc27a"],
          ] as const
        ).map(([x, y, k, color]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${k})`}>
            <path
              d="M-17 0Q-21-24-2-28L14-38Q9-27 17-12Q16 4 0 4H-17Z"
              fill={color}
            />
            <ellipse
              cx="-10"
              cy="-3"
              rx="6"
              ry="4"
              fill="#fff3e6"
              strokeWidth="2"
            />
            <path
              d="M0-20Q11-18 9-8Q6 0-2-3Q-8-7-3-12Q1-14 2-10"
              fill="none"
              strokeWidth="2.5"
            />
          </g>
        ))}
      </g>
    ),
    palace: <Palace />,
    "window-left": <Window />,
    anemone: (
      <g stroke="#9143aa" strokeWidth="5" fill="#cd79f4">
        <SandShadow />
        <path
          d="M-17-4q-24-37-16-40M-8-6q-15-50-6-52M3-5q9-51 19-48M17-5q27-32 25-40"
          fill="none"
        />
        <path d="M-26 0q-3-26 26-26t26 26Z" />
        <g fill="#ffd550" strokeWidth="2.5">
          <circle cy="-37" r="7" />
          <circle cx="-29" cy="-49" r="6" />
          <circle cx="28" cy="-52" r="7" />
        </g>
      </g>
    ),
    starfish: (
      <g fill="#ffad35" stroke="#ac5e35" strokeWidth="4">
        <SandShadow />
        <path d="m0-40 11 23 26 1-20 17 7 23L0 11-23 24l6-24-20-16 26-1Z" />
        <path
          d="M0-26v15M-22-11l12 4M22-11 10-7M-13 12l6-9M13 12 7 3"
          fill="none"
          stroke="#ffe39a"
          strokeWidth="2.5"
        />
      </g>
    ),
    "shell-purple": <Shell color="#c6a1ff" />,
    "pearl-arch": (
      <g fill="#fff9dc" stroke="#ad6f87" strokeWidth="2.5">
        {[
          [-32, -14],
          [-33, -36],
          [-29, -57],
          [-17, -73],
          [17, -73],
          [29, -57],
          [33, -36],
          [32, -14],
        ].map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r="5" />
        ))}
      </g>
    ),
    turtle: (
      <g className="sea-swim" data-ambient="turtle">
        <Turtle />
      </g>
    ),
    "window-right": <Window />,
    octopus: <Octopus />,
    "crown-tower": (
      <g fill="#ffcd79" stroke="#91456c" strokeWidth="5">
        <path d="M-19-12V-45Q0-60 19-45V-12Z" />
        <path d="M-27-43Q-27-57 0-75Q27-57 27-43Z" fill="#b78bff" />
        <path d="M-13-46 0-62 13-46" fill="none" strokeWidth="2.5" />
        <circle cy="-29" r="6" fill="#67e5ee" strokeWidth="2.5" />
      </g>
    ),
    "blue-fish": <Fish color="#7bb9ff" />,
    treasure: (
      <g stroke="#915033" strokeWidth="4">
        <SandShadow radius={36} />
        <path d="M-31-19v-22q31-26 62 0v22Z" fill="#e39432" />
        <path d="M-24-21q24-23 48 0" fill="#ffe766" />
        <rect x="-32" y="-20" width="64" height="29" rx="5" fill="#cb6d36" />
        <path d="M-20-19V7M20-19V7" stroke="#ffd856" strokeWidth="6" />
        <rect x="-6" y="-17" width="12" height="15" rx="3" fill="#ffe469" />
        <g fill="#ffef7d" strokeWidth="2.5">
          <circle cx="-18" cy="-25" r="7" />
          <circle cx="0" cy="-28" r="8" />
          <circle cx="18" cy="-24" r="7" />
        </g>
      </g>
    ),
    "conch-home": (
      <g fill="#ffb567" stroke="#a35760" strokeWidth="4">
        <SandShadow radius={45} />
        <path d="M-37 0Q-57-45-13-64Q-26-84-3-99Q32-83 14-62Q59-39 39 0Z" />
        <path
          d="M-7-62q34-9 30 13t-34 9M-23-74q30-14 28 1M-32-24q-9-16 2-24"
          fill="none"
          strokeWidth="2.5"
        />
        <path d="M-10 0v-19q0-20 20-20t20 20V0Z" fill="#b371d7" />
        <circle cx="-16" cy="-25" r="7" fill="#d5fff5" />
      </g>
    ),
    "tower-pennant": (
      <g stroke="#91456c" strokeWidth="4">
        <path d="M0-7v-37" />
        <path d="M2-36q18-9 34 0l-8 11 8 10Q18-24 2-15Z" fill="#ffd348" />
        <circle cy="-40" r="4" fill="#fff4ce" />
      </g>
    ),
    "jelly-small": (
      <g transform="scale(.65)">
        <Jelly />
      </g>
    ),
    "pearl-garden": (
      <g stroke="#954b7b" strokeWidth="4">
        <SandShadow />
        <path
          d="M-30-2q-13-26 7-32l21 17q25-32 37-7Q42-8 9 1Z"
          fill="#db8df2"
        />
        <circle cy="-16" r="13" fill="#fffbe1" />
        <path d="M-5-21 0-24" stroke="white" strokeWidth="5" />
      </g>
    ),
    crab: (
      <g stroke="#a44247" strokeWidth="4" fill="#ff754f">
        <SandShadow />
        <path
          d="m-20-6-16 8m16-17-15 5m55 4 16 8m-16-17 15 5M-20-17l-17-13M20-17l17-13"
          fill="none"
        />
        <path d="M-37-24q-19-3-10-20l7 11 7-13q14 18-4 22ZM37-24q19-3 10-20l-7 11-7-13q-14 18 4 22Z" />
        <ellipse cy="-11" rx="24" ry="16" />
        <path d="M-9-22v-10M9-22v-10" />
        <g fill="#313a60" stroke="none">
          <circle cx="-9" cy="-33" r="4" />
          <circle cx="9" cy="-33" r="4" />
        </g>
      </g>
    ),
    "palace-medallion": (
      <g fill="#ffe26b" stroke="#ad6d3f" strokeWidth="2.5">
        <circle r="14" />
        <path d="m-8 3 2-10 6 5 6-5 2 10Z" fill="#ff9967" />
      </g>
    ),
    seahorse: (
      <g fill="#ffcd44" stroke="#9b6251" strokeWidth="4">
        <path d="M-4-30q-17-15-14-29Q-17-76 0-73q16 2 13 17l17 7-4 10-19-5Q-1-35 9-22Q29 9 9 24Q-12 37-19 17q-3-13 9-16t11 10q0 7-7 5Q4 22 8 9Q13-3-4-13Z" />
        <path d="m-11-30-18 2 12 16M-14-62l-9-2M-7-72l-5-9" fill="#ff9471" />
        <circle cx="3" cy="-59" r="3" fill="#453454" stroke="none" />
        <path d="m-1-26 8-3M4-15l8-3M8-5l8-2" fill="none" strokeWidth="2.5" />
      </g>
    ),
    "shell-steps": (
      <g fill="#ffe6a7" stroke="#bb8055" strokeWidth="2.5">
        <ellipse rx="27" ry="8" />
        <ellipse cy="20" rx="22" ry="7" />
      </g>
    ),
    "bubble-trail": (
      <g transform="scale(.65)">
        <Bubbles />
      </g>
    ),
    "coral-purple": (
      <g transform="scale(.55)">
        <Coral color="#b893ff" />
      </g>
    ),
    "gold-shell": (
      <g transform="scale(.55)">
        <Shell color="#ffdb55" />
      </g>
    ),
    "whale-finale": (
      <g data-finale="sea-kingdom">
        <g transform="translate(-90 -385)">
          <g className="sea-whale" data-ambient="whale">
            <Whale />
          </g>
        </g>
        <g fill="#fff49a" stroke="#ffd149" strokeWidth="2.5">
          {[-85, 85].map((x) => (
            <g key={x} transform={`translate(${x} -65)`}>
              <circle r="8" />
              <path d="M-24 0h-6M24 0h6M0-24v-6" fill="none" />
            </g>
          ))}
          <path d="M-12-13v-33q0-12 9-14v47ZM4-60q9 2 9 14v33H4Z" />
          <path
            d="M-127-139l-13-9M127-139l13-9M-117-163l-7-14M117-163l7-14"
            fill="none"
            strokeWidth="4"
          />
        </g>
      </g>
    ),
  };
