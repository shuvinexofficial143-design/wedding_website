import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { user } from "@/lib/auth";
import { studioProduct, purchasedVersion } from "@/lib/studio/repository";
import { paymentReady } from "@/lib/cashfree";
import { getOrder } from "@/lib/db";
import { Checkout } from "@/components/checkout";
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { id } = await params;

  const u = await user();
  if (!u) redirect(`/login?next=/checkout/${id}`);
  const { order } = await searchParams;
  if (order) {
    const o = (await getOrder(order));
    if (!o || o.user_id !== u.id || o.product_id !== id) notFound();
    if (o.status === "paid") redirect(`/editor/${order}`);
  }
  const p = await studioProduct(id);
  // A pinned pending order retains its quoted price until the payment attempt finishes.
  const pinned = order ? await purchasedVersion(order) : undefined;
  if (!p && !pinned) notFound();
  const display = pinned?.content || p?.document;
  const shownPrice = pinned ? pinned.content.pricePaise / 100 : p!.price;
  return (
    <section className="section narrow">
      <span className="eyebrow">SECURE CHECKOUT · CASHFREE SANDBOX</span>
      <h1>{display!.name}</h1>
      <p>{display!.description}</p>
      <Checkout
        productId={id}
        price={shownPrice}
        ready={paymentReady()}
        existingOrder={order}
      />
      <div className="footer-links">
        <Link href="/policies/terms">Terms</Link>
        <Link href="/policies/refund">Refunds</Link>
        <Link href="/policies/delivery">Delivery</Link>
      </div>
    </section>
  );
}
