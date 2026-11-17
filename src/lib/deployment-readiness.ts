export type Readiness = { ready: boolean; errors: string[]; warnings: string[] };
type Env = Record<string, string | undefined>;
/** Configuration-only assessment. This never connects to or modifies cloud resources. */
export function deploymentReadiness(env: Env, node = process.versions.node): Readiness {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing = (key: string, reason: string) => {
    if (!env[key]?.trim()) errors.push(`Missing ${key}: ${reason}`);
  };
  if (Number(node.split(".")[0]) < 24)
    errors.push("Node.js 24 or higher is required.");
  missing("DATABASE_URL", "Vercel requires a durable PostgreSQL database; SQLite is disabled.");
  if (env.DATABASE_URL && !/^postgres(?:ql)?:\/\//i.test(env.DATABASE_URL))
    errors.push("DATABASE_URL must use the PostgreSQL connection scheme.");
  for (const [key, help] of [
    ["S3_BUCKET", "private durable bucket"],
    ["S3_ACCESS_KEY_ID", "bucket-scoped access key"],
    ["S3_SECRET_ACCESS_KEY", "bucket-scoped secret"],
  ]) missing(key, help);
  if (env.S3_ENDPOINT) {
    try {
      const address = new URL(env.S3_ENDPOINT);
      if (address.protocol !== "https:") errors.push("S3_ENDPOINT must use HTTPS.");
    } catch { errors.push("S3_ENDPOINT must be a valid HTTPS URL."); }
  } else if (!env.S3_REGION || env.S3_REGION === "auto") {
    warnings.push("Set S3_ENDPOINT for non-AWS buckets, or an explicit S3_REGION for AWS S3.");
  }
  if (env.ASSET_STORAGE === "local")
    errors.push("Local asset storage is not permitted on hosted deployments.");
  missing("NEXT_PUBLIC_SITE_URL", "set the intended public preview/production origin.");
  if (env.NEXT_PUBLIC_SITE_URL) {
    try {
      const url = new URL(env.NEXT_PUBLIC_SITE_URL);
      if (url.protocol !== "https:") errors.push("Hosted site URL must use HTTPS.");
      if (url.pathname !== "/" || url.search || url.hash) errors.push("NEXT_PUBLIC_SITE_URL must be the site origin only.");
    } catch { errors.push("NEXT_PUBLIC_SITE_URL must be a valid URL."); }
  }
  if (!env.ADMIN_EMAILS?.split(",").some(Boolean))
    errors.push("Missing ADMIN_EMAILS: only explicitly allowlisted database admins can use Card Studio.");
  if (env.CASHFREE_ENV && env.CASHFREE_ENV !== "sandbox")
    errors.push("Production Cashfree is not approved; CASHFREE_ENV must remain sandbox.");
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY)
    warnings.push("Cashfree sandbox credentials are missing. Checkout will remain disabled.");
  warnings.push("Configuration checks do not prove PostgreSQL/S3 connectivity, bucket CORS, database migration, or Vercel deployment readiness.");
  return { ready: errors.length === 0, errors, warnings };
}
