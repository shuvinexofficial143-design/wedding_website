import { notFound } from "next/navigation";
const policies: Record<string, { title: string; paragraphs: string[] }> = {
  terms: {
    title: "Terms of service",
    paragraphs: [
      "Pre-launch draft — not a final legal agreement. Merchant name, address, grievance contact and approved prices must be configured before accepting live orders.",
      "Only upload content you own or have permission to use. Template purchases do not grant resale rights to the original template. Cards and animated invitations require verified payment before editing. Website and video services are manually fulfilled.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    paragraphs: [
      "Pre-launch draft. We intend to use account details, wedding information, photos and order records only to provide the requested service, support and payment verification.",
      "Payment credentials are handled by Cashfree, not stored by this website. Published invitation links are accessible to anyone holding the link. Do not publish information you do not want guests to share. Retention, deletion requests and the merchant privacy contact must be finalised before launch.",
    ],
  },
  refund: {
    title: "Refund policy",
    paragraphs: [
      "Pre-launch draft. Live payments are disabled until the merchant approves and publishes a final refund policy and support contact.",
      "Failed payments do not unlock products. If a payment is debited but not confirmed, support must verify it with the payment provider. Duplicate confirmed payments should be reviewed for refund. Refund eligibility for personalised content must be agreed before launch; no blanket no-refund claim is made here.",
    ],
  },
  delivery: {
    title: "Delivery policy",
    paragraphs: [
      "Digital cards: editing and download become available after verified payment. Animated invitations: delivered as shareable web pages, without MP4 export.",
      "Wedding websites: prepared within 3–4 days after complete details and verified payment. Customers receive preview and final links through their order dashboard. Video invitations are manually produced and delivered as uploaded MP4 files; the delivery date must be agreed before ordering.",
      "These are pre-launch service descriptions. Contact information and final terms must be completed before live sales.",
    ],
  },
};
export default async function Policy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = policies[slug];
  if (!p) notFound();
  return (
    <section className="section narrow">
      <span className="eyebrow">TRANSPARENT FROM THE START</span>
      <h1>{p.title}</h1>
      {p.paragraphs.map((t) => (
        <p style={{ lineHeight: 1.9 }} key={t}>
          {t}
        </p>
      ))}
    </section>
  );
}
