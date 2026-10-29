# Test deployment: GitHub → Vercel (+ Supabase Postgres)

Every push to `main` deploys automatically. Only **one environment variable** is required:
`DATABASE_URL`. Everything else has a test-phase default.

## 1. Database (Supabase, free tier)

1. supabase.com → **New project** (Region: Singapore is closest to Bangladesh). Save the DB password.
2. **Connect** button (top of the dashboard) → **ORMs → Prisma** → copy the **Transaction pooler** URL (port **6543**)
   and put your DB password in it. That's your `DATABASE_URL`:

```
DATABASE_URL=postgresql://postgres.<ref>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

The build adds the rest automatically (see `src/lib/db-url.ts`):
* `pgbouncer=true` and `connection_limit=1` for the transaction pooler
* `schema=nexdrop`, which keeps the tables out of Supabase's public REST API
* `DIRECT_URL` for migrations (same host on the session port **5432**), unless you set it yourself

Use the *pooler* host, not `db.<ref>.supabase.co`, which is IPv6-only and unreachable from Vercel.
If the password contains `@ # / ?`, URL-encode it (`@` → `%40`).

## 2. Vercel

1. vercel.com → **Add New → Project → Import** your GitHub repo. The framework (Next.js) is detected automatically.
2. **Environment Variables:** `DATABASE_URL` from step 1. That's all. `DIRECT_URL` is optional.
3. **Deploy.**

The `vercel-build` script runs on every deploy:

```
resolve DB URLs → prisma generate → prisma migrate deploy → seed (idempotent) → next build
```

On the first deploy, the seed creates the plans, the **demo logins** and the demo stores with 12 months of orders.
Later deploys only re-apply the demo logins and never duplicate data.

## 3. Test

Open the Vercel URL. The sign-in page shows **Try the demo**:

| Button | Login | Password |
| --- | --- | --- |
| Super admin | `demo.superadmin@nexdrop.app` | `Demo@12345` |
| Theme manager | `demo.themes@nexdrop.app` | `Demo@12345` |
| Support | `demo.support@nexdrop.app` | `Demo@12345` |

To try the theme flow, download `examples/lumiere-fashion-1.0.0.zip` from the repo and upload it in Themes. To build it yourself:
`cd themes/lumiere && npm install && npm run package`.

## How it works on Vercel (defaults)

| Concern | Test default | Before real launch |
| --- | --- | --- |
| Demo logins | **on** (`DEMO_MODE` unset) | `DEMO_MODE=false` |
| File storage (themes, images) | stored in Postgres (`STORAGE_DRIVER=db`), served through the Vercel CDN with long cache headers | `STORAGE_DRIVER=s3` (Supabase Storage / R2) for heavy traffic |
| Large uploads | sent in 3 MB chunks (Vercel's request limit is 4.5 MB) | — |
| `NEXTAUTH_SECRET`, `ENCRYPTION_KEY` | derived from `DATABASE_URL` | set real values (`openssl rand -base64 32`). Never change `ENCRYPTION_KEY` after saving payment keys. |
| Your own super admin | none, use the demo | set `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` (10+ chars) and redeploy |
| `NEXTAUTH_URL` | detected from Vercel | set to your custom domain |

Optional: `MARKETPLACE_WEBHOOK_URL`/`MARKETPLACE_WEBHOOK_SECRET`, plus `STOREFRONT_ROOT_DOMAIN` with a wildcard domain.

## Troubleshooting

* **Build fails at `prisma migrate deploy`:** check the password (URL-encoded?) and that the URL uses the `pooler.supabase.com` host.
  The build log prints the resolved URLs with the password masked.
* **"prepared statement already exists" errors:** `DATABASE_URL` is missing `pgbouncer=true`.
* **Sign-in loops back to /login:** an old cookie from another deployment. Clear the site's cookies.
* Logs: Vercel → Project → **Logs**.
