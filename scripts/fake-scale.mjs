// Fake scale for testing the real Supabase path without the hardware.
// It talks to the deployed Edge Functions exactly like firmware/nyamnyam/nyamnyam.ino:
// readings to device-ingest (every 400ms here), command results to device-commands.
//
// 1. Parent screen > 저울 > 저울 등록하기, keep the DEVICE_ID / DEVICE_KEY it shows.
// 2. FAKE_SCALE_ID=nyam-xxxxxx FAKE_SCALE_KEY=<48 hex> node scripts/fake-scale.mjs
//    (FUNCTIONS_URL defaults to NEXT_PUBLIC_SUPABASE_URL in .env.local + /functions/v1)
// 3. Type a weight in grams + Enter (350 = empty tray, 550 = tray + 200g food, ...).
//    "r" = reboot (seq and ts start over after 3s of silence), "q" = quit.
// Commands from the parent screen (tare, calibrate, reboot) are answered "done".
import fs from "node:fs";
import readline from "node:readline";

function functionsUrl() {
  if (process.env.FUNCTIONS_URL) return process.env.FUNCTIONS_URL;
  try {
    const env = fs.readFileSync(
      new URL("../.env.local", import.meta.url),
      "utf8",
    );
    const base = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(\S+)/m)?.[1];
    if (base) return `${base.replace(/\/+$/, "")}/functions/v1`;
  } catch {
    // no .env.local
  }
  return null;
}

const id = process.env.FAKE_SCALE_ID;
const key = process.env.FAKE_SCALE_KEY;
const base = functionsUrl();
if (!id || !key || !base) {
  console.error(
    "Set FAKE_SCALE_ID and FAKE_SCALE_KEY (and FUNCTIONS_URL if there is no .env.local).",
  );
  process.exit(1);
}

let grams = 0;
let seq = 0;
let bootAt = Date.now();
let pausedUntil = 0;
let running = true;
const seen = new Set();
const results = [];

async function post(path, body) {
  const res = await fetch(`${base}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: id, device_key: key, ...body }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    console.error("401 unauthorized: check FAKE_SCALE_ID / FAKE_SCALE_KEY.");
    process.exit(1);
  }
  if (res.status !== 200) console.log(`${path} → ${res.status}`, json);
  return { ok: res.status === 200, json };
}

function take(commands = []) {
  for (const c of commands) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    console.log(`command: ${c.type}${c.knownGrams ? ` ${c.knownGrams}g` : ""}`);
    if (c.type === "calibrate")
      results.push({
        id: c.id,
        status: "done",
        calibrationFactor: 420,
        tareOffset: 0,
      });
    else results.push({ id: c.id, status: "done", tareOffset: 0 });
    if (c.type === "reboot") reboot();
  }
}

function reboot() {
  console.log("rebooting: silent for 3s, then seq and ts start over");
  pausedUntil = Date.now() + 3000;
  seq = 0;
  bootAt = pausedUntil;
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const t = line.trim();
  if (t === "q") running = false;
  else if (t === "r") reboot();
  else if (t !== "" && Number.isFinite(Number(t))) {
    grams = Number(t);
    console.log(`weight: ${grams}g`);
  } else console.log('Type grams, "r" to reboot, "q" to quit.');
});

console.log(`fake scale ${id} → ${base}`);
console.log('Type grams + Enter, "r" to reboot, "q" to quit.');
while (running) {
  if (Date.now() >= pausedUntil) {
    try {
      const reading = {
        grams: Math.round((grams + (seq % 2) * 0.2) * 10) / 10,
        raw: grams,
        stable: true,
        seq: ++seq,
        ts: Date.now() - bootAt,
      };
      take((await post("device-ingest", { reading })).json.commands);
      if (results.length) {
        // Drop results only once the server has them; otherwise send them again.
        const batch = results.slice(0, 10);
        const sent = await post("device-commands", { results: batch });
        if (sent.ok) results.splice(0, batch.length);
        take(sent.json.commands);
      }
    } catch (e) {
      console.log("network error:", e instanceof Error ? e.message : e);
    }
  }
  await new Promise((r) => setTimeout(r, 400));
}
rl.close();
console.log(`stopped after ${seq} readings`);
