/**
 * Normalises database URLs so a deploy works with zero manual setup.
 *
 * Source, in order:
 *  1. Supabase ↔ Vercel integration variables (POSTGRES_PRISMA_URL + POSTGRES_URL_NON_POOLING).
 *     These are managed by Supabase, so their credentials are always correct, and they win over a manual DATABASE_URL.
 *  2. DATABASE_URL (+ optional DIRECT_URL): any Supabase/Postgres URI set by hand.
 * Shared by the app (src/lib/db.ts) and the build (scripts/vercel-build.ts) so both agree.
 *
 *  - DIRECT_URL missing → derived from DATABASE_URL (Supabase transaction pooler :6543 → session :5432)
 *  - Supabase transaction pooler without pgbouncer=true → added (avoids "prepared statement" errors)
 *  - On Vercel without a schema param → schema=nexdrop (keeps tables out of Supabase's public REST API)
 *  - On Vercel without connection_limit → connection_limit=1 (serverless)
 */
export type DbUrlSource = 'supabase-integration' | 'DATABASE_URL' | 'POSTGRES_URL'

export function hasDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  return Boolean(env.POSTGRES_PRISMA_URL || env.DATABASE_URL || env.POSTGRES_URL)
}

export function resolveDatabaseUrls(env: Record<string, string | undefined> = process.env) {
  const integration = env.POSTGRES_PRISMA_URL?.trim()
  const source: DbUrlSource = integration ? 'supabase-integration' : env.DATABASE_URL?.trim() ? 'DATABASE_URL' : 'POSTGRES_URL'
  const raw = integration || env.DATABASE_URL?.trim() || env.POSTGRES_URL?.trim()
  const explicitDirect = integration ? env.POSTGRES_URL_NON_POOLING?.trim() : env.DIRECT_URL?.trim()
  if (!raw) {
    throw new Error(
      'No database configured. In Vercel → Project → Storage/Integrations connect Supabase (adds POSTGRES_PRISMA_URL automatically), or set DATABASE_URL.'
    )
  }
  if (/\s/.test(raw)) {
    throw new Error(`${source} contains a space or line break — re-paste it without extra whitespace.`)
  }
  const serverless = Boolean(env.VERCEL)

  const pooled = parse(raw, source)
  // Supabase integration URLs carry params Prisma doesn't understand
  pooled.searchParams.delete('supa')
  const isSupabaseTxPooler = pooled.hostname.includes('pooler.supabase.com') && pooled.port === '6543'
  if (isSupabaseTxPooler && !pooled.searchParams.has('pgbouncer')) pooled.searchParams.set('pgbouncer', 'true')
  if (serverless && !pooled.searchParams.has('schema')) pooled.searchParams.set('schema', 'nexdrop')
  if (serverless && !pooled.searchParams.has('connection_limit')) pooled.searchParams.set('connection_limit', '1')

  let direct: URL
  if (explicitDirect) {
    direct = parse(explicitDirect, integration ? 'POSTGRES_URL_NON_POOLING' : 'DIRECT_URL')
    direct.searchParams.delete('supa')
    if (!direct.searchParams.has('schema') && pooled.searchParams.has('schema')) {
      direct.searchParams.set('schema', pooled.searchParams.get('schema')!)
    }
  } else {
    direct = new URL(pooled.toString())
    if (isSupabaseTxPooler) direct.port = '5432'
    direct.searchParams.delete('pgbouncer')
    direct.searchParams.delete('connection_limit')
  }

  return { databaseUrl: pooled.toString(), directUrl: direct.toString(), source }
}

function parse(value: string, name: string) {
  if (/\[YOUR-PASSWORD\]|YOUR[-_]PASSWORD|<PASSWORD>/i.test(value)) {
    throw new Error(`${name} still contains the password placeholder — replace [YOUR-PASSWORD] (including the brackets) with your real database password.`)
  }
  try {
    const url = new URL(value)
    if (!/^postgres(ql)?:$/.test(url.protocol)) throw new Error()
    return url
  } catch {
    throw new Error(`${name} is not a valid postgresql:// URL (if the password has special characters like @ # / ?, URL-encode them)`)
  }
}

/** Writes the resolved URLs back into process.env (Prisma reads DATABASE_URL / DIRECT_URL from there). */
export function applyDatabaseUrls() {
  const resolved = resolveDatabaseUrls()
  process.env.DATABASE_URL = resolved.databaseUrl
  process.env.DIRECT_URL = resolved.directUrl
  return resolved
}
