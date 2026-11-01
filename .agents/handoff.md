# HANDOFF — 냠냠캔버스 (nyamnyam-canvas)

## 마지막 업데이트: 2026-11-01

## 저장소: https://github.com/JEONJOOHYUN/nyamnyam-canvas · 브랜치: dev · 마지막 커밋: `git log -1`

> 지금 상태·다음 할 일·함정만 둔다(150줄·15KB 안팎). 길게 남길 참고 자료는 따로 둔다:
> 설계 결정과 이유 [decisions.md](decisions.md) · 파일 구조 지도 [structure.md](structure.md) · 지난 과정 [history.md](history.md)
> 원본 요구사항 [docs/SPEC.md](../docs/SPEC.md) · 기기 계약 [docs/FIRMWARE_NOTES.md](../docs/FIRMWARE_NOTES.md)

## 지금 상태 (2026-10-29)

- **앱**: 1~8단계 완료. `dev` = `30a7cfb`(자동 시연 배속), 2026-10-26 사용자 요청으로 `origin/main` 도 같은 커밋 → https://nyamnyam-canvas.vercel.app 반영. 작업 트리 깨끗.
  검증 기준(2026-10-26): e2e 30·단위 154 통과.
- **시연 화면**: `/demo`(시연 도구 패널: 식판 두기 / 음식 두기 200g / 음식 먹기 g 입력 / 처음부터 + 재생 속도 0.5~3x), `/demo/auto`(시연장용 무한 반복, 시작 화면에서 1.0~3.0x 선택·기기에 기억).
- **실기기 (2026-10-27 첫 웹 연결)**: 저울(`nyam-zicyrv`)이 보조배터리 + Wi-Fi 로 `device-ingest` → Realtime 정상, 아이 화면 "저울 연결됨", 부모 화면 영점·보정 명령 실기기 실행 확인(363g 페트병, 보정 때 362 입력).
  문제: 윗판이 모서리 멈춤에 닿아 자리별 −35%~+32% 오차 → 멈춤 테이프 제거(틈 약 3mm). 그 과정에서 윗판·받침 모두 로드셀에서 떨어짐(에폭시가 트레이 쪽에만 묻음).
  올려만 둔 상태 가운데 시험: 흐름 거의 없음, 0 복귀 정상, 보정값 −9%(멈춤이 닿은 상태에서 보정했기 때문).
- **2026-10-28 결정**: 에폭시 대신 **M4 접시머리 30mm 볼트 4개**로 다시 고정. 트레이·블록 4.5mm 관통(바닥 9 + 블록 15 = 24), 볼트 끝 6mm 가 로드셀 나사 구멍에 물림.
  윗판 쪽은 윗판 안쪽 바닥에서 아래로, 받침 쪽은 받침 아랫면에서 위로, 머리는 카운터싱크로 묻음(셀 쪽에서 블록으로 박으면 셀 나사산이 먼저 물려 안 당겨짐).
  한쪽 구멍 2개 간격 9mm 는 ver1 설계 기준 — 실물 확인 필요. 조립 안내 아티팩트와 구매 내역은 루트 handoff(git 밖).
- 시연은 판이 커서 **가운데 기준**(식판 자리 표시, 물병을 가운데 모아 세우고 가장자리부터 좌우 번갈아 내림)으로 사용자와 합의.

## 다음 할 일 (우선순위 순)

1. 저울 볼트 고정 → 영점 → 가운데 363g 보정 → 가운데 반복·5cm 비킨 자리 시험 → 아이 화면 시연 흐름.
   시험이 끝나면 결과를 `docs/FIRMWARE_NOTES.md`(§7·§9)와 이 파일에 기록(코드 변경 없음).
2. 보조배터리로 시연 시간만큼 오래 켜 두는 시험(확인 필요). 중간에 끊기면 펌웨어에 `WiFi.setSleep(false)` 한 줄 후보(코드 변경 → Codex 리뷰·FIRMWARE_NOTES 갱신).
3. 음성 남은 것: 개발 모드 "음성 점검" 화면, '만든 사람들' 화면 출처 표기(화면 아직 없음).
- 참고 도구: `scripts/fake-scale.mjs` — 등록한 저울 ID·키로 펌웨어처럼 무게를 보내는 가짜 저울(`FAKE_SCALE_ID=… FAKE_SCALE_KEY=… node scripts/fake-scale.mjs`).
- 지난 "다음 할 일"(8단계·배포·실제 계정 확인, 모두 완료)과 10-17~10-26 진행 기록은 [history.md](history.md) "2026-10-29 handoff 정리".

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

## 알려진 문제와 주의점

- `npm audit` high 7건(2026-10-14): 전부 `shadcn` CLI 패키지 → fast-glob/micromatch/braces 경로(글롭 패턴 DoS). `globals.css` 가 `shadcn/tailwind.css` 를 쓰려고 dependencies 에 들어가 있을 뿐 브라우저 런타임엔 없음. `npm audit fix --force` 는 shadcn 1.0.0 으로 내리므로 하지 말 것 — shadcn 업데이트 때 다시 확인.
- `next dev` 가 `AGENTS.md` 를 다시 쓴다. 규칙 추가는 `CLAUDE.md` 에.
- Next.js 16.4.0 은 보안 취약점(이미지 최적화·`use cache` 원격 코드 실행, Server Actions DoS) → 2026-10-23 `next`·`eslint-config-next` 16.4.2 로 올림. 취약한 버전이면 `next dev` 가 안내를 띄우고 한 번 멈추며(다시 실행하면 켜짐), 화면 왼쪽 아래에 "1 Insight" 배지가 떠서 e2e 스크린샷이 달라진다.
- Windows 에서 백그라운드 `npm run dev` 를 멈춰도 자식 `node …start-server.js` 가 3005 를 계속 잡고 있을 수 있다. 그러면 e2e(`reuseExistingServer`)가 옛 서버를 쓴다 → `Get-NetTCPConnection -LocalPort 3005` 로 PID 확인 후 종료.
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
- HX711 라이브러리는 **"HX711 Arduino Library"**(Bogdan Necula). 라이브러리 매니저에서 그냥 "HX711" 을 고르면 다른 저자(Rob Tillaart) 것이라 API 가 다르다. Arduino IDE 는 winget 압축판이라 바로가기를 직접 만들어 둠(2026-10-20).

## 펌웨어 연동 상태

- 펌웨어 `firmware/nyamnyam/nyamnyam.ino` + `secrets.example.h`: 2026-10-20 컴파일, 2026-10-23 실기기 업로드·센서 반응, **2026-10-27 Wi-Fi·웹 연결·영점·보정 명령 실기기 확인**. 남은 것은 저울 고정 뒤 정확도 시험(위 "다음 할 일").
- Edge Function 2개·DB 0003 Supabase 적용 완료. 계약·명령·실패 코드·테스트 절차는 [docs/FIRMWARE_NOTES.md](../docs/FIRMWARE_NOTES.md).

## 세션 기록

- 2026-10-14: 1~4단계(세팅·무게 엔진·아이 화면 MVP·반응형), 정원 재설계 시안 시작.
- 2026-10-15: 정원 시안 Codex v4~v7 → `/play` 연결, Vercel 연결, D2Coding, 5단계 테마 3종·캐릭터 3종·시작 화면(`f9e3452`).
- 2026-10-16: 6단계 부모 설정·식사 저장, ElevenLabs 음성, 부품 동시 등장, 빵 처리 넣었다 되돌림, 부모 화면 A안.
- 2026-10-17: 7단계 기기 연동 준비 + Supabase 적용·Edge Function 배포, Vercel 환경변수, HANDOFF 정리(지난 과정은 `docs/HISTORY.md`).
- 2026-10-20: 부품 도착. Arduino CLI·IDE·esp32 코어·라이브러리 설치, 펌웨어 첫 컴파일 성공(세 설정 조합). 브레드보드 배선도(비공개 아티팩트, git 밖 원본 — 위치는 루트 handoff). 사용자 확인: 로드셀 5kg, 버튼·LED 없음 유지, 브레드보드 사용.
- 2026-10-22: 버튼 새 모양·누름 고리·시작 화면 단계 등장/퇴장 애니메이션(Codex 의견 반영, 리뷰 지적 없음). e2e 자동 시연 테스트는 시작 화면이 사라질 때까지 기다리게 고침.
- 2026-10-22: 전시용 A3 포스터 시안 3종(git 밖, 위치는 루트 handoff). `/design/garden?theme=&character=` 를 1180×820 @2x 로 찍어 태블릿 목업에 씀.
- 2026-10-22: 사용자 결정으로 `dev`→`main` fast-forward(`151c177..ba609c7`) → 실제 사이트에 새 버튼·시작 화면 애니메이션 반영(배포된 CSS 에 `btn-solid` 확인, `/`·`/demo/auto` 200, `/design/*` 404 그대로).
- 2026-10-23: Next.js 16.4.2 보안 업그레이드. 대사 타이밍 점검(자동·손 시연 재생 순서 기록) → 빈 식판 안내·두 번째 친구 인사·쉬는 중 말풍선·무반응 시간 고침, 단계 칭찬을 그림 등장 순간에 맞춤(세 세계 조각 재배치, `sceneFor`). Codex 리뷰 지적 1건 반영.
- 2026-10-23: 정원 캐릭터를 누르면 뜨던 네모 박스 제거(사용자 요청). SVG `<g role=button tabIndex=0>` 에 크롬이 그리던 포커스 테두리였음 → `.chick-tap`(garden.css) 으로 테두리·탭 하이라이트 없앰, 키보드 포커스일 때만 캐릭터 모양을 따라 빛남(drop-shadow). `characters.test.ts` 마크업 해시는 클래스 추가만 반영해 갱신(클래스 빼면 옛 해시 통과 확인). 사용자 요청으로 main 에도 합쳐 실제 사이트 반영(배포 CSS 에 `chick-tap` 확인).
- 2026-10-23: 실기기 첫 연결. 처음 두 케이블은 충전 전용(LED·휴대폰 충전은 되는데 장치 관리자에 아무것도 안 뜸) → 로지텍 마우스 케이블로 인식, CP210x 드라이버는 사용자가 설치. 보드 회로도(하이제니스 GitHub) 확인 내용은 FIRMWARE_NOTES §1. 업로드·시리얼·누름 반응 확인.
- 2026-10-26: 시연 도구(DemoPanel)·배속·단계 칭찬 지연. 저울 외형 ver2 실측 반영(아티팩트, 루트 handoff).
- 2026-10-27: 실기기 첫 웹 연결·영점·보정 명령 확인, 멈춤 접촉 오차로 테이프 제거, 윗판·받침 분리 → 2026-10-28 볼트 고정으로 결정(위 "지금 상태").
- 2026-10-29: 문서 위치 통일(`C:devCLAUDE.md` §2) — `HANDOFF.md`→`.agents/handoff.md`, `docs/HISTORY.md`→`.agents/history.md`, 설계 결정·파일 구조 지도는 `.agents/decisions.md`·`.agents/structure.md` 로 분리.
- 2026-11-01: 완성된 그림의 숫자를 100%로(`shownPercent`, 먹는 동안은 먹은 양 % 그대로). 단위 156·e2e 30 통과, Codex 리뷰 지적 없음. 사용자 요청으로 main 에도 합침. (소개 영상 작업은 git 밖 `C:/dev/_work/nyamnyam/video/`, 루트 handoff 참고.)
