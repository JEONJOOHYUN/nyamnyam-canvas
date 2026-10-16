// POST /functions/v1/device-ingest — the scale sends one reading, gets pending commands.
// Deploy without JWT checks (the device has no Supabase login; it proves device_key):
//   npx supabase functions deploy device-ingest --no-verify-jwt
import { handleIngest, serveJson } from "../_shared/device.ts";
import { createStore } from "../_shared/store.ts";

const store = createStore();

Deno.serve((req) =>
  serveJson(req, (body) => handleIngest(store, body, new Date())),
);
