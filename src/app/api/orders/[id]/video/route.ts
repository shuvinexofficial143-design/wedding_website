import {assetById,beginAsset,completeAsset,linkAsset} from "@/lib/storage/assets";
import {getObject,putObject,downloadUrl,localStorage} from "@/lib/storage/objects";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {hashBytes,validateAsset} from "@/lib/storage/validate";
import { user, isAdmin, sameOrigin } from "@/lib/auth";
import { db, getOrder, transaction } from "@/lib/db";
import { products } from "@/lib/catalog";
const directory = () =>
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(req))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const u = await user();
  if (!u || !isAdmin(u))
    return Response.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await params;
  const o = (await getOrder(id));
  if (
    !o ||
    o.status !== "paid" ||
    products.find((p) => p.id === o.product_id)?.category !== "videos"
  )
    return Response.json(
      { error: "Paid video order not found" },
      { status: 404 },
    );
  if (Number(req.headers.get("content-length") || 0) > 52 * 1024 * 1024)
    return Response.json({ error: "Maximum upload is 50 MB" }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("video");
    if (
      !(file instanceof File) ||
      file.size > 50 * 1024 * 1024 ||
      file.size < 12
    )
      return Response.json(
        { error: "Upload an MP4 under 50 MB." },
        { status: 400 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.toString("ascii", 4, 8) !== "ftyp" || file.type !== "video/mp4")
      return Response.json({ error: "Invalid MP4 file." }, { status: 400 });
    await validateAsset(buffer,file.type,'video');
    const pending=await beginAsset(u,{purpose:'video',mime:file.type,size:buffer.length,sha256:hashBytes(buffer)});
    let asset=(await assetById(pending.id))!;
    if(!pending.ready){await putObject(asset.object_key,buffer,file.type);asset=await completeAsset(asset);}
    await transaction(async()=>{
      await linkAsset(asset.id,u.id,'order_delivery',id);
      await db().prepare("UPDATE orders SET video_path=?,fulfillment='delivered' WHERE id=? AND status='paid'").run('asset:'+asset.id,id);
      await db().prepare('INSERT INTO audit(admin_id,order_id,action,created) VALUES(?,?,?,?)').run(u.id,id,'video_uploaded',Date.now());
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Upload failed. Please retry." },
      { status: 500 },
    );
  }
}
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await user();
  if (!u) return new Response("Sign in required", { status: 401 });
  const { id } = await params;
  const o = (await getOrder(id));
  if (
    !o ||
    o.status !== "paid" ||
    (o.user_id !== u.id && !isAdmin(u)) ||
    !o.video_path
  )
    return new Response("Not found", { status: 404 });
  try {
    if(o.video_path.startsWith('asset:')) {
      const asset=await assetById(o.video_path.slice(6));
      const link=asset&&await db().prepare("SELECT asset_id FROM asset_links WHERE asset_id=? AND scope='order_delivery' AND scope_id=?").get(asset.id,id);
      if(!asset||!link||asset.status!=='ready'||asset.purpose!=='video'||asset.mime!=='video/mp4')return new Response('Not found',{status:404});
      if(!localStorage())return new Response(null,{status:302,headers:{Location:await downloadUrl(asset.object_key),'Cache-Control':'private, no-store'}});
      const bytes=await getObject(asset.object_key,asset.size_bytes);
      return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'video/mp4','Content-Disposition':'attachment; filename="wedding-invitation.mp4"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
    }
    const bytes = await readFile(
      /* turbopackIgnore: true */ path.join(
        /* turbopackIgnore: true */ directory(),
        path.basename(o.video_path),
      ),
    );
    return new Response(bytes, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="wedding-invitation.mp4"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(
      "Delivery file is temporarily unavailable. Contact support.",
      { status: 503 },
    );
  }
}
