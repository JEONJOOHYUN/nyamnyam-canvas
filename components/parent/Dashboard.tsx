"use client";

import { motionValue } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import {
  CHARACTERS,
  type GardenCharacterKey,
} from "@/components/garden/characters";
import { THEMES, type GardenThemeKey } from "@/components/garden/themes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pickLine } from "@/content/lines";
import { unlockAudio } from "@/lib/audio/sfx";
import { setVoiceVolume, speak } from "@/lib/audio/voice";
import {
  DEFAULT_SETTINGS,
  fromRow,
  getActiveChild,
  setActiveChild,
  toRow,
  validThresholds,
  type PlaySettings,
} from "@/lib/parent/settings";
import type { Db } from "@/lib/supabase/client";
import type { ChildRow, MealRow } from "@/lib/supabase/types";

const CHARACTER_KEYS = Object.keys(CHARACTERS) as GardenCharacterKey[];
const THEME_KEYS = Object.keys(THEMES) as GardenThemeKey[];

export function Dashboard({ db }: { db: Db }) {
  const [children, setChildren] = useState<ChildRow[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(getActiveChild);
  const [error, setError] = useState<string | null>(null);

  // Bumped to refetch the list after an add or a theme change.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  useEffect(() => {
    void db
      .from("children")
      .select("*")
      .order("created_at")
      .then(({ data, error: e }) => {
        if (e) return setError(e.message);
        setChildren(data);
        setSelected((s) => s ?? data[0]?.id ?? null);
      });
  }, [db, version]);

  const child = children?.find((c) => c.id === selected) ?? null;

  return (
    <div className="grid gap-6">
      {/* Fixed reminder for every parent (spec §4-2). */}
      <Alert>
        <AlertDescription className="font-medium">
          많이 먹이기보다 적정량을 담아 주세요.
        </AlertDescription>
      </Alert>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <ChildrenCard
        db={db}
        items={children}
        selected={selected}
        active={active}
        onSelect={setSelected}
        onActivate={(id) => {
          setActiveChild(id);
          setActive(id);
        }}
        onAdded={(id) => {
          reload();
          setSelected(id);
        }}
      />

      {child && (
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">설정</TabsTrigger>
            <TabsTrigger value="history">식사 기록</TabsTrigger>
            <TabsTrigger value="device">기기</TabsTrigger>
          </TabsList>
          <TabsContent value="settings">
            <SettingsForm
              key={child.id}
              db={db}
              child={child}
              onChildSaved={reload}
            />
          </TabsContent>
          <TabsContent value="history">
            <History key={child.id} db={db} child={child} />
          </TabsContent>
          <TabsContent value="device">
            <Card>
              <CardHeader>
                <CardTitle>기기 연결</CardTitle>
                <CardDescription>
                  저울 기기 등록, 연결 상태, 센서 보정은 다음 단계(7단계)에서
                  추가돼요. 지금은 아이 화면의 시뮬레이터로 체험할 수 있어요.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ChildrenCard({
  db,
  items,
  selected,
  active,
  onSelect,
  onActivate,
  onAdded,
}: {
  db: Db;
  items: ChildRow[] | null;
  selected: string | null;
  active: string | null;
  onSelect: (id: string) => void;
  onActivate: (id: string) => void;
  onAdded: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const { data, error } = await db
      .from("children")
      .insert({ name: name.trim(), age: age ? Number(age) : null })
      .select("id")
      .single();
    if (error) return setMessage(error.message);
    setName("");
    setAge("");
    if (!active) onActivate(data.id);
    onAdded(data.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>아이</CardTitle>
        <CardDescription>
          설정을 바꿀 아이를 고르세요. 이 기기에서 식사할 아이도 여기서 정해요.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {items === null ? (
          <p className="text-muted-foreground">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">
            아직 등록한 아이가 없어요. 아래에서 추가해 주세요.
          </p>
        ) : (
          <ul className="grid gap-2">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border p-3 data-[selected=true]:border-primary"
                data-selected={c.id === selected}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="min-h-11 flex-1 text-left font-medium"
                  aria-pressed={c.id === selected}
                >
                  {c.name}
                  {c.age ? ` (${c.age}살)` : ""}
                </button>
                {c.id === active ? (
                  <Badge>이 기기에서 식사</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onActivate(c.id)}
                  >
                    이 기기에서 식사할 아이로
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <div className="grid gap-2">
            <Label htmlFor="child-name">이름</Label>
            <Input
              id="child-name"
              required
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="child-age">나이</Label>
            <Input
              id="child-age"
              type="number"
              min={1}
              max={12}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-20"
            />
          </div>
          <Button type="submit" variant="secondary">
            아이 추가
          </Button>
        </form>
        {message && (
          <p role="status" className="text-sm text-destructive">
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          required
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24"
        />
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function SwitchField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SettingsForm({
  db,
  child,
  onChildSaved,
}: {
  db: Db;
  child: ChildRow;
  onChildSaved: () => void;
}) {
  const [s, setS] = useState<PlaySettings | null>(null);
  const [look, setLook] = useState({
    character: child.theme_character,
    map: child.theme_map,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const set = <K extends keyof PlaySettings>(key: K, value: PlaySettings[K]) =>
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));

  useEffect(() => {
    void db
      .from("settings")
      .select("*")
      .eq("child_id", child.id)
      .maybeSingle()
      .then(({ data, error }) => {
        // Defaults only when there is no row yet, never after a failed read.
        if (error) return setLoadError(error.message);
        setLoadError(null);
        setS(data ? fromRow(data) : DEFAULT_SETTINGS);
      });
  }, [db, child.id, attempt]);

  if (loadError)
    return (
      <div className="grid gap-3">
        <p role="alert" className="text-sm text-destructive">
          설정을 불러오지 못했어요: {loadError}
        </p>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => setAttempt((n) => n + 1)}
        >
          다시 불러오기
        </Button>
      </div>
    );
  if (!s) return <p className="text-muted-foreground">불러오는 중…</p>;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!validThresholds(s.stageThresholds))
      return setMessage(
        "단계 기준은 1~100 사이에서 점점 커지는 숫자 7개여야 해요.",
      );
    const [settingsRes, childRes] = await Promise.all([
      db.from("settings").upsert(toRow(child.id, s)),
      db
        .from("children")
        .update({ theme_character: look.character, theme_map: look.map })
        .eq("id", child.id),
    ]);
    const error = settingsRes.error ?? childRes.error;
    if (error) return setMessage(error.message);
    setMessage("저장했어요.");
    onChildSaved();
  };

  const preview = () => {
    unlockAudio();
    setVoiceVolume(s.voiceVolume);
    void speak(
      look.character,
      pickLine(look.character, "hello"),
      motionValue(0),
    );
  };

  return (
    <form onSubmit={save} className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>그림 완성 방식</CardTitle>
          <CardDescription>그림 한 장이 언제 완성될지 정해요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RadioGroup
            value={s.mode}
            onValueChange={(v) => set("mode", v as PlaySettings["mode"])}
          >
            {(
              [
                [
                  "amount",
                  "A. 먹은 양 기준",
                  "한 끼에 그림 1장. 담은 음식 중 먹은 만큼 자라요.",
                ],
                [
                  "meals",
                  "B. 식사 횟수 기준",
                  "정한 횟수만큼 잘 먹으면 그림 1장.",
                ],
                [
                  "cumulative",
                  "C. 누적 양 기준",
                  "여러 끼에 걸쳐 정한 g 을 먹으면 그림 1장.",
                ],
              ] as const
            ).map(([value, title, hint]) => (
              <Label key={value} className="flex items-start gap-3 font-normal">
                <RadioGroupItem value={value} className="mt-1" />
                <span>
                  <span className="font-medium">{title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {hint}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
          {s.mode === "meals" && (
            <div className="flex flex-wrap gap-6">
              <NumberField
                id="meals-per-picture"
                label="그림 1장에 필요한 식사"
                value={s.mealsPerPicture}
                min={2}
                max={30}
                unit="끼"
                onChange={(v) => set("mealsPerPicture", v)}
              />
              <NumberField
                id="meal-complete-pct"
                label="한 끼를 '잘 먹음'으로 볼 기준"
                value={s.mealCompletePct}
                min={10}
                max={100}
                unit="%"
                onChange={(v) => set("mealCompletePct", v)}
              />
            </div>
          )}
          {s.mode === "cumulative" && (
            <NumberField
              id="cumulative-target"
              label="그림 1장에 필요한 양"
              value={s.cumulativeTargetG}
              min={100}
              max={20000}
              unit="g"
              onChange={(v) => set("cumulativeTargetG", v)}
            />
          )}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              고급: 단계 기준값(%)
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.stageThresholds.map((t, i) => (
                <Input
                  key={i}
                  type="number"
                  min={1}
                  max={100}
                  aria-label={`${i + 1}단계 기준`}
                  value={t}
                  onChange={(e) =>
                    set(
                      "stageThresholds",
                      s.stageThresholds.map((v, j) =>
                        j === i ? Number(e.target.value) : v,
                      ),
                    )
                  }
                  className="w-20"
                />
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>캐릭터와 테마</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SwitchField
            id="child-picks"
            label="아이가 직접 고르기"
            checked={s.childPicksTheme}
            onChange={(v) => set("childPicksTheme", v)}
          />
          <p className="text-sm text-muted-foreground">
            {s.childPicksTheme
              ? "아이 화면에서 캐릭터와 테마를 고른 뒤 시작해요. 아래 값은 끌 때 쓰여요."
              : "아이 화면은 아래 캐릭터와 테마로 바로 시작해요."}
          </p>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">캐릭터</legend>
            <RadioGroup
              value={look.character}
              onValueChange={(v) =>
                setLook({ ...look, character: v as GardenCharacterKey })
              }
              className="flex flex-wrap gap-4"
            >
              {CHARACTER_KEYS.map((key) => (
                <Label
                  key={key}
                  className="flex items-center gap-2 font-normal"
                >
                  <RadioGroupItem value={key} />
                  {CHARACTERS[key].name}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">테마</legend>
            <RadioGroup
              value={look.map}
              onValueChange={(v) =>
                setLook({ ...look, map: v as GardenThemeKey })
              }
              className="flex flex-wrap gap-4"
            >
              {THEME_KEYS.map((key) => (
                <Label
                  key={key}
                  className="flex items-center gap-2 font-normal"
                >
                  <RadioGroupItem value={key} />
                  {THEMES[key].title}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>배불러요 · 기다림</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SwitchField
            id="full-button"
            label="배불러요 버튼 보이기"
            checked={s.fullButton}
            onChange={(v) => set("fullButton", v)}
          />
          <div className="flex flex-wrap gap-6">
            <NumberField
              id="stamp-pct"
              label="도장을 주는 기준"
              value={s.stampPct}
              min={0}
              max={100}
              unit="% 이상"
              onChange={(v) => set("stampPct", v)}
            />
            <NumberField
              id="idle-seconds"
              label="말을 걸기까지 기다림"
              value={s.idleSeconds}
              min={10}
              max={300}
              unit="초"
              onChange={(v) => set("idleSeconds", v)}
            />
            <NumberField
              id="idle-max"
              label="한 끼에 말 거는 최대 횟수"
              value={s.idleMaxPrompts}
              min={0}
              max={10}
              unit="번"
              onChange={(v) => set("idleMaxPrompts", v)}
            />
          </div>
          <SwitchField
            id="show-percent"
            label="아이 화면에 숫자 % 보이기"
            checked={s.showPercent}
            onChange={(v) => set("showPercent", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>소리</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          {(
            [
              ["sfxVolume", "효과음"],
              ["voiceVolume", "캐릭터 목소리"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="grid gap-3">
              <div className="flex items-center justify-between">
                <span id={`${key}-label`} className="text-sm font-medium">
                  {label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {s[key] === 0 ? "꺼짐" : `${Math.round(s[key] * 100)}%`}
                </span>
              </div>
              <Slider
                aria-labelledby={`${key}-label`}
                min={0}
                max={100}
                step={5}
                value={[Math.round(s[key] * 100)]}
                onValueChange={(v) =>
                  set(key, (Array.isArray(v) ? v[0] : v) / 100)
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={preview}
            className="w-fit"
          >
            {CHARACTERS[look.character].name} 목소리 미리듣기
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>저울 판단</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SwitchField
            id="refill"
            label="추가로 담은 음식도 먹은 양에 넣기"
            checked={s.refillPolicy === "count"}
            onChange={(v) => set("refillPolicy", v ? "count" : "ignore")}
          />
          <SwitchField
            id="anomaly"
            label="한꺼번에 많이 줄면 잠시 보류(쏟음 감지)"
            checked={s.anomalyDetection}
            onChange={(v) => set("anomalyDetection", v)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit">저장</Button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const ENDED_BY: Record<MealRow["ended_by"], string> = {
  auto: "자동",
  full_button: "배불러요",
  parent: "보호자",
};

function History({ db, child }: { db: Db; child: ChildRow }) {
  const [loaded, setLoaded] = useState<{
    meals: MealRow[];
    now: number;
  } | null>(null);
  const [counts, setCounts] = useState({ stamps: 0, pictures: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const since = new Date(Date.now() - 14 * DAY_MS).toISOString();
    const weekAgo = new Date(Date.now() - 7 * DAY_MS)
      .toISOString()
      .slice(0, 10);
    void Promise.all([
      db
        .from("meals")
        .select("*")
        .eq("child_id", child.id)
        .gte("ended_at", since)
        .order("ended_at", { ascending: false }),
      db
        .from("stamps")
        .select("id", { count: "exact", head: true })
        .eq("child_id", child.id)
        .gte("date", weekAgo),
      db
        .from("pictures")
        .select("id", { count: "exact", head: true })
        .eq("child_id", child.id),
    ]).then(([m, st, p]) => {
      // A failed read must not look like "no meals yet".
      const failed = m.error ?? st.error ?? p.error;
      if (failed) return setLoadError(failed.message);
      setLoadError(null);
      setLoaded({ meals: m.data ?? [], now: Date.now() });
      setCounts({ stamps: st.count ?? 0, pictures: p.count ?? 0 });
    });
  }, [db, child.id, attempt]);

  if (loadError)
    return (
      <div className="grid gap-3">
        <p role="alert" className="text-sm text-destructive">
          식사 기록을 불러오지 못했어요: {loadError}
        </p>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => setAttempt((n) => n + 1)}
        >
          다시 불러오기
        </Button>
      </div>
    );
  if (!loaded) return <p className="text-muted-foreground">불러오는 중…</p>;
  const { meals, now } = loaded;

  // Grams eaten per day for the last 14 days, oldest first.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY_MS);
    const key = d.toLocaleDateString("sv-SE");
    const grams = meals
      .filter((m) => new Date(m.ended_at).toLocaleDateString("sv-SE") === key)
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
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary">이번 주 도장 {counts.stamps}개</Badge>
        <Badge variant="secondary">완성한 그림 {counts.pictures}장</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>최근 14일 먹은 양</CardTitle>
          <CardDescription>
            {days[0].label} ~ {days[13].label}
            {average ? ` · 먹은 날 평균 ${average}g` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="img"
            aria-label={`최근 14일 먹은 양: ${
              eatenDays.map((d) => `${d.label} ${d.grams}g`).join(", ") ||
              "기록 없음"
            }`}
            className="grid grid-cols-14 gap-0.5 sm:gap-1.5"
          >
            {days.map((d, i) => {
              const today = i === days.length - 1;
              return (
                <div key={d.key} className="flex min-w-0 flex-col items-center">
                  <span className="h-4 text-[10px] leading-4 text-muted-foreground tabular-nums">
                    {d.grams || ""}
                  </span>
                  <div className="flex h-28 w-full items-end justify-center">
                    {d.grams ? (
                      <div
                        className={`w-full max-w-7 rounded-t-sm ${today ? "bg-primary" : "bg-primary/45"}`}
                        style={{
                          height: `${Math.max(4, (d.grams / max) * 100)}%`,
                        }}
                      />
                    ) : (
                      <div className="h-0.5 w-full max-w-7 rounded-full bg-border" />
                    )}
                  </div>
                  <span
                    className={`mt-1.5 text-xs leading-4 tabular-nums ${today ? "font-bold text-foreground" : "text-foreground/80"}`}
                  >
                    {d.day}
                  </span>
                  <span
                    className={`text-[10px] leading-3 ${
                      today
                        ? "font-bold text-primary"
                        : d.weekday === "일"
                          ? "text-red-500/80"
                          : d.weekday === "토"
                            ? "text-blue-500/80"
                            : "text-muted-foreground"
                    }`}
                  >
                    {today ? "오늘" : d.weekday}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>식사 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <p className="text-muted-foreground">아직 기록이 없어요.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-normal">날짜</th>
                    <th className="py-2 pr-3 font-normal">먹은 양</th>
                    <th className="py-2 pr-3 font-normal">걸린 시간</th>
                    <th className="py-2 pr-3 font-normal">완료</th>
                    <th className="py-2 font-normal">끝낸 방법</th>
                  </tr>
                </thead>
                <tbody>
                  {meals.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="py-2 pr-3">
                        {new Date(m.ended_at).toLocaleString("ko-KR", {
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2 pr-3">
                        {m.eaten_g}g / {m.served_g}g
                      </td>
                      <td className="py-2 pr-3">
                        {Math.max(
                          1,
                          Math.round(
                            (new Date(m.ended_at).getTime() -
                              new Date(m.started_at).getTime()) /
                              60000,
                          ),
                        )}
                        분
                      </td>
                      <td className="py-2 pr-3">{m.completed ? "✓" : "–"}</td>
                      <td className="py-2">{ENDED_BY[m.ended_by]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
