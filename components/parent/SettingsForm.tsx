"use client";

import { motionValue } from "motion/react";
import { Volume2 } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  CHARACTERS,
  type GardenCharacterKey,
} from "@/components/garden/characters";
import { THEMES, type GardenThemeKey } from "@/components/garden/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { pickLine } from "@/content/lines";
import { unlockAudio } from "@/lib/audio/sfx";
import { setVoiceVolume, speak } from "@/lib/audio/voice";
import {
  DEFAULT_SETTINGS,
  fromRow,
  toRow,
  validThresholds,
  type PlaySettings,
} from "@/lib/parent/settings";
import type { Db } from "@/lib/supabase/client";
import type { ChildRow } from "@/lib/supabase/types";
import {
  COLORS,
  CharacterArt,
  goClass,
  hintClass,
  pillClass,
  Section,
  StepperRow,
  SwitchRow,
  THEME_COLOR,
  WorldThumb,
} from "./ui";

const CHARACTER_KEYS = Object.keys(CHARACTERS) as GardenCharacterKey[];
const THEME_KEYS = Object.keys(THEMES) as GardenThemeKey[];

const MODES: [PlaySettings["mode"], string, string, ReactNode][] = [
  [
    "amount",
    "먹은 양",
    "한 끼에 1장, 먹은 만큼 자라요",
    <svg key="amount" viewBox="0 0 44 44" aria-hidden="true">
      <ellipse
        cx="22"
        cy="30"
        rx="18"
        ry="7"
        fill="#ffe2bd"
        stroke="#e8892b"
        strokeWidth="2"
      />
      <path
        d="M12 28c2-8 18-8 20 0"
        fill="#ffd23f"
        stroke="#e2a92b"
        strokeWidth="2"
      />
      <path
        d="M22 6v10M18 11l4 5 4-5"
        fill="none"
        stroke="#1a8fb0"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>,
  ],
  [
    "meals",
    "식사 횟수",
    "정한 끼 수만큼 잘 먹으면 1장",
    <svg key="meals" viewBox="0 0 44 44" aria-hidden="true">
      <rect
        x="5"
        y="8"
        width="34"
        height="29"
        rx="6"
        fill="#fff"
        stroke="#1a8fb0"
        strokeWidth="2"
      />
      <path d="M5 16h34" stroke="#1a8fb0" strokeWidth="2" />
      <g fill="#3aa55c">
        <circle cx="13" cy="24" r="3" />
        <circle cx="22" cy="24" r="3" />
        <circle cx="31" cy="24" r="3" />
        <circle cx="13" cy="31" r="3" />
      </g>
      <circle
        cx="22"
        cy="31"
        r="3"
        fill="none"
        stroke="#99bbbb"
        strokeWidth="1.5"
      />
    </svg>,
  ],
  [
    "cumulative",
    "누적 양",
    "여러 끼 합쳐 정한 g이면 1장",
    <svg key="cumulative" viewBox="0 0 44 44" aria-hidden="true">
      <path
        d="M12 10h20v4c4 2 5 6 5 12 0 7-5 12-15 12S7 33 7 26c0-6 1-10 5-12z"
        fill="#e9f7ff"
        stroke="#6a4fc4"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 26h26c0 6-5 10-13 10S9 32 9 26z" fill="#ffd23f" />
      <path
        d="M12 10h20"
        stroke="#6a4fc4"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>,
  ],
];

// A card that is one radio choice. The radio itself sits in the corner for keyboard and
// screen readers; the whole card is its label.
const choiceClass =
  "tap-pop relative grid cursor-pointer content-start justify-items-center gap-1 rounded-[18px] border-[3px] p-0 text-center leading-snug font-normal";

export function SettingsForm({
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
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
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
          className={`w-fit ${pillClass}`}
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
      return setMessage({
        text: "단계 기준은 1~100 사이에서 점점 커지는 숫자 7개여야 해요.",
        error: true,
      });
    setSaving(true);
    const [settingsRes, childRes] = await Promise.all([
      db.from("settings").upsert(toRow(child.id, s)),
      db
        .from("children")
        .update({ theme_character: look.character, theme_map: look.map })
        .eq("id", child.id),
    ]);
    setSaving(false);
    const error = settingsRes.error ?? childRes.error;
    if (error) return setMessage({ text: error.message, error: true });
    setMessage({ text: "저장했어요.", error: false });
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
    <form onSubmit={save}>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Section
          n={1}
          color={COLORS.orange}
          title="그림은 언제 완성될까요?"
          wide
        >
          <RadioGroup
            aria-label="그림 완성 방식"
            value={s.mode}
            onValueChange={(v) => set("mode", v as PlaySettings["mode"])}
            className="grid grid-cols-3 gap-2"
          >
            {MODES.map(([value, title, hint, icon]) => (
              <Label
                key={value}
                className={`${choiceClass} border-[#e3eef2] bg-[#f8fcfe] px-2 py-2.5 has-[[data-checked]]:border-[#e8892b] has-[[data-checked]]:bg-[#fff6ea]`}
              >
                <RadioGroupItem
                  value={value}
                  className="absolute top-2 right-2"
                />
                <span className="size-11">{icon}</span>
                <strong className="text-[15px] font-bold">{title}</strong>
                <span className="text-[11.5px] text-[#567681]">{hint}</span>
              </Label>
            ))}
          </RadioGroup>
          {s.mode === "meals" && (
            <>
              <StepperRow
                label="그림 1장에 필요한 식사"
                value={s.mealsPerPicture}
                min={2}
                max={30}
                step={1}
                unit="끼"
                onChange={(v) => set("mealsPerPicture", v)}
              />
              <StepperRow
                label="'잘 먹음'으로 볼 기준"
                value={s.mealCompletePct}
                min={10}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => set("mealCompletePct", v)}
              />
            </>
          )}
          {s.mode === "cumulative" && (
            <StepperRow
              label="그림 1장에 필요한 양"
              value={s.cumulativeTargetG}
              min={100}
              max={20000}
              step={100}
              unit="g"
              onChange={(v) => set("cumulativeTargetG", v)}
            />
          )}
          <details>
            <summary className="cursor-pointer text-[13px] text-[#4b7280]">
              고급: 그림이 한 단계씩 바뀌는 지점
            </summary>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {s.stageThresholds.map((t, i) => (
                <label key={i} className="grid gap-1 text-center text-[11px]">
                  <span className="text-[#567681]">{i + 1}단계</span>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    aria-label={`${i + 1}단계 기준 %`}
                    value={t}
                    onChange={(e) =>
                      set(
                        "stageThresholds",
                        s.stageThresholds.map((v, j) =>
                          j === i ? Number(e.target.value) : v,
                        ),
                      )
                    }
                    className="h-9 rounded-xl text-center tabular-nums"
                  />
                </label>
              ))}
            </div>
          </details>
        </Section>

        <Section n={2} color={COLORS.sea} title="누구랑, 어디로 갈까요?" wide>
          <SwitchRow
            id="child-picks"
            label="아이가 직접 고르기"
            hint={
              s.childPicksTheme
                ? "아이 화면에서 친구와 세계를 고른 뒤 시작해요. 아래는 끌 때 쓰여요."
                : "아이 화면은 아래 친구와 세계로 바로 시작해요."
            }
            checked={s.childPicksTheme}
            onChange={(v) => set("childPicksTheme", v)}
          />
          <div className="grid gap-2 md:grid-cols-2 md:items-start">
            <RadioGroup
              aria-label="캐릭터"
              value={look.character}
              onValueChange={(v) =>
                setLook({ ...look, character: v as GardenCharacterKey })
              }
              className="grid grid-cols-3 gap-2"
            >
              {CHARACTER_KEYS.map((key) => {
                const color = THEME_COLOR[CHARACTERS[key].theme];
                return (
                  <Label
                    key={key}
                    className={`${choiceClass} overflow-hidden bg-white has-[[data-checked]]:outline-4 has-[[data-checked]]:outline-[#ffd23f]`}
                    style={{ borderColor: color }}
                  >
                    <RadioGroupItem
                      value={key}
                      className="absolute top-2 right-2 bg-white"
                    />
                    <span className="aspect-square w-full p-1">
                      <CharacterArt character={key} />
                    </span>
                    <strong
                      className="w-full py-1 text-sm font-bold text-white"
                      style={{ background: color }}
                    >
                      {CHARACTERS[key].name}
                    </strong>
                  </Label>
                );
              })}
            </RadioGroup>
            <RadioGroup
              aria-label="테마"
              value={look.map}
              onValueChange={(v) =>
                setLook({ ...look, map: v as GardenThemeKey })
              }
              className="grid grid-cols-3 gap-2"
            >
              {THEME_KEYS.map((key) => (
                <Label
                  key={key}
                  className={`${choiceClass} gap-0 overflow-hidden bg-white has-[[data-checked]]:outline-4 has-[[data-checked]]:outline-[#ffd23f]`}
                  style={{ borderColor: THEME_COLOR[key] }}
                >
                  <RadioGroupItem
                    value={key}
                    className="absolute top-2 right-2 z-10 bg-white"
                  />
                  <WorldThumb theme={key} character={look.character} />
                  <strong
                    className="w-full px-1 py-1 text-[13px] font-bold text-white"
                    style={{ background: THEME_COLOR[key] }}
                  >
                    {THEMES[key].title}
                  </strong>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </Section>

        <Section n={3} color={COLORS.leaf} title="밥 먹는 동안">
          <SwitchRow
            id="full-button"
            label="배불러요 버튼"
            checked={s.fullButton}
            onChange={(v) => set("fullButton", v)}
          />
          <StepperRow
            label="도장 주는 기준"
            value={s.stampPct}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => set("stampPct", v)}
          />
          <StepperRow
            label="말 걸기까지 기다림"
            value={s.idleSeconds}
            min={10}
            max={300}
            step={10}
            unit="초"
            onChange={(v) => set("idleSeconds", v)}
          />
          <StepperRow
            label="한 끼에 말 거는 횟수"
            value={s.idleMaxPrompts}
            min={0}
            max={10}
            step={1}
            unit="번"
            onChange={(v) => set("idleMaxPrompts", v)}
          />
          <SwitchRow
            id="show-percent"
            label="아이 화면에 숫자 % 보이기"
            checked={s.showPercent}
            onChange={(v) => set("showPercent", v)}
          />
        </Section>

        <Section n={4} color={COLORS.space} title="소리와 저울">
          {(
            [
              ["sfxVolume", "효과음"],
              ["voiceVolume", "목소리"],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-3"
            >
              <span id={`${key}-label`} className="text-[15px] font-medium">
                {label}
              </span>
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
              <span className="text-right text-sm tabular-nums">
                {s[key] === 0 ? "꺼짐" : `${Math.round(s[key] * 100)}%`}
              </span>
            </div>
          ))}
          <Button
            type="button"
            onClick={preview}
            className={`w-fit ${pillClass}`}
          >
            <Volume2 />
            {CHARACTERS[look.character].name} 목소리 들어 보기
          </Button>
          <SwitchRow
            id="refill"
            label="더 담은 음식도 먹은 양에 넣기"
            checked={s.refillPolicy === "count"}
            onChange={(v) => set("refillPolicy", v ? "count" : "ignore")}
          />
          <SwitchRow
            id="anomaly"
            label="한꺼번에 많이 줄면 잠시 보류"
            hint="쏟았을 때 그림이 갑자기 자라지 않게"
            checked={s.anomalyDetection}
            onChange={(v) => set("anomalyDetection", v)}
          />
        </Section>
      </div>

      <div className="sticky bottom-3 mt-4 grid justify-items-center gap-2">
        {message && (
          <p
            role="status"
            className={`rounded-full px-4 py-1.5 text-sm shadow-sm ${
              message.error
                ? "bg-red-50 text-destructive"
                : "bg-white text-[#22693a]"
            }`}
          >
            {message.text}
          </p>
        )}
        <Button
          type="submit"
          disabled={saving}
          className={`${goClass} px-9 py-3 text-xl`}
        >
          {saving ? "저장하는 중…" : "저장하기"}
        </Button>
      </div>
      <p className={`${hintClass} mt-2 text-center`}>
        저장해야 아이 화면에 바뀐 설정이 쓰여요.
      </p>
    </form>
  );
}
