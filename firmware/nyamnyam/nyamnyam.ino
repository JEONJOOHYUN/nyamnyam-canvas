// 냠냠캔버스 scale: ESP32 DevKitC V4 + 5kg load cell + HX711.
// Reads the load cell, filters it exactly like lib/weight/filter.ts, and sends readings
// to the device-ingest Edge Function; runs tare / calibrate / reboot commands it gets back.
// Contract and wiring: docs/FIRMWARE_NOTES.md. Change both together.
//
// Arduino IDE: board "ESP32 Dev Module". Libraries: HX711 (Bogdan Necula),
// ArduinoJson 7.x (Benoit Blanchon); with LOCAL_WS also WebSockets (Markus Sattler).
// Serial monitor 115200: t = tare, c 510 = calibrate with 510g, p = print, r = reboot.

#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>

#include "HX711.h"
#include "secrets.h"

// Send to Supabase (needs internet). Turn off for a venue without internet + LOCAL_WS.
#ifndef USE_SUPABASE
#define USE_SUPABASE 1
#endif
// Also serve readings on ws://<ip>:81 for a page opened from http://localhost.
#ifndef LOCAL_WS
#define LOCAL_WS 0
#endif
#if LOCAL_WS
#include <WebSocketsServer.h>
#endif

// ---- Wiring (HX711 VCC → 3V3, never 5V) ----
constexpr int PIN_DT = 16;
constexpr int PIN_SCK = 4;

// ---- Shared with the web: lib/weight/constants.ts ----
constexpr int SAMPLE_HZ = 10;
constexpr int MEDIAN_WINDOW = 5;
constexpr int AVERAGE_WINDOW = 5;
constexpr uint32_t STABLE_WINDOW_MS = 1000;
constexpr float STABLE_BAND_G = 3;
constexpr float SEND_DELTA_G = 1;
constexpr uint32_t SEND_MIN_INTERVAL_MS = 250;
constexpr uint32_t SEND_MAX_INTERVAL_MS = 1000;

// ---- Device only ----
constexpr float DEFAULT_FACTOR = 420.0f;  // counts per gram until calibrated
constexpr int AVERAGE_FOR_CALIBRATION = 10;  // samples (1s at 10Hz)
constexpr long MIN_LOAD_COUNTS = 2000;  // less than this on calibrate = nothing on it
constexpr uint32_t COMMAND_POLL_MS = 1000;  // ask for commands when nothing was sent
constexpr uint32_t RETRY_MS = 2000;  // after a failed request
constexpr int32_t SENSOR_STALE_MS = 1000;  // no HX711 sample this long = sensor problem
// Longest a command may wait to run. Server commands carry their own remaining time
// (expiresInMs, counted from when the parent made them); this caps it and covers LOCAL_WS
// and serial. Always under the parent screen's 15s wait (COMMAND_WAIT_MS).
constexpr uint32_t COMMAND_EXPIRE_MS = 10000;
constexpr time_t CLOCK_VALID_AFTER = 1700000000;  // 2023-11: SNTP has set the clock
constexpr int SEEN_COMMANDS = 8;  // ids remembered so a re-sent command runs once

HX711 scale;
Preferences prefs;
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;

// Calibration (NVS "nyamnyam": factor, offset). Written only by the sensor task.
float factor = DEFAULT_FACTOR;
long offset = 0;

// ---------------------------------------------------------------------------------
// Filter: median of the last 5 raw grams → moving average of the last 5 medians.
// stable = the last 1s of filtered grams stays within ±3g, and 1s has passed.

struct Filter {
  float raws[MEDIAN_WINDOW];
  int rawCount = 0;
  float medians[AVERAGE_WINDOW];
  int medianCount = 0;
  struct Point {
    uint32_t t;
    float g;
  } history[SAMPLE_HZ * 3];
  int historyCount = 0;
  uint32_t startedAt = 0;
  bool started = false;

  void reset() {
    rawCount = medianCount = historyCount = 0;
    started = false;
  }

  static void push(float* xs, int& count, int cap, float v) {
    if (count == cap) {
      memmove(xs, xs + 1, sizeof(float) * (cap - 1));
      count--;
    }
    xs[count++] = v;
  }

  static float median(const float* xs, int n) {
    float s[MEDIAN_WINDOW];
    memcpy(s, xs, sizeof(float) * n);
    for (int i = 1; i < n; i++)  // insertion sort, n <= 5
      for (int j = i; j > 0 && s[j - 1] > s[j]; j--) {
        float tmp = s[j - 1];
        s[j - 1] = s[j];
        s[j] = tmp;
      }
    int m = n >> 1;
    return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  // Returns filtered grams; sets stable.
  float step(float raw, uint32_t t, bool& stable) {
    push(raws, rawCount, MEDIAN_WINDOW, raw);
    push(medians, medianCount, AVERAGE_WINDOW, median(raws, rawCount));
    float sum = 0;
    for (int i = 0; i < medianCount; i++) sum += medians[i];
    float grams = sum / medianCount;

    // Keep points newer than t - 1s (same as h.t > t - STABLE_WINDOW_MS), then add this one.
    int kept = 0;
    for (int i = 0; i < historyCount; i++)
      if ((int32_t)(history[i].t - (t - STABLE_WINDOW_MS)) > 0) history[kept++] = history[i];
    historyCount = kept;
    if (historyCount == (int)(sizeof(history) / sizeof(history[0]))) {
      memmove(history, history + 1, sizeof(Point) * (historyCount - 1));
      historyCount--;
    }
    history[historyCount++] = {t, grams};

    if (!started) {
      started = true;
      startedAt = t;
    }
    float lo = grams, hi = grams;
    for (int i = 0; i < historyCount; i++) {
      lo = fminf(lo, history[i].g);
      hi = fmaxf(hi, history[i].g);
    }
    stable = t - startedAt >= STABLE_WINDOW_MS && hi - lo <= 2 * STABLE_BAND_G;
    return grams;
  }
};

// ---------------------------------------------------------------------------------
// What the sensor task shares with the network loop (guarded by mux).

struct Latest {
  float grams = 0;
  float raw = 0;
  bool stable = false;
  uint32_t ts = 0;
  bool valid = false;
} latest;

// Where a command came from; its result goes back the same way only.
enum Origin : uint8_t { FROM_SERVER, FROM_LOCAL_WS, FROM_SERIAL };

struct Command {
  char id[40];
  char type[12];
  float knownGrams;
  Origin origin;
  uint32_t deadline;  // millis() after which it is dropped as "timeout"
};
struct Result {
  char id[40];
  bool ok;
  char error[16];
  bool hasCalibration;
  Origin origin;
};

QueueHandle_t commandQueue;  // network → sensor
QueueHandle_t resultQueue;   // sensor / network → network

float round1(float v) { return roundf(v * 10) / 10; }

void saveCalibration() {
  prefs.putFloat("factor", factor);
  prefs.putLong("offset", offset);
}

void makeResult(Result& r, const char* id, bool ok, const char* error, bool calibration) {
  r.origin = FROM_SERVER;
  strlcpy(r.id, id, sizeof(r.id));
  r.ok = ok;
  strlcpy(r.error, error, sizeof(r.error));
  r.hasCalibration = calibration;
}

// ---------------------------------------------------------------------------------
// Sensor task: 10Hz read → filter → latest. Runs tare / calibrate between samples.

long recentCounts[AVERAGE_FOR_CALIBRATION];
int recentCount = 0;

long averageCounts() {
  long long sum = 0;
  for (int i = 0; i < recentCount; i++) sum += recentCounts[i];
  return recentCount ? (long)(sum / recentCount) : 0;
}

void runCommand(const Command& c, Filter& filter, bool stable) {
  Result r;
  bool isTare = strcmp(c.type, "tare") == 0;
  bool isCalibrate = strcmp(c.type, "calibrate") == 0;
  if (!isTare && !isCalibrate) {
    makeResult(r, c.id, false, "bad_value", false);
  } else if (!stable || recentCount < AVERAGE_FOR_CALIBRATION) {
    makeResult(r, c.id, false, "unstable", false);
  } else if (isTare) {
    offset = averageCounts();
    saveCalibration();
    filter.reset();
    makeResult(r, c.id, true, "", true);
  } else if (!(c.knownGrams >= 10 && c.knownGrams <= 5000)) {
    makeResult(r, c.id, false, "bad_value", false);
  } else {
    long delta = averageCounts() - offset;
    if (labs(delta) < MIN_LOAD_COUNTS) {
      makeResult(r, c.id, false, "no_load", false);
    } else {
      factor = (float)delta / c.knownGrams;
      saveCalibration();
      filter.reset();
      makeResult(r, c.id, true, "", true);
    }
  }
  Serial.printf("[cmd] %s %s %s (factor %.3f, offset %ld)\n", c.type, r.ok ? "done" : "error",
                r.error, factor, offset);
  // Serial-monitor commands have no one waiting for a result.
  r.origin = c.origin;
  if (c.origin != FROM_SERIAL) xQueueSend(resultQueue, &r, 0);
}

void failCommand(const Command& c, const char* code) {
  Result r;
  makeResult(r, c.id, false, code, false);
  r.origin = c.origin;
  Serial.printf("[cmd] %s error %s\n", c.type, code);
  if (c.origin != FROM_SERIAL) xQueueSend(resultQueue, &r, 0);
}

// One HX711 sample through the filter into latest.
void sample(Filter& filter, bool& stable) {
  long counts = scale.read();
  if (recentCount == AVERAGE_FOR_CALIBRATION) {
    memmove(recentCounts, recentCounts + 1, sizeof(long) * (recentCount - 1));
    recentCount--;
  }
  recentCounts[recentCount++] = counts;

  uint32_t now = millis();
  float raw = (counts - offset) / factor;
  float grams = filter.step(raw, now, stable);
  portENTER_CRITICAL(&mux);
  latest = {grams, raw, stable, now, true};
  portEXIT_CRITICAL(&mux);
}

void sensorTask(void*) {
  Filter filter;
  bool stable = false;
  uint32_t lastSampleAt = 0;
  bool sampledOnce = false;
  TickType_t wake = xTaskGetTickCount();
  for (;;) {
    vTaskDelayUntil(&wake, pdMS_TO_TICKS(1000 / SAMPLE_HZ));
    if (scale.wait_ready_timeout(1000 / SAMPLE_HZ)) {
      if (sampledOnce && (int32_t)(millis() - lastSampleAt) > SENSOR_STALE_MS) {
        // Back after a gap: start measuring afresh, nothing from before the gap counts.
        filter.reset();
        recentCount = 0;
        stable = false;
      }
      sample(filter, stable);
      lastSampleAt = millis();
      sampledOnce = true;
    }

    // Commands are answered even while the sensor is silent, so none waits forever.
    Command c;
    if (xQueueReceive(commandQueue, &c, 0) != pdTRUE) continue;
    if ((int32_t)(millis() - c.deadline) > 0) {
      failCommand(c, "timeout");
    } else if (!sampledOnce || (int32_t)(millis() - lastSampleAt) > SENSOR_STALE_MS) {
      failCommand(c, "no_sensor");
    } else {
      runCommand(c, filter, stable);
      if (strcmp(c.type, "tare") == 0 || strcmp(c.type, "calibrate") == 0) {
        recentCount = 0;  // old counts belong to the old calibration
        stable = false;
      }
    }
  }
}

// ---------------------------------------------------------------------------------
// Network: decide when to send (shouldTransmit in lib/weight/filter.ts), talk to the
// Edge Functions, hand commands to the sensor task, report results.

WiFiClientSecure tls;
HTTPClient http;
uint32_t seq = 0;  // starts over on every boot; the web treats that as a restart
struct {
  uint32_t at;
  float grams;
  bool stable;
  bool any = false;
} lastSent;
uint32_t lastPoll = 0;
uint32_t retryAfter = 0;
bool retrying = false;  // retryAfter only means something while this is set
char seenIds[SEEN_COMMANDS][40];
int seenNext = 0;
bool rebootAfterReport = false;

bool shouldTransmit(uint32_t now, float grams, bool stable) {
  if (!lastSent.any) return true;
  uint32_t since = now - lastSent.at;
  if (since < SEND_MIN_INTERVAL_MS) return false;
  return since >= SEND_MAX_INTERVAL_MS || fabsf(grams - lastSent.grams) >= SEND_DELTA_G ||
         stable != lastSent.stable;
}

bool seen(const char* id) {
  for (int i = 0; i < SEEN_COMMANDS; i++)
    if (strcmp(seenIds[i], id) == 0) return true;
  return false;
}

void remember(const char* id) {
  strlcpy(seenIds[seenNext], id, sizeof(seenIds[0]));
  seenNext = (seenNext + 1) % SEEN_COMMANDS;
}

// One command from the server or LOCAL_WS: {"id": "...", "type": "tare"|"calibrate"|"reboot",
// "knownGrams": 510, "expiresInMs": 9000}. Reboot is reported first, then the board restarts.
// An id is remembered only once the command is queued, so a re-sent one is run once and
// one that didn't fit in the queue is taken again from the server's next reply.
// base: millis() when the request that brought it was sent, so the time the reply took
// counts against expiresInMs (the server measured it from no earlier than that).
void acceptCommand(JsonObjectConst cmd, Origin origin, uint32_t base) {
  const char* id = cmd["id"] | "";
  const char* type = cmd["type"] | "";
  if (!*id || seen(id)) return;
  uint32_t expiresIn = cmd["expiresInMs"] | COMMAND_EXPIRE_MS;
  if (expiresIn > COMMAND_EXPIRE_MS) expiresIn = COMMAND_EXPIRE_MS;
  Serial.printf("[cmd] got %s (%s)\n", type, id);
  if (strcmp(type, "reboot") == 0) {
    // Same expiry as the others: a reboot the parent screen gave up on never happens.
    bool expired = (int32_t)(millis() - (base + expiresIn)) > 0;
    Result r;
    makeResult(r, id, !expired, expired ? "timeout" : "", false);
    r.origin = origin;
    if (xQueueSend(resultQueue, &r, 0) != pdTRUE) return;
    remember(id);
    if (!expired) rebootAfterReport = true;
    return;
  }
  Command c;
  strlcpy(c.id, id, sizeof(c.id));
  strlcpy(c.type, type, sizeof(c.type));
  c.knownGrams = cmd["knownGrams"] | 0.0f;
  c.origin = origin;
  c.deadline = base + expiresIn;
  if (xQueueSend(commandQueue, &c, 0) == pdTRUE) {
    remember(id);
  } else if (origin == FROM_LOCAL_WS) {
    Result r;  // no second delivery on this path, so say so now
    makeResult(r, id, false, "busy", false);
    r.origin = origin;
    xQueueSend(resultQueue, &r, 0);
  }
}

void addResultJson(JsonObject o, const Result& r) {
  o["id"] = r.id;
  o["status"] = r.ok ? "done" : "error";
  if (!r.ok) o["error"] = r.error;
  if (r.ok && r.hasCalibration) {
    o["calibrationFactor"] = factor;
    o["tareOffset"] = offset;
  }
}

#if LOCAL_WS
WebSocketsServer ws(81);

void onWsEvent(uint8_t client, WStype_t type, uint8_t* payload, size_t length) {
  if (type != WStype_TEXT) return;
  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) return;
  acceptCommand(doc.as<JsonObjectConst>(), FROM_LOCAL_WS, millis());
}
#endif

#if USE_SUPABASE
// POST JSON; on 200 hands any "commands" in the reply to acceptCommand.
bool post(const char* path, JsonDocument& body) {
  String url = String(FUNCTIONS_URL) + path;
  String payload;
  serializeJson(body, payload);
  if (!http.begin(tls, url)) return false;
  http.addHeader("Content-Type", "application/json");
  uint32_t sentAt = millis();
  int code = http.POST(payload);
  bool ok = code == 200;
  if (ok) {
    JsonDocument reply;
    if (!deserializeJson(reply, http.getString()))
      for (JsonObjectConst c : reply["commands"].as<JsonArrayConst>()) acceptCommand(c, FROM_SERVER, sentAt);
  } else {
    // 401 = wrong DEVICE_ID/DEVICE_KEY, 400 = bad field (see "field"), <0 = network.
    Serial.printf("[http] %s → %d %s\n", path, code, code > 0 ? http.getString().c_str() : "");
  }
  http.end();
  return ok;
}
#endif

void sendReading(float grams, float raw, bool stable, uint32_t ts) {
  JsonDocument doc;
  JsonObject r = doc["reading"].to<JsonObject>();
  r["grams"] = round1(grams);
  r["raw"] = round1(raw);
  r["stable"] = stable;
  r["seq"] = ++seq;
  r["ts"] = ts;
#if LOCAL_WS
  String text;
  serializeJson(r, text);
  ws.broadcastTXT(text);
#endif
#if USE_SUPABASE
  doc["device_id"] = DEVICE_ID;
  doc["device_key"] = DEVICE_KEY;
  if (!post("/device-ingest", doc)) {
    retryAfter = millis() + RETRY_MS;
    retrying = true;
  }
#endif
}

void reportResults() {
  Result r;
  Result toServer[10];
  int n = 0;
  JsonDocument doc;
  JsonArray list = doc["results"].to<JsonArray>();
  while (n < 10 && xQueueReceive(resultQueue, &r, 0) == pdTRUE) {
    if (r.origin == FROM_LOCAL_WS) {
#if LOCAL_WS
      JsonDocument one;
      addResultJson(one["result"].to<JsonObject>(), r);
      String text;
      serializeJson(one, text);
      ws.broadcastTXT(text);
#endif
      continue;
    }
    toServer[n++] = r;
    addResultJson(list.add<JsonObject>(), r);
  }
#if USE_SUPABASE
  doc["device_id"] = DEVICE_ID;
  doc["device_key"] = DEVICE_KEY;
  bool ok = post("/device-commands", doc);
  lastPoll = millis();
  if (!ok) {
    // Not delivered: the server re-sends the command (still pending) and seen()
    // drops it, so put the results back to try again.
    for (int i = n - 1; i >= 0; i--) xQueueSendToFront(resultQueue, &toServer[i], 0);
    retryAfter = lastPoll + RETRY_MS;
    retrying = true;
  }
#endif
}

// ---------------------------------------------------------------------------------
// Serial commands for bench testing without the web.

void serialCommands() {
  static String line;
  while (Serial.available()) {
    char ch = Serial.read();
    if (ch != '\n' && ch != '\r') {
      line += ch;
      continue;
    }
    line.trim();
    if (!line.length()) continue;
    Command c = {};
    snprintf(c.id, sizeof(c.id), "serial-%lu", (unsigned long)millis());
    c.origin = FROM_SERIAL;
    c.deadline = millis() + COMMAND_EXPIRE_MS;
    if (line == "t") {
      strlcpy(c.type, "tare", sizeof(c.type));
      xQueueSend(commandQueue, &c, 0);
    } else if (line.startsWith("c ")) {
      strlcpy(c.type, "calibrate", sizeof(c.type));
      c.knownGrams = line.substring(2).toFloat();
      xQueueSend(commandQueue, &c, 0);
    } else if (line == "r") {
      ESP.restart();
    } else if (line == "p") {
      portENTER_CRITICAL(&mux);
      Latest l = latest;
      portEXIT_CRITICAL(&mux);
      Serial.printf("grams %.1f raw %.1f stable %d | factor %.3f offset %ld | wifi %d\n", l.grams,
                    l.raw, l.stable, factor, offset, WiFi.status() == WL_CONNECTED);
    } else {
      Serial.println("t = tare, c <g> = calibrate, p = print, r = reboot");
    }
    line = "";
  }
}

// ---------------------------------------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.printf("\nnyamnyam scale %s\n", DEVICE_ID);

  prefs.begin("nyamnyam", false);
  factor = prefs.getFloat("factor", DEFAULT_FACTOR);
  bool hasOffset = prefs.isKey("offset");
  offset = prefs.getLong("offset", 0);

  scale.begin(PIN_DT, PIN_SCK);
  if (!hasOffset) {
    // First boot: zero on whatever is there (should be the empty scale). Every sample
    // has a timeout, so a sensor that stops answering can't hang the boot.
    long long sum = 0;
    int n = 0;
    while (n < AVERAGE_FOR_CALIBRATION && scale.wait_ready_timeout(500)) {
      sum += scale.read();
      n++;
    }
    if (n == AVERAGE_FOR_CALIBRATION) {
      offset = (long)(sum / n);
      saveCalibration();
      Serial.println("first boot: tared on the empty scale");
    } else {
      Serial.println("first boot: HX711 not answering, tare later (t or the parent screen)");
    }
  }
  Serial.printf("factor %.3f offset %ld\n", factor, offset);

  commandQueue = xQueueCreate(8, sizeof(Command));  // server hands out up to 5 at once
  resultQueue = xQueueCreate(12, sizeof(Result));
  xTaskCreatePinnedToCore(sensorTask, "sensor", 4096, nullptr, 2, nullptr, 1);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

#if USE_SUPABASE
  if (strlen(SUPABASE_ROOT_CA)) {
    tls.setCACert(SUPABASE_ROOT_CA);
    // Certificate dates can only be checked once the clock is set (see loop).
    configTime(0, 0, "pool.ntp.org", "time.google.com");
  } else {
    tls.setInsecure();
  }
  http.setReuse(true);  // keep the TLS connection between requests
  http.setTimeout(5000);
#endif
#if LOCAL_WS
  ws.begin();
  ws.onEvent(onWsEvent);
#endif
}

void loop() {
  serialCommands();
#if LOCAL_WS
  ws.loop();
#endif
  if (WiFi.status() != WL_CONNECTED) {
    delay(50);
    return;
  }
  static bool announced = false;
  if (!announced) {
    announced = true;
    Serial.printf("wifi %s, ip %s\n", WIFI_SSID, WiFi.localIP().toString().c_str());
  }

#if USE_SUPABASE
  if (strlen(SUPABASE_ROOT_CA) && time(nullptr) < CLOCK_VALID_AFTER) {
    static uint32_t waitingSince = millis();
    static bool warned = false;
    if (!warned && millis() - waitingSince > 10000) {
      warned = true;
      Serial.println("waiting for SNTP time before verified TLS…");
    }
    delay(50);
    return;
  }
#endif

  uint32_t now = millis();
  if (retrying) {
    if ((int32_t)(now - retryAfter) < 0) {
      delay(10);
      return;
    }
    retrying = false;
  }

  if (uxQueueMessagesWaiting(resultQueue)) {
    reportResults();
  } else if (rebootAfterReport) {
    delay(200);
    ESP.restart();
  }

  portENTER_CRITICAL(&mux);
  Latest l = latest;
  portEXIT_CRITICAL(&mux);
  now = millis();
  // A sensor that stopped answering must not look alive: send nothing, so the web
  // shows the scale offline. Commands are still polled below.
  bool fresh = l.valid && (int32_t)(now - l.ts) <= SENSOR_STALE_MS;
  static uint32_t staleWarnedAt = 0;
  if (l.valid && !fresh && now - staleWarnedAt > 5000) {
    staleWarnedAt = now;
    Serial.println("HX711 not answering: check DT/SCK/VCC wiring");
  }
  if (fresh && shouldTransmit(now, l.grams, l.stable)) {
    lastSent = {now, l.grams, l.stable, true};
    sendReading(l.grams, l.raw, l.stable, l.ts);
    lastPoll = millis();
  }
#if USE_SUPABASE
  else if (now - lastPoll >= COMMAND_POLL_MS) {
    reportResults();  // nothing to report = a plain poll
  }
#endif
  delay(10);
}
