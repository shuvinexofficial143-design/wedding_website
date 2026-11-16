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
