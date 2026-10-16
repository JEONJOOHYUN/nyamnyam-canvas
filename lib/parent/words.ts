// Small Korean wording helpers for the parent screens.

// Whether the last syllable of a Hangul word has a final consonant (받침).
function hasFinal(word: string): boolean {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

// "하린" → "하린이의", "지아" → "지아의": how a parent calls a child's table.
export function possessive(name: string): string {
  const n = name.trim();
  return hasFinal(n) ? `${n}이의` : `${n}의`;
}

// "아침 8:05" / "점심 12:40" / "저녁 6:20" for a meal that ended at `date`.
export function mealTime(date: Date): string {
  const h = date.getHours();
  const label = h < 10 ? "아침" : h < 16 ? "점심" : "저녁";
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${label} ${h % 12 || 12}:${m}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// Monday to Sunday of the Korean week that holds `now`, keyed like stamps (YYYY-MM-DD).
// save_meal (0002_save_meal.sql) dates stamps in Korean time, whatever the device's zone.
export function stampWeek(now: number) {
  const today = new Date(now).toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  const base = new Date(`${today}T00:00:00Z`); // the Korean date, read as UTC
  const monday = base.getTime() - ((base.getUTCDay() + 6) % 7) * DAY_MS;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday + i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    return { key, weekday: WEEKDAYS[d.getUTCDay()], future: key > today };
  });
}
