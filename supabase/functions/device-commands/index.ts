// POST /functions/v1/device-commands — the scale reports command results, gets pending ones.
// Deploy without JWT checks (the device has no Supabase login; it proves device_key):
//   npx supabase functions deploy device-commands --no-verify-jwt
import { handleCommands, serveJson } from "../_shared/device.ts";
import { createStore } from "../_shared/store.ts";

const store = createStore();

Deno.serve((req) =>
  serveJson(req, (body) => handleCommands(store, body, new Date())),
);
