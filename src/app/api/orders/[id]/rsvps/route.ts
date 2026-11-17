import {websitePublicationSchema} from "@/lib/website/schema";
import {csvCell} from "@/lib/website/csv";
import { user, isAdmin } from "@/lib/auth";
import { db, getOrder } from "@/lib/db";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await user();
  if (!u) return new Response("Sign in required", { status: 401 });
  const { id } = await params;
  const o = await getOrder(id);
  if (!o || (o.user_id !== u.id && !isAdmin(u)))
    return new Response("Not found", { status: 404 });
  const shared=websitePublicationSchema.safeParse(JSON.parse(o.published||"null"));
  const events=shared.success?Object.fromEntries(shared.data.data.events.map(e=>[e.id,e.name])):{};
  const rows = await db()
    .prepare(
      "SELECT r.name,r.attendance,r.guests,r.created,d.event_id,d.notes FROM rsvps r LEFT JOIN rsvp_details d ON d.rsvp_id=r.id WHERE r.order_id=? ORDER BY r.created DESC",
    )
    .all(id);
  const csv = [
    ["Name", "Attendance", "Guests", "Received", "Event", "Notes"],
    ...rows.map((r) => [
      r.name,
      r.attendance,
      r.guests,
      new Date(Number(r.created)).toISOString(),
      events[String(r.event_id)]||r.event_id,
      r.notes,
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  return new Response("\ufeff" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wedding-rsvp.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
