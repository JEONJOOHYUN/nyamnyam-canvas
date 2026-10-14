# HANDOFF — 냠냠캔버스 (nyamnyam-canvas)

## 마지막 업데이트: 2026-10-14

## 저장소: https://github.com/JEONJOOHYUN/nyamnyam-canvas · 브랜치: dev · 마지막 커밋: `5816aea` chore: Next.js 16 프로젝트 세팅과 문서 뼈대 추가

## 현재 상태 요약

- 1단계(세팅) 완료: Next.js 16.4 + TS strict + Tailwind v4 + shadcn/ui(base-nova) + ESLint/Prettier + Vitest + Playwright.
- 화면은 아직 홈 자리표시(`app/page.tsx`)뿐. 무게 엔진·아이 화면·부모 설정은 없음.
- 다음은 2단계 무게 엔진.

## 완료된 것

- 1단계 세팅 (2026-10-14), `main` 첫 커밋 + `dev` 브랜치 생성
- 문서 뼈대: README, `docs/SPEC.md`(원본 요구사항), `docs/FIRMWARE_NOTES.md`, `docs/ASSETS.md`, `CLAUDE.md`

## 진행 중인 것

- 없음

## 다음 할 일 (우선순위 순)

1. 2단계 무게 엔진: `lib/weight/types.ts`(`WeightReading`, `WeightSource`), `SimulatorSource`, 필터·식사 상태 머신(순수 함수) + Vitest
2. 3단계 아이 화면 MVP: 숲 맵 7단계, 냠냠이, 브라우저 TTS, Web Audio 효과음, 시뮬레이터 패널
3. Vercel 연결(사용자 작업): GitHub 저장소 import, Production Branch = `main`

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

## 알려진 문제와 주의점

- `npm audit` high 7건(2026-10-14): 전부 `shadcn` CLI 패키지 → fast-glob/micromatch/braces 경로(글롭 패턴 DoS). `globals.css` 가 `shadcn/tailwind.css` 를 쓰려고 dependencies 에 들어가 있을 뿐 브라우저 런타임엔 없음. `npm audit fix --force` 는 shadcn 1.0.0 으로 내리므로 하지 말 것 — shadcn 업데이트 때 다시 확인.
- `next dev` 가 `AGENTS.md` 를 다시 쓴다. 규칙 추가는 `CLAUDE.md` 에.
- Playwright 브라우저는 chromium만 설치. 기기 6종 모두 chromium 뷰포트로 흉내 낸다(실제 Safari 아님).

## 펌웨어 연동 상태

- 펌웨어 코드 없음. 계약 초안과 배선은 [docs/FIRMWARE_NOTES.md](docs/FIRMWARE_NOTES.md).

## 파일 구조 지도

| 경로                     | 설명                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `app/`                   | Next.js 라우트. 지금은 `layout.tsx`(글꼴), `page.tsx`(자리표시)                                      |
| `components/ui/`         | shadcn 컴포넌트 (부모 화면용)                                                                        |
| `lib/utils.ts`           | shadcn `cn`                                                                                          |
| `e2e/`                   | Playwright 테스트 (기기 6종은 `playwright.config.ts`)                                                |
| `docs/SPEC.md`           | 원본 요구사항 전체                                                                                   |
| `docs/FIRMWARE_NOTES.md` | 하드웨어·데이터 계약·펌웨어 참고                                                                     |
| `docs/ASSETS.md`         | 출처 표기                                                                                            |
| 예정                     | `lib/weight/`, `content/lines.ts`, `components/maps/`, `supabase/`, `firmware/nyamnyam/`, `scripts/` |

## 세션 기록

- 2026-10-14: 1단계 세팅. Codex 리뷰 지적 반영(`typecheck` 에 `next typegen` 추가 — `LayoutProps` 가 `.next` 에서 생성돼 새 clone 에서 실패했음). `main`·`dev` push 완료.
