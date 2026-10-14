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

const round1 = (n: number) => Math.round(n * 10) / 10;

// Fake load cell: same sampling, filter and send rules as the firmware.
export class SimulatorSource implements WeightSource {
  status: WeightSourceStatus = "idle";
  noise = false;
  foodG = 0;
  lifted = false;
  private pressUntil = 0;
  private tareOffset = 0;
  private seq = 0;
  private filter = initialFilterState;
  private lastSent: LastSent = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(r: WeightReading) => void>();

  constructor(private random: () => number = Math.random) {}

  async connect() {
    if (this.timer) return;
    this.status = "online";
    this.timer = setInterval(() => this.sample(), 1000 / SAMPLE_HZ);
  }

  disconnect() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.status = "idle";
  }

  subscribe(cb: (r: WeightReading) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  async sendCommand(cmd: DeviceCommand) {
    // calibrate/reboot have nothing to do on a perfect fake sensor.
    if (cmd.type === "tare") this.tareOffset = this.load(Date.now());
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

  setNoise(v: boolean) {
    this.noise = v;
  }

  press(ms = 600) {
    this.pressUntil = Date.now() + ms;
  }

  private load(now: number) {
    if (this.lifted) return 0;
    return TRAY_G + this.foodG + (now < this.pressUntil ? PRESS_G : 0);
  }

  private sample() {
    const now = Date.now();
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
