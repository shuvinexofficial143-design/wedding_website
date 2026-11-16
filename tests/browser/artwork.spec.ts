import { test, expect } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const designs = [
  ["royal-golden-palace", "Royal Golden Palace"],
  ["pink-rose-floral", "Pink Rose Floral"],
  ["luxury-maroon-heritage", "Luxury Maroon Heritage"],
  ["white-gold-minimal", "White & Gold Minimal"],
  ["traditional-hindu-wedding", "Traditional Hindu Wedding"],
  ["rajasthani-royal-wedding", "Rajasthani Royal Wedding"],
  ["pastel-watercolor-floral", "Pastel Watercolor Floral"],
  ["elegant-muslim-nikah", "Elegant Muslim Nikah Invitation"],
  ["south-indian-traditional", "South Indian Traditional Wedding"],
  ["luxury-dark-emerald", "Luxury Dark Emerald Wedding"],
] as const;
const origin = "http://localhost:3000";

for (const [productId, productName] of designs) {
  test("illustrated artwork and editable preview in desktop/mobile: " + productId, async ({page}) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({width,height:920});
      await page.goto("/catalog?category=cards");
      await expect(page.getByRole("heading", {name: productName})).toBeVisible();
      await page.goto("/preview/" + productId);
      const card = page.getByTestId("art-" + productId);
      await expect(card).toBeVisible();
      const image = card.locator("img.artwork-background");
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth === 1000)).toBe(true);
      await expect(card).toContainText("Ananya");
      await expect(card).toContainText("Aarav");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await card.screenshot({path: "test-results/art-" + productId + "-" + width + ".png"});
    }
  });

  test("payment gate, saved art layers and PNG/PDF: " + productId, async ({page}) => {
    const register = await page.request.post("/api/auth", {
      headers: {origin},
      data: { action: "register", email: "art-" + randomUUID() + "@example.test", password: "Testing-only-password-2026!" },
    });
    expect(register.status()).toBe(200);
    const created = await page.request.post("/api/orders", {
      headers: {origin},data: {productId,phone:"9876543210"},
    });
    expect(created.status()).toBe(200);
    const {id} = await created.json();
    await page.goto("/editor/" + id);
    await expect(page).toHaveURL(/checkout/);
    const database = new DatabaseSync(process.env.DATABASE_PATH || path.join(process.cwd(),"data","e2e.sqlite"));
    try {
      // Test fixture only. Not reachable through the app or a production API.
      database.prepare("UPDATE orders SET status='paid',payment_id=? WHERE id=?").run("fixture-" + id,id);
      await page.setViewportSize({width:390,height:900});
      await page.goto("/editor/" + id);
      const card = page.getByTestId("art-" + productId);
      await expect(card).toBeVisible();
      await page.getByLabel("Partner one").fill("Kavya Devraj Singh");
      await page.getByLabel("Partner two").fill("Rohan Rajendra Kapoor");
      await page.getByLabel("Wedding date").fill("2028-04-11");
      await page.getByLabel("Wedding time (India)").fill("14:45");
      await page.getByLabel("Venue",{exact:true}).fill("Royal Lakeside Palace, Udaipur, Rajasthan");
      await page.getByLabel("Venue address").fill("Lake Road, Udaipur, Rajasthan, India 313001");
      await page.getByLabel(/Invitation message/).fill("With the blessings of our beloved families, please join us for a very special day.");
      await expect(card).toContainText("Kavya Devraj Singh");
      await expect(card).toContainText("11 April 2028");
      await expect(card).toContainText("2:45 PM IST");
      await expect(card).toContainText("Royal Lakeside Palace");
      await expect(card).toContainText("beloved families");
      await expect(card.getByTestId("editable-address")).toContainText("Lake Road");
      await expect.poll(() => {
        const row = database.prepare("SELECT details FROM orders WHERE id=?").get(id)!;
        return JSON.parse(row.details as string).cardMessage as string;
      },{timeout:20000}).toContain("beloved");
      await page.reload();
      await expect(page.getByLabel(/Invitation message/)).toContainText("beloved families");
      await expect(page.getByLabel("Venue address")).toHaveValue("Lake Road, Udaipur, Rajasthan, India 313001");
      const background = card.locator("img.artwork-background");
      await expect.poll(() => background.evaluate((node:HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      const geometry = await card.evaluate((root) => {
        const container = root.querySelector(".artwork-copy") as HTMLElement;
        const elements = Array.from(container.children) as HTMLElement[];
        const outer = root.getBoundingClientRect();
        const inner = container.getBoundingClientRect();
        const positioned = elements.map(node => ({
          label: node.className || node.tagName,
          rect: node.getBoundingClientRect(),
        }));
        // Browsers can differ in subpixel rounding by one CSS pixel.
        const withinSafeArea = container.scrollHeight <= container.clientHeight + 2;
        const withinCard = inner.left >= outer.left - 1 && inner.right <= outer.right + 1 &&
          inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
        const visualCollision = positioned.some((item, index) => index > 0 &&
          item.rect.top < positioned[index - 1].rect.bottom - 1);
        return {withinSafeArea,withinCard,visualCollision,
          scrollHeight: container.scrollHeight,clientHeight: container.clientHeight};
      });
      expect(geometry.withinCard).toBe(true);
      expect(geometry.withinSafeArea).toBe(true);
      expect(geometry.visualCollision).toBe(false);
      const box = await card.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeLessThanOrEqual(390);
      for (const [label, magic] of [["HD PNG","89504e47"],["PDF","25504446"]] as const) {
        const downloadPromise = page.waitForEvent("download",{timeout:60000});
        await page.getByRole("button",{name:label,exact:true}).click();
        const download = await downloadPromise;
        expect(await download.failure()).toBeNull();
        const bytes = await readFile(await download.path());
        expect(bytes.subarray(0,4).toString("hex")).toBe(magic);
        expect(bytes.length).toBeGreaterThan(15000);
        if (label === "HD PNG") {
          expect(bytes.readUInt32BE(16)).toBeGreaterThanOrEqual(1600);
          await download.saveAs("test-results/art-" + productId + "-export.png");
        }
      }
      await card.screenshot({path:"test-results/art-"+productId+"-edited-mobile.png"});
    } finally {
      database.close();
    }
  });
}
