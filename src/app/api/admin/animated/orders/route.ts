import {user,isAdmin} from "@/lib/auth";
import {listAnimatedJobs,fulfilmentState} from "@/lib/animated/repository";
export const runtime="nodejs";
export async function GET(req:Request){
  const actor=await user();
  if(!actor || !isAdmin(actor))return Response.json({error:"Admin only"},{status:403});
  const url=new URL(req.url),search=(url.searchParams.get("q")||"").trim().toLowerCase().slice(0,120);
  const status=url.searchParams.get("status")||"all";
  if(!["all","pending","editing","overdue","delivered"].includes(status))
    return Response.json({error:"Invalid filter"},{status:400});
  const rows=(await listAnimatedJobs()).map(job=>({...job,state:fulfilmentState(job),deadlineAt:job.paid_at?job.paid_at+3600000:null}));
  const matches=rows.filter(j=>(status==="all"||j.state===status) &&
    (!search||[j.order_id,j.template_style,j.template_name,j.email,j.phone].some(s=>s.toLowerCase().includes(search))));
  return Response.json({orders:matches,pending:rows.filter(j=>j.state!=="delivered").length,overdue:rows.filter(j=>j.state==="overdue").length},{headers:{"Cache-Control":"private, no-store"}});
}
