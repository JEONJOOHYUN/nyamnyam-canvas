import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-kid text-5xl">냠냠캔버스</h1>
      <p className="text-muted-foreground">먹은 만큼 그림이 자라나요.</p>
      <Link
        href="/play"
        className="min-h-12 rounded-full bg-[#FF9A3C] px-8 py-3 font-kid text-2xl text-white"
      >
        식사 시작
      </Link>
    </main>
  );
}
