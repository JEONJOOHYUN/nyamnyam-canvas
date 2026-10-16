import { OFFLINE_AFTER_MS } from "./constants";
import { guardReading, type GuardState } from "./guard";
import type {
  DeviceCommand,
  WeightReading,
  WeightSource,
  WeightSourceStatus,
} from "./types";

// What a scale says back when a command fails (FIRMWARE_NOTES §4), in parent words.
const COMMAND_ERRORS: Record<string, string> = {
  unstable: "무게가 흔들리고 있어요. 저울을 가만히 두고 다시 해 주세요.",
  no_load:
    "올린 물건의 무게가 잡히지 않아요. 물건을 저울 가운데에 올려 주세요.",
  bad_value: "무게 값이 올바르지 않아요.",
  no_sensor:
    "저울 센서가 대답하지 않아요. HX711 선(VCC·GND·DT·SCK) 연결을 확인해 주세요.",
  timeout: "저울이 대답하지 않아요. 저울 전원과 와이파이를 확인해 주세요.",
  busy: "저울이 다른 일을 하고 있어요. 잠시 뒤 다시 해 주세요.",
};
export const commandErrorText = (code: string) =>
  COMMAND_ERRORS[code] ?? `저울이 명령을 처리하지 못했어요 (${code}).`;

export class CommandError extends Error {
  constructor(readonly code: string) {
    super(commandErrorText(code));
  }
}

// Shared by the device sources: listeners, seq/clock guard and the offline watchdog
// (no reading for OFFLINE_AFTER_MS → "offline", spec §2).
export abstract class RemoteSource implements WeightSource {
  status: WeightSourceStatus = "idle";
  private listeners = new Set<(r: WeightReading) => void>();
  private statusListeners = new Set<() => void>();
  private guard: GuardState = null;
  // Last reading, or the connect time until the first one arrives.
  private lastAt = 0;
  private watchdog: ReturnType<typeof setInterval> | null = null;

  protected abstract open(): Promise<void>;
  protected abstract close(): void;
  abstract sendCommand(cmd: DeviceCommand): Promise<void>;

  async connect() {
    if (this.watchdog) return;
    this.setStatus("connecting");
    this.lastAt = Date.now();
    // A scale that never answers goes offline too, not "connecting" forever.
    this.watchdog = setInterval(() => {
      const quiet = Date.now() - this.lastAt > OFFLINE_AFTER_MS;
      if (quiet && (this.status === "online" || this.status === "connecting"))
        this.setStatus("offline");
    }, 500);
    try {
      await this.open();
    } catch (e) {
      console.warn("weight source failed to open", e);
      this.setStatus("error");
    }
  }

  disconnect() {
    if (this.watchdog) clearInterval(this.watchdog);
    this.watchdog = null;
    this.close();
    this.guard = null;
    this.setStatus("idle");
  }

  subscribe(cb: (r: WeightReading) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  onStatus(cb: () => void) {
    this.statusListeners.add(cb);
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  protected setStatus(s: WeightSourceStatus) {
    if (this.status === s) return;
    this.status = s;
    this.statusListeners.forEach((cb) => cb());
  }

  protected receive(r: WeightReading) {
    if (!this.watchdog) return;
    const now = Date.now();
    const next = guardReading(this.guard, r, now);
    this.guard = next.state;
    if (!next.reading) return;
    this.lastAt = now;
    this.setStatus("online");
    const reading = next.reading;
    this.listeners.forEach((cb) => cb(reading));
  }
}

// Narrow untrusted JSON to a WeightReading (same fields as the firmware sends).
// Postgres bigint may arrive as a numeric string, so those are read as numbers too.
export function asReading(v: unknown): WeightReading | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const num = (x: unknown) => {
    const n = typeof x === "string" && x.trim() !== "" ? Number(x) : x;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  };
  const [grams, raw, seq, ts] = [o.grams, o.raw, o.seq, o.ts].map(num);
  if (grams === null || raw === null || seq === null || ts === null)
    return null;
  if (typeof o.stable !== "boolean") return null;
  return { grams, raw, stable: o.stable, seq, ts };
}
