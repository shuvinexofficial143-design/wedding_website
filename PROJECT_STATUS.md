# Project status

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
