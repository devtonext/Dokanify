# Deploying: GitHub → Vercel + Supabase

This is the real system — no demo data, no demo logins. What you test is exactly what goes live.

## 1. Connect Supabase to the Vercel project (once)

Vercel → your project → **Storage** (or **Integrations**) → **Supabase** → connect your Supabase project.

This adds `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` and friends to the project automatically.
The app reads them directly — **no `DATABASE_URL` to copy, no password to type**.
(If you created a `DATABASE_URL` by hand earlier you can delete it; the integration's values take priority.)

Supabase **project URL / anon key are not used**: the app talks to Postgres server-side through Prisma.
Its tables live in their own `nexdrop` schema, so Supabase's public REST API (the anon key) can't reach them.

## 2. Two secrets (recommended now, so nothing changes at launch)

Vercel → Settings → Environment Variables:

| Name | Value |
| --- | --- |
| `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | output of `openssl rand -base64 32` (a *different* one) |

`ENCRYPTION_KEY` encrypts the stores' bKash/Nagad/SSLCommerz keys — never change it after saving payment keys.
(Without these, values derived from the database URL are used; they'd change if Supabase rotates the DB password.)

## 3. Deploy

Push to GitHub — Vercel builds automatically:

```
resolve DB URLs → prisma generate → prisma migrate deploy → seed system data (plans) → next build
```

## 4. First visit

Open the site → you land on **/setup** → create the **first super admin** (your name, email, password).
The setup page locks itself permanently once an admin exists. Then:

1. **Stores → New Store** — create your first store.
2. Pick the store in the header switcher → **Products → Add Product**.
3. **Settings** → payments (COD / bKash / Nagad), shipping zones.
4. **Themes → Upload theme** → `examples/lumiere-fashion-1.0.0.zip` → *Publish to marketplace* →
   *Theme library → ⋯ → Add to <store>* → customize → **Publish & make live**.
5. The storefront is live at `/s/<store-slug>/`.
6. **Settings → Team** — invite more admins (Super admin / Theme manager / Support).

## Optional settings

| Variable | Purpose |
| --- | --- |
| `NEXTAUTH_URL` | your custom admin domain (auto-detected on Vercel otherwise) |
| `STORAGE_DRIVER=s3` + `S3_*` | keep theme files/images in Supabase Storage or R2 instead of Postgres (default `db`) |
| `STOREFRONT_ROOT_DOMAIN` | serve stores on `<slug>.yourshops.com` (wildcard domain on the project) |
| `MARKETPLACE_WEBHOOK_URL` / `_SECRET` | push published themes to the NexDrop marketplace |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | create the first admin from env instead of /setup |

## Troubleshooting

* The build log's first lines show which database settings were used (password masked).
* **P1000 authentication failed** — you're using a hand-made `DATABASE_URL` with a wrong password; connect the Supabase integration instead (step 1).
* **"Tenant or user not found"** — the pooler host/region in a hand-made URL doesn't match your project.
* Logs: Vercel → Project → **Logs**.
