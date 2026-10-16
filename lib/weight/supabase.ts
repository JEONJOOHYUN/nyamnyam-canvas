import type { RealtimeChannel } from "@supabase/supabase-js";
import { DB_SCHEMA, type Db } from "@/lib/supabase/client";
import { asReading, CommandError, RemoteSource } from "./remote";
import type { DeviceCommand } from "./types";

// How long the parent screen waits for the scale to carry out a command. The device
// picks commands up with its next send (at least every second) and calibrating
// averages about a second of samples.
export const COMMAND_WAIT_MS = 15_000;
const COMMAND_POLL_MS = 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Deployed scale (spec §2): the device writes device_state through the device-ingest
// Edge Function and this follows the row over Realtime. Commands go through
// device_commands, which the device picks up from the same function.
export class SupabaseRealtimeSource extends RemoteSource {
  private channel: RealtimeChannel | null = null;

  constructor(
    private db: Db,
    readonly deviceId: string,
  ) {
    super();
  }

  protected async open() {
    this.channel = this.db
      .channel(`device-state:${this.deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: DB_SCHEMA,
          table: "device_state",
          filter: `device_id=eq.${this.deviceId}`,
        },
        (payload) => {
          const reading = asReading(payload.new);
          if (reading) this.receive(reading);
        },
      )
      .subscribe((state, err) => {
        if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          console.warn("device channel", state, err);
          this.setStatus("error");
        }
      });
  }

  protected close() {
    if (this.channel) void this.db.removeChannel(this.channel);
    this.channel = null;
  }

  // Resolves once the scale reports the command done; throws CommandError otherwise.
  async sendCommand(cmd: DeviceCommand) {
    const { data, error } = await this.db
      .from("device_commands")
      .insert({
        device_id: this.deviceId,
        type: cmd.type,
        payload: cmd.type === "calibrate" ? { knownGrams: cmd.knownGrams } : {},
      })
      .select("id")
      .single();
    if (error) throw error;
    const deadline = Date.now() + COMMAND_WAIT_MS;
    while (Date.now() < deadline) {
      await sleep(COMMAND_POLL_MS);
      const { data: row, error: readError } = await this.db
        .from("device_commands")
        .select("status, result")
        .eq("id", data.id)
        .single();
      if (readError) throw readError;
      if (row.status === "done") return;
      if (row.status === "error")
        throw new CommandError(row.result?.error ?? "unknown");
    }
    throw new CommandError("timeout");
  }
}
