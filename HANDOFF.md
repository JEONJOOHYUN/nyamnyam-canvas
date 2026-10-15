# HANDOFF — 냠냠캔버스 (nyamnyam-canvas)

## 마지막 업데이트: 2026-10-15

## 저장소: https://github.com/JEONJOOHYUN/nyamnyam-canvas · 브랜치: dev · 마지막 커밋: `git log -1` (4단계 반응형 완성)

## 현재 상태 요약

- 1단계(세팅) 완료: Next.js 16.4 + TS strict + Tailwind v4 + shadcn/ui(base-nova) + ESLint/Prettier + Vitest + Playwright.
- 2단계(무게 엔진) 완료: `WeightSource` 타입, 펌웨어와 같은 필터, `SimulatorSource`, 식사 상태 머신(순수 함수).
- 3단계(아이 화면 MVP) 완료: `/play` — 숲 맵 7단계, 냠냠이, 브라우저 TTS 음성, Web Audio 효과음, 개발 모드 시뮬레이터 패널. Vitest 31개.
- 4단계(반응형 완성) 완료: 6개 기기 Playwright 레이아웃·스크린샷 테스트, 세로 화면 그림 확대.
- 정원 재설계 완료(2026-10-15): `/play` 가 바람 우체국 장면(`components/garden/GardenScene`)으로 바뀜. 다음: 5단계 테마 확장, 클로바더빙(사용자 약관 확인 후).

## 완료된 것

- Vercel 연결 (2026-10-15, Claude 가 사용자 크롬에서 import): 프로젝트 `joohyun/nyamnyam-canvas`(Hobby), Production = `main`, `dev` push 마다 Preview. 브랜치 고정 주소 https://nyamnyam-canvas-git-dev-joohyun.vercel.app (Vercel 로그인 필요 — 배포 보호 기본값). 환경변수 없음(무게 소스 기본값 simulator). Preview(`NEXT_PUBLIC_VERCEL_ENV=preview`)에서만 시뮬레이터 패널과 `/design/garden` 을 켬, Production 은 숨김.
- 본문 글꼴 D2Coding 1.4.0 (2026-10-15 사용자 요청, "본문만" 선택): 부모 화면·시뮬레이터·작은 글씨는 D2Coding, 아이 말풍선·버튼·제목은 Jua 유지. NAVER 공식 웹폰트(`site/fonts`, 태그 VER1.4.0)를 수정 없이 `app/fonts/` 에(굵기당 약 1.5MB, `preload: false`). OFL 예약 글꼴 이름 때문에 서브셋(약 300KB)을 만들 수 없어서 원본 사용. Noto Sans KR 제거.
- 정원 장면 `/play` 연결 (2026-10-15, 사용자 "우편함 대칭만 고치고 바로 가자"): 우편함 기둥·봉투를 통 가운데(x=81)로. `PlayScreen` 이 숲 맵·`Nyamnyam`·`Progress` 대신 `GardenScene` 전체 화면(세로=`tall`, 가로=`wide`, `matchMedia` + `useSyncExternalStore`). 몸짓: 축하 중 `celebrate` / 들기·끝남 `wait` / 새 부품 뒤 2.4초 `point` / 그 외 `hello`. 장면 진행률 = 먹은 비율 ÷ 마지막 단계 기준(95%) → 7단계 완성 응원과 장면 완성이 같은 순간. % 칩(`role=progressbar`, `showPercent` 끄면 sr-only)과 배불러요·새 그림 시작 버튼은 오른쪽 위(아래쪽은 부품이 자라는 자리라 가리지 않게). 냠냠이 탭 = `GardenScene` `onChickTap`(SVG `role=button`, 그래서 장면 svg 는 `role=group`), 말하는 부리 = `mouth` MotionValue 를 `Chick` 의 `mouth` 슬롯에 `motion.path` 로(Chick 은 서버 컴포넌트 시안 페이지에서도 쓰므로 motion 을 직접 import 하지 않음). 단계 대사를 우체국 장면에 맞게 교체(`content/lines.ts`). `Progress.tsx` 삭제. 숲 맵(`components/maps/`)·`characters/Nyamnyam` 은 테마 확장용으로 남겨 둠(현재 미사용). Codex 리뷰 3건(완성 시점 95%/100% 어긋남, 부리 동기화, 포커스 표시) 모두 반영. lint·typecheck·test 42·e2e 12 통과, 기준 스크린샷 6장 다시 만듦.
- 1단계 세팅 (2026-10-14), `main` 첫 커밋 + `dev` 브랜치 생성
- 문서 뼈대: README, `docs/SPEC.md`(원본 요구사항), `docs/FIRMWARE_NOTES.md`, `docs/ASSETS.md`, `CLAUDE.md`
- 2단계 무게 엔진 (2026-10-14): `lib/weight/{types,constants,filter,simulator}.ts`, `lib/meal/machine.ts`, 테스트 3파일
- 4단계 반응형 (2026-10-14): `e2e/play.spec.ts` + 기준 스크린샷 6장(`e2e/play.spec.ts-snapshots/`), 맵 viewBox 를 핵심 영역으로, 말풍선 `break-keep`, 세로 태블릿 패널 가운데 정렬
- 3단계 아이 화면 MVP (2026-10-14): `/play`, `components/{maps/forest,characters,play}`, `lib/audio/{sfx,voice}.ts`, `content/lines.ts`, `lib/meal/stage.ts`, `lib/weight/index.ts`. 실제 Chrome에서 한 끼 전체(빈 식판 → 담기 → 7단계 완성·무지개·도장, 들기·터치·배불러요) 확인

## 진행 중인 것

- (완료, 위 "완료된 것" 참고) **식사 화면 정원 재설계** (2026-10-14 사용자 요청, 5단계보다 먼저): 오른쪽 베이지 패널 제거 → 정원 한 장면. 화단 가운데 사과나무가 진행률에 따라 연속으로 자람(잎·덩어리·꽃·사과가 몇 %마다 하나씩), 냠냠이는 화단 옆에 서서 반응, 진행 점·막대·%는 없앰, 시뮬레이터는 보호자 메뉴로.
  - 시안 아티팩트(1차→2차→3차 비교, 성장 8컷, 몸짓 6가지): https://claude.ai/artifact/E5RGwdW2v89NA93m5Eog8Z (Version 3). 공유 상태는 "링크가 있는 누구나"(사용자 설정).
  - 코드: `components/garden/` (`style.ts` 그림 규칙·색, `Backdrop`, `Plant`(p→부품), `Chick`(몸짓 6가지 + `Bubble`), `GardenScene`(wide/tall 배치, 카메라 고정)), 시안 페이지 `app/design/garden`(개발 모드 전용, `?layout=tall`). 아직 `/play` 에 연결 안 됨, **커밋 안 함**(작업 트리에 3차 코드 + `vitest.config.mts` 의 `components/**/*.test.ts` include 변경, 테스트 33개 통과).
  - 2026-10-14 2차 다듬기(사용자 "A로 다듬어줘"): `style.ts` 에 `wobble`(손그림 타원)·`scallop`(잎 덩어리 가장자리)과 테스트(`style.test.ts`, vitest include 에 `components/**` 추가). 선 굵기 3단계 `LINE 5`(나무·병아리) / `MID 3.5`(화단·팻말·말풍선) / `THIN 2.5`(울타리·덤불), 구름·언덕은 선 없음. 배경 채도 낮춤, 울타리 말뚝 높이·기울기 변화, 줄기 휘어짐·뿌리(밑동 윤곽선 없음). 냠냠이 머리:몸 약 3:2, 표정 6가지 `idle/look/wow/yum/cheer/wait`(`CHICK_POSES`), 날개 각도는 머리에 가리지 않게 105° 이하. 시안 페이지에 표정 줄(`data-state="faces"`). 아티팩트 Version 2 에 1차·2차 비교 포함.
  - 2026-10-14 3차(사용자 "Codex 의견 물어봐" → Codex "4~8세보다 영유아용 장면 같다, 표정만 있고 행동 없음, 보상이 예측 가능" → 사용자 "그렇게 진행해"): 냠냠이 머리:몸 약 1:1, **몸짓 6가지** `idle/peek/sniff/wave/cheer/wait`(`POSES` 표: lean·tilt·face(3/4 시점)·wings·sit), wave 날개는 머리 앞에 그림. 나무는 **팔(|dx|>=150) 잎 덩어리가 가지부터**: 가지가 왕관 밖으로 뻗고(`BRANCH_LEAD` .07) 끝에 잎 → 작은 덩어리 → 커짐, 가지는 왕관 위에 계속 보임(`Crown` 을 core/arm 두 번 그림). 꽃은 봉오리(`BUD_LEAD` .06) 후 열림. 카메라 고정(near/far 보간 제거), 말풍선 글자 25·선 연하게, 울타리 opacity .6. 시안 페이지에 성장 8컷(`data-state="growth"`). Codex 리뷰 2회 더(3차 평가 → 반영 → 확인 "두 가지 고치고 애니메이션으로 넘어가도 됨" → 반영). 아티팩트 Version 3.
  - 2026-10-15 사용자 결정: **Codex 에게 백지에서 새 시안을 그리게 하고 3차와 비교**. 3차 코드·캡처·시안 페이지·Codex 평가 원문은 git 밖 `C:/dev/_backup/nyamnyam-garden-v3/` 에 백업(`code/`, `shots/`, `board/`, `codex-answer*.md`, 캡처 스크립트 `garden.mjs`). Codex 작업 지시서 `C:/dev/_backup/nyamnyam-garden-v3/CODEX_BRIEF.md`. Codex 캡처 출력은 `tmp-design/`(`.git/info/exclude`). **Codex 사용량 한도로 대기 중**(2026-10-15 오전 1:37 해제 안내). 실행 직전에 작업 트리의 `components/garden/`, `app/design/garden/` 를 비우고 `codex exec -s workspace-write` 로 지시서를 넘긴다.
    - 이어서 할 순서: **사용자가 "진행해" / "내일 진행해" / "이어서 해" 라고 하면 묻지 말고 바로 실행** (사용자가 2026-10-15 미리 승인): `C:/dev/_backup/nyamnyam-garden-v3/run.sh` 를 순서대로 — ① `run.sh check` (dev server 가 200 이 아니면 `nyamnyam-canvas` 에서 `npm run dev` 를 백그라운드로) ② `run.sh probe` (exit 2 = Codex 한도 → 해제 시각을 알리고 멈춤) ③ `run.sh clear` ④ `run.sh codex` (10~30분, **백그라운드로**) ⑤ `run.sh verify` (실패·허용 범위 밖 변경·`any` 는 직접 고치지 말고 보고) ⑥ `run.sh shots` ⑦ 3차 캡처(`shots/`)와 Codex 캡처(`shots-v4/`)를 나란히 비교하는 페이지를 같은 아티팩트 URL 에 Version 4 로 게시하고 Codex 보고(`codex-v4-answer.md`) 요약과 함께 사용자에게 어느 쪽으로 갈지 묻기. 3차를 고르면 `run.sh restore`. 커밋은 하지 않는다. 프롬프트·스크립트는 모두 그 폴더에 있다(`probe.md`, `probe-*.mjs`, `CODEX_BRIEF.md`, `garden.mjs`). 2026-10-15 확인: 이 PC 에서 localhost:3005 fetch 200, Playwright Chromium 실행 OK, 백업과 작업 트리 일치. Codex 샌드박스 안에서도 되는지는 ② 에서 확인.
  - 2026-10-15 실행: probe 결과 Codex 샌드박스에서 localhost:3005 fetch OK·view_image OK·**Chromium 실행 불가(spawn EPERM)** → 샌드박스 밖 캡처 서버 `capture-server.mjs`(:3007, `GET /shoot?tag=`)를 띄우고 Codex 는 `shoot.mjs <태그>` 로 캡처를 받아 직접 보며 반복(지시서에 반영). `run.sh clear` 후 `run.sh codex` 시작(Codex 결과·로그는 `codex-v4-answer.md`, `codex-v4-log.txt`, 캡처는 `tmp-design/<태그>/`). 캡처 서버는 세션이 끝나면 꺼짐.
  - 2026-10-15 Codex 4안 완료: 주제 **‘바람 우체국’**(디딤돌 길→우체통→계단→우체국→지붕→망원경→편지 돛배, `growth.ts` `GROWTH_STAGES`), 냠냠이는 팔다리·스카프, 몸짓 5가지 `hello/point/wonder/celebrate/wait`. 파일 `components/garden/{Chick,GardenScene,growth,growth.test,ScenePreview}.tsx|ts`. lint·typecheck·test(36) 통과, 허용 범위 밖 변경·`any` 없음, 페이지 오류 0. 발견한 문제: 부품이 clipPath 로 **아래→위 잘린 채 드러남**(단계 중간엔 반쯤 잘린 모양), 아이 화면에 제목·로고 글자, 시작 화면 위쪽이 빔, 배불러요 버튼 대비 낮음. 작업 트리에는 지금 **4안**이 있고, 4안 사본 `code-v4/`, 캡처 `shots-v4/`. 비교 페이지를 아티팩트 Version 4 로 게시(원본 `C:/dev/_backup/nyamnyam-garden-v3/compare/`). **사용자 선택 대기**: 3차(`run.sh restore`) / 4안(고친 뒤 연결) / 섞기.
  - 2026-10-15 사용자 결정: **4안을 Codex 가 고치기(v5)**. 지시서 `C:/dev/_backup/nyamnyam-garden-v3/CODEX_BRIEF_v5.md` — 4~6세 기준, 채도 높이기, clipPath 잘림 금지 → 온전한 조각이 하나씩 생기며 motion 으로 짓는 애니메이션(`data-state="build"` 자동 재생 섹션 추가), 냠냠이를 하츄핑 수준으로 귀엽게(닮게 그리지는 않음 — 큰 머리·반짝이는 큰 눈·볼터치, 스카프·막대 다리 제거), 아이 화면 제목·로고 글자 제거, 배불러요 대비. 결과 `codex-v5-answer.md`·`codex-v5-log.txt`, 캡처 `tmp-design/v5-*`. 4안 사본은 `code-v4/`.
    - 2026-10-15 v5 완료: 온전한 조각 38개가 각각 0.55초 내려앉음, 맑은 하늘·선명한 풀색, 냠냠이 큰 머리·하이라이트 눈·볼터치·통통한 발(스카프·배 무늬·막대 다리 제거), 배불러요 진한 청록. lint·typecheck·test(37) 통과, 범위 밖 변경·`any` 없음. 사본 `code-v5/`, 캡처 `shots-v5/`. 작업 트리에는 **v5**. 짓는 애니메이션(`build` 섹션)은 브라우저에서 아직 눈으로 확인 안 함. **사용자 확인 대기**.
    - 2026-10-15 사용자: "v5가 지금까지 가장 괜찮다, 그런데 허전하고 생기는 게 적다" → v6 지시서 `CODEX_BRIEF_v6.md`: v5 유지 + 사건 30~40개(간격 ≤4%, 테스트), 주변 풍경도 자람(꽃·나무·가랜드·바람개비·새·편지 등), 생긴 것 계속 움직임, 생길 때 반짝임·퐁 강조와 냠냠이 시선, 30~35%에 작고 완성된 우체국 먼저 → 덧붙여 커짐, growth 12컷. 결과 `codex-v6-answer.md`, 캡처 `tmp-design/v6-*`. v5 사본 `code-v5/`.
    - 2026-10-15 v6 완료: 사건 34개(최대 간격 3%), 33%에 지붕까지 있는 우체국, 마을 소품, 계속 움직이는 요소 6개. lint·typecheck·test(40) 통과, 범위 밖 변경·`any` 없음. 사본 `code-v6/`·`shots-v6/`, 작업 트리에는 **v6**. 비교 페이지(v5 vs v6) 아티팩트 Version 5, 원본 `compare56/`. 눈에 띈 점: 새 소품이 연한 파스텔이라 바래 보임, 100% 등불이 작고 모호함, 돛배가 지붕 위에 얹힘, 0~27% 하늘 빔. **사용자 선택 대기**.
    - 2026-10-15 사용자: "v6에 바람개비, 새 모양, 어색한 위치 다듬자" → v7 지시서 `CODEX_BRIEF_v7.md`: 종이 바람개비(4장 날개·외곽선, 냠냠이와 안 겹치게), 파랑새(냠냠이와 다른 색·실루엣), 가랜드·풍선·돛배·나무/울타리·망원경·꽃/연못 위치 정리, 100% 사건을 큰 '완성' 사건으로, 소품 채도·외곽선, 초반 하늘 채우기. 결과 `codex-v7-answer.md`, 캡처 `tmp-design/v7-*`. 끝나면 v6 vs v7 비교를 아티팩트 Version 6 으로.
    - 2026-10-15 v7 완료(Codex): 종이 바람개비, 파랑새, 가랜드 처마·풍선 우체통·돛배 연못·망원경 땅, 100% = 우편 깃발+점등, 소품 채도·외곽선, 하늘 편지 9%. 사본 `code-v7/`·`shots-v7/`.
    - 2026-10-15 Claude 직접 반영(아래 ①② 완료): `Chick.tsx` 날개를 한 모양(`WING`)+각도·길이로 통일, 모든 변형을 CSS `transform`(`.chick-move`, `transform-box: view-box; origin 0 0` = 로컬 원점) + `transition` 560ms 넘침 곡선으로 → 몸짓 사이가 이어짐. 반복 동작은 `garden.css` 키프레임(숨쉬기·깜빡임·흔들기·점프·쉬기 흔들림·반짝이), `data-ambient` 로 화면 밖 정지, reduced-motion 이면 끔. JS 애니메이션·`motion` 안 씀. 꽃 `Flowers` 꽃잎 5장+잎 2장, 꽃밭별 색(`edge`/`heart` prop), `.garden-bloom` 피어남. 시안 페이지에 `data-state="poses-live"`(`PoseLoop`, 2.4초마다 몸짓 순환). 테스트 2개 기대값을 새 마크업에 맞춤(시선 `transform:translate(…px…)`, 냠냠이 `data-ambient="true"` 는 소품 수에서 제외). lint·typecheck·test 42 통과, 페이지 오류 0. 사본 `code-v7c/`·`shots-v7c/`(전환 프레임 `blend.png`). 비교 페이지 v6 vs v7 = 아티팩트 Version 6(원본 `compare67/`). 작업 트리에는 **v7+Claude 수정**. **사용자 확인 대기**, 커밋 안 함.
    - (완료) v7 다음에 **Claude 가 직접**(Codex 아님) 할 것 — 사용자 요청 2026-10-15: ① 냠냠이 애니메이션(지금은 전혀 없음, 몸짓이 순간 교체) — `motion` 스프링으로 몸짓 사이 보간 0.4~0.6초, 숨쉬기·눈 깜빡임, 몸짓별 동작(인사 흔들기·축하 점프+착지 찌그러짐·기다림 흔들기·새 사건 쪽으로 고개), reduced-motion 이면 반복 동작 끔, 시안 페이지에 몸짓 자동 재생 칸. ② **꽃 모양이 이상함**(`WorldPieces.tsx` `Flowers`: 꽃잎이 한 덩어리 얼룩 path 라 꽃잎이 구분 안 되고, 잎이 줄기를 감은 고리처럼 보임) → 둥근 꽃잎 5장이 구분되는 꽃 + 줄기 양옆 잎 두 장으로.
  - 승인 후 할 일: `/play` 를 `GardenScene` 으로 교체(motion 등장·잎 펼침·병아리 시선), 대사를 성장 부품 순간에 맞게 `content/lines.ts` 갱신, 보호자 메뉴(시뮬레이터·상태·처음부터), 기존 숲 맵/`Progress`/패널 제거, e2e 기준 스크린샷 다시 만들기.
  - 참고 자료 확인 범위: 베베핀 스토어 스크린샷만(트레일러 X), 핑크퐁 홍보 영상 프레임만(음성 X), Sago Mini 홍보 영상 프레임만. 요청에 적힌 "첨부 이미지"는 메시지에 없었음.

## 다음 할 일 (우선순위 순)

1. 5단계 테마 확장 (2026-10-15 사용자 결정: 숲 대신 아이들이 좋아할 세계 3개 — **바람 우체국**(현재), **바다 왕국**(바닷속 궁전), **우주 외계인 마을**(행성 위 기지). 셋 다 "먹는 만큼 하나씩 지어지는" 같은 구조, 우체국처럼 부품 30~40개): 테마 구조·선택 화면·대사는 Claude, 장면·포동이(곰)·반짝이(별) 그림은 Codex(우체국 v7 수준), 비교 페이지로 확인. 2026-10-15 Codex v8 완료(**미커밋**, 사용자 확인 대기): `components/garden/themes.tsx`(`GardenTheme`, `THEMES.post/sea`), `SeaTheme.tsx`(바다 왕국 사건 34개, 33% 조개 궁전, 100% 고래+불빛, 움직이는 것 8개), `PostBackground.tsx`, `themes.test.ts`, `GardenScene` 에 `theme` prop(기본 `post`, `/play` 그대로), 시안 페이지 `?theme=sea`. lint·typecheck·test 54·e2e 12 통과. 사본 `C:/dev/_backup/nyamnyam-garden-v3/code-v8/`, 캡처 `shots-v8-sea/`, 비교 페이지 아티팩트 Version 7(원본 scratchpad `compare-sea`). 사용자 피드백("거북이 등껍질이랑 눈에 걸리는 것 수정") → Claude 직접 수정 v8c: 거북이 다시 그림, `sand-dollars` → `sea-snails`(소라 2개), 해마 가로 위치 `[935,425]`(해초 위). 사본 `code-v8c/`, 캡처 `shots-v8c/`. 사용자 질문 "캐릭터가 살짝 변한 것 같다" → `Chick.tsx` 무변경·우체국 e2e 픽셀 동일 확인(바다 완성 컷은 celebrate 몸짓+배경 차이). 캐릭터는 테마와 따로 같은 자리에 불러오는 구조. 사용자 "거북이 등껍질 가운데 연초록 빼" → 가운데 무늬 채움 없음(선만). Codex v9 우주 외계인 마을: 사용량 한도로 보고서 직전에 멈췄지만 `v9-final` 캡처까지 완료(`SpaceTheme.tsx` 사건 34개, 33% 돔 기지, 로켓 부품 조립, 100% `launch-finale` 로켓 점화·연기, `space.test.ts`, `THEMES.space`, 시안 `?theme=space`). Claude 수정: `pet-friend` 를 동글동글한 외계 강아지로 다시 그림, 왼쪽 수정 위 분화구 삭제. lint·typecheck·test 61·e2e 12 통과, **미커밋**. 사본 `code-v9/`, 캡처 `shots-v9-space/`. 세 테마 비교 페이지 아티팩트 Version 8(원본 scratchpad `compare-sea`). 남은 점: 바다 세로 화면 아래 소품 밀집. **사용자 확인 대기** → 확인되면 커밋·push. 2026-10-15 Codex 한도(오후 9:14 해제) 동안 Claude 작업(**미커밋**): ① 테마 선택 화면 — `/play` 시작 화면의 "시작하기" 대신 "오늘은 어디로 놀러 갈까?" + 테마 카드 3장(완성 미리보기 `GardenScene`, 한 번 누르면 그 테마로 시작, 세로 화면은 카드 세로 쌓기). `PlayScreen` 의 `started` 는 `theme !== null`. e2e 는 "바람 우체국" 카드를 누름. ② 테마별 대사 — `content/lines.ts` 단계 응원·완성 대사를 `sea:stage1` 같은 키로 테마별(우체국은 기존 키), `pickLine(character, key, turn, theme)`. 테스트 62·e2e 12 통과. ③ 캐릭터 구상 `docs/CHARACTERS.md`(포동이=꿀빛 아기 곰+파란 선원 모자, 단짝 바다 / 반짝이=복숭아빛 누나 별+혜성 리본, 단짝 우주 / 냠냠이 단짝 우체국, 캐릭터와 테마는 따로 고름, 피할 유명 캐릭터 목록, 말투 예시, 화면 흐름 제안). Codex 지시서 초안 `CODEX_BRIEF_v10.md`, 캡처 서버·`shoot.mjs` 에 `character` 인자 추가(`shoot.mjs <태그> <테마> <캐릭터>`). 2026-10-15 22시 Codex 리뷰 지적 없음 → 테마 3종+선택 화면+대사+캐릭터 구상 한 커밋으로 dev push(위 "미커밋" 표시는 모두 이 커밋에 들어감). 같은 날 사용자 "테마 선택 화면에서 캐릭터 몸 테두리가 너무 두껍다" → 원인: 몸통·날개의 `vector-effect: non-scaling-stroke` 가 작은 미리보기에서도 화면 기준 3.5px 로 남음. 몸통은 제거(비균일 크기 변화가 wait 의 1.08×0.83 뿐이라 차이 없음), 날개는 포즈마다 가로로만 최대 2배 늘어나서 유지하고 시작 화면의 `.start-chick`·`.theme-card-scene` 에서만 컨테이너 단위(`cqw`)로 실제 배율에 맞춘 굵기를 줌. 사용자 질문 "시작 화면이 밋밋한데 나중에 고치나" → 캐릭터 선택 화면을 붙일 때 함께 꾸미기로 제안. 사용자 "캐릭터부터, 포동이 대신 보노보노 같은 해달·티니핑 느낌, 별은 괜찮다" → **퐁당이(아기 해달, id `pongdang`, 하준)** 로 교체: 라떼 갈색, 크림 얼굴, 아주 큰 반짝 눈, 분홍 가리비 머리핀, wait 는 배 위에 조개. 보노보노(하늘색·점 눈·흰 주둥이 점 둘)·티니핑 특정 생김새·"-핑" 금지. `docs/CHARACTERS.md`·SPEC §4-1/§13·`CODEX_BRIEF_v10.md` 갱신, Codex v10 완료(**미커밋**): `characters.ts`(레지스트리), `Pongdang.tsx`, `Banjjak.tsx`, `characters.test.ts`, `GardenScene` `character` prop, 시안 `?character=`. lint·typecheck·test 72 통과, 냠냠이 기본 렌더 동일(Codex 50컷 해시). 사본 `code-v10/`, 캡처 `shots-v10/`, 비교 페이지 Version 9. Claude 가 본 약점: 퐁당이 hello 가 손 흔들기보다 볼 긁기처럼 보임 / 반짝이 끝이 뾰족(구상은 둥근 끝)·외곽선 얇고 연함·냠냠이보다 큼·몸짓 5가지 정지 화면에서 비슷·혜성 리본이 꽃처럼 보임. 사용자 "반가워·우와에서 팔이 잘린 것처럼 보임, 반짝이 외곽선은 그대로, 나머지는 제안대로" → Claude 수정: 퐁당이 팔을 어깨에서 시작하는 한 덩어리 팔(`ARM` 고정 길이, 포즈는 어깨 위치·각도만 → 전환·손 흔들기 중에도 몸과 이어짐, `scale` 제거), 반가워=팔을 머리 옆으로 들어 흔들기, 우와=어깨에서 올라온 팔로 볼 감싸기, 해냈어=가슴 앞 ∧ 박수. 반짝이 `starPath(left,right)` 모든 꼭짓점을 같은 L/Q 로 둥글게(끝 반경 24~26), 팔 끝 94(냠냠이 크기에 맞춤, 시안 틀 밖으로 잘리던 반가워 팔 해결), 몸짓별 팔 위치를 확실히 다르게(우와=팔 올림+동그란 입, 쉼=팔 내림), 혜성 머리핀(둥근 머리+꼬리). 외곽선 색·굵기는 그대로. 사용자 "해달 해냈어 어색, 함께 쉴게 얼굴·몸이 떠 있음" → 해냈어=가슴 앞 박수(앞발이 겹쳐 팔짱처럼 보임) 대신 두 팔 번쩍 만세+위로 흔들기(`pongdang-cheer-l/r`), 함께 쉴게=몸 눌림 0.92·머리 10 내려 몸에 붙임. Codex 디자인 평가(`codex-v10r-design.md`, 읽기 전용) 반영: 반짝이 왼쪽 위 작은 반짝이를 팔에서 떼어 `[-104,-214]`, 눈·속눈썹 5 내림. 반영 안 한 것: 퐁당이 꼬리 끝 좁히기(선택 사항), 함께 쉴게의 조개 안기가 보노보노를 연상시킨다는 지적(실제 해달 습관이라 유지, 사용자에게 알림). Codex 코드 리뷰 지적 없음 → 커밋·dev push(`39e4835`). 2026-10-15 다음 단계(**미커밋 → 이 커밋**): ① 대사 — `content/lines.ts` 에 퐁당이(해맑은 장난꾸러기, "퐁당!" "둥실둥실")·반짝이(다정한 누나, "~구나~") 전체 키(공통 + 테마 3종 단계·완성), TTS 음높이 `pongdang 1.35/1.0`, `banjjak 1.15/0.9`. ② 시작 화면 `components/play/StartScreen.tsx`+`start.css` — "누구랑 먹을까?"(캐릭터 카드 3장, 단짝 테마 색 테두리·이름 띠, 누르면 그 목소리로 인사) → "오늘은 어디로 놀러 갈까?"(단짝 테마가 맨 앞, 미리보기에 고른 캐릭터, "다른 친구 고르기") → 식사. 배경 하늘 그라데이션·구름·편지·물방울·별·세 언덕, 제목 글자가 한 번 통통 등장(reduced-motion 정지). `PlayScreen` 에 `character` 상태, 시작 화면 동안 뒤 장면은 `inert`+`aria-hidden`(e2e 에서 냠냠이 버튼이 두 개 잡혀 발견). Codex 리뷰 3회: 다시 고를 때 인사 상태 초기화·이전 인사 무시(`pick` 번호), 시작 화면에서 떠나도 음성 정지(언마운트 effect 분리), 인사가 터치로 끊겨도 안내는 진행 → 마지막 리뷰 지적 없음. e2e 는 "냠냠이" → "바람 우체국" 순서로 누름. lint·typecheck·test 78·e2e 12 통과. **호버·터치(누름) 애니메이션**: 2026-10-15 사용자 "따로 요청하기 전까지 구현하지 말 것" — 현재 SPEC 단계에 항목 없음(있는 것은 §5 버튼 "톡" 소리와 기존 `active:translate-y-px` 1px 눌림뿐), 넣는다면 8단계 마무리(접근성과 함께) 제안. **다음 순서**: 사용자에게 캐릭터 구상 확인 → `CODEX_BRIEF_v10.md` 로 Codex 실행. 그다음: 곰·별 캐릭터 → 테마 선택 화면·대사
2. 클로바더빙 음성 제작(13장): 대사(`content/lines.ts`) 확정 → `docs/VOICE_SCRIPT.md` 생성 → 사용자에게 자동화 약관 허용 여부 확인 후 Chrome 작업. 대사 수: 냠냠이 21줄

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
- **애니메이션은 Motion + 코드 SVG**: 무게에 실시간으로 반응해야 해서 코드로 제어해야 한다. Lottie/Rive는 디자인 툴 파일이 필요해 보류. 캐릭터는 컴포넌트 단위로 분리해 나중에 교체 가능하게. `motion` 14.2 (`motion/react`). `<MotionConfig reducedMotion="user">` 로 `prefers-reduced-motion` 존중.
- **글꼴**: 아이 화면 Jua(`font-kid`), 부모 화면 Noto Sans KR(`font-sans`). `next/font/google` 로 자체 호스팅.
- **Next.js 16.4 기본값 유지**: `cacheComponents: true`, `partialPrefetching: true`, Tailwind는 PostCSS 대신 `@tailwindcss/turbopack` 로더. 코드 쓰기 전에 `node_modules/next/dist/docs/` 확인.
- **`@types/node` 24**: vitest 5가 `@types/node` 22 이상을 요구해서 20에서 올림(로컬 Node 24.19).
- 개발 서버 포트 3005 (다른 프로젝트가 3000~3004 사용).
- **영점은 빈 저울(식판 없음) 기준** (2026-10-14): 스펙의 "식판 들어올리기 = 0g" 과 상태 이름 `EMPTY_TRAY` 에 맞춘 해석. 그래서 무게에 식판이 포함되고, 상태 머신이 먼저 빈 식판 무게(`trayG`)를 3초 유지로 잡은 뒤 음식이 20g 이상 더 올라와 3초 유지되면 `SERVED`(음식 = 시작 무게 − 식판). 2026-10-14 사용자 확인 완료.
- **진행 계산 방식**: `lowG`(지금까지의 최저 안정 무게) 아래로 3g 이상 내려간 만큼만 `eatenG` 에 더한다. 그래서 순간 튐·손 올림 같은 증가는 자연히 무시되고, 진행률은 `max` 로 유지돼 줄지 않는다. 남은 음식이 3g 이하면 자동 `ENDED`.
- **추가 배식**: `lowG` 보다 30g 이상 늘어 3초 유지되면 처리. `count` = 음식 무게에 더함, `ignore` = 아무것도 안 바꿈(추가분을 먹어도 이전 최저 아래로 내려가기 전엔 진행 없음).
- **비정상 감지**: 무게가 흔들리기 시작한 시각부터 다시 안정될 때까지에서 필터 안정화 1초를 뺀 시간이 2초 이하이고, 그동안 음식 무게의 50% 이상이 줄면 `heldG` 로 보류하고 진행에 넣지 않는다. 지금은 보류분을 나중에 인정하는 기능은 없다.
- **숲 그림 구조**: `components/maps/forest/Stage1~4`(씨앗→새싹→작은 나무→큰 나무)는 서로 교체, `Stage5~7`(꽃, 열매, 새+무지개)은 위에 쌓는다. viewBox 800×600, 나무 뿌리 (400,458). 배경은 `overflow=visible` 로 viewBox 밖까지 그려 어떤 비율에서도 빈 곳이 없다(장면 `section` 이 `overflow-hidden`). 팔레트는 `forest/palette.ts` 7색.
- **음성**: `speak()` 가 `public/voices/<character>/<lineId>.mp3` 를 먼저 재생하고, 없으면(재생 실패) 브라우저 TTS. 입 모양은 `MotionValue` (mp3 = AnalyserNode 음량, TTS = 말하는 동안 사인파)로 리렌더 없이 움직인다. 새 대사는 이전 대사를 끊는다.
- **효과음**: `lib/audio/sfx.ts` 에서 사인/삼각파 + 짧은 엔벨로프로 합성. 첫 "시작하기" 탭에서 `AudioContext` 와 TTS 를 깨운다(iOS).
- **맵은 핵심 영역에 맞춘다** (4단계): `ForestMap` viewBox 는 전체 800×600 이 아니라 `170 85 460 465`(나무·꽃·새·무지개 꼭대기). `meet` + `overflow=visible` 이라 이 영역은 어느 비율에서도 다 보이고, 남는 공간은 viewBox 밖까지 그린 배경이 채운다. 해는 (655,110)이라 좁은 세로 화면에서는 잘릴 수 있다(의도). 새 맵도 같은 방식으로 핵심 영역을 정한다.
- **아이 화면 레이아웃**: 가로(`landscape:`, 너비 무관)는 그림 7 : 패널 3, 세로는 위 그림 / 아래 패널. 스펙은 "가로 ≥768px" 이지만 휴대폰 가로(667px)도 세로 배치로 떨어지면 그림이 찌그러져서 방향만으로 나눴다. 세로 패널 내용은 최대 40rem 폭으로 가운데(`px-[max(1rem,calc(50%-20rem))]`), 말풍선은 `break-keep text-balance`(한국어 단어 중간에서 줄바꿈 방지).
- **축하·도장**: 7단계 도달 시 컨페티 3.8초 + 캐릭터 춤 + 팡파레. 식사가 70% 이상으로 끝나면(자동 완료는 축하 뒤 4초, 배불러요는 바로) "참 잘했어요" 도장. 도장 저장·주간 도장판·앨범은 6단계(DB)에서.
- **무반응 말 걸기**: 먹은 양이 30초 변화 없으면 기다림 대사, 한 끼에 최대 3번(`lib/meal/stage.ts` 기본값). 식판이 들려 있으면 세지 않는다.
- **시뮬레이터는 실제 기기와 같은 파이프라인**: 10Hz 샘플 → `filterStep` → `shouldTransmit`. 식판 350g, 꾹 누르기 +120g 0.6초, 노이즈 ±2g. 그래서 필터·상태 머신을 부품 없이 시험할 수 있다.

## 알려진 문제와 주의점

- `npm audit` high 7건(2026-10-14): 전부 `shadcn` CLI 패키지 → fast-glob/micromatch/braces 경로(글롭 패턴 DoS). `globals.css` 가 `shadcn/tailwind.css` 를 쓰려고 dependencies 에 들어가 있을 뿐 브라우저 런타임엔 없음. `npm audit fix --force` 는 shadcn 1.0.0 으로 내리므로 하지 말 것 — shadcn 업데이트 때 다시 확인.
- `next dev` 가 `AGENTS.md` 를 다시 쓴다. 규칙 추가는 `CLAUDE.md` 에.
- 상태 머신 한계(UX로 안내 필요): 음식을 담은 식판을 처음부터 올리면 그 무게를 빈 식판으로 잡아 `SERVED` 가 안 된다 → 3단계 화면에서 "빈 식판을 올려 주세요 → 음식을 담아 주세요" 순서 안내 + 다시 시작 버튼. 음식을 나눠 담다가 3초 멈추면 그때 무게로 시작되고 나머지는 추가 배식으로 처리된다.
- 비정상 감지는 양이 적을 때 민감하다(음식 40g에 한 입 20g이면 보류). 부모 설정에서 끌 수 있다.
- `WeightSource` 인터페이스에 상태 변경 알림이 없다(스펙 그대로 `status` 속성만). 7단계 `SupabaseRealtimeSource` 에서 offline 표시가 필요할 때 추가 검토.
- 시뮬레이터 패널은 `NODE_ENV !== "production"` 에서만 보인다. 그래서 Vercel 배포본에서는 무게를 넣을 방법이 없다 → 8단계 "시연 모드" 에서 해결.
- 그림 완성 방식은 지금 (A) 먹은 양 기준만. (B) 식사 횟수 · (C) 누적 양은 6단계.
- 설정값(퍼센트 표시, 배불러요 버튼, 도장 기준 70%)은 `PlayScreen.tsx` 의 `SETTINGS` 상수 — 6단계에서 DB 설정으로 교체.
- mp3 가 없는 대사는 재생 시도 때 콘솔에 404 가 찍힌다(TTS 로 넘어감). 음성 파일이 생기면 사라진다.
- 시뮬레이터로 시험할 때: 음식을 올린 뒤 약 5초(필터 안정 ~2초 + 3초 유지)는 그대로 둬야 `SERVED` 가 된다. 그 전에 값을 바꾸면 유지 타이머가 다시 시작된다.
- Claude in Chrome 탭이 뒤에 있으면(`document.visibilityState === "hidden"`) motion 애니메이션이 멈춰 말풍선(`AnimatePresence mode="wait"`)이 이전 대사에 머문다. 스크린샷을 찍으면 따라잡는다 — 앱 버그 아님.
- Playwright 스크린샷 기준 파일은 Windows 용(`*-win32.png`). 다른 OS/CI 에서는 기준이 없어 처음엔 실패한다 → 그 환경에서 `npx playwright test --update-snapshots` 로 따로 만든다. 화면을 의도적으로 바꾸면 기준도 다시 만든다.
- 기준 스크린샷을 다시 만들 때 `--update-snapshots` 로 만든 6장에 Next 개발 표시 "1 Issue"(빨간 배지)가 찍혔다(2026-10-15, 원인 확인 필요 — 직전 서버 번들 불일치로 생긴 hydration 오류가 남은 것으로 보임). 기준 png 를 지우고 `npx playwright test play` 로 새로 쓰면 깨끗했다. 다시 만든 뒤 왼쪽 아래 배지가 없는지 확인할 것.
- 개발 서버가 켜진 채 컴포넌트를 고치면 `/play` 의 서버 렌더가 옛 코드로 남아 hydration 오류가 날 때가 있다 → 해당 파일을 `touch` 하면 다시 컴파일됨.
- `e2e/play.spec.ts` 는 개발 서버의 시뮬레이터 패널로 진행한다(TTS 는 지워서 결정적으로). 기기당 약 17초.
- Playwright 브라우저는 chromium만 설치. 기기 6종 모두 chromium 뷰포트로 흉내 낸다(실제 Safari 아님).

## 펌웨어 연동 상태

- 펌웨어 코드 없음. 데이터 계약·공유 상수·전송 규칙은 2단계에서 확정(웹 `lib/weight/`). seq 재부팅 문제는 미결. 배선과 상세는 [docs/FIRMWARE_NOTES.md](docs/FIRMWARE_NOTES.md).

## 파일 구조 지도

| 경로                                                        | 설명                                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `app/`                                                      | `layout.tsx`(글꼴), `page.tsx`(홈 → 식사 시작), `play/page.tsx`(아이 화면)                                    |
| `components/play/PlayScreen.tsx`                            | 아이 화면 본체: 소스 연결, 상태 머신, 대사·효과음·축하 연결                                                   |
| `components/play/{Progress,Celebration,SimulatorPanel}.tsx` | 진행 점·막대 / 컨페티·도장 / 개발용 시뮬레이터                                                                |
| `components/maps/Appear.tsx`                                | 등장 스프링, 살랑임(`Sway`), 반짝이(`Sparkles`)                                                               |
| `components/maps/forest/`                                   | 숲 맵: `Background`, `Stage1~7`, `ForestMap`(단계 → 레이어)                                                   |
| `components/characters/Nyamnyam.tsx`                        | 냠냠이 SVG (숨쉬기·깜빡임·입·점프·터치·춤)                                                                    |
| `content/lines.ts`                                          | 캐릭터 대사 전체 (부모 검토용) + 금지어 테스트                                                                |
| `lib/audio/sfx.ts`, `voice.ts`                              | 합성 효과음 / mp3·TTS 음성 + 입 동기화                                                                        |
| `lib/meal/stage.ts`                                         | 진행률 → 단계, 무반응 판단                                                                                    |
| `lib/weight/index.ts`                                       | `createWeightSource()` — 소스 선택 유일한 위치                                                                |
| `components/ui/`                                            | shadcn 컴포넌트 (부모 화면용)                                                                                 |
| `lib/utils.ts`                                              | shadcn `cn`                                                                                                   |
| `lib/weight/types.ts`                                       | `WeightReading`·`DeviceCommand`·`WeightSource` (펌웨어 JSON 계약)                                             |
| `lib/weight/constants.ts`                                   | 펌웨어와 공유하는 필터·전송 상수                                                                              |
| `lib/weight/filter.ts`                                      | 중앙값→이동평균→안정 판단, 전송 조건 (펌웨어 파이프라인 복제)                                                 |
| `lib/weight/simulator.ts`                                   | `SimulatorSource`: `setFood`·`bite`·`press`·`lifted`·`noise`, tare 명령                                       |
| `lib/meal/machine.ts`                                       | 식사 상태 머신 `mealReducer` + 기준 상수                                                                      |
| `e2e/`                                                      | Playwright: `smoke`(홈), `play`(아이 화면 5단계, 레이아웃 검사 + 스크린샷). 기기 6종은 `playwright.config.ts` |
| `docs/SPEC.md`                                              | 원본 요구사항 전체                                                                                            |
| `docs/FIRMWARE_NOTES.md`                                    | 하드웨어·데이터 계약·펌웨어 참고                                                                              |
| `docs/ASSETS.md`                                            | 출처 표기                                                                                                     |
| 예정                                                        | `supabase/`, `firmware/nyamnyam/`, `scripts/`                                                                 |

## 세션 기록

- 2026-10-14: 1단계 세팅. Codex 리뷰 지적 반영(`typecheck` 에 `next typegen` 추가 — `LayoutProps` 가 `.next` 에서 생성돼 새 clone 에서 실패했음). `main`·`dev` push 완료.
- 2026-10-14: 2단계 무게 엔진. 영점 기준(빈 저울)·진행 계산·추가 배식·비정상 감지 방식 결정(위 "주요 설계 결정"). Codex 리뷰 2건 반영: 불안정 값이 오면 3초 유지 타이머 초기화, 비정상 감지 시간을 필터·전송 지연과 무관하게 측정.
- 2026-10-14: 3단계 아이 화면 MVP. `motion` 설치. Chrome(가로)·Playwright(375/360 세로, 1024 가로)로 화면 확인. Next 개발 표시(`devIndicators`)는 시뮬레이터 패널을 가려서 끔. Codex 리뷰 2건 반영: `speak()` 가 정상 종료(true)/취소(false)를 구분해 취소된 대사가 TTS 로 다시 재생되거나 입 애니메이션이 남지 않게 함, 7단계 응원이 끊기면 완료 대사를 이어 붙이지 않음.
- 2026-10-14: 4단계 반응형. 7개 크기(6개 기기 + 휴대폰 가로 667×375) 스크린샷으로 확인 후 맵 viewBox·패널·말풍선 조정, 개발용 시뮬레이터 버튼을 왼쪽 위로 이동.
