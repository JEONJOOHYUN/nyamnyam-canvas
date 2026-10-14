import { defineConfig } from "@playwright/test";

// Target devices from the spec (section 6). All run on Chromium with touch.
const viewports = {
  "iphone-se": { width: 375, height: 667 },
  "iphone-15": { width: 393, height: 852 },
  "galaxy-s": { width: 360, height: 800 },
  "ipad-portrait": { width: 768, height: 1024 },
  "ipad-landscape": { width: 1024, height: 768 },
  "galaxy-tab": { width: 800, height: 1280 },
};

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3005", hasTouch: true },
  projects: Object.entries(viewports).map(([name, viewport]) => ({
    name,
    use: { browserName: "chromium", viewport },
  })),
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3005",
    reuseExistingServer: true,
  },
});
