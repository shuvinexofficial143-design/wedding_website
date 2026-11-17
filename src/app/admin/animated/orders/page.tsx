import {redirect,notFound} from "next/navigation";
import Link from "next/link";
import {user,isAdmin} from "@/lib/auth";
import {AnimatedOrderQueue} from "@/components/animated/order-queue";
export const dynamic="force-dynamic";
export default async function AnimatedOrders(){
  const actor=await user();
  if(!actor)redirect("/login?next=/admin/animated/orders");
  if(!isAdmin(actor))notFound();
  return <section className="section"><span className="eyebrow">PRIVATE FULFILMENT</span>
    <h1>60-minute <i>delivery queue.</i></h1>
    <p>Only verified paid animated orders appear here. Deadline starts at server-verified payment, not order creation. Complete customer details are required before editing.</p>
    <p><Link href="/admin/animated" className="text-link">Manage templates ↗</Link></p><AnimatedOrderQueue/>
  </section>;
}
