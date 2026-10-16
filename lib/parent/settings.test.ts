import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  fromRow,
  hashPin,
  sha256,
  toRow,
  validThresholds,
} from "./settings";

describe("parent settings", () => {
  it("round-trips through a row", () => {
    const row = {
      ...toRow("c1", DEFAULT_SETTINGS),
      parent_id: "p",
      updated_at: "",
    };
    expect(fromRow(row)).toEqual(DEFAULT_SETTINGS);
  });

  it("accepts only 7 increasing whole percentages", () => {
    expect(validThresholds([10, 25, 40, 55, 70, 85, 95])).toBe(true);
    expect(validThresholds([10, 25, 25, 55, 70, 85, 95])).toBe(false);
    expect(validThresholds([10, 25, 40, 55, 70, 85])).toBe(false);
    expect(validThresholds([0, 25, 40, 55, 70, 85, 95])).toBe(false);
    expect(validThresholds([10, 25, 40, 55, 70, 85, 101])).toBe(false);
  });

  it("falls back to default thresholds for a broken row", () => {
    const row = {
      ...toRow("c1", DEFAULT_SETTINGS),
      stage_thresholds: [50, 40, 30, 20, 10, 5, 1],
      parent_id: "p",
      updated_at: "",
    };
    expect(fromRow(row).stageThresholds).toEqual(
      DEFAULT_SETTINGS.stageThresholds,
    );
  });

  it("hashes a PIN per user", async () => {
    const a = await hashPin("u1", "1234");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashPin("u1", "1234")).toBe(a);
    expect(await hashPin("u2", "1234")).not.toBe(a);
  });

  it("matches crypto.subtle with the insecure-context SHA-256", async () => {
    const hex = (b: Uint8Array) =>
      [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    expect(hex(sha256(new TextEncoder().encode("abc")))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    for (const len of [0, 55, 56, 63, 64, 65, 200]) {
      const data = new TextEncoder().encode("x".repeat(len));
      const want = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
      expect(hex(sha256(data))).toBe(hex(want));
    }
  });
});
