import {z} from "zod";
import {user,sameOrigin} from "@/lib/auth";
import {db,getOrder,limit} from "@/lib/db";
import {detailsSchema,readJson} from "@/lib/validation";
import {ownedAnimatedJob} from "@/lib/animated/repository";
type Context={params:Promise<{id:string}>};
export const runtime="nodejs";
export async function GET(_req:Request,{params}:Context){
  const actor=await user();
  if(!actor)return Response.json({error:"Sign in required"},{status:401});
  const row=await ownedAnimatedJob((await params).id,actor.id);
  if(!row)return Response.json({error:"Order not found"},{status:404});
  if(row.payment_status!=="paid")return Response.json({error:"Verified payment required"},{status:403});
  return Response.json({templateName:row.template_name,templateStyle:row.template_style,
    videoId:row.youtube_video_id,details:JSON.parse(row.details),fulfillment:row.fulfillment,
    deliveryUrl:row.delivered_at?row.delivery_url:null},
    {headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(req:Request,{params}:Context){
  if(!sameOrigin(req))return Response.json({error:"Invalid origin"},{status:403});
  const actor=await user();
  if(!actor)return Response.json({error:"Sign in required"},{status:401});
  const id=(await params).id,order=await getOrder(id);
  if(!order||order.user_id!==actor.id)return Response.json({error:"Order not found"},{status:404});
  if(order.status!=="paid")return Response.json({error:"Verified payment required"},{status:403});
  if(!await ownedAnimatedJob(id,actor.id))return Response.json({error:"Not an animated order"},{status:404});
  if(!await limit("animated-details:"+actor.id,60,60000))return Response.json({error:"Rate limit"},{status:429});
  try {
    const body=z.object({revision:z.number().int().nonnegative(),details:detailsSchema}).strict().parse(await readJson(req,1600000));
    const updated=await db().prepare("UPDATE orders SET details=?,revision=revision+1,fulfillment=CASE WHEN fulfillment='awaiting_details' THEN 'details_received' ELSE fulfillment END WHERE id=? AND user_id=? AND status='paid' AND revision=? AND fulfillment!='delivered'")
      .run(JSON.stringify(body.details),id,actor.id,body.revision);
    if(!updated.changes)return Response.json({error:"Order was changed or already delivered; reload"},{status:409});
    return Response.json({ok:true,revision:body.revision+1});
  }catch(e){return Response.json({error:e instanceof z.ZodError?"Please check required wedding details":(e as Error).message},{status:400});}
}
