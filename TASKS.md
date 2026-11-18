# Final integration — 18 November 2026

- [x] Audit both feature branch heads and resolve merge conflicts preserving functionality.
- [x] Merge PostgreSQL schema inventories into v4 and pass 37 local tests, lint and build.
- [x] Thumbnail computer upload and inline video preview implemented; browser acceptance pending.
- [x] Private durable final MP4 upload, progress and owned download implemented; hosted S3 acceptance pending.
- [ ] Expanded fulfilment regression tests and browser failure fixes.
- [ ] Safe preview database backup, migration and verification (never production main).
- [ ] Verified Vercel preview and real Cashfree sandbox test.
- [ ] Production merge requires explicit owner approval.

Historical checklist follows:

# Implementation checklist

- [x] Verify existing repository and branches
- [x] Phase 1: Next.js setup, responsive homepage, navigation
- [x] Phase 2: catalogs, product pages, previews
- [x] Phase 3: paid customer editor, durable saving, PNG/PDF export
- [x] Phase 4: Cashfree sandbox, verified unlock, signed idempotent webhook
- [x] Phase 5: animated invitations and shareable publication
- [x] Phase 6: website/video orders, authenticated customer and admin dashboards
- [ ] Phase 7: WhatsApp integration preparation, end-to-end testing, deployment
- [ ] Configure business identity, approved prices, support number and legal policies
- [ ] Enable real payments only after explicit owner permission

- [ ] Run actual Cashfree sandbox transaction with merchant credentials
- [ ] Add verified email and password recovery before public launch

### Premium card milestone — 2026-11-16

- [x] Inspect current repository, PROJECT_STATUS, TASKS, editor and export implementation
- [x] Create Royal Gold, Floral Pink and Traditional Indian distinct templates
- [x] Add all 3 to existing catalog, product and preview routes
- [x] Reuse real-time paid editor for both names, date, time and venue
- [x] Reuse PNG/PDF export; add per-template automated export regression
- [x] Add desktop/mobile layout and persistence browser tests
- [x] Confirm new GitHub Actions browser test suite: 9/9 Playwright passed (run 43869254907)
- [ ] Approve provisional premium card prices before real commercial use
- [ ] Run verified Cashfree sandbox checkout with merchant credentials
- [ ] Do not enable production Cashfree without explicit owner consent

- [x] Illustrated artwork, catalog and live preview: Luxury Maroon Heritage / White & Gold Minimal

- [x] Illustrated Traditional Hindu Wedding + Rajasthani Royal Wedding cards: catalog, live preview, editor and export integration

- [x] Illustrated Pastel Watercolor Floral + Elegant Muslim Nikah Invitation: separate original artwork and editable export

- [x] Illustrated South Indian Traditional Wedding + Luxury Dark Emerald: SVG artwork, catalog, live preview and export integration
- [x] Run final all-ten artwork loading, mobile, paid editor, PNG/PDF exports and visual screenshot review — 29/29 Chromium tests passed (GitHub Actions 43879360764)
- [x] Fix long-name/title/address overlaps with responsive density classes and bounds regression
- [x] Verify actual 1800px PNG exports for all ten artworks against mobile card previews
- [x] Create read-only protected admin template registry at /admin/cards
- [ ] Verify latest production Vercel deployment and configure durable order storage before taking real payments
- [ ] Extend admin studio to durable secured create/publish/unpublish workflow after persistent data infrastructure is agreed

## Advanced studio milestones
- [x] 1: Latest-main audit, PostgreSQL schema/adapter, safe import/dry-run/rollback tests
- [x] 2: Durable storage and secure asset lifecycle (provider-neutral implementation; hosted acceptance pending)
- [x] 3: Dynamic template database and legacy migration
- [x] 4: Admin visual layer editor (browser mouse/touch, undo/redo, save/reload)
- [x] 5: Unicode smart layout and collision tests (Hindi/English preview verified)
- [x] 6: Paid customer editor integration (pinned snapshot, server layer allowlist and private photo ownership)
- [x] 7: Publishing and immutable purchased version pinning (atomic purchase snapshot, unpublish-safe)
- [x] 8: PNG/PDF export implementation and local browser magic-byte tests (hosted visual acceptance pending)
- [x] 9: Local browser security and regression 33/33, run 44032663514 (final-head checks ongoing)
- [ ] 10: Verified preview deployment and final documentation (provider access required)

## Advanced studio continuation
- [x] PostgreSQL adapter/schema and tested dry-run SQLite importer.
- [x] Private durable storage adapter and validated upload pipeline.
- [x] Immutable database templates and legacy registry preservation.
- [x] Admin visual editor and Unicode layout engine implementation.
- [x] Browser verification of new designer and touch controls (32/32 Chromium run 44031865089).
- [x] Dynamic public catalog, order-time version pinning, customer layer editing (33/33 Chromium run 44032663514).
- [x] Local PNG/PDF export, role/ownership and cross-version regression; hosted S3/PG acceptance still pending.
- [ ] Hosted provider integration and verified preview deployment (credentials/project access required).

### Pending hosted acceptance (not simulated)
- [ ] Link the **correct** wedding Vercel project; verify a non-production feature-branch preview URL and deployment commit.
- [ ] Provision and verify network PostgreSQL and private S3 credentials, bucket CORS, object lifecycle and backups without disclosing secrets.
- [ ] Run full migration dry run against actual owned source backup, then user-approved cutover with rollback documentation.
- [ ] Perform actual sandbox merchant checkout and private image upload from a hosted preview; no live Cashfree.
- [ ] Repeat mobile desktop screenshot comparison, Hindi font and PNG/PDF visual inspection on the hosted preview.

- [x] Additional mobile touch **resize**, not only drag — tested in passing Chromium run 44033583175
- [x] Downloaded and inspected actual Studio desktop/mobile/customer screenshots from CI artifact 14306531197
- [x] Scoped support floating pill off the Studio/Editor pages; regression assertion added
- [ ] Verify final screenshot/UI hardening commit on CI and compare browser preview to PNG/PDF on an accessible Vercel preview

### Dynamic public invitation share flow
- [x] Publish/Unpublish actions for paid dynamic cards, with immutable purchased version and optimistic revision guard
- [x] Public guest invitation route for newly designed cards, with RSVP and no requirement to log in
- [x] Token-scoped image access with a strict visible-asset allowlist and immediate revocation
- [x] Customer consent message for publicly shared photos and copy-link UI
- [x] Verified shared-guest baseline in 33/33 Chromium CI run 44036222561
- [x] Real customer PNG upload, anonymous 390px mobile guest screenshot, revoked image URL test: 33/33 Browser and 22 unit tests passed in run 44037053721
- [ ] Verify hosted PostgreSQL + S3 upload and preview only after legitimate provider credentials/project access

## Animated Wedding Builder (separate branch)
- [x] Audit latest Studio baseline and isolate new feature branch.
- [x] Versioned timeline validation and shared browser playback implementation.
- [ ] Six original animated invitation compositions.
- [ ] Admin timeline editing, duplication and version workflow.
- [ ] Paid animated customer/guest integration regression.
- [ ] Four wedding website layouts and structured editor with explicit eligibility.
- [ ] Event RSVP, duplicate handling, private CSV export.
- [ ] Full browser/security/performance checks and screenshots.
- [ ] Verified preview deployment; no main merge.

### Animated builder implemented checkpoints
- [x] Six original animated compositions with paid personalised guest sharing.
- [x] Admin timeline duration/delay/easing/preset controls and template duplication.
- [x] 39-test Chromium regression at 5b7a0ae; actual six animation mobile flows passed.
- [x] Four website layouts and structured self-service editor implementation.
- [x] Event RSVP metadata/duplicate handling and private CSV implementation.
- [ ] Combined final-head browser tests, website visual QA and authenticated provider tests.
- [ ] Authorised additive v3 migration on a named preview database; never production.
