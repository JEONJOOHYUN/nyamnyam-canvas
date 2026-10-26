import { expect, test } from "@playwright/test";

test("home renders without horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "냠냠캔버스" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("demo mode starts without an account and never calls Supabase", async ({
  page,
}) => {
  const supabaseCalls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes(".supabase.co")) supabaseCalls.push(r.url());
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "냠냠이" }).last().click();
  await page
    .getByRole("button", { name: /바람 우체국/ })
    .first()
    .click();
  await expect(page.getByText("시연 모드")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "시연 도구 닫기" }),
  ).toBeVisible();
  expect(supabaseCalls).toEqual([]);
});

test("demo panel runs a meal step by step at 3x", async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    // @ts-expect-error -- removing the API on purpose (no TTS)
    delete window.speechSynthesis;
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "냠냠이" }).last().click();
  await page
    .getByRole("button", { name: /바람 우체국/ })
    .first()
    .click();
  await page.getByRole("button", { name: "3.0" }).click();
  await expect(page.getByText("3.00x")).toBeVisible();

  const serve = page.getByRole("button", { name: /음식 두기/ });
  await expect(serve).toBeDisabled(); // no tray yet
  await page.getByRole("button", { name: "식판 두기" }).click();
  await expect(serve).toBeEnabled({ timeout: 10_000 });
  await serve.click();
  const eat = page.getByRole("button", { name: "음식 먹기" });
  await expect(eat).toBeEnabled({ timeout: 10_000 });

  await page.getByRole("spinbutton", { name: "먹을 양 (g)" }).fill("100");
  await eat.click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "50",
    { timeout: 20_000 },
  );

  await page.getByRole("button", { name: "처음부터" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(page.getByText("식판을 올려 주세요")).toBeVisible();
});

test("auto demo starts with one tap and hides the controls", async ({
  page,
}) => {
  const supabaseCalls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes(".supabase.co")) supabaseCalls.push(r.url());
  });
  await page.goto("/demo/auto");
  await page.getByRole("button", { name: "시작하기" }).click();
  // The start overlay (it also says "자동 시연") fades out for a moment before it goes.
  await expect(page.locator(".start-screen")).toHaveCount(0);
  await expect(page.getByText("자동 시연")).toBeVisible();
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "시뮬레이터 닫기" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "배불러요" })).toHaveCount(0);
  expect(supabaseCalls).toEqual([]);
});
