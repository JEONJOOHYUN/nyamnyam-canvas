// Field names, units and meaning must match the firmware JSON (docs/FIRMWARE_NOTES.md §2).
export type WeightReading = {
  grams: number; // filtered net weight (g) relative to tare
  raw: number; // unfiltered sample converted to g (debug)
  stable: boolean; // device judged the last 1s as steady
  seq: number; // increasing sequence number (drop stale/duplicate)
  ts: number; // ESP32 millis() or epoch ms
};

export type DeviceCommand =
  | { type: "tare" }
  | { type: "calibrate"; knownGrams: number }
  | { type: "reboot" };

export type WeightSourceStatus =
  "idle" | "connecting" | "online" | "offline" | "error";

export interface WeightSource {
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(cb: (r: WeightReading) => void): () => void;
  sendCommand(cmd: DeviceCommand): Promise<void>;
  readonly status: WeightSourceStatus;
  // Called whenever status changes (for useSyncExternalStore).
  onStatus(cb: () => void): () => void;
}
