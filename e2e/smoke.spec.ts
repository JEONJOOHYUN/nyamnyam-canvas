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
    page.getByRole("button", { name: "시뮬레이터 닫기" }),
  ).toBeVisible();
  expect(supabaseCalls).toEqual([]);
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
