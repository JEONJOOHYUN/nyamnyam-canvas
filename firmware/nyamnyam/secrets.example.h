// Copy to secrets.h (git ignores it) and fill in.
// DEVICE_ID / DEVICE_KEY / FUNCTIONS_URL: parent screen > 저울 > 저울 등록하기 shows
// these three lines once; paste them over the empty ones below.
#pragma once

// 2.4GHz Wi-Fi only (ESP32 can't join 5GHz).
#define WIFI_SSID ""
#define WIFI_PASSWORD ""

#define DEVICE_ID ""
#define DEVICE_KEY ""
#define FUNCTIONS_URL ""  // https://<project>.supabase.co/functions/v1

// Optional: PEM root certificate of <project>.supabase.co, to check the server.
// Left empty, TLS is encrypted but the server isn't verified (fine for the demo,
// see docs/FIRMWARE_NOTES.md §3).
#define SUPABASE_ROOT_CA ""
