import { describe, expect, it } from "vitest";
import { sha256Hex } from "@/supabase/functions/_shared/device";
import {
  checkCalibration,
  deviceKeyHash,
  newDeviceId,
  newDeviceKey,
  secretsSnippet,
} from "./devices";

describe("scale registration", () => {
  it("makes ids the database accepts", () => {
    for (let i = 0; i < 50; i++)
      expect(newDeviceId()).toMatch(/^nyam-[a-z0-9]{6}$/);
    expect(newDeviceId(new Uint8Array([0, 1, 2, 3, 4, 31]))).toBe(
      "nyam-abcde9",
    );
  });

  it("makes 48-hex keys", () => {
    expect(newDeviceKey()).toMatch(/^[0-9a-f]{48}$/);
    expect(newDeviceKey()).not.toBe(newDeviceKey());
  });

  it("hashes the key the same way as the Edge Function", async () => {
    const key = newDeviceKey();
    expect(deviceKeyHash(key)).toBe(await sha256Hex(key));
  });

  it("writes the secrets.h lines", () => {
    expect(
      secretsSnippet({
        supabaseUrl: "https://abc.supabase.co/",
        deviceId: "nyam-abc123",
        deviceKey: "k",
      }),
    ).toBe(
      [
        '#define DEVICE_ID "nyam-abc123"',
        '#define DEVICE_KEY "k"',
        '#define FUNCTIONS_URL "https://abc.supabase.co/functions/v1"',
      ].join("\n"),
    );
  });
});

describe("checkCalibration", () => {
  it("passes within ±5g", () => {
    expect(checkCalibration(510, 514.9)).toEqual({ ok: true, diffG: 4.9 });
    expect(checkCalibration(510, 505)).toEqual({ ok: true, diffG: -5 });
  });

  it("explains likely causes", () => {
    const reversed = checkCalibration(510, -508);
    expect(reversed.ok).toBe(false);
    expect(!reversed.ok && reversed.hint).toContain("화살표");
    const low = checkCalibration(510, 120);
    expect(!low.ok && low.hint).toContain("케이스");
    const off = checkCalibration(510, 540);
    expect(!off.ok && off.hint).toContain("영점");
  });
});
