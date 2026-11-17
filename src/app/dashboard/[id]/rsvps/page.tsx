import {websitePublicationSchema} from "@/lib/website/schema";
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
  const o = (await getOrder(id));
  if (!o || (o.user_id !== u.id && !isAdmin(u))) notFound();
  const shared=websitePublicationSchema.safeParse(JSON.parse(o.published||"null"));
  const events=shared.success?Object.fromEntries(shared.data.data.events.map(e=>[e.id,e.name])):{};
  const rows = (await db()
    .prepare(
      "SELECT r.name,r.attendance,r.guests,r.created,d.event_id,d.notes FROM rsvps r LEFT JOIN rsvp_details d ON d.rsvp_id=r.id WHERE r.order_id=? ORDER BY r.created DESC",
    )
    .all(id)) as {
    event_id:string;notes:string;
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
        event attendances · {rows.length} responses
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
                <th>Received</th><th>Event</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.attendance}</td>
                  <td>{r.guests}</td>
                  <td>{new Date(r.created).toLocaleDateString("en-IN")}</td><td>{events[r.event_id]||r.event_id||"General"}</td><td>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <a className="button" href={"/api/orders/"+id+"/rsvps"}>Export RSVP CSV</a><Link className="text-link" href="/dashboard">
        Back to my invitations
      </Link>
    </section>
  );
}
