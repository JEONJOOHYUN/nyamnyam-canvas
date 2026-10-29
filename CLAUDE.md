# 냠냠캔버스 — 핵심 규칙

@AGENTS.md

작업 전에 `.agents/handoff.md`(현재 상태)를 읽고, 필요한 부분만 `docs/SPEC.md`(전체 요구사항)를 읽는다.
설계 결정과 이유는 `.agents/decisions.md`, 파일 구조는 `.agents/structure.md`, 지난 과정은 `.agents/history.md`.
(2026-10-29 사용자 결정으로 모든 프로젝트의 AI 작업 문서를 `.agents/` 로 통일 — SPEC §10 의 "루트 `HANDOFF.md`"는 이 위치로 읽는다. SPEC 은 원문 그대로 둔다.)

- 답변·보고는 한국어. 코드 주석·식별자는 영문. 커밋 메시지는 한국어 + 종류 접두사(`feat:` `fix:` `docs:` `refactor:` `test:` `chore:` `firmware:`).
- 브랜치: 평소 `dev`. `dev` → `main` 합치기는 사용자 확인 후. force push 금지.
- push 전: `npm run lint`, `npm run typecheck`, `npm test` 통과 + `.env*`·`secrets.h`·`voices-src/` 미포함 확인.
- 기기 관련 코드(타입, API, 명령, 필터 기준, 상태 머신)를 바꾸면 `docs/FIRMWARE_NOTES.md` 도 같이 고친다. 작업 보고 끝에 "🔧 펌웨어 참고사항"을 붙인다.
- 작업 단위가 끝날 때마다 `.agents/handoff.md` 갱신(150줄·15KB 안팎 유지, 넘치면 끝난 일은 `history.md` 로 원문 이동). 새 설계 결정은 `decisions.md` 맨 위에.
- 아이에게 하는 말은 칭찬과 기다림만. 그림(진행률)은 절대 줄어들지 않는다. `any` 금지.
- 부모 화면은 shadcn/ui(`npx shadcn@latest add <이름>`), 아이 화면은 Tailwind + 직접 만든 SVG.
- 개발 서버 포트 3005 (`C:\dev\.claude\launch.json` 의 `nyamnyam-dev`).
