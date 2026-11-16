/* eslint-disable @next/next/no-img-element -- local SVG artwork preview is preserved without optimization */
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { user, isAdmin } from "@/lib/auth";
import { cardTemplates } from "@/lib/card-templates";

export default async function AdminCards() {
  const u = await user();
  if (!u) redirect("/login?next=/admin/cards");
  if (!isAdmin(u)) notFound();
  return (
    <section className="section">
      <span className="eyebrow">PRIVATE TEMPLATE REGISTRY</span>
      <h1>Card <i>studio.</i></h1>
      <p>Original artwork, editable layer settings, catalog status and proposed prices. This is a read-only code-backed registry until durable admin storage is approved. No payment or customer records are modified here.</p>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th>Artwork</th><th>Template</th><th>Price</th><th>Text layers</th><th>Catalog status</th><th>Preview</th></tr></thead>
          <tbody>
            {cardTemplates.map(t=>(
              <tr key={t.id}>
                <td><img src={t.thumbnail} alt={t.name+" decorative background"} width={74} height={104} style={{objectFit:"cover"}} /></td>
                <td><strong>{t.name}</strong><p><code>{t.id}</code></p><small>Layout: {t.layout}</small><p><small>{t.category} · {t.artwork}</small></p></td>
                <td>₹{t.price} <small>proposed</small></td>
                <td>{["bride", "groom", "date", "time", "venue", "address", "message", ...(t.textLayers.photo.enabled?["photo"]:[])].join(", ")}<p><small>Font: {t.font.names}</small></p></td>
                <td>{t.published?"Published":"Unpublished"}</td>
                <td><Link className="text-link" href={`/preview/${t.id}`}>Full preview ↗</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="notice">To add or unpublish a template, update the reviewed record in <code>src/lib/card-templates.ts</code> and deploy it through CI. Live on/off edits are intentionally not stored in the current ephemeral SQLite configuration.</p>
      <Link className="text-link" href="/admin">← Back to order studio</Link>
    </section>
  );
}
