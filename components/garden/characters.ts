import type { ComponentProps, ComponentType } from "react";
import { Chick } from "./Chick";
import { Pongdang } from "./Pongdang";
import { Banjjak } from "./Banjjak";
import type { GardenThemeKey } from "./themes";

export type CharacterProps = ComponentProps<typeof Chick>;
export type GardenCharacterKey = "nyamnyam" | "pongdang" | "banjjak";

export const CHARACTERS = {
  nyamnyam: { Component: Chick, name: "냠냠이", theme: "post" },
  pongdang: { Component: Pongdang, name: "퐁당이", theme: "sea" },
  banjjak: { Component: Banjjak, name: "반짝이", theme: "space" },
} satisfies Record<
  GardenCharacterKey,
  {
    Component: ComponentType<CharacterProps>;
    name: string;
    theme: GardenThemeKey;
  }
>;
