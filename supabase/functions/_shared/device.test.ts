import { describe, expect, it } from "vitest";
import type { WeightReading } from "@/lib/weight/types";
import {
  COMMAND_TTL_MS,
  handleCommands,
  handleIngest,
  parseReading,
  serveJson,
  sha256Hex,
  TOUCH_EVERY_MS,
  type CommandResult,
  type CommandRow,
  type DeviceRow,
  type DeviceStore,
  type Reading,
} from "./device";

// The device JSON and the web type must stay the same shape.
const sameShape: Reading = {} as WeightReading;
const sameShapeBack: WeightReading = {} as Reading;
void sameShape;
void sameShapeBack;

const KEY = "a".repeat(48);
const C1 = "00000000-0000-4000-8000-000000000001";
const C2 = "00000000-0000-4000-8000-000000000002";
const C3 = "00000000-0000-4000-8000-000000000003";
const NOW = new Date("2026-10-17T00:00:00Z");
const reading = { grams: 312.4, raw: 314.1, stable: true, seq: 7, ts: 5234 };

async function fakeStore(
  commands: (Omit<CommandRow, "created_at"> & { at: number })[] = [],
) {
  const device: DeviceRow = {
    id: "nyam-abc123",
    parent_id: "parent-1",
    device_key_hash: await sha256Hex(KEY),
    last_seen_at: new Date(NOW.getTime() - 5_000).toISOString(),
  };
  const log = {
    states: [] as Reading[],
    touched: [] as Date[],
    finished: [] as CommandResult[],
    calibration: [] as Record<string, number>[],
    since: null as Date | null,
  };
  const store: DeviceStore = {
    findDevice: async (id) => (id === device.id ? device : null),
    writeState: async (_, r) => void log.states.push(r),
    touch: async (_, at) => void log.touched.push(at),
    pendingCommands: async (_, since) => {
      log.since = since;
      return commands
        .filter((c) => c.at > since.getTime())
        .map(({ at, ...c }) => ({
          ...c,
          created_at: new Date(at).toISOString(),
        }));
    },
    finishCommand: async (_, r) => void log.finished.push(r),
    saveCalibration: async (_, v) => void log.calibration.push(v),
  };
  return { store, device, log };
}

const body = (extra: Record<string, unknown>) => ({
  device_id: "nyam-abc123",
  device_key: KEY,
  ...extra,
});

describe("device-ingest", () => {
  it("stores the reading and returns pending commands", async () => {
    const { store, log } = await fakeStore([
      {
        id: C1,
        type: "calibrate",
        payload: { knownGrams: 510 },
        at: NOW.getTime() - 1000,
      },
      { id: C2, type: "tare", payload: {}, at: NOW.getTime() - 500 },
    ]);
    const r = await handleIngest(store, body({ reading }), NOW);
    expect(r.status).toBe(200);
    expect(r.body.commands).toEqual([
      { id: C1, type: "calibrate", knownGrams: 510, expiresInMs: 11_000 },
      { id: C2, type: "tare", expiresInMs: 11_500 },
    ]);
    expect(log.states).toEqual([reading]);
  });

  it("stops handing out commands nobody waits for any more", async () => {
    const { store, log } = await fakeStore([
      {
        id: "old",
        type: "tare",
        payload: {},
        at: NOW.getTime() - COMMAND_TTL_MS - 1,
      },
    ]);
    const r = await handleIngest(store, body({ reading }), NOW);
    expect(r.body.commands).toEqual([]);
    expect(log.since?.getTime()).toBe(NOW.getTime() - COMMAND_TTL_MS);
  });

  it("answers a wrong key and an unknown device the same way", async () => {
    const { store, log } = await fakeStore();
    const wrong = await handleIngest(
      store,
      body({ device_key: "b".repeat(48), reading }),
      NOW,
    );
    const unknown = await handleIngest(
      store,
      body({ device_id: "nyam-zzz999", reading }),
      NOW,
    );
    expect(wrong).toEqual({
      status: 401,
      body: { ok: false, error: "unauthorized" },
    });
    expect(unknown).toEqual(wrong);
    expect(log.states).toEqual([]);
  });

  it("names the field that is wrong", async () => {
    const { store } = await fakeStore();
    const bad = (r: unknown) => handleIngest(store, body({ reading: r }), NOW);
    expect((await bad({ ...reading, seq: -1 })).body.field).toBe("reading.seq");
    expect((await bad({ ...reading, seq: 1.5 })).body.field).toBe(
      "reading.seq",
    );
    expect((await bad({ ...reading, grams: "3" })).body.field).toBe(
      "reading.grams",
    );
    expect((await bad({ ...reading, stable: 1 })).body.field).toBe(
      "reading.stable",
    );
    expect((await bad(null)).status).toBe(400);
    expect((await handleIngest(store, { device_id: 1 }, NOW)).body.field).toBe(
      "device_id/device_key",
    );
  });

  it("keeps only the five reading fields", () => {
    expect(parseReading({ ...reading, extra: 1 })).toEqual(reading);
  });

  it("updates last_seen_at only now and then", async () => {
    const { store, device, log } = await fakeStore();
    await handleIngest(store, body({ reading }), NOW);
    expect(log.touched).toEqual([]);
    device.last_seen_at = new Date(
      NOW.getTime() - TOUCH_EVERY_MS,
    ).toISOString();
    await handleIngest(store, body({ reading }), NOW);
    expect(log.touched).toEqual([NOW]);
  });
});

describe("device-commands", () => {
  it("records results and keeps calibration values", async () => {
    const { store, log } = await fakeStore();
    const r = await handleCommands(
      store,
      body({
        results: [
          { id: C1, status: "done", calibrationFactor: 421.5, tareOffset: 8 },
          { id: C2, status: "error", error: "unstable" },
        ],
      }),
      NOW,
    );
    expect(r).toEqual({ status: 200, body: { ok: true, commands: [] } });
    expect(log.finished).toEqual([
      { id: C1, status: "done", calibrationFactor: 421.5, tareOffset: 8 },
      { id: C2, status: "error", error: "unstable" },
    ]);
    expect(log.calibration).toEqual([
      { calibration_factor: 421.5, tare_offset: 8 },
    ]);
  });

  it("works as a plain poll without results", async () => {
    const { store } = await fakeStore([
      { id: C3, type: "reboot", payload: {}, at: NOW.getTime() },
    ]);
    const r = await handleCommands(store, body({}), NOW);
    expect(r.body.commands).toEqual([
      { id: C3, type: "reboot", expiresInMs: COMMAND_TTL_MS },
    ]);
  });

  it("rejects malformed results before writing anything", async () => {
    const { store, log } = await fakeStore();
    const r = await handleCommands(
      store,
      body({ results: [{ id: C1, status: "done" }, { id: C2 }] }),
      NOW,
    );
    expect(r.status).toBe(400);
    expect(log.finished).toEqual([]);
  });

  it("rejects result ids that aren't command ids", async () => {
    const { store, log } = await fakeStore();
    const r = await handleCommands(
      store,
      body({ results: [{ id: "serial-123", status: "done" }] }),
      NOW,
    );
    expect(r.status).toBe(400);
    expect(log.finished).toEqual([]);
  });

  it("ignores a zero calibration factor", async () => {
    const { store, log } = await fakeStore();
    await handleCommands(
      store,
      body({ results: [{ id: C1, status: "done", calibrationFactor: 0 }] }),
      NOW,
    );
    expect(log.calibration).toEqual([]);
  });
});

describe("serveJson", () => {
  const ok = async () => ({ status: 200, body: { ok: true } });

  it("accepts only POST with JSON", async () => {
    const get = await serveJson(new Request("http://x", { method: "GET" }), ok);
    expect(get.status).toBe(405);
    const broken = await serveJson(
      new Request("http://x", { method: "POST", body: "{" }),
      ok,
    );
    expect(broken.status).toBe(400);
    expect(await broken.json()).toEqual({ ok: false, error: "bad_json" });
  });

  it("hides internal errors", async () => {
    const original = console.error;
    console.error = () => {};
    const res = await serveJson(
      new Request("http://x", { method: "POST", body: "{}" }),
      async () => {
        throw new Error("db password in here");
      },
    );
    console.error = original;
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "server_error" });
  });
});
