import { z } from "zod";
import { user, sameOrigin } from "@/lib/auth";
import { db, getOrder, limit, transaction } from "@/lib/db";
import { readJson } from "@/lib/validation";
import { purchasedVersion, StudioConflict } from "@/lib/studio/repository";
import { editableValues } from "@/lib/studio/schema";
import { assetById, linkAsset } from "@/lib/storage/assets";

export const runtime = "nodejs";
const saveSchema = z.object({
  revision: z.number().int().nonnegative(),
  values: z.record(z.string().uuid(), z.string().max(2000)),
}).strict();
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const actor = await user();
  if (!actor) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params;
  const order = await getOrder(id);
  if (!order || order.user_id !== actor.id)
    return Response.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "paid")
    return Response.json({ error: "Verified payment required" }, { status: 403 });
  const pinned = await purchasedVersion(id);
  if (!pinned || pinned.content.renderer !== "layers")
    return Response.json({ error: "Layer editor not available" }, { status: 404 });
  const row = await db().prepare(
    "SELECT values_json,revision FROM customer_card_edits WHERE order_id=?",
  ).get(id) as {values_json:string;revision:number}|undefined;
  return Response.json({
    templateId: pinned.template_id,
    version: pinned.version,
    document: pinned.content,
    revision: row?.revision ?? 0,
    values: row ? JSON.parse(row.values_json) : {},
  }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const actor = await user();
  if (!actor) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params;
  const order = await getOrder(id);
  if (!order || order.user_id !== actor.id)
    return Response.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "paid")
    return Response.json({ error: "Verified payment required" }, { status: 403 });
  if (!(await limit(`card-save:${actor.id}`, 120, 60000)))
    return Response.json({ error: "Save rate limit reached" }, { status: 429 });
  try {
    const body = saveSchema.parse(await readJson(request, 180_000));
    const pinned = await purchasedVersion(id);
    if (!pinned || pinned.content.renderer !== "layers")
      return Response.json({ error: "Layer editor not available" }, { status: 404 });
    const values = editableValues(pinned.content, body.values);
    // Verify every uploaded photo belongs to the purchaser; a syntactically valid
    // /api/assets/UUID path is not proof of ownership.
    const photoAssets: string[] = [];
    for (const [key, value] of Object.entries(values)) {
      const layer = pinned.content.layers.find(l => l.id === key)!;
      if (layer.kind !== "image" || !value) continue;
      const match = /^\/api\/assets\/([a-f0-9-]{36})$/.exec(value);
      if (!match) throw new Error("Upload a private photo first");
      const asset = await assetById(match[1]);
      if (!asset || asset.owner_id !== actor.id || asset.status !== "ready" || asset.purpose !== "photo")
        throw new Error("The photo is not owned by this account");
      photoAssets.push(asset.id);
    }
    const revision = await transaction(async () => {
      const row = await db().prepare("SELECT revision FROM customer_card_edits WHERE order_id=?")
        .get(id) as {revision:number}|undefined;
      if ((row?.revision ?? 0) !== body.revision)
        throw new StudioConflict("This card changed in another tab. Reload before saving.");
      for (const asset of photoAssets)
        await linkAsset(asset, actor.id, "order_edit", id);
      const now = Date.now();
      const packed = JSON.stringify(values);
      let changes: number;
      if (row) {
        const result = await db().prepare(
          "UPDATE customer_card_edits SET values_json=?, revision=revision+1,updated=? WHERE order_id=? AND revision=?",
        ).run(packed, now, id, body.revision);
        changes = result.changes;
      } else {
        const result = await db().prepare(
          "INSERT INTO customer_card_edits(order_id,values_json,revision,updated) VALUES(?,?,1,?) ON CONFLICT(order_id) DO NOTHING",
        ).run(id, packed, now);
        changes = result.changes;
      }
      if (!changes) throw new StudioConflict("Concurrent card update. Reload before saving.");
      return body.revision + 1;
    });
    return Response.json({ revision, templateVersion: pinned.version });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof StudioConflict ? 409 : 400 },
    );
  }
}
