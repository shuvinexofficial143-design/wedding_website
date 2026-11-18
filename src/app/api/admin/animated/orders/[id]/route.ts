import { z } from "zod";
import {user,isAdmin,sameOrigin} from "@/lib/auth";
import {readJson} from "@/lib/validation";
import {privateAnimatedJob,changeAnimatedJob,AnimatedConflict,fulfilmentState} from "@/lib/animated/repository";
export const runtime="nodejs";
type Context={params:Promise<{id:string}>};
const headers={"Cache-Control":"private, no-store"};
export async function GET(_req:Request,{params}:Context){
  const actor=await user();
  if(!actor||!isAdmin(actor))return Response.json({error:"Admin only"},{status:403});
  const job=await privateAnimatedJob((await params).id);
  if(!job||job.payment_status!=="paid")return Response.json({error:"Paid animated order not found"},{status:404});
  return Response.json({job:{...job,state:fulfilmentState(job),deadlineAt:job.paid_at?job.paid_at+3600000:null}},{headers});
}
export async function PATCH(req:Request,{params}:Context){
  if(!sameOrigin(req))return Response.json({error:"Invalid origin"},{status:403});
  const actor=await user();
  if(!actor||!isAdmin(actor))return Response.json({error:"Admin only"},{status:403});
  try{
    const raw=await readJson(req,4000);
    const body=z.object({revision:z.number().int().nonnegative(),action:z.enum(["copy","editing","delivered"]),editingCopyUrl:z.string().max(1200).optional(),deliveryUrl:z.string().max(1200).optional()}).strict().parse(raw);
    return Response.json(await changeAnimatedJob(actor,(await params).id,body.revision,body.action,body.editingCopyUrl,body.deliveryUrl),{headers});
  }catch(e){return Response.json({error:(e as Error).message},{status:e instanceof AnimatedConflict?409:400,headers});}
}
