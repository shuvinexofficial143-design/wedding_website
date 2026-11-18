# Suhani final integration

Integration branch: `feature/suhani-final-integration`. Draft PR: https://github.com/shuvinexofficial143-design/wedding_website/pull/4

## Preserved and integrated

- Advanced layer studio and purchased version pinning; ten artwork and three premium cards.
- Six original animation timelines and four self-service wedding website layouts.
- Separate managed animated service: YouTube sample, private Canva master, per-order independent editing copy and immutable purchase snapshot.
- Existing customer authentication, verified Cashfree sandbox unlock, orders and RSVP.

## New upload and delivery behavior

Admin can upload a thumbnail (10 MB) and preview YouTube inline. Uploaded thumbnails remain private until attached to a published animated template; unpublishing removes anonymous access. Images are decoded and normalized before use.

Final MP4s (50 MB) upload directly to private S3-compatible storage using short-lived upload URLs. Progress reaches 100 only after checksum, size and media validation. Admin marks delivery explicitly after upload; delivery checks the immutable stored object exists. Only the paid order owner or an authorized admin can request its download. Production uses 60-second signed downloads. Local storage remains test-only. Older local video deliveries remain readable; new legacy video uploads also use the asset pipeline.

The WhatsApp button prepares a message for manual sending. It does not update delivery status and does not send through a Business API. Canva duplication is manual; master and editing copy IDs must differ and a copy cannot be assigned to multiple orders.

## Safety and migration

Schema v4 combines the divergent v3 branch schemas. Guarded additive upgrades support either known v3 layout plus v2, reject unknown/partial schemas and run in one transaction. SQLite import preserves both animated jobs and RSVP records; PostgreSQL BIGINT string values are normalized only for numeric comparison during validation.

On 18 November 2026, Neon project `young-tree-11673724`, preview `br-curly-bar-ao23mgo4` (`preview/feature/advanced-card-studio`) was inspected read-only. It is not the default branch. `neondb.public` had zero relations and zero functions. No hosted migration has been run. Snapshot creation was unavailable through the connected provider tool; this remains a backup prerequisite, not a successful snapshot. Never run migration against production `br-still-water-aou8u5e2`.

Before hosted migration: take a verified provider snapshot or logical backup, recheck branch identity and inventory, provide that preview database's pooled and unpooled URLs privately, then run `npm run db:migrate:preview` and `npm run db:verify:preview` in the verified preview environment. A fresh/known upgrade failure rolls back atomically. After commit, prefer a forward correction; never destroy customer rows to roll back a deployment.

## External launch requirements

1. Connect the wedding Vercel project/account. Current personal account and Avanti Verse team project searches returned no matching project; no preview URL is verified.
2. Complete the preview backup/migration and map DATABASE_URL and DATABASE_URL_UNPOOLED to that exact preview branch.
3. Configure private S3 credentials, bucket and exact-origin CORS (PUT and Content-Type), then test an actual upload/download on the hosted preview. No bucket has been created or made public.
4. Configure Cashfree sandbox credentials and run a genuine provider test transaction and signed webhook. Fixture payments in automated tests are not live gateway evidence.
5. Review real business prices, WhatsApp number, admin allowlist/role, recovery/email settings and policies.
6. Production merge and real payments require the owner's explicit approval. Neither was enabled.

See PROJECT_STATUS.md for current exact test counts and commit evidence. Browser tests run against an isolated local app on GitHub Actions, not a Vercel deployment.

## Verified acceptance evidence

Application commit `17fa33abdcb95b2893a1dffc8c3f05a4ff0ba0a9`: GitHub Actions run [44286140320](https://github.com/shuvinexofficial143-design/wedding_website/actions/runs/44286140320) passed **42 unit/integration and 49 Playwright browser/API tests**, with zero failures. Lint, TypeScript and production build passed. This is isolated CI acceptance, not a hosted deployment claim. Documentation-only checkpoint follows the tested application commit.

## Changed-file inventory

The following compares the integration to the original animation/website builder head `7bf813a`; it includes the merged advanced-branch features as well as this integration's additions (A = added, M = modified).

```text
M	.env.example
M	.github/workflows/ci.yml
M	PROJECT_STATUS.md
M	TASKS.md
A	docs/FINAL_INTEGRATION.md
M	package.json
M	scripts/migrate-preview.ts
A	sql/neon-preview-v3-animated-reviewed.sql
A	src/app/admin/animated/orders/[id]/page.tsx
A	src/app/admin/animated/orders/page.tsx
A	src/app/admin/animated/page.tsx
M	src/app/admin/page.tsx
A	src/app/api/admin/animated/[id]/route.ts
A	src/app/api/admin/animated/orders/[id]/route.ts
A	src/app/api/admin/animated/orders/route.ts
A	src/app/api/admin/animated/route.ts
M	src/app/api/assets/[id]/route.ts
A	src/app/api/orders/[id]/animated/route.ts
M	src/app/api/orders/[id]/video/route.ts
M	src/app/api/orders/route.ts
M	src/app/catalog/page.tsx
M	src/app/checkout/[id]/page.tsx
M	src/app/dashboard/page.tsx
M	src/app/editor/[id]/page.tsx
M	src/app/globals.css
M	src/app/preview/[id]/page.tsx
M	src/app/products/[id]/page.tsx
A	src/components/animated/customer-details.tsx
A	src/components/animated/order-fulfilment.tsx
A	src/components/animated/order-queue.tsx
A	src/components/animated/template-manager.tsx
A	src/components/animated/video-preview.tsx
M	src/components/animation/timeline-player.tsx
M	src/components/studio/layer-card.tsx
M	src/components/website/guest-rsvp.tsx
M	src/components/website/website-editor.tsx
A	src/lib/animated/repository.ts
A	src/lib/animated/youtube.ts
M	src/lib/cashfree.ts
M	src/lib/database/import-sqlite.ts
M	src/lib/database/preview-migration.ts
M	src/lib/database/schema.ts
M	src/lib/storage/validate.ts
M	src/lib/upload-client.ts
A	tests/animated-storage.test.ts
A	tests/animated.test.ts
A	tests/browser/animated.spec.ts
M	tests/browser/api.spec.ts
A	tests/browser/fulfilment-api.spec.ts
M	tests/browser/studio-integration.spec.ts
M	tests/migration.test.ts
A	tests/mp4-fixture.ts
M	tests/preview-migration.test.ts
```
