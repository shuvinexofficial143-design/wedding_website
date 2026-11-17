# Project status

## Latest verified milestone — 16 November 2026 (10 original artwork cards)

- Ten new original **1000 × 1400 SVG** artwork cards are integrated into the catalog and existing protected paid editor. The prior Royal Gold, Floral Pink and Traditional Indian templates were preserved; no existing product records were removed.
- Each card has a unique template ID, vector artwork and thumbnail, separately editable name/date/time/venue/address/message layers, a per-template font/layout definition, optional couple-photo slot and explicit published flag in the code-reviewed registry.
- Protected `/admin/cards` shows card IDs, prices, artwork, text-layer settings and publish status. It is **read-only** by design: persistent admin upload/publish actions need a durable datastore and were not added.
- Visual QA: all ten artwork cards were captured at desktop (1440px) and mobile (390px), plus each mobile edited version. Long multiword names, venue and address are rendered with adaptive density and bounds/collision tests. Reviewed all ten actual 1800 × 2497 PNG exports against browser previews (no missing backgrounds found; minor browser/resampling differences remain).
- CI **PASS** on source commit `10127b3cbf8e75b2183233d88df00d6be5f93d2a`, [GitHub Actions run 43879360764](https://github.com/shuvinexofficial143-design/wedding_website/actions/runs/43879360764): ESLint, unit tests, Next.js production build, and **29/29 Playwright browser tests**, including 10 paid editable/export checks and 10 desktop/mobile artwork tests.
- Existing login, payment verification, orders, private RSVP and other functions are covered by the same regression workflow. Cashfree production payments **remain disabled**. Merchant prices are only proposals.
- Release blockers: the supplied Vercel production deployment could not be verified from the available account/project access; customer-order SQLite durability on ephemeral hosting is still unproven. Never advertise production checkout or start Cashfree live payments until durable storage and merchant launch are approved.
- Technical template guide: `docs/CARD_TEMPLATES.md`.


## Completed Features

- Repository inspected: empty, no existing branches or data.
- Next.js, TypeScript, Tailwind foundation.
- Original responsive homepage, navigation and invitation artwork (CSS; no copied assets).

## Currently Working On

- Phases 5–6 implemented; end-to-end desktop/mobile testing in progress.

## Pending Tasks

- Catalog, previews, editor, persistence, exports, secure payments, authenticated orders/admin, deployment.

## Latest Commit SHA

- Verified predecessor: 243832b040b771d1227675dc42ed3837ffe09c3d (development). Each checkpoint records its predecessor; use git log -1 for current SHA.

## Testing Results

- Homepage, catalog, accounts, editor and Cashfree integration lint and production build passed.

## Known Bugs

- No email verification/password reset yet. Sandbox gateway end-to-end test requires credentials. No production endpoint exists.

## Required Credentials / Blockers

- Cashfree sandbox credentials; production payments must remain disabled pending explicit permission.
- Database, authentication/email provider, object storage, support WhatsApp number, final business identity and prices, hosting target.

## Exact Next Step

- Validate homepage, push development branch, implement catalog and preview destinations.

- Phase 2: four category filters, six products, preview routes, support configuration and clearly marked draft policies.

- Accounts with scrypt passwords, hashed opaque sessions, reserved admin emails and mutation origin checks.
- SQLite order persistence (requires persistent disk in deployment), paid-only autosaving editor with conflict detection, photos, PNG/PDF export.
- Cashfree sandbox server orders, signed raw-body webhooks, amount/currency matching, unique payment IDs; no production endpoint.

- Animated invitation publication, unpublish, countdown, gallery, maps, private RSVP collection.
- Admin-only managed order fulfillment, website publication and private MP4 delivery with upload validation.
- Four unit security tests passed; full build/lint passed. Browser Chromium download failed; installed system Chromium is available and is being used instead.

- API integration flow PASSED: account creation, server-controlled price, duplicate pending order, paid editor gate, ownership isolation, origin rejection, unsigned webhook rejection, revision conflicts, publication/unpublish, RSVP privacy, explicit admin role, managed website delivery and invalid MP4 rejection.
- Local visual/browser suite BLOCKED by Chromium socket() EPERM; GitHub Actions workflow added to run it in CI. Do not report browser/export rendering as verified yet.
- Docker deployment instructions and WhatsApp adapter contract prepared. Hosting and business configuration still required.

## 2026-11-16 — Premium editable cards milestone

- Implemented three unique, self-contained card artworks: Royal Gold (gilded palace arch/crown), Floral Pink (rose bouquet stationery), Traditional Indian (marigold toran and mandala).
- Catalog identifiers: `royal-gold-wedding`, `floral-pink-wedding`, `traditional-indian-wedding`. Proposed launch prices are INR 499 / 449 / 499; owner must approve before any real sales.
- All three reuse the existing paid-order editor, server-side save and live preview for names, wedding date, time, venue and optional photo. Existing HD PNG and PDF export is reused. Public preview remains a sample, not a paid editor bypass.
- Legacy products, protected editor access, authentication, database and Cashfree sandbox implementation left intact. Live payment processing was not enabled.
- Added unit regression tests for legacy catalog preservation, original artwork and editable text, plus Playwright 1440px/390px previews, mobile editor persistence and actual download signatures for every card.
- Verified: GitHub Actions run 43869254907 completed successfully. ESLint PASS; unit tests PASS; Next.js production build PASS; Playwright Chromium 9/9 browser tests PASS (including all premium mobile editor and PNG/PDF export checks).
- Infrastructure reminder: existing SQLite order storage needs a persistent disk; ephemeral serverless storage is not production safe.

### Original illustrated card products — milestone 2 (2026-11-16)

- Published `Luxury Maroon Heritage` and `White & Gold Minimal` in catalog, with individual /public/card-art SVG, editable DOM layers, template metadata and different composition styles.
- Both templates reuse existing paid editor and PNG/PDF; no payment/auth/schema/storage infrastructure changed at this milestone.
- Build, browser and visual checks are being run by GitHub Actions on pushed commits. Prices remain unapproved proposals and Cashfree live disabled.

### Illustrated cards — Hindu / Rajasthani milestone (2026-11-16)
- Published Traditional Hindu Wedding and Rajasthani Royal Wedding with original detailed SVG artwork, editable live DOM text and individual layouts.
- Protected verified-paid editor reused. CI validation triggered by this push.

### Illustrated cards — Pastel / Nikah milestone (2026-11-16)
- Published Pastel Watercolor Floral and Elegant Muslim Nikah Invitation in catalog with unique original vectors and editable live preview layered over artwork.
- Existing authentication and payment gate unchanged; CI validation triggered.

### Illustrated cards — South Indian / Emerald milestone (2026-11-16)
- Published South Indian Traditional Wedding and Luxury Dark Emerald Wedding: unique original SVG artworks, responsive typography and the same authenticated paid editor/export pipeline.
- The original three premium designs and nine original other products remain untouched.
- Full new ten-card regression and screenshot review still required before launch claims.

## Advanced Studio — 17 November 2026
- Baseline audited: main 498e1abea9ecb1cf2713f836a4fdcbcdc7c23fe7. Existing 10 artwork + 3 premium + 9 legacy products preserved.
- Branch: feature/advanced-card-studio. Production/main is not modified by this project.
- Milestone 1 implemented: asynchronous bound SQL PostgreSQL adapter with SQLite development compatibility, explicit transaction isolation, persistent-only Vercel guard, schema migration, snapshot-backed SQLite importer with dry run, exact row verification and rollback.
- Tests: lint PASS; 10 unit/integration tests PASS including PostgreSQL-engine migration validation; Next production build PASS. Hosted database not connected or migrated.
- Latest verified predecessor: 498e1abea9ecb1cf2713f836a4fdcbcdc7c23fe7. Current checkpoint SHA is `git log -1` (self-reference is impossible).
- Blockers: current connected Vercel account returned zero matching wedding projects. No durable PostgreSQL/S3 credentials discovered; no paid resource created.
- Exact next step: secure S3-compatible assets and upload validation, then dynamic immutable templates and visual studio.

### Advanced studio milestone 2
- S3-compatible private object storage, signed upload/download APIs, checksum/size/type verification, image normalization and SVG rasterization implemented. Customer-owned assets are inaccessible to other accounts. Public access is limited to referenced published template artwork, never arbitrary uploaded photos.
- Added immutable object keys, owner-scoped duplicate detection, guarded asset links, tombstone-first cleanup and quarantine lifecycle guidance. Local adapter is test-only and blocked on Vercel/production.
- Validation: lint PASS, 12 tests PASS (including malicious SVG/disguised image rejection), production build PASS. Real S3 provider/CORS not tested without credentials.
- Verified predecessor: 48ead2d8fc3298e27302536afeefb07a70158757. Next: dynamic template version repository, seed all legacy cards, version-pinned purchases.

### Advanced studio milestone 3
- Dynamic template repository, create/save/publish/unpublish/archive APIs, immutable template-version history and explicit revision conflicts implemented.
- Legacy seed copies ALL existing products into preserved renderer snapshots and backfills purchased version references without rewriting source card artwork or customer order details.
- Tests: 14 unit/integration tests PASS, lint/build PASS. Includes all-product preservation, concurrent save conflict, old-version retention after unpublish and noneditable-layer rejection.
- Initial async-database checkpoint passed existing full GitHub browser regression run 44018931927 (29 tests).
- Latest verified predecessor: be3e1aa190ffeaa1fe3ac9602737d2b4674763c4. Next: visual drag/resize studio and shared Unicode rendering engine; public catalog/customer wiring follows.

### Advanced studio milestones 4–5
- Implemented authenticated visual designer with mouse/touch move and resize, layer properties, undo/redo, safe bounds, grid snapping, zoom, background/thumbnail uploads, immutable save, publish controls and version history.
- Shared Unicode renderer measures text using loaded bundled fonts, shrinks/wraps long names by grapheme, detects overflow and collisions, and clamps rotated layers. Server rejects publishing colliding text boxes.
- Validation: production build PASS; lint and 17 unit/integration tests PASS. New designer browser interactions still require browser tests. Existing legacy designs are preserved; customer/public dynamic wiring is the next milestone.
- Latest verified predecessor: eb470ec67551a4beffd01bdec9b5996389b626c3. Current checkpoint SHA: git log -1 on feature/advanced-card-studio.
- Blockers unchanged: hosted PostgreSQL/S3 and matching Vercel project not connected. No real payments enabled.
- Exact next step: wire catalog and order-time version pinning, then paid customer layer editor and reliable export.
