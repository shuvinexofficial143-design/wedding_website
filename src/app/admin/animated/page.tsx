import {notFound,redirect} from "next/navigation";
import Link from "next/link";
import {user,isAdmin} from "@/lib/auth";
import {AnimatedTemplateManager} from "@/components/animated/template-manager";
export const dynamic="force-dynamic";
export default async function AdminAnimated(){
  const actor=await user();
  if(!actor)redirect("/login?next=/admin/animated");
  if(!isAdmin(actor))notFound();
  return <section className="section"><span className="eyebrow">PRIVATE DESIGN WORKSPACE</span>
    <h1>Animated <i>invitations.</i></h1>
    <p>Manage YouTube video samples and private Canva originals. Unpublished templates never enter the public catalog.</p>
    <div className="actions"><Link className="button" href="/admin/animated/orders">Fulfilment queue ↗</Link><Link className="text-link" href="/admin/cards">Card Studio</Link></div>
    <AnimatedTemplateManager/>
  </section>;
}
