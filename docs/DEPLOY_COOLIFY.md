# Deploying on a VPS with Coolify + Supabase

```
            ┌──────────────────────── your VPS (Coolify) ─────────────────────────┐
 admin.example.com ─┐                                                            │
 *.shops.example.com ┼─► Traefik ─► nexdrop-admin (Dockerfile)  ──► supabase-db  │
                    │                 │  /app/storage  (volume)      (Postgres,  │
                    │                 │  themes + uploaded images     schema     │
                    │                 ▼                               "nexdrop") │
                    └──────────── Supabase stack (Studio, Auth, Storage…) ───────┘
```

The app needs only **Postgres** from Supabase. Prisma connects as a normal Postgres client,
so Supabase Studio, backups and point-in-time recovery all work on the data.
Supabase Auth and the Supabase JS client are not used (admins sign in through NextAuth).

## 1. Supabase

1. Coolify → **+ New → Service → Supabase**. Deploy it.
2. Copy `POSTGRES_PASSWORD` from the service's environment variables.
3. Keep the app's tables **out of `public`**. Supabase's REST API (PostgREST) exposes `public` to anyone
   holding the anon key. Every connection string below ends with `?schema=nexdrop`: Prisma creates and uses
   that schema, and PostgREST does not expose it (its default is `public,storage,graphql_public`). Don't add
   `nexdrop` to `PGRST_DB_SCHEMAS`.

| Where the app runs | `DATABASE_URL` / `DIRECT_URL` |
| --- | --- |
| Same Coolify server and network *(recommended)* | `postgresql://postgres:PASSWORD@supabase-db:5432/postgres?schema=nexdrop&connection_limit=10` (use the db container's name as shown in Coolify) |
| Through Supavisor, transaction mode | `DATABASE_URL=…:6543/postgres?schema=nexdrop&pgbouncer=true` and `DIRECT_URL=…:5432/postgres?schema=nexdrop` |
| Supabase Cloud | the "Session pooler" URI + `?schema=nexdrop` for both |

In Coolify, enable **"Connect to Predefined Network"** on the app (or put both on the same network) so the
`supabase-db` hostname resolves. The database port doesn't need to be public.

## 2. The app

1. Push this repository to GitHub/GitLab, then Coolify → **+ New → Application → your repo**.
2. **Build pack: Dockerfile**, port **3000**.
3. **Storages** → add a volume mounted at **`/app/storage`**. Theme files and uploaded images live here
   (`STORAGE_DRIVER=local`), so they survive redeploys. Include it in your VPS backups.
4. **Environment variables:**

```
DATABASE_URL=postgresql://postgres:PASSWORD@supabase-db:5432/postgres?schema=nexdrop&connection_limit=10
DIRECT_URL=postgresql://postgres:PASSWORD@supabase-db:5432/postgres?schema=nexdrop
NEXTAUTH_URL=https://admin.example.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
ENCRYPTION_KEY=<openssl rand -base64 32>       # never change after payment secrets are saved
STORAGE_DRIVER=local
THEME_MAX_ZIP_MB=80
SEED_ADMIN_EMAIL=you@example.com
SEED_ADMIN_PASSWORD=<strong password>
RUN_SEED=true                                  # first deploy only, then set to false
SEED_DEMO=false                                # true = also create demo stores/orders + demo logins
DEMO_MODE=false                                # true = one-click demo logins on the sign-in page
STOREFRONT_ROOT_DOMAIN=shops.example.com       # optional, see step 3
MARKETPLACE_WEBHOOK_URL=                       # optional, NexDrop marketplace sync
MARKETPLACE_WEBHOOK_SECRET=
```

5. Domains: `https://admin.example.com`. Deploy.

On every start, the container runs `prisma migrate deploy` (applies new migrations, otherwise does
nothing) and then starts the server. After the first successful deploy, set `RUN_SEED=false`.

### Public demo server

For a demo instance, set `DEMO_MODE=true`, `SEED_DEMO=true` and `RUN_SEED=true`, and leave them on.
Every restart then re-applies the demo logins (password `Demo@12345`). Use a separate database or schema from production.

## 3. Storefront subdomains (optional)

1. DNS: `A  *.shops.example.com  → VPS IP` and `A admin.example.com → VPS IP`.
2. Add `https://*.shops.example.com` to the app's domains in Coolify. Wildcard TLS needs a DNS challenge;
   see Coolify's "wildcard certificate" docs. You can start without it: stores are also reachable at
   `https://admin.example.com/s/<store>/`.
3. Set `STOREFRONT_ROOT_DOMAIN=shops.example.com`. `demo.shops.example.com` then serves the demo store.

Keep storefronts on a **different domain** from the admin, so theme JavaScript can never read admin cookies.

## 4. Storage alternatives

The local volume is the simplest option, and it's fast because files are served by the app with
year-long cache headers. To keep files in Supabase Storage instead:

```
STORAGE_DRIVER=s3
S3_ENDPOINT=https://supabase.example.com/storage/v1/s3
S3_REGION=stub                                 # self-hosted default region name
S3_BUCKET=nexdrop                              # create it in Studio, mark as public
S3_ACCESS_KEY_ID=<from the storage service env>
S3_SECRET_ACCESS_KEY=<…>
S3_PUBLIC_URL=https://supabase.example.com/storage/v1/object/public/nexdrop
```

The bucket must allow browser `PUT` from the admin domain (CORS), because uploads go straight to storage.
MinIO (also a one-click Coolify service) works the same way.

## 5. Operations

| Task | How |
| --- | --- |
| Backups | Supabase service → Backups (or `pg_dump -n nexdrop`), plus the `/app/storage` volume |
| New migration | `npx prisma migrate dev --name x` locally, commit, redeploy. It applies on start. |
| Logs | Coolify → app → Logs |
| Resources | 2 vCPU / 4 GB RAM is comfortable for the admin + Supabase. Next.js uses ~200–400 MB. |
| Theme validation | `npm run theme:validate theme.zip` |
| Rate limiting | The built-in limiter is per process, which is enough for a single VPS container |
