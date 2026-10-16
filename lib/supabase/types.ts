// Hand-written types for supabase/migrations/0001_parent.sql (schema "nyamnyam").
// Keep in sync with the migrations; there is no codegen step.

import type { GardenCharacterKey } from "@/components/garden/characters";
import type { GardenThemeKey } from "@/components/garden/themes";

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  parent_pin_hash: string | null;
  created_at: string;
};

export type ChildRow = {
  id: string;
  parent_id: string;
  name: string;
  age: number | null;
  theme_character: GardenCharacterKey;
  theme_map: GardenThemeKey;
  created_at: string;
};

export type SettingsRow = {
  child_id: string;
  parent_id: string;
  completion_mode: "amount" | "meals" | "cumulative";
  meals_per_picture: number;
  meal_complete_pct: number;
  cumulative_target_g: number;
  stage_thresholds: number[];
  full_button_enabled: boolean;
  full_button_stamp_pct: number;
  idle_seconds: number;
  idle_max_prompts: number;
  sfx_volume: number;
  voice_volume: number;
  show_percent: boolean;
  child_picks_theme: boolean;
  refill_policy: "count" | "ignore";
  anomaly_detection: boolean;
  updated_at: string;
};

export type MealRow = {
  id: string;
  child_id: string;
  parent_id: string;
  started_at: string;
  ended_at: string;
  served_g: number;
  eaten_g: number;
  max_progress: number;
  completed: boolean;
  ended_by: "auto" | "full_button" | "parent";
};

export type PictureRow = {
  id: string;
  child_id: string;
  parent_id: string;
  map: GardenThemeKey;
  character: GardenCharacterKey;
  completed_at: string;
  meal_ids: string[];
};

export type StampRow = {
  id: string;
  child_id: string;
  parent_id: string;
  date: string;
  meal_id: string | null;
};

type Empty = Record<string, never>;

export type Database = {
  nyamnyam: {
    Tables: {
      profiles: Table<ProfileRow, "id">;
      children: Table<ChildRow, "name">;
      settings: Table<SettingsRow, "child_id">;
      meals: Table<
        MealRow,
        | "child_id"
        | "started_at"
        | "ended_at"
        | "served_g"
        | "eaten_g"
        | "max_progress"
        | "completed"
        | "ended_by"
      >;
      pictures: Table<PictureRow, "child_id" | "map" | "character">;
      stamps: Table<StampRow, "child_id">;
    };
    Views: Empty;
    Functions: {
      // supabase/migrations/0002_save_meal.sql
      save_meal: {
        Args: {
          p_meal: Omit<MealRow, "parent_id">;
          p_picture: Pick<
            PictureRow,
            "id" | "map" | "character" | "meal_ids"
          > | null;
          p_stamp: boolean;
        };
        Returns: undefined;
      };
    };
    Enums: Empty;
    CompositeTypes: Empty;
  };
};
