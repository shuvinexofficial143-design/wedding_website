import { verifySignature, verifyPayment } from "@/lib/cashfree";
import { getOrder } from "@/lib/db";
export async function POST(req: Request) {
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 100000)
    return new Response("Too large", { status: 413 });
  if (
    !verifySignature(
      raw,
      req.headers.get("x-webhook-timestamp") || "",
      req.headers.get("x-webhook-signature") || "",
    )
  )
    return new Response("Invalid signature", { status: 401 });
  try {
    const event = JSON.parse(raw);
    const id = event?.data?.order?.order_id;
    if (typeof id !== "string")
      return new Response("Invalid order", { status: 400 });
    const order = getOrder(id);
    if (!order) return new Response("Unknown order", { status: 404 });
    if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
      const result = await verifyPayment(order);
      if (!result.paid)
        return new Response("Verification pending", { status: 503 });
    }
    return Response.json({ received: true });
  } catch {
    return new Response("Retry verification", { status: 503 });
  }
}
