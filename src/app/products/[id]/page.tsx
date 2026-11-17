import Link from "next/link";
import { notFound } from "next/navigation";
import { studioProduct } from "@/lib/studio/repository";
import { LayerCard } from "@/components/studio/layer-card";
import { Invite } from "@/components/invite";
export const dynamic = "force-dynamic";
export default async function Product({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await studioProduct(id);
  if (!p) notFound();
  return (
    <section className="section detail-grid">
      {p.document.renderer === "layers" ? <LayerCard document={p.document} /> : <Invite theme={p.theme} animated={p.category === "animated"} />}
      <div className="detail-copy">
        <span className="eyebrow">{p.tag}</span>
        <h1>{p.name}</h1>
        <p>{p.description}</p>
        <h2>₹{p.price}</h2>
        <small>Proposed launch price · Sandbox checkout only</small>
        <div className="actions">
          <Link className="button" href={`/checkout/${p.id}`}>
            Choose this design ↗
          </Link>
          <Link className="text-link" href={`/preview/${p.id}`}>
            Preview design
          </Link>
        </div>
        <div className="notice">
          {p.document.website ? "Self-service website: personalise your story, events and photos, then publish a guest link. This package is separate from our managed delivery service." : p.category === "cards"
            ? "Personalise names, photo, date, time and venue after verified payment. Export a high-resolution PNG or PDF."
            : p.category === "animated"
              ? "Animated web invitation with a shareable link. MP4 export is not offered for this service."
              : p.category === "websites"
                ? "A managed service: submit your details after payment. We prepare your website in 3–4 days after receiving complete details."
                : "A manual video service. The team uploads your completed MP4 for delivery. This sample artwork is a style reference, not a video preview."}
        </div>
        <Link className="text-link" href="/policies/refund">
          Read delivery and refund information
        </Link>
      </div>
    </section>
  );
}
