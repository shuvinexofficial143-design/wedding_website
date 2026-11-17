import { randomUUID } from "node:crypto";
import { z } from "zod";
import { user, sameOrigin } from "@/lib/auth";
import { db, limit, type Order } from "@/lib/db";
import { products } from "@/lib/catalog";
import { readJson } from "@/lib/validation";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const u = await user();
  if (!u) return Response.json({ error: "Sign in first" }, { status: 401 });
  try {
    const parsed = z
      .object({
        productId: z.string(),
        phone: z.string().regex(/^[6-9]\d{9}$/),
      })
      .safeParse(await readJson(req, 4096));
    if (!parsed.success)
      return Response.json(
        { error: "Enter a valid 10-digit Indian mobile number." },
        { status: 400 },
      );
    const p = products.find((p) => p.id === parsed.data.productId);
    if (!p) return Response.json({ error: "Unknown design" }, { status: 404 });
    if (!(await limit(`order:${u.id}`, 20, 3600000)))
      return Response.json(
        { error: "Please try again later." },
        { status: 429 },
      );
    let order = (await db()
      .prepare(
        "SELECT * FROM orders WHERE user_id=? AND product_id=? AND status='pending'",
      )
      .get(u.id, p.id)) as Order | undefined;
    if (!order) {
      const id = randomUUID();
      (await db()
        .prepare(
          "INSERT INTO orders(id,user_id,product_id,amount,phone,created) VALUES(?,?,?,?,?,?)",
        )
        .run(id, u.id, p.id, p.price * 100, parsed.data.phone, Date.now()));
      order = (await db().prepare("SELECT * FROM orders WHERE id=?").get(id)) as Order;
    }
    return Response.json({ id: order.id });
  } catch {
    return Response.json(
      { error: "Unable to create order. Please retry." },
      { status: 400 },
    );
  }
}
