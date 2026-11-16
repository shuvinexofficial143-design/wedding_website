# The Wedding Edit

Original wedding invitation storefront built in the existing `shuvinexofficial143-design/wedding_website` repository. Working development implementation, **not cleared for live sales**.

## Run

Node 24+ is required for `node:sqlite`.

```sh
npm ci
cp .env.example .env.local
npm run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000. `NEXT_PUBLIC_SITE_URL` must exactly match the browser origin for mutation protection.

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests use an isolated `data/e2e.sqlite` database. Do not point `DATABASE_PATH` at customer data when running tests. Tests deliberately create paid **fixtures in that isolated database**; there is no HTTP payment bypass. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if needed. The API-only flow can be run with `npm run test:e2e -- tests/browser/api.spec.ts`.

## Implemented

- Responsive original homepage, four catalog categories, product pages, sample previews and proposed prices.
- Customer registration/sign-in, scrypt password hashes, opaque hashed sessions, HTTP-only cookies, mutation origin checks, database-backed rate limits.
- Order ownership checks; only verified paid orders open the editor. Persisted auto-save, optimistic revision conflict detection, photo upload, gallery, HD PNG and PDF.
- Sandbox Cashfree orders, checkout, status verification, raw-body HMAC verification, unique payment IDs and idempotent fulfillment. Server controls price/currency. Return URLs never unlock products.
- Animated public pages with reduced-motion support, random share links, publication snapshots, unpublish, countdown, maps, gallery, RSVP and private guest reply dashboard.
- Managed wedding websites, admin status updates and publication, preview/final delivery links. Manual video fulfillment with authenticated MP4 upload/download.
- WhatsApp contact link when a support number is configured. A provider-neutral adapter contract exists; no AI/WhatsApp automation is connected.

## Payment setup

Set `CASHFREE_ENV=sandbox`, `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` privately in the host environment. Configure the public HTTPS URL and `/api/payments/webhook` endpoint in Cashfree. Use the Sandbox dashboard for testing. Checkout stays disabled without credentials. Provider API version: `2025-01-01`.

There is deliberately **no production payment endpoint**. Production keys/environment are rejected. A future approved launch requires a separate reviewed change and a clean production database; sandbox entitlements must never become real purchases.

Cashfree references:

- https://www.cashfree.com/docs/api-reference/payments/latest/orders/create-order
- https://www.cashfree.com/docs/payments/online/webhooks/signature-verification

## Administrator provisioning

Set `ADMIN_EMAILS` to the intended email list. Public registration refuses those addresses. Admin access requires BOTH an allowlisted email and an explicit database admin role. Merely adding an existing customer email to the list does not grant access.

Set `ADMIN_BOOTSTRAP_EMAIL` and a unique `ADMIN_BOOTSTRAP_PASSWORD` of at least 16 characters privately, then run:

```sh
node --env-file=.env.local --import tsx scripts/create-admin.ts
```

The command refuses to replace an existing account. Remove the bootstrap variables afterward. Never put passwords in commits or command arguments. Open `/admin` after signing in. Admin cannot mark payments paid; only provider verification can do that.

## Deployment and data durability

A Dockerfile is provided. Use one long-running Node instance with a persistent disk mounted at `/data`, owned by the runtime user (uid 1000). The environment uses `DATABASE_PATH=/data/wedding.sqlite` and `UPLOAD_DIR=/data/uploads`. **Do not deploy this SQLite build on an ephemeral/serverless filesystem or scale to multiple independent instances.** A managed PostgreSQL/object-storage migration is required for that deployment model.

Terminate HTTPS at the host/proxy, set the correct site origin and enforce a 52 MB request-body limit. Back up the database with SQLite's online backup API plus the upload directory; copying only the live `.sqlite` file can miss WAL changes. Keep encrypted off-host backups and test restoration before accepting customers. Upload replacement preserves previous files; implement retention cleanup after defining the merchant retention policy.

No hosting resources have been provisioned. Before public launch: configure persistent hosting, support/business identity, approved prices/policies, email verification and password recovery, perform actual Cashfree sandbox success/failure/duplicate tests, review backups and complete browser verification. Final live-payment enablement requires explicit owner permission.

## Design references

Reviewed digitalinvite.in, invitationforyou.in, futureproof.co.in and utsavdiwas.in for category-led shopping, previews, clear steps and mobile-friendly invitation flows. All invitation artwork and CSS here are original; no reference logos, proprietary source or imagery were copied. “The Wedding Edit” is a working brand pending owner approval.

## Resume work

Read `PROJECT_STATUS.md` and `TASKS.md`. Push meaningful milestones to `development`, verify the remote SHA, then merge stable tested changes to `main`. Never force-push. Status documents record the previous verified SHA because a commit cannot include its own hash; `git log -1` gives the current checkpoint.
