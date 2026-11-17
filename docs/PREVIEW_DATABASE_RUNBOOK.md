# Neon Preview-only database schema migration

**Status (17 Nov 2026): reviewed and safely prepared; NOT executed against hosted Neon.** The current ChatGPT Vercel connection only lists eight unrelated projects and does **not** expose `wedding-website`, so the Preview connection/target cannot yet be independently verified. The user reports zero public tables; this remains unconfirmed by a live SQL query.

## Reviewed source and scope

- Git branch: `feature/advanced-card-studio` (Draft PR #2), **not** `main`.
- Existing SQL schema: `src/lib/database/schema.ts`, version `2`.
- Previous generic migration: `src/lib/database/postgres.ts` uses a transaction, an advisory transaction lock, `CREATE TABLE/INDEX IF NOT EXISTS`, `ALTER TABLE ... IF NOT EXISTS`, and version registration. No `DROP`, `TRUNCATE`, `DELETE`, or destructive data updates are in that schema.
- The new `npm run db:migrate:preview` command additionally requires Vercel Preview, the exact feature branch, both Neon connection variables identifying the same endpoint, and sandbox-only Cashfree. It uses `DATABASE_URL_UNPOOLED` for this schema operation.
- The public schema must contain **zero tables** or an already complete version-2 schema. Partial, unknown, or older schema aborts without modifying anything.
- All 16 table DDL statements, version marker, and verification happen inside **one transaction** protected by an advisory lock. A failed statement rolls back all new tables.
- Only table inventory/columns, connection ping, migration version, and table row **counts** are reported. No secrets or customer data are printed.

## Expected public tables

`admin_audit_logs`, `asset_links`, `assets`, `audit`, `card_templates`,
`customer_card_edits`, `limits`, `orders`, `payments`, `purchased_products`,
`rsvps`, `schema_migrations`, `sessions`, `template_versions`, `users`,
`wedding_website_orders`.

## Approved commands (run only inside the correctly linked Preview environment)

```bash
npm run db:migrate:preview
npm run db:verify:preview
```

Do not run `npm run db:migrate` on Vercel; that generic CLI now fails closed on hosted builds. Never run either Preview command on Production. Do not paste or log `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, or `.env` files.

## Verification requirements

1. In the actual intended Neon **Preview branch**: verify its endpoint/branch identity and zero tables before write. The Preview Vercel env vars must not point at the Production Neon branch. Matching pooled/direct URLs alone does not prove isolation from Production.
2. Check connection and `current_schema() = 'public'` and version `2`.
3. Verify exactly **16 public tables**, expected required columns, and all foreign keys/indexes created by the schema.
4. A newly initialized database should have zero rows in user tables and one `schema_migrations` row.
5. Repeat verification in read-only transaction; optionally re-run safe migration and expect `created=false` with the same counts.
6. Test an actual Preview deployment's runtime without touching Production, then perform private S3 testing separately.
7. Never declare live tables created until a real Neon connection and read-only post-migration inventory are actually confirmed.

## Current blocker

The active Vercel connector does not have access to the `wedding-website` Project and there is no Neon connector connected at the time of review. The Neon app can be connected through ChatGPT without posting credentials into the chat, or the correct Vercel Team/Account can be authorized in the existing connector.
