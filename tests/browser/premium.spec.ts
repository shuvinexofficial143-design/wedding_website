import { test, expect } from "@playwright/test";

const designs = [
  ["royal-gold-wedding", "royal-gold", "Royal Gold Wedding Card"],
  ["floral-pink-wedding", "floral-pink", "Floral Pink Wedding Card"],
  ["traditional-indian-wedding", "traditional-indian", "Traditional Indian Wedding Card"],
] as const;

for (const [id, theme, name] of designs) {
  test("desktop/mobile catalog and sample preview: " + theme, async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 930 });
      await page.goto("/catalog?category=cards");
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
      await page.goto("/products/" + id);
      await expect(page.getByTestId("premium-" + theme)).toBeVisible();
      await page.goto("/preview/" + id);
      const card = page.getByTestId("premium-" + theme);
      await expect(card).toBeVisible();
      await expect(card).toContainText("Ananya");
      await expect(card).toContainText("Aarav");
      expect(await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )).toBe(true);
      await card.screenshot({
        path: "test-results/premium-" + theme + "-" + width + ".png",
      });
    }
  });
}
