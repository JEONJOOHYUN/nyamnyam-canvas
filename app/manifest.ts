import type { MetadataRoute } from "next";

// Home-screen install (spec §1 PWA). Starts on the home page, not /play: an installed
// fullscreen app has no address bar, and home links to both the meal and the parent
// screen. No service worker: the app needs the network anyway.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "냠냠캔버스",
    short_name: "냠냠캔버스",
    description: "먹은 만큼 그림이 자라나는 식습관 도우미",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    orientation: "any",
    background_color: "#91dfff",
    theme_color: "#91dfff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
