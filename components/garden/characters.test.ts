import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { GardenScene, type GardenSceneProps } from "./GardenScene";
import { Chick, CHICK_POSES } from "./Chick";
import { CHARACTERS, type GardenCharacterKey } from "./characters";
import { THEMES, type GardenThemeKey } from "./themes";

const characters = Object.keys(CHARACTERS) as GardenCharacterKey[];
const themes = Object.keys(THEMES) as GardenThemeKey[];
const render = (props: Partial<GardenSceneProps> = {}) =>
  renderToStaticMarkup(
    createElement(GardenScene, {
      progress: 1,
      layout: "wide",
      pose: "hello",
      bubble: null,
      ...props,
    }),
  );

it("registers the three companions without replacing the original drawing", () => {
  expect(characters).toEqual(["nyamnyam", "pongdang", "banjjak"]);
  expect(CHARACTERS.nyamnyam.Component).toBe(Chick);
  expect(characters.map((key) => CHARACTERS[key].theme)).toEqual([
    "post",
    "sea",
    "space",
  ]);
});

for (const character of characters) {
  it(`${character} renders every pose in both layouts and all themes`, () => {
    for (const theme of themes)
      for (const layout of ["wide", "tall"] as const)
        for (const pose of CHICK_POSES) {
          for (const progress of [0, 0.58, 1]) {
            const markup = render({
              character,
              theme,
              layout,
              pose,
              progress,
              onChickTap: () => {},
            });
            expect(markup).not.toMatch(/NaN|undefined|Infinity/);
            expect(markup).toContain(
              `${CHARACTERS[character].name}와 ${THEMES[theme].title}`,
            );
            expect(markup).toContain(
              `aria-label="${CHARACTERS[character].name}"`,
            );
            expect(markup).toContain(
              layout === "wide"
                ? 'transform="translate(250 559) scale(1.13)"'
                : 'transform="translate(145 830) scale(1.1)"',
            );
            expect(markup).toContain('<ellipse cy="8" rx="66" ry="12"');
          }
        }
  });

  it(`${character} supports gaze, downward pointing and a mouth slot in every pose`, () => {
    for (const pose of CHICK_POSES)
      for (const lookDown of [false, true])
        for (const lookAt of [
          undefined,
          [-500, 300],
          [500, -300],
          [0, 0],
        ] as const) {
          const markup = renderToStaticMarkup(
            createElement(
              "svg",
              null,
              createElement(CHARACTERS[character].Component, {
                pose,
                lookDown,
                lookAt,
                mouth: createElement("path", {
                  "data-mouth-slot": "speech",
                  d: "M-7-111Q0-97 7-111",
                }),
              }),
            ),
          );
          expect(markup).not.toMatch(/NaN|undefined|Infinity/);
          expect(markup.match(/data-mouth-slot="speech"/g)).toHaveLength(1);
          expect(markup).toContain('class="chick-move"');
          expect(markup).toContain('data-ambient="true"');
        }
  });
}

it("uses unique accessible titles and resolves every gradient and title reference", () => {
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      null,
      ...characters.flatMap((character) =>
        CHICK_POSES.map((pose) =>
          createElement(GardenScene, {
            key: `${character}-${pose}`,
            character,
            pose,
            layout: "wide",
            progress: 1,
            bubble: null,
          }),
        ),
      ),
    ),
  );
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(ids.length);
  for (const match of markup.matchAll(/(?:aria-labelledby="|url\(#)([^"\)]+)/g))
    expect(ids).toContain(match[1]);
  const titles = [...markup.matchAll(/<title[^>]*>(.*?)<\/title>/g)].map(
    (match) => match[1],
  );
  expect(new Set(titles).size).toBe(titles.length);
});

it("renders an omitted character exactly like explicit nyamnyam in every theme", () => {
  for (const theme of themes)
    for (const pose of CHICK_POSES)
      for (const layout of ["wide", "tall"] as const) {
        expect(render({ theme, pose, layout })).toBe(
          render({ theme, pose, layout, character: "nyamnyam" }),
        );
      }
});

it("preserves the pre-character default scene markup", () => {
  const renders = ["wide", "tall"].flatMap((layout) =>
    CHICK_POSES.flatMap((pose) =>
      [0, 0.33, 0.58, 0.99, 1].map((progress) =>
        renderToStaticMarkup(
          createElement(GardenScene, {
            layout: layout as "wide" | "tall",
            pose,
            progress,
            bubble: "함께 쉴게.",
            onChickTap: () => {},
          }),
        ),
      ),
    ),
  );
  const hash = createHash("sha256").update(renders.join("\n")).digest("hex");
  expect(hash).toBe(
    "a727afb8918ac300fe102da1a606213debdf4f2dc8ec599513ef21e6e10879da",
  );
});
