import test from "node:test";
import assert from "node:assert/strict";
import { deploymentReadiness } from "../src/lib/deployment-readiness";

const base = {
  DATABASE_URL: "postgresql://example.invalid/wedding",
  S3_BUCKET: "private-wedding",
  S3_ACCESS_KEY_ID: "fake-test-only",
  S3_SECRET_ACCESS_KEY: "fake-test-only",
  S3_ENDPOINT: "https://object.example.invalid",
  NEXT_PUBLIC_SITE_URL: "https://preview.example.invalid",
  ADMIN_EMAILS: "admin@example.test",
  CASHFREE_ENV: "sandbox",
};
test("hosted configuration validator rejects missing persistence credentials and live Cashfree",()=>{
  const fail=deploymentReadiness({ ...base, DATABASE_URL:"",S3_BUCKET:"",CASHFREE_ENV:"production",ASSET_STORAGE:"local" },"24.0.0");
  assert.equal(fail.ready,false);
  assert.match(fail.errors.join(" "),/DATABASE_URL/);
  assert.match(fail.errors.join(" "),/S3_BUCKET/);
  assert.match(fail.errors.join(" "),/Production Cashfree/);
  assert.match(fail.errors.join(" "),/Local asset storage/);
  assert.doesNotMatch(JSON.stringify(fail),/fake-test-only/);
});
test("complete sandbox-only config is structurally valid, but not a connectivity guarantee",()=>{
  const ok=deploymentReadiness(base,"24.3.0");
  assert.equal(ok.ready,true);
  assert.deepEqual(ok.errors,[]);
  assert.match(ok.warnings.join(" "),/do not prove PostgreSQL/);
});
test("unsafe origins, endpoints and runtimes are rejected",()=>{
  const fail=deploymentReadiness({...base, S3_ENDPOINT:"http://example.invalid",NEXT_PUBLIC_SITE_URL:"https://example.invalid/secret?x=1"},"22.0.0");
  assert.equal(fail.ready,false);
  assert.match(fail.errors.join(" "),/HTTPS/);
  assert.match(fail.errors.join(" "),/origin/);
  assert.match(fail.errors.join(" "),/Node.js 24/);
});
