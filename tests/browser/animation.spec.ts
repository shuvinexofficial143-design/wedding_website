import { test, expect } from "@playwright/test";
for (let i = 1; i <= 6; i++)
  test(`motion ${i}: preview, pause/replay and readable reduced motion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/preview/motion-${i}`);
    const player = page.locator(".motion-player").first();
    await expect(player.locator('[data-export-ready="true"]')).toBeVisible();
    await expect(
      player.getByRole("button", { name: "Pause animation" }),
    ).toBeEnabled();
    await player.getByRole("button", { name: "Pause animation" }).click();
    await expect(player).toHaveAttribute("data-motion-state", "Paused");
    await player.getByRole("button", { name: "Replay animation" }).click();
    await expect(player).toHaveAttribute("data-motion-state", "Playing");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(player).toHaveAttribute("data-motion-state", "Motion reduced");
    await expect(player).toContainText("Ananya");
    await expect(player.locator('[data-overflow="true"]')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/motion-${i}-mobile.png`,
      fullPage: true,
    });
  });

test("animated customer purchase is pinned and guest playback survives personalisation", async ({
  page,
  browser,
}) => {
  const { randomUUID } = await import("node:crypto");
  const { DatabaseSync } = await import("node:sqlite");
  const path = await import("node:path");
  const origin = "http://localhost:3000";
  expect(
    (
      await page.request.post("/api/auth", {
        headers: { origin },
        data: {
          action: "register",
          email: "motion-" + randomUUID() + "@example.test",
          password: "Motion-test-password-2026!",
        },
      })
    ).status(),
  ).toBe(200);
  const response = await page.request.post("/api/orders", {
    headers: { origin },
    data: { productId: "motion-2", phone: "9876543210" },
  });
  const { id } = await response.json();
  expect((await page.request.get("/api/orders/" + id + "/card")).status()).toBe(
    403,
  );
  const db = new DatabaseSync(
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "e2e.sqlite"),
  );
  db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(id);
  db.close();
  const loaded = await (
    await page.request.get("/api/orders/" + id + "/card")
  ).json();
  const bride = loaded.document.layers.find(
    (l: { field: string }) => l.field === "partnerA",
  );
  expect(
    (
      await page.request.patch("/api/orders/" + id + "/card", {
        headers: { origin },
        data: { revision: 0, values: { [bride.id]: "अनन्या और परिवार" } },
      })
    ).status(),
  ).toBe(200);
  const publish = await page.request.patch("/api/orders/" + id + "/card", {
    headers: { origin },
    data: { action: "publish", revision: 1 },
  });
  expect(publish.status()).toBe(200);
  const { token } = await publish.json();
  const guest = await browser.newPage();
  await guest.goto("/i/" + token);
  await expect(guest.locator(".motion-player")).toContainText(
    "अनन्या और परिवार",
  );
  await expect(
    guest.getByRole("button", { name: "Pause animation" }),
  ).toBeEnabled();
  await guest.close();
});

test("admin timeline draft save/reload and duplicate preserve original version", async ({
  page,
}) => {
  const { randomUUID } = await import("node:crypto");
  const { DatabaseSync } = await import("node:sqlite");
  const path = await import("node:path");
  const email = "motion-admin-" + randomUUID() + "@example.test";
  await page.request.post("/api/auth", {
    headers: { origin: "http://localhost:3000" },
    data: {
      action: "register",
      email,
      password: "Admin-motion-password-2026!",
    },
  });
  const db = new DatabaseSync(
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "e2e.sqlite"),
  );
  db.prepare(
    "UPDATE users SET email='retired-'||id||'@example.test',role='customer' WHERE email='admin@example.test'",
  ).run();
  db.prepare(
    "UPDATE users SET role='admin',email='admin@example.test' WHERE email=?",
  ).run(email);
  await page.goto("/admin/cards/motion-5");
  await page.getByRole("button", { name: "Duplicate as new template" }).click();
  const style = "MOTION-QA-" + randomUUID().slice(0, 8).toUpperCase();
  await page.getByLabel("Unique style number").fill(style);
  await page
    .locator(".studio-layers button")
    .filter({ hasText: "Bride name" })
    .click();
  await page.getByLabel("Animation type").selectOption("zoom");
  await page.getByLabel("Start delay (ms)").fill("2200");
  await page.getByLabel("Duration (ms)").fill("1800");
  await page.getByRole("button", { name: "Save design", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved version" }),
  ).toBeVisible();
  const row = db
    .prepare("SELECT id FROM card_templates WHERE style_number=?")
    .get(style)!;
  await page.goto("/admin/cards/" + row.id);
  await page
    .locator(".studio-layers button")
    .filter({ hasText: "Bride name" })
    .click();
  await expect(page.getByLabel("Start delay (ms)")).toHaveValue("2200");
  await expect(page.getByLabel("Duration (ms)")).toHaveValue("1800");
  expect(
    db
      .prepare("SELECT head_version FROM card_templates WHERE id='motion-5'")
      .get()!.head_version,
  ).toBe(1);
  db.close();
});

