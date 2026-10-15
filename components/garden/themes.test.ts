import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GardenScene, CHICK_POSES, type GardenSceneProps } from "./GardenScene";
import { buildProgress, visiblePieces } from "./growth";
import { THEMES, type GardenThemeKey } from "./themes";

const render = (props: Partial<GardenSceneProps> = {}) =>
  renderToStaticMarkup(
    createElement(GardenScene, {
      progress: 1,
      layout: "wide",
      pose: "wait",
      bubble: null,
      ...props,
    }),
  );

for (const theme of Object.keys(THEMES) as GardenThemeKey[]) {
  const { events, pieces, finale, title } = THEMES[theme];
  describe(`${theme} theme contract`, () => {
    it("covers the whole meal with distinct complete drawings, starting at three percent", () => {
      expect(events.length).toBeGreaterThanOrEqual(30);
      expect(events.length).toBeLessThanOrEqual(40);
      expect(events[0].at).toBe(0.03);
      expect(new Set(events.map(({ key }) => key)).size).toBe(events.length);
      expect(Object.keys(pieces).sort()).toEqual(
        events.map(({ key }) => key).sort(),
      );
      let previous = 0;
      events.forEach(({ at, key }, index) => {
        expect(at - previous).toBeGreaterThan(0);
        expect(at - previous).toBeLessThanOrEqual(0.04 + Number.EPSILON);
        expect(visiblePieces(at - 0.000001, events)).toHaveLength(index);
        expect(visiblePieces(at, events).at(-1)?.key).toBe(key);
        expect(
          renderToStaticMarkup(createElement("svg", null, pieces[key])),
        ).toMatch(/<(path|rect|circle|ellipse)/);
        previous = at;
      });
      expect(previous).toBe(1);
      for (const progress of [-Infinity, -1, 0, NaN])
        expect(visiblePieces(progress, events)).toEqual([]);
      for (const progress of [1, 2, Infinity])
        expect(visiblePieces(progress, events)).toEqual(events);
    });

    it("keeps every earlier shape and placement in both layouts without cutting shapes", () => {
      for (const layout of ["wide", "tall"] as const) {
        let previousShapes: string[] = [];
        let previousKeys: string[] = [];
        for (const progress of [
          0,
          ...events.flatMap(({ at }) => [at - 0.000001, at]),
        ]) {
          const markup = render({ theme, layout, progress });
          expect(markup).not.toMatch(/clipPath|clip-path|<mask|NaN|undefined/);
          const keys = [...markup.matchAll(/data-piece="([^"]+)"/g)].map(
            (match) => match[1],
          );
          expect(keys).toEqual(expect.arrayContaining(previousKeys));
          expect(keys.toSorted()).toEqual(
            visiblePieces(progress, events)
              .map(({ key }) => key)
              .toSorted(),
          );
          for (const event of visiblePieces(progress, events)) {
            const [x, y] = event[layout];
            expect(markup).toContain(
              `data-piece="${event.key}" transform="translate(${x} ${y}) scale(${layout === "tall" ? 0.86 : 1})"`,
            );
          }
          const shapes = [
            ...markup.matchAll(/<(?:path|rect|circle|ellipse)\b[^>]*>/g),
          ].map((match) => match[0]);
          const remaining = [...shapes];
          for (const shape of previousShapes) {
            const index = remaining.indexOf(shape);
            expect(index).toBeGreaterThanOrEqual(0);
            remaining.splice(index, 1);
          }
          previousShapes = shapes;
          previousKeys = keys;
        }
      }
    });

    it("reserves the finale for 100 percent and has five to eight ambient groups", () => {
      expect(events.at(-1)).toMatchObject({ key: finale, at: 1 });
      for (const layout of ["wide", "tall"] as const) {
        const before = render({ theme, layout, progress: 0.99 });
        const done = render({ theme, layout });
        expect(before).not.toContain("data-finale=");
        expect(done).toContain("data-finale=");
        expect(
          visiblePieces(1, events).length - visiblePieces(0.99, events).length,
        ).toBe(1);
        const loops = [...done.matchAll(/data-ambient="(?!true")/g)];
        expect(loops.length).toBeGreaterThanOrEqual(5);
        expect(loops.length).toBeLessThanOrEqual(8);
      }
    });

    it("builds the supplied event list, holds completion, and resets only the preview", () => {
      for (const elapsed of [
        0, 590, 600, 10000, 19800, 20000, 20999, 21000, 31000,
      ]) {
        expect(buildProgress(elapsed, events)).toBe(
          visiblePieces(buildProgress(elapsed), events).at(-1)?.at ?? 0,
        );
      }
      expect(
        buildProgress(10000, [
          { key: "custom", at: 0.4, wide: [0, 0], tall: [0, 0] },
        ]),
      ).toBe(0.4);
    });

    it("keeps the character and bubble anchors independent of the theme for every pose", () => {
      for (const pose of CHICK_POSES) {
        for (const layout of ["wide", "tall"] as const) {
          const markup = render({ theme, layout, pose, bubble: "함께 쉴게." });
          expect(markup).toContain(title);
          expect(markup).toContain(
            layout === "wide"
              ? 'transform="translate(250 559) scale(1.13)"'
              : 'transform="translate(145 830) scale(1.1)"',
          );
          expect(markup).toContain(
            layout === "wide"
              ? 'transform="translate(-125 -292)"'
              : 'transform="translate(78 -61) scale(.93)"',
          );
        }
      }
      const markup = renderToStaticMarkup(
        createElement(
          "div",
          null,
          ...CHICK_POSES.map((pose) =>
            createElement(GardenScene, {
              key: pose,
              theme,
              pose,
              progress: 1,
              layout: "tall",
              bubble: null,
            }),
          ),
        ),
      );
      const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(
        (match) => match[1],
      );
      expect(new Set(ids).size).toBe(ids.length);
      for (const match of markup.matchAll(
        /(?:aria-labelledby="|url\(#)([^"\)]+)/g,
      ))
        expect(ids).toContain(match[1]);
    });
  });
}

it("renders the default theme exactly like explicit post", () => {
  for (const layout of ["wide", "tall"] as const) {
    for (const progress of [0, 0.33, 0.58, 0.99, 1]) {
      expect(render({ layout, progress })).toBe(
        render({ layout, progress, theme: "post" }),
      );
    }
  }
});

it("lands a complete shell palace at 33 percent and attaches its later additions", () => {
  const parts = ["towers", "walls", "shell-roof", "door", "window", "step"];
  for (const layout of ["wide", "tall"] as const) {
    for (const part of parts) {
      expect(render({ theme: "sea", layout, progress: 0.329 })).not.toContain(
        `data-building-part="palace-${part}"`,
      );
      expect(render({ theme: "sea", layout, progress: 0.33 })).toContain(
        `data-building-part="palace-${part}"`,
      );
    }
    const event = (key: string) =>
      THEMES.sea.events.find((piece) => piece.key === key)!;
    const palace = event("palace")[layout];
    const scale = layout === "tall" ? 0.86 : 1;
    for (const [key, x, y] of [
      ["window-left", -85, -65],
      ["window-right", 85, -65],
      ["crown-tower", 0, -165],
      ["tower-pennant", 0, -232],
      ["palace-medallion", 0, -125],
    ] as const) {
      expect(event(key)[layout][0]).toBeCloseTo(palace[0] + x * scale);
      expect(event(key)[layout][1]).toBeCloseTo(palace[1] + y * scale);
    }
    expect(event("pearl-arch")[layout]).toEqual(palace);
    expect(event("whale-finale")[layout]).toEqual(palace);
  }
});
