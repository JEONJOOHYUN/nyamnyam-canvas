import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GardenScene } from "@/components/garden/GardenScene";
import { Chick, CHICK_POSES, POSE_LABELS } from "@/components/garden/Chick";
import {
  BuildPreview,
  PoseLoop,
  ScenePreview,
} from "@/components/garden/ScenePreview";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function GardenDesignPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview"
  )
    notFound();
  return (
    <Suspense fallback={<div className="h-dvh bg-[#91dfff]" />}>
      <DesignGallery searchParams={searchParams} />
    </Suspense>
  );
}

async function DesignGallery({ searchParams }: { searchParams: SearchParams }) {
  const layout = (await searchParams).layout === "tall" ? "tall" : "wide";
  return (
    <main className="bg-[#edfbff] text-[#245964]">
      {(
        [
          {
            state: "start",
            progress: 0,
            pose: "hello",
            bubble: "너랑 함께라서 좋아.",
          },
          {
            state: "middle",
            progress: 0.58,
            pose: "point",
            bubble: "차근차근, 멋지게 해냈어!",
          },
          {
            state: "done",
            progress: 1,
            pose: "celebrate",
            bubble: "함께 만든 오늘, 참 멋져!",
          },
        ] as const
      ).map(({ state, ...props }) => (
        <section
          key={state}
          data-state={state}
          className="relative h-dvh overflow-hidden"
        >
          <ScenePreview {...props} layout={layout} />
        </section>
      ))}
      <section data-state="faces" className="px-8 py-12">
        <p className="text-xs tracking-[.2em] text-[#7f8e76]">
          NYAMNYAM · BODY LANGUAGE
        </p>
        <h2 className="mt-3 font-kid text-3xl">작은 날개, 큰 마음</h2>
        <div className="mt-8 flex gap-3 overflow-x-auto pb-4">
          {CHICK_POSES.map((pose) => (
            <figure
              key={pose}
              className="min-w-40 flex-1 rounded-3xl bg-[#d4f3ff] py-5"
            >
              <svg
                viewBox="-130 -240 260 270"
                role="img"
                aria-label={POSE_LABELS[pose]}
                className="w-full"
              >
                <Chick pose={pose} />
              </svg>
              <figcaption className="text-center font-kid text-xl">
                {POSE_LABELS[pose]}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section data-state="poses-live" className="px-8 pb-12">
        <p className="mb-4 text-center text-sm text-[#5d7a80]">
          몸짓이 2.4초마다 바뀌어요. 바뀔 때 이어지는 움직임을 보세요.
        </p>
        <PoseLoop />
      </section>
      <section data-state="growth" className="px-8 pb-12 pt-6">
        <p className="text-xs tracking-[.2em] text-[#7f8e76]">
          A WORLD, PIECE BY PIECE
        </p>
        <h2 className="mb-8 mt-3 font-kid text-3xl">
          한 걸음마다, 새로운 발견
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.55, 0.64, 0.73, 0.82, 0.91, 1,
          ].map((progress) => (
            <figure
              key={progress}
              className="overflow-hidden rounded-2xl border border-[#cbd1bc]"
            >
              <div className="aspect-[4/3]">
                <GardenScene
                  progress={progress}
                  layout="wide"
                  bubble={null}
                  pose={
                    progress === 0
                      ? "hello"
                      : progress === 1
                        ? "celebrate"
                        : progress > 0.58
                          ? "wonder"
                          : "point"
                  }
                />
              </div>
              <figcaption className="bg-[#fffcf2] px-4 py-2 text-sm font-medium">
                {Math.round(progress * 100)}%
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section
        data-state="build"
        className="relative h-dvh overflow-hidden"
        aria-label="우체국 짓기 자동 시연"
      >
        <BuildPreview layout={layout} />
      </section>
    </main>
  );
}
