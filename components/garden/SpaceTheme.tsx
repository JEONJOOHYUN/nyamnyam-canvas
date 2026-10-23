import { useId, type ReactNode } from "react";
import type { GrowthPiece } from "./growth";

export const SPACE_EVENTS = [
  { key: "mint-crystals", at: 0.03, wide: [62, 520], tall: [45, 525] },
  { key: "ring-planet", at: 0.0488, wide: [550, 110], tall: [350, 115] },
  { key: "moon-mushroom", at: 0.0676, wide: [455, 535], tall: [45, 605] },
  { key: "crescent", at: 0.0864, wide: [320, 105], tall: [215, 220] },
  { key: "first-stars", at: 0.1052, wide: [165, 110], tall: [125, 100] },
  { key: "pink-crystals", at: 0.1368, wide: [950, 630], tall: [470, 705] },
  { key: "space-flowers", at: 0.1684, wide: [100, 635], tall: [70, 930] },
  { key: "little-ufo", at: 0.1999, wide: [480, 270], tall: [85, 290] },
  { key: "landing-pad", at: 0.2315, wide: [860, 400], tall: [410, 500] },
  { key: "comet", at: 0.2631, wide: [735, 90], tall: [430, 255] },
  { key: "rocket-body", at: 0.2947, wide: [860, 406], tall: [410, 505.16] },
  { key: "pink-neighbor", at: 0.3263, wide: [725, 555], tall: [335, 620] },
  { key: "satellite", at: 0.3578, wide: [880, 130], tall: [90, 205] },
  { key: "blue-neighbor", at: 0.3894, wide: [530, 555], tall: [235, 580] },
  { key: "dome-base", at: 0.421, wide: [640, 455], tall: [175, 490] },
  { key: "base-badge", at: 0.4526, wide: [640, 370], tall: [175, 416.9] },
  { key: "rocket-window", at: 0.4842, wide: [860, 406], tall: [410, 505.16] },
  { key: "star-flag", at: 0.5157, wide: [430, 445], tall: [300, 495] },
  { key: "rocket-fins", at: 0.5473, wide: [860, 406], tall: [410, 505.16] },
  { key: "rocket-nose", at: 0.5789, wide: [860, 406], tall: [410, 505.16] },
  { key: "base-lamps", at: 0.6105, wide: [640, 455], tall: [175, 490] },
  { key: "pet-friend", at: 0.6421, wide: [620, 595], tall: [310, 910] },
  { key: "tiny-planet", at: 0.6736, wide: [72, 270], tall: [305, 300] },
  { key: "flower-patch", at: 0.7052, wide: [820, 630], tall: [435, 900] },
  { key: "alien-astronaut", at: 0.7368, wide: [895, 540], tall: [445, 625] },
  { key: "roof-dish", at: 0.7684, wide: [700, 340], tall: [226.6, 391.1] },
  { key: "star-pair", at: 0.8, wide: [645, 235], tall: [450, 65] },
  { key: "door-step", at: 0.8315, wide: [640, 473], tall: [175, 505.48] },
  { key: "sky-sparkles", at: 0.8631, wide: [945, 300], tall: [35, 390] },
  { key: "moon-buggy", at: 0.8947, wide: [450, 645], tall: [330, 710] },
  { key: "small-mushrooms", at: 0.921, wide: [35, 590], tall: [480, 955] },
  { key: "base-heart", at: 0.9474, wide: [640, 414], tall: [175, 454.74] },
  { key: "welcome-star", at: 0.9737, wide: [760, 335], tall: [285, 355] },
  { key: "launch-finale", at: 1, wide: [860, 406], tall: [410, 505.16] },
] as const satisfies readonly GrowthPiece[];

export function SpaceBackground({ tall }: { tall: boolean }) {
  const skyId = useId();
  return (
    <>
      <defs>
        <linearGradient id={skyId} x2="0" y2="1">
          <stop stopColor="#494997" />
          <stop offset=".6" stopColor="#8974cc" />
          <stop offset="1" stopColor="#c3a2eb" />
        </linearGradient>
      </defs>
      <path d="M0 0H1000V700H0Z" fill={`url(#${skyId})`} />
      <path
        d={
          tall
            ? "M0 360Q500 250 1000 360V700H0Z"
            : "M0 410Q500 290 1000 410V700H0Z"
        }
        fill="#c6b9ef"
        stroke="#7265aa"
        strokeWidth="5"
      />
      <path
        d={
          tall
            ? "M0 460Q500 350 1000 460V700H0Z"
            : "M0 570Q500 450 1000 570V700H0Z"
        }
        fill="#c3efdc"
      />
      <path d="M0 660Q500 585 1000 660V700H0Z" fill="#b0e0ce" />
    </>
  );
}

export function SpaceScenery({ tall }: { tall: boolean }) {
  return (
    <g>
      <g fill="#b5a4de" stroke="#8d7abd" strokeWidth="2.5">
        <ellipse cx={tall ? 390 : 710} cy={tall ? 950 : 645} rx="19" ry="6" />
      </g>
      <ellipse
        cx={tall ? 145 : 250}
        cy={tall ? 835 : 565}
        rx={tall ? 125 : 160}
        ry="27"
        fill="#e1ffe9"
      />
      <ellipse
        cx={tall ? 175 : 640}
        cy={tall ? 492 : 457}
        rx={tall ? 112 : 130}
        ry="15"
        fill="#a495cc"
      />
    </g>
  );
}

const ink = "#4e397b";

function Shadow({ radius = 30 }: { radius?: number }) {
  return (
    <ellipse
      cy="4"
      rx={radius}
      ry="7"
      fill="#786aa5"
      opacity=".25"
      stroke="none"
    />
  );
}

function Star() {
  return (
    <path
      d="m0-18 5 12 13 1-10 9 3 13L0 10l-11 7 3-13-10-9 13-1Z"
      fill="#ffe572"
      stroke={ink}
      strokeWidth="2.5"
    />
  );
}

function Crystals({ color = "#58e9db" }: { color?: string }) {
  return (
    <g stroke={ink} strokeWidth="4" fill={color}>
      <Shadow radius={32} />
      <path d="m-7 1-20-7-10-32 12-13 18 17ZM-7 1v-53L7-72l16 20-6 53Z" />
      <path d="m17 1 22-9 9-28-15-10-16 17Z" />
      <path
        d="M7-58V-9M-25-36l8 25M33-31l-7 21"
        fill="none"
        stroke="#f0fffa"
        strokeWidth="2.5"
      />
    </g>
  );
}

function Mushroom() {
  return (
    <g stroke={ink} strokeWidth="4">
      <Shadow />
      <path d="m-9-30-5 30Q0 7 14 0L9-30" fill="#f7efb8" />
      <path d="M-33-27Q-31-66 0-66Q31-66 33-27Q0-15-33-27Z" fill="#ff80c7" />
      <g fill="#fff5ab" strokeWidth="2.5">
        <circle cx="-15" cy="-40" r="6" />
        <circle cx="9" cy="-48" r="7" />
        <circle cx="22" cy="-33" r="4" />
      </g>
      <path d="M-2-18V-5" stroke="#fffbd9" strokeWidth="2.5" />
    </g>
  );
}

function Flowers() {
  return (
    <g stroke={ink} strokeWidth="2.5">
      <Shadow radius={34} />
      {[-22, 0, 23].map((x, index) => (
        <g key={x} transform={`translate(${x} ${index === 1 ? -10 : 0})`}>
          <path
            d="M0 0v-26M0-6q-17-15-16-1Q-9 1 0-6M0-10q17-15 16-1Q9-3 0-10"
            fill="#5edbb4"
          />
          <path
            d="M0-39C-14-54-26-34-13-28C-26-15-5-5 0-18C8-5 26-18 13-28C26-38 8-54 0-39Z"
            fill={index === 1 ? "#ffe371" : "#ff92d5"}
          />
          <circle cy="-29" r="6" fill="#a37aff" />
        </g>
      ))}
    </g>
  );
}

function Eyes({ single = false }: { single?: boolean }) {
  return (
    <g stroke={ink} strokeWidth="2.5" fill="white">
      {(single ? [0] : [-11, 11]).map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="-40" rx={single ? 14 : 10} ry="13" />
          <ellipse cx={x + 2} cy="-39" rx="5" ry="7" fill={ink} stroke="none" />
          <circle cx={x + 3} cy="-42" r="2" stroke="none" />
        </g>
      ))}
      <path d="M-6-20q6 7 12 0" fill="none" />
      <path d="M-22-25h4M18-25h4" stroke="#ee749e" />
    </g>
  );
}

function PinkAlien() {
  return (
    <g stroke={ink} strokeWidth="4" fill="#ff96c7">
      <Shadow radius={37} />
      <path d="M-12-66-18-78M12-66l6-12" fill="none" />
      <circle cx="-19" cy="-80" r="5" fill="#ffe77c" />
      <circle cx="19" cy="-80" r="5" fill="#ffe77c" />
      <path d="M-28-38Q-38-70 0-70Q38-70 28-38L25-8Q24 9 9 0L0-5-9 0Q-24 9-25-8Z" />
      <path d="M-27-33q-22-4-19-19q5-9 11 3l11 3" />
      <g className="space-wave" data-ambient="pink-alien-wave">
        <path d="M25-34q19-7 15-23q-6-8-10 5l-8 5" />
      </g>
      <Eyes single />
    </g>
  );
}

function BlueAlien() {
  return (
    <g stroke={ink} strokeWidth="4" fill="#70daef">
      <Shadow radius={34} />
      <g className="space-bounce" data-ambient="blue-alien-bounce">
        <path d="M-8-58q-12-26 3-24q9 5 5 19q14-28 21-14q1 13-14 20" />
        <path d="M-29-35Q-35-61 0-61Q35-61 29-35L35-20Q37-6 17-5L13 1H2L0-7-6 1H-18L-19-6Q-39-6-35-20Z" />
        <path d="M-29-29q-17 0-14 11M29-29q17 0 14 11" fill="none" />
        <Eyes />
      </g>
    </g>
  );
}

function Astronaut() {
  return (
    <g stroke={ink} strokeWidth="4">
      <Shadow radius={34} />
      <rect x="-33" y="-41" width="15" height="30" rx="6" fill="#9e8ee3" />
      <path
        d="M-20-35h40l7 23-10 2 3 12H5L0-11-5 2h-15l3-12-10-2Z"
        fill="#f2f4ff"
      />
      <path d="m20-29 14-5 4-15" fill="none" />
      <circle cx="38" cy="-50" r="6" fill="#ffcb73" />
      <circle cy="-54" r="32" fill="#c2f5ff" />
      <path d="M-22-44q-5-35 22-35t22 35q-22 15-44 0Z" fill="#ffcb73" />
      <g transform="translate(0 -15) scale(.85)">
        <Eyes />
      </g>
      <path
        d="M-23-65q5-12 15-14"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
      />
      <rect x="-14" y="-29" width="28" height="8" rx="4" fill="#a48be9" />
      <circle cy="-13" r="4" fill="#ff7fa6" strokeWidth="2.5" />
    </g>
  );
}

function Base() {
  return (
    <g stroke={ink} strokeWidth="5">
      <g data-building-part="base-feet" fill="#9b81df">
        <path d="m-83-30-12 28h24l12-28M83-30l12 28H71L59-30" />
      </g>
      <path
        data-building-part="base-dome"
        d="M-89-52Q-88-145 0-145Q88-145 89-52Z"
        fill="#9cf0dc"
      />
      <path
        d="M-66-80q10-43 47-47"
        fill="none"
        stroke="#ecfff5"
        strokeWidth="4"
      />
      <path
        data-building-part="base-rim"
        d="M-115-54Q0-92 115-54L111-33Q0 4-111-33Z"
        fill="#c18fff"
      />
      <path
        data-building-part="base-door"
        d="M-24-9v-41q0-28 24-28t24 28v41Z"
        fill="#ffce7c"
      />
      <circle cx="12" cy="-33" r="3" fill={ink} stroke="none" />
      <g data-building-part="base-windows" fill="#7dcfff" strokeWidth="4">
        <circle cx="-58" cy="-89" r="16" />
        <circle cx="58" cy="-89" r="16" />
      </g>
      <g data-building-part="base-antenna">
        <path d="M0-145v-25" />
        <circle cy="-175" r="9" fill="#ff9acf" />
      </g>
    </g>
  );
}

function RocketPart({ children }: { children: ReactNode }) {
  return (
    <g
      className="space-launch"
      data-ambient="true"
      stroke={ink}
      strokeWidth="5"
    >
      {children}
    </g>
  );
}

export const spacePieces: Record<
  (typeof SPACE_EVENTS)[number]["key"],
  ReactNode
> = {
  "first-stars": (
    <g className="space-twinkle" data-ambient="stars">
      <Star />
      <g transform="translate(-45 48) scale(.55)">
        <Star />
      </g>
      <g transform="translate(55 26) scale(.7)">
        <Star />
      </g>
    </g>
  ),
  "mint-crystals": <Crystals />,
  "ring-planet": (
    <g stroke={ink} strokeWidth="4">
      <circle r="43" fill="#ffbd73" />
      <path
        d="M-28-24q25-15 48 1M-31 5q28-13 61 1M-15 27l26-2"
        fill="none"
        stroke="#d7827d"
        strokeWidth="2.5"
      />
      <g className="space-orbit" data-ambient="planet-ring">
        <ellipse
          rx="71"
          ry="16"
          transform="rotate(-23)"
          fill="none"
          stroke="#4e397b"
          strokeWidth="12"
        />
        <ellipse
          rx="71"
          ry="16"
          transform="rotate(-23)"
          fill="none"
          stroke="#b5f0ed"
          strokeWidth="5"
        />
      </g>
    </g>
  ),
  "moon-mushroom": (
    <g className="space-glow" data-ambient="mushroom-glow">
      <Mushroom />
    </g>
  ),
  crescent: (
    <g stroke={ink} strokeWidth="4">
      <path
        d="M17-37C-42-40-50 31-3 39Q26 45 39 21C-5 35-22-10 17-37Z"
        fill="#fff19b"
      />
      <path
        d="M-25 4q-3 12 6 19"
        stroke="#e6bc6e"
        strokeWidth="2.5"
        fill="none"
      />
    </g>
  ),
  "pink-crystals": <Crystals color="#d69bff" />,
  comet: (
    <g stroke={ink} strokeWidth="4">
      <path d="M-13 16 63-35 49-7 81-14 41 20 58 22 4 40Z" fill="#ff9ac7" />
      <path d="m1 19 40-23" stroke="#ffe790" strokeWidth="4" />
      <circle cy="28" r="19" fill="#ffdc7b" />
    </g>
  ),
  "space-flowers": <Flowers />,
  "little-ufo": (
    <g className="space-float" data-ambient="ufo">
      <g stroke={ink} strokeWidth="4">
        <path d="M-28-4q0-45 28-45t28 45" fill="#a7f2f5" />
        <path d="M-11-17q-4-19 11-19t11 19" fill="#ffa3d3" />
        <circle cx="-4" cy="-25" r="3" fill={ink} stroke="none" />
        <circle cx="5" cy="-25" r="3" fill={ink} stroke="none" />
        <ellipse rx="55" ry="17" fill="#c29bff" />
        <g fill="#fff09a" strokeWidth="2.5">
          <circle cx="-30" r="5" />
          <circle cy="5" r="5" />
          <circle cx="30" r="5" />
        </g>
        <path
          d="m-19 29-4 10M0 31v13M19 29l4 10"
          fill="none"
          stroke="#bff8fc"
          strokeWidth="2.5"
        />
      </g>
    </g>
  ),
  "landing-pad": (
    <g stroke={ink} strokeWidth="4">
      <Shadow radius={64} />
      <ellipse rx="64" ry="14" fill="#9b86cc" />
      <ellipse cy="-5" rx="56" ry="11" fill="#e7ddff" strokeWidth="2.5" />
      <path d="M-38-5h76" stroke="#ad9cdd" strokeWidth="2.5" />
    </g>
  ),
  "dome-base": <Base />,
  "base-badge": (
    <g transform="scale(.55)">
      <Star />
    </g>
  ),
  "rocket-body": (
    <RocketPart>
      <path d="M-28-133Q0-145 28-133V-31Q0-18-28-31Z" fill="#f2f0ff" />
      <path d="m-17-29-3 18h40l-3-18" fill="#9480d4" />
      <path d="M-16-119v58" stroke="white" strokeWidth="4" />
    </RocketPart>
  ),
  "pink-neighbor": <PinkAlien />,
  "rocket-window": (
    <RocketPart>
      <circle cy="-100" r="20" fill="#ffbf75" strokeWidth="4" />
      <circle cy="-100" r="13" fill="#6ed9f0" strokeWidth="2.5" />
      <path d="m-5-105 7-3" stroke="white" strokeWidth="2.5" />
    </RocketPart>
  ),
  satellite: (
    <g transform="rotate(-18)" stroke={ink} strokeWidth="4">
      <path d="M-47 0h94M0-13v-14" />
      <rect x="-14" y="-19" width="28" height="38" rx="8" fill="#ffe5a1" />
      <path d="M-16-30q16 19 32 0Z" fill="#e9edff" />
      <g fill="#74c9ff">
        <rect x="-58" y="-17" width="32" height="34" rx="3" />
        <rect x="26" y="-17" width="32" height="34" rx="3" />
      </g>
      <path d="M-42-16v32M42-16v32M-57 0h30M27 0h30" strokeWidth="2.5" />
      <circle cy="2" r="5" fill="#ff9cbf" strokeWidth="2.5" />
    </g>
  ),
  "rocket-fins": (
    <RocketPart>
      <path d="m-28-66-22 24v31l22-12ZM28-66l22 24v31L28-23Z" fill="#ff8bb8" />
      <path d="M0-57-8-25 0-16l8-9Z" fill="#ffbd73" strokeWidth="4" />
    </RocketPart>
  ),
  "blue-neighbor": <BlueAlien />,
  "rocket-nose": (
    <RocketPart>
      <path d="M-28-133Q-25-166 0-187Q25-166 28-133Z" fill="#ff89b5" />
      <path d="m-13-148 12-21" stroke="#ffd6de" strokeWidth="2.5" />
    </RocketPart>
  ),
  "star-flag": (
    <g stroke={ink} strokeWidth="4">
      <Shadow radius={23} />
      <path d="M0 0v-88" />
      <path d="M2-85q21-10 43 0v34q-22-10-43 0Z" fill="#ffabcb" />
      <circle cy="-92" r="5" fill="#ffe17b" />
      <g transform="translate(23 -69) scale(.5)">
        <Star />
      </g>
    </g>
  ),
  "alien-astronaut": <Astronaut />,
  "base-lamps": (
    <g
      className="space-base-lights"
      data-ambient="base-lights"
      fill="#a9e8f9"
      stroke={ink}
      strokeWidth="2.5"
    >
      {[-80, -48, 48, 80].map((x) => (
        <circle key={x} cx={x} cy={Math.abs(x) === 80 ? -44 : -37} r="5" />
      ))}
    </g>
  ),
  "pet-friend": (
    <g stroke={ink} strokeWidth="4" fill="#bd9dff">
      <Shadow radius={43} />
      {/* Round alien puppy: bobble antennae, two big eyes, wagging tail. */}
      <path d="M26-12q22-6 20-26" fill="none" />
      <circle cx="46" cy="-40" r="6" fill="#ffe98a" strokeWidth="2.5" />
      <path
        d="M-14-46q-6-14-12-18M12-46q6-14 12-18"
        fill="none"
        strokeWidth="3"
      />
      <circle cx="-26" cy="-65" r="6" fill="#ffe98a" strokeWidth="2.5" />
      <circle cx="24" cy="-65" r="6" fill="#ffe98a" strokeWidth="2.5" />
      <path d="M-30-2Q-34-50 0-50Q34-50 30-2Q28 4 18 3Q10 0 0 0Q-10 0-18 3Q-28 4-30-2Z" />
      <path d="M-20 1v5h12V1M8 1v5h12V1" fill="#a882f0" strokeWidth="3" />
      <g fill="white" strokeWidth="2.5">
        <ellipse cx="-11" cy="-28" rx="8" ry="10" />
        <ellipse cx="11" cy="-28" rx="8" ry="10" />
      </g>
      <g fill={ink} stroke="none">
        <circle cx="-10" cy="-26" r="4.5" />
        <circle cx="12" cy="-26" r="4.5" />
      </g>
      <g fill="white" stroke="none">
        <circle cx="-8.5" cy="-28" r="1.6" />
        <circle cx="13.5" cy="-28" r="1.6" />
      </g>
      <g fill="#ff9ccf" stroke="none" opacity=".8">
        <ellipse cx="-21" cy="-14" rx="5" ry="3" />
        <ellipse cx="21" cy="-14" rx="5" ry="3" />
      </g>
      <path d="M-5-13q5 5 10 0" fill="none" strokeWidth="2.5" />
    </g>
  ),
  "tiny-planet": (
    <g stroke={ink} strokeWidth="4">
      <circle r="27" fill="#8fe6c8" />
      <path
        d="M-23-11q16-4 20 9t22 5M-11 16l8 2"
        fill="none"
        strokeWidth="2.5"
      />
    </g>
  ),
  "flower-patch": <Flowers />,
  "roof-dish": (
    <g stroke={ink} strokeWidth="4">
      <path d="M0 0v-24" />
      <path d="M-21-42q2 32 37 25Z" fill="#fff1c4" />
      <path d="m-4-28 10-17" />
      <circle cx="8" cy="-49" r="4" fill="#ff9bc4" />
    </g>
  ),
  "star-pair": (
    <g>
      <Star />
      <g transform="translate(44 -25) scale(.6)">
        <Star />
      </g>
    </g>
  ),
  "door-step": (
    <g stroke={ink} strokeWidth="2.5" fill="#f1dcff">
      <ellipse rx="29" ry="8" />
      <ellipse cy="15" rx="21" ry="6" />
    </g>
  ),
  "moon-buggy": (
    <g stroke={ink} strokeWidth="4">
      <Shadow radius={48} />
      <path d="M-37-17v-18h21l8 12h40v18h-60Z" fill="#ffcb75" />
      <path d="M-5-23v-21h19v21" fill="#b0e8fa" />
      <circle cx="-23" cy="-4" r="12" fill="#a38bdc" />
      <circle cx="25" cy="-4" r="12" fill="#a38bdc" />
      <circle cx="-23" cy="-4" r="4" fill="#eee9ff" strokeWidth="2.5" />
      <circle cx="25" cy="-4" r="4" fill="#eee9ff" strokeWidth="2.5" />
      <path d="M-26-36v-14" />
      <circle cx="-26" cy="-54" r="4" fill="#ff9abd" strokeWidth="2.5" />
    </g>
  ),
  "sky-sparkles": (
    <g>
      <Star />
      <g transform="translate(8 44) scale(.5)">
        <Star />
      </g>
    </g>
  ),
  "small-mushrooms": (
    <g transform="scale(.55)">
      <Mushroom />
    </g>
  ),
  "base-heart": (
    <path
      d="M0 7C-29-9-10-24 0-12C10-24 29-9 0 7Z"
      fill="#ff83ad"
      stroke={ink}
      strokeWidth="2.5"
    />
  ),
  "welcome-star": (
    <g transform="scale(.7)">
      <Star />
    </g>
  ),
  "launch-finale": (
    <g data-finale="space-village">
      <g stroke={ink} strokeWidth="4" fill="#fff0ff">
        <path d="M-60 11Q-80 8-80 22Q-99 27-82 42Q-64 53-48 39Q-24 46-19 29Q-20 11-40 17Q-44 1-60 11ZM60 11Q80 8 80 22Q99 27 82 42Q64 53 48 39Q24 46 19 29Q20 11 40 17Q44 1 60 11Z" />
      </g>
      <path
        d="M-14-27Q-24 5 0 31Q24 5 14-27Z"
        fill="#ff9c47"
        stroke={ink}
        strokeWidth="4"
      />
      <path d="M-6-24Q-12-4 0 13Q12-4 6-24Z" fill="#fff18a" />
      <g
        className="space-twinkle"
        data-ambient="launch-sparkles"
        stroke="#ffe99b"
        strokeWidth="4"
        fill="none"
      >
        <path d="m-69-121-12-7M68-120l12-8M-62-150l-7-13M62-150l7-13" />
      </g>
    </g>
  ),
};
