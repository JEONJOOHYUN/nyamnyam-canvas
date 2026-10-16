import { EMPTY_CARRY, nextCarry, type PictureCarry } from "@/lib/meal/picture";
import type { Db } from "@/lib/supabase/client";
import type { ChildRow, MealRow } from "@/lib/supabase/types";
import {
  DEFAULT_SETTINGS,
  fromRow,
  getActiveChild,
  type PlaySettings,
} from "./settings";

export type PlayConfig = {
  child: ChildRow;
  settings: PlaySettings;
  carry: PictureCarry;
};

// The signed-in parent's active child, its settings, and what earlier meals added to the
// picture in progress. null = demo mode (not signed in, or no child yet).
export async function loadPlayConfig(db: Db): Promise<PlayConfig | null> {
  const { data: auth } = await db.auth.getSession();
  if (!auth.session) return null;
  const { data: children, error } = await db
    .from("children")
    .select("*")
    .order("created_at");
  if (error) throw error;
  if (!children.length) return null;
  const active = getActiveChild();
  const child = children.find((c) => c.id === active) ?? children[0];

  const [settingsRes, pictureRes] = await Promise.all([
    db.from("settings").select("*").eq("child_id", child.id).maybeSingle(),
    db
      .from("pictures")
      .select("completed_at")
      .eq("child_id", child.id)
      .order("completed_at", { ascending: false })
      .limit(1),
  ]);
  if (settingsRes.error) throw settingsRes.error;
  if (pictureRes.error) throw pictureRes.error;
  const settings = settingsRes.data
    ? fromRow(settingsRes.data)
    : DEFAULT_SETTINGS;

  let carry = EMPTY_CARRY;
  if (settings.mode !== "amount") {
    let query = db
      .from("meals")
      .select("id, eaten_g, max_progress, completed")
      .eq("child_id", child.id)
      .order("ended_at");
    const since = pictureRes.data[0]?.completed_at;
    if (since) query = query.gt("ended_at", since);
    const { data: meals, error: mealsError } = await query;
    if (mealsError) throw mealsError;
    carry = meals.reduce(
      (c, m) =>
        nextCarry(
          settings,
          c,
          {
            id: m.id,
            progress: m.max_progress,
            eatenG: m.eaten_g,
            completed: m.completed,
          },
          false,
        ),
      EMPTY_CARRY,
    );
  }
  return { child, settings, carry };
}

// Everything one finished meal writes. Ids are made on the device and the database
// function is insert-or-skip in one transaction, so a retry never duplicates or half-saves.
export type MealSave = {
  meal: Omit<MealRow, "parent_id">;
  picture: {
    id: string;
    map: ChildRow["theme_map"];
    character: ChildRow["theme_character"];
    earlierMealIds: string[];
  } | null;
  stamp: boolean;
};

export async function saveMeal(db: Db, { meal, picture, stamp }: MealSave) {
  const { error } = await db.rpc("save_meal", {
    p_meal: meal,
    p_picture: picture && {
      id: picture.id,
      map: picture.map,
      character: picture.character,
      meal_ids: [...picture.earlierMealIds, meal.id],
    },
    p_stamp: stamp,
  });
  if (error) throw error;
}

// Random v4 UUID. crypto.randomUUID needs a secure context, which a tablet opening the
// dev PC over plain http://<LAN IP> is not; getRandomValues works everywhere.
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Meals not yet confirmed by the server, kept on this device per parent account, so a
// retry only ever sends a parent's own meals.
const unsavedKey = (userId: string) => `nyamnyam.unsavedMeals.${userId}`;
export function loadUnsaved(userId: string): MealSave[] {
  try {
    const raw = localStorage.getItem(unsavedKey(userId));
    return raw ? (JSON.parse(raw) as MealSave[]) : [];
  } catch {
    return [];
  }
}
export function storeUnsaved(userId: string, list: MealSave[]) {
  try {
    if (list.length)
      localStorage.setItem(unsavedKey(userId), JSON.stringify(list));
    else localStorage.removeItem(unsavedKey(userId));
  } catch {
    // Storage unavailable: the retry button still works until the page closes.
  }
}
