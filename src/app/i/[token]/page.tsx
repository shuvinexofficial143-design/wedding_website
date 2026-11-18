import {websitePublicationSchema} from "@/lib/website/schema";
import {WebsiteView} from "@/components/website/website-view";
import {GuestRsvp} from "@/components/website/guest-rsvp";
import { notFound } from "next/navigation";
import { db, type Order } from "@/lib/db";
import { products } from "@/lib/catalog";
import { detailsSchema } from "@/lib/validation";
import { purchasedVersion } from "@/lib/studio/repository";
import { studioPublicationSchema } from "@/lib/studio/publication";
import { GuestInvitation } from "@/components/guest-invitation";
import { StudioGuestInvitation } from "@/components/studio/guest-invitation";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "You are invited | Suhani Wedding Studio",
  robots: { index: false, follow: false },
};
export default async function Invitation({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) notFound();
  const order = await db()
    .prepare("SELECT * FROM orders WHERE public_token=? AND status='paid'")
    .get(token) as Order | undefined;
  if (!order?.published) notFound();
  let payload: unknown;
  try { payload = JSON.parse(order.published); } catch { notFound(); }

  const site=websitePublicationSchema.safeParse(payload);
  if(site.success){const pinned=await purchasedVersion(order.id);if(!pinned?.content.website||pinned.version!==site.data.version)notFound();return <><WebsiteView template={pinned.content.website} data={site.data.data} token={token}/><GuestRsvp token={token} events={site.data.data.events}/></>;}
  const shared = studioPublicationSchema.safeParse(payload);
  if (shared.success) {
    const snapshot = await purchasedVersion(order.id);
    if (!snapshot || snapshot.content.renderer !== "layers" ||
        snapshot.version !== shared.data.version) notFound();
    return (
      <StudioGuestInvitation
        token={token}
        document={snapshot.content}
        values={shared.data.values}
      />
    );
  }
  const details = detailsSchema.safeParse(payload);
  if (!details.success) notFound();
  const product = products.find(p => p.id === order.product_id);
  if (!product) notFound();
  return (
    <GuestInvitation
      details={details.data}
      theme={product.theme}
      animated={product.category === "animated"}
      token={token}
    />
  );
}
