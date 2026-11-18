/* eslint-disable @next/next/no-img-element */
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { user, isAdmin } from "@/lib/auth";
import { db, type Order } from "@/lib/db";
import { products } from "@/lib/catalog";
import { AdminOrder } from "@/components/admin-order";
import { type Details } from "@/lib/validation";
export default async function Admin() {
  const u = await user();
  if (!u) redirect("/login?next=/admin");
  if (!isAdmin(u)) notFound();
  const orders = (await db()
    .prepare(
      "SELECT orders.*,users.email,j.template_name AS animated_name,j.order_id AS animated_order_id FROM orders JOIN users ON users.id=orders.user_id LEFT JOIN animated_order_jobs j ON j.order_id=orders.id ORDER BY orders.created DESC LIMIT 100",
    )
    .all()) as (Order & {
    email: string;
    animated_name: string | null;
    animated_order_id: string | null;
  })[];
  return (
    <section className="section">
      <span className="eyebrow">PRIVATE OPERATIONS</span>
      <h1>
        Order <i>studio.</i>
      </h1>
      <p>
        Latest 100 orders. Payment status cannot be manually overridden here.
      </p>
      <nav className="studio-shortcuts" aria-label="Studio management">
        <Link href="/admin/cards">
          <span>01 / DESIGN</span>
          <strong>Manage card template registry ↗</strong>
          <small>Artwork, layers and published designs</small>
        </Link>
        <Link href="/admin/animated">
          <span>02 / COLLECTION</span>
          <strong>Animated templates ↗</strong>
          <small>Video previews and private master templates</small>
        </Link>
        <Link href="/admin/animated/orders">
          <span>03 / DELIVERY</span>
          <strong>Animated fulfilment queue ↗</strong>
          <small>Customer details, editing copies and final delivery</small>
        </Link>
      </nav>
      <div className="studio-summary" aria-label="Latest 100 orders summary">
        <div>
          <span>Orders in this view</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Verified payments</span>
          <strong>{orders.filter((o) => o.status === "paid").length}</strong>
        </div>
        <div>
          <span>Awaiting delivery</span>
          <strong>
            {
              orders.filter(
                (o) => o.status === "paid" && o.fulfillment !== "delivered",
              ).length
            }
          </strong>
        </div>
      </div>
      {!orders.length && <p>No orders yet.</p>}
      {orders.map((o) => {
        const p = products.find((p) => p.id === o.product_id);
        const d = JSON.parse(o.details) as Partial<Details>;
        return (
          <article className="order-card" key={o.id}>
            <div className="section-head">
              <div>
                <h2>
                  {o.animated_name || p?.name || "Advanced Card Studio design"}
                </h2>
                <p>
                  {o.email} · {o.phone}
                </p>
                <small>{o.id}</small>
              </div>
              <p>
                ₹{o.amount / 100} · {o.status} ·{" "}
                {o.fulfillment.replaceAll("_", " ")}
              </p>
            </div>
            <div className="editor-grid">
              <div>
                <h3>Wedding details</h3>
                <p>
                  {d.partnerA} & {d.partnerB}
                </p>
                <p>
                  {d.date} · {d.time} · {d.venue}
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>{d.story}</p>
                {d.maps && (
                  <p>
                    <a href={d.maps} target="_blank" rel="noopener noreferrer">
                      Venue map ↗
                    </a>
                  </p>
                )}
                {d.photo && (
                  <img
                    className="photo-preview"
                    src={d.photo}
                    alt="Customer couple photo"
                  />
                )}
                {d.gallery?.map((src, i) => (
                  <img
                    key={i}
                    className="photo-preview"
                    src={src}
                    alt={`Gallery ${i + 1}`}
                  />
                ))}
                {o.preview_url && (
                  <p>
                    <a
                      href={o.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Preview website ↗
                    </a>
                  </p>
                )}
                {o.final_url && (
                  <p>
                    <a
                      href={o.final_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Final website ↗
                    </a>
                  </p>
                )}
                {o.video_path && (
                  <a href={`/api/orders/${o.id}/video`}>
                    Download delivered MP4
                  </a>
                )}
              </div>
              {o.status === "paid" &&
              ["websites", "videos"].includes(p?.category || "") ? (
                <AdminOrder id={o.id} category={p!.category} />
              ) : o.animated_order_id && o.status === "paid" ? (
                <p>
                  <Link
                    className="button"
                    href={`/admin/animated/orders/${o.id}`}
                  >
                    Manage animated delivery ↗
                  </Link>
                </p>
              ) : (
                <p>
                  {o.status === "paid"
                    ? "Self-service invitation"
                    : "Waiting for verified sandbox payment"}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
