import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/lib/catalog";
import { Invite } from "@/components/invite";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = products.find((p) => p.id === id);
  if (!p) notFound();
  return (
    <section className="section detail-grid">
      <Invite theme={p.theme} animated={p.category === "animated"} />
      <div>
        <span className="eyebrow">
          SAMPLE PREVIEW ·{" "}
          {p.category === "videos"
            ? "STILL ARTWORK REFERENCE"
            : "ORIGINAL DESIGN"}
        </span>
        <h1>{p.name}</h1>
        <p>
          These are sample names and details. Personal editing unlocks only
          after server-verified payment.
        </p>
        <div className="actions">
          <Link className="button" href={`/products/${id}`}>
            Choose this design ↗
          </Link>
          <Link href="/catalog" className="text-link">
            Back to collection
          </Link>
        </div>
      </div>
    </section>
  );
}
