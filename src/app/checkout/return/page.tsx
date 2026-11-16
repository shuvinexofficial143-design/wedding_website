import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { user } from "@/lib/auth";
import { getOrder } from "@/lib/db";
import { VerifyPayment } from "@/components/checkout";
export default async function Return({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const u = await user();
  if (!u) redirect("/login?next=/dashboard");
  if (!order_id) notFound();
  const o = getOrder(order_id);
  if (!o || o.user_id !== u.id) notFound();
  return (
    <section className="section narrow">
      <h1>
        Payment <i>status.</i>
      </h1>
      <p>
        Returning from checkout does not confirm payment. We verify directly
        with Cashfree before unlocking your order.
      </p>
      {o.status === "paid" ? (
        <p>Payment verified. Your invitation is unlocked.</p>
      ) : (
        <VerifyPayment id={o.id} />
      )}
      <p>
        <Link className="text-link" href="/dashboard">
          Go to my invitations ↗
        </Link>
      </p>
    </section>
  );
}
