import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { user, isAdmin, sameOrigin } from "@/lib/auth";
import { db, getOrder } from "@/lib/db";
import { products } from "@/lib/catalog";
const directory = () =>
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(req))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const u = await user();
  if (!u || !isAdmin(u))
    return Response.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await params;
  const o = getOrder(id);
  if (
    !o ||
    o.status !== "paid" ||
    products.find((p) => p.id === o.product_id)?.category !== "videos"
  )
    return Response.json(
      { error: "Paid video order not found" },
      { status: 404 },
    );
  if (Number(req.headers.get("content-length") || 0) > 52 * 1024 * 1024)
    return Response.json({ error: "Maximum upload is 50 MB" }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("video");
    if (
      !(file instanceof File) ||
      file.size > 50 * 1024 * 1024 ||
      file.size < 12
    )
      return Response.json(
        { error: "Upload an MP4 under 50 MB." },
        { status: 400 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.toString("ascii", 4, 8) !== "ftyp" || file.type !== "video/mp4")
      return Response.json({ error: "Invalid MP4 file." }, { status: 400 });
    await mkdir(directory(), { recursive: true, mode: 0o700 });
    const filename = `${randomUUID()}.mp4`;
    await writeFile(path.join(directory(), filename), buffer, {
      mode: 0o600,
      flag: "wx",
    });
    db()
      .prepare(
        "UPDATE orders SET video_path=?,fulfillment='delivered' WHERE id=?",
      )
      .run(filename, id);
    db()
      .prepare(
        "INSERT INTO audit(admin_id,order_id,action,created) VALUES(?,?,?,?)",
      )
      .run(u.id, id, "video_uploaded", Date.now());
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Upload failed. Please retry." },
      { status: 500 },
    );
  }
}
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await user();
  if (!u) return new Response("Sign in required", { status: 401 });
  const { id } = await params;
  const o = getOrder(id);
  if (
    !o ||
    o.status !== "paid" ||
    (o.user_id !== u.id && !isAdmin(u)) ||
    !o.video_path
  )
    return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(
      /* turbopackIgnore: true */ path.join(
        /* turbopackIgnore: true */ directory(),
        path.basename(o.video_path),
      ),
    );
    return new Response(bytes, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="wedding-invitation.mp4"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(
      "Delivery file is temporarily unavailable. Contact support.",
      { status: 503 },
    );
  }
}
