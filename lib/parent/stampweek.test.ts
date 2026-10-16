import { describe, expect, it } from "vitest";
import { stampWeek } from "./words";

describe("stampWeek", () => {
  it("uses the Korean week whatever the device time zone", () => {
    // Sunday 2026-10-18 18:00 UTC is Monday 2026-10-19 03:00 in Seoul.
    const week = stampWeek(Date.UTC(2026, 9, 18, 18));
    expect(week[0]).toMatchObject({ key: "2026-10-19", weekday: "월" });
    expect(week[6]).toMatchObject({ key: "2026-10-25", weekday: "일" });
    expect(week.filter((d) => d.future)).toHaveLength(6);
  });

  it("runs Monday to Sunday around a Friday", () => {
    const week = stampWeek(Date.UTC(2026, 9, 16, 3)); // Fri 10/16 12:00 KST
    expect(week.map((d) => d.key)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
    expect(week[4].future).toBe(false);
    expect(week[5].future).toBe(true);
  });
});
