import { SimulatorSource } from "./simulator";
import type { WeightSource } from "./types";

export type WeightSourceKind = "simulator" | "supabase" | "localws";

// The only place that decides where weight comes from (spec §2).
export function createWeightSource(
  kind = (process.env.NEXT_PUBLIC_WEIGHT_SOURCE ??
    "simulator") as WeightSourceKind,
): WeightSource {
  if (kind === "simulator") return new SimulatorSource();
  // shortcut: device sources arrive in stage 7; until then fail loudly instead of faking data.
  throw new Error(`Weight source "${kind}" is not implemented yet`);
}
