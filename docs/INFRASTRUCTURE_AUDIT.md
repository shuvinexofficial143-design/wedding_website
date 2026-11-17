# Audit: advanced studio branch

Baseline: main 498e1abea9ecb1cf2713f836a4fdcbcdc7c23fe7. Ten illustrated SVG cards, three premium cards and all nine original products preserved. Existing admin registry is read-only. Customer editor saves details in orders, exports DOM to PNG/PDF, and verifies payment server-side. SQLite synchronous queries existed throughout auth/orders/RSVP/admin. Photos were data URLs in JSON; MP4 files were local disk paths. Static catalog cannot publish without a deployment. No purchased template version exists in baseline.

## Milestone 1

Provider-neutral bound SQL adapter now awaits remote operations. DATABASE_URL selects PostgreSQL; local SQLite preserves development and regression tests. Vercel refuses SQLite fallback. Transaction contexts isolate a checked-out PostgreSQL client or a serialized SQLite transaction. `migrations/001_studio.sql` covers users/sessions/orders/payments/purchases/templates/versions/edits/assets/links/audits/managed delivery/RSVP.

Run `npm run db:migrate` against a separately provisioned database. Application does not create paid cloud resources. Never change production DATABASE_URL until import validation is complete.

## Data migration and rollback

1. Freeze source writes and take an encrypted host backup of SQLite and legacy uploads.
2. Set SQLITE_IMPORT_PATH and target DATABASE_URL privately. Run `npm run db:import` (dry run). Script uses SQLite online backup to produce a consistent snapshot, validates every source field, row counts, primary identity, ownership and payment status, then rolls back the target transaction. Report contains only counts and checksums.
3. Target business tables must be empty: existing records are never overwritten. Compare report and retain snapshot. Set MIGRATION_WRITES_FROZEN=yes and run `npm run db:import -- --apply` to commit atomically.
4. Restart application against target; verify customers, paid access and media. Legacy disk videos need separate asset migration before deleting any old host.
5. Before reopening writes, rollback means pointing application at the preserved SQLite snapshot. After PostgreSQL accepts new writes, freeze both stores and reconcile new records before any rollback. Do not blindly restore the old snapshot or run DROP TABLE; this would lose post-cutover orders.

PGlite tests exercise a real embedded PostgreSQL engine, including dry run, successful preservation, and non-empty-target rejection. Network PostgreSQL/actual hosted migration remain untested until a provider is configured. No production database touched.
