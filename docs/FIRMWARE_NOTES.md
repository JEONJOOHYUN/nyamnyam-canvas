# FIRMWARE_NOTES — 부품 코드 작성 시 참고사항

> 웹에서 기기와 관련된 부분(타입, API, 명령, 필터 기준, 상태 머신)을 바꾸면 이 파일도 같이 고친다.
> 펌웨어: `firmware/nyamnyam/nyamnyam.ino` (2026-10-16 7단계 작성). 부품이 아직 없어 **실기기·컴파일 확인 전**이다(이 PC 에 Arduino IDE·arduino-cli 없음). 부품이 오면 §7 순서로 확인하고 이 문서를 고친다.

## 1. 하드웨어 사양과 배선

| 부품          | 모델                                                  | 비고                                                                          |
| ------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| 보드          | ESP32 DevKitC V4 (ESP32-WROOM-32E), USB-C             | Wi-Fi 2.4GHz만 지원                                                           |
| 무게센서      | (주)우정하이텍 로드셀 5kg, 4선식 Full Bridge, Al Beam | 선 색은 제품 SPEC표 확인 필요 (일반적으로 빨강 E+, 검정 E−, 초록 A+, 하양 A−) |
| 앰프          | 키트128 WAT-HX711 (핀 납땜됨), 2.6~5.5V               | 핀 순서 VCC·SCK·DT·GND (인쇄된 글자 기준)                                     |
| 전원          | 보조배터리 또는 5V 충전기 (USB-C)                     | 시연용                                                                        |
| 물리 버튼·LED | 없음                                                  | 영점은 화면 버튼으로                                                          |

| HX711 | ESP32             |
| ----- | ----------------- |
| VCC   | **3V3** (5V 금지) |
| GND   | GND               |
| DT    | **GPIO16**        |
| SCK   | **GPIO4**         |

## 2. 데이터 계약 — `WeightReading`

웹 `lib/weight/types.ts` 와 이름·단위·의미가 완전히 같아야 한다.

```json
{ "grams": 312.4, "raw": 314.1, "stable": true, "seq": 1024, "ts": 5234123 }
```

| 필드   | 타입    | 단위 | 의미                                   |
| ------ | ------- | ---- | -------------------------------------- |
| grams  | number  | g    | 필터 적용, 영점 기준 순 무게           |
| raw    | number  | g    | 필터 전 값을 g로 환산 (디버그용)       |
| stable | boolean | —    | 최근 1초 변동폭이 임계값 이하          |
| seq    | number  | —    | 증가하는 일련번호. 뒤로 가면 웹이 무시 |
| ts     | number  | ms   | ESP32 `millis()` 또는 epoch ms         |

- **영점은 빈 저울(식판 없음)에서 잡는다.** 그래서 `grams` 에는 식판 무게가 포함되고, 식판을 들면 0g 근처가 된다. 웹은 빈 식판 무게를 따로 재서 음식 무게를 구한다(`lib/meal/machine.ts`).
- `ts` 는 웹에서 시간 간격(3초 유지, 2초 비정상 판단) 계산에 쓴다. 한 기기 안에서 단조 증가하면 된다.
- **재부팅(2026-10-16 결정)**: 펌웨어는 부팅마다 `seq` 를 1부터, `ts` 를 `millis()` 로 다시 시작한다(NVS 부팅 카운터·NTP 없음). 웹(`lib/weight/guard.ts`)은 seq 가 같거나 작으면 버리되, **2초(`RESTART_SILENCE_MS`) 이상 조용했다가** 작은 seq 가 오면 재부팅으로 보고 받아들이고 `ts` 를 이어 붙인다(시간이 뒤로 가지 않음). 재부팅은 Wi-Fi·TLS 연결만 해도 2초를 넘는다.
- `ts` 는 웹에 넘기기 전에 뒤로 가지 않게 고정된다. 펌웨어는 한 부팅 안에서 단조 증가만 지키면 된다.

## 3. Edge Function API

ESP32 는 anon key 를 쓰지 않는다. `device_id + device_key` 로 아래 두 함수만 부른다(JWT 검사 끔 — `supabase/config.toml`).
함수 코드: `supabase/functions/{device-ingest,device-commands}/index.ts`, 공통 처리(검증·인증·응답) `supabase/functions/_shared/device.ts`(Vitest `device.test.ts`).
DB: `supabase/migrations/0003_devices.sql` (`devices`, `device_state`, `device_commands`).

- 주소: `<FUNCTIONS_URL>/device-ingest`, `<FUNCTIONS_URL>/device-commands` (`FUNCTIONS_URL` = `https://<project>.supabase.co/functions/v1`)
- 메서드 `POST`, 헤더 `Content-Type: application/json`. 다른 헤더(apikey, Authorization) 없음.
- 기기 등록: 부모 화면 > 저울 > 저울 등록하기. `DEVICE_ID`(`nyam-` + 6자), `DEVICE_KEY`(16진수 48자)를 **한 번만** 보여 준다. DB 에는 키의 SHA-256 만 저장.

### 3-1. `device-ingest` — 무게 보내기 (+ 대기 중인 명령 받기)

```json
{
  "device_id": "nyam-abc123",
  "device_key": "<48 hex>",
  "reading": { "grams": 312.4, "raw": 314.1, "stable": true, "seq": 1024, "ts": 5234123 }
}
```

응답 200:

```json
{ "ok": true, "commands": [{ "id": "<uuid>", "type": "calibrate", "knownGrams": 510, "expiresInMs": 11400 }] }
```

- 받은 `reading` 을 `device_state` 에 덮어쓴다(upsert). 웹 아이 화면은 이 행을 Realtime 으로 구독한다.
- `commands` 는 아직 처리 안 된(`pending`) 명령 중 **12초 안에 만든 것**만, 오래된 순서로 최대 5개. 처리 결과를 보고할 때까지 매 응답에 다시 들어 있으므로 펌웨어는 **id 로 중복 실행을 막는다**(최근 8개 기억, 큐에 넣은 뒤에만 기억 — 큐가 차서 못 넣은 명령은 다음 응답에서 다시 받음).
- `expiresInMs`: 명령을 만든 때부터 12초까지 남은 시간. 펌웨어는 **그 요청을 보낸 시각부터** 이 시간(최대 10초) 안에 실행하지 못하면 `timeout` 으로 버린다 → 네트워크가 늦어도 부모 화면이 포기한 뒤에 영점이 바뀌지 않는다.
- 전송 규칙(§6) 덕분에 무게가 그대로여도 1초마다 보내므로, 이 응답이 곧 1초 명령 polling 이다.

### 3-2. `device-commands` — 명령 결과 보고 (+ 대기 중인 명령 받기)

```json
{
  "device_id": "nyam-abc123",
  "device_key": "<48 hex>",
  "results": [
    { "id": "<uuid>", "status": "done", "calibrationFactor": 421.5, "tareOffset": 8123456 },
    { "id": "<uuid>", "status": "error", "error": "unstable" }
  ]
}
```

- 응답은 3-1 과 같다(`{ ok, commands }`). `results` 를 빼면 단순 polling(무게를 1초 넘게 안 보냈을 때).
- `results` 는 한 번에 최대 10개, `id` 는 명령의 uuid. 하나라도 형식이 틀리면 아무것도 저장하지 않고 400.
- `done` 에 `calibrationFactor`·`tareOffset` 이 있으면 `devices` 에도 저장(부모 화면 "보정함" 표시용, 기기 NVS 가 원본).

### 3-3. 에러 응답

| HTTP | body | 뜻 |
| --- | --- | --- |
| 400 | `{"ok":false,"error":"bad_json"}` | JSON 이 아님 |
| 400 | `{"ok":false,"error":"bad_request","field":"reading.seq"}` | 필드 이름·타입·범위가 틀림(`field` 가 어느 것인지) |
| 401 | `{"ok":false,"error":"unauthorized"}` | 없는 기기이거나 키가 틀림(둘을 구분하지 않음) |
| 405 | `{"ok":false,"error":"method_not_allowed"}` | POST 가 아님 |
| 500 | `{"ok":false,"error":"server_error"}` | 서버 문제(자세한 내용은 함수 로그) |

값 범위: `grams` −10000~10000, `raw` −100000~100000, `seq`·`ts` 0 이상 정수, `stable` true/false.

### 3-4. TLS

`secrets.h` 의 `SUPABASE_ROOT_CA` 에 PEM 을 넣으면 서버 인증서를 검사하고, 비워 두면 `setInsecure()`(암호화는 되지만 서버 확인 안 함 — 시연용). PEM 을 넣으면 인증서 유효기간을 확인하려고 **SNTP 로 시계를 맞출 때까지 전송을 기다린다**(`pool.ntp.org`, 10초 넘으면 시리얼 안내). 같은 연결을 계속 쓴다(`http.setReuse(true)`) — 매번 새로 연결하면 ESP32 TLS 연결에 1초 가까이 걸린다.

## 4. 명령 목록

웹 타입 `DeviceCommand` (`lib/weight/types.ts`), DB `device_commands.payload` 도 같은 이름(`knownGrams`).

| type | 하는 일 | 실패 코드 |
| --- | --- | --- |
| `tare` | 최근 10개 HX711 값 평균을 영점(offset)으로, NVS 저장, 필터 초기화 | `unstable`(안정 아님 또는 측정 1초 미만) |
| `calibrate` (`knownGrams` 10~5000) | factor = (최근 10개 평균 − offset) ÷ knownGrams, NVS 저장, 필터 초기화 | `unstable`, `no_load`(변화 2000 counts 미만), `bad_value` |
| `reboot` | 결과(`done`)를 먼저 보고하고 재시작 | — |
| (모든 명령) | `expiresInMs`(최대 10초, `COMMAND_EXPIRE_MS`) 안에 실행 못 하면 버림 / HX711 이 1초 넘게 값을 안 주면 실행 안 함 / LOCAL_WS 명령이 큐에 안 들어가면 | `timeout`, `no_sensor`, `busy` |

- 부모 화면은 명령을 넣고 1초마다 결과를 확인하며 **15초**까지 기다린다(`COMMAND_WAIT_MS`). 서버는 12초 지난 명령을 기기에 주지 않는다 → 저울이 늦게 켜져도 식사 중에 갑자기 영점을 잡지 않는다.
- 만료는 명령을 만든 시각 기준 12초 하나로 이어진다: 서버는 그 안의 명령만 주고 남은 시간을 `expiresInMs` 로 알려 주며, 기기는 그 시각이 지나면 실행하지 않는다. 웹은 15초 기다린다.
- HX711 이 1초 넘게 끊겼다가 돌아오면 필터·평균 버퍼를 비우고 처음부터 잰다(끊기기 전 값이 영점·보정에 섞이지 않게).
- 웹은 연결 후 3초 안에 첫 무게가 안 오면 바로 offline 으로 본다(꺼진 저울을 골랐을 때 "찾는 중"에 머물지 않게).
- 웹이 보여 주는 실패 문구: `lib/weight/remote.ts` `COMMAND_ERRORS`. 코드를 새로 만들면 여기도 추가.
- 결과는 명령이 온 길로만 돌아간다: 서버 명령 → `device-commands`, LOCAL_WS 명령 → WebSocket `{"result": {...}}`, 시리얼 명령(`t`, `c 510`) → 시리얼 출력만.

## 5. 필터와 안정 판단 기준값 (웹·펌웨어 공유)

웹 원본: `lib/weight/constants.ts`, 같은 파이프라인 구현: `lib/weight/filter.ts` (시뮬레이터가 이걸로 실제 기기를 흉내 낸다). 펌웨어는 이 순서와 값을 그대로 옮긴다.

| 상수               | 값   | 뜻                                                                                        |
| ------------------ | ---- | ----------------------------------------------------------------------------------------- |
| `SAMPLE_HZ`        | 10   | HX711 읽기 주기 (WAT-HX711 기본 10Hz, RATE 핀으로 80Hz 가능)                              |
| `MEDIAN_WINDOW`    | 5    | 최근 5개 raw 의 중앙값                                                                    |
| `AVERAGE_WINDOW`   | 5    | 최근 5개 중앙값의 이동평균 = `grams`                                                      |
| `STABLE_WINDOW_MS` | 1000 | 안정 판단 구간                                                                            |
| `STABLE_BAND_G`    | 3    | 최근 1초 `grams` 의 최대−최소 ≤ 6g(±3g) 이면 `stable`. 측정 시작 후 1초 전에는 항상 false |
| 보정값 저장        | —    | NVS(Preferences): calibration factor, tare offset                                         |

## 6. 전송 주기와 타임아웃

- 전송 조건(`shouldTransmit`): 마지막 전송 후 250ms 이상 지났고, 그중 ① `grams` 가 1g 이상 변함 ② `stable` 이 바뀜 ③ 1초 경과 중 하나 (`SEND_DELTA_G`=1, `SEND_MIN_INTERVAL_MS`=250, `SEND_MAX_INTERVAL_MS`=1000)
- 명령 polling 1초
- 웹은 3초 이상 업데이트가 없으면 `offline` (`OFFLINE_AFTER_MS`)
- HX711 이 1초 넘게 값을 주지 않으면 펌웨어는 **무게를 보내지 않는다**(마지막 값을 새 seq 로 다시 보내지 않음) → 웹은 3초 뒤 offline. 시리얼에 배선 확인 안내. 명령 polling 은 계속.
- `grams`·`raw` 는 소수 첫째 자리까지 보내면 충분하다

## 7. 테스트 절차 (부품이 오면)

1. **Supabase 준비(한 번)** — 2026-10-17 완료(0003 실행, 두 함수 배포·JWT 검사 끔). 다시 할 때: SQL 편집기에서 `supabase/migrations/0003_devices.sql` 실행 → `npx supabase login` → `npx supabase functions deploy device-ingest --project-ref <ref> --no-verify-jwt`, `device-commands` 도 같이(또는 대시보드 편집기에 세 파일을 한 폴더로, import 는 `./`).
2. **기기 등록**: 부모 화면 > 저울 > 저울 등록하기 → 보이는 세 줄을 `firmware/nyamnyam/secrets.h` 에(`secrets.example.h` 복사), Wi-Fi 이름·비밀번호도.
3. **업로드**: Arduino IDE, 보드 "ESP32 Dev Module", 라이브러리 HX711(Bogdan Necula)·ArduinoJson 7.x. 시리얼 115200.
4. **시리얼 확인**: 부팅 메시지 → `p` 로 무게·안정·Wi-Fi 확인. 처음 부팅은 저울 위를 비운 채로(빈 저울에서 영점 자동).
5. **보정**: 부모 화면 > 저울 > 보정하기(빈 저울 영점 → 500ml 생수 510g 보정 → 한 번 내렸다가 다시 올려 ±5g, 보정 뒤에 새로 잰 값만 인정). 시리얼만으로는 `t` → 물건 올리고 `c 510`.
6. **웹 연결**: 부모 화면 "이 화면은 어떤 저울을 쓸까요?"에서 저울 고르기 → 아이 화면 왼쪽 위가 "저울 연결됨", 전원을 뽑으면 3초 뒤 "저울을 기다리고 있어요", 다시 꽂으면 이어서.
7. **인터넷 없는 시연장(선택)**: `#define USE_SUPABASE 0`, `#define LOCAL_WS 1`(WebSockets 라이브러리) → 시리얼에 나온 IP 로 `ws://<ip>:81` 을 부모 화면에서 고른다. **http://localhost 로 연 화면에서만** 된다(https 페이지는 ws:// 를 막음).

**부품 없이 실제 경로 확인**: `FAKE_SCALE_ID=<id> FAKE_SCALE_KEY=<key> node scripts/fake-scale.mjs` — 펌웨어처럼 `device-ingest` 로 무게를 보내고 명령에 `done` 으로 답한다(그램 입력 + Enter, `r` 재부팅, `q` 종료). 2026-10-17 이 방법으로 실제 Supabase 에서 Realtime·영점·보정·last_seen·offline 표시까지 확인.

## 8. 자주 하는 실수

- HX711을 5V에 연결
- 5GHz Wi-Fi에 연결 시도
- 충전 전용 USB 케이블 사용
- 로드셀 화살표 방향 반대
- 상판이 케이스에 닿음
- 로드셀 흰 부분(게이지) 누름

## 9. 변경 이력

| 날짜       | 바뀐 내용                                                                                                                | 펌웨어에서 고칠 것                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 2026-10-14 | 문서 뼈대 작성 (SPEC 기준 초안)                                                                                          | 없음 (펌웨어 미작성)                                              |
| 2026-10-16 | 7단계: Edge Function `device-ingest`·`device-commands` 계약(§3), 명령 결과·실패 코드(§4), 재부팅 시 seq·ts 처리(웹이 2초 침묵 뒤 작은 seq 를 재부팅으로 받음, §2), 펌웨어 작성, 테스트 절차(§7) | 펌웨어 새로 작성됨 — 실기기에서 §7 확인 |
| 2026-10-16 | 위 손에 든 음식 처리를 되돌림(졸업 프로젝트 범위에서 제외). 상태 머신은 다시 "안정값 감소 = 먹은 양" + 리필·쏟음 판단만 | 없음 |
| 2026-10-16 | 식사 상태 머신(웹): 손으로 들고 먹는 음식 처리 — 2초 안 30g 이상 감소는 보류(`heldG`), 다시 올려놓으면 차이만 먹은 양, 60초 뒤 자동 인정(`lib/meal/machine.ts` `HAND_*`, `RETURN_WINDOW_MS`) | 없음. 펌웨어는 지금처럼 안정값·`stable` 만 보내면 된다(판단은 웹) |
| 2026-10-14 | 2단계: `WeightReading`·`DeviceCommand` 타입, 공유 상수, 필터·전송 규칙 확정(`lib/weight/`). 영점은 빈 저울 기준으로 결정 | 펌웨어 작성 시 §2·§4·§5·§6 그대로 구현. seq 재부팅 문제 결정 필요 |
