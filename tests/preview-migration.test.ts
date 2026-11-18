import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { assertPreviewMigrationTarget, migrateFreshPreviewSchema, verifyPreviewSchema,EXPECTED_TABLES } from "../src/lib/database/preview-migration";
import { schemaSql } from "../src/lib/database/schema";

const endpoint="ep-qa-example.us-east-2.aws.neon.tech";
const previewEnv={
  VERCEL:"1",VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feature/advanced-card-studio",
  DATABASE_URL:`postgresql://reader:test@ep-qa-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`,
  DATABASE_URL_UNPOOLED:`postgresql://reader:test@${endpoint}/neondb?sslmode=require`,
  CASHFREE_ENV:"sandbox",
};
test("Preview migration target refuses production, other branches, mismatched databases and missing unpooled",()=>{
  assert.equal(assertPreviewMigrationTarget(previewEnv),previewEnv.DATABASE_URL_UNPOOLED);
  assert.equal(assertPreviewMigrationTarget({...previewEnv,VERCEL_GIT_COMMIT_REF:"feature/suhani-final-integration"}),previewEnv.DATABASE_URL_UNPOOLED);
  for (const bad of [
    {VERCEL_ENV:"production"},{VERCEL:"0"},{VERCEL_GIT_COMMIT_REF:"main"},
    {DATABASE_URL_UNPOOLED:""},{CASHFREE_ENV:"production"},
    {DATABASE_URL_UNPOOLED:"postgresql://reader:test@different.neon.tech/neondb"},
    {DATABASE_URL_UNPOOLED:"postgresql://reader:test@"+endpoint+"/production"},
  ]) assert.throws(()=>assertPreviewMigrationTarget({...previewEnv,...bad}));
});
test("the exact production migration schema creates 19 Preview tables, is idempotent and preserves records",async()=>{
  const pg=new PGlite();
  const client={query:async(sql:string,params?:unknown[])=>{
    const r=await pg.query<Record<string,unknown>>(sql,params);
    return {rows:r.rows};
  }};
  try {
    const one=await migrateFreshPreviewSchema(client,{skipLockForTest:true});
    assert.equal(one.created,true);
    assert.equal(one.tableCount,19);
    assert.deepEqual(Object.keys(one.counts).sort(),[...EXPECTED_TABLES].sort());
    assert.equal(one.counts.schema_migrations,1);
    assert.equal(one.counts.users,0);
    await client.query("INSERT INTO public.users(id,email,password,created) VALUES('u-1','test@example.invalid','hash',1)");
    const two=await migrateFreshPreviewSchema(client,{skipLockForTest:true});
    assert.equal(two.created,false);
    assert.equal(two.counts.users,1);
    assert.equal((await verifyPreviewSchema(client)).counts.users,1);
  } finally {await pg.close();}
});
test("partial or unknown public schema aborts with zero DDL and preserves existing user data",async()=>{
  const pg=new PGlite();
  const client={query:async(sql:string,params?:unknown[])=>{
    const r=await pg.query<Record<string,unknown>>(sql,params);
    return {rows:r.rows};
  }};
  try {
    await client.query("CREATE TABLE public.unrelated(id INT PRIMARY KEY)");
    await client.query("INSERT INTO public.unrelated VALUES(8)");
    await assert.rejects(migrateFreshPreviewSchema(client,{skipLockForTest:true}),/no changes applied/);
    assert.equal((await client.query("SELECT count(*)::int AS n FROM public.unrelated")).rows[0].n,1);
    const r=await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    assert.equal(r.rows.length,1);
  } finally {await pg.close();}
});
test("a mid-migration DDL error rolls back every table created earlier in the transaction",async()=>{
  const pg=new PGlite();
  const connection={query:async(sql:string,params?:unknown[])=>{
    if (/^CREATE TABLE IF NOT EXISTS assets\b/i.test(sql))
      throw new Error("simulated migration failure");
    const r=await pg.query<Record<string,unknown>>(sql,params);
    return {rows:r.rows};
  }};
  try {
    await assert.rejects(
      migrateFreshPreviewSchema(connection,{skipLockForTest:true}),
      /simulated migration failure/,
    );
    const result=await pg.query<{n:number}>(
      "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
    );
    assert.equal(result.rows[0].n,0);
  } finally {await pg.close();}
});
test("old Preview v2 schemas upgrade additively without changing customer rows", async()=>{
  const pg=new PGlite();
  const q=async(sql:string,params?:unknown[])=>{const r=await pg.query<Record<string,unknown>>(sql,params);return {rows:r.rows};};
  try {
    const old=schemaSql("postgres").split(";").map(x=>x.trim()).filter(Boolean)
      .filter(x=>!x.includes("animated_")&&!x.includes("rsvp_details"));
    for(const stmt of old) await q(stmt);
    await q("INSERT INTO public.schema_migrations(version,applied_at) VALUES(2,100)");
    await q("INSERT INTO public.users(id,email,password,created) VALUES('preserve','before@example.test','hashed',100)");
    const result=await migrateFreshPreviewSchema({query:q},{skipLockForTest:true});
    assert.equal(result.tableCount,19);
    assert.equal(result.counts.users,1);
    assert.equal(result.created,false);
    assert.equal((await q("SELECT COUNT(*)::int AS n FROM public.schema_migrations")).rows[0].n,2);
  } finally{await pg.close();}
});
test("approved migration has no destructive schema statements",()=>{
  assert.doesNotMatch(schemaSql("postgres"),/\b(DROP|TRUNCATE|DELETE|UPDATE)\b/i);
});
