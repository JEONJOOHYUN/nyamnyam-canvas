import { STAGE_COUNT } from "@/lib/meal/stage";

// Stage dots + bar. The bar only ever grows because progress is max-held upstream.
export function Progress({
  progress,
  stage,
  showPercent,
}: {
  progress: number;
  stage: number;
  showPercent: boolean;
}) {
  const pct = Math.round(progress * 100);
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex gap-[clamp(0.3rem,1.2vmin,0.6rem)]" aria-hidden>
        {Array.from({ length: STAGE_COUNT }, (_, i) => (
          <span
            key={i}
            className={`size-[clamp(0.9rem,2.6vmin,1.4rem)] rounded-full border-2 border-[#F4B630] transition-colors duration-500 ${
              i < stage ? "bg-[#FFC93C]" : "bg-white"
            }`}
          />
        ))}
      </div>
      <div
        role="progressbar"
        aria-label="먹은 만큼"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-[clamp(0.9rem,2.4vmin,1.3rem)] w-full overflow-hidden rounded-full bg-white shadow-inner"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#9BE686] to-[#4FAE57] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showPercent && (
        <span className="text-[clamp(1rem,3vmin,1.4rem)] text-[#7A5C45]">
          {pct}%
        </span>
      )}
    </div>
  );
}
