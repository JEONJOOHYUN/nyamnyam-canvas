import type { ComponentType, ReactNode } from "react";
import { GROWTH_PIECES, type GrowthPiece } from "./growth";
import { pieces } from "./WorldPieces";
import { PostBackground, PostScenery } from "./PostBackground";
import { SEA_EVENTS, seaPieces, SeaBackground, SeaScenery } from "./SeaTheme";
import {
  SPACE_EVENTS,
  spacePieces,
  SpaceBackground,
  SpaceScenery,
} from "./SpaceTheme";

export interface GardenTheme {
  title: string;
  description: string;
  events: readonly GrowthPiece[];
  pieces: Readonly<Record<string, ReactNode>>;
  Background: ComponentType<{ tall: boolean }>;
  Scenery: ComponentType<{ tall: boolean }>;
  finale: string;
}

export type GardenThemeKey = "post" | "sea" | "space";

export const THEMES: Record<GardenThemeKey, GardenTheme> = {
  post: {
    title: "바람 우체국",
    description: "길, 우체국, 망원경, 돛배가 하나씩 생겨요.",
    events: GROWTH_PIECES,
    pieces,
    Background: PostBackground,
    Scenery: PostScenery,
    finale: "lanterns",
  },
  sea: {
    title: "바다 왕국",
    description:
      "물방울, 해초, 산호, 물고기, 조개 궁전, 거북이, 고래가 하나씩 생겨요.",
    events: SEA_EVENTS,
    pieces: seaPieces,
    Background: SeaBackground,
    Scenery: SeaScenery,
    finale: "whale-finale",
  },
  space: {
    title: "우주 외계인 마을",
    description:
      "별, 수정 식물, 둥근 기지, 외계인 친구들과 로켓이 하나씩 생겨요.",
    events: SPACE_EVENTS,
    pieces: spacePieces,
    Background: SpaceBackground,
    Scenery: SpaceScenery,
    finale: "launch-finale",
  },
};
