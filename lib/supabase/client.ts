import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// The app's tables live in their own schema inside a shared Supabase project.
export const DB_SCHEMA = "nyamnyam";
export type Db = SupabaseClient<Database, typeof DB_SCHEMA>;

let client: Db | null | undefined;

// Browser-only client; null when the project isn't configured (demo mode).
export function getSupabase(): Db | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client =
    url && key
      ? createClient<Database, typeof DB_SCHEMA>(url, key, {
          db: { schema: DB_SCHEMA },
        })
      : null;
  return client;
}
