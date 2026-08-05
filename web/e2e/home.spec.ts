import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("protects the learning route and renders sign-in accessibly", async ({ page }) => {
  await page.goto("/learn");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back");
  const body = page.locator("body");
  expect(await body.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
