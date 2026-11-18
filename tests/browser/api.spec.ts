import { test, expect, request as requests } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { randomUUID } from "node:crypto";
const origin = "http://localhost:3000";
const details = {
  partnerA: "Ananya",
  partnerB: "Aarav",
  date: "2027-02-21",
  time: "18:00",
  venue: "Jaipur",
  story: "Our story",
  maps: "",
  photo: "",
  gallery: [],
};
test("API: ownership, paid gates, save conflicts, public RSVP, admin role and manual delivery", async ({
  request,
}) => {
  const customer = await requests.newContext({
    baseURL: origin,
    extraHTTPHeaders: { origin },
  });
  const other = await requests.newContext({
    baseURL: origin,
    extraHTTPHeaders: { origin },
  });
  const email = `api-${randomUUID()}@example.test`;
  expect(
    (
      await customer.post("/api/auth", {
        data: {
          action: "register",
          email,
          password: "Only-for-API-testing-2026",
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await other.post("/api/auth", {
        data: {
          action: "register",
          email: `other-${randomUUID()}@example.test`,
          password: "Only-for-API-testing-2026",
        },
      })
    ).status(),
  ).toBe(200);
  const create = await customer.post("/api/orders", {
    data: { productId: "gulmohar", phone: "9876543210", amount: 1 },
  });
  expect(create.status()).toBe(200);
  const { id } = await create.json();
  expect(
    (
      await (
        await customer.post("/api/orders", {
          data: { productId: "gulmohar", phone: "9876543210" },
        })
      ).json()
    ).id,
  ).toBe(id);
  const db = new DatabaseSync(
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "e2e.sqlite"),
  );
  expect(
    db.prepare("SELECT amount FROM orders WHERE id=?").get(id)!.amount,
  ).toBe(29900);
  expect(
    (
      await customer.patch(`/api/orders/${id}`, {
        data: { details, revision: 0 },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await other.patch(`/api/orders/${id}`, { data: { details, revision: 0 } })
    ).status(),
  ).toBe(404);
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
      await customer.post("/api/orders", {
        headers: { origin: "https://evil.test" },
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
  expect(
    (await customer.patch(`/api/admin/orders/${id}`, { data: {} })).status(),
  ).toBe(403);
  // Fixture changes are limited to the isolated e2e database, never exposed via app APIs.
  db.prepare("UPDATE orders SET status='paid',payment_id=? WHERE id=?").run(
    `fixture-${id}`,
    id,
  );
  const saved = await customer.patch(`/api/orders/${id}`, {
    data: { details, revision: 0 },
  });
  expect(saved.status()).toBe(200);
  expect(
    (
      await customer.patch(`/api/orders/${id}`, {
        data: { details, revision: 0 },
      })
    ).status(),
  ).toBe(409);
  const publish = await customer.patch(`/api/orders/${id}`, {
    data: { details, revision: 1, action: "publish" },
  });
  expect(publish.status()).toBe(200);
  const { token } = await publish.json();
  expect((await request.get(`/i/${token}`)).status()).toBe(200);
  expect(
    (
      await request.post(`/api/invites/${token}/rsvp`, {
        headers: { origin },
        data: { name: "A guest", attendance: "yes", guests: 2, website: "" },
      })
    ).status(),
  ).toBe(200);
  expect((await other.get(`/dashboard/${id}/rsvps`)).status()).toBe(404);
  expect((await customer.get(`/dashboard/${id}/rsvps`)).status()).toBe(200);
  expect(
    (
      await customer.patch(`/api/orders/${id}`, {
        data: { action: "unpublish" },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get(`/i/${token}`)).status()).toBe(404);
  const website = await (
    await customer.post("/api/orders", {
      data: { productId: "garden-story", phone: "9876543210" },
    })
  ).json();
  db.prepare("UPDATE orders SET status='paid',details=? WHERE id=?").run(
    JSON.stringify(details),
    website.id,
  );
  expect(
    (
      await customer.patch(`/api/orders/${website.id}`, {
        data: { details, revision: 0, action: "publish" },
      })
    ).status(),
  ).toBe(400);
  db.prepare("UPDATE users SET email='retired-'||id||'@example.test',role='customer' WHERE email='admin@example.test'").run();
  db.prepare("UPDATE users SET email='admin@example.test' WHERE email=?").run(
    email,
  );
  expect(
    (
      await customer.patch(`/api/admin/orders/${website.id}`, { data: {} })
    ).status(),
  ).toBe(403);
  db.prepare(
    "UPDATE users SET role='admin' WHERE email='admin@example.test'",
  ).run();
  const fulfilled = await customer.patch(`/api/admin/orders/${website.id}`, {
    data: { fulfillment: "delivered", publish: true },
  });
  expect(fulfilled.status()).toBe(200);
  const final = db
    .prepare("SELECT final_url FROM orders WHERE id=?")
    .get(website.id)!.final_url as string;
  expect((await request.get(final)).status()).toBe(200);
  const video = await (
    await customer.post("/api/orders", {
      data: { productId: "cinematic-love", phone: "9876543210" },
    })
  ).json();
  db.prepare("UPDATE orders SET status='paid' WHERE id=?").run(video.id);
  expect(
    (
      await customer.post(`/api/orders/${video.id}/video`, {
        multipart: {
          video: {
            name: "wrong.mp4",
            mimeType: "video/mp4",
            buffer: Buffer.from("this is not an mp4 file"),
          },
        },
      })
    ).status(),
  ).toBe(400);
  expect((await other.get(`/api/orders/${video.id}/video`)).status()).toBe(404);
  db.close();
  await customer.dispose();
  await other.dispose();
});
