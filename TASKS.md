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
- [ ] 4: Admin visual layer editor
- [ ] 5: Unicode smart layout and collision tests
- [ ] 6: Paid customer editor integration
- [ ] 7: Publishing and immutable purchased version pinning
- [ ] 8: Reliable PNG/PDF export
- [ ] 9: Security and browser regression
- [ ] 10: Verified preview deployment and final documentation (provider access required)

## Advanced studio continuation
- [x] PostgreSQL adapter/schema and tested dry-run SQLite importer.
- [x] Private durable storage adapter and validated upload pipeline.
- [x] Immutable database templates and legacy registry preservation.
- [x] Admin visual editor and Unicode layout engine implementation.
- [ ] Browser verification of new designer and touch controls.
- [ ] Dynamic public catalog, order-time version pinning, customer layer editing.
- [ ] Reliable shared export and complete security/browser regression.
- [ ] Hosted provider integration and verified preview deployment (credentials/project access required).
