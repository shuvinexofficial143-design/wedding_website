import { notFound } from "next/navigation";
import { db, type Order } from "@/lib/db";
import { products } from "@/lib/catalog";
import { detailsSchema } from "@/lib/validation";
import { GuestInvitation } from "@/components/guest-invitation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "You are invited | The Wedding Edit",
  robots: { index: false, follow: false },
};
export default async function Invitation({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const o = db()
    .prepare("SELECT * FROM orders WHERE public_token=? AND status='paid'")
    .get(token) as Order | undefined;
  if (!o?.published) notFound();
  const details = detailsSchema.safeParse(JSON.parse(o.published));
  if (!details.success) notFound();
  const p = products.find((p) => p.id === o.product_id)!;
  return (
    <GuestInvitation
      details={details.data}
      theme={p.theme}
      animated={p.category === "animated"}
      token={token}
    />
  );
}
