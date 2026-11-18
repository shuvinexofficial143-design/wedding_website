import {websitePublicationSchema} from "@/lib/website/schema";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sameOrigin, digest } from "@/lib/auth";
import { db, limit, transaction, usingPostgres, type Order } from "@/lib/db";
import { readJson } from "@/lib/validation";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!sameOrigin(req))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const { token } = await params;
  const o = (await db()
    .prepare("SELECT * FROM orders WHERE public_token=? AND status='paid'")
    .get(token)) as Order | undefined;
  if (!o)
    return Response.json({ error: "Invitation unavailable" }, { status: 404 });
  try {
    const d = z
      .object({
        name: z.string().trim().min(1).max(100),
        attendance: z.enum(["yes", "no"]),
        guests: z.number().int().min(1).max(10),
        website: z.string().max(0),
        eventId:z.string().max(36).default(""),
        notes:z.string().max(500).default(""),
        requestId:z.string().uuid().optional(),
      })
      .parse(await readJson(req, 2048));
    if (
      !(await limit(`rsvp:${o.id}`, 100, 3600000)) ||
      !(await limit(`rsvp:${o.id}:${digest(d.name.toLowerCase())}`, 3, 3600000))
    )
      return Response.json(
        { error: "Please wait before sending another RSVP." },
        { status: 429 },
      );
    const site=websitePublicationSchema.safeParse(o.published?JSON.parse(o.published):null);
    if(d.eventId&&(!site.success||!site.data.data.events.some(e=>e.id===d.eventId)))throw new Error('Unknown event');
    await transaction(async()=>{
      if(usingPostgres())await db().prepare('SELECT id FROM orders WHERE id=? FOR UPDATE').get(o.id);
      const stillPublished=await db().prepare("SELECT id FROM orders WHERE id=? AND public_token=? AND status='paid'").get(o.id,token);
      if(!stillPublished)throw new Error('Invitation revoked');
      const requestKey=digest(d.requestId||d.name.trim().toLowerCase());
      const old=await db().prepare('SELECT rsvp_id FROM rsvp_details WHERE order_id=? AND event_id=? AND request_key=?').get(o.id,d.eventId,requestKey) as {rsvp_id:string}|undefined;
      const id=old?.rsvp_id||randomUUID();const count=d.attendance==='no'?0:d.guests;
      if(old)await db().prepare('UPDATE rsvps SET name=?,attendance=?,guests=?,created=? WHERE id=?').run(d.name,d.attendance,count,Date.now(),id);
      else await db().prepare('INSERT INTO rsvps(id,order_id,name,attendance,guests,created) VALUES(?,?,?,?,?,?)').run(id,o.id,d.name,d.attendance,count,Date.now());
      await db().prepare('INSERT INTO rsvp_details(rsvp_id,order_id,event_id,notes,request_key,updated) VALUES(?,?,?,?,?,?) ON CONFLICT(rsvp_id) DO UPDATE SET notes=excluded.notes,updated=excluded.updated').run(id,o.id,d.eventId,d.notes,requestKey,Date.now());
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Please check your name and guest count." },
      { status: 400 },
    );
  }
}
