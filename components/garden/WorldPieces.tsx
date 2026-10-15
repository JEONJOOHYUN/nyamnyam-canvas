import type { ReactNode } from "react";
import type { GrowthPieceKey } from "./growth";

const buildingParts = {
  "mailbox-post": (
    <rect x="73" y="374" width="16" height="65" rx="6" fill="#b66d2b" />
  ),
  "mailbox-box": (
    <g>
      <path
        d="M38 382v-45q0-27 27-27h32q27 0 27 27v45Z"
        fill="#ed4240"
        stroke="#b92c31"
        strokeWidth="4"
      />
      <rect x="53.5" y="338" width="55" height="33" rx="5" fill="white" />
      <path
        d="m55.5 342 25.5 18 25.5-18"
        fill="none"
        stroke="#e2463e"
        strokeWidth="4"
      />
    </g>
  ),
  "mailbox-flag": (
    <path
      d="M124 350v-53h36v28h-36"
      fill="#ffcf1c"
      stroke="#b26b1b"
      strokeWidth="5"
    />
  ),
  "stair-left": <path d="M194 439 250 307" stroke="#9d571f" strokeWidth="13" />,
  "stair-right": (
    <path d="M242 439 298 307" stroke="#9d571f" strokeWidth="13" />
  ),
  "step-1": <path d="M194 429h56" stroke="#ffc044" strokeWidth="14" />,
  "step-2": <path d="M204 406h56" stroke="#ffc044" strokeWidth="14" />,
  "step-3": <path d="M214 383h56" stroke="#ffc044" strokeWidth="14" />,
  "step-4": <path d="M224 360h56" stroke="#ffc044" strokeWidth="14" />,
  "step-5": <path d="M234 337h56" stroke="#ffc044" strokeWidth="14" />,
  "step-6": <path d="M244 314h56" stroke="#ffc044" strokeWidth="14" />,
  "house-post-left": (
    <rect x="278" y="310" width="17" height="113" rx="5" fill="#b76d2d" />
  ),
  "house-post-right": (
    <rect x="372" y="310" width="17" height="113" rx="5" fill="#b76d2d" />
  ),
  "house-floor": (
    <rect x="263" y="298" width="144" height="16" rx="5" fill="#8d4c22" />
  ),
  "wall-left": (
    <rect
      x="268"
      y="205"
      width="43"
      height="93"
      rx="4"
      fill="#ffbd32"
      stroke="#df8d18"
      strokeWidth="3"
    />
  ),
  "wall-right": (
    <rect
      x="363"
      y="205"
      width="35"
      height="93"
      rx="4"
      fill="#ffbd32"
      stroke="#df8d18"
      strokeWidth="3"
    />
  ),
  "wall-top": (
    <rect x="311" y="205" width="52" height="27" rx="3" fill="#ffcf51" />
  ),
  door: (
    <g>
      <path
        d="M315 298v-44q0-22 22-22t22 22v44Z"
        fill="#008f9c"
        stroke="#006875"
        strokeWidth="3"
      />
      <rect x="325" y="249" width="24" height="23" rx="6" fill="#bcf4fa" />
      <circle cx="349" cy="284" r="4" fill="#ffdf49" />
    </g>
  ),
  "letter-sign": (
    <g>
      <rect x="275" y="231" width="30" height="24" rx="4" fill="white" />
      <path
        d="m278 236 12 10 12-10"
        fill="none"
        stroke="#e6433d"
        strokeWidth="3"
      />
    </g>
  ),
  "letter-chute": (
    <g>
      <path
        d="M402 230q55 12 32 61-12 20-32 29"
        fill="none"
        stroke="#e8413e"
        strokeWidth="20"
      />
      <ellipse cx="401" cy="320" rx="13" ry="9" fill="#a62932" />
    </g>
  ),
  "roof-bottom": (
    <path
      d="m276 163-29 39h175l-31-39Z"
      fill="#009fa8"
      stroke="#007b88"
      strokeWidth="4"
    />
  ),
  "roof-middle": (
    <path
      d="m304 128-28 35h115l-30-35Z"
      fill="#00b6bc"
      stroke="#007b88"
      strokeWidth="4"
    />
  ),
  "roof-top": (
    <path
      d="m332 91-28 37h57Z"
      fill="#00a6ad"
      stroke="#007b88"
      strokeWidth="4"
    />
  ),
  "round-window": (
    <g>
      <circle
        cx="332"
        cy="177"
        r="17"
        fill="#fff2a4"
        stroke="#006b78"
        strokeWidth="5"
      />
      <path d="M332 164v26m-13-13h26" stroke="#e8a329" strokeWidth="4" />
    </g>
  ),
  "scope-deck": (
    <rect
      x="459"
      y="302"
      width="58"
      height="10"
      rx="4"
      fill="#d88828"
      stroke="#875020"
      strokeWidth="3"
    />
  ),
  "scope-post": (
    <path
      d="M488 302v-84m-24 125 24-66 24 66"
      fill="none"
      stroke="#007b88"
      strokeWidth="10"
    />
  ),
  "scope-tube": (
    <g transform="rotate(-26 488 218)">
      <rect
        x="470"
        y="147"
        width="36"
        height="76"
        rx="7"
        fill="#ffb927"
        stroke="#d38c1b"
        strokeWidth="4"
      />
      <rect x="478" y="218" width="20" height="16" rx="4" fill="#007b88" />
    </g>
  ),
  "scope-lens": (
    <g transform="rotate(-26 488 218)">
      <rect x="462" y="134" width="52" height="19" rx="7" fill="#007c98" />
      <path d="M473 139h29" stroke="#a3f3ff" strokeWidth="5" />
    </g>
  ),
  "boat-hull": (
    <path
      d="M263 49q72 19 141-3l-24 29h-94Z"
      fill="#ee4e3e"
      stroke="#b82f32"
      strokeWidth="4"
    />
  ),
  "boat-mast": <path d="M329 51V-47" stroke="#af6324" strokeWidth="8" />,
  "sail-small": (
    <path
      d="m316-26-45 63h45Z"
      fill="#ffcc24"
      stroke="#d9961e"
      strokeWidth="3"
    />
  ),
  "sail-big": (
    <path
      d="m341-36 77 65-77 10Z"
      fill="white"
      stroke="#008f9c"
      strokeWidth="5"
    />
  ),
  pennant: <path d="M330-48h44l-12 12h-32Z" fill="#f04c3f" />,
};

// Five round petals a child would draw, straight stem, one leaf per side.
const PETALS = [0, 72, 144, 216, 288].map((deg) => [
  Math.round(Math.sin((deg * Math.PI) / 180) * 8 * 10) / 10,
  Math.round(-Math.cos((deg * Math.PI) / 180) * 8 * 10) / 10,
]);

function Flowers({
  color = "#ff5a4e",
  edge = "#b3342c",
  heart = "#ffd52a",
}: {
  color?: string;
  edge?: string;
  heart?: string;
}) {
  return (
    <g strokeWidth="2.5" strokeLinejoin="round">
      {[-24, 0, 24].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i === 1 ? -10 : 0})`}>
          <path d="M0 0V-30" stroke="#2f8a3c" strokeWidth="3.5" fill="none" />
          <g fill="#4cbf4f" stroke="#2f8a3c">
            <ellipse
              cx="-8"
              cy="-11"
              rx="8"
              ry="4"
              transform="rotate(-30 -8 -11)"
            />
            <ellipse
              cx="8"
              cy="-18"
              rx="8"
              ry="4"
              transform="rotate(30 8 -18)"
            />
          </g>
          <g transform="translate(0 -38)">
            <g className="garden-bloom">
              {PETALS.map(([px, py]) => (
                <circle
                  key={`${px},${py}`}
                  cx={px}
                  cy={py}
                  r="7"
                  fill={color}
                  stroke={edge}
                />
              ))}
              <circle r="5.5" fill={heart} stroke={edge} strokeWidth="2" />
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}

function Tree() {
  return (
    <g>
      <ellipse cy="7" rx="36" ry="9" fill="#469e55" opacity=".2" />
      <path
        d="M0 0v-63m0 32-18-17m18 5 21-18"
        stroke="#975223"
        strokeWidth="9"
        fill="none"
      />
      <path
        d="M-36-57Q-51-83-28-96Q-32-123-7-123Q12-141 29-115Q53-112 44-88Q61-63 34-51Q15-33-5-51Q-23-35-36-57Z"
        fill="#59c54b"
        stroke="#2c823d"
        strokeWidth="3"
      />
      <circle cx="-15" cy="-90" r="7" fill="#ffbf25" />
      <circle cx="22" cy="-75" r="7" fill="#ffbf25" />
    </g>
  );
}

function Fence() {
  return (
    <g stroke="#9b5b26" strokeWidth="7" fill="#ffc34b">
      <ellipse
        cy="10"
        rx="56"
        ry="7"
        fill="#237d46"
        opacity=".18"
        stroke="none"
      />
      <path d="M-49-24H49M-49-5H49" />
      {[-46, -16, 16, 46].map((x) => (
        <path key={x} d={`M${x - 6} 8v-47l6-7 6 7V8Z`} strokeWidth="2" />
      ))}
    </g>
  );
}

function OfficeParts({
  names,
  x,
  y,
}: {
  names: (keyof typeof buildingParts)[];
  x: number;
  y: number;
}) {
  return (
    <g transform={`translate(${-x} ${-y})`}>
      {names.map((name) => (
        <g key={name} data-building-part={name}>
          {buildingParts[name]}
        </g>
      ))}
    </g>
  );
}

export const pieces: Record<GrowthPieceKey, ReactNode> = {
  "path-1": <ellipse rx="26" ry="12" fill="#ffdf83" />,
  "path-2": <ellipse rx="26" ry="12" fill="#ffdf83" />,
  "path-3": <ellipse rx="26" ry="12" fill="#ffdf83" />,
  "path-4": <ellipse rx="26" ry="12" fill="#ffdf83" />,
  mailbox: (
    <OfficeParts names={["mailbox-post", "mailbox-box"]} x={79} y={382} />
  ),
  house: (
    <OfficeParts
      names={[
        "stair-left",
        "stair-right",
        "step-1",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "step-6",
        "house-post-left",
        "house-post-right",
        "house-floor",
        "wall-left",
        "wall-right",
        "wall-top",
        "door",
        "roof-bottom",
        "roof-middle",
        "roof-top",
      ]}
      x={332}
      y={300}
    />
  ),
  "letter-sign": (
    <g transform="scale(1.22)">
      <OfficeParts names={["letter-sign"]} x={290} y={243} />
    </g>
  ),
  "mailbox-flag": (
    <g>
      <OfficeParts names={["mailbox-flag"]} x={138} y={326} />
    </g>
  ),
  "round-window": (
    <g transform="scale(1.25)">
      <OfficeParts names={["round-window"]} x={332} y={177} />
    </g>
  ),
  "letter-chute": <OfficeParts names={["letter-chute"]} x={426} y={275} />,
  telescope: (
    <g transform="scale(.65)">
      <ellipse cy="127" rx="35" ry="8" fill="#237d46" opacity=".2" />
      <OfficeParts
        names={["scope-deck", "scope-post", "scope-tube", "scope-lens"]}
        x={488}
        y={218}
      />
    </g>
  ),
  boat: (
    <g transform="scale(.65)">
      <OfficeParts
        names={["boat-hull", "boat-mast", "sail-small", "sail-big", "pennant"]}
        x={332}
        y={65}
      />
      <path d="M-59 17h26m29 1h38m13-3h15" stroke="#e4ffff" strokeWidth="3" />
    </g>
  ),
  "flowers-left": <Flowers />,
  "flowers-path": <Flowers color="#ffc526" edge="#c47a12" heart="#ff7a1f" />,
  "flowers-right": <Flowers color="#a866ea" edge="#6c3aa6" />,
  "flowers-front": <Flowers color="#ff7fb0" edge="#c54a7c" />,
  "bush-left": (
    <g>
      <ellipse cy="6" rx="43" ry="10" fill="#469e55" opacity=".2" />
      <path
        d="M-42 0q-16-25 9-30-4-26 20-22 18-21 32 1 27-6 25 21 23 22-6 30Z"
        fill="#66c847"
        stroke="#34813d"
        strokeWidth="3"
      />
      <path
        d="m-20-15 5-5m24-9 5-4m6 20 5-3"
        stroke="#f8eaa6"
        strokeWidth="5"
      />
    </g>
  ),
  "tree-left": <Tree />,
  "tree-right": (
    <g transform="scale(.85)">
      <Tree />
    </g>
  ),
  "fence-left": <Fence />,
  "fence-right": <Fence />,
  pond: (
    <g>
      <ellipse rx="90" ry="32" fill="#c4e89b" />
      <ellipse
        rx="78"
        ry="24"
        fill="#91dfe5"
        stroke="#74cacf"
        strokeWidth="3"
      />
      <path d="M-48-6h33m30 16h32" stroke="#e4ffff" strokeWidth="3" />
      <ellipse cx="-26" cy="7" rx="15" ry="6" fill="#96c778" />
      <path d="m-28 5 3-13 9 9Z" fill="#f9c2cd" />
    </g>
  ),
  pinwheel: (
    <g stroke="#704126" strokeWidth="2.5">
      <ellipse
        cy="3"
        rx="20"
        ry="6"
        fill="#237d46"
        opacity=".2"
        stroke="none"
      />
      <path d="M0 0v-86" stroke="#995424" strokeWidth="6" />
      <g transform="translate(0 -86)">
        <g className="garden-spin" data-ambient="pinwheel">
          {["#ef4944", "#ffc523", "#238cde", "#36b35b"].map((color, index) => (
            <g key={color} transform={"rotate(" + index * 90 + ")"}>
              <path d="M0 0-38-38H8L0 0Z" fill={color} />
              <path
                d="M0 0 8-38Q29-19 0 0Z"
                fill={["#ffbe25", "#e9503c", "#5fe0c5", "#246bc2"][index]}
              />
            </g>
          ))}
          <circle r="6" fill="#fff5ce" />
        </g>
      </g>
    </g>
  ),
  garland: (
    <g stroke="#905125" strokeWidth="2.5">
      <path d="M-85 0Q2 32 90 0" fill="none" />
      <circle cx="-85" r="4" fill="#ffca26" />
      <circle cx="90" r="4" fill="#ffca26" />
      <g className="garden-flutter" data-ambient="garland">
        <path
          d="m-72 5 24 6-15 20Zm57 10 24 1-12 21Zm56-6 24-6-6 22Z"
          fill="#f34e42"
        />
        <path d="m-43 12 23 3-12 21Zm56 3 23-4-7 23Z" fill="#ffc925" />
      </g>
    </g>
  ),
  butterfly: (
    <g transform="scale(.8)">
      <g className="garden-wings" data-ambient="butterfly">
        <path
          d="M0 0C-44-40-38 15-5 12-28 40 7 36 0 5C44-35 40 18 7 13 29 40-7 38 0 0Z"
          fill="#b959dc"
          stroke="#683383"
          strokeWidth="2.5"
        />
        <path d="M1-7v24m-1-24-6-6m7 6 6-6" stroke="#58336a" strokeWidth="3" />
      </g>
    </g>
  ),
  reeds: (
    <g stroke="#39833d" strokeWidth="3" fill="none">
      <ellipse
        cy="2"
        rx="20"
        ry="5"
        fill="#39833d"
        opacity=".2"
        stroke="none"
      />
      <path d="M0 0v-44m6 44q18-39 23-40M-7 0q-5-26-16-25" />
      <path d="M0-42v-14m27 17 5-13" stroke="#925425" strokeWidth="7" />
    </g>
  ),
  bird: (
    <g stroke="#18527e" strokeWidth="2.5">
      <g className="garden-bird-wings" data-ambient="bird">
        <path
          d="M-5 0Q-39-15-33-44Q-19-40-1-11M5-7Q4-41 25-46Q36-23 13 3"
          fill="#258bda"
        />
      </g>
      <path d="m-18 8-23-3 9 10-5 9 25-6" fill="#1478c7" />
      <ellipse cy="5" rx="24" ry="17" fill="#36a9ee" />
      <path d="M-12 9Q0 29 19 9" fill="#b5efff" stroke="none" />
      <circle cx="17" cy="-8" r="15" fill="#36a9ee" />
      <path d="m30-9 13 6-13 4Z" fill="#ffb326" />
      <circle cx="22" cy="-12" r="3" fill="#173b5e" stroke="none" />
      <circle cx="23" cy="-13" r="1" fill="white" stroke="none" />
    </g>
  ),
  balloons: (
    <g stroke="#8e442c" strokeWidth="2.5">
      <g className="garden-tether" data-ambient="balloons">
        <path d="M0 0Q-18-47 10-104M0 0Q45-47 43-111" fill="none" />
        <ellipse cx="10" cy="-128" rx="18" ry="24" fill="#fa545c" />
        <ellipse cx="43" cy="-137" rx="18" ry="24" fill="#ffbf24" />
        <path d="m7-104 6 0 2 6H5Zm33-9h6l2 6H38Z" fill="#ed7d24" />
        <path
          d="M2-143q-5 5-4 13m37-24q-5 5-4 13"
          fill="none"
          stroke="#fff4ce"
          strokeWidth="4"
        />
      </g>
      <path d="M-5-3q12-8 9 3-3 8-9 0Zm6 3 6 10" fill="none" />
    </g>
  ),
  chimney: (
    <g>
      <path
        d="M-9 15v-39h18v39Z"
        fill="#e6a369"
        stroke="#b78053"
        strokeWidth="3"
      />
      <rect x="-14" y="-28" width="28" height="10" rx="3" fill="#f9c38c" />
    </g>
  ),
  smoke: (
    <g className="garden-smoke" data-ambient="smoke" fill="#fff9e6">
      <circle cy="-10" r="10" />
      <circle cx="10" cy="-28" r="14" />
      <circle cx="3" cy="-49" r="17" />
    </g>
  ),
  "flying-letter": (
    <g className="garden-drift" data-ambient="flying-letter">
      <path
        d="M-32-8q-25-20-27-7 2 13 27 21m64-14q25-20 27-7-2 13-27 21"
        fill="#ffffff"
        stroke="#287b9a"
        strokeWidth="2.5"
      />
      <rect
        x="-30"
        y="-19"
        width="60"
        height="40"
        rx="6"
        fill="#fff9df"
        stroke="#287b9a"
        strokeWidth="2"
      />
      <path
        d="m-26-14 26 20 26-20"
        stroke="#e85337"
        strokeWidth="3"
        fill="none"
      />
      <path d="m-5 7 5-4 5 4-5 6Z" fill="#f04936" />
    </g>
  ),
  mushrooms: (
    <g>
      <path d="M-15 0v-20M17 0v-11" stroke="#fff0cd" strokeWidth="10" />
      <path d="M-36-19q19-37 40 0ZM4-10q13-25 28 0Z" fill="#edb19a" />
      <circle cx="-19" cy="-26" r="4" fill="#fff4da" />
      <circle cx="-7" cy="-24" r="3" fill="#fff4da" />
    </g>
  ),
  parcel: (
    <g>
      <rect x="-22" y="-16" width="45" height="32" rx="5" fill="#e7922d" />
      <path d="M0-16v32M-22-5h45" stroke="#fff2bd" strokeWidth="6" />
    </g>
  ),
  lanterns: (
    <g data-finale="post-office" strokeLinejoin="round">
      <g transform="translate(0 -209)" stroke="#8d4c22" strokeWidth="3">
        <path d="M0 0v-94" />
        <circle cy="-96" r="5" fill="#ffcf28" />
        <g className="garden-flag" data-ambient="finale-flag">
          <path d="M2-89Q31-103 66-85L58-66 67-45Q33-59 2-45Z" fill="#f34b3d" />
          <rect
            x="16"
            y="-83"
            width="32"
            height="24"
            rx="4"
            fill="#fff4ce"
            stroke="none"
          />
          <path
            d="m18-80 14 11 14-11"
            fill="none"
            stroke="#c54532"
            strokeWidth="2.5"
          />
        </g>
      </g>
      <g fill="#ffd236" stroke="#a8641c" strokeWidth="2.5">
        {[-72, 77].map((x) => (
          <g key={x} transform={"translate(" + x + " 0)"}>
            <path d="M0-97v5" />
            <path d="m-11-84 11-9 11 9v17h-22Z" />
            <path d="M0-82v11" stroke="#fff8c7" strokeWidth="6" />
            <path d="M-18-77h-5M18-77h5" stroke="#ffbd22" />
          </g>
        ))}
      </g>
      <rect x="-7" y="-50" width="24" height="23" rx="6" fill="#ffcd2e" />
      <path d="M-1-46v14m9-14v14" stroke="#fff7bb" strokeWidth="3" />
      <path
        d="M-38-190l-13-10m29-7-4-14m115 18 12-10m-7 36 16-3"
        stroke="#f7ad1b"
        strokeWidth="4"
      />
    </g>
  ),
};
