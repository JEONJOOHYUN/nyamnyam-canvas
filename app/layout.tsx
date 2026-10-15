import type { Metadata, Viewport } from "next";
import { Jua } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Body text (parent pages, simulator). NAVER D2Coding 1.4.0, the official unmodified
// web files: OFL Reserved Font Name forbids shipping a subset under this name.
// ~1.5MB per weight, so no preload: the child screen mostly uses Jua.
const d2coding = localFont({
  src: [
    { path: "./fonts/D2Coding-Regular.woff2", weight: "400" },
    { path: "./fonts/D2Coding-Bold.woff2", weight: "700" },
  ],
  variable: "--font-d2coding",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

// Rounded display font for the child screen.
const jua = Jua({
  variable: "--font-jua",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "냠냠캔버스",
  description: "먹은 만큼 그림이 자라나는 식습관 도우미",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${d2coding.variable} ${jua.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
