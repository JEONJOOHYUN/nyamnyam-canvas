import { SAMPLE_HZ } from "./constants";
import {
  filterStep,
  initialFilterState,
  shouldTransmit,
  type LastSent,
} from "./filter";
import type {
  DeviceCommand,
  WeightReading,
  WeightSource,
  WeightSourceStatus,
} from "./types";

const TRAY_G = 350;
const PRESS_G = 120; // spoon pressing down on the tray
const NOISE_G = 2;
const SAMPLE_MS = 1000 / SAMPLE_HZ;
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 3;
// Eating in small bites: far below half the serving, so never mistaken for dumping.
export const EAT_BITE_G = 10;
export const EAT_EVERY_MS = 2200;

const round1 = (n: number) => Math.round(n * 10) / 10;

// Fake load cell: same sampling, filter and send rules as the firmware. It keeps its own
// clock (reading timestamps, holds, bites), which runs `speed` times faster for the demo,
// so the meal machine's waits shrink without the machine changing at all.
export class SimulatorSource implements WeightSource {
  status: WeightSourceStatus = "idle";
  noise = false;
  foodG = 0;
  lifted = false;
  // The empty tray sits on the scale unless the demo takes it off to place it by hand.
  trayOn = true;
  speed = 1;
  // Set on the first connect (reading the time while rendering would freeze it in a prerender).
  private clock = 0;
  private pressUntil = 0;
  private eating: { leftG: number; nextAt: number } | null = null;
  private tareOffset = 0;
  private seq = 0;
  private filter = initialFilterState;
  private lastSent: LastSent = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(r: WeightReading) => void>();
  private statusListeners = new Set<() => void>();

  constructor(private random: () => number = Math.random) {}

  async connect() {
    if (this.timer) return;
    this.clock ||= Date.now();
    this.setStatus("online");
    this.startTimer();
  }

  disconnect() {
    this.stopTimer();
    this.setStatus("idle");
  }

  private startTimer() {
    this.timer = setInterval(() => this.sample(), SAMPLE_MS / this.speed);
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  onStatus(cb: () => void) {
    this.statusListeners.add(cb);
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  private setStatus(s: WeightSourceStatus) {
    this.status = s;
    this.statusListeners.forEach((cb) => cb());
  }

  subscribe(cb: (r: WeightReading) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  async sendCommand(cmd: DeviceCommand) {
    // calibrate/reboot have nothing to do on a perfect fake sensor.
    if (cmd.type === "tare") this.tareOffset = this.load(this.clock);
  }

  setFood(g: number) {
    this.foodG = Math.max(0, g);
  }

  bite(g = 15) {
    this.setFood(this.foodG - g);
  }

  setLifted(v: boolean) {
    this.lifted = v;
  }

  setTray(on: boolean) {
    this.trayOn = on;
  }

  setNoise(v: boolean) {
    this.noise = v;
  }

  setSpeed(v: number) {
    const next = Math.min(MAX_SPEED, Math.max(MIN_SPEED, v));
    if (next === this.speed) return;
    this.speed = next;
    if (this.timer) {
      this.stopTimer();
      this.startTimer();
    }
  }

  press(ms = 600) {
    this.pressUntil = this.clock + ms;
  }

  // Eats `g` grams in bites of EAT_BITE_G every EAT_EVERY_MS (simulator time), first bite now.
  eat(g: number) {
    const leftG = Math.min(g, this.foodG);
    this.eating = leftG > 0 ? { leftG, nextAt: this.clock } : null;
  }

  stopEating() {
    this.eating = null;
  }

  get eatingLeftG() {
    return this.eating?.leftG ?? 0;
  }

  private load(now: number) {
    if (this.lifted) return 0;
    return (
      (this.trayOn ? TRAY_G : 0) +
      this.foodG +
      (now < this.pressUntil ? PRESS_G : 0)
    );
  }

  private sample() {
    this.clock += SAMPLE_MS;
    const now = this.clock;
    const e = this.eating;
    if (e && now >= e.nextAt) {
      const g = Math.min(EAT_BITE_G, e.leftG, this.foodG);
      this.bite(g);
      e.leftG -= g;
      e.nextAt += EAT_EVERY_MS;
      if (e.leftG <= 0 || this.foodG <= 0) this.eating = null;
    }
    const noise = this.noise ? (this.random() * 2 - 1) * NOISE_G : 0;
    const raw = this.load(now) - this.tareOffset + noise;
    const f = filterStep(this.filter, raw, now);
    this.filter = f.state;
    if (!shouldTransmit(this.lastSent, now, f.grams, f.stable)) return;
    this.lastSent = { at: now, grams: f.grams, stable: f.stable };
    const reading: WeightReading = {
      grams: round1(f.grams),
      raw: round1(raw),
      stable: f.stable,
      seq: ++this.seq,
      ts: now,
    };
    this.listeners.forEach((cb) => cb(reading));
  }
}
