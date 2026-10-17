import { notFound } from "next/navigation";
import { CharacterArt } from "@/components/parent/ui";

// Dev-only source for the app icons: `node scripts/make-icons.mjs` screenshots it.
// "any" = rounded tile with the face, "maskable" = full-bleed background with the face
// inside the 80% safe zone (launchers crop it to their own shape).
export default function IconDesignPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview"
  )
    notFound();
  return (
    <main className="flex gap-6 bg-white p-6">
      {(["any", "maskable"] as const).map((variant) => (
        <div
          key={variant}
          data-icon={variant}
          className="grid size-[512px] shrink-0 place-items-center overflow-hidden"
          style={{
            background: "linear-gradient(#91dfff, #d9f3ff)",
            borderRadius: variant === "any" ? 112 : 0,
          }}
        >
          <div
            className="grid place-items-center overflow-hidden rounded-full bg-[#ffe9a8]"
            style={{
              width: variant === "any" ? 400 : 330,
              height: variant === "any" ? 400 : 330,
              boxShadow: "0 0 0 14px #e8892b",
            }}
          >
            {/* Bigger than the circle, so the circle (not the face crop) is the edge. */}
            <div
              style={{
                width: "100%",
                height: "100%",
                transform: "translateY(10%)",
              }}
            >
              <CharacterArt character="nyamnyam" face />
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
