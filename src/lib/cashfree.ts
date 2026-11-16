import { createHmac, timingSafeEqual } from "node:crypto";
import { db, type Order } from "./db";
// Production endpoint deliberately unavailable until explicit owner approval and launch review.
export function paymentReady() {
  return (
    process.env.CASHFREE_ENV === "sandbox" &&
    !!process.env.CASHFREE_APP_ID &&
    !!process.env.CASHFREE_SECRET_KEY
  );
}
export function verifySignature(
  raw: string,
  timestamp: string,
  signature: string,
  secret = process.env.CASHFREE_SECRET_KEY || "",
) {
  if (!secret || !timestamp || !signature) return false;
  const expected = createHmac("sha256", secret)
    .update(timestamp + raw)
    .digest();
  const actual = Buffer.from(signature, "base64");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
async function cashfree(path: string, options: RequestInit = {}) {
  if (!paymentReady())
    throw new Error(
      "Cashfree sandbox credentials are not configured. Live payments are disabled.",
    );
  const r = await fetch(`https://sandbox.cashfree.com/pg${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2025-01-01",
      "x-client-id": process.env.CASHFREE_APP_ID!,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
      ...options.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    throw new Error(
      `Payment provider unavailable (${r.status}). Please retry or contact support.`,
    );
  return r.json();
}
export async function createPayment(order: Order) {
  if (order.status === "paid") throw new Error("Order is already paid.");
  if (order.payment_session) return order.payment_session;
  const site = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).origin;
  const data = await cashfree("/orders", {
    method: "POST",
    headers: { "x-idempotency-key": order.id },
    body: JSON.stringify({
      order_id: order.id,
      order_amount: order.amount / 100,
      order_currency: "INR",
      customer_details: {
        customer_id: order.user_id,
        customer_phone: order.phone,
      },
      order_meta: {
        return_url: `${site}/checkout/return?order_id=${order.id}`,
        notify_url: `${site}/api/payments/webhook`,
      },
    }),
  });
  if (data.order_id !== order.id || typeof data.payment_session_id !== "string")
    throw new Error("Invalid provider response.");
  db()
    .prepare("UPDATE orders SET payment_session=? WHERE id=?")
    .run(data.payment_session_id, order.id);
  return data.payment_session_id as string;
}
export type ProviderOrder = {
  order_id: string;
  order_status: string;
  order_amount: number;
  order_currency: string;
};
export type ProviderPayment = {
  cf_payment_id: string | number;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
};
export function matchingPayment(
  order: Order,
  remote: ProviderOrder,
  payments: ProviderPayment[],
) {
  if (
    remote.order_id !== order.id ||
    remote.order_status !== "PAID" ||
    remote.order_currency !== "INR" ||
    Math.round(Number(remote.order_amount) * 100) !== order.amount
  )
    return null;
  return (
    payments.find(
      (p) =>
        p.payment_status === "SUCCESS" &&
        p.payment_currency === "INR" &&
        Math.round(Number(p.payment_amount) * 100) === order.amount &&
        p.cf_payment_id != null,
    ) || null
  );
}
export async function verifyPayment(order: Order) {
  if (order.status === "paid") return { paid: true, state: "PAID" };
  const remote = (await cashfree(
    `/orders/${encodeURIComponent(order.id)}`,
  )) as ProviderOrder;
  const payments = (await cashfree(
    `/orders/${encodeURIComponent(order.id)}/payments`,
  )) as ProviderPayment[];
  if (!Array.isArray(payments)) throw new Error("Invalid payment response");
  const payment = matchingPayment(order, remote, payments);
  if (payment) {
    db()
      .prepare(
        "UPDATE orders SET status='paid',payment_id=? WHERE id=? AND status='pending'",
      )
      .run(String(payment.cf_payment_id), order.id);
    return { paid: true, state: "PAID" };
  }
  if (["EXPIRED", "TERMINATED"].includes(remote.order_status))
    db()
      .prepare(
        "UPDATE orders SET status='expired' WHERE id=? AND status='pending'",
      )
      .run(order.id);
  return {
    paid: false,
    state:
      remote.order_status === "ACTIVE"
        ? payments.some((p) => p.payment_status === "FAILED")
          ? "FAILED"
          : "PENDING"
        : remote.order_status,
  };
}
