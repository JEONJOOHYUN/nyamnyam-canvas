import { asReading, CommandError, RemoteSource } from "./remote";
import { COMMAND_WAIT_MS } from "./supabase";
import type { DeviceCommand } from "./types";

const RECONNECT_MS = 2000;

// Browsers only allow ws:// from a page that is itself http (e.g. http://localhost),
// never from the https Vercel site.
export const localWsAllowed = () =>
  typeof location !== "undefined" && location.protocol === "http:";

// Optional source for a venue without internet (spec §2): the firmware built with
// LOCAL_WS sends the same reading JSON on ws://<scale ip>:81 and takes commands back.
export class LocalWebSocketSource extends RemoteSource {
  private socket: WebSocket | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private waiting = new Map<
    string,
    { resolve: () => void; reject: (e: Error) => void }
  >();

  constructor(readonly url: string) {
    super();
  }

  protected async open() {
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.onmessage = (e) => this.message(e.data);
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.setStatus("offline");
      this.retry = setTimeout(
        () => this.open().catch(() => this.setStatus("error")),
        RECONNECT_MS,
      );
    };
  }

  protected close() {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    const socket = this.socket;
    this.socket = null;
    socket?.close();
    this.waiting.forEach((w) => w.reject(new CommandError("timeout")));
    this.waiting.clear();
  }

  private message(data: unknown) {
    if (typeof data !== "string") return;
    let msg: unknown;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    if (typeof msg !== "object" || msg === null) return;
    if ("result" in msg) return this.settle(msg.result);
    const reading = asReading(msg);
    if (reading) this.receive(reading);
  }

  private settle(result: unknown) {
    if (typeof result !== "object" || result === null) return;
    const { id, status, error } = result as Record<string, unknown>;
    const w = typeof id === "string" ? this.waiting.get(id) : undefined;
    if (!w || typeof id !== "string") return;
    this.waiting.delete(id);
    if (status === "done") w.resolve();
    else
      w.reject(new CommandError(typeof error === "string" ? error : "unknown"));
  }

  sendCommand(cmd: DeviceCommand) {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN)
      return Promise.reject(new CommandError("timeout"));
    const id = Math.random().toString(36).slice(2, 10);
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        reject(new CommandError("timeout"));
      }, COMMAND_WAIT_MS);
      this.waiting.set(id, {
        resolve: () => {
          clearTimeout(timer);
          resolve();
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      socket.send(JSON.stringify({ id, ...cmd }));
    });
  }
}
