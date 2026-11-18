import { test, expect } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
const origin = "http://localhost:3000";
test("desktop and mobile catalog, navigation and layout", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /For your forever/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("link", { name: /Browse Designs/ }).click();
    await expect(
      page.getByRole("heading", { name: /A design for/ }),
    ).toBeVisible();
    await page
      .locator(".filters").getByRole("link", { name: "Animated invitations", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Moonlit Romance" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gulmohar" })).toHaveCount(
      0,
    );
    await page.getByRole("link", { name: "Moonlit Romance", exact: true }).click();
    await page
      .getByRole("link", { name: "Preview design", exact: true })
      .click();
    await expect(page.locator(".invite.animated")).toBeVisible();
  }
});
test("account, server access controls, persisted editor, exports and publishing", async ({
  page,
  request,
}) => {
  const email = `customer-${Date.now()}@example.test`;
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/Password/).fill("Testing-only-strong-password-2026");
  await page
    .locator("form")
    .getByRole("button", { name: "Create account" })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByLabel('Your order summary')).toBeVisible();
  await page.screenshot({path:'test-results/luxury-dashboard.png',fullPage:true});
  const r = await page.request.post("/api/orders", {
    headers: { origin },
    data: { productId: "gulmohar", phone: "9876543210", amount: 1 },
  });
  expect(r.status()).toBe(200);
  const { id } = await r.json();
  const database = new DatabaseSync(
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "e2e.sqlite"),
  );
  const order = database.prepare("SELECT * FROM orders WHERE id=?").get(id)!;
  expect(order.amount).toBe(29900);
  await page.goto(`/editor/${id}`);
  await expect(page).toHaveURL(/checkout/);
  expect(
    (
      await page.request.patch(`/api/orders/${id}`, {
        headers: { origin },
        data: { details: {} },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(`/api/orders/${id}/payment`, {
        headers: { origin },
        data: { action: "verify" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.post("/api/orders", {
        headers: { origin: "https://evil.test" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.patch(`/api/admin/orders/${id}`, {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/payments/webhook", {
        data: {
          type: "PAYMENT_SUCCESS_WEBHOOK",
          data: { order: { order_id: id } },
        },
      })
    ).status(),
  ).toBe(401);
  // Isolated test database fixture only. Never an application payment bypass.
  database
    .prepare("UPDATE orders SET status='paid',payment_id=? WHERE id=?")
    .run(`fixture-${id}`, id);
  await page.goto(`/editor/${id}`);
  await page.getByLabel("Partner one").fill("Vishal");
  await expect(page.getByRole("status")).toHaveText("All changes saved");
  await expect
    .poll(
      () =>
        JSON.parse(
          database.prepare("SELECT details FROM orders WHERE id=?").get(id)!
            .details as string,
        ).partnerA,
    )
    .toBe("Vishal");
  await page.reload();
  await expect(page.getByLabel("Partner one")).toHaveValue("Vishal");
  await expect(page.locator(".invite h2")).toContainText("Vishal");
  for (const name of ["HD PNG", "PDF"]) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();
    await download.saveAs(`test-results/${download.suggestedFilename()}`);
  }
  await page.getByRole("button", { name: "Publish shareable link" }).click();
  await expect(
    page.getByRole("link", { name: "Open published invitation" }),
  ).toBeVisible();
  const token = database
    .prepare("SELECT public_token FROM orders WHERE id=?")
    .get(id)!.public_token;
  await page.goto(`/i/${token}`);
  await expect(page.locator(".invite h2")).toContainText("Vishal");
  await page.getByLabel("Your name").fill("Guest One");
  await page.getByRole("button", { name: "Send RSVP" }).click();
  await expect(page.getByRole("status")).toContainText("received");
  expect(
    database
      .prepare("SELECT COUNT(*) AS n FROM rsvps WHERE order_id=?")
      .get(id)!.n,
  ).toBe(1);
  await page.goto(`/editor/${id}`);
  await page.getByRole("button", { name: "Unpublish link" }).click();
  await expect(
    page.getByRole("link", { name: "Open published invitation" }),
  ).toHaveCount(0);
  expect((await request.get(`/i/${token}`)).status()).toBe(404);
  database.close();
});
