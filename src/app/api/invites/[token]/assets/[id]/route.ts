import {websitePublicationSchema,websiteAssets} from "@/lib/website/schema";
import { db, type Order } from "@/lib/db";
import { purchasedVersion } from "@/lib/studio/repository";
import { studioPublicationSchema, isPublishedStudioAsset } from "@/lib/studio/publication";
import { assetById } from "@/lib/storage/assets";
import { getObject } from "@/lib/storage/objects";
export const runtime = "nodejs";

/** A bearer invitation link can reveal only assets used in that exact published snapshot. */
export async function GET(_request: Request, {
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  if (!/^[a-f0-9]{48}$/.test(token) ||
      !/^[a-f0-9]{8}-[a-f0-9-]{27}$/.test(id))
    return new Response("Not found", { status: 404 });
  const order = await db().prepare(
    "SELECT * FROM orders WHERE public_token=? AND status='paid'",
  ).get(token) as Order | undefined;
  if (!order?.published) return new Response("Not found", { status: 404 });
  let raw: unknown;
  try { raw = JSON.parse(order.published); }
  catch { return new Response("Not found", { status: 404 }); }
  const parsed = studioPublicationSchema.safeParse(raw);
  const site=websitePublicationSchema.safeParse(raw);
  const pinned=await purchasedVersion(order.id);
  const allowed=pinned && ((parsed.success && pinned.content.renderer==='layers' && pinned.version===parsed.data.version && isPublishedStudioAsset(pinned.content,parsed.data.values,id)) || (site.success && pinned.content.website && pinned.version===site.data.version && websiteAssets({...site.data.data,sections:site.data.data.sections.filter(s=>pinned.content.website!.sections.includes(s))}).includes(id)));
  if(!allowed)return new Response('Not found',{status:404});
  const asset = await assetById(id);
  if (!asset || asset.status !== "ready" ||
      !["image/png","image/jpeg","image/webp"].includes(asset.mime))
    return new Response("Not found", { status: 404 });
  try {
    const bytes = await getObject(asset.object_key);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": asset.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Image temporarily unavailable", { status: 503 });
  }
}
