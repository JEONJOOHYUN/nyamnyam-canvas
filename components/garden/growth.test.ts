import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CHICK_POSES, GardenScene } from "./GardenScene";
import {
  GROWTH_PIECES,
  arrivingPieces,
  buildProgress,
  visiblePieces,
} from "./growth";

describe("arrivingPieces", () => {
  const keysAt = (p: number) => visiblePieces(p).map((piece) => piece.key);

  it("brings in every piece a big jump adds, together", () => {
    const added = arrivingPieces(keysAt(0.1), keysAt(0.4));
    expect(added).toEqual(keysAt(0.4).slice(keysAt(0.1).length));
    expect(added.length).toBe(10);
  });

  it("brings in one piece for a small step", () => {
    expect(arrivingPieces(keysAt(0.1), keysAt(0.13))).toHaveLength(1);
  });

  it("animates only the newest piece on the first render", () => {
    expect(arrivingPieces(null, keysAt(0.4))).toEqual(keysAt(0.4).slice(-1));
    expect(arrivingPieces(null, [])).toEqual([]);
  });
});

describe("additive scene growth", () => {
  it("has 30–40 distinct events with no gap over four percent, including both ends", () => {
    expect(GROWTH_PIECES.length).toBeGreaterThanOrEqual(30);
    expect(GROWTH_PIECES.length).toBeLessThanOrEqual(40);
    const thresholds = [0, ...GROWTH_PIECES.map(({ at }) => at), 1];
    for (let index = 1; index < thresholds.length; index++) {
      const gap = thresholds[index] - thresholds[index - 1];
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(0.04 + Number.EPSILON);
    }
  });

  it("lands a complete house with its stage cheer and adds complete telescope and boat assemblies", () => {
    const at = (key: string) =>
      GROWTH_PIECES.find((piece) => piece.key === key)!.at;
    const markupAt = (progress: number) =>
      renderToStaticMarkup(
        createElement(GardenScene, {
          progress,
          layout: "wide",
          pose: "point",
          bubble: null,
        }),
      );
    const house = markupAt(at("house"));
    for (const part of [
      "wall-left",
      "wall-right",
      "wall-top",
      "door",
      "roof-bottom",
      "roof-middle",
      "roof-top",
      "step-6",
    ]) {
      expect(house).toContain(`data-building-part="${part}"`);
      expect(markupAt(at("house") - 0.001)).not.toContain(
        `data-building-part="${part}"`,
      );
    }
    for (const [key, parts] of [
      ["telescope", ["scope-deck", "scope-post", "scope-tube", "scope-lens"]],
      ["boat", ["boat-hull", "boat-mast", "sail-small", "sail-big"]],
    ] as const) {
      for (const part of parts) {
        expect(markupAt(at(key))).toContain(`data-building-part="${part}"`);
        expect(markupAt(at(key) - 0.001)).not.toContain(
          `data-building-part="${part}"`,
        );
      }
    }
    expect([...markupAt(1).matchAll(/data-ambient="(?!true")/g)]).toHaveLength(
      8,
    );
  });
  it("never removes a previously visible piece as progress increases", () => {
    let previous: string[] = [];
    for (let step = 0; step <= 1000; step++) {
      const current = visiblePieces(step / 1000).map(({ key }) => key);
      expect(current).toEqual(expect.arrayContaining(previous));
      previous = current;
    }
    expect(previous).toHaveLength(GROWTH_PIECES.length);
  });

  it("adds exactly one complete piece at each threshold", () => {
    expect(visiblePieces(0)).toEqual([]);
    expect(new Set(GROWTH_PIECES.map(({ key }) => key)).size).toBe(
      GROWTH_PIECES.length,
    );
    GROWTH_PIECES.forEach(({ at, key }, index) => {
      expect(visiblePieces(at - 0.000001)).toHaveLength(index);
      expect(visiblePieces(at)).toHaveLength(index + 1);
      expect(visiblePieces(at).at(-1)?.key).toBe(key);
    });
  });

  it("clamps out-of-range inputs and treats NaN as the start", () => {
    for (const input of [-1, -Infinity, NaN])
      expect(visiblePieces(input)).toEqual([]);
    for (const input of [1, 2, Infinity])
      expect(visiblePieces(input)).toEqual(GROWTH_PIECES);
  });

  it("looks toward the latest event when it changes from left ground to right sky", () => {
    const renderAt = (progress: number) =>
      renderToStaticMarkup(
        createElement(GardenScene, {
          progress,
          layout: "wide",
          pose: "point",
          bubble: null,
        }),
      );
    expect(renderAt(0.0676)).toContain("transform:translate(-7px, 6px)");
    expect(renderAt(0.1052)).toContain("transform:translate(7px, -6px)");
  });

  it("renders the cumulative piece list without masks or changing earlier geometry", () => {
    for (const layout of ["wide", "tall"] as const) {
      let previousShapes: string[] = [];
      const checkpoints = [
        0,
        ...GROWTH_PIECES.flatMap(({ at }) => [at - 0.000001, at]),
      ];
      for (const progress of checkpoints) {
        const markup = renderToStaticMarkup(
          createElement(GardenScene, {
            progress,
            layout,
            pose: "wait",
            bubble: null,
          }),
        );
        expect(markup).not.toMatch(/clipPath|clip-path|<mask|NaN|undefined/);
        const keys = [...markup.matchAll(/data-piece="([^"]+)"/g)].map(
          (match) => match[1],
        );
        expect(keys.toSorted()).toEqual(
          visiblePieces(progress)
            .map(({ key }) => key)
            .toSorted(),
        );
        for (const side of ["left", "right"]) {
          if (keys.includes(`tree-${side}`)) {
            expect(keys.indexOf(`tree-${side}`)).toBeLessThan(
              keys.indexOf(`fence-${side}`),
            );
          }
        }
        const shapes = [
          ...markup.matchAll(/<(?:path|rect|circle|ellipse)\b[^>]*>/g),
        ].map((match) => match[0]);
        expect(shapes).toEqual(expect.arrayContaining(previousShapes));
        previousShapes = shapes;
      }
    }
  });

  it("anchors the garland, balloons and boat to their supporting objects in both layouts", () => {
    const byKey = (key: string) =>
      GROWTH_PIECES.find((piece) => piece.key === key)!;
    for (const layout of ["wide", "tall"] as const) {
      const scale = layout === "tall" ? 0.86 : 1;
      expect(byKey("boat")[layout]).toEqual(byKey("pond")[layout]);
      expect(byKey("garland")[layout][0]).toBe(byKey("house")[layout][0]);
      expect(
        Math.abs(
          byKey("house")[layout][1] - byKey("garland")[layout][1] - 98 * scale,
        ),
      ).toBeLessThan(1);
      expect(
        Math.abs(
          byKey("mailbox-flag")[layout][0] -
            byKey("balloons")[layout][0] -
            14 * scale,
        ),
      ).toBeLessThan(1);
      expect(byKey("balloons")[layout][1]).toBe(
        byKey("mailbox-flag")[layout][1],
      );
    }
    // Attached pieces only ever arrive after what they hang on.
    for (const [part, support] of [
      ["boat", "pond"],
      ["reeds", "pond"],
      ["garland", "house"],
      ["letter-sign", "house"],
      ["round-window", "house"],
      ["letter-chute", "house"],
      ["chimney", "house"],
      ["smoke", "chimney"],
      ["parcel", "house"],
      ["lanterns", "house"],
      ["mailbox-flag", "mailbox"],
      ["balloons", "mailbox-flag"],
    ])
      expect(byKey(part).at).toBeGreaterThan(byKey(support).at);
    expect(visiblePieces(0.1052).map(({ key }) => key)).toContain(
      "flying-letter",
    );
  });

  it("adds the roof flag and lights only at completion, retaining all 99 percent shapes", () => {
    for (const layout of ["wide", "tall"] as const) {
      const renderAt = (progress: number) =>
        renderToStaticMarkup(
          createElement(GardenScene, {
            progress,
            layout,
            pose: "celebrate",
            bubble: null,
          }),
        );
      expect(renderAt(0.99)).not.toContain('data-finale="post-office"');
      expect(renderAt(1)).toContain('data-finale="post-office"');
      expect(renderAt(1)).toContain('data-ambient="finale-flag"');
      expect(visiblePieces(1)).toHaveLength(34);
      expect(visiblePieces(0.99)).toHaveLength(33);
    }
  });

  it("takes twenty seconds to build and holds the complete preview before restarting", () => {
    expect(buildProgress(0)).toBe(0);
    expect(buildProgress(10000)).toBe(0.5);
    expect(buildProgress(20000)).toBe(1);
    expect(buildProgress(20999)).toBe(1);
    expect(buildProgress(21000)).toBe(0);
    expect(buildProgress(31000)).toBe(0.5);
  });

  it("renders every pose in both layouts with distinct accessible titles", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        ...CHICK_POSES.flatMap((pose) =>
          (["wide", "tall"] as const).map((layout) =>
            createElement(GardenScene, {
              key: `${layout}-${pose}`,
              progress: 1,
              layout,
              pose,
              bubble: "함께 쉴게.",
            }),
          ),
        ),
      ),
    );
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(markup).not.toMatch(/NaN|undefined/);
    for (const match of markup.matchAll(/aria-labelledby="([^"]+)"/g))
      expect(ids).toContain(match[1]);
  });
});
