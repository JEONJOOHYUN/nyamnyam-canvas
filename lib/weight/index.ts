import type { Db } from "@/lib/supabase/client";
import { LocalWebSocketSource, localWsAllowed } from "./localws";
import { SimulatorSource } from "./simulator";
import { SupabaseRealtimeSource } from "./supabase";
import type { WeightSource } from "./types";

export type WeightSourceKind = "simulator" | "supabase" | "localws";

// Where this screen takes its weight from. Chosen per device on the parent screen,
// otherwise NEXT_PUBLIC_WEIGHT_SOURCE decides (spec §2).
export type WeightChoice =
  | { kind: "simulator" }
  | { kind: "supabase"; deviceId: string }
  | { kind: "localws"; url: string };

const SIMULATOR: WeightChoice = { kind: "simulator" };
const CHOICE_KEY = "nyamnyam.weightSource";

export const choiceKey = (c: WeightChoice) =>
  c.kind === "supabase"
    ? `supabase:${c.deviceId}`
    : c.kind === "localws"
      ? `localws:${c.url}`
      : "simulator";

export function parseChoice(v: unknown): WeightChoice | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (o.kind === "simulator") return SIMULATOR;
  if (o.kind === "supabase" && typeof o.deviceId === "string")
    return { kind: "supabase", deviceId: o.deviceId };
  if (o.kind === "localws" && typeof o.url === "string" && isWsUrl(o.url))
    return { kind: "localws", url: o.url };
  return null;
}

export function isWsUrl(url: string) {
  try {
    return new URL(url).protocol === "ws:";
  } catch {
    return false;
  }
}

// Per-device choice, like the active child: a convenience, so localStorage is enough.
export function getWeightChoice(): WeightChoice | null {
  try {
    const stored = localStorage.getItem(CHOICE_KEY);
    return stored ? parseChoice(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}
export function setWeightChoice(c: WeightChoice | null) {
  try {
    if (c) localStorage.setItem(CHOICE_KEY, JSON.stringify(c));
    else localStorage.removeItem(CHOICE_KEY);
  } catch {
    // Private mode: the screen falls back to the default source.
  }
}

const envKind = (): WeightSourceKind => {
  const v = process.env.NEXT_PUBLIC_WEIGHT_SOURCE;
  return v === "supabase" || v === "localws" ? v : "simulator";
};

// The source to use when nobody is signed in (demo).
export function demoChoice(): WeightChoice {
  const url = process.env.NEXT_PUBLIC_LOCAL_WS_URL ?? "";
  return envKind() === "localws" && isWsUrl(url) && localWsAllowed()
    ? { kind: "localws", url }
    : SIMULATOR;
}

// Without the parent's account (demo, or the server can't be reached): a simulator or
// local scale picked on this device still works, a Supabase scale can't.
export function offlineChoice(
  picked: WeightChoice | null = getWeightChoice(),
): WeightChoice {
  if (picked?.kind === "simulator") return picked;
  if (picked?.kind === "localws" && localWsAllowed()) return picked;
  return demoChoice();
}

// For a signed-in parent with these scales (oldest first): the scale picked on this
// device if it still exists, else the default — their first scale when the env asks for
// supabase or the picked one was removed. The parent screen shows the same answer.
export function effectiveChoice(
  picked: WeightChoice | null,
  deviceIds: readonly string[],
): WeightChoice {
  if (picked?.kind === "supabase" && deviceIds.includes(picked.deviceId))
    return picked;
  if (picked?.kind !== "supabase" && (picked || envKind() !== "supabase"))
    return offlineChoice(picked);
  return deviceIds[0]
    ? { kind: "supabase", deviceId: deviceIds[0] }
    : demoChoice();
}

export async function resolveWeightChoice(db: Db): Promise<WeightChoice> {
  const picked = getWeightChoice();
  if (picked && picked.kind !== "supabase") return offlineChoice(picked);
  if (!picked && envKind() !== "supabase") return demoChoice();
  const { data, error } = await db
    .from("devices")
    .select("id")
    .order("created_at");
  if (error) throw error;
  return effectiveChoice(
    picked,
    data.map((d) => d.id),
  );
}

// The only place that turns a choice into a source (spec §2).
export function createWeightSource(
  choice: WeightChoice,
  db: Db | null,
): WeightSource {
  if (choice.kind === "supabase" && db)
    return new SupabaseRealtimeSource(db, choice.deviceId);
  if (choice.kind === "localws") return new LocalWebSocketSource(choice.url);
  return new SimulatorSource();
}
