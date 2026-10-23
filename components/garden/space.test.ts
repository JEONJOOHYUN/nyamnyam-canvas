import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { GardenScene } from "./GardenScene";
import { THEMES } from "./themes";

const render = (progress: number, layout: "wide" | "tall") =>
  renderToStaticMarkup(
    createElement(GardenScene, {
      theme: "space",
      progress,
      layout,
      pose: "wait",
      bubble: null,
    }),
  );

it("lands a complete dome base with its stage cheer and attaches its decorations after it", () => {
  const event = (key: string) =>
    THEMES.space.events.find((piece) => piece.key === key)!;
  const at = event("dome-base").at;
  for (const layout of ["wide", "tall"] as const) {
    for (const part of ["feet", "dome", "rim", "door", "windows", "antenna"]) {
      expect(render(at - 0.001, layout)).not.toContain(
        `data-building-part="base-${part}"`,
      );
      expect(render(at, layout)).toContain(`data-building-part="base-${part}"`);
    }
    const base = event("dome-base")[layout];
    const scale = layout === "tall" ? 0.86 : 1;
    for (const [key, x, y] of [
      ["base-badge", 0, -85],
      ["roof-dish", 60, -115],
      ["door-step", 0, 18],
      ["base-heart", 0, -41],
      ["base-lamps", 0, 0],
    ] as const) {
      expect(event(key)[layout][0]).toBeCloseTo(base[0] + x * scale);
      expect(event(key)[layout][1]).toBeCloseTo(base[1] + y * scale);
      expect(event(key).at).toBeGreaterThan(at);
    }
  }
});

it("assembles the rocket before its astronaut and adds ignition only at 100 percent", () => {
  const events = THEMES.space.events;
  const rocket = events.filter(({ key }) => key.startsWith("rocket-"));
  expect(rocket.map(({ key }) => key)).toEqual([
    "rocket-body",
    "rocket-window",
    "rocket-fins",
    "rocket-nose",
  ]);
  expect(rocket[0].at).toBeGreaterThan(
    events.find(({ key }) => key === "landing-pad")!.at,
  );
  expect(rocket.at(-1)!.at).toBeLessThan(
    events.find(({ key }) => key === "alien-astronaut")!.at,
  );
  for (const layout of ["wide", "tall"] as const) {
    const scale = layout === "tall" ? 0.86 : 1;
    const pad = events.find(({ key }) => key === "landing-pad")![layout];
    expect(rocket[0][layout][0]).toBe(pad[0]);
    expect(rocket[0][layout][1] - 11 * scale).toBeCloseTo(pad[1] - 5 * scale);
    for (const piece of rocket) {
      expect(piece[layout]).toEqual(rocket[0][layout]);
      expect(render(piece.at - 0.000001, layout)).not.toContain(
        `data-piece="${piece.key}"`,
      );
      expect(render(piece.at, layout)).toContain(`data-piece="${piece.key}"`);
    }
    expect(events.at(-1)![layout]).toEqual(rocket[0][layout]);
    expect(render(0.999999, layout)).not.toContain(
      'data-finale="space-village"',
    );
    expect(render(1, layout)).toContain('data-finale="space-village"');
    expect(render(1, layout)).not.toMatch(/<text[\s>]/);
  }
});
