# ASSETS — 사용한 소리·음성·이미지와 출처

> 유명 캐릭터, 브랜드, 저작권 음원과 이미지는 쓰지 않는다. 외부 파일은 CC0만 쓰고 여기에 출처를 적는다.

| 종류     | 항목                                                                                          | 출처 / 라이선스                                                                                                                       | 위치                                                               |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 글꼴     | Jua (아이 화면)                                                                               | Google Fonts, SIL OFL                                                                                                                 | `next/font/google`                                                 |
| 글꼴     | D2Coding 1.4.0 (부모 화면·시뮬레이터 등 본문)                                                 | NAVER 공식 웹폰트(`site/fonts`, 태그 VER1.4.0), SIL OFL — 예약 글꼴 이름이라 서브셋 등 수정본 배포 금지, 원본 그대로 사용             | `next/font/local`, `app/fonts/` (+ `D2Coding-OFL.txt`)             |
| 효과음   | —                                                                                             | Web Audio API로 직접 합성 (파일 없음)                                                                                                 | `lib/audio/sfx.ts`                                                 |
| 음성     | 캐릭터 대사 mp3 (냠냠이 Annie · 퐁당이 Deoksu · 반짝이 Anna Kim), 파일 없을 때만 브라우저 TTS | ElevenLabs Voice Library 목소리, `eleven_v4`(퐁당이는 `eleven_multilingual_v2`), Starter 유료 플랜(상업 라이선스)으로 2026-10-16 생성 | `public/voices/` (설정 `content/voices.ts`, 생성 `npm run voices`) |
| 일러스트 | 바람 우체국 장면·냠냠이(현재), 숲 맵(테마 확장용)                                             | 직접 만든 SVG 컴포넌트 (오리지널)                                                                                                     | `components/garden/`, `components/maps/`, `components/characters/` |
