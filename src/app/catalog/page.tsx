/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { categories } from "@/lib/catalog";
import {listAnimatedPublic} from "@/lib/animated/repository";
import { catalogProducts } from "@/lib/studio/repository";
import { LayerCard } from "@/components/studio/layer-card";
import { Invite } from "@/components/invite";
export const dynamic = "force-dynamic";
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const list = (await catalogProducts()).filter((p) => !category || p.category === category);
  const videos=(!category||category==="animated")?await listAnimatedPublic():[];
  return (
    <section className="section">
      <span className="eyebrow">THE INVITATION COLLECTION</span>
      <h1>
        A design for <i>your story.</i>
      </h1>
      <p>Explore original designs. All prices are proposed launch prices.</p>
      <div className="filters">
        <Link className={`filter ${!category ? "active" : ""}`} href="/catalog">
          All designs
        </Link>
        {categories.map((c) => (
          <Link
            className={`filter ${category === c.id ? "active" : ""}`}
            key={c.id}
            href={`/catalog?category=${c.id}`}
          >
            {c.name}
          </Link>
        ))}
      </div>
      <div className="product-grid">
        {list.map((p) => (
          <Link key={p.id} className="product" href={`/products/${p.id}`}>
            <div className="product-art">
              {p.document.renderer === "layers" ? <LayerCard document={p.document} /> : <Invite theme={p.theme} animated={p.category === "animated"} />}
              <span className="preview-chip">View design ↗</span>
            </div>
            <div className="product-meta">
              <div>
                <small>{p.tag}</small>
                <h3>{p.name}</h3>
              </div>
              <span>₹{p.price}</span>
            </div>
          </Link>
        ))}
      </div>
      {videos.map(p=><Link key={p.id} href={`/products/${p.id}`} className="product animated-listing">
        <div className="product-art animated-art"><img src={p.thumbnail_url} alt={p.name+" invitation preview"} loading="lazy"/><span className="preview-chip">Watch sample ▶</span></div>
        <div className="product-meta"><div><small>{p.style_number} · {p.category}</small><h3>{p.name}</h3></div><span>₹{p.price_paise/100}</span></div>
      </Link>)}
      {!list.length && !videos.length && (
        <p>
          No designs in this category.{" "}
          <Link href="/catalog">View all designs</Link>
        </p>
      )}
    </section>
  );
}
