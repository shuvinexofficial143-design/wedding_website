import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { user, isAdmin } from "@/lib/auth";
import { db, getOrder } from "@/lib/db";
export default async function Replies({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await user();
  if (!u) redirect("/login?next=/dashboard");
  const o = getOrder(id);
  if (!o || (o.user_id !== u.id && !isAdmin(u))) notFound();
  const rows = db()
    .prepare(
      "SELECT name,attendance,guests,created FROM rsvps WHERE order_id=? ORDER BY created DESC",
    )
    .all(id) as {
    name: string;
    attendance: string;
    guests: number;
    created: number;
  }[];
  return (
    <section className="section narrow">
      <span className="eyebrow">YOUR GUEST LIST</span>
      <h1>
        Replies with <i>love.</i>
      </h1>
      <p>
        {rows
          .filter((r) => r.attendance === "yes")
          .reduce((n, r) => n + r.guests, 0)}{" "}
        guests attending · {rows.length} responses
      </p>
      {!rows.length ? (
        <p>No replies yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Attending</th>
                <th>Guests</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.attendance}</td>
                  <td>{r.guests}</td>
                  <td>{new Date(r.created).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link className="text-link" href="/dashboard">
        Back to my invitations
      </Link>
    </section>
  );
}
