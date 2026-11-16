# Original Wedding Card Template Studio

## Architecture

The existing storefront, authenticated orders, paid-only editor, publishing, and PNG/PDF export remain unchanged. Ten additional **original illustrated** card products use a data-driven registry in `src/lib/card-templates.ts`. Earlier Royal Gold, Floral Pink, Traditional Indian and all original products remain separate and available.

- **Product ID, name, category, proposed price and publish state**: static, reviewed template registry records.
- **Artwork and thumbnail**: original vector files in `public/card-art/{id}.svg`, with real image loading in catalog, product page, public sample preview and paid editor. The catalog thumbnail is the composite artwork plus sample text, not a placeholder.
- **Editable layer configuration**: bride/groom names, date, time, venue, address, invitation message and optional photo; font settings and composition are per template.
- **Runtime rendering**: `src/components/artwork-card.tsx` with the original SVG image behind separate, live-editable React text nodes; CSS composition in `src/app/globals.css`. Artwork is never a flat PNG with names baked into it.
- **Management**: authenticated, admin-only read-only inventory at `/admin/cards`. It reads the same registry displayed by the storefront.

## How to add a card

1. Create a completely original, copy-safe SVG background at 1000×1400 viewBox or larger; keep a legible, clear text safe zone.
2. Add an entry in `cardTemplates` with a **unique ID and theme**, artwork + thumbnail paths, category, proposed price, publish boolean, font settings, and text layer metadata.
3. Write a distinct composition class `.art-{layout}` with safe positions; do not reuse an identical composition for a new product. Design for 390px mobile first.
4. Review and push changes to GitHub; check GitHub Actions desktop/mobile screenshots, PNG/PDF signatures, reload persistence, content legibility, and untouched legacy tests.
5. Set `published: false` for not-ready artwork. Publishing requires code review and a tested deployment, not an unverified admin toggle.

## Safe data and sales constraints

- All customer-specific edits use the existing server-owned order JSON with revision conflicts. No new user database schema or image storage services were introduced.
- `/editor/[id]` requires signed-in ownership **and** verified paid status. No preview or artwork route unlocks paid editing.
- The Cashfree integration remains sandbox-only; production payments require explicit owner authorization and merchant launch preparation.
- Product prices are *proposed*, not approved commercial prices.
- SQLite on an ephemeral platform such as standard Vercel serverless storage is **not durable**. Do not migrate orders or expose live payment features before persistent infrastructure is configured.
- Dynamic admin publish switches and runtime uploads must wait for a durable, authenticated data store. The current admin inventory is deliberately read-only.

## QA

CI runs ESLint, unit tests, production build and Playwright Chromium. The 10-artwork browser suite renders each card at 1440px and 390px, checks the vector images loaded, and verifies payment gate, editable text, autosave/reload and PNG/PDF output per template.

Image fidelity caveat: these are **original detailed vector illustrations**, not photorealistic AI-generated wedding card photography. Their resolution is independent of screen size. Browser screenshots are the authoritative render verification.
