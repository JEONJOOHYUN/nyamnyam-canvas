import { DEFAULT_STAGE_THRESHOLDS } from "@/lib/meal/stage";
import type { CompletionRule } from "@/lib/meal/picture";
import type { SettingsRow } from "@/lib/supabase/types";

// Everything the child screen needs from a child's settings row (spec §4-2, §7).
export type PlaySettings = CompletionRule & {
  stageThresholds: number[];
  fullButton: boolean;
  stampPct: number;
  idleSeconds: number;
  idleMaxPrompts: number;
  sfxVolume: number;
  voiceVolume: number;
  showPercent: boolean;
  childPicksTheme: boolean;
  refillPolicy: "count" | "ignore";
  anomalyDetection: boolean;
};

// Same values as the column defaults in supabase/migrations/0001_parent.sql.
export const DEFAULT_SETTINGS: PlaySettings = {
  mode: "amount",
  mealsPerPicture: 7,
  mealCompletePct: 70,
  cumulativeTargetG: 2000,
  stageThresholds: DEFAULT_STAGE_THRESHOLDS,
  fullButton: true,
  stampPct: 70,
  idleSeconds: 30,
  idleMaxPrompts: 3,
  sfxVolume: 1,
  voiceVolume: 1,
  showPercent: true,
  childPicksTheme: true,
  refillPolicy: "count",
  anomalyDetection: true,
};

export function fromRow(row: SettingsRow): PlaySettings {
  return {
    mode: row.completion_mode,
    mealsPerPicture: row.meals_per_picture,
    mealCompletePct: row.meal_complete_pct,
    cumulativeTargetG: row.cumulative_target_g,
    stageThresholds: validThresholds(row.stage_thresholds)
      ? row.stage_thresholds
      : DEFAULT_STAGE_THRESHOLDS,
    fullButton: row.full_button_enabled,
    stampPct: row.full_button_stamp_pct,
    idleSeconds: row.idle_seconds,
    idleMaxPrompts: row.idle_max_prompts,
    sfxVolume: row.sfx_volume,
    voiceVolume: row.voice_volume,
    showPercent: row.show_percent,
    childPicksTheme: row.child_picks_theme,
    refillPolicy: row.refill_policy,
    anomalyDetection: row.anomaly_detection,
  };
}

export function toRow(
  childId: string,
  s: PlaySettings,
): Omit<SettingsRow, "parent_id" | "updated_at"> {
  return {
    child_id: childId,
    completion_mode: s.mode,
    meals_per_picture: s.mealsPerPicture,
    meal_complete_pct: s.mealCompletePct,
    cumulative_target_g: s.cumulativeTargetG,
    stage_thresholds: s.stageThresholds,
    full_button_enabled: s.fullButton,
    full_button_stamp_pct: s.stampPct,
    idle_seconds: s.idleSeconds,
    idle_max_prompts: s.idleMaxPrompts,
    sfx_volume: s.sfxVolume,
    voice_volume: s.voiceVolume,
    show_percent: s.showPercent,
    child_picks_theme: s.childPicksTheme,
    refill_policy: s.refillPolicy,
    anomaly_detection: s.anomalyDetection,
  };
}

// Seven strictly increasing whole percentages between 1 and 100.
export function validThresholds(t: readonly number[]): boolean {
  return (
    t.length === DEFAULT_STAGE_THRESHOLDS.length &&
    t.every(
      (v, i) =>
        Number.isInteger(v) && v >= 1 && v <= 100 && (i === 0 || v > t[i - 1]),
    )
  );
}

// Child lock for the parent page; the real protection is the Supabase login.
export async function hashPin(userId: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${userId}:${pin}`);
  // crypto.subtle needs a secure context, which a tablet opening the dev PC over plain
  // http://<LAN IP> is not; the fallback gives the same hash.
  const bytes = crypto.subtle
    ? new Uint8Array(await crypto.subtle.digest("SHA-256", data))
    : sha256(data);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Plain SHA-256 (FIPS 180-4), only for insecure contexts.
export function sha256(data: Uint8Array): Uint8Array {
  const k = new Uint32Array(64);
  const isPrime = (n: number) => {
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  };
  const frac = (x: number) => ((x - Math.floor(x)) * 2 ** 32) >>> 0;
  const h = new Uint32Array(8);
  for (let n = 2, i = 0; i < 64; n++) {
    if (!isPrime(n)) continue;
    if (i < 8) h[i] = frac(Math.sqrt(n));
    k[i++] = frac(Math.cbrt(n));
  }

  const len = Math.ceil((data.length + 9) / 64) * 64;
  const msg = new Uint8Array(len);
  msg.set(data);
  msg[data.length] = 0x80;
  const view = new DataView(msg.buffer);
  view.setUint32(len - 8, Math.floor(data.length / 2 ** 29));
  view.setUint32(len - 4, (data.length * 8) >>> 0);

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < len; off += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(off + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = w[t - 16] + s0 + w[t - 7] + s1;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const t1 =
        hh +
        (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) +
        ((e & f) ^ (~e & g)) +
        k[t] +
        w[t];
      const t2 =
        (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) +
        ((a & b) ^ (a & c) ^ (b & c));
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] += a;
    h[1] += b;
    h[2] += c;
    h[3] += d;
    h[4] += e;
    h[5] += f;
    h[6] += g;
    h[7] += hh;
  }
  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  h.forEach((x, i) => outView.setUint32(i * 4, x));
  return out;
}

// Which child eats on this device. Per-device convenience, so localStorage is enough.
const ACTIVE_CHILD_KEY = "nyamnyam.activeChild";
export function getActiveChild(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CHILD_KEY);
  } catch {
    return null;
  }
}
export function setActiveChild(id: string) {
  try {
    localStorage.setItem(ACTIVE_CHILD_KEY, id);
  } catch {
    // Private mode: the child screen falls back to the first child.
  }
}
