// Shared with the firmware (docs/FIRMWARE_NOTES.md §5-6). Change both together.
export const SAMPLE_HZ = 10; // HX711 read rate
export const MEDIAN_WINDOW = 5; // median of last N raw samples
export const AVERAGE_WINDOW = 5; // moving average of last N medians
export const STABLE_WINDOW_MS = 1000;
export const STABLE_BAND_G = 3; // stable when the last 1s stays within ±3g (max-min ≤ 6g)
export const SEND_DELTA_G = 1;
export const SEND_MIN_INTERVAL_MS = 250; // ~4Hz max
export const SEND_MAX_INTERVAL_MS = 1000; // heartbeat
export const OFFLINE_AFTER_MS = 3000;
