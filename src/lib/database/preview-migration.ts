import { SCHEMA_VERSION, schemaSql } from "./schema";

/**
 * This migration deliberately fails closed. Preview Vercel and the reviewed
 * feature branch must BOTH be selected; no Production execution is permitted.
 * The two database URLs must refer to the same Neon endpoint + database.
 */
export function assertPreviewMigrationTarget(env: Record<string,string|undefined>) {
  if (env.VERCEL !== "1" || env.VERCEL_ENV !== "preview")
    throw new Error("Refusing database migration outside Vercel Preview");
  if (!["feature/advanced-card-studio","feature/suhani-final-integration"].includes(env.VERCEL_GIT_COMMIT_REF || ""))
    throw new Error("Refusing migration outside the reviewed feature branch");
  if (env.CASHFREE_ENV && env.CASHFREE_ENV !== "sandbox")
    throw new Error("Refusing Preview migration with non-sandbox Cashfree configuration");
  const pooled = env.DATABASE_URL, direct = env.DATABASE_URL_UNPOOLED;
  if (!pooled || !direct) throw new Error("Both Preview database connection variables are required");
  const parse = (value:string) => {
    let url:URL;
    try { url = new URL(value); }
    catch { throw new Error("Invalid database connection format"); }
    if (!["postgresql:","postgres:"].includes(url.protocol) ||
        !url.username || !url.password || !url.pathname || url.pathname === "/")
      throw new Error("Invalid PostgreSQL connection URL");
    return {
      host:url.hostname.toLowerCase().replace(/-pooler(?=\.)/g,""),
      database:decodeURIComponent(url.pathname),
      user:decodeURIComponent(url.username),
      port:url.port || "5432",
    };
  };
  const a = parse(pooled), b = parse(direct);
  if (!a.host.endsWith(".neon.tech") || !b.host.endsWith(".neon.tech") ||
      a.host !== b.host || a.database !== b.database || a.user !== b.user ||
      a.port !== b.port)
    throw new Error("Preview pooled and unpooled URLs do not identify the same Neon database");
  return direct;
}

/** Stable, reviewed table inventory; no drop/truncate statements are permitted. */
export const EXPECTED_TABLES = [
  "admin_audit_logs", "animated_order_jobs", "animated_templates", "asset_links", "assets", "audit", "card_templates",
  "customer_card_edits", "limits", "orders", "payments", "purchased_products",
  "rsvp_details", "rsvps", "schema_migrations", "sessions", "template_versions", "users",
  "wedding_website_orders",
] as const;

export type PreviewSqlClient = {
  query(sql:string, values?:unknown[]):Promise<{rows:Record<string,unknown>[]}>,
};
async function currentTables(client:PreviewSqlClient) {
  const r=await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name",
  );
  return r.rows.map(row=>String(row.table_name));
}
function sameTables(actual:string[]) {
  return actual.length === EXPECTED_TABLES.length &&
    actual.every((name,i)=>name === EXPECTED_TABLES[i]);
}
async function versionReady(client:PreviewSqlClient, version=SCHEMA_VERSION) {
  const v=await client.query("SELECT version FROM public.schema_migrations WHERE version=$1",[version]);
  return v.rows.length === 1;
}
export async function verifyPreviewSchema(client:PreviewSqlClient) {
  const ping=await client.query("SELECT 1::int AS ok, current_database() AS db, current_schema() AS schema");
  if (ping.rows[0]?.ok !== 1 || ping.rows[0]?.schema !== "public")
    throw new Error("Database connection or public schema verification failed");
  const tables=await currentTables(client);
  if (!sameTables(tables)) throw new Error("Public table inventory does not match reviewed schema");
  if (!await versionReady(client)) throw new Error("Migration version marker is missing");
  const columns=await client.query(
    "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'",
  );
  const names = new Set(columns.rows.map(x=>`${x.table_name}.${x.column_name}`));
  for(const col of ["users.role","card_templates.revision","orders.amount",
    "assets.owner_id","purchased_products.template_version",
    "customer_card_edits.revision"]) {
    if (!names.has(col)) throw new Error("Expected schema column is absent: "+col);
  }
  const counts:Record<string,number>={};
  for (const table of EXPECTED_TABLES) {
    const r=await client.query(`SELECT count(*)::int AS n FROM public."${table}"`);
    counts[table]=Number(r.rows[0]?.n);
  }
  return {connected:true,tableCount:tables.length,version:SCHEMA_VERSION,counts};
}
export async function migrateFreshPreviewSchema(client:PreviewSqlClient, options?:{skipLockForTest?:boolean}) {
  // Every schema write occurs within ONE PostgreSQL transaction.
  await client.query("BEGIN");
  try {
    if (!options?.skipLockForTest) await client.query("SELECT pg_advisory_xact_lock(1743112701)");
    const before=await currentTables(client);
    let created=false;
    if (before.length===0) {
      const statements=schemaSql("postgres").split(";").map(x=>x.trim()).filter(Boolean);
      for (const sql of statements) {
        if (!/^(CREATE TABLE IF NOT EXISTS|CREATE (?:UNIQUE )?INDEX IF NOT EXISTS)\b/i.test(sql))
          throw new Error("Unexpected SQL found in schema migration");
        await client.query(sql);
      }
      await client.query("ALTER TABLE public.card_templates ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1");
      await client.query("INSERT INTO public.schema_migrations(version,applied_at) VALUES($1,$2) ON CONFLICT(version) DO NOTHING",[SCHEMA_VERSION,Date.now()]);
      created=true;
    } else if (before.includes("schema_migrations") && (await versionReady(client,2)||await versionReady(client,3)) &&
      [EXPECTED_TABLES.filter(x=>!['animated_order_jobs','animated_templates','rsvp_details'].includes(x)),EXPECTED_TABLES.filter(x=>!['animated_order_jobs','animated_templates'].includes(x)),EXPECTED_TABLES.filter(x=>x!=='rsvp_details')].some(expected=>before.length===expected.length&&before.every((n,i)=>n===expected[i]))) {
      // Known v2/v3 branches upgrade additively; existing tables and rows remain intact.
      const additions=schemaSql('postgres').split(';').map(x=>x.trim()).filter(Boolean).filter(sql=>/^(CREATE TABLE IF NOT EXISTS (animated_|rsvp_details)|CREATE INDEX IF NOT EXISTS animated_)/i.test(sql));
      for(const sql of additions)await client.query(sql);
      await client.query('INSERT INTO public.schema_migrations(version,applied_at) VALUES($1,$2) ON CONFLICT(version) DO NOTHING',[SCHEMA_VERSION,Date.now()]);
    } else if (!sameTables(before) || !await versionReady(client)) {
      // Never write to an unknown, partial or existing older schema. Operators
      // must inspect it before authorising a separate forward-only upgrade.
      throw new Error("Existing public tables are not an exact current schema; no changes applied");
    }
    const verified=await verifyPreviewSchema(client);
    if (created && Object.entries(verified.counts).some(([name,count])=>
      name==="schema_migrations" ? count!==1 : count!==0))
      throw new Error("Fresh database unexpectedly contains records; rolling back");
    await client.query("COMMIT");
    return {created,...verified};
  } catch(error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
