import { cookies } from "next/headers";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { db, type User } from "./db";
const scrypt = promisify(scryptCallback);
export function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}
export async function checkPassword(password: string, encoded: string) {
  const [salt, hex] = encoded.split(":");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function user() {
  const token = (await cookies()).get("wedding_session")?.value;
  if (!token) return null;
  return (
    (db()
      .prepare(
        "SELECT users.id,users.email,users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?",
      )
      .get(digest(token), Date.now()) as User | undefined) || null
  );
}
export function isAdmin(u: User) {
  return (
    u.role === "admin" &&
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .includes(u.email)
  );
}
export function sameOrigin(request: Request) {
  const expected = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).origin;
  return request.headers.get("origin") === expected;
}
export async function startSession(id: string) {
  const token = randomBytes(32).toString("hex");
  db().prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db()
    .prepare("INSERT INTO sessions VALUES(?,?,?)")
    .run(digest(token), id, Date.now() + 7 * 86400000);
  (await cookies()).set("wedding_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400,
  });
}
export async function endSession() {
  const jar = await cookies();
  const token = jar.get("wedding_session")?.value;
  if (token)
    db().prepare("DELETE FROM sessions WHERE token=?").run(digest(token));
  jar.delete("wedding_session");
}
