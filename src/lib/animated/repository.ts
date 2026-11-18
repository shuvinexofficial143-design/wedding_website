import {parseYouTubeId} from "./youtube";
import {assetById,linkAsset} from "../storage/assets";
import {getObject} from "../storage/objects";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, transaction, usingPostgres, type User } from "../db";

const httpsUrl = z.string().trim().max(1200).url().refine(value => {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
  catch { return false; }
}, "Use a valid HTTPS URL");
export const canvaEditUrl = httpsUrl.refine(value => {
  const url = new URL(value);
  return ["canva.com","www.canva.com"].includes(url.hostname.toLowerCase()) &&
    /^\/design\/[a-zA-Z0-9_-]+\/(?:[a-zA-Z0-9_-]+\/)?edit\/?$/.test(url.pathname);
}, "Use a private Canva design link");
export const animatedInput = z.object({
  styleNumber: z.string().trim().regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/),
  name: z.string().trim().min(2).max(120),
  category: z.enum(["wedding","engagement","anniversary","birthday","other"]),
  pricePaise: z.number().int().min(100).max(10_000_000),
  thumbnailUrl: z.union([httpsUrl,z.string().regex(/^\/api\/assets\/[0-9a-f-]{36}$/)]),
  youtubeUrl: z.string().trim().max(500),
  canvaUrl: canvaEditUrl,
}).strict().superRefine((data,ctx)=>{
  const host=new URL(data.thumbnailUrl,"https://local.invalid").hostname.toLowerCase();
  if(host==="canva.com" || host==="www.canva.com" || data.thumbnailUrl===data.canvaUrl)
    ctx.addIssue({code:"custom",path:["thumbnailUrl"],message:"Use a public image URL, never the private Canva design URL"});
});
export type AnimatedInput = z.infer<typeof animatedInput>;
export {parseYouTubeId} from "./youtube";
export { youtubeEmbed } from "./youtube";
export type PublicAnimated = {
  id: string; style_number: string; name: string; category: string;
  price_paise: number; thumbnail_url: string; youtube_video_id: string;
};
type PrivateAnimated = PublicAnimated & { canva_url: string; status: string; revision: number; created: number; updated: number };
export type AnimatedJob = {
  order_id:string; template_id:string; template_name:string; template_style:string;
  original_canva_url:string; youtube_video_id:string; editing_copy_url:string|null;
  delivery_url:string|null; paid_at:number|null; started_at:number|null;
  delivered_at:number|null; revision:number; created:number;
  email:string; phone:string; details:string; payment_status:string;
  amount:number; fulfillment:string;
};
export class AnimatedConflict extends Error {}
export async function listAnimatedPublic() {
  return await db().prepare("SELECT id,style_number,name,category,price_paise,thumbnail_url,youtube_video_id FROM animated_templates WHERE status='published' ORDER BY created DESC").all() as PublicAnimated[];
}
export async function publicAnimatedById(id:string) {
  return await db().prepare("SELECT id,style_number,name,category,price_paise,thumbnail_url,youtube_video_id FROM animated_templates WHERE id=? AND status='published'").get(id) as PublicAnimated|undefined;
}
export async function listAnimatedAdmin() {
  return await db().prepare("SELECT id,style_number,name,category,price_paise,thumbnail_url,youtube_video_id,canva_url,status,revision,created,updated FROM animated_templates ORDER BY created DESC").all() as PrivateAnimated[];
}
export async function privateAnimatedById(id:string) {
  return await db().prepare("SELECT * FROM animated_templates WHERE id=?").get(id) as PrivateAnimated|undefined;
}
async function logAction(actor:User,kind:string,id:string,action:string) {
  await db().prepare("INSERT INTO admin_audit_logs(id,admin_id,entity_type,entity_id,action,metadata,created) VALUES(?,?,?,?,?,'{}',?)")
    .run(randomUUID(),actor.id,kind,id,action,Date.now());
}
async function linkThumbnail(actor:User,id:string,url:string) {
  if(!url.startsWith('/api/assets/'))return;
  const asset=await assetById(url.slice('/api/assets/'.length));
  if(!asset||asset.purpose!=='thumbnail'||asset.mime!=='image/png')throw new Error('Use a validated thumbnail upload');
  await linkAsset(asset.id,actor.id,'animated_template',id);
}
export async function createAnimated(actor:User,raw:unknown) {
  const body=animatedInput.parse(raw);
  const youtubeId=parseYouTubeId(body.youtubeUrl);
  return transaction(async()=>{
    const id=randomUUID(),now=Date.now();
    await db().prepare("INSERT INTO animated_templates(id,style_number,name,category,price_paise,thumbnail_url,youtube_video_id,canva_url,status,created_by,created,updated) VALUES(?,?,?,?,?,?,?,?,'draft',?,?,?)")
      .run(id,body.styleNumber,body.name,body.category,body.pricePaise,body.thumbnailUrl,youtubeId,body.canvaUrl,actor.id,now,now);
    await linkThumbnail(actor,id,body.thumbnailUrl);
    await logAction(actor,"animated_template",id,"created");
    return {id,revision:1,status:"draft"};
  });
}
export async function updateAnimated(actor:User,id:string,revision:number,raw:unknown) {
  const body=animatedInput.parse(raw),youtubeId=parseYouTubeId(body.youtubeUrl);
  return transaction(async()=>{
    const changed=await db().prepare("UPDATE animated_templates SET style_number=?,name=?,category=?,price_paise=?,thumbnail_url=?,youtube_video_id=?,canva_url=?,revision=revision+1,updated=? WHERE id=? AND revision=?")
      .run(body.styleNumber,body.name,body.category,body.pricePaise,body.thumbnailUrl,youtubeId,body.canvaUrl,Date.now(),id,revision);
    if(!changed.changes)throw new AnimatedConflict("Template updated elsewhere. Reload.");
    await linkThumbnail(actor,id,body.thumbnailUrl);
    await logAction(actor,"animated_template",id,"updated");
    return {id,revision:revision+1};
  });
}
export async function setAnimatedPublished(actor:User,id:string,revision:number,status:"published"|"unpublished") {
  return transaction(async()=>{
    const changed=await db().prepare("UPDATE animated_templates SET status=?,revision=revision+1,updated=? WHERE id=? AND revision=?")
      .run(status,Date.now(),id,revision);
    if(!changed.changes)throw new AnimatedConflict("Template updated elsewhere. Reload.");
    await logAction(actor,"animated_template",id,status);
    return {id,revision:revision+1,status};
  });
}
export async function linkAnimatedOrder(orderId:string,template:PublicAnimated) {
  const row=await privateAnimatedById(template.id);
  if(!row||row.status!=="published")throw new Error("Animated design is no longer available");
  await db().prepare("INSERT INTO animated_order_jobs(order_id,template_id,template_name,template_style,original_canva_url,youtube_video_id,created) VALUES(?,?,?,?,?,?,?) ON CONFLICT(order_id) DO NOTHING")
    .run(orderId,row.id,row.name,row.style_number,row.canva_url,row.youtube_video_id,Date.now());
}
export async function markAnimatedPaid(orderId:string) {
  await db().prepare("UPDATE animated_order_jobs SET paid_at=? WHERE order_id=? AND paid_at IS NULL")
    .run(Date.now(),orderId);
}
export async function privateAnimatedJob(orderId:string) {
  return await db().prepare("SELECT j.*,o.phone,o.details,o.amount,o.fulfillment,o.status AS payment_status,u.email FROM animated_order_jobs j JOIN orders o ON o.id=j.order_id JOIN users u ON u.id=o.user_id WHERE j.order_id=?")
    .get(orderId) as AnimatedJob|undefined;
}
export async function ownedAnimatedJob(orderId:string,ownerId:string) {
  return await db().prepare("SELECT j.order_id,j.template_name,j.template_style,j.youtube_video_id,j.delivered_at,j.delivery_url,o.details,o.fulfillment,o.status AS payment_status FROM animated_order_jobs j JOIN orders o ON o.id=j.order_id WHERE j.order_id=? AND o.user_id=?")
    .get(orderId,ownerId) as {order_id:string;template_name:string;template_style:string;youtube_video_id:string;delivered_at:number|null;delivery_url:string|null;details:string;fulfillment:string;payment_status:string}|undefined;
}
export function fulfilmentState(job:Pick<AnimatedJob,"delivered_at"|"started_at"|"paid_at">,now=Date.now()) {
  if(job.delivered_at)return "delivered";
  if(job.paid_at && now>=job.paid_at+60*60_000)return "overdue";
  if(job.started_at)return "editing";
  return "pending";
}
export async function listAnimatedJobs() {
  return await db().prepare("SELECT j.order_id,j.template_name,j.template_style,j.paid_at,j.started_at,j.delivered_at,j.revision,o.phone,o.details,o.status AS payment_status,o.fulfillment,o.created,u.email FROM animated_order_jobs j JOIN orders o ON o.id=j.order_id JOIN users u ON u.id=o.user_id WHERE o.status='paid' ORDER BY COALESCE(j.paid_at,o.created) DESC LIMIT 300")
    .all() as (Pick<AnimatedJob,"order_id"|"template_name"|"template_style"|"paid_at"|"started_at"|"delivered_at"|"revision"|"phone"|"fulfillment"|"email"|"details"> & {created:number;payment_status:string})[];
}
export async function changeAnimatedJob(actor:User,orderId:string,revision:number,action:"copy"|"editing"|"delivered",rawCopy?:string,rawDelivery?:string,deliveryAssetId?:string) {
  return transaction(async()=>{
    const job=await privateAnimatedJob(orderId);
    if(!job || job.payment_status!=="paid")throw new Error("Verified paid animated order not found");
    if(job.revision!==revision)throw new AnimatedConflict("Order updated elsewhere. Reload.");
    if(job.delivered_at)throw new Error("This order was already delivered and is locked");
    if(action==="editing" && job.started_at)throw new Error("Editing already started");
    const copy=rawCopy===undefined?job.editing_copy_url:canvaEditUrl.parse(rawCopy);
    // Canva URLs can differ only by tracking query even when they refer to
    // the same design: compare canonical design IDs, not URL strings.
    const designId=(url:string)=>new URL(url).pathname.split("/")[2];
    if(copy && designId(copy)===designId(job.original_canva_url))
      throw new Error("Create an independent Canva copy for this order; do not edit the original");
    if (copy) {
      // Serialise the per-order-copy check across independent PostgreSQL
      // transactions. SQLite uses BEGIN IMMEDIATE in our shared DB adapter.
      if (usingPostgres()) await db().prepare("SELECT pg_advisory_xact_lock(1743112703)").get();
      const others=await db().prepare(
        "SELECT order_id,editing_copy_url FROM animated_order_jobs WHERE editing_copy_url IS NOT NULL AND order_id<>?"
      ).all(orderId) as {order_id:string;editing_copy_url:string}[];
      if(others.some(row=>designId(row.editing_copy_url)===designId(copy)))
        throw new Error("That Canva editing copy is already assigned to another order; create a new copy");
    }
    const now=Date.now();
    if(action==="copy" && !copy)throw new Error("Paste this order's independent Canva editing copy URL");
    if(action==="editing" && !copy)throw new Error("Create and save a separate Canva editing copy first");
    if(action==="editing" && !JSON.parse(job.details || "{}").partnerA)
      throw new Error("Customer details are required before editing");
    if(action==="delivered" && !job.started_at)
      throw new Error("Mark Editing before delivery");
    let delivery=job.delivery_url;
    if(action==='delivered') {
      if(deliveryAssetId) {
        const asset=await assetById(deliveryAssetId);
        if(!asset||asset.owner_id!==actor.id||asset.purpose!=='video'||asset.mime!=='video/mp4'||asset.status!=='ready')throw new Error('Completed private MP4 upload required');
        const bytes=await getObject(asset.object_key,asset.size_bytes);
        if(bytes.length!==asset.size_bytes)throw new Error('Delivery file unavailable; retry upload');
        await linkAsset(asset.id,actor.id,'order_delivery',orderId);
        delivery='/api/orders/'+orderId+'/video';
        await db().prepare('UPDATE orders SET video_path=? WHERE id=?').run('asset:'+asset.id,orderId);
      } else {
        delivery=httpsUrl.parse(rawDelivery);
        const host=new URL(delivery).hostname.toLowerCase();
        if(host==='canva.com'||host.endsWith('.canva.com'))throw new Error('Private Canva links cannot be customer deliveries');
      }
    }
    const changed=await db().prepare("UPDATE animated_order_jobs SET editing_copy_url=?,delivery_url=?,started_at=?,delivered_at=?,revision=revision+1 WHERE order_id=? AND revision=?")
      .run(copy||null,delivery||null,action==="editing"?(job.started_at||now):job.started_at,action==="delivered"?now:job.delivered_at,orderId,revision);
    if(!changed.changes)throw new AnimatedConflict("Concurrent fulfilment update");
    if(action==="editing")await db().prepare("UPDATE orders SET fulfillment='in_progress' WHERE id=? AND status='paid'").run(orderId);
    if(action==="delivered")await db().prepare("UPDATE orders SET fulfillment='delivered',final_url=? WHERE id=? AND status='paid'").run(delivery!,orderId);
    await logAction(actor,"animated_order",orderId,action);
    return {ok:true,revision:revision+1,status:action};
  });
}
