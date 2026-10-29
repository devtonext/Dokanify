/**
 * Normalises database URLs so a deploy works with just DATABASE_URL (any Supabase/Postgres URI).
 * Shared by the app (src/lib/db.ts) and the build (scripts/vercel-build.ts) so both agree.
 *
 *  - DIRECT_URL missing → derived from DATABASE_URL (Supabase transaction pooler :6543 → session :5432)
 *  - Supabase transaction pooler without pgbouncer=true → added (avoids "prepared statement" errors)
 *  - On Vercel without a schema param → schema=nexdrop (keeps tables out of Supabase's public REST API)
 *  - On Vercel without connection_limit → connection_limit=1 (serverless)
 */
export function resolveDatabaseUrls(env: Record<string, string | undefined> = process.env) {
  const raw = env.DATABASE_URL?.trim()
  if (!raw) {
    throw new Error(
      'DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables (Supabase → Connect → ORMs → Prisma).'
    )
  }
  if (/\[YOUR-PASSWORD\]|YOUR[-_]PASSWORD|<PASSWORD>/i.test(raw)) {
    throw new Error('DATABASE_URL still contains the password placeholder — replace [YOUR-PASSWORD] (including the brackets) with your real database password.')
  }
  if (/\s/.test(raw)) {
    throw new Error('DATABASE_URL contains a space or line break — re-paste it without extra whitespace.')
  }
  const serverless = Boolean(env.VERCEL)

  const pooled = parse(raw, 'DATABASE_URL')
  const isSupabaseTxPooler = pooled.hostname.includes('pooler.supabase.com') && pooled.port === '6543'
  if (isSupabaseTxPooler && !pooled.searchParams.has('pgbouncer')) pooled.searchParams.set('pgbouncer', 'true')
  if (serverless && !pooled.searchParams.has('schema')) pooled.searchParams.set('schema', 'nexdrop')
  if (serverless && !pooled.searchParams.has('connection_limit')) pooled.searchParams.set('connection_limit', '1')

  let direct: URL
  if (env.DIRECT_URL?.trim()) {
    direct = parse(env.DIRECT_URL.trim(), 'DIRECT_URL')
    if (!direct.searchParams.has('schema') && pooled.searchParams.has('schema')) {
      direct.searchParams.set('schema', pooled.searchParams.get('schema')!)
    }
  } else {
    direct = new URL(pooled.toString())
    if (isSupabaseTxPooler) direct.port = '5432'
    direct.searchParams.delete('pgbouncer')
    direct.searchParams.delete('connection_limit')
  }

  return { databaseUrl: pooled.toString(), directUrl: direct.toString() }
}

function parse(value: string, name: string) {
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
  const { databaseUrl, directUrl } = resolveDatabaseUrls()
  process.env.DATABASE_URL = databaseUrl
  process.env.DIRECT_URL = directUrl
  return { databaseUrl, directUrl }
}
