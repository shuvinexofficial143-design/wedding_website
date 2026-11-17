import { randomBytes } from "node:crypto";
import { db, getOrder, transaction, usingPostgres, type User } from "../db";
import { isAdmin } from "../auth";
import { purchasedVersion, StudioConflict } from "../studio/repository";
import { assetById, linkAsset } from "../storage/assets";
import {
  websiteDataSchema,
  websitePublicationSchema,
  sampleWebsite,
  type WebsiteData,
} from "./schema";
export async function websiteOrder(actor: User, id: string) {
  const order = await getOrder(id);
  if (!order || (order.user_id !== actor.id && !isAdmin(actor)))
    throw new Error("Order unavailable");
  if (order.status !== "paid") throw new Error("Verified payment required");
  const pinned = await purchasedVersion(id);
  if (
    !pinned?.content.website ||
    pinned.content.website.workflow !== "self-service"
  )
    throw new Error(
      "This managed product is not eligible for self-service publishing",
    );
  const saved = (await db()
    .prepare("SELECT requirements FROM wedding_website_orders WHERE order_id=?")
    .get(id)) as { requirements: string } | undefined;
  return {
    order,
    pinned,
    data: saved
      ? websiteDataSchema.parse(JSON.parse(saved.requirements))
      : sampleWebsite(),
  };
}
export async function updateWebsite(
  actor: User,
  id: string,
  revision: number,
  action: "save" | "publish" | "unpublish",
  input?: WebsiteData,
) {
  await websiteOrder(actor, id);
  return transaction(async () => {
    if (usingPostgres())
      await db().prepare("SELECT id FROM orders WHERE id=? FOR UPDATE").get(id);
    const { order, pinned, data: saved } = await websiteOrder(actor, id);
    if (order.revision !== revision)
      throw new StudioConflict(
        "Website changed in another tab. Reload before saving.",
      );
    const data = action === "save" ? websiteDataSchema.parse(input) : saved;
    if (action === "save") {
      for (const path of [data.couplePhoto, ...data.gallery].filter(Boolean)) {
        const a = await assetById(path.split("/").at(-1)!);
        if (
          !a ||
          a.owner_id !== order.user_id ||
          a.purpose !== "photo" ||
          a.status !== "ready"
        )
          throw new Error("Photo must belong to the purchasing customer");
        await linkAsset(a.id, order.user_id, "website_order", id);
      }
      await db()
        .prepare(
          "INSERT INTO wedding_website_orders(order_id,requirements,delivery_status,updated) VALUES(?,?,'self_service_draft',?) ON CONFLICT(order_id) DO UPDATE SET requirements=excluded.requirements,updated=excluded.updated",
        )
        .run(id, JSON.stringify(data), Date.now());
    }
    let token = order.public_token;
    if (action === "publish") {
      const publication = websitePublicationSchema.parse({
        kind: "wedding-site",
        version: pinned.version,
        data,
      });
      token = token || randomBytes(24).toString("hex");
      await db()
        .prepare("UPDATE orders SET public_token=?,published=? WHERE id=?")
        .run(token, JSON.stringify(publication), id);
    }
    if (action === "unpublish") {
      token = null;
      await db()
        .prepare(
          "UPDATE orders SET public_token=NULL,published=NULL WHERE id=?",
        )
        .run(id);
    }
    const changed = await db()
      .prepare(
        "UPDATE orders SET revision=revision+1 WHERE id=? AND revision=?",
      )
      .run(id, revision);
    if (!changed.changes) throw new StudioConflict("Concurrent website update");
    if (isAdmin(actor))
      await db()
        .prepare(
          "INSERT INTO audit(admin_id,order_id,action,created) VALUES(?,?,?,?)",
        )
        .run(actor.id, id, "website_" + action, Date.now());
    return { revision: revision + 1, token };
  });
}
