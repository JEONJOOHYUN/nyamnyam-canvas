// Registering a scale on the parent screen: its id, its secret key and the secrets.h
// lines to paste into the firmware (docs/FIRMWARE_NOTES.md §3, §7).
import { sha256 } from "./settings";

const ID_LETTERS = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o, 1/l to misread
// Calibration passes when a known weight reads within this many grams (spec §3).
export const CALIBRATION_TOLERANCE_G = 5;
export const DEFAULT_KNOWN_G = 510; // a 500ml water bottle

// getRandomValues works on plain http too (tablet → dev PC over LAN), unlike crypto.subtle.
const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// "nyam-" + 6 letters/digits, matching the devices.id check in 0003_devices.sql.
export function newDeviceId(bytes = randomBytes(6)): string {
  return `nyam-${Array.from(bytes, (b) => ID_LETTERS[b % ID_LETTERS.length]).join("")}`;
}

// 24 random bytes as 48 hex characters. Only its hash is stored.
export function newDeviceKey(bytes = randomBytes(24)): string {
  return hex(bytes);
}

// Same as the Edge Function's sha256Hex (UTF-8 text → hex digest).
export function deviceKeyHash(key: string): string {
  return hex(sha256(new TextEncoder().encode(key)));
}

export function secretsSnippet(o: {
  supabaseUrl: string;
  deviceId: string;
  deviceKey: string;
}): string {
  return [
    `#define DEVICE_ID "${o.deviceId}"`,
    `#define DEVICE_KEY "${o.deviceKey}"`,
    `#define FUNCTIONS_URL "${o.supabaseUrl.replace(/\/+$/, "")}/functions/v1"`,
  ].join("\n");
}

export type CalibrationCheck =
  { ok: true; diffG: number } | { ok: false; diffG: number; hint: string };

// Step 3 of the wizard: put the known weight back on and compare.
export function checkCalibration(
  knownG: number,
  readG: number,
): CalibrationCheck {
  const diffG = Math.round((readG - knownG) * 10) / 10;
  if (Math.abs(diffG) <= CALIBRATION_TOLERANCE_G) return { ok: true, diffG };
  if (readG < 0)
    return {
      ok: false,
      diffG,
      hint: "무게가 거꾸로 나와요. 로드셀 화살표 방향이나 초록·하양 선이 바뀌었는지 확인해 주세요.",
    };
  if (Math.abs(readG) < knownG * 0.5)
    return {
      ok: false,
      diffG,
      hint: "무게가 너무 적게 나와요. 상판이 케이스에 닿았거나 물건이 가장자리에 걸쳤는지 확인해 주세요.",
    };
  return {
    ok: false,
    diffG,
    hint: "오차가 커요. 상판이 흔들리지 않게 고정하고, 영점부터 다시 잡아 주세요.",
  };
}
