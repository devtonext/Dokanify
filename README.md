# NexDrop Super Admin

Super admin panel for NexDrop, a multi-store e-commerce platform built for Bangladesh.
It manages stores, orders, products, customers and analytics, and a **theme
marketplace**: theme zips are uploaded, validated, versioned, published to the
NexDrop marketplace, installed per store, customized in a live visual editor and
served as storefronts.

* Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui, TanStack Query
* PostgreSQL (Supabase self-hosted works as-is) + Prisma, NextAuth (credentials, JWT, roles)
* Storage: local volume on a VPS, or any S3-compatible store (Supabase Storage, MinIO, R2)
* Bangladesh: BDT (৳ with lakh grouping), bKash / Nagad / Rocket / SSLCommerz / COD,
  64 districts and shipping zones, +880 phone normalisation, Pathao/Steadfast/RedX/Paperfly, বাংলা content

## Quick start

```bash
cp .env.example .env            # set DATABASE_URL (any Postgres / Supabase)
npm install
npx prisma migrate deploy
npm run db:seed                 # system data: subscription plans
npm run dev                     # http://localhost:3000 → /setup creates the first super admin
```

Try the theme flow:

```bash
cd themes/lumiere && npm install && npm run package   # → lumiere-fashion-1.0.0.zip
```

Then create a store (Stores → New Store), go to Themes → **Upload theme**, publish it,
**Add to store**, customize it and **Publish**. The live store is at `/s/<store-slug>/`.

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

## Deploy (GitHub → Vercel + Supabase)

Connect Supabase to the Vercel project (Storage → Supabase) — the database URLs are picked up automatically.
Set `NEXTAUTH_SECRET` and `ENCRYPTION_KEY`, push, then open the site and create the first admin on `/setup`.
See [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md).

## Production (VPS: Coolify + Supabase)

Full guide: [`docs/DEPLOY_COOLIFY.md`](docs/DEPLOY_COOLIFY.md). In short:

1. Deploy Supabase as a Coolify service. The app uses its Postgres through Prisma, in a dedicated
   `nexdrop` schema (`?schema=nexdrop`), so the tables are never exposed by Supabase's REST API.
2. Deploy this repo with the **Dockerfile** build pack. Mount a persistent volume at `/app/storage`
   for themes and images.
3. Set the env vars from `.env.example`. Use `RUN_SEED=true` for the first deploy only.
   Migrations run automatically on every start.
4. Optional: `*.shops.example.com` storefront subdomains (`STOREFRONT_ROOT_DOMAIN`), marketplace webhook.

The app also runs on Vercel (with Supabase/Neon plus R2 storage), but the VPS setup is simpler:
no serverless body limits, and local disk storage works.

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
