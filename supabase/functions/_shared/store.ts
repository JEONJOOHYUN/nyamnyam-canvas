// DeviceStore on the real database (Deno only; excluded from the app's tsconfig).
// Uses the service role key the Edge runtime provides, so RLS doesn't apply: every query
// here is scoped to the device that just proved its key.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import type {
  CommandResult,
  CommandRow,
  DeviceRow,
  DeviceStore,
  Reading,
} from "./device.ts";

export function createStore(): DeviceStore {
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "nyamnyam" }, auth: { persistSession: false } },
  );
  const check = ({ error }: { error: unknown }) => {
    if (error) throw error;
  };

  return {
    async findDevice(id: string) {
      const { data, error } = await db
        .from("devices")
        .select("id, parent_id, device_key_hash, last_seen_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as DeviceRow | null;
    },
    async writeState(device: DeviceRow, r: Reading) {
      check(
        await db.from("device_state").upsert({
          device_id: device.id,
          parent_id: device.parent_id,
          grams: r.grams,
          raw: r.raw,
          stable: r.stable,
          seq: r.seq,
          ts: r.ts,
          updated_at: new Date().toISOString(),
        }),
      );
    },
    async touch(deviceId: string, at: Date) {
      check(
        await db
          .from("devices")
          .update({ last_seen_at: at.toISOString() })
          .eq("id", deviceId),
      );
    },
    async pendingCommands(deviceId: string, since: Date) {
      const { data, error } = await db
        .from("device_commands")
        .select("id, type, payload, created_at")
        .eq("device_id", deviceId)
        .eq("status", "pending")
        .gt("created_at", since.toISOString())
        .order("created_at")
        .limit(5);
      if (error) throw error;
      return data as CommandRow[];
    },
    async finishCommand(deviceId: string, r: CommandResult, at: Date) {
      const result: Record<string, unknown> = {};
      if (r.error) result.error = r.error;
      if (r.calibrationFactor !== undefined)
        result.calibrationFactor = r.calibrationFactor;
      if (r.tareOffset !== undefined) result.tareOffset = r.tareOffset;
      check(
        await db
          .from("device_commands")
          .update({ status: r.status, result, done_at: at.toISOString() })
          .eq("id", r.id)
          .eq("device_id", deviceId)
          .eq("status", "pending"),
      );
    },
    async saveCalibration(deviceId, values) {
      check(await db.from("devices").update(values).eq("id", deviceId));
    },
  };
}
