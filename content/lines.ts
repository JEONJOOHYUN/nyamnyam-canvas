// Every line a character can say. Parents can review this file.
// Rules (spec §4-1, §12): praise and patience only. No scolding, hurrying, comparing,
// or anything about body or weight. Keep each line short (~25 chars) with no variables.
// `tip` is the intonation hint for the Clova Dubbing script (docs/VOICE_SCRIPT.md).

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

export type CharacterLines = Record<LineKey, Line[]>;

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
  stage1: [{ id: "stage-1", text: "씨앗이 생겼어! 냠냠!", tip: "놀라며" }],
  stage2: [{ id: "stage-2", text: "새싹이 쏙 나왔어!", tip: "'쏙' 강조" }],
  stage3: [{ id: "stage-3", text: "작은 나무가 됐어!", tip: "뿌듯하게" }],
  stage4: [{ id: "stage-4", text: "나무가 쑥쑥 컸어!", tip: "'쑥쑥' 리듬감" }],
  stage5: [{ id: "stage-5", text: "예쁜 꽃이 피었어~", tip: "끝을 길게" }],
  stage6: [{ id: "stage-6", text: "열매가 주렁주렁 열렸어!", tip: "신나게" }],
  stage7: [
    { id: "stage-7", text: "새랑 무지개가 놀러 왔어!", tip: "아주 기쁘게" },
  ],
  complete: [{ id: "complete", text: "와아! 그림이 완성됐어!", tip: "환호" }],
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

// Rotates through variants so repeated prompts don't sound identical.
export function pickLine(character: CharacterId, key: LineKey, turn = 0): Line {
  const options = lines[character][key];
  return options[turn % options.length];
}
