"use client";

import { Plus, Scale, Trash2, Wifi } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  checkCalibration,
  DEFAULT_KNOWN_G,
  deviceKeyHash,
  newDeviceId,
  newDeviceKey,
  secretsSnippet,
} from "@/lib/parent/devices";
import { NEAR_ZERO_G } from "@/lib/meal/machine";
import type { Db } from "@/lib/supabase/client";
import type { DeviceRow } from "@/lib/supabase/types";
import {
  choiceKey,
  createWeightSource,
  effectiveChoice,
  getWeightChoice,
  isWsUrl,
  setWeightChoice,
  type WeightChoice,
} from "@/lib/weight";
import { localWsAllowed } from "@/lib/weight/localws";
import type { WeightReading, WeightSource } from "@/lib/weight/types";
import { cn } from "@/lib/utils";
import { COLORS, goClass, hintClass, pillClass, Section } from "./ui";

type Listed = Pick<
  DeviceRow,
  "id" | "name" | "last_seen_at" | "calibration_factor" | "created_at"
>;

const choiceCard =
  "tap-pop relative flex min-h-12 cursor-pointer items-center gap-3 rounded-[18px] border-[3px] border-[#e3eef2] bg-[#f8fcfe] py-2 pr-10 pl-3 text-left font-normal has-[[data-checked]]:border-[#e8892b] has-[[data-checked]]:bg-[#fff6ea]";

function seenText(at: string | null, now: number) {
  if (!at) return "아직 연결된 적 없어요";
  const min = Math.floor((now - Date.parse(at)) / 60000);
  if (min < 1) return "방금 연결됐어요";
  if (min < 60) return `${min}분 전에 연결됐어요`;
  const h = Math.floor(min / 60);
  return h < 24
    ? `${h}시간 전에 연결됐어요`
    : `${Math.floor(h / 24)}일 전에 연결됐어요`;
}

export function DeviceTab({ db }: { db: Db }) {
  const [devices, setDevices] = useState<Listed[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  // What this screen (tablet) takes its weight from; stored on this device only.
  const [choice, setChoice] = useState<WeightChoice | null>(getWeightChoice);
  const [wsUrl, setWsUrl] = useState(
    choice?.kind === "localws" ? choice.url : "ws://192.168.0.",
  );
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState<{ id: string; key: string } | null>(
    null,
  );
  const [calibrating, setCalibrating] = useState<WeightChoice | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void db
      .from("devices")
      .select("id, name, last_seen_at, calibration_factor, created_at")
      .order("created_at")
      .then(({ data, error }) => {
        if (error) return setLoadError(error.message);
        setLoadError(null);
        setDevices(data);
        setLoadedAt(Date.now());
      });
  }, [db, version]);

  if (loadError)
    return (
      <div className="grid gap-3">
        <p role="alert" className="text-sm text-destructive">
          저울 목록을 불러오지 못했어요: {loadError}
        </p>
        <Button className={`w-fit ${pillClass}`} onClick={reload}>
          다시 불러오기
        </Button>
      </div>
    );
  if (!devices) return <p className="text-muted-foreground">불러오는 중…</p>;

  // Exactly what the child screen will use (resolveWeightChoice), picked or default.
  const current = effectiveChoice(
    choice,
    devices.map((d) => d.id),
  );
  const pick = (c: WeightChoice) => {
    setWeightChoice(c);
    setChoice(c);
  };
  const showLocal = localWsAllowed();

  const remove = async (id: string) => {
    if (removing !== id) return setRemoving(id);
    setRemoving(null);
    const { error } = await db.from("devices").delete().eq("id", id);
    if (error) return setMessage(error.message);
    if (calibrating?.kind === "supabase" && calibrating.deviceId === id)
      setCalibrating(null);
    reload();
  };

  return (
    <div className="grid gap-3.5 md:grid-cols-2">
      <Section
        n={1}
        color={COLORS.sea}
        title="이 화면은 어떤 저울을 쓸까요?"
        wide
      >
        <RadioGroup
          aria-label="무게를 받을 곳"
          value={current.kind === "localws" ? "localws" : choiceKey(current)}
          onValueChange={(v) => {
            if (v === "simulator") pick({ kind: "simulator" });
            else if (v.startsWith("supabase:"))
              pick({ kind: "supabase", deviceId: v.slice("supabase:".length) });
            else if (isWsUrl(wsUrl)) pick({ kind: "localws", url: wsUrl });
          }}
          className="grid gap-2 md:grid-cols-2"
        >
          {devices.map((d) => (
            <Label key={d.id} className={choiceCard}>
              <RadioGroupItem
                value={`supabase:${d.id}`}
                className="absolute top-1/2 right-3 -translate-y-1/2"
              />
              <Scale className="size-6 shrink-0 text-[#1a8fb0]" />
              <span className="grid">
                <strong className="text-[15px] font-bold">{d.name}</strong>
                <span className={hintClass}>{d.id}</span>
              </span>
            </Label>
          ))}
          <Label className={choiceCard}>
            <RadioGroupItem
              value="simulator"
              className="absolute top-1/2 right-3 -translate-y-1/2"
            />
            <span aria-hidden="true" className="text-2xl">
              🧪
            </span>
            <span className="grid">
              <strong className="text-[15px] font-bold">시뮬레이터</strong>
              <span className={hintClass}>저울 없이 화면으로 체험해요</span>
            </span>
          </Label>
          {showLocal && (
            <Label className={choiceCard}>
              <RadioGroupItem
                value="localws"
                disabled={!isWsUrl(wsUrl)}
                className="absolute top-1/2 right-3 -translate-y-1/2"
              />
              <Wifi className="size-6 shrink-0 text-[#6a4fc4]" />
              <span className="grid">
                <strong className="text-[15px] font-bold">
                  같은 와이파이의 저울 (인터넷 없이)
                </strong>
                <span className={hintClass}>
                  펌웨어를 LOCAL_WS 로 올린 저울 주소
                </span>
              </span>
            </Label>
          )}
        </RadioGroup>
        {showLocal && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ws-url">저울 주소</Label>
              <Input
                id="ws-url"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value.trim())}
                placeholder="ws://192.168.0.23:81"
                className="h-10 w-60 rounded-xl"
              />
            </div>
            <Button
              type="button"
              className={pillClass}
              disabled={!isWsUrl(wsUrl)}
              onClick={() => pick({ kind: "localws", url: wsUrl })}
            >
              이 주소 쓰기
            </Button>
          </div>
        )}
        <p className={hintClass}>
          이 기기(태블릿)에만 적용돼요. 바꾼 뒤 아이 화면을 다시 열면 그 저울로
          시작해요.
          {!showLocal &&
            " 인터넷 없는 저울 직접 연결은 http://localhost 로 연 화면에서만 고를 수 있어요."}
        </p>
      </Section>

      <Section title="등록한 저울" wide>
        {devices.length === 0 && !created && (
          <p className={hintClass}>
            아직 등록한 저울이 없어요. 저울을 등록하면 받은 키를 펌웨어
            secrets.h 에 넣어요.
          </p>
        )}
        <ul className="grid gap-2">
          {devices.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f6fbfd] px-3 py-2.5"
            >
              <span className="grid">
                <strong className="text-[15px] font-bold">{d.name}</strong>
                <span className={hintClass}>
                  {d.id} · {seenText(d.last_seen_at, loadedAt)} ·{" "}
                  {d.calibration_factor ? "보정함" : "보정 전"}
                </span>
              </span>
              <span className="flex gap-1.5">
                <Button
                  className={pillClass}
                  onClick={() =>
                    setCalibrating({ kind: "supabase", deviceId: d.id })
                  }
                >
                  보정하기
                </Button>
                <Button
                  className={cn(
                    pillClass,
                    // `!`: .btn-plain (globals.css) sets the white fill outside Tailwind's layers.
                    removing === d.id && "bg-[#fde7e4]! text-[#b42318]",
                  )}
                  onClick={() => void remove(d.id)}
                  onBlur={() => setRemoving(null)}
                >
                  <Trash2 />
                  {removing === d.id ? "한 번 더 누르면 삭제" : "삭제"}
                </Button>
              </span>
            </li>
          ))}
        </ul>
        {current.kind === "localws" && (
          <Button
            className={`w-fit ${pillClass}`}
            onClick={() => setCalibrating(current)}
          >
            와이파이 저울 보정하기
          </Button>
        )}
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        {created ? (
          <NewKey
            id={created.id}
            deviceKey={created.key}
            onClose={() => setCreated(null)}
          />
        ) : adding ? (
          <AddDevice
            db={db}
            onCancel={() => setAdding(false)}
            onAdded={(id, key) => {
              setAdding(false);
              setCreated({ id, key });
              reload();
            }}
          />
        ) : (
          <Button
            className="h-auto min-h-11 w-fit rounded-full border-2 border-dashed border-[#9bcfe4] bg-transparent px-4 text-[14px] text-[#4b7280] hover:bg-white/60"
            onClick={() => setAdding(true)}
          >
            <Plus />
            저울 등록하기
          </Button>
        )}
      </Section>

      {calibrating && (
        <CalibrationWizard
          key={choiceKey(calibrating)}
          db={db}
          choice={calibrating}
          onClose={() => {
            setCalibrating(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function AddDevice({
  db,
  onAdded,
  onCancel,
}: {
  db: Db;
  onAdded: (id: string, key: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("냠냠 저울");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const id = newDeviceId();
    const key = newDeviceKey();
    const { error } = await db
      .from("devices")
      .insert({ id, name: name.trim(), device_key_hash: deviceKeyHash(key) });
    setBusy(false);
    if (error) return setMessage(error.message);
    onAdded(id, key);
  };

  return (
    <form onSubmit={add} className="grid gap-2 rounded-2xl bg-[#f6fbfd] p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="device-name">저울 이름</Label>
          <Input
            id="device-name"
            required
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-48 rounded-xl"
          />
        </div>
        <Button type="submit" disabled={busy} className={goClass}>
          등록하기
        </Button>
        <Button type="button" className={pillClass} onClick={onCancel}>
          취소
        </Button>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}

// The key exists only here: the database keeps its hash.
function NewKey({
  id,
  deviceKey,
  onClose,
}: {
  id: string;
  deviceKey: string;
  onClose: () => void;
}) {
  const snippet = secretsSnippet({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    deviceId: id,
    deviceKey,
  });
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
    } catch {
      // No clipboard on plain http: the text stays selectable below.
      setCopied(false);
    }
  };
  return (
    <div className="grid gap-2 rounded-2xl border-2 border-[#e8892b] bg-[#fff6ea] p-3">
      <strong className="text-[15px]">저울을 등록했어요: {id}</strong>
      <p className={hintClass}>
        아래 세 줄을 펌웨어 <code>firmware/nyamnyam/secrets.h</code> 에 붙여
        넣어 주세요. <b>키는 지금만 보여요.</b> 잃어버리면 저울을 삭제하고 다시
        등록하면 돼요.
      </p>
      <textarea
        readOnly
        value={snippet}
        rows={3}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="secrets.h 에 넣을 내용"
        className="w-full resize-none rounded-xl border border-[#c9dde6] bg-white p-2 font-mono text-[11.5px] leading-relaxed break-all"
      />
      <span className="flex gap-1.5">
        <Button className={pillClass} onClick={() => void copy()}>
          {copied ? "복사했어요" : "복사하기"}
        </Button>
        <Button className={pillClass} onClick={onClose}>
          다 넣었어요
        </Button>
      </span>
    </div>
  );
}

const MIN_KNOWN_G = 50;

type Step = "tare" | "weigh" | "check" | "passed";

// Spec §3 sensor wizard: empty → tare, known weight → calibrate, weigh again → ±5g.
function CalibrationWizard({
  db,
  choice,
  onClose,
}: {
  db: Db;
  choice: WeightChoice;
  onClose: () => void;
}) {
  const [source] = useState<WeightSource>(() => createWeightSource(choice, db));
  const [reading, setReading] = useState<WeightReading | null>(null);
  const [step, setStep] = useState<Step>("tare");
  const [knownG, setKnownG] = useState(String(DEFAULT_KNOWN_G));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Step 3 only counts a weighing made after calibrating: the object must come off
  // (scale near empty) and go back on, all while the scale is online.
  const watchingLift = useRef(false);
  const [lifted, setLifted] = useState(false);
  const subscribeStatus = useCallback(
    (cb: () => void) => source.onStatus(cb),
    [source],
  );
  const status = useSyncExternalStore(
    subscribeStatus,
    () => source.status,
    () => source.status,
  );

  useEffect(() => {
    const off = source.subscribe((r) => {
      setReading(r);
      if (watchingLift.current && r.grams <= NEAR_ZERO_G) {
        watchingLift.current = false;
        setLifted(true);
      }
    });
    void source.connect();
    return () => {
      off();
      source.disconnect();
    };
  }, [source]);

  const known = Number(knownG);
  // Well above the "scale is empty" line (NEAR_ZERO_G), so step 3 can tell on from off.
  const knownOk =
    Number.isFinite(known) && known >= MIN_KNOWN_G && known <= 5000;
  const run = async (fn: () => Promise<void>, next: Step) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (next === "check") {
        watchingLift.current = true;
        setLifted(false);
      }
      setStep(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const online = status === "online";
  const check =
    online &&
    lifted &&
    reading &&
    reading.stable &&
    reading.grams > NEAR_ZERO_G &&
    knownOk
      ? checkCalibration(known, reading.grams)
      : null;

  return (
    <Section
      n={2}
      color={COLORS.orange}
      title={
        choice.kind === "supabase"
          ? `저울 맞추기 · ${choice.deviceId}`
          : "저울 맞추기 · 와이파이 저울"
      }
      wide
    >
      <p
        aria-live="polite"
        className="flex items-center gap-2 rounded-2xl bg-[#f6fbfd] px-3 py-2 text-[15px]"
      >
        <span
          className={cn(
            "size-2.5 rounded-full",
            online ? "bg-[#3aa55c]" : "bg-[#c3dbe4]",
          )}
        />
        {online
          ? `연결됨 · 지금 ${reading ? reading.grams.toFixed(1) : "-"}g${reading?.stable ? "" : " (흔들림)"}`
          : status === "connecting"
            ? "저울을 찾고 있어요… 전원과 와이파이를 확인해 주세요."
            : "저울 소식이 없어요. 전원과 와이파이를 확인해 주세요."}
      </p>

      <ol className="grid gap-2.5">
        <li className={cn("grid gap-2", step !== "tare" && "opacity-60")}>
          <strong>1. 저울 위를 모두 비우고 영점을 잡아요</strong>
          <span className={hintClass}>식판도 내려 주세요.</span>
          {step === "tare" && (
            <Button
              className={`w-fit ${goClass}`}
              disabled={busy || !online}
              onClick={() =>
                void run(() => source.sendCommand({ type: "tare" }), "weigh")
              }
            >
              {busy ? "잡는 중…" : "영점 잡기"}
            </Button>
          )}
        </li>
        <li className={cn("grid gap-2", step !== "weigh" && "opacity-60")}>
          <strong>2. 무게를 아는 물건을 올려요</strong>
          <span className={hintClass}>
            50g 이상인 물건을 써요. 500ml 생수 한 병은 약 510g이에요. 저울
            가운데에 올리고 손을 떼 주세요.
          </span>
          {step === "weigh" && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="known-g">물건 무게(g)</Label>
                <Input
                  id="known-g"
                  inputMode="numeric"
                  value={knownG}
                  onChange={(e) => setKnownG(e.target.value)}
                  aria-invalid={!knownOk}
                  className="h-10 w-28 rounded-xl"
                />
              </div>
              <Button
                className={goClass}
                disabled={busy || !online || !knownOk}
                onClick={() =>
                  void run(
                    () =>
                      source.sendCommand({
                        type: "calibrate",
                        knownGrams: known,
                      }),
                    "check",
                  )
                }
              >
                {busy ? "맞추는 중…" : "보정하기"}
              </Button>
            </div>
          )}
        </li>
        <li
          className={cn(
            "grid gap-2",
            step !== "check" && step !== "passed" && "opacity-60",
          )}
        >
          <strong>3. 내렸다가 다시 올려서 확인해요</strong>
          <span className={hintClass}>
            {known ? `${known}g` : "물건 무게"}에서 ±5g 안이면 통과예요.
          </span>
          {step === "check" && (
            <>
              <p aria-live="polite" className="text-[15px]">
                {!online
                  ? "저울 연결을 기다리고 있어요…"
                  : !lifted
                    ? "물건을 한 번 내렸다가 다시 올려 주세요."
                    : check === null
                      ? "무게가 멈추기를 기다리고 있어요…"
                      : check.ok
                        ? `오차 ${check.diffG > 0 ? "+" : ""}${check.diffG}g — 좋아요!`
                        : `오차 ${check.diffG > 0 ? "+" : ""}${check.diffG}g — ${check.hint}`}
              </p>
              <span className="flex flex-wrap gap-1.5">
                <Button
                  className={goClass}
                  disabled={!check?.ok}
                  onClick={() => setStep("passed")}
                >
                  통과
                </Button>
                <Button className={pillClass} onClick={() => setStep("tare")}>
                  처음부터 다시
                </Button>
              </span>
            </>
          )}
          {step === "passed" && (
            <p className="font-bold text-[#22693a]">
              보정을 마쳤어요. 보정값은 저울에 저장돼서 꺼졌다 켜져도
              그대로예요.
            </p>
          )}
        </li>
      </ol>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button className={`w-fit ${pillClass}`} onClick={onClose}>
        닫기
      </Button>
    </Section>
  );
}
