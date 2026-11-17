import { user,isAdmin,sameOrigin } from "@/lib/auth";
import { limit } from "@/lib/db";
import { readJson } from "@/lib/validation";
import { listAnimatedAdmin,createAnimated } from "@/lib/animated/repository";
export const runtime="nodejs";
const privateHeaders={"Cache-Control":"private, no-store"};
export async function GET(){
  const actor=await user();
  if(!actor || !isAdmin(actor))return Response.json({error:"Admin only"},{status:403});
  return Response.json({templates:await listAnimatedAdmin()},{headers:privateHeaders});
}
export async function POST(req:Request){
  if(!sameOrigin(req))return Response.json({error:"Invalid origin"},{status:403});
  const actor=await user();
  if(!actor || !isAdmin(actor))return Response.json({error:"Admin only"},{status:403});
  if(!await limit("animated-create:"+actor.id,40,60000))return Response.json({error:"Too many requests"},{status:429});
  try{return Response.json(await createAnimated(actor,await readJson(req,6000)),{status:201,headers:privateHeaders});}
  catch(e){return Response.json({error:(e as Error).message},{status:400,headers:privateHeaders});}
}
