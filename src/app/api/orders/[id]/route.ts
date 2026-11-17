import { randomBytes } from "node:crypto";
import { user, sameOrigin } from "@/lib/auth";
import { db, getOrder, limit } from "@/lib/db";
import { detailsSchema, readJson } from "@/lib/validation";
import { products } from "@/lib/catalog";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(req))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const u = await user();
  if (!u) return Response.json({ error: "Sign in first" }, { status: 401 });
  const { id } = await params;
  const o = (await getOrder(id));
  if (!o || o.user_id !== u.id)
    return Response.json({ error: "Order not found" }, { status: 404 });
  if (o.status !== "paid")
    return Response.json(
      { error: "Verified payment is required" },
      { status: 403 },
    );
  if (!(await limit(`save:${u.id}`, 100, 60000)))
    return Response.json(
      { error: "Please wait before saving again" },
      { status: 429 },
    );
  try {
    const body = await readJson(req);
    if (body.action === "unpublish") {
      (await db()
        .prepare(
          "UPDATE orders SET public_token=NULL,published=NULL WHERE id=?",
        )
        .run(id));
      return Response.json({ ok: true });
    }
    const details = detailsSchema.parse(body.details);
    if (!Number.isInteger(body.revision)) throw new Error("Missing revision");
    if (
      body.action === "publish" &&
      !["cards", "animated"].includes(
        products.find((p) => p.id === o.product_id)!.category,
      )
    )
      return Response.json(
        { error: "Your managed website will be published by our team." },
        { status: 400 },
      );
    const changed = (await db()
      .prepare(
        "UPDATE orders SET details=?,revision=revision+1,fulfillment=CASE WHEN fulfillment='awaiting_details' THEN 'details_received' ELSE fulfillment END WHERE id=? AND revision=?",
      )
      .run(JSON.stringify(details), id, body.revision));
    if (!changed.changes)
      return Response.json(
        {
          error:
            "This invitation changed in another tab. Reload before saving.",
        },
        { status: 409 },
      );
    let token = o.public_token;
    if (body.action === "publish") {
      token = token || randomBytes(24).toString("hex");
      (await db()
        .prepare("UPDATE orders SET published=?,public_token=? WHERE id=?")
        .run(JSON.stringify(details), token, id));
    }
    return Response.json({ revision: body.revision + 1, token });
  } catch {
    return Response.json(
      {
        error:
          "Invalid details. Check names, date, time, photo size and Google Maps URL.",
      },
      { status: 400 },
    );
  }
}
