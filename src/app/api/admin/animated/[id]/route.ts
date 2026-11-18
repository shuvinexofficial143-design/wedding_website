import {z} from "zod";
import { user,isAdmin,sameOrigin } from "@/lib/auth";
import {readJson} from "@/lib/validation";
import {privateAnimatedById,updateAnimated,setAnimatedPublished,AnimatedConflict} from "@/lib/animated/repository";
export const runtime="nodejs";
const privateHeaders={"Cache-Control":"private, no-store"};
type Context={params:Promise<{id:string}>};
export async function GET(_req:Request,{params}:Context){
  const actor=await user();
  if(!actor || !isAdmin(actor))return Response.json({error:"Admin only"},{status:403});
  const row=await privateAnimatedById((await params).id);
  if(!row)return Response.json({error:"Not found"},{status:404});
  return Response.json({template:row},{headers:privateHeaders});
}
export async function PATCH(req:Request,{params}:Context){
  if(!sameOrigin(req))return Response.json({error:"Invalid origin"},{status:403});
  const actor=await user();
  if(!actor || !isAdmin(actor))return Response.json({error:"Admin only"},{status:403});
  try{
    const body=await readJson(req,6000);
    const id=(await params).id;
    const revision=z.number().int().positive().parse(body.revision);
    if(body.action==="save")return Response.json(await updateAnimated(actor,id,revision,body.template),{headers:privateHeaders});
    const action=z.enum(["published","unpublished"]).parse(body.action);
    return Response.json(await setAnimatedPublished(actor,id,revision,action),{headers:privateHeaders});
  }catch(e){return Response.json({error:(e as Error).message},{status:e instanceof AnimatedConflict?409:400,headers:privateHeaders});}
}
