import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { user, isAdmin } from "@/lib/auth";
import { listTemplates, versionById } from "@/lib/studio/repository";
export default async function AdminCards() {
  const u = await user();
  if (!u) redirect("/login?next=/admin/cards");
  if (!isAdmin(u)) notFound();
  const cards = await listTemplates(true);
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">PRIVATE DESIGN WORKSPACE</span>
          <h1>
            Card <i>studio.</i>
          </h1>
          <p>
            Create, edit and publish original invitations. Purchased versions
            remain unchanged.
          </p>
        </div>
        <Link className="button" href="/admin/cards/new">
          Create new card ↗
        </Link>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Card</th>
              <th>Style</th>
              <th>Status</th>
              <th>Version</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {await Promise.all(
              cards.map(async (t) => {
                const v = await versionById(t.id, t.head_version);
                return (
                  <tr key={t.id}>
                    <td>
                      {v?.content.name}
                      <small style={{ display: "block" }}>
                        ₹{(v?.content.pricePaise || 0) / 100}
                      </small>
                    </td>
                    <td>{t.style_number}</td>
                    <td>{t.status}</td>
                    <td>
                      v{t.head_version} · published v
                      {t.published_version || "—"}
                    </td>
                    <td>
                      <Link className="text-link" href={`/admin/cards/${t.id}`}>
                        Open designer
                      </Link>
                      {t.status === "published" && (
                        <p>
                          <Link href={`/preview/${t.id}`}>
                            Public preview ↗
                          </Link>
                        </p>
                      )}
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
      <Link href="/admin" className="text-link">
        Back to order studio
      </Link>
    </section>
  );
}
