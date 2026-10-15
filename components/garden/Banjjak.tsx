"use client";

import { useId, type CSSProperties } from "react";
import { POSE_LABELS } from "./Chick";
import type { CharacterProps } from "./characters";

type Point = readonly [x: number, y: number];
const REST_ARM: Point = [94, -134];
const ARMS: Record<
  CharacterProps["pose"],
  readonly [left: Point, right: Point]
> = {
  hello: [[-84, -182], REST_ARM],
  point: [
    [-REST_ARM[0], REST_ARM[1]],
    [104, -166],
  ],
  wonder: [
    [-76, -168],
    [76, -168],
  ],
  celebrate: [
    [-96, -192],
    [96, -192],
  ],
  wait: [
    [-90, -106],
    [90, -106],
  ],
};
const WAVE_ARM: Point = [-70, -200];

// Every corner is rounded with the same L/Q commands, so CSS can blend the arm
// tips between poses without splitting the outline.
function starPath(left: Point, right: Point) {
  const corners: [Point, number][] = [
    [[0, -206], 26],
    [[33, -149], 9],
    [right, 24],
    [[52, -84], 9],
    [[62, -2], 18],
    [[0, -36], 9],
    [[-62, -2], 18],
    [[-52, -84], 9],
    [left, 24],
    [[-33, -149], 9],
  ];
  const toward = ([x, y]: Point, [tx, ty]: Point, r: number) => {
    const d = Math.hypot(tx - x, ty - y);
    return `${(x + ((tx - x) * r) / d).toFixed(1)} ${(y + ((ty - y) * r) / d).toFixed(1)}`;
  };
  return (
    corners
      .map(([point, r], i) => {
        const prev = corners[(i + corners.length - 1) % corners.length][0];
        const next = corners[(i + 1) % corners.length][0];
        return `${i ? "L" : "M"}${toward(point, prev, r)}Q${point[0]} ${point[1]} ${toward(point, next, r)}`;
      })
      .join("") + "Z"
  );
}

export function Banjjak({
  pose,
  lookDown = false,
  lookAt,
  mouth,
}: CharacterProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const gradientId = `${id}-body`;
  const celebrating = pose === "celebrate";
  const wondering = pose === "wonder";
  const waiting = pose === "wait";
  const gazeX = lookAt
    ? Math.max(-5, Math.min(5, lookAt[0] / 30))
    : pose === "point"
      ? 5
      : 0;
  const gazeY = lookAt
    ? Math.max(-4, Math.min(4, lookAt[1] / 30))
    : lookDown
      ? 4
      : 0;
  const tilt = pose === "hello" ? -6 : pose === "point" ? 4 : 0;
  const [left, right] = ARMS[pose];
  const outline = starPath(
    left,
    pose === "point" && lookDown ? [102, -118] : right,
  );
  const outlineStyle: CSSProperties & { "--banjjak-wave": string } = {
    d: `path("${outline}")`,
    "--banjjak-wave": `path("${starPath(WAVE_ARM, REST_ARM)}")`,
  };

  return (
    <g
      role="img"
      aria-labelledby={titleId}
      data-character="banjjak"
      stroke="#b77720"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title id={titleId}>{`누나 별 반짝이. ${POSE_LABELS[pose]}`}</title>
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="-205"
          x2="0"
          y2="4"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff4a6" />
          <stop offset=".5" stopColor="#ffdf72" />
          <stop offset="1" stopColor="#ffb582" />
        </linearGradient>
      </defs>
      <ellipse
        cy="8"
        rx="66"
        ry="12"
        fill="#237d46"
        opacity=".17"
        stroke="none"
      />
      <g
        className="chick-move"
        style={{
          transform: `translateY(${celebrating ? -14 : waiting ? -8 : 0}px) rotate(${tilt}deg)`,
        }}
      >
        <g
          className={
            celebrating
              ? "chick-hop"
              : waiting
                ? "banjjak-float"
                : "chick-breathe"
          }
          data-ambient
        >
          <g
            className="chick-move"
            style={{
              transform: `translate(0px, -105px) rotateY(${wondering ? 180 : 0}deg) translate(0px, 105px)`,
            }}
          >
            <path
              d={outline}
              className={`chick-move banjjak-shape${pose === "hello" ? " banjjak-wave" : ""}`}
              style={outlineStyle}
              data-ambient
              fill={`url(#${gradientId})`}
            />
            <path d="M-13-170-3-192" stroke="#fffce1" strokeWidth="7" />
            {/* Comet hair clip: round head with a tail streaming back. */}
            <g
              transform="translate(14 -186) rotate(18) scale(.8)"
              stroke="#925299"
              strokeWidth="2.5"
            >
              <path d="M-2-7Q20-16 48-34Q32-10 3 8Z" fill="#c89be4" />
              <path d="M0-3Q22-6 42-15Q26 1 2 6Z" fill="#f5a5ca" />
              <circle r="8.5" fill="#ffcadc" />
              <circle cx="-3" cy="-3" r="2.5" fill="white" stroke="none" />
            </g>
            <g
              className="chick-move"
              style={{
                transform: `translate(${wondering ? -gazeX : gazeX}px, ${gazeY}px)`,
              }}
            >
              {/* Eyes sit a little low so the lashes stay inside the outline. */}
              <g transform="translate(0 5)">
                <g className="chick-blink" data-ambient>
                  {[-24, 24].map((x) => (
                    <g key={x}>
                      <path
                        d={`M${x - 11}-149l-4-7m12 3-1-8m10 12 3-7`}
                        fill="none"
                        stroke="#66402c"
                        strokeWidth="2.5"
                      />
                      <ellipse
                        cx={x}
                        cy="-134"
                        rx="14"
                        ry="21"
                        fill="#503329"
                        stroke="none"
                      />
                      <ellipse
                        cx={x + 1}
                        cy="-124"
                        rx="9"
                        ry="7"
                        fill="#b47a65"
                        stroke="none"
                      />
                      <ellipse
                        cx={x - 4}
                        cy="-142"
                        rx="5.5"
                        ry="7"
                        fill="white"
                        stroke="none"
                      />
                      <circle
                        cx={x + 6}
                        cy="-131"
                        r="3"
                        fill="white"
                        stroke="none"
                      />
                    </g>
                  ))}
                </g>
              </g>
              <g fill="#f58e89" stroke="none">
                <ellipse cx="-43" cy="-108" rx="13" ry="8" />
                <ellipse cx="43" cy="-108" rx="13" ry="8" />
              </g>
              {wondering ? (
                <ellipse
                  cy="-104"
                  rx="5"
                  ry="6.5"
                  fill="#a3543e"
                  stroke="#89502e"
                  strokeWidth="2.5"
                />
              ) : (
                <path
                  d="M-10-109Q0-99 10-109"
                  fill="none"
                  stroke="#89502e"
                  strokeWidth="3"
                />
              )}
              {mouth ??
                (celebrating ? (
                  <path d="M-7-107Q0-94 7-107" fill="#a3543e" stroke="none" />
                ) : null)}
            </g>
          </g>
        </g>
      </g>
      <g
        className={celebrating ? "banjjak-burst" : "banjjak-orbit"}
        data-ambient
        fill="#fff3b8"
        stroke="#b97b28"
        strokeWidth="2"
      >
        {[
          [-104, -214, 0.8],
          [101, -89, 0.7],
          [-82, -35, 0.55],
        ].map(([x, y, scale], index) => (
          <g key={index} transform={`translate(${x} ${y}) scale(${scale})`}>
            <path
              className="chick-twinkle"
              data-ambient
              d="M0-11Q3-3 11 0Q3 3 0 11Q-3 3-11 0Q-3-3 0-11Z"
            />
          </g>
        ))}
      </g>
      {pose === "point" && (
        <g
          transform={`translate(${lookDown ? 114 : 116} ${lookDown ? -118 : -176})`}
          fill="#fff4b5"
          strokeWidth="2"
        >
          <path
            className="chick-twinkle"
            data-ambient
            d="M0-10 3-3 10 0 3 3 0 10-3 3-10 0-3-3Z"
          />
        </g>
      )}
    </g>
  );
}
