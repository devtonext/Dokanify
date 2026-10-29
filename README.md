# NexDrop Super Admin

Super admin panel for NexDrop, a multi-store e-commerce platform built for Bangladesh.
It manages stores, orders, products, customers and analytics, and a **theme
marketplace**: theme zips are uploaded, validated, versioned, published to the
NexDrop marketplace, installed per store, customized in a live visual editor and
served as storefronts.

* Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui, TanStack Query
* PostgreSQL + Prisma, NextAuth (credentials, JWT, roles)
* Object storage: Cloudflare R2 / S3 (local disk in development)
* Bangladesh: BDT (৳ with lakh grouping), bKash / Nagad / Rocket / SSLCommerz / COD,
  64 districts and shipping zones, +880 phone normalisation, Pathao/Steadfast/RedX/Paperfly, বাংলা content

## Quick start

```bash
cp .env.example .env            # set DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY, SEED_ADMIN_PASSWORD
npm install
npx prisma migrate deploy
npm run db:seed                 # plans, super admin, 3 demo stores with 12 months of orders
npm run dev                     # http://localhost:3000
```

Try the theme flow:

```bash
cd themes/lumiere && npm install && npm run package   # → lumiere-fashion-1.0.0.zip
```

Then go to Admin → Themes → **Upload theme**, publish it, pick the *Dokanio Fashion House* store,
**Add to store**, customize it and **Publish**. The live store is at `/s/demo/`.

## Structure

```
src/
  app/                 pages (dashboard, orders, products, customers, stores, themes, editor, settings)
  app/api/             admin API (session + role checked), storefront API (public, CORS), /api/public/themes
  app/t/[...path]      theme preview server (sandboxed)      app/s/[...path]  live storefronts
  proxy.ts             auth gate + {store}.STOREFRONT_ROOT_DOMAIN routing
  server/              business logic: orders (atomic stock), themes (import/versions/installs), analytics, storefront
  lib/themes/          Theme Spec (zod), zip validator, content sanitiser
  lib/                 auth, storage (local/R2/S3), crypto (AES-GCM secrets), bd helpers, store settings
packages/theme-sdk/    @nexdrop/theme-sdk — runtime every theme uses
themes/lumiere/        reference theme following the spec
docs/THEME_SPEC.md     the contract for theme developers
prisma/                schema, migrations, seed
```

## Roles

| Role | Can |
| --- | --- |
| `SUPER_ADMIN` | everything, including plans, team, store plan/status, deleting themes, and the audit log |
| `THEME_MANAGER` | upload, review, publish and release themes |
| `SUPPORT` | stores, orders, products, customers, store settings, theme customization |

## Production (Vercel)

1. Postgres: Neon or Supabase. Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
2. Storage: create an R2 bucket and set `STORAGE_DRIVER=s3`, `S3_*`, and `S3_PUBLIC_URL` (bucket custom domain).
   Add a CORS rule allowing `PUT` from the admin origin, because browsers upload zips/images straight to the bucket.
3. Set `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY` (`openssl rand -base64 32` each).
4. Build command: `prisma migrate deploy && npm run build`. Seed once with `npm run db:seed`.
5. Storefronts on subdomains: add a wildcard domain `*.yourshops.com` to the project and set `STOREFRONT_ROOT_DOMAIN=yourshops.com`.
   Keep the admin on a **different** domain. Theme code then runs on an origin that can never read admin cookies.
6. Marketplace sync: set `MARKETPLACE_WEBHOOK_URL` + `MARKETPLACE_WEBHOOK_SECRET`. The NexDrop site receives
   `theme.published | theme.updated | theme.archived`, signed with `X-NexDrop-Signature: sha256=<hmac>`,
   or it can poll `GET /api/public/themes`.

## Security notes

* Theme previews on the admin host are served with `Content-Security-Policy: sandbox`, so theme JS runs in an opaque origin.
* Zip import blocks zip-slip, zip bombs, server-side file types and absolute asset paths.
* Payment gateway secrets are AES-256-GCM encrypted at rest and never returned to the browser.
* Storefront orders recompute prices, shipping and COD rules on the server, and stock is decremented atomically.
* `rateLimit()` is per-instance. Put Vercel WAF or Upstash in front of `/api/storefront/*` for a global limit.

## Not yet implemented

* Online gateway handshakes (bKash tokenized checkout, Nagad, SSLCommerz IPN). Settings, encryption and the
  `payment.redirectUrl` hook are in place (`src/server/payments.ts`), but orders currently stay `PENDING` until marked paid.
* SMS / email sending, courier API booking, and 2FA.
