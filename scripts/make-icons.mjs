// Renders public/icons/*.png from the dev-only page /design/icon.
// Needs the dev server (npm run dev, port 3005). Run: node scripts/make-icons.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3005";
const OUT = new URL("../public/icons/", import.meta.url);
// [file, variant, size]
const ICONS = [
  ["icon-192.png", "any", 192],
  ["icon-512.png", "any", 512],
  ["maskable-512.png", "maskable", 512],
  ["apple-touch-icon.png", "maskable", 180], // iOS rounds the corners itself
];

const browser = await chromium.launch();
for (const [file, variant, size] of ICONS) {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 700 },
    deviceScaleFactor: size / 512,
  });
  await page.goto(`${BASE}/design/icon`);
  const el = page.locator(`[data-icon="${variant}"]`);
  await el.waitFor();
  await el.screenshot({
    path: new URL(file, OUT).pathname.replace(/^\/([A-Z]:)/, "$1"),
    omitBackground: true,
  });
  console.log("wrote", file);
  await page.close();
}
await browser.close();
