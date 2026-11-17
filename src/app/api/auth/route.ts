import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, limit } from "@/lib/db";
import {
  passwordHash,
  checkPassword,
  startSession,
  endSession,
  sameOrigin,
  digest,
} from "@/lib/auth";
import { readJson } from "@/lib/validation";
export const runtime = "nodejs";
const schema = z.object({
  action: z.enum(["login", "register"]),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
});
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const data = await readJson(req, 4096);
    if (data.action === "logout") {
      await endSession();
      return Response.json({ ok: true });
    }
    const parsed = schema.safeParse(data);
    if (!parsed.success)
      return Response.json(
        { error: "Enter a valid email and a password of 12–128 characters." },
        { status: 400 },
      );
    const { action, email, password } = parsed.data;
    if (
      !(await limit(`auth:${digest(email)}`, 10, 15 * 60000)) ||
      !(await limit("auth:global", 200, 15 * 60000))
    )
      return Response.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    const existing = (await db()
      .prepare("SELECT * FROM users WHERE email=?")
      .get(email)) as { id: string; password: string } | undefined;
    if (action === "register") {
      if (isReserved(email))
        return Response.json(
          { error: "This account must be provisioned by the administrator." },
          { status: 403 },
        );
      if (existing)
        return Response.json(
          { error: "Unable to create account. Try signing in." },
          { status: 409 },
        );
      const id = randomUUID();
      (await db()
        .prepare("INSERT INTO users(id,email,password,created) VALUES(?,?,?,?)")
        .run(id, email, await passwordHash(password), Date.now()));
      await startSession(id);
    } else {
      if (!existing || !(await checkPassword(password, existing.password)))
        return Response.json(
          { error: "Email or password is incorrect." },
          { status: 401 },
        );
      await startSession(existing.id);
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Unable to process account request." },
      { status: 400 },
    );
  }
}
function isReserved(email: string) {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .includes(email);
}
