export interface GrowthPiece {
  key: string;
  at: number;
  wide: readonly [number, number];
  tall: readonly [number, number];
  layer?: number;
}

export const GROWTH_PIECES = [
  { key: "path-1", at: 0.03, wide: [490, 577], tall: [27, 611] },
  { key: "flowers-left", at: 0.06, wide: [75, 655], tall: [55, 930] },
  { key: "flying-letter", at: 0.09, wide: [475, 132], tall: [182, 75] },
  { key: "mailbox", at: 0.12, wide: [494, 476], tall: [140, 525] },
  { key: "bush-left", at: 0.15, wide: [68, 558], tall: [55, 859] },
  { key: "path-3", at: 0.18, wide: [584, 537], tall: [125, 577] },
  { key: "fence-left", at: 0.21, wide: [85, 540], tall: [59, 553] },
  { key: "path-2", at: 0.24, wide: [537, 557], tall: [76, 594] },
  { key: "path-4", at: 0.27, wide: [631, 517], tall: [174, 560] },
  { layer: -1, key: "tree-left", at: 0.3, wide: [65, 470], tall: [55, 540] },
  { key: "house", at: 0.33, wide: [747, 394], tall: [300, 454] },
  { key: "letter-sign", at: 0.36, wide: [705, 337], tall: [263, 405] },
  { key: "pond", at: 0.39, wide: [805, 625], tall: [409, 916] },
  { key: "mailbox-flag", at: 0.42, wide: [553, 420], tall: [191, 476] },
  { key: "flowers-right", at: 0.45, wide: [944, 679], tall: [458, 632] },
  { key: "fence-right", at: 0.48, wide: [921, 565], tall: [449, 562] },
  { key: "pinwheel", at: 0.51, wide: [400, 676], tall: [280, 966] },
  { key: "round-window", at: 0.54, wide: [747, 271], tall: [300, 348] },
  {
    layer: -1,
    key: "tree-right",
    at: 0.57,
    wide: [947, 490],
    tall: [461, 549],
  },
  { key: "letter-chute", at: 0.6, wide: [841, 369], tall: [380, 433] },
  { key: "garland", at: 0.63, wide: [747, 296], tall: [300, 370] },
  { key: "butterfly", at: 0.66, wide: [485, 615], tall: [344, 623] },
  { key: "telescope", at: 0.69, wide: [659, 600], tall: [434, 686] },
  { key: "reeds", at: 0.72, wide: [865, 650], tall: [466, 944] },
  { key: "bird", at: 0.75, wide: [901, 258], tall: [425, 306] },
  { key: "balloons", at: 0.78, wide: [539, 420], tall: [179, 476] },
  { key: "boat", at: 0.81, wide: [805, 625], tall: [409, 916] },
  { key: "chimney", at: 0.84, wide: [805, 240], tall: [350, 322] },
  { key: "smoke", at: 0.87, wide: [805, 206], tall: [350, 293] },
  { key: "flowers-path", at: 0.9, wide: [562, 655], tall: [332, 711] },
  { key: "flowers-front", at: 0.93, wide: [290, 662], tall: [185, 944] },
  { key: "mushrooms", at: 0.96, wide: [172, 609], tall: [83, 962] },
  { key: "parcel", at: 0.98, wide: [777, 540], tall: [325, 580] },
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

export function buildProgress(
  elapsedMs: number,
  events?: readonly GrowthPiece[],
) {
  // Hold the completed world for a second before the preview alone restarts.
  const progress = Math.min(1, (Math.max(0, elapsedMs) % 21000) / 20000);
  return events ? (visiblePieces(progress, events).at(-1)?.at ?? 0) : progress;
}
