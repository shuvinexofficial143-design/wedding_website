import {WebsiteEditor} from "@/components/website/website-editor";
import {websiteOrder} from "@/lib/website/repository";
import { notFound, redirect } from "next/navigation";
import { user,isAdmin } from "@/lib/auth";
import { getOrder } from "@/lib/db";
import { products } from "@/lib/catalog";
import { defaultDetails } from "@/lib/validation";
import { db } from "@/lib/db";
import { purchasedVersion } from "@/lib/studio/repository";
import { type CardDocument } from "@/lib/studio/schema";
import { CustomerStudioEditor } from "@/components/studio/customer-editor";
import { Editor } from "@/components/editor";
export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await user();
  if (!u) redirect(`/login?next=/editor/${id}`);
  const o = (await getOrder(id));
  if (!o || (o.user_id !== u.id && !isAdmin(u))) notFound();
  if (o.status !== "paid") redirect(`/checkout/${o.product_id}?order=${id}`);
  const pinned = await purchasedVersion(id);
  if(pinned?.content.website){const w=await websiteOrder(u,id);return <WebsiteEditor orderId={id} template={pinned.content.website} initial={w.data} initialRevision={o.revision} initialToken={o.public_token}/>;}
  if(o.user_id!==u.id)notFound();
  if (pinned?.content.renderer === "layers") {
    const saved = await db().prepare(
      "SELECT values_json,revision FROM customer_card_edits WHERE order_id=?",
    ).get(id) as { values_json: string; revision: number } | undefined;
    const { renderer: _renderer, legacyTheme: _legacyTheme, legacyProduct: _legacyProduct, legacyArtwork: _legacyArtwork, ...document } = pinned.content;
    void _renderer; void _legacyTheme; void _legacyProduct; void _legacyArtwork;
    return (
      <section className="section">
        <span className="eyebrow">YOUR PURCHASED CARD STUDIO</span>
        <h1>Make it <i>yours.</i></h1>
        <CustomerStudioEditor
          orderId={id}
          document={document as CardDocument}
          templateVersion={pinned.version}
          initialValues={saved ? JSON.parse(saved.values_json) : {}}
          initialRevision={saved?.revision ?? 0}
          initialToken={o.public_token}
        />
      </section>
    );
  }
  const fallback = products.find(p => p.id === o.product_id);
  const theme = pinned?.content.legacyTheme || fallback?.theme;
  const category = pinned?.content.category || fallback?.category;
  if (!theme || !category) notFound();
  return (
    <section className="section">
      <span className="eyebrow">YOUR INVITATION STUDIO</span>
      <h1>
        Make it <i>yours.</i>
      </h1>
      <Editor
        id={id}
        theme={theme}
        category={category}
        initial={{ ...defaultDetails, ...JSON.parse(o.details) }}
        initialRevision={o.revision}
        initialToken={o.public_token}
      />
    </section>
  );
}
