import type { CSSProperties, ReactNode } from "react";

export const CHICK_POSES = [
  "hello",
  "point",
  "wonder",
  "celebrate",
  "wait",
] as const;
export type ChickPose = (typeof CHICK_POSES)[number];

export const POSE_LABELS: Record<ChickPose, string> = {
  hello: "반가워!",
  point: "저기 봐!",
  wonder: "우와!",
  celebrate: "해냈어!",
  wait: "함께 쉴게",
};

// One wing shape, root at the shoulder, pointing along +x. Poses only change
// angle and length, so CSS transitions can blend any pose into any other.
const WING = "M0-11Q30-15 43-3Q49 9 34 12Q15 14 0 9Z";
type WingPose = { angle: number; length: number; wave?: boolean };
const REST: WingPose = { angle: 32, length: 0.95 };
const RAISED: WingPose = { angle: -52, length: 1.85 };
const FOLDED: WingPose = { angle: 126, length: 1 };

function wings(pose: ChickPose, lookDown: boolean): [WingPose, WingPose] {
  switch (pose) {
    case "hello":
      return [{ ...RAISED, wave: true }, REST];
    case "celebrate":
      return [RAISED, RAISED];
    case "point":
      return [
        REST,
        lookDown
          ? { angle: 18, length: 1.25 }
          : { angle: -47, length: 2, wave: true },
      ];
    case "wait":
      return [FOLDED, FOLDED];
    case "wonder":
      return [
        { angle: 12, length: 1 },
        { angle: 12, length: 1 },
      ];
  }
}

const move = (transform: string): CSSProperties => ({ transform });

function Wing({ side, wing }: { side: 1 | -1; wing: WingPose }) {
  return (
    <g transform={side < 0 ? "scale(-1 1)" : undefined}>
      <g
        className="chick-move"
        style={move(`translate(37px, -73px) rotate(${wing.angle}deg)`)}
      >
        <g className={wing.wave ? "chick-wave" : undefined} data-ambient>
          <g className="chick-move" style={move(`scale(${wing.length}, 1)`)}>
            <path d={WING} fill="#ffd329" vectorEffect="non-scaling-stroke" />
          </g>
        </g>
      </g>
    </g>
  );
}

export function Chick({
  pose,
  lookDown = false,
  lookAt,
  mouth,
}: {
  pose: ChickPose;
  lookDown?: boolean;
  lookAt?: readonly [number, number];
  /** Talking mouth drawn under the beak, moving with the head and gaze. */
  mouth?: ReactNode;
}) {
  const waiting = pose === "wait";
  const celebrating = pose === "celebrate";
  const pointing = pose === "point";
  const wondering = pose === "wonder";
  const tilt = wondering
    ? -12
    : pose === "hello"
      ? -6
      : pointing
        ? lookDown
          ? 6
          : -4
        : 0;
  const gazeX = lookAt
    ? Math.max(-7, Math.min(7, lookAt[0] / 25))
    : pointing
      ? 6
      : wondering
        ? 3
        : 0;
  const gazeY = lookAt
    ? Math.max(-6, Math.min(6, lookAt[1] / 25))
    : wondering || celebrating
      ? -6
      : pointing && lookDown
        ? 5
        : 0;
  const lean = tilt + (lookAt && !waiting ? gazeX * 0.6 : 0);
  const [left, right] = wings(pose, lookDown);
  const loop = celebrating ? "chick-hop" : waiting ? "chick-sway" : undefined;

  return (
    <g
      stroke="#ad6315"
      strokeWidth="3.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
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
        style={move(
          `translate(0px, ${celebrating ? -19 : waiting ? 8 : 0}px) translate(0px, -70px) rotate(${lean}deg) translate(0px, 70px)`,
        )}
      >
        <g className={loop} data-ambient>
          <g className="chick-breathe" data-ambient>
            <g fill="#ff8b20" stroke="#cb6817">
              <g
                className="chick-move"
                style={move(`translateY(${celebrating ? -3 : 0}px)`)}
              >
                <ellipse
                  cx="-27"
                  cy="1"
                  rx="23"
                  ry="12"
                  transform="rotate(-12 -27 1)"
                />
              </g>
              <g
                className="chick-move"
                style={move(`translateY(${celebrating ? -8 : 0}px)`)}
              >
                <ellipse
                  cx="27"
                  cy="1"
                  rx="23"
                  ry="12"
                  transform="rotate(12 27 1)"
                />
              </g>
            </g>
            <g
              className="chick-move"
              style={move(
                `translate(0px, -52px) scale(${waiting ? 1.08 : 1}, ${waiting ? 0.83 : 1})`,
              )}
            >
              <ellipse
                rx="49"
                ry="48"
                fill="#ffc914"
                vectorEffect="non-scaling-stroke"
              />
            </g>
            <Wing side={-1} wing={left} />
            <Wing side={1} wing={right} />
            <g
              className="chick-move"
              style={move(
                `translate(0px, -130px) rotate(${wondering ? -9 : 0}deg) translate(0px, 130px)`,
              )}
            >
              <path
                d="M-69-137C-69-174-41-194-13-197Q-24-212-12-213Q1-213 9-197C46-195 70-170 70-137C70-96 41-78 0-78S-69-97-69-137Z"
                fill="#ffd522"
              />
              <path
                d="M-47-167Q-34-180-19-180"
                fill="none"
                stroke="#fff29b"
                strokeWidth="7"
              />
              <g
                className="chick-move"
                style={move(`translate(${gazeX}px, ${gazeY}px)`)}
              >
                <g fill="#ff9275" stroke="none">
                  <ellipse cx="-45" cy="-114" rx="15" ry="9" />
                  <ellipse cx="45" cy="-114" rx="15" ry="9" />
                </g>
                {waiting ? (
                  <path
                    d="M-39-136Q-26-122-13-136M13-136Q26-122 39-136"
                    fill="none"
                    stroke="#432b24"
                    strokeWidth="5"
                  />
                ) : (
                  <g className="chick-blink" stroke="none" data-ambient>
                    {[-27, 27].map((x) => (
                      <g key={x}>
                        <ellipse
                          cx={x}
                          cy="-137"
                          rx="15"
                          ry="21"
                          fill="#392920"
                        />
                        <ellipse
                          cx={x + 2}
                          cy="-127"
                          rx="9"
                          ry="7"
                          fill="#875020"
                        />
                        <ellipse
                          cx={x - 5}
                          cy="-145"
                          rx="6"
                          ry="8"
                          fill="white"
                        />
                        <circle cx={x + 6} cy="-133" r="3.5" fill="white" />
                      </g>
                    ))}
                  </g>
                )}
                <path
                  d="M-12-116Q0-125 12-116Q9-105 0-104Q-9-105-12-116Z"
                  fill="#ff9022"
                  stroke="#cd6717"
                  strokeWidth="2.5"
                />
                {mouth}
                {(celebrating || wondering) && (
                  <path d="M-6-111Q0-99 6-111" fill="#9b411c" stroke="none" />
                )}
              </g>
            </g>
            {waiting && (
              <path
                d="M-35-51Q-21-39-5-44M35-51Q21-39 5-44"
                fill="none"
                stroke="#e69b14"
              />
            )}
          </g>
        </g>
      </g>
      {celebrating && (
        <g fill="#ffce18" stroke="#ed9915" strokeWidth="2">
          <path
            className="chick-twinkle"
            data-ambient
            d="m-99-179 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z"
          />
          <path
            className="chick-twinkle"
            data-ambient
            d="m98-205 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z"
          />
        </g>
      )}
    </g>
  );
}
