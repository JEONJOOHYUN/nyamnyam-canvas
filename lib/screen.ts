"use client";

import { useEffect, useSyncExternalStore } from "react";

// Keeps the screen on while `active` (a tablet on the table shouldn't dim mid-meal).
// The browser drops the lock whenever the page is hidden, so it is asked for again
// on return. Unsupported or refused (low battery, http LAN page): the screen just
// follows its usual timeout.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let live = true;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          if (live) lock = l;
          else void l.release();
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}

const subscribeFullscreen = (cb: () => void) => {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
};

// Whether a fullscreen button makes sense: supported (not iPhone Safari), not already
// fullscreen, and not running as an installed app (which is fullscreen already).
export function useCanGoFullscreen() {
  return useSyncExternalStore(
    subscribeFullscreen,
    () =>
      document.fullscreenEnabled &&
      !document.fullscreenElement &&
      !matchMedia("(display-mode: fullscreen), (display-mode: standalone)")
        .matches,
    () => false,
  );
}

export function enterFullscreen() {
  void document.documentElement.requestFullscreen().catch(() => {});
}
