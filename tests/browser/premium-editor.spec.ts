import { test, expect } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const designs = [
  ["royal-gold-wedding", "royal-gold"],
  ["floral-pink-wedding", "floral-pink"],
  ["traditional-indian-wedding", "traditional-indian"],
] as const;
const origin = "http://localhost:3000";

for (const [productId, theme] of designs) {
  test("premium paid editor, persistence, PNG and PDF: " + theme, async ({ page }) => {
    const register = await page.request.post("/api/auth", {
      headers: { origin },
      data: {
        action: "register",
        email: "premium-" + randomUUID() + "@example.test",
        password: "Only-for-isolated-tests-2026",
      },
    });
    expect(register.status()).toBe(200);
    const created = await page.request.post("/api/orders", {
      headers: { origin },
      data: { productId, phone: "9876543210" },
    });
    expect(created.status()).toBe(200);
    const { id } = await created.json();
    const database = new DatabaseSync(
      process.env.DATABASE_PATH || path.join(process.cwd(), "data", "e2e.sqlite")
    );
    try {
      // This fixture is isolated to CI's disposable database, not an application payment path.
      database.prepare("UPDATE orders SET status='paid',payment_id=? WHERE id=?")
        .run("fixture-" + id, id);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/editor/" + id);
      const preview = page.getByTestId("premium-" + theme);
      await expect(preview).toBeVisible();
      await page.getByLabel("Partner one").fill("Kavya");
      await page.getByLabel("Partner two").fill("Rohan");
      await page.getByLabel("Wedding date").fill("2028-04-11");
      await page.getByLabel("Wedding time (India)").fill("14:45");
      await page.getByLabel("Venue", { exact: true }).fill("The Lake Palace, Udaipur");
      for (const text of ["Kavya", "Rohan", "11 April 2028", "2:45 PM IST", "The Lake Palace, Udaipur"]) {
        await expect(preview).toContainText(text);
      }
      await expect.poll(() => {
        const row = database.prepare("SELECT details FROM orders WHERE id=?").get(id)!;
        return JSON.parse(row.details as string).partnerA;
      }, { timeout: 20000 }).toBe("Kavya");
      await page.reload();
      await expect(page.getByLabel("Partner one")).toHaveValue("Kavya");
      await expect(page.getByTestId("premium-" + theme)).toContainText("Rohan");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
      await page.getByTestId("premium-" + theme).screenshot({
        path: "test-results/premium-" + theme + "-edited-mobile.png",
      });
      for (const [button, signature] of [["HD PNG", "89504e47"], ["PDF", "25504446"]] as const) {
        const downloaded = page.waitForEvent("download", { timeout: 60000 });
        await page.getByRole("button", { name: button, exact: true }).click();
        const file = await downloaded;
        expect(await file.failure()).toBeNull();
        const data = await readFile(await file.path());
        expect(data.subarray(0, 4).toString("hex")).toBe(signature);
        expect(data.length).toBeGreaterThan(10000);
      }
    } finally {
      database.close();
    }
  });
}
