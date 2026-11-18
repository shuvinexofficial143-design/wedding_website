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
