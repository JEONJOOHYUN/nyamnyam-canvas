// Turns every line in content/lines.ts into public/voices/<character>/<lineId>.mp3 with
// the ElevenLabs voices in content/voices.ts. Run once after lines or voices change:
//   npm run voices            generate what is new or changed
//   npm run voices -- --dry   list what would be generated, spend nothing
//   npm run voices -- --only=pongdang
// Needs ELEVENLABS_API_KEY in .env.local (library voices are API-only on paid plans) and
// ffmpeg on PATH. The app only plays the saved files; nothing calls ElevenLabs at runtime.
//
// Raw ElevenLabs output is cached in voices-src/elevenlabs/ (git-ignored), so changing only
// the finishing steps (pitch, treble, loudness) re-renders without spending credits.

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { lines, type CharacterId } from "../content/lines.ts";
import { LOUDNESS, V2_SETTINGS, voices } from "../content/voices.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "voices");
const CACHE = path.join(ROOT, "voices-src", "elevenlabs");
// Which settings each saved file was made with, so only changed lines are redone.
const LOCK = path.join(ROOT, "scripts", "voices.lock.json");

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const only = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);

const ids = Object.keys(lines) as CharacterId[];
if (only && !ids.includes(only as CharacterId)) {
  console.error(`Unknown character "${only}". Use one of: ${ids.join(", ")}`);
  process.exit(1);
}

const hash = (value: unknown) =>
  createHash("sha1").update(JSON.stringify(value)).digest("hex").slice(0, 12);

const lock: Record<string, string> = fs.existsSync(LOCK)
  ? JSON.parse(fs.readFileSync(LOCK, "utf8"))
  : {};
const saveLock = () =>
  fs.writeFileSync(
    LOCK,
    JSON.stringify(
      Object.fromEntries(
        Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)),
      ),
      null,
      2,
    ) + "\n",
  );

type Job = {
  character: CharacterId;
  id: string;
  text: string;
  /** Speed sent to ElevenLabs (multilingual_v2 only). */
  speed: number | null;
  raw: string;
  file: string;
  hash: string;
};
const jobs: Job[] = [];
for (const character of ids) {
  if (only && character !== only) continue;
  const v = voices[character];
  // Ask for speech slower by `pitch`; speeding the file up by `pitch` brings it back to `speed`.
  const speed =
    v.speed === null
      ? null
      : Number(Math.min(1.2, Math.max(0.7, v.speed / v.pitch)).toFixed(3));
  const settings = v.model === "eleven_multilingual_v2" ? V2_SETTINGS : null;
  const dir = path.join(OUT, character);
  const wanted = new Set<string>();
  for (const line of Object.values(lines[character]).flat()) {
    if (wanted.has(line.id)) continue;
    wanted.add(line.id);
    const request = hash([line.text, v.model, settings, v.voiceId, speed]);
    const raw = path.join(CACHE, character, `${line.id}-${request}.mp3`);
    const finished = hash([request, v.pitch, v.treble, LOUDNESS]);
    const file = path.join(dir, `${line.id}.mp3`);
    if (lock[`${character}/${line.id}`] === finished && fs.existsSync(file))
      continue;
    jobs.push({
      character,
      id: line.id,
      text: line.text,
      speed,
      raw,
      file,
      hash: finished,
    });
  }
  // Lines that were removed or renamed leave files behind; drop them.
  if (fs.existsSync(dir))
    for (const name of fs.readdirSync(dir)) {
      const id = name.replace(/\.mp3$/, "");
      if (!name.endsWith(".mp3") || wanted.has(id)) continue;
      console.log(`${dry ? "would remove" : "remove"} ${character}/${name}`);
      if (dry) continue;
      fs.unlinkSync(path.join(dir, name));
      delete lock[`${character}/${id}`];
    }
}

const toFetch = jobs.filter((j) => !fs.existsSync(j.raw));
const chars = toFetch.reduce((n, j) => n + j.text.length, 0);
console.log(
  `${jobs.length} line(s) to render, ${toFetch.length} need ElevenLabs: ${chars} characters (≈ ${chars} credits).`,
);
if (dry) {
  for (const j of jobs)
    console.log(
      `  ${toFetch.includes(j) ? "new " : "redo"} ${j.character}/${j.id}  ${j.text}`,
    );
  process.exit(0);
}
if (!jobs.length) {
  saveLock();
  process.exit(0);
}

try {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
} catch {
  // No .env.local: the key may still come from the environment.
}
const key = process.env.ELEVENLABS_API_KEY;
if (toFetch.length && !key) {
  console.error("ELEVENLABS_API_KEY is missing. Add it to .env.local.");
  process.exit(1);
}
if (spawnSync("ffmpeg", ["-version"]).error) {
  console.error("ffmpeg is not on PATH.");
  process.exit(1);
}

const ffmpeg = (args: string[]) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-y", ...args]);
  if (r.status !== 0) throw new Error(`ffmpeg failed\n${r.stderr}`);
  return r.stderr.toString();
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nyamnyam-voices-"));
try {
  for (const job of jobs) {
    const v = voices[job.character];
    if (!fs.existsSync(job.raw)) {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${v.voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": key ?? "",
            "content-type": "application/json",
          },
          // eleven_v4 gets no voice_settings: the voice's own defaults, as in the
          // samples the voices were chosen from.
          body: JSON.stringify({
            text: job.text,
            model_id: v.model,
            ...(v.model === "eleven_multilingual_v2" && {
              voice_settings: { ...V2_SETTINGS, speed: job.speed },
            }),
          }),
        },
      );
      if (!res.ok)
        throw new Error(
          `${job.character}/${job.id}: ${res.status} ${await res.text()}`,
        );
      fs.mkdirSync(path.dirname(job.raw), { recursive: true });
      fs.writeFileSync(job.raw, Buffer.from(await res.arrayBuffer()));
    }

    // Pitch by resampling (no time-stretching, so no "tuned" ring), then optional softening.
    const filters = [];
    if (v.pitch !== 1)
      filters.push(
        `asetrate=${Math.round(44100 * v.pitch)}`,
        "aresample=44100:resampler=soxr:precision=28",
      );
    if (v.treble) filters.push(`treble=g=${v.treble}:f=5000`);
    const shaped = path.join(tmp, "shaped.wav");
    ffmpeg([
      "-i",
      job.raw,
      ...(filters.length ? ["-af", filters.join(",")] : []),
      shaped,
    ]);

    // One plain gain per file so every character plays at the same level: average to
    // LOUDNESS.mean, but never let the loudest peak pass LOUDNESS.peak.
    const stats = ffmpeg([
      "-i",
      shaped,
      "-af",
      "volumedetect",
      "-f",
      "null",
      "-",
    ]);
    const mean = Number(/mean_volume: (-?[\d.]+) dB/.exec(stats)?.[1]);
    const max = Number(/max_volume: (-?[\d.]+) dB/.exec(stats)?.[1]);
    if (!Number.isFinite(mean) || !Number.isFinite(max))
      throw new Error(`${job.character}/${job.id}: could not measure loudness`);
    const gain = Math.min(LOUDNESS.mean - mean, LOUDNESS.peak - max);

    fs.mkdirSync(path.dirname(job.file), { recursive: true });
    ffmpeg([
      "-i",
      shaped,
      "-af",
      `volume=${gain.toFixed(2)}dB`,
      "-c:a",
      "libmp3lame",
      "-q:a",
      "2",
      job.file,
    ]);
    lock[`${job.character}/${job.id}`] = job.hash;
    console.log(`ok ${job.character}/${job.id}  ${job.text}`);
  }
} finally {
  // Keep the lines that did finish, so a rerun after an error resumes where it stopped.
  fs.rmSync(tmp, { recursive: true, force: true });
  saveLock();
}
