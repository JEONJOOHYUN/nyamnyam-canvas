export interface GrowthPiece {
  key: string;
  at: number;
  wide: readonly [number, number];
  tall: readonly [number, number];
  layer?: number;
}

export const GROWTH_PIECES = [
  { key: "path-1", at: 0.03, wide: [490, 577], tall: [27, 611] },
  { key: "flowers-left", at: 0.0488, wide: [75, 655], tall: [55, 930] },
  { key: "bush-left", at: 0.0676, wide: [68, 558], tall: [55, 859] },
  { key: "path-3", at: 0.0864, wide: [584, 537], tall: [125, 577] },
  { key: "flying-letter", at: 0.1052, wide: [475, 132], tall: [182, 75] },
  { key: "fence-left", at: 0.1368, wide: [85, 540], tall: [59, 553] },
  { key: "path-2", at: 0.1684, wide: [537, 557], tall: [76, 594] },
  { key: "path-4", at: 0.1999, wide: [631, 517], tall: [174, 560] },
  { layer: -1, key: "tree-left", at: 0.2315, wide: [65, 470], tall: [55, 540] },
  { key: "mailbox", at: 0.2631, wide: [494, 476], tall: [140, 525] },
  { key: "pond", at: 0.2947, wide: [805, 625], tall: [409, 916] },
  { key: "flowers-right", at: 0.3263, wide: [944, 679], tall: [458, 632] },
  { key: "fence-right", at: 0.3578, wide: [921, 565], tall: [449, 562] },
  {
    layer: -1,
    key: "tree-right",
    at: 0.3894,
    wide: [947, 490],
    tall: [461, 549],
  },
  { key: "house", at: 0.421, wide: [747, 394], tall: [300, 454] },
  { key: "letter-sign", at: 0.4526, wide: [705, 337], tall: [263, 405] },
  { key: "mailbox-flag", at: 0.4842, wide: [553, 420], tall: [191, 476] },
  { key: "round-window", at: 0.5157, wide: [747, 271], tall: [300, 348] },
  { key: "butterfly", at: 0.5473, wide: [485, 615], tall: [344, 623] },
  { key: "pinwheel", at: 0.5789, wide: [400, 676], tall: [280, 966] },
  { key: "letter-chute", at: 0.6105, wide: [841, 369], tall: [380, 433] },
  { key: "garland", at: 0.6421, wide: [747, 296], tall: [300, 370] },
  { key: "reeds", at: 0.6736, wide: [865, 650], tall: [466, 944] },
  { key: "bird", at: 0.7052, wide: [901, 258], tall: [425, 306] },
  { key: "telescope", at: 0.7368, wide: [659, 600], tall: [434, 686] },
  { key: "balloons", at: 0.7684, wide: [539, 420], tall: [179, 476] },
  { key: "chimney", at: 0.8, wide: [805, 240], tall: [350, 322] },
  { key: "smoke", at: 0.8315, wide: [805, 206], tall: [350, 293] },
  { key: "flowers-path", at: 0.8631, wide: [562, 655], tall: [332, 711] },
  { key: "boat", at: 0.8947, wide: [805, 625], tall: [409, 916] },
  { key: "mushrooms", at: 0.921, wide: [172, 609], tall: [83, 962] },
  { key: "parcel", at: 0.9474, wide: [777, 540], tall: [325, 580] },
  { key: "flowers-front", at: 0.9737, wide: [290, 662], tall: [185, 944] },
  { key: "lanterns", at: 1, wide: [747, 394], tall: [300, 454] },
] as const;

export type GrowthPieceKey = (typeof GROWTH_PIECES)[number]["key"];

export function visiblePieces(
  progress: number,
  events: readonly GrowthPiece[] = GROWTH_PIECES,
) {
  const safeProgress = Number.isNaN(progress)
    ? 0
    : Math.max(0, Math.min(1, progress));
  return events.filter((piece) => piece.at <= safeProgress);
}

// Pieces that play the arrival animation when the visible set changes: every piece new since
// the last render, so one big bite brings all of its pieces in together. With no previous set
// (first render, or another theme) only the newest one arrives.
export function arrivingPieces(
  before: readonly string[] | null,
  now: readonly string[],
): string[] {
  if (before === null) return now.slice(-1);
  const seen = new Set(before);
  return now.filter((key) => !seen.has(key));
}

export function buildProgress(
  elapsedMs: number,
  events?: readonly GrowthPiece[],
) {
  // Hold the completed world for a second before the preview alone restarts.
  const progress = Math.min(1, (Math.max(0, elapsedMs) % 21000) / 20000);
  return events ? (visiblePieces(progress, events).at(-1)?.at ?? 0) : progress;
}
