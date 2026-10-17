import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center font-kid">
      <h1 className="text-5xl">냠냠캔버스</h1>
      <p className="text-muted-foreground">먹은 만큼 그림이 자라나요.</p>
      <Link
        href="/play"
        className="tap-pop min-h-12 rounded-full bg-[#FF9A3C] px-8 py-3 font-kid text-2xl text-white"
      >
        식사 시작
      </Link>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/demo"
          className="tap-pop min-h-11 rounded-full bg-white px-5 py-2.5 text-[#245964] shadow-sm"
        >
          저울 없이 체험해 보기
        </Link>
        <Link
          href="/parent"
          className="tap-pop min-h-11 rounded-full bg-white px-5 py-2.5 text-[#245964] shadow-sm"
        >
          보호자 설정
        </Link>
      </div>
    </main>
  );
}
