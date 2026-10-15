import { CHARACTERS } from "@/components/garden/characters";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { THEMES, type GardenThemeKey } from "@/components/garden/themes";
import { GardenScene } from "@/components/garden/GardenScene";
import { CHICK_POSES, POSE_LABELS } from "@/components/garden/Chick";
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
  const params = await searchParams;
  const layout = params.layout === "tall" ? "tall" : "wide";
  const theme =
    params.theme === "space"
      ? "space"
      : params.theme === "sea"
        ? "sea"
        : "post";
  const character =
    params.character === "pongdang"
      ? "pongdang"
      : params.character === "banjjak"
        ? "banjjak"
        : "nyamnyam";
  const { Component: Character, name } = CHARACTERS[character];
  const checkpoints =
    theme !== "post"
      ? [0, 0.09, 0.18, 0.27, 0.33, 0.45, 0.55, 0.64, 0.73, 0.82, 0.99, 1]
      : [0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.55, 0.64, 0.73, 0.82, 0.91, 1];
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
          <ScenePreview
            {...props}
            layout={layout}
            theme={theme}
            character={character}
          />
        </section>
      ))}
      <section data-state="faces" className="px-8 py-12">
        <p className="text-xs tracking-[.2em] text-[#7f8e76]">
          {character.toUpperCase()} · BODY LANGUAGE
        </p>
        <h2 className="mt-3 font-kid text-3xl">
          {character === "nyamnyam"
            ? "작은 날개, 큰 마음"
            : character === "pongdang"
              ? "작은 앞발, 큰 마음"
              : "반짝이는 별, 다정한 마음"}
        </h2>
        <div className="mt-8 flex gap-3 overflow-x-auto pb-4">
          {CHICK_POSES.map((pose) => (
            <figure
              key={pose}
              className={
                theme !== "post"
                  ? "min-w-80 flex-1 overflow-hidden rounded-3xl bg-[#d4f3ff] py-5"
                  : "min-w-40 flex-1 rounded-3xl bg-[#d4f3ff] py-5"
              }
            >
              {theme !== "post" ? (
                <div
                  className={
                    layout === "tall" ? "aspect-[520/1000]" : "aspect-[4/3]"
                  }
                >
                  <GardenScene
                    theme={theme}
                    character={character}
                    progress={1}
                    layout={layout}
                    pose={pose}
                    bubble={null}
                  />
                </div>
              ) : (
                <svg
                  viewBox="-130 -240 260 270"
                  role="img"
                  aria-label={
                    character === "nyamnyam"
                      ? POSE_LABELS[pose]
                      : `${name}. ${POSE_LABELS[pose]}`
                  }
                  className="w-full"
                >
                  <Character pose={pose} />
                </svg>
              )}
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
        <PoseLoop theme={theme} character={character} layout={layout} />
      </section>
      <section data-state="growth" className="px-8 pb-12 pt-6">
        <p className="text-xs tracking-[.2em] text-[#7f8e76]">
          A WORLD, PIECE BY PIECE
        </p>
        <h2 className="mb-8 mt-3 font-kid text-3xl">
          한 걸음마다, 새로운 발견
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {checkpoints.map((progress) => (
            <figure
              key={progress}
              className="overflow-hidden rounded-2xl border border-[#cbd1bc]"
            >
              <div className="aspect-[4/3]">
                <GardenScene
                  theme={theme}
                  character={character}
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
        aria-label={
          theme === "space"
            ? "우주 외계인 마을 짓기 자동 시연"
            : theme === "sea"
              ? "바다 왕국 짓기 자동 시연"
              : "우체국 짓기 자동 시연"
        }
      >
        <BuildPreview
          key={`${theme}-${character}`}
          layout={layout}
          theme={theme}
          character={character}
        />
      </section>
      <nav className="px-8 py-6" aria-label="시안 테마">
        {(Object.keys(THEMES) as GardenThemeKey[])
          .filter((key) => key !== theme)
          .map((key) => (
            <Link
              key={key}
              className="mr-6 underline underline-offset-4"
              href={{
                pathname: "/design/garden",
                query: {
                  layout,
                  theme: key,
                  ...(character !== "nyamnyam" && { character }),
                },
              }}
            >
              {THEMES[key].title} 시안 보기
            </Link>
          ))}
      </nav>
    </main>
  );
}
