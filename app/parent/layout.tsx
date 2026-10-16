import localFont from "next/font/local";
import "./parent.css";

// Parent screens only: Paperlogy 1.000 by PT& (SIL OFL 1.1, app/fonts/Paperlogy-OFL.txt),
// the original unmodified TTF files. ~680KB per weight, loaded as each weight is used.
const paperlogy = localFont({
  src: [
    { path: "../fonts/Paperlogy-4Regular.ttf", weight: "400" },
    { path: "../fonts/Paperlogy-5Medium.ttf", weight: "500" },
    { path: "../fonts/Paperlogy-7Bold.ttf", weight: "700" },
    { path: "../fonts/Paperlogy-8ExtraBold.ttf", weight: "800" },
  ],
  variable: "--font-paperlogy",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

export default function ParentLayout({ children }: LayoutProps<"/parent">) {
  return (
    <div className={`${paperlogy.variable} parent-a flex flex-1 flex-col`}>
      {children}
    </div>
  );
}
