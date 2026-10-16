import { afterEach, describe, expect, it, vi } from "vitest";
import { newId } from "./data";

const V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("newId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("makes v4 UUIDs even without crypto.randomUUID (plain http on a LAN)", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: (a: Uint8Array) => real.getRandomValues(a),
    });
    const ids = Array.from({ length: 50 }, newId);
    ids.forEach((id) => expect(id).toMatch(V4));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
