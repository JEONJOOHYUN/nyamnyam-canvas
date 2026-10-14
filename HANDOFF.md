# HANDOFF — 냠냠캔버스 (nyamnyam-canvas)

## 마지막 업데이트: 2026-10-14

## 저장소: https://github.com/JEONJOOHYUN/nyamnyam-canvas · 브랜치: dev · 마지막 커밋: `git log -1` (2단계 무게 엔진)

## 현재 상태 요약

- 1단계(세팅) 완료: Next.js 16.4 + TS strict + Tailwind v4 + shadcn/ui(base-nova) + ESLint/Prettier + Vitest + Playwright.
- 2단계(무게 엔진) 완료: `WeightSource` 타입, 펌웨어와 같은 필터, `SimulatorSource`, 식사 상태 머신(순수 함수) + Vitest 22개.
- 화면은 아직 홈 자리표시뿐. 엔진은 UI에 연결 안 됨.
- 다음은 3단계 아이 화면 MVP.

## 완료된 것

- 1단계 세팅 (2026-10-14), `main` 첫 커밋 + `dev` 브랜치 생성
- 문서 뼈대: README, `docs/SPEC.md`(원본 요구사항), `docs/FIRMWARE_NOTES.md`, `docs/ASSETS.md`, `CLAUDE.md`
- 2단계 무게 엔진 (2026-10-14): `lib/weight/{types,constants,filter,simulator}.ts`, `lib/meal/machine.ts`, 테스트 3파일

## 진행 중인 것

- 없음

## 다음 할 일 (우선순위 순)

1. 3단계 아이 화면 MVP: 숲 맵 7단계, 냠냠이, 브라우저 TTS, Web Audio 효과음, 시뮬레이터 패널(개발 모드). 여기서 `NEXT_PUBLIC_WEIGHT_SOURCE` 로 소스를 고르는 팩토리(`lib/weight/index.ts`)와 단계 계산(진행률 → 10/25/40/55/70/85/95%), 무반응 감지도 만든다
2. Vercel 연결(사용자 작업): GitHub 저장소 import, Production Branch = `main`

## 실행 방법

```bash
git clone https://github.com/JEONJOOHYUN/nyamnyam-canvas.git && cd nyamnyam-canvas
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3005
npm run lint && npm run typecheck && npm test
npx playwright install chromium && npm run e2e   # 6개 기기 해상도
```

배포: Vercel이 GitHub `main`(Production) / `dev`(Preview)를 자동 배포 — 아직 연결 안 됨.

## 환경변수 목록

| 이름                            | 용도                                                   |
| ------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_WEIGHT_SOURCE`     | 무게 데이터 소스: `simulator` / `supabase` / `localws` |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 프로젝트 URL (6단계부터)                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 (RLS로 보호)                          |

## 주요 설계 결정과 이유

- **기기 연결은 Supabase 경유**: Vercel(HTTPS) 페이지에서 집 안 ESP32(`http://192.168.x.x`)로 직접 접속하면 혼합 콘텐츠로 차단된다. ESP32 → Edge Function → `device_state` → Realtime → 웹.
- **애니메이션은 Motion + 코드 SVG**: 무게에 실시간으로 반응해야 해서 코드로 제어해야 한다. Lottie/Rive는 디자인 툴 파일이 필요해 보류. 캐릭터는 컴포넌트 단위로 분리해 나중에 교체 가능하게. (3단계에서 `motion` 설치 예정)
- **글꼴**: 아이 화면 Jua(`font-kid`), 부모 화면 Noto Sans KR(`font-sans`). `next/font/google` 로 자체 호스팅.
- **Next.js 16.4 기본값 유지**: `cacheComponents: true`, `partialPrefetching: true`, Tailwind는 PostCSS 대신 `@tailwindcss/turbopack` 로더. 코드 쓰기 전에 `node_modules/next/dist/docs/` 확인.
- **`@types/node` 24**: vitest 5가 `@types/node` 22 이상을 요구해서 20에서 올림(로컬 Node 24.19).
- 개발 서버 포트 3005 (다른 프로젝트가 3000~3004 사용).
- **영점은 빈 저울(식판 없음) 기준** (2026-10-14): 스펙의 "식판 들어올리기 = 0g" 과 상태 이름 `EMPTY_TRAY` 에 맞춘 해석. 그래서 무게에 식판이 포함되고, 상태 머신이 먼저 빈 식판 무게(`trayG`)를 3초 유지로 잡은 뒤 음식이 20g 이상 더 올라와 3초 유지되면 `SERVED`(음식 = 시작 무게 − 식판). 사용자 확인 필요.
- **진행 계산 방식**: `lowG`(지금까지의 최저 안정 무게) 아래로 3g 이상 내려간 만큼만 `eatenG` 에 더한다. 그래서 순간 튐·손 올림 같은 증가는 자연히 무시되고, 진행률은 `max` 로 유지돼 줄지 않는다. 남은 음식이 3g 이하면 자동 `ENDED`.
- **추가 배식**: `lowG` 보다 30g 이상 늘어 3초 유지되면 처리. `count` = 음식 무게에 더함, `ignore` = 아무것도 안 바꿈(추가분을 먹어도 이전 최저 아래로 내려가기 전엔 진행 없음).
- **비정상 감지**: 무게가 흔들리기 시작한 시각부터 다시 안정될 때까지에서 필터 안정화 1초를 뺀 시간이 2초 이하이고, 그동안 음식 무게의 50% 이상이 줄면 `heldG` 로 보류하고 진행에 넣지 않는다. 지금은 보류분을 나중에 인정하는 기능은 없다.
- **시뮬레이터는 실제 기기와 같은 파이프라인**: 10Hz 샘플 → `filterStep` → `shouldTransmit`. 식판 350g, 꾹 누르기 +120g 0.6초, 노이즈 ±2g. 그래서 필터·상태 머신을 부품 없이 시험할 수 있다.

## 알려진 문제와 주의점

- `npm audit` high 7건(2026-10-14): 전부 `shadcn` CLI 패키지 → fast-glob/micromatch/braces 경로(글롭 패턴 DoS). `globals.css` 가 `shadcn/tailwind.css` 를 쓰려고 dependencies 에 들어가 있을 뿐 브라우저 런타임엔 없음. `npm audit fix --force` 는 shadcn 1.0.0 으로 내리므로 하지 말 것 — shadcn 업데이트 때 다시 확인.
- `next dev` 가 `AGENTS.md` 를 다시 쓴다. 규칙 추가는 `CLAUDE.md` 에.
- 상태 머신 한계(UX로 안내 필요): 음식을 담은 식판을 처음부터 올리면 그 무게를 빈 식판으로 잡아 `SERVED` 가 안 된다 → 3단계 화면에서 "빈 식판을 올려 주세요 → 음식을 담아 주세요" 순서 안내 + 다시 시작 버튼. 음식을 나눠 담다가 3초 멈추면 그때 무게로 시작되고 나머지는 추가 배식으로 처리된다.
- 비정상 감지는 양이 적을 때 민감하다(음식 40g에 한 입 20g이면 보류). 부모 설정에서 끌 수 있다.
- `WeightSource` 인터페이스에 상태 변경 알림이 없다(스펙 그대로 `status` 속성만). 7단계 `SupabaseRealtimeSource` 에서 offline 표시가 필요할 때 추가 검토.
- Playwright 브라우저는 chromium만 설치. 기기 6종 모두 chromium 뷰포트로 흉내 낸다(실제 Safari 아님).

## 펌웨어 연동 상태

- 펌웨어 코드 없음. 데이터 계약·공유 상수·전송 규칙은 2단계에서 확정(웹 `lib/weight/`). seq 재부팅 문제는 미결. 배선과 상세는 [docs/FIRMWARE_NOTES.md](docs/FIRMWARE_NOTES.md).

## 파일 구조 지도

| 경로                      | 설명                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `app/`                    | Next.js 라우트. 지금은 `layout.tsx`(글꼴), `page.tsx`(자리표시)                       |
| `components/ui/`          | shadcn 컴포넌트 (부모 화면용)                                                         |
| `lib/utils.ts`            | shadcn `cn`                                                                           |
| `lib/weight/types.ts`     | `WeightReading`·`DeviceCommand`·`WeightSource` (펌웨어 JSON 계약)                     |
| `lib/weight/constants.ts` | 펌웨어와 공유하는 필터·전송 상수                                                      |
| `lib/weight/filter.ts`    | 중앙값→이동평균→안정 판단, 전송 조건 (펌웨어 파이프라인 복제)                         |
| `lib/weight/simulator.ts` | `SimulatorSource`: `setFood`·`bite`·`press`·`lifted`·`noise`, tare 명령               |
| `lib/meal/machine.ts`     | 식사 상태 머신 `mealReducer` + 기준 상수                                              |
| `e2e/`                    | Playwright 테스트 (기기 6종은 `playwright.config.ts`)                                 |
| `docs/SPEC.md`            | 원본 요구사항 전체                                                                    |
| `docs/FIRMWARE_NOTES.md`  | 하드웨어·데이터 계약·펌웨어 참고                                                      |
| `docs/ASSETS.md`          | 출처 표기                                                                             |
| 예정                      | `content/lines.ts`, `components/maps/`, `supabase/`, `firmware/nyamnyam/`, `scripts/` |

## 세션 기록

- 2026-10-14: 1단계 세팅. Codex 리뷰 지적 반영(`typecheck` 에 `next typegen` 추가 — `LayoutProps` 가 `.next` 에서 생성돼 새 clone 에서 실패했음). `main`·`dev` push 완료.
- 2026-10-14: 2단계 무게 엔진. 영점 기준(빈 저울)·진행 계산·추가 배식·비정상 감지 방식 결정(위 "주요 설계 결정"). Codex 리뷰 2건 반영: 불안정 값이 오면 3초 유지 타이머 초기화, 비정상 감지 시간을 필터·전송 지연과 무관하게 측정.
