import { test, expect } from "@playwright/test";
for (const width of [360, 390, 430, 768, 1440])
  test(`luxury homepage and catalog at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /For your forever/ }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".hero-photo")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await expect(page.locator(".collection-tile")).toHaveCount(5);
    await expect(page.locator(".website-device")).toHaveCount(4);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 761) {
      await page.getByRole("button", { name: "Toggle navigation" }).click();
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Toggle navigation" }).click();
    }
    await page
      .getByText("Will I receive an MP4 video?", { exact: true })
      .click();
    await expect(page.locator("details[open]")).toContainText(
      "do not include MP4 export",
    );
    await page.screenshot({
      path: `test-results/luxury-home-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("link", { name: /Browse Designs/ }).click();
    await expect(page).toHaveURL(/catalog/);
    await expect(page.locator(".luxury-product").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/luxury-catalog-${width}.png`,
      fullPage: true,
    });
  });
test("luxury reduced motion, contact and authentication surfaces", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator(".cinematic-copy")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.screenshot({
    path: "test-results/luxury-contact.png",
    fullPage: true,
  });
  await page.goto("/login");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/luxury-login.png",
    fullPage: true,
  });
  for (const width of [360, 430]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `test-results/luxury-login-${width}.png`,
      fullPage: true,
    });
  }
});
