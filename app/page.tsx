import Link from "next/link";
import {
  CHARACTERS,
  type GardenCharacterKey,
} from "@/components/garden/characters";
import { BouncyTitle, StartDecor } from "@/components/play/StartDecor";

const FRIENDS: GardenCharacterKey[] = ["nyamnyam", "pongdang", "banjjak"];

// Same world as the child's start screen: sky, decor, bouncing title, the three friends.
export default function Home() {
  return (
    <main className="start-screen relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden font-kid text-[#244c50]">
      <StartDecor />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vmin,1.5rem)] p-6 text-center">
        <BouncyTitle />
        <p className="text-[clamp(1.1rem,3.6vmin,1.5rem)]">
          먹은 만큼 그림이 자라나요
        </p>

        <div className="flex items-end justify-center gap-[clamp(0.25rem,2vmin,1rem)]">
          {FRIENDS.map((key, i) => {
            const { Component } = CHARACTERS[key];
            return (
              <span
                key={key}
                className="start-chick home-friend block w-[clamp(5.5rem,17vmin,9rem)]"
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                <svg
                  viewBox="-130 -240 260 270"
                  aria-hidden="true"
                  className="size-full"
                >
                  <Component pose="hello" />
                </svg>
              </span>
            );
          })}
        </div>

        <Link
          href="/play"
          className="tap-pop min-h-14 rounded-full border-4 border-white bg-[#e8892b] px-10 py-3 text-[clamp(1.5rem,4.5vmin,2rem)] text-white shadow-[0_5px_0_#b8661a]"
        >
          식사 시작
        </Link>

        <div className="grid justify-items-center gap-2">
          <p className="text-[clamp(1rem,3vmin,1.2rem)] text-[#006b86]">
            저울 없이 체험해 보기
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/demo"
              className="tap-pop min-h-12 rounded-full border-[3px] border-[#167f9d] bg-white px-5 py-2.5 text-[clamp(1rem,3vmin,1.2rem)] text-[#167f9d] shadow-[0_3px_0_#9bcfe4]"
            >
              직접 해 보기
            </Link>
            <Link
              href="/demo/auto"
              className="tap-pop min-h-12 rounded-full border-[3px] border-[#6a4fc4] bg-white px-5 py-2.5 text-[clamp(1rem,3vmin,1.2rem)] text-[#6a4fc4] shadow-[0_3px_0_#cbbdf1]"
            >
              자동으로 보기
            </Link>
          </div>
        </div>

        <Link
          href="/parent"
          className="tap-pop min-h-11 rounded-full bg-white/80 px-5 py-2.5 text-[#245964] shadow-sm"
        >
          보호자 설정
        </Link>
      </div>
    </main>
  );
}
