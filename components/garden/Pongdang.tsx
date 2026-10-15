"use client";

import { useId } from "react";
import { POSE_LABELS, type ChickPose } from "./Chick";
import type { CharacterProps } from "./characters";

// Each arm is one fixed-length limb rooted at a shoulder; poses only move the
// shoulder and turn the arm, so the paw always stays joined to the body.
type ArmPose = readonly [x: number, y: number, angle: number];
const ARMS: Record<ChickPose, readonly [ArmPose, ArmPose]> = {
  hello: [
    [-38, -78, -140],
    [40, -74, 70],
  ],
  point: [
    [-40, -74, 110],
    [40, -80, -25],
  ],
  wonder: [
    [-36, -76, -100],
    [36, -76, -80],
  ],
  celebrate: [
    [-42, -80, -135],
    [42, -80, -45],
  ],
  wait: [
    [-40, -66, 50],
    [40, -66, 130],
  ],
};
const ARM = "M0-11L32-12Q46-12 46 0Q46 12 32 12L0 11A11 11 0 0 1 0-11Z";

function Shell({ pearl = false }: { pearl?: boolean }) {
  return (
    <g stroke="#a84f79" strokeWidth="2.5">
      <path
        d="M-6 11Q-28-1-22-11Q-19-17-12-12Q-12-24-3-22Q3-25 8-16Q19-22 23-12Q31-2 8 11Z"
        fill="#f6b1cf"
      />
      <path
        d="M-14-9-3 7M-4-16 1 7M9-12 5 7M18-6 8 7"
        fill="none"
        stroke="#cd719b"
        strokeWidth="1.8"
      />
      {pearl && <circle cx="1" cy="10" r="6" fill="#fff7e5" stroke="#b2787e" />}
    </g>
  );
}

export function Pongdang({
  pose,
  lookDown = false,
  lookAt,
  mouth,
}: CharacterProps) {
  const titleId = useId();
  const waiting = pose === "wait";
  const wondering = pose === "wonder";
  const celebrating = pose === "celebrate";
  const gazeX = lookAt
    ? Math.max(-5, Math.min(5, lookAt[0] / 30))
    : pose === "point"
      ? 4
      : 0;
  const gazeY = lookAt
    ? Math.max(-4, Math.min(4, lookAt[1] / 30))
    : lookDown
      ? 3
      : wondering
        ? -3
        : 0;
  const lean = pose === "point" ? 8 : pose === "hello" ? -4 : 0;
  const arms = ARMS[pose];

  return (
    <g
      role="img"
      aria-labelledby={titleId}
      data-character="pongdang"
      stroke="#704326"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title id={titleId}>{`아기 해달 퐁당이. ${POSE_LABELS[pose]}`}</title>
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
          transform: `translateY(${celebrating ? -16 : waiting ? 8 : 0}px) rotate(${lean}deg)`,
        }}
      >
        <g
          className={
            celebrating ? "chick-hop" : waiting ? "chick-sway" : "chick-breathe"
          }
          data-ambient
        >
          <g transform="translate(-35 -20) scale(-1 1)">
            <g
              className={pose === "hello" ? "pongdang-tail" : undefined}
              data-ambient
            >
              <path
                d="M0-15C27-23 57-16 63-2C71 17 43 23 20 12L-6 0Z"
                fill="#a66c43"
              />
              <path d="M22-4Q41 6 53 3" fill="none" stroke="#c38b58" />
            </g>
          </g>
          <g
            className="chick-move"
            style={{ transform: `translateY(${waiting ? -8 : 0}px)` }}
            fill="#a96d43"
          >
            <path d="M-17-15Q-35-21-48-5Q-58 8-41 11L-17 8Z" />
            <path d="M17-15Q35-21 48-5Q58 8 41 11L17 8Z" />
            <path
              d="M-38 1-33-3M-28 3-25-3M38 1 33-3M28 3 25-3"
              fill="none"
              strokeWidth="2"
            />
          </g>
          <g
            className="chick-move"
            style={{
              transform: `translateY(${waiting ? 5 : 0}px) scale(1, ${waiting ? 0.92 : 1})`,
            }}
          >
            <path
              d="M-39-91Q0-116 39-91C62-68 61-24 37-9Q0 5-37-9C-61-24-62-68-39-91Z"
              fill="#b07a4f"
            />
            <ellipse cy="-48" rx="32" ry="34" fill="#eac18e" stroke="none" />
          </g>
          <g
            className="chick-move"
            style={{
              transform: `translate(0px, ${waiting ? 10 : 0}px) translate(0px, -137px) rotate(${wondering ? -5 : waiting ? 4 : 0}deg) translate(0px, 137px)`,
            }}
          >
            <g fill="#b07a4f">
              <circle cx="-65" cy="-162" r="9" />
              <circle cx="65" cy="-162" r="9" />
              <path d="M-70-137C-73-172-43-192-2-192C40-194 73-171 72-137C74-101 40-83 0-83C-41-83-73-101-70-137Z" />
            </g>
            <path
              d="M-66-164-64-160M64-160 66-164"
              stroke="#dcad7e"
              strokeWidth="3"
            />
            <path
              d="M-59-141C-59-164-36-177-15-174Q0-171 15-174C38-177 61-162 61-141C67-111 38-94 0-94C-38-94-66-111-59-141Z"
              fill="#fff0cd"
              stroke="none"
            />
            <g transform="translate(43 -184) rotate(22) scale(.67)">
              <Shell pearl />
            </g>
            <g
              className="chick-move"
              style={{ transform: `translate(${gazeX}px, ${gazeY}px)` }}
            >
              <g className="chick-blink" data-ambient stroke="none">
                {[-25, 25].map((x) => (
                  <g key={x}>
                    <ellipse
                      cx={x}
                      cy="-142"
                      rx={wondering ? 18 : 17}
                      ry={wondering ? 25 : 23}
                      fill="#36291f"
                    />
                    <ellipse
                      cx={x + 1}
                      cy="-131"
                      rx="12"
                      ry="9"
                      fill="#5c9db6"
                    />
                    <ellipse
                      cx={x + 2}
                      cy="-129"
                      rx="8"
                      ry="5"
                      fill="#b5e9f4"
                    />
                    <ellipse
                      cx={x - 6}
                      cy="-150"
                      rx="6.5"
                      ry="8"
                      fill="white"
                    />
                    <circle cx={x + 7} cy="-140" r="3.5" fill="white" />
                  </g>
                ))}
              </g>
              <g fill="#f59c85" stroke="none">
                <ellipse cx="-42" cy="-114" rx="12" ry="7" />
                <ellipse cx="42" cy="-114" rx="12" ry="7" />
              </g>
              <ellipse cy="-119" rx="10" ry="6" fill="#513121" stroke="none" />
              <ellipse
                cx="-2"
                cy="-121"
                rx="2.5"
                ry="1.5"
                fill="#fff6e0"
                stroke="none"
              />
              <path
                d="M0-114V-110Q-7-100-13-110M0-110Q7-100 13-110"
                fill="none"
                strokeWidth="2.8"
              />
              {mouth ??
                (wondering ? (
                  <ellipse
                    cy="-101"
                    rx="5"
                    ry="6"
                    fill="#88442e"
                    stroke="none"
                  />
                ) : celebrating ? (
                  <path d="M-7-106Q0-96 7-106" fill="#88442e" stroke="none" />
                ) : null)}
              <path
                d="M-44-111-58-115M-44-105-57-104M44-111 58-115M44-105 57-104"
                fill="none"
                strokeWidth="2"
              />
            </g>
          </g>
          {waiting && (
            <g transform="translate(0 -44) scale(.72)">
              <Shell />
            </g>
          )}
          {arms.map(([x, y, angle], index) => (
            <g
              key={index}
              className="chick-move"
              style={{
                transform: `translate(${x}px, ${y}px) rotate(${pose === "point" && index === 1 && lookDown ? 16 : angle}deg)`,
              }}
            >
              <g
                className={
                  celebrating
                    ? `pongdang-cheer-${index ? "r" : "l"}`
                    : pose === "hello" && index === 0
                      ? "chick-wave"
                      : undefined
                }
                data-ambient
              >
                <path d={ARM} fill="#b07a4f" />
                <path d="M37-5 42-4M36 5 41 4" fill="none" strokeWidth="2" />
              </g>
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}
