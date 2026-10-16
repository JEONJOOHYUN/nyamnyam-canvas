// Request handling shared by the device-ingest and device-commands Edge Functions.
// Plain TypeScript with no imports, so Deno runs it and Vitest tests it (device.test.ts).
// The contract lives in docs/FIRMWARE_NOTES.md §3; change both together.

export type Reading = {
  grams: number;
  raw: number;
  stable: boolean;
  seq: number;
  ts: number;
};

export type CommandType = "tare" | "calibrate" | "reboot";

// What the device gets: the command row flattened to the web's DeviceCommand shape + id.
export type OutgoingCommand = {
  id: string;
  type: CommandType;
  knownGrams?: number;
  // Time left before the command is too old to run (COMMAND_TTL_MS from its creation).
  expiresInMs: number;
};

export type CommandResult = {
  id: string;
  status: "done" | "error";
  error?: string;
  calibrationFactor?: number;
  tareOffset?: number;
};

export type DeviceRow = {
  id: string;
  parent_id: string;
  device_key_hash: string;
  last_seen_at: string | null;
};

export type CommandRow = {
  id: string;
  type: CommandType;
  payload: { knownGrams?: number };
  created_at: string;
};

// The database side, implemented with supabase-js in the functions and faked in tests.
export interface DeviceStore {
  findDevice(id: string): Promise<DeviceRow | null>;
  writeState(device: DeviceRow, reading: Reading): Promise<void>;
  touch(deviceId: string, at: Date): Promise<void>;
  // Pending commands newer than `since`, oldest first.
  pendingCommands(deviceId: string, since: Date): Promise<CommandRow[]>;
  finishCommand(
    deviceId: string,
    result: CommandResult,
    at: Date,
  ): Promise<void>;
  saveCalibration(
    deviceId: string,
    values: { calibration_factor?: number; tare_offset?: number },
  ): Promise<void>;
}

export type Reply = { status: number; body: Record<string, unknown> };

// Commands the device hasn't picked up in this long are no longer handed out, so a scale
// that comes back online later never tares in the middle of a meal. Shorter than the
// parent screen's wait (COMMAND_WAIT_MS 15s in lib/weight/supabase.ts): whatever the
// device still runs, the parent screen is still waiting for.
export const COMMAND_TTL_MS = 12_000;
// last_seen_at is a coarse "when did we last hear from it", not a per-reading write.
export const TOUCH_EVERY_MS = 30_000;
const MAX_RESULTS = 10;

const fail = (status: number, error: string, field?: string): Reply => ({
  status,
  body: field ? { ok: false, error, field } : { ok: false, error },
});

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const finite = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const whole = (v: unknown): v is number =>
  finite(v, 0, Number.MAX_SAFE_INTEGER) && Number.isInteger(v);

export function parseReading(v: unknown): Reading | string {
  if (!isObject(v)) return "reading";
  if (!finite(v.grams, -10_000, 10_000)) return "reading.grams";
  if (!finite(v.raw, -100_000, 100_000)) return "reading.raw";
  if (typeof v.stable !== "boolean") return "reading.stable";
  if (!whole(v.seq)) return "reading.seq";
  if (!whole(v.ts)) return "reading.ts";
  return { grams: v.grams, raw: v.raw, stable: v.stable, seq: v.seq, ts: v.ts };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseResult(v: unknown): CommandResult | null {
  if (!isObject(v) || typeof v.id !== "string" || !UUID.test(v.id)) return null;
  if (v.status !== "done" && v.status !== "error") return null;
  const r: CommandResult = { id: v.id, status: v.status };
  if (typeof v.error === "string") r.error = v.error.slice(0, 40);
  if (finite(v.calibrationFactor, -1e7, 1e7) && v.calibrationFactor !== 0)
    r.calibrationFactor = v.calibrationFactor;
  if (finite(v.tareOffset, -1e8, 1e8)) r.tareOffset = v.tareOffset;
  return r;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

// Same time whatever the mismatch position, so the hash can't be guessed byte by byte.
function sameText(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// Unknown device and wrong key look the same from outside.
async function authenticate(
  store: DeviceStore,
  body: Record<string, unknown>,
): Promise<DeviceRow | Reply> {
  const { device_id: id, device_key: key } = body;
  if (typeof id !== "string" || typeof key !== "string" || key.length > 200)
    return fail(400, "bad_request", "device_id/device_key");
  const device = await store.findDevice(id);
  const hash = await sha256Hex(key);
  if (!device || !sameText(hash, device.device_key_hash))
    return fail(401, "unauthorized");
  return device;
}

async function commandsFor(store: DeviceStore, deviceId: string, now: Date) {
  const rows = await store.pendingCommands(
    deviceId,
    new Date(now.getTime() - COMMAND_TTL_MS),
  );
  return rows.map((c): OutgoingCommand => {
    const expiresInMs = Math.max(
      0,
      Date.parse(c.created_at) + COMMAND_TTL_MS - now.getTime(),
    );
    return c.type === "calibrate" && typeof c.payload.knownGrams === "number"
      ? {
          id: c.id,
          type: c.type,
          knownGrams: c.payload.knownGrams,
          expiresInMs,
        }
      : { id: c.id, type: c.type, expiresInMs };
  });
}

async function touchIfStale(store: DeviceStore, device: DeviceRow, now: Date) {
  const last = device.last_seen_at ? Date.parse(device.last_seen_at) : 0;
  if (now.getTime() - last >= TOUCH_EVERY_MS) await store.touch(device.id, now);
}

// POST /functions/v1/device-ingest — one reading in, pending commands out.
export async function handleIngest(
  store: DeviceStore,
  body: unknown,
  now: Date,
): Promise<Reply> {
  if (!isObject(body)) return fail(400, "bad_request", "body");
  const device = await authenticate(store, body);
  if ("status" in device) return device;
  const reading = parseReading(body.reading);
  if (typeof reading === "string") return fail(400, "bad_request", reading);
  await store.writeState(device, reading);
  await touchIfStale(store, device, now);
  return {
    status: 200,
    body: { ok: true, commands: await commandsFor(store, device.id, now) },
  };
}

// POST /functions/v1/device-commands — command results in, pending commands out.
export async function handleCommands(
  store: DeviceStore,
  body: unknown,
  now: Date,
): Promise<Reply> {
  if (!isObject(body)) return fail(400, "bad_request", "body");
  const device = await authenticate(store, body);
  if ("status" in device) return device;
  const list = body.results ?? [];
  if (!Array.isArray(list) || list.length > MAX_RESULTS)
    return fail(400, "bad_request", "results");
  const results = list.map(parseResult);
  if (results.some((r) => r === null))
    return fail(400, "bad_request", "results");
  for (const r of results as CommandResult[]) {
    await store.finishCommand(device.id, r, now);
    if (r.status !== "done") continue;
    const values: { calibration_factor?: number; tare_offset?: number } = {};
    if (r.calibrationFactor !== undefined)
      values.calibration_factor = r.calibrationFactor;
    if (r.tareOffset !== undefined) values.tare_offset = r.tareOffset;
    if (Object.keys(values).length)
      await store.saveCalibration(device.id, values);
  }
  await touchIfStale(store, device, now);
  return {
    status: 200,
    body: { ok: true, commands: await commandsFor(store, device.id, now) },
  };
}

// HTTP wrapper shared by both functions: POST + JSON only, errors never leak details.
export async function serveJson(
  req: Request,
  handle: (body: unknown) => Promise<Reply>,
): Promise<Response> {
  const json = (r: Reply) =>
    new Response(JSON.stringify(r.body), {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  if (req.method !== "POST") return json(fail(405, "method_not_allowed"));
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(fail(400, "bad_json"));
  }
  try {
    return json(await handle(body));
  } catch (e) {
    console.error(e);
    return json(fail(500, "server_error"));
  }
}
