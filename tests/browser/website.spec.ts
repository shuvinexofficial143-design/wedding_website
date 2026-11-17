import { test, expect } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import path from "node:path";
const origin = "http://localhost:3000";
for (let i = 1; i <= 4; i++)
  test("website layout " + i + " mobile preview", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/preview/website-studio-" + i);
    await expect(page.locator(".wedding-site")).toContainText("Ananya");
    await expect(page.locator(".website-countdown")).toContainText("days");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/website-" + i + "-mobile.png",
      fullPage: true,
    });
  });
test("website paid edit autosave, event RSVP duplicate update, private CSV and revocation", async ({
  page,
  browser,
  request,
}) => {
  const email = "website-" + randomUUID() + "@example.test";
  expect(
    (
      await page.request.post("/api/auth", {
        headers: { origin },
        data: {
          action: "register",
          email,
          password: "Website-test-password-2026!",
        },
      })
    ).status(),
  ).toBe(200);
  const created = await page.request.post("/api/orders", {
    headers: { origin },
    data: { productId: "website-studio-1", phone: "9876543210" },
  });
  expect(created.status()).toBe(200);
  const { id } = await created.json();
  expect(
    (await page.request.get("/api/orders/" + id + "/website")).status(),
  ).toBe(403);
  const db = new DatabaseSync(
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "e2e.sqlite"),
  );
  db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(id);
  await page.goto("/editor/" + id);
  await page.getByLabel("partnerA", { exact: true }).fill("अनन्या त्रिवेदी");
  await expect(page.getByRole("status")).toHaveText("Saved");
  await expect
    .poll(
      async () =>
        (
          await (
            await page.request.get("/api/orders/" + id + "/website")
          ).json()
        ).data.partnerA,
    )
    .toBe("अनन्या त्रिवेदी");
  await page.reload();
  await expect(page.getByLabel("partnerA", { exact: true })).toHaveValue(
    "अनन्या त्रिवेदी",
  );
  await page.getByRole("button", { name: "Add event", exact: true }).click();
  await expect
    .poll(
      async () =>
        (
          await (
            await page.request.get("/api/orders/" + id + "/website")
          ).json()
        ).data.events.length,
    )
    .toBe(2);
  await page
    .getByRole("button", { name: "Publish website", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Published snapshot updated",
  );
  const saved = await (
    await page.request.get("/api/orders/" + id + "/website")
  ).json();
  const guest = await browser.newPage();
  await guest.goto("/i/" + saved.token);
  await expect(guest.locator(".wedding-site")).toContainText("अनन्या त्रिवेदी");
  await guest.getByLabel("Your name").fill("Guest Test");
  await guest.getByLabel("Notes (optional)").fill("Vegetarian meals, please");
  await guest.getByRole("button", { name: "Send RSVP" }).click();
  await expect(guest.getByRole("status")).toContainText("Thank you");
  await guest.getByLabel("Attendance", { exact: true }).selectOption("no");
  await guest.getByRole("button", { name: "Send RSVP" }).click();
  await expect
    .poll(
      () =>
        db.prepare("SELECT count(*) AS n FROM rsvps WHERE order_id=?").get(id)!
          .n,
    )
    .toBe(1);
  await expect
    .poll(
      () =>
        db.prepare("SELECT attendance FROM rsvps WHERE order_id=?").get(id)!
          .attendance,
    )
    .toBe("no");
  expect((await request.get("/api/orders/" + id + "/rsvps")).status()).toBe(
    401,
  );
  const csv = await page.request.get("/api/orders/" + id + "/rsvps");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Vegetarian meals");
  await page
    .getByRole("button", { name: "Unpublish website", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Link revoked");
  expect((await request.get("/i/" + saved.token)).status()).toBe(404);
  expect(
    (
      await request.post("/api/invites/" + saved.token + "/rsvp", {
        headers: { origin },
        data: { name: "Late guest", attendance: "yes", guests: 1, website: "" },
      })
    ).status(),
  ).toBe(404);
  db.close();
  await guest.close();
});
