// Every line a character can say. Parents can review this file.
// Rules (spec §4-1, §12): praise and patience only. No scolding, hurrying, comparing,
// or anything about body or weight. Keep each line short (~25 chars) with no variables.
// `tip` is the intonation hint for the Clova Dubbing script (docs/VOICE_SCRIPT.md).

import type { GardenThemeKey } from "@/components/garden/themes";

export type Line = { id: string; text: string; tip?: string };

export type LineKey =
  | "hello"
  | "trayEmpty"
  | "trayFood"
  | "serve"
  | "stage1"
  | "stage2"
  | "stage3"
  | "stage4"
  | "stage5"
  | "stage6"
  | "stage7"
  | "complete"
  | "full"
  | "fullStamp"
  | "pause"
  | "idle"
  | "touch";

// Stage cheers name what just appeared, so they differ per theme. The plain keys are the
// post office (default theme); other themes use "<theme>:<key>".
type ThemedKey = Extract<LineKey, `stage${number}` | "complete">;
type ThemedLineKey = `${Exclude<GardenThemeKey, "post">}:${ThemedKey}`;

export type CharacterLines = Record<LineKey | ThemedLineKey, Line[]>;

// 냠냠이 (chick): bright and cute, short exclamations.
const nyamnyam: CharacterLines = {
  hello: [{ id: "hello", text: "안녕! 나는 냠냠이야!", tip: "밝게 인사" }],
  trayEmpty: [
    { id: "tray-empty", text: "빈 식판을 올려 줄래?", tip: "부드럽게 부탁" },
  ],
  trayFood: [
    { id: "tray-food", text: "이제 맛있는 밥을 담아 줘!", tip: "설레는 느낌" },
  ],
  serve: [{ id: "serve", text: "우와, 맛있겠다! 같이 먹자!", tip: "신나게" }],
  stage1: [{ id: "stage-1", text: "편지가 날아왔어! 냠냠!", tip: "놀라며" }],
  stage2: [{ id: "stage-2", text: "빨간 우체통이 생겼어!", tip: "신나게" }],
  stage3: [
    { id: "stage-3", text: "우체국이 뚝딱 지어졌어!", tip: "'뚝딱' 강조" },
  ],
  stage4: [
    { id: "stage-4", text: "바람개비가 빙글빙글!", tip: "'빙글빙글' 리듬감" },
  ],
  stage5: [
    { id: "stage-5", text: "망원경이 생겼어! 저기 봐!", tip: "뿌듯하게" },
  ],
  stage6: [{ id: "stage-6", text: "돛배가 둥둥 떠 있어~", tip: "끝을 길게" }],
  stage7: [{ id: "stage-7", text: "꽃이 활짝 피었어!", tip: "아주 기쁘게" }],
  complete: [{ id: "complete", text: "와아! 우체국이 완성됐어!", tip: "환호" }],
  // Sea kingdom: stage k lands at meal 10/25/40/55/70/85/95%, scene 10.5/26/42/58/74/89/100%.
  "sea:stage1": [
    {
      id: "sea-stage-1",
      text: "보글보글 물방울이 생겼어!",
      tip: "'보글보글' 리듬감",
    },
  ],
  "sea:stage2": [
    { id: "sea-stage-2", text: "물고기 친구들이 왔어!", tip: "신나게" },
  ],
  "sea:stage3": [
    { id: "sea-stage-3", text: "조개 궁전이 생겼어!", tip: "놀라며" },
  ],
  "sea:stage4": [
    { id: "sea-stage-4", text: "거북이가 헤엄쳐 왔어~", tip: "끝을 길게" },
  ],
  "sea:stage5": [
    { id: "sea-stage-5", text: "반짝반짝 보물상자다!", tip: "뿌듯하게" },
  ],
  "sea:stage6": [
    { id: "sea-stage-6", text: "해마가 놀러 왔어!", tip: "신나게" },
  ],
  "sea:stage7": [
    { id: "sea-stage-7", text: "고래가 인사하러 왔어!", tip: "아주 기쁘게" },
  ],
  "sea:complete": [
    { id: "sea-complete", text: "와아! 바다 왕국 완성이야!", tip: "환호" },
  ],
  // Space village: same scene thresholds as above.
  "space:stage1": [
    {
      id: "space-stage-1",
      text: "반짝반짝 별이 떴어!",
      tip: "'반짝반짝' 리듬감",
    },
  ],
  "space:stage2": [
    { id: "space-stage-2", text: "혜성이 슝 날아가!", tip: "'슝' 강조" },
  ],
  "space:stage3": [
    { id: "space-stage-3", text: "우리 기지가 생겼어!", tip: "놀라며" },
  ],
  "space:stage4": [
    { id: "space-stage-4", text: "로켓이 다 만들어졌어!", tip: "뿌듯하게" },
  ],
  "space:stage5": [
    { id: "space-stage-5", text: "우주인 친구가 왔어!", tip: "신나게" },
  ],
  "space:stage6": [
    {
      id: "space-stage-6",
      text: "월면차가 부릉부릉!",
      tip: "'부릉부릉' 리듬감",
    },
  ],
  "space:stage7": [
    { id: "space-stage-7", text: "로켓에 불이 켜졌어!", tip: "아주 기쁘게" },
  ],
  "space:complete": [
    { id: "space-complete", text: "와아! 우주 마을 완성이야!", tip: "환호" },
  ],
  full: [{ id: "full", text: "배부르구나! 잘 먹었어!", tip: "다정하게" }],
  fullStamp: [
    { id: "full-stamp", text: "오늘 도장 쾅! 최고야!", tip: "'쾅' 강조" },
  ],
  pause: [{ id: "pause", text: "잠깐 쉬는 중이야~", tip: "느긋하게" }],
  idle: [
    { id: "idle-1", text: "천천히 먹어도 괜찮아~", tip: "느긋하게" },
    { id: "idle-2", text: "냠냠이는 여기서 기다릴게!", tip: "다정하게" },
    { id: "idle-3", text: "꼭꼭 씹어서 먹어 보자~", tip: "느긋하게" },
  ],
  touch: [
    { id: "touch-1", text: "간지러워! 히히!", tip: "웃으며" },
    { id: "touch-2", text: "냠냠! 반가워!", tip: "밝게" },
    { id: "touch-3", text: "나 불렀어?", tip: "궁금하게, 끝 올림" },
  ],
};

export const lines = { nyamnyam } satisfies Record<string, CharacterLines>;
export type CharacterId = keyof typeof lines;

const isThemed = (key: LineKey): key is ThemedKey =>
  key === "complete" || key.startsWith("stage");

// Rotates through variants so repeated prompts don't sound identical.
export function pickLine(
  character: CharacterId,
  key: LineKey,
  turn = 0,
  theme: GardenThemeKey = "post",
): Line {
  const byKey = lines[character];
  const options =
    theme !== "post" && isThemed(key) ? byKey[`${theme}:${key}`] : byKey[key];
  return options[turn % options.length];
}
