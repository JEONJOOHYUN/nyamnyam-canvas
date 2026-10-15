import { expect, test, type Page } from "@playwright/test";

// Child screen on every target device (spec §6), driven to stage 5 through the dev simulator.
test.use({ reducedMotion: "reduce" });

async function setFood(page: Page, grams: number) {
  await page.locator("input[type=range]").evaluate((el, v) => {
    const input = el as HTMLInputElement;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, String(grams));
}

test("play screen fits the device at stage 5", async ({ page }) => {
  test.setTimeout(60_000);
  // No TTS: keeps the beak still and the run fast (the line text still shows in the bubble).
  await page.addInitScript(() => {
    // @ts-expect-error -- removing the API on purpose
    delete window.speechSynthesis;
  });
  await page.goto("/play");
  await page.getByRole("button", { name: "시작하기" }).click();

  const debug = page.locator("p.font-mono");
  await expect(debug).toContainText("식판 350g", { timeout: 15_000 });
  await setFood(page, 200);
  await expect(debug).toContainText("SERVED", { timeout: 15_000 });
  // Eat in bites: dropping 50%+ at once would be held back as suspected dumping.
  for (const [grams, pct] of [
    [150, "25"],
    [100, "50"],
    [60, "70"],
  ] as const) {
    await setFood(page, grams);
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      pct,
      {
        timeout: 15_000,
      },
    );
  }
  await page.getByRole("button", { name: "시뮬레이터 닫기" }).click();
  await page.waitForTimeout(1500); // let the bubble and new layers settle

  const viewport = page.viewportSize()!;
  const scroll = await page.evaluate(() => ({
    x: document.documentElement.scrollWidth - window.innerWidth,
    y: document.documentElement.scrollHeight - window.innerHeight,
  }));
  expect(scroll).toEqual({ x: 0, y: 0 });

  const parts = [
    page.getByText("망원경이 생겼어! 저기 봐!"),
    page.getByRole("button", { name: "냠냠이" }),
    page.getByRole("progressbar"),
    page.getByRole("button", { name: "배불러요" }),
  ];
  for (const part of parts) {
    const box = (await part.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
  for (const name of ["냠냠이", "배불러요"]) {
    const box = (await page.getByRole("button", { name }).boundingBox())!;
    expect(box.height, `${name} touch target`).toBeGreaterThanOrEqual(48);
  }

  await expect(page).toHaveScreenshot("play-stage5.png", {
    maxDiffPixelRatio: 0.02,
  });
});
