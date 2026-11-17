import { notFound, redirect } from "next/navigation";
import { user } from "@/lib/auth";
import { getOrder } from "@/lib/db";
import { products } from "@/lib/catalog";
import { defaultDetails } from "@/lib/validation";
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
  if (!o || o.user_id !== u.id) notFound();
  if (o.status !== "paid") redirect(`/checkout/${o.product_id}?order=${id}`);
  const p = products.find((p) => p.id === o.product_id)!;
  return (
    <section className="section">
      <span className="eyebrow">YOUR INVITATION STUDIO</span>
      <h1>
        Make it <i>yours.</i>
      </h1>
      <Editor
        id={id}
        theme={p.theme}
        category={p.category}
        initial={{ ...defaultDetails, ...JSON.parse(o.details) }}
        initialRevision={o.revision}
        initialToken={o.public_token}
      />
    </section>
  );
}
