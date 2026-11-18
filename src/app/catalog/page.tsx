import Link from "next/link";
import { categories } from "@/lib/catalog";
import {listAnimatedPublic} from "@/lib/animated/repository";
import { catalogProducts } from "@/lib/studio/repository";
import {ProductTile,VideoTile} from "@/components/product-tile";

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
    <section className="section catalog-section">
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
        {list.map(p=><ProductTile key={p.id} product={p}/>)}
        {videos.map(p=><VideoTile key={p.id} product={p}/>)}
      </div>
      {!list.length && !videos.length && (
        <p>
          No designs in this category.{" "}
          <Link href="/catalog">View all designs</Link>
        </p>
      )}
    </section>
  );
}
