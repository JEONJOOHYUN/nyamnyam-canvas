# HANDOFF — 냠냠캔버스 (nyamnyam-canvas)

## 마지막 업데이트: 2026-10-17

## 저장소: https://github.com/JEONJOOHYUN/nyamnyam-canvas · 브랜치: dev · 마지막 커밋: `git log -1`

> 지금 상태·다음 할 일·결정·함정만 둔다. 지난 과정(시안 버전별, 리뷰 회차별 지적, 음성 후보 선정)은 [docs/HISTORY.md](docs/HISTORY.md).
> 원본 요구사항 [docs/SPEC.md](docs/SPEC.md), 기기 계약 [docs/FIRMWARE_NOTES.md](docs/FIRMWARE_NOTES.md).

## 현재 상태 (2026-10-17)

- **1~7단계 완료, 모두 `dev` push. 작업 트리 깨끗, 진행 중인 일 없음.** 다음은 8단계(아래 "다음 할 일" 1번).
- 1 세팅 · 2 무게 엔진(필터·시뮬레이터·식사 상태 머신) · 3 아이 화면 MVP · 4 반응형(6기기 e2e) · 정원 재설계(`GardenScene`)
- 5 테마 3종(바람 우체국·바다 왕국·우주 외계인 마을) + 캐릭터 3종(냠냠이·퐁당이 아기 해달·반짝이 누나 별) + "누구랑 먹을까 → 어디로 갈까" 시작 화면 + 캐릭터·테마별 대사
- 6 부모 설정 `/parent`(Supabase Auth·PIN·아이·설정·식사 기록, 완성 방식 A/B/C, 시안 A "놀이 친구" + Paperlogy) + 식사 저장(DB 함수 `save_meal`) + ElevenLabs 음성 111개
- 7 기기 연동 준비: DB 0003(devices·device_state·device_commands), Edge Function `device-ingest`·`device-commands`, `SupabaseRealtimeSource`·`LocalWebSocketSource`, 부모 화면 "저울" 탭(등록·이 화면이 쓸 저울·보정 마법사), 펌웨어 `firmware/nyamnyam/nyamnyam.ino`(컴파일·실기기 확인 전)
- Supabase 에 0001~0003 적용, Edge Function 2개 배포 완료. Vercel 환경변수(Supabase) 추가, dev Preview `/parent` 로그인 화면 확인.
- 검증 기준(2026-10-17): lint·typecheck·test 145·e2e 12 통과.

## 다음 할 일 (우선순위 순)

1. **8단계 마무리 — 부품 없이 가능. 사용자가 "진행해" 하면 이것부터.** SPEC §11 8번:
   ① ~~시연 모드~~ **2026-10-17 완료**: `/demo` = `<PlayScreen demo />` — Supabase 를 전혀 부르지 않음(설정·저장 없음, e2e 로 요청 0건 확인), 무게는 항상 시뮬레이터, 시뮬레이터 패널은 Production 에서도 보임, 왼쪽 위 "시연 모드". 홈에 "저울 없이 체험해 보기"·"보호자 설정" 링크.
   ② ~~PWA·Wake Lock·전체화면~~ **2026-10-17 완료**: `app/manifest.ts`(start_url `/` — 설치 앱엔 주소창이 없어 보호자 화면으로 갈 길이 필요, display fullscreen, 아이콘 192·512·maskable), `layout.tsx` apple-touch-icon·appleWebApp·theme-color(운영 빌드에서 태그 확인 — 켜 둔 개발 서버는 layout 메타데이터를 다시 안 읽어 안 보였음), 아이콘은 `/design/icon`(개발·Preview 전용)을 `node scripts/make-icons.mjs` 로 찍어 `public/icons/`. `lib/screen.ts` `useWakeLock`(테마를 고른 뒤부터, 화면 숨김 뒤 다시 요청), 시작 화면 오른쪽 위 전체화면 버튼(지원·아직 전체화면 아님·설치 앱 아님일 때만). 서비스 워커 없음.
   ③ 접근성·성능 점검 — **2026-10-17 1차 완료**(운영 빌드 + Lighthouse 12.6 `npx -y lighthouse@12.6.0 <url> --chrome-flags="--headless=new"`, CHROME_PATH=Playwright chromium): 휴대폰 성능 홈 56→91, `/demo` 56→83(원인: 1.4MB D2Coding 이 아이 화면 상태 칩 하나 때문에 내려받아짐 → 아이 화면·홈·시뮬레이터는 Jua/시스템 글꼴, D2Coding 은 부모 화면 본문만), 데스크톱 `/parent` 95. 접근성 95~96: 회색 글자 `#5b7c87`→`#567681`, 바다 파랑 `#1a8fb0`→`#167f9d`(대비 4.5 통과). **주황 바탕 흰 글씨는 지금 색 유지**(2026-10-17 사용자 결정: "지금이 통일성이 좋다") — 대비 2.1~2.6 으로 접근성 기준(4.5) 미달인 걸 알고 정한 것. 다시 묻지 말 것.
   ④ ~~누름·호버 반응~~ **2026-10-17 완료**: `app/globals.css` `.tap-pop`(누르면 0.95, 놓으면 넘침 곡선으로 튀어 오름, 마우스 기기만 호버 2px 들림, reduced-motion 이면 없음 — `scale`/`translate` 속성이라 `transform` 애니메이션과 안 부딪힘). 시작 화면 카드·버튼, 배불러요·새 그림·전체화면, 홈 링크, 부모 화면 go/pill 버튼·선택 카드·탭·아이 칩에 적용.
   ⑤ 배포 정리(2번).
   - `scripts/fake-scale.mjs`(2026-10-17 추가): 등록한 저울 ID·키로 펌웨어처럼 `device-ingest` 에 무게를 보내고 명령에 답하는 가짜 저울(`FAKE_SCALE_ID=… FAKE_SCALE_KEY=… node scripts/fake-scale.mjs`, 그램 입력·`r` 재부팅·`q` 종료).
2. **배포**: Production(`main`)은 아직 1단계 커밋 `5816aea`("준비 중이에요" 홈 화면). `dev`→`main` 합치기는 **사용자 확인 후**(시연 모드 뒤 합치기를 추천해 둠). 합칠 때 Supabase Auth > URL Configuration > Redirect URLs 에 Production 주소 추가.
3. ~~실제 계정 확인~~ **2026-10-17 완료**(사용자가 Preview 에서 가입·로그인·PIN·아이 "안양우" 추가까지 해 둔 뒤 Claude 가 확인): 식사 기록 빈 화면 → `/play` 시뮬레이터로 200g 중 150g(75%) 먹고 배불러요 → 저장 대기열 비움·도장판 토요일 도장·14일 막대 150g 확인(그림은 95% 미만이라 0장, 정상). 저울 탭에서 "테스트 저울" `nyam-c3ezdf` 등록 → 가짜 저울로 실제 Edge Function 에 무게 전송 → 보정 마법사 "연결됨 · 지금 0.5g", 영점·보정 명령 왕복, ±5g 통과, 목록 "방금 연결됐어요 · 보정함", `/play` "저울 연결됨"·45% 까지 진행, 저울 끄면 3초 뒤 "저울을 기다리고 있어요". **실제 DB 에 남은 확인 데이터**: 식사 1건(150g, 도장 1개), 테스트 저울 1대(사용자가 지워도 됨 — 저울 탭 "삭제" 두 번), 끝내지 않은 식사는 저장 안 됨. 그 브라우저의 저울 선택(localStorage)은 원래대로(시뮬레이터) 되돌림.
4. **부품 도착 후**: 펌웨어 컴파일(이 PC 에 Arduino IDE 없음)·실기기 확인 — 순서는 `docs/FIRMWARE_NOTES.md` §7.
5. 음성 남은 것: 개발 모드 "음성 점검" 화면, '만든 사람들' 화면 출처 표기(화면 아직 없음).

## 다시 시작할 때

1. 커밋 전 순서: `npm run lint && npm run typecheck && npm test && npx playwright test` → Codex 리뷰(`C:\dev\CLAUDE.md` §4: 평소 `--model gpt-6.1-sol`, DB·RLS·인증·PIN·키 변경은 기본 모델, 다시 리뷰는 `adversarial-review` 로 고친 부분만, 화면 스타일만 바꾸면 생략) → `.env*`·`secrets.h`·`voices-src/` 미포함 확인 → 커밋(한국어 + 접두사) → `dev` push. 리뷰가 실패하면(한도 등) 사용자에게 알리고 커밋 전에 확인.
2. 개발 서버 3005(`npm run dev`). 실제 DB 쓰기는 사용자 요청이 있을 때만 — 화면 확인은 가짜 Supabase 응답으로.
3. 확인용 스크립트 `C:/dev/_backup/nyamnyam-garden-v3/tools/`(git 밖, 출력 폴더 인자):
   - `parent-a.mjs <폴더>`: `/parent` 휴대폰·데스크톱 설정/기록 + 로그인 화면(가짜 Supabase REST)
   - `parent-device.mjs <폴더>`: 저울 탭·보정 마법사 전 과정·등록·선택·`/play` "저울 연결됨"(가짜 REST + Playwright `routeWebSocket` 으로 가짜 Realtime, 실제 DB·네트워크 접근 없음)
   - `parent-history.mjs <폴더>`: 식사 기록 화면 / `flow.mjs`: 시작 화면 3단계 / `faces.mjs <tag> <character...>`: 시안 페이지 몸짓 / `shot.mjs`·`zoom.mjs` / `parent.mjs`: 옛 `/parent` 캡처
4. Claude in Chrome: Supabase·Vercel·ElevenLabs 는 사용자 크롬에 로그인돼 있음(Claude 가 연 탭에서 보임). **외부 서비스 가입·로그인·API 키 입력은 Claude 가 하지 않는다**(anon key 도 사용자가 넣음). 클로바더빙은 확장이 막음.
5. 아티팩트: 정원·테마·캐릭터 비교 https://claude.ai/artifact/E5RGwdW2v89NA93m5Eog8Z (Version 9, 원본 `C:/dev/_backup/nyamnyam-garden-v3/compare-page/`) · 음성 청취 https://claude.ai/artifact/Q95roJCvU3FRQTuSARdv9a (Version 5) · 부모 화면 시안 https://claude.ai/artifact/QKEugAVmpXPczFjGFystq2 (Version 2, 원본 `C:/dev/_backup/nyamnyam-garden-v3/parent-design/`).

## 실행 방법

```bash
git clone https://github.com/JEONJOOHYUN/nyamnyam-canvas.git && cd nyamnyam-canvas
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3005
npm run lint && npm run typecheck && npm test
npx playwright install chromium && npm run e2e   # 6개 기기 해상도
npm run voices       # ElevenLabs 음성 다시 만들기(바뀐 줄만, --dry / --only=<캐릭터>)
```

## 환경변수 목록

| 이름                            | 용도                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_WEIGHT_SOURCE`     | 기본 무게 소스: `simulator` / `supabase`(로그인한 부모의 첫 저울) / `localws` — 부모 화면 저울 탭에서 기기별로 바꿀 수 있음 |
| `NEXT_PUBLIC_LOCAL_WS_URL`      | `localws` 기본 주소(예: `ws://192.168.0.23:81`, http 페이지에서만)                                                          |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 프로젝트 URL                                                                                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 (RLS로 보호)                                                                                               |
| `ELEVENLABS_API_KEY`            | `npm run voices` 전용(로컬 `.env.local` 만, 앱 실행 중엔 안 씀)                                                             |

## 외부 서비스 설정 (어디에 무엇이 되어 있나)

- **Supabase**: 무료 2개 한도(메이플·Wishes)라 **메이플 대시보드 프로젝트(ref `dwxntehggzojbzbeydxm`)의 별도 스키마 `nyamnyam`**(사용자 결정, 나중에 뺄 수 있게). 메이플은 Supabase Auth 를 안 써서 `auth.users` 는 냠냠캔버스 전용.
  - SQL 편집기로 `supabase/migrations/0001_parent.sql`·`0002_save_meal.sql`·`0003_devices.sql` 실행 완료(0003 은 2026-10-17 Claude 가 크롬에서, 테이블·RLS·Realtime 발행·권한을 확인 쿼리로 검증). 익명 요청은 `permission denied for schema nyamnyam`.
  - Data API > Exposed schemas 에 `nyamnyam`. Auth > Redirect URLs: `http://localhost:3005/**`, `https://nyamnyam-canvas-*-joohyun.vercel.app/**`(Site URL 기본 localhost:3000 그대로). Confirm email 켜짐(기본).
  - Edge Function `device-ingest`·`device-commands`: 2026-10-17 대시보드 편집기(Via Editor)로 배포 — 대시보드는 함수마다 파일이 한 폴더라 `index.ts`·`device.ts`·`store.ts` 를 같은 폴더에 두고 import 만 `./` 로 바꿈(내용은 저장소와 같음), Settings 에서 "Verify JWT" 끔. 확인: 없는 기기로 POST → 401 `unauthorized`, GET → 405. **함수 코드를 고치면 대시보드에서 같은 방식으로 다시 배포하거나 CLI(`npx supabase functions deploy <이름> --project-ref dwxntehggzojbzbeydxm --no-verify-jwt`, 저장소 구조 그대로, `supabase login` 은 사용자)로.**
  - `.env.local` 은 메이플 `.env.local` 값을 출력 없이 복사해 만듦.
- **Vercel**: 프로젝트 `joohyun/nyamnyam-canvas`(Hobby, 2026-10-15 Claude 가 사용자 크롬에서 import). Production = `main`, `dev` push 마다 Preview. 브랜치 고정 주소 https://nyamnyam-canvas-git-dev-joohyun.vercel.app (Vercel 로그인 필요 — 배포 보호 기본값). Preview(`NEXT_PUBLIC_VERCEL_ENV=preview`)에서만 시뮬레이터 패널과 `/design/garden` 을 켬, Production 은 숨김. 환경변수(2026-10-17): `NEXT_PUBLIC_SUPABASE_URL`(Claude)·`NEXT_PUBLIC_SUPABASE_ANON_KEY`(사용자), 둘 다 Config·Production+Preview. 환경변수를 바꾸면 Deployments > … > Redeploy 해야 반영.
- **ElevenLabs**: 사용자가 Starter 결제(첫 달 $1, 이후 $6/월, 30k 크레딧, 상업 라이선스 — 무료는 라이브러리 목소리 API 불가 402). 키 이름 `nyamnyam-canvas`(TTS·음성 읽기, 월 1만 크레딧 제한). 다 만들면 해지해도 됨(해지 후 조건은 약관 확인 필요). 사용 크레딧 약 4,000.
- 공개 저장소라 커밋에 `Co-Authored-By` 넣어도 됨(Vercel Hobby 차단은 비공개 저장소만).

## 주요 설계 결정과 이유

- **기기 재부팅 처리** (2026-10-17): 펌웨어는 부팅마다 seq 1·millis() 부터(부팅 카운터·NTP 없음). 웹 `lib/weight/guard.ts` 가 2초 이상 조용한 뒤 작은 seq 를 재부팅으로 받아들이고 ts 를 이어 붙인다 → 식사 상태 머신은 시간이 뒤로 가는 걸 보지 않는다. 펌웨어를 단순하게 두고 판단은 웹에서.
- **명령은 무게 전송 응답으로 받는다** (2026-10-17): `device-ingest` 응답에 대기 명령을 실어 보내서 따로 1초 polling 하지 않는다(무게를 최소 1초마다 보내므로 같은 효과, 요청 수 절반). `device-commands` 는 결과 보고 + 무게를 안 보낼 때의 polling. 명령 만료는 만든 시각 기준 12초 하나(서버 `expiresInMs` → 기기는 요청 보낸 시각부터 계산), 부모 화면은 15초 기다림.
- **ESP32 는 anon key 없이 Edge Function 만** (SPEC §7): 기기 키는 등록 때 한 번만 보여 주고 DB 에는 SHA-256 만. Edge Function 은 service role 로 쓰고, 부모는 RLS·열 단위 권한으로 측정값·명령 결과를 바꿀 수 없다. Edge Function 공통 처리 `supabase/functions/_shared/device.ts` 는 import 없는 순수 TS(Vitest 테스트), DB 는 `_shared/store.ts`(index·store 는 tsconfig 에서 제외).
- **무게 소스 선택** (2026-10-17): 기기별 localStorage `nyamnyam.weightSource`, 없으면 env 기본. `lib/weight/index.ts` `effectiveChoice` 를 아이 화면과 부모 화면이 같이 써서 표시와 실제가 같다. 로컬 WebSocket 소스는 시작 탭 때 적용(hydration 불일치 방지). `WeightSource.onStatus` 로 상태가 바뀌면 화면 갱신.
- **한 번에 많이 먹으면 부품이 함께 등장** (2026-10-16 사용자 결정 "기본은 순서대로, 여러 개가 나와야 할 땐 목표만큼 다같이"): 진행률이 조금씩 오르면 부품이 하나씩, 크게 뛰면 그만큼의 부품이 모두 함께 내려앉기·반짝임 애니메이션을 받는다(`growth.ts` `arrivingPieces`). 처음 그릴 때·테마가 바뀔 때는 가장 최근 부품 하나만. 냠냠이 시선과 단계 응원은 마지막 것 기준 그대로.
- **부모 화면 = 시안 A "놀이 친구"** (2026-10-16 사용자 결정): 아이 화면의 하늘색 세계를 이어 받은 둥근 카드, 번호 붙은 4묶음(그림 완성 방식 / 누구랑·어디로 / 밥 먹는 동안 / 소리와 저울), 숫자는 −/+(키보드 안 뜸), 캐릭터·테마는 그림 카드, 기록은 도장판·완성 그림·14일 막대·식사 목록, 아래 고정 "저장하기". 글꼴 Paperlogy(PT&, SIL OFL 1.1 — 공식 페이지와 글꼴 name 테이블에서 확인, 원본 TTF 4굵기를 `app/fonts/`, 라이선스 `Paperlogy-OFL.txt`)는 `/parent` 에만(`app/parent/layout.tsx`). 색·크기 조정은 `app/parent/parent.css`(`.parent-a` 안에서 shadcn 변수 --primary 등을 주황으로, 스위치·슬라이더 손잡이 크게). 코드: `components/parent/{ui,SettingsForm,History,Dashboard,ParentApp,DeviceTab}.tsx`, `lib/parent/words.ts`("하린이의" 조사, 아침/점심/저녁, 도장 주 = 한국 시간 월~일). **고른 아이 = 이 기기에서 먹는 아이**(사용자: "이 기기에서 식사" 글씨 불필요) — 아이 칩을 누르면 설정·기록이 그 아이로 바뀌고 `/play` 도 그 아이로. 탭 목록 기본 높이 `group-data-horizontal/tabs:h-8` 는 `h-auto` 로 덮음, localStorage 가 막혀도 지금 고른 아이 유지.
- **손으로 들고 먹는 음식(빵·과일)은 범위에서 제외** (2026-10-16 사용자 결정, 졸업 프로젝트 범위): 식사 판단은 "접시 위 무게가 줄어든 만큼" 하나로 단순하게 유지한다. 한때 들기·내려놓기를 구별하는 처리(조각별 보류, 60초 뒤 인정, 돌아온 음식 credit)를 `6506888` 에 넣었다가 되돌림 — 시연 때 30g 이상을 한 번에 덜면 60초 동안 그림이 멈춰 고장처럼 보이고, 통째로 들고 다 먹는 경우는 저울로 쏟음과 구별할 수 없어서. 다시 필요하면 `git show 6506888 -- lib/meal/machine.ts` 를 참고. 발표에서는 "한계와 향후 과제"로 소개.
- **식사 저장** (6단계): 식사·그림·도장은 DB 함수 `nyamnyam.save_meal`(`0002_save_meal.sql`, security invoker, 한 트랜잭션, insert-or-skip, 도장 날짜 = 식사 끝난 한국 날짜)로 저장. ID 는 기기에서 `newId()`(http LAN 대비 getRandomValues). 저장 전 기기에 계정별로 보관(`nyamnyam.unsavedMeals.<userId>`) → 성공 시 삭제, 다음 방문 때 먼저 재전송 후 진행률 로드. 완성 방식 B·C 는 `carry.shown` 으로 그림이 줄지 않음, 그림 `completed_at` = 식사 `ended_at`. 부모 설정 로딩 전엔 시작 불가("준비하고 있어요"), 실패 시 "다시 시도 / 기록 없이 시작". `/play` 를 떠나면(cacheComponents 로 상태가 남음) 세션 초기화. http LAN 에선 `crypto.subtle` 이 없어 PIN 해시는 `settings.ts` 순수 JS `sha256()`. 완성 기준 경계는 `picture.ts` `reaches()` 가 1e-9 허용.
- **음성 = ElevenLabs mp3** (2026-10-16): 냠냠이 Annie `eleven_v4`, 반짝이 Anna Kim `eleven_v4`(둘 다 목소리 기본값, v4 는 speed 무시), 퐁당이 Deoksu `eleven_multilingual_v2` ×1.3(천천히 읽기 + 재생 속도 올림, 늘이기 처리 없음 — rubberband 는 "튠 낀" 소리라 버림). 설정 `content/voices.ts`, 생성 `scripts/generate-voices.mts`(바뀐 줄만 `scripts/voices.lock.json`, 원본 캐시 `voices-src/elevenlabs/` git 제외), 파일 `public/voices/<캐릭터>/<lineId>.mp3`. 한계: ElevenLabs 에 아이 목소리가 없어(정책) 어른 목소리 기반. 선정 과정은 HISTORY.
- **아이 화면 = 정원 장면** (2026-10-15): `PlayScreen` 이 `GardenScene` 전체 화면(세로=`tall`, 가로=`wide`). 몸짓: 축하 중 `celebrate` / 들기·끝남 `wait` / 새 부품 뒤 2.4초 `point` / 그 외 `hello`. 장면 진행률 = 먹은 비율 ÷ 마지막 단계 기준(95%) → 7단계 완성 응원과 장면 완성이 같은 순간. % 칩·배불러요·새 그림 버튼은 오른쪽 위(아래는 부품 자리). 말하는 부리는 `mouth` MotionValue 를 `Chick` 의 `mouth` 슬롯에(Chick 은 서버 컴포넌트 시안 페이지에서도 쓰므로 motion 을 직접 import 하지 않음). 냠냠이 몸짓 전환·반복 동작은 CSS(`garden.css`, `data-ambient` 로 화면 밖 정지, reduced-motion 이면 끔). 시작 화면 동안 뒤 장면은 `inert`+`aria-hidden`.
- **안내 문구 없앰** (2026-10-17 사용자): 부모 화면 위 "많이 먹이기보다 …" 말풍선(SPEC §4-2 고정 문구)과 로그인 카드 설명을 없앰. 가입 카드 설명 한 줄만 남김. 처음엔 "고쳐놔"를 문장 바꾸기로 이해해 `82002a8` 에서 바꿨다가 사용자 확인으로 삭제.
- **부모 화면 캐릭터 그림** (2026-10-17 사용자 "냠냠이 테두리가 이상"): `CharacterArt` 의 `face` 는 머리+어깨(bust)를 `slice` 로 그려 둥근 틀이 가장자리가 되게(예전엔 머리 아래가 일자로 잘려 보임). 날개 외곽선은 `non-scaling-stroke` 라 작은 그림에서 몸보다 두꺼워 보여서 `.character-art` 에서 컨테이너 단위로 실제 배율 굵기(시작 화면 `.start-chick` 과 같은 방법). 안내 말풍선 옆은 둥근 틀이 아니라 전신. 부모 화면 테마 그림(`WorldThumb`: 누구랑·어디로 카드, 완성한 그림)도 같은 문제(작은 장면에서 날개 3.5px vs 몸 0.4px)라 시작 화면 테마 카드와 같은 `theme-card-scene` 클래스를 붙임 — 날개/몸 굵기 비율 1.00 으로 측정 확인.
- **기기 연결은 Supabase 경유**: Vercel(HTTPS) 페이지에서 집 안 ESP32(`http://192.168.x.x`)로 직접 접속하면 혼합 콘텐츠로 차단된다. ESP32 → Edge Function → `device_state` → Realtime → 웹.
- **애니메이션은 Motion + 코드 SVG**: 무게에 실시간으로 반응해야 해서 코드로 제어해야 한다. Lottie/Rive는 디자인 툴 파일이 필요해 보류. 캐릭터는 컴포넌트 단위로 분리해 나중에 교체 가능하게. `motion` 14.2 (`motion/react`). `<MotionConfig reducedMotion="user">` 로 `prefers-reduced-motion` 존중.
- **글꼴**: 아이 화면 Jua(`font-kid`), 본문·시뮬레이터·작은 글씨 D2Coding 1.4.0(2026-10-15 사용자 "본문만", NAVER 공식 웹폰트 원본, 굵기당 약 1.5MB, `preload: false` — OFL 예약 이름 때문에 서브셋 불가), 부모 화면은 Paperlogy(위). Noto Sans KR 은 제거됨.
- **Next.js 16.4 기본값 유지**: `cacheComponents: true`, `partialPrefetching: true`, Tailwind는 PostCSS 대신 `@tailwindcss/turbopack` 로더. 코드 쓰기 전에 `node_modules/next/dist/docs/` 확인.
- **`@types/node` 24**: vitest 5가 `@types/node` 22 이상을 요구해서 20에서 올림(로컬 Node 24.19). tsconfig `allowImportingTsExtensions`(Node 24 가 .ts 스크립트를 바로 실행).
- 개발 서버 포트 3005 (다른 프로젝트가 3000~3004 사용).
- **영점은 빈 저울(식판 없음) 기준** (2026-10-14): 스펙의 "식판 들어올리기 = 0g" 과 상태 이름 `EMPTY_TRAY` 에 맞춘 해석. 그래서 무게에 식판이 포함되고, 상태 머신이 먼저 빈 식판 무게(`trayG`)를 3초 유지로 잡은 뒤 음식이 20g 이상 더 올라와 3초 유지되면 `SERVED`(음식 = 시작 무게 − 식판). 2026-10-14 사용자 확인 완료.
- **진행 계산 방식**: `lowG`(지금까지의 최저 안정 무게) 아래로 3g 이상 내려간 만큼만 `eatenG` 에 더한다. 그래서 순간 튐·손 올림 같은 증가는 자연히 무시되고, 진행률은 `max` 로 유지돼 줄지 않는다. 남은 음식이 3g 이하면 자동 `ENDED`.
- **추가 배식**: `lowG` 보다 30g 이상 늘어 3초 유지되면 처리. `count` = 음식 무게에 더함, `ignore` = 아무것도 안 바꿈(추가분을 먹어도 이전 최저 아래로 내려가기 전엔 진행 없음).
- **비정상 감지**: 무게가 흔들리기 시작한 시각부터 다시 안정될 때까지에서 필터 안정화 1초를 뺀 시간이 2초 이하이고, 그동안 음식 무게의 50% 이상이 줄면 `heldG` 로 보류하고 진행에 넣지 않는다. 지금은 보류분을 나중에 인정하는 기능은 없다.
- **숲 그림 구조**(3단계 원래 맵, 지금 미사용 — 테마 확장용으로 `components/maps/`·`components/characters/Nyamnyam.tsx` 남겨 둠): `components/maps/forest/Stage1~4`(씨앗→새싹→작은 나무→큰 나무)는 서로 교체, `Stage5~7`(꽃, 열매, 새+무지개)은 위에 쌓는다. viewBox 800×600, 나무 뿌리 (400,458). 배경은 `overflow=visible` 로 viewBox 밖까지 그려 어떤 비율에서도 빈 곳이 없다. 팔레트는 `forest/palette.ts` 7색.
- **음성 재생**: `speak()` 가 `public/voices/<character>/<lineId>.mp3` 를 먼저 재생하고, 없으면(재생 실패) 브라우저 TTS. 입 모양은 `MotionValue` (mp3 = AnalyserNode 음량, TTS = 말하는 동안 사인파)로 리렌더 없이 움직인다. 새 대사는 이전 대사를 끊는다.
- **효과음**: `lib/audio/sfx.ts` 에서 사인/삼각파 + 짧은 엔벨로프로 합성. 첫 "시작하기" 탭에서 `AudioContext` 와 TTS 를 깨운다(iOS).
- **맵은 핵심 영역에 맞춘다** (4단계): 숲 맵 viewBox 는 전체 800×600 이 아니라 `170 85 460 465`. `meet` + `overflow=visible` 이라 이 영역은 어느 비율에서도 다 보이고, 남는 공간은 viewBox 밖까지 그린 배경이 채운다. 새 맵도 같은 방식으로 핵심 영역을 정한다.
- **아이 화면 레이아웃**: 가로(`landscape:`, 너비 무관)와 세로를 방향만으로 나눈다(휴대폰 가로 667px 도 가로 배치). 말풍선은 `break-keep text-balance`(한국어 단어 중간에서 줄바꿈 방지).
- **축하·도장**: 7단계 도달 시 컨페티 3.8초 + 캐릭터 춤 + 팡파레. 식사가 도장 기준(기본 70%) 이상으로 끝나면(자동 완료는 축하 뒤 4초, 배불러요는 바로) "참 잘했어요" 도장. 도장·그림은 6단계부터 DB 저장, 부모 화면에 주간 도장판·완성 그림.
- **무반응 말 걸기**: 먹은 양이 30초 변화 없으면 기다림 대사, 한 끼에 최대 3번(부모 설정으로 바꿈). 식판이 들려 있으면 세지 않는다.
- **시뮬레이터는 실제 기기와 같은 파이프라인**: 10Hz 샘플 → `filterStep` → `shouldTransmit`. 식판 350g, 꾹 누르기 +120g 0.6초, 노이즈 ±2g. 그래서 필터·상태 머신을 부품 없이 시험할 수 있다.

## 알려진 문제와 주의점

- `npm audit` high 7건(2026-10-14): 전부 `shadcn` CLI 패키지 → fast-glob/micromatch/braces 경로(글롭 패턴 DoS). `globals.css` 가 `shadcn/tailwind.css` 를 쓰려고 dependencies 에 들어가 있을 뿐 브라우저 런타임엔 없음. `npm audit fix --force` 는 shadcn 1.0.0 으로 내리므로 하지 말 것 — shadcn 업데이트 때 다시 확인.
- `next dev` 가 `AGENTS.md` 를 다시 쓴다. 규칙 추가는 `CLAUDE.md` 에.
- 상태 머신 한계(UX로 안내 필요): 음식을 담은 식판을 처음부터 올리면 그 무게를 빈 식판으로 잡아 `SERVED` 가 안 된다 → 화면에서 "빈 식판을 올려 주세요 → 음식을 담아 주세요" 순서 안내 + 다시 시작 버튼. 음식을 나눠 담다가 3초 멈추면 그때 무게로 시작되고 나머지는 추가 배식으로 처리된다.
- 비정상 감지는 양이 적을 때 민감하다(음식 40g에 한 입 20g이면 보류). 부모 설정에서 끌 수 있다.
- 시뮬레이터 패널은 개발 모드·Vercel Preview 에서만 보인다. 그래서 Production 배포본에서는 무게를 넣을 방법이 없다 → 8단계 "시연 모드" 에서 해결.
- mp3 가 없는 대사는 재생 시도 때 콘솔에 404 가 찍힌다(TTS 로 넘어감).
- 시뮬레이터로 시험할 때: 음식을 올린 뒤 약 5초(필터 안정 ~2초 + 3초 유지)는 그대로 둬야 `SERVED` 가 된다. 그 전에 값을 바꾸면 유지 타이머가 다시 시작된다.
- Claude in Chrome 탭이 뒤에 있으면(`document.visibilityState === "hidden"`) motion 애니메이션이 멈춰 말풍선(`AnimatePresence mode="wait"`)이 이전 대사에 머문다. 스크린샷을 찍으면 따라잡는다 — 앱 버그 아님.
- Playwright 스크린샷 기준 파일은 Windows 용(`*-win32.png`). 다른 OS/CI 에서는 기준이 없어 처음엔 실패한다 → 그 환경에서 `npx playwright test --update-snapshots` 로 따로 만든다. 화면을 의도적으로 바꾸면 기준도 다시 만든다.
- 기준 스크린샷을 다시 만들 때 `--update-snapshots` 로 만든 6장에 Next 개발 표시 "1 Issue"(빨간 배지)가 찍혔다(2026-10-15, 원인 확인 필요 — 직전 서버 번들 불일치로 생긴 hydration 오류가 남은 것으로 보임). 기준 png 를 지우고 `npx playwright test play` 로 새로 쓰면 깨끗했다. 다시 만든 뒤 왼쪽 아래 배지가 없는지 확인할 것.
- 개발 서버가 켜진 채 컴포넌트를 고치면 `/play` 의 서버 렌더가 옛 코드로 남아 hydration 오류가 날 때가 있다 → 해당 파일을 `touch` 하면 다시 컴파일됨.
- `e2e/play.spec.ts` 는 개발 서버의 시뮬레이터 패널로 진행한다(TTS 는 지워서 결정적으로, "냠냠이" → "바람 우체국" 순서로 누름). 기기당 약 17초.
- Playwright 브라우저는 chromium만 설치. 기기 6종 모두 chromium 뷰포트로 흉내 낸다(실제 Safari 아님).
- Supabase SQL 편집기 탭에 저장 안 된 쿼리가 있으면 다른 페이지로 갈 때 "사이트에서 나가시겠습니까?" 가 떠 Claude in Chrome 이 멈춘다 → 새 탭에서 작업하고, 남은 탭은 사용자에게 "나가기" 를 부탁.
- **백그라운드로 띄운 `npm run dev`·`next start` 를 TaskStop 해도 자식 node 가 포트를 잡고 남는다**(2026-10-17, 그래서 옛 코드를 계속 서빙 — 메타데이터·CSS 가 안 바뀐 것처럼 보였음). PowerShell `Get-NetTCPConnection -LocalPort <포트> -State Listen` 으로 PID 를 찾아 `Stop-Process`. 화면 변경이 안 보이면 먼저 이걸 의심.
- 펌웨어는 컴파일해 본 적 없음(이 PC 에 Arduino IDE·arduino-cli 없음). 부품이 오면 가장 먼저 컴파일 확인.

## 펌웨어 연동 상태

- 2026-10-17 펌웨어 작성(`firmware/nyamnyam/nyamnyam.ino` + `secrets.example.h`, 컴파일·실기기 확인 전), Edge Function 2개·DB 0003 Supabase 적용 완료. 계약·명령·실패 코드·테스트 절차는 [docs/FIRMWARE_NOTES.md](docs/FIRMWARE_NOTES.md).

## 파일 구조 지도

| 경로                                         | 설명                                                                                                                                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/`                                       | `layout.tsx`(글꼴), `page.tsx`(홈 → 식사 시작), `play/`(아이 화면), `parent/`(부모 화면, Paperlogy·`parent.css`), `design/garden/`(시안 페이지, 개발·Preview 전용), `fonts/`                                                                                                   |
| `components/play/`                           | `PlayScreen`(본체: 소스 연결·상태 머신·대사·저장), `StartScreen`(+`start.css`, 캐릭터 → 테마 선택), `Celebration`(컨페티·도장), `SimulatorPanel`                                                                                                                               |
| `components/garden/`                         | `GardenScene`, 테마(`themes.tsx`, `PostBackground`·`WorldPieces`, `SeaTheme`, `SpaceTheme`), 성장 사건 `growth.ts`, 캐릭터(`characters.ts`, `Chick`=냠냠이, `Pongdang`, `Banjjak`), `garden.css`                                                                               |
| `components/parent/`                         | `ParentApp`(로그인·PIN), `Dashboard`(아이 칩·탭), `SettingsForm`, `History`, `DeviceTab`(저울), `ui.tsx`(공통 조각)                                                                                                                                                            |
| `components/ui/`                             | shadcn 컴포넌트 (부모 화면용)                                                                                                                                                                                                                                                  |
| `components/maps/`, `components/characters/` | 3단계 숲 맵(`ForestMap`, `Stage1~7`)·`Appear.tsx`(등장 스프링 `Sway`·`Sparkles`)·냠냠이(지금 미사용)                                                                                                                                                                           |
| `content/lines.ts`, `content/voices.ts`      | 캐릭터·테마별 대사(금지어 테스트) / 음성 설정                                                                                                                                                                                                                                  |
| `lib/audio/`                                 | `sfx.ts` 합성 효과음, `voice.ts` mp3·TTS + 입 동기화                                                                                                                                                                                                                           |
| `lib/meal/`                                  | `machine.ts` 식사 상태 머신 `mealReducer` + 기준 상수, `stage.ts` 단계·무반응, `picture.ts` 완성 방식 A/B/C                                                                                                                                                                    |
| `lib/weight/`                                | `types.ts`(펌웨어 JSON 계약), `constants.ts`·`filter.ts`(펌웨어와 공유), `simulator.ts`(`SimulatorSource`: `setFood`·`bite`·`press`·`lifted`·`noise`, tare 명령), `remote.ts`·`guard.ts`(원격 공통·seq/재부팅), `supabase.ts`, `localws.ts`, `index.ts`(소스 선택 유일한 위치) |
| `lib/parent/`                                | `settings.ts`(설정·PIN·이 기기의 아이), `data.ts`(`loadPlayConfig`·`saveMeal`), `devices.ts`(저울 id·키·보정 판정), `words.ts`                                                                                                                                                 |
| `lib/supabase/`                              | `client.ts`, `types.ts`(손으로 쓴 DB 타입, codegen 없음). `lib/utils.ts` 는 shadcn `cn`                                                                                                                                                                                        |
| `supabase/`                                  | `migrations/0001~0003`, `functions/{device-ingest,device-commands,_shared}`, `config.toml`                                                                                                                                                                                     |
| `firmware/nyamnyam/`                         | `nyamnyam.ino`, `secrets.example.h`(`secrets.h` 는 git 제외)                                                                                                                                                                                                                   |
| `scripts/`                                   | `generate-voices.mts`, `voices.lock.json`                                                                                                                                                                                                                                      |
| `public/voices/`                             | 캐릭터 음성 mp3 111개                                                                                                                                                                                                                                                          |
| `e2e/`                                       | Playwright: `smoke`(홈), `play`(아이 화면, 레이아웃 + 스크린샷). 기기 6종은 `playwright.config.ts`                                                                                                                                                                             |
| `docs/`                                      | `SPEC.md`(원본 요구사항), `FIRMWARE_NOTES.md`, `CHARACTERS.md`, `ASSETS.md`(출처), `HISTORY.md`(지난 기록)                                                                                                                                                                     |

## 세션 기록

- 2026-10-14: 1~4단계(세팅·무게 엔진·아이 화면 MVP·반응형), 정원 재설계 시안 시작.
- 2026-10-15: 정원 시안 Codex v4~v7 → `/play` 연결, Vercel 연결, D2Coding, 5단계 테마 3종·캐릭터 3종·시작 화면(`f9e3452`).
- 2026-10-16: 6단계 부모 설정·식사 저장, ElevenLabs 음성, 부품 동시 등장, 빵 처리 넣었다 되돌림, 부모 화면 A안.
- 2026-10-17: 7단계 기기 연동 준비 + Supabase 적용·Edge Function 배포, Vercel 환경변수, HANDOFF 정리(지난 과정은 `docs/HISTORY.md`).
