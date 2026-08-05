import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("renders the foundation without serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anatomical position and directional terms");
  const body = page.locator("body");
  expect(await body.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
