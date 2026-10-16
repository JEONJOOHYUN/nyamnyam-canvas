import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OFFLINE_AFTER_MS } from "./constants";
import { asReading, RemoteSource } from "./remote";
import type { WeightReading } from "./types";

class FakeSource extends RemoteSource {
  opened = 0;
  closed = 0;
  protected async open() {
    this.opened++;
  }
  protected close() {
    this.closed++;
  }
  async sendCommand() {}
  push(r: WeightReading) {
    this.receive(r);
  }
}

const reading = (seq: number): WeightReading => ({
  grams: 50,
  raw: 51,
  stable: true,
  seq,
  ts: seq * 250,
});

describe("RemoteSource", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("goes connecting → online → offline when the scale goes quiet", async () => {
    const src = new FakeSource();
    const seen: string[] = [];
    src.onStatus(() => seen.push(src.status));
    await src.connect();
    expect(src.status).toBe("connecting");
    src.push(reading(1));
    expect(src.status).toBe("online");
    vi.advanceTimersByTime(OFFLINE_AFTER_MS + 500);
    expect(src.status).toBe("offline");
    src.push(reading(2));
    expect(seen).toEqual(["connecting", "online", "offline", "online"]);
  });

  it("goes offline when the scale never answers", async () => {
    const src = new FakeSource();
    await src.connect();
    vi.advanceTimersByTime(OFFLINE_AFTER_MS - 500);
    expect(src.status).toBe("connecting");
    vi.advanceTimersByTime(1000);
    expect(src.status).toBe("offline");
    src.push(reading(1));
    expect(src.status).toBe("online");
  });

  it("hands on readings in order and stops after disconnect", async () => {
    const src = new FakeSource();
    const got: number[] = [];
    src.subscribe((r) => got.push(r.seq));
    await src.connect();
    src.push(reading(1));
    src.push(reading(1));
    src.push(reading(2));
    src.disconnect();
    src.push(reading(3));
    expect(got).toEqual([1, 2]);
    expect(src.status).toBe("idle");
    expect(src.closed).toBe(1);
  });

  it("starts the seq check over on a new connection", async () => {
    const src = new FakeSource();
    const got: number[] = [];
    src.subscribe((r) => got.push(r.seq));
    await src.connect();
    src.push(reading(9));
    src.disconnect();
    await src.connect();
    src.push(reading(1));
    expect(got).toEqual([9, 1]);
  });
});

describe("asReading", () => {
  it("accepts the firmware JSON and bigint strings from Postgres", () => {
    expect(
      asReading({ grams: 1.5, raw: 2, stable: false, seq: "12", ts: "3400" }),
    ).toEqual({ grams: 1.5, raw: 2, stable: false, seq: 12, ts: 3400 });
  });

  it("rejects anything else", () => {
    expect(asReading(null)).toBeNull();
    expect(
      asReading({ grams: 1, raw: 2, stable: "yes", seq: 1, ts: 1 }),
    ).toBeNull();
    expect(
      asReading({ grams: NaN, raw: 2, stable: true, seq: 1, ts: 1 }),
    ).toBeNull();
    expect(
      asReading({ grams: 1, raw: 2, stable: true, seq: "", ts: 1 }),
    ).toBeNull();
  });
});
