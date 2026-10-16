# 냠냠캔버스 (nyamnyam-canvas)

아이가 밥을 먹으면 식판 아래 무게센서(로드셀)가 줄어든 무게를 재고, 먹은 만큼 화면 속 그림이 자라나는 식습관 도우미입니다. 캐릭터가 움직이고 말하며 응원하고, 부모는 별도 설정 페이지에서 목표와 기기를 관리합니다. 캡스톤디자인 2 과제입니다(팀장 전주현, 팀원 이다빈).

> 시연 GIF / 스크린샷 자리

## 기술 스택

- Next.js 16 (App Router, TypeScript) · React 19 · Tailwind CSS v4 · shadcn/ui (base-nova)
- Supabase (Auth, Postgres + RLS, Realtime, Edge Functions)
- Motion + SVG 애니메이션, Web Audio 효과음
- Vitest (로직 테스트), Playwright (기기별 화면 테스트)
- ESP32 + HX711 + 로드셀 5kg (Arduino)
- 배포: Vercel (`main` = Production, `dev` = Preview)

## 빠른 시작

```bash
git clone https://github.com/JEONJOOHYUN/nyamnyam-canvas.git
cd nyamnyam-canvas
npm install
cp .env.example .env.local   # 값 채우기 (시뮬레이터만 쓸 땐 비워 둬도 됨)
npm run dev                  # http://localhost:3005
```

| 명령                                              | 용도                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `npm run lint` / `npm run typecheck` / `npm test` | push 전 필수 확인                                                   |
| `npm run e2e`                                     | Playwright 기기별 테스트 (처음엔 `npx playwright install chromium`) |
| `npm run format`                                  | Prettier 정리                                                       |

## 하드웨어 배선 요약

HX711 VCC → ESP32 **3V3**, GND → GND, DT → **GPIO16**, SCK → **GPIO4**. HX711을 5V에 연결하지 마세요.
자세한 내용은 [docs/FIRMWARE_NOTES.md](docs/FIRMWARE_NOTES.md).

## 문서

- [HANDOFF.md](HANDOFF.md) — 현재 상태와 다음 할 일
- [docs/SPEC.md](docs/SPEC.md) — 전체 요구사항
- [docs/ASSETS.md](docs/ASSETS.md) — 소리·음성·이미지 출처

## 출처 표기

- 음성: ElevenLabs
- 효과음: Web Audio API로 직접 합성
- 글꼴: Jua (Google Fonts), D2Coding 1.4.0 (NAVER) — 모두 SIL OFL
