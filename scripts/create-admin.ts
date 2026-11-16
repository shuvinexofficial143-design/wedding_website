import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { passwordHash } from "../src/lib/auth";
const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (!email || !password || password.length < 16)
  throw new Error(
    "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD (16+ characters) privately.",
  );
if (
  !(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .includes(email)
)
  throw new Error("Email must be listed in ADMIN_EMAILS.");
if (db().prepare("SELECT id FROM users WHERE email=?").get(email))
  throw new Error("Account already exists. Refusing to overwrite.");
db()
  .prepare(
    "INSERT INTO users(id,email,password,created,role) VALUES(?,?,?,?,'admin')",
  )
  .run(randomUUID(), email, await passwordHash(password), Date.now());
console.log("Administrator account created. No password was logged.");
