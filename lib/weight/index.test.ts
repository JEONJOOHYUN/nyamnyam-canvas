import { describe, expect, it } from "vitest";
import { choiceKey, effectiveChoice, parseChoice } from "./index";

// NEXT_PUBLIC_WEIGHT_SOURCE is unset in tests, i.e. the simulator default.
describe("effectiveChoice", () => {
  const ids = ["nyam-aaaaaa", "nyam-bbbbbb"];

  it("keeps a picked scale that still exists", () => {
    const picked = { kind: "supabase", deviceId: "nyam-bbbbbb" } as const;
    expect(effectiveChoice(picked, ids)).toEqual(picked);
  });

  it("moves to the first scale when the picked one was removed", () => {
    expect(
      effectiveChoice({ kind: "supabase", deviceId: "nyam-gone00" }, ids),
    ).toEqual({ kind: "supabase", deviceId: "nyam-aaaaaa" });
    expect(
      effectiveChoice({ kind: "supabase", deviceId: "nyam-gone00" }, []),
    ).toEqual({ kind: "simulator" });
  });

  it("uses the env default when nothing is picked", () => {
    expect(effectiveChoice(null, ids)).toEqual({ kind: "simulator" });
  });

  it("keeps the simulator, and drops a local scale outside http pages", () => {
    expect(effectiveChoice({ kind: "simulator" }, ids)).toEqual({
      kind: "simulator",
    });
    expect(
      effectiveChoice({ kind: "localws", url: "ws://192.168.0.9:81" }, ids),
    ).toEqual({ kind: "simulator" });
  });
});

describe("parseChoice", () => {
  it("reads only well-formed choices", () => {
    expect(parseChoice({ kind: "supabase", deviceId: "nyam-aaaaaa" })).toEqual({
      kind: "supabase",
      deviceId: "nyam-aaaaaa",
    });
    expect(parseChoice({ kind: "localws", url: "http://x" })).toBeNull();
    expect(parseChoice({ kind: "localws", url: "ws://10.0.0.2:81" })).toEqual({
      kind: "localws",
      url: "ws://10.0.0.2:81",
    });
    expect(parseChoice("simulator")).toBeNull();
  });

  it("gives each choice its own key", () => {
    expect(choiceKey({ kind: "supabase", deviceId: "nyam-aaaaaa" })).toBe(
      "supabase:nyam-aaaaaa",
    );
    expect(choiceKey({ kind: "simulator" })).toBe("simulator");
  });
});
