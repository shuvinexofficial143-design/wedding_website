import {redirect,notFound} from "next/navigation";
import Link from "next/link";
import {user,isAdmin} from "@/lib/auth";
import {privateAnimatedJob} from "@/lib/animated/repository";
import {AnimatedOrderFulfilment} from "@/components/animated/order-fulfilment";
export const dynamic="force-dynamic";
export default async function AnimatedOrderPage({params}:{params:Promise<{id:string}>}){
  const actor=await user();
  if(!actor)redirect("/login?next=/admin/animated/orders");
  if(!isAdmin(actor))notFound();
  const job=await privateAnimatedJob((await params).id);
  if(!job||job.payment_status!=="paid")notFound();
  return <section className="section"><span className="eyebrow">PRIVATE PAID ORDER</span><h1>Animated order <i>fulfilment.</i></h1>
    <p><Link href="/admin/animated/orders" className="text-link">Back to delivery queue</Link></p>
    <AnimatedOrderFulfilment initial={job}/>
  </section>;
}
