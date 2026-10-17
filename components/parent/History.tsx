"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { mealTime, stampWeek } from "@/lib/parent/words";
import type { Db } from "@/lib/supabase/client";
import type { ChildRow, MealRow, PictureRow } from "@/lib/supabase/types";
import { COLORS, hintClass, pillClass, Section, WorldThumb } from "./ui";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const PICTURES_SHOWN = 8;
const ENDED_BY: Record<MealRow["ended_by"], string> = {
  auto: "자동",
  full_button: "배불러요",
  parent: "보호자",
};
// Calendar day on this device (YYYY-MM-DD).
const dayKey = (d: Date) => d.toLocaleDateString("sv-SE");
type Loaded = {
  meals: MealRow[];
  stampDays: Set<string>;
  pictures: Pick<PictureRow, "id" | "map" | "character">[];
  pictureCount: number;
  now: number;
};

export function History({ db, child }: { db: Db; child: ChildRow }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const since = new Date(now - 14 * DAY_MS).toISOString();
    void Promise.all([
      db
        .from("meals")
        .select("*")
        .eq("child_id", child.id)
        .gte("ended_at", since)
        .order("ended_at", { ascending: false }),
      db
        .from("stamps")
        .select("date")
        .eq("child_id", child.id)
        .gte("date", stampWeek(now)[0].key),
      db
        .from("pictures")
        .select("id, map, character", { count: "exact" })
        .eq("child_id", child.id)
        .order("completed_at", { ascending: false })
        .limit(PICTURES_SHOWN),
    ]).then(([m, st, p]) => {
      // A failed read must not look like "no meals yet".
      const failed = m.error ?? st.error ?? p.error;
      if (failed) return setLoadError(failed.message);
      setLoadError(null);
      setLoaded({
        meals: m.data ?? [],
        stampDays: new Set((st.data ?? []).map((r) => r.date)),
        pictures: p.data ?? [],
        pictureCount: p.count ?? 0,
        now,
      });
    });
  }, [db, child.id, attempt]);

  if (loadError)
    return (
      <div className="grid gap-3">
        <p role="alert" className="text-sm text-destructive">
          식사 기록을 불러오지 못했어요: {loadError}
        </p>
        <Button
          className={`w-fit ${pillClass}`}
          onClick={() => setAttempt((n) => n + 1)}
        >
          다시 불러오기
        </Button>
      </div>
    );
  if (!loaded) return <p className="text-muted-foreground">불러오는 중…</p>;
  const { meals, stampDays, pictures, pictureCount, now } = loaded;

  const week = stampWeek(now);
  const weekStamps = week.filter((d) => stampDays.has(d.key)).length;

  // Grams eaten per day for the last 14 days, oldest first.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY_MS);
    const key = dayKey(d);
    const grams = meals
      .filter((m) => dayKey(new Date(m.ended_at)) === key)
      .reduce((sum, m) => sum + m.eaten_g, 0);
    return {
      key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      day: d.getDate(),
      weekday: WEEKDAYS[d.getDay()],
      grams,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.grams));
  const eatenDays = days.filter((d) => d.grams);
  const average = eatenDays.length
    ? Math.round(
        eatenDays.reduce((sum, d) => sum + d.grams, 0) / eatenDays.length,
      )
    : 0;

  return (
    <div className="grid gap-3.5 md:grid-cols-2">
      <Section title="이번 주 도장판">
        <ul className="grid grid-cols-7 gap-1.5 text-center">
          {week.map((d) => (
            <li
              key={d.key}
              className="grid justify-items-center gap-1 text-xs text-[#567681]"
            >
              <span
                className={`grid aspect-square w-full max-w-12 place-items-center rounded-full ${
                  stampDays.has(d.key)
                    ? ""
                    : "border-2 border-dashed border-[#c3dbe4]"
                } ${d.future ? "opacity-50" : ""}`}
              >
                {stampDays.has(d.key) && <Stamp />}
              </span>
              {d.weekday}
              <span className="sr-only">
                {stampDays.has(d.key) ? "도장 받음" : "도장 없음"}
              </span>
            </li>
          ))}
        </ul>
        <p className={hintClass}>
          잘 먹은 날 도장을 받아요. 이번 주 {weekStamps}개.
        </p>
      </Section>

      <Section title={`완성한 그림 ${pictureCount}장`}>
        {pictures.length === 0 ? (
          <p className={hintClass}>
            아직 완성한 그림이 없어요. 첫 그림을 기다리고 있어요.
          </p>
        ) : (
          <ul className="grid grid-cols-4 gap-1.5">
            {pictures.map((p) => (
              <li
                key={p.id}
                className="overflow-hidden rounded-xl border-[3px] border-white shadow-[0_2px_0_#b9dff0]"
              >
                <WorldThumb theme={p.map} character={p.character} />
              </li>
            ))}
          </ul>
        )}
        {pictureCount > pictures.length && (
          <p className={hintClass}>최근 {pictures.length}장만 보여요.</p>
        )}
      </Section>

      <Section title="최근 14일 먹은 양" wide>
        <p className={`${hintClass} -mt-1`}>
          {days[0].label} ~ {days[13].label}
          {average ? ` · 먹은 날 평균 ${average}g` : ""}
        </p>
        <div
          role="img"
          aria-label={`최근 14일 먹은 양: ${
            eatenDays.map((d) => `${d.label} ${d.grams}g`).join(", ") ||
            "기록 없음"
          }`}
          className="grid grid-cols-14 gap-0.5 sm:gap-1.5"
        >
          {days.map((d, i) => {
            const isToday = i === days.length - 1;
            return (
              <div key={d.key} className="flex min-w-0 flex-col items-center">
                <span className="h-4 text-[10px] leading-4 tracking-tighter whitespace-nowrap text-[#567681] tabular-nums">
                  {d.grams || ""}
                </span>
                <div className="flex h-28 w-full items-end justify-center">
                  {d.grams ? (
                    <div
                      className="w-full max-w-8 rounded-t-[10px] rounded-b-sm"
                      style={{
                        height: `${Math.max(4, (d.grams / max) * 100)}%`,
                        background: isToday ? COLORS.sea : COLORS.orange,
                      }}
                    />
                  ) : (
                    <div className="h-1 w-full max-w-8 rounded-full bg-[#e3eef2]" />
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs leading-4 tabular-nums ${isToday ? "font-extrabold" : "font-medium"}`}
                >
                  {d.day}
                </span>
                <span
                  className={`text-[10px] leading-3 tracking-tighter whitespace-nowrap ${
                    isToday
                      ? "font-extrabold"
                      : d.weekday === "일"
                        ? "text-[#e5484d]"
                        : d.weekday === "토"
                          ? "text-[#3b7be0]"
                          : "text-[#567681]"
                  }`}
                >
                  {isToday ? "오늘" : d.weekday}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="식사 기록" wide>
        {meals.length === 0 ? (
          <p className={hintClass}>최근 14일 동안 기록이 없어요.</p>
        ) : (
          <ul className="grid gap-2">
            {meals.map((m) => {
              const ended = new Date(m.ended_at);
              const pct = m.served_g
                ? Math.min(100, Math.round((m.eaten_g / m.served_g) * 100))
                : 0;
              const minutes = Math.max(
                1,
                Math.round(
                  (ended.getTime() - new Date(m.started_at).getTime()) / 60000,
                ),
              );
              return (
                <li
                  key={m.id}
                  className="grid grid-cols-[44px_1fr_auto] items-center gap-2.5 rounded-2xl bg-[#f6fbfd] px-2.5 py-2"
                >
                  <PlateRing pct={pct} />
                  <span className="grid min-w-0">
                    <strong className="text-sm font-bold">
                      {ended.getMonth() + 1}/{ended.getDate()} (
                      {WEEKDAYS[ended.getDay()]}) {mealTime(ended)}
                    </strong>
                    <span className={hintClass}>
                      {m.eaten_g}g / {m.served_g}g · {minutes}분 ·{" "}
                      {ENDED_BY[m.ended_by]}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11.5px] whitespace-nowrap ${
                      m.completed
                        ? "bg-[#e8f7ec] text-[#22693a]"
                        : "bg-[#eef2f4] text-[#567681]"
                    }`}
                  >
                    {m.completed ? "목표 달성" : "다음에 또"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

// Share of the serving eaten, as a ring around a plate.
function PlateRing({ pct }: { pct: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" className="size-11" aria-label={`${pct}% 먹음`}>
      <circle
        cx="22"
        cy="22"
        r="20"
        fill="#fff"
        stroke="#d7e7ee"
        strokeWidth="2"
      />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={COLORS.orange}
        strokeWidth="5"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      <text
        x="22"
        y="26"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={COLORS.ink}
      >
        {pct}
      </text>
    </svg>
  );
}

// "참 잘했어요" stamp, as on the child's sticker board.
function Stamp() {
  return (
    <svg viewBox="0 0 46 46" className="size-full" aria-hidden="true">
      <circle
        cx="23"
        cy="23"
        r="21"
        fill="#fde7e4"
        stroke="#d9493a"
        strokeWidth="2.5"
      />
      <circle
        cx="23"
        cy="23"
        r="16"
        fill="none"
        stroke="#d9493a"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <g
        textAnchor="middle"
        fontSize="9"
        fill="#d9493a"
        style={{ fontFamily: "var(--font-jua)" }}
      >
        <text x="23" y="21">
          참 잘
        </text>
        <text x="23" y="31">
          했어요
        </text>
      </g>
    </svg>
  );
}
