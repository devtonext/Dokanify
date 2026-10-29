/**
 * Vercel build: prisma generate → migrate deploy → seed (idempotent) → next build.
 * Works with only DATABASE_URL set; see src/lib/db-url.ts for what gets derived.
 */
import { execSync } from 'child_process'
import { applyDatabaseUrls } from '../src/lib/db-url'

function run(cmd: string) {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', env: process.env })
}

const { databaseUrl, directUrl } = applyDatabaseUrls()
const mask = (u: string) => u.replace(/\/\/([^:]+):[^@]*@/, '//$1:****@')
console.log(`DATABASE_URL → ${mask(databaseUrl)}`)
console.log(`DIRECT_URL   → ${mask(directUrl)}`)

run('prisma generate')
try {
  run('prisma migrate deploy')
} catch (error) {
  console.error(`
✖ Could not run database migrations. If the error above is P1000 (authentication failed):
  • The password in DATABASE_URL is wrong, still the [YOUR-PASSWORD] placeholder, or has unencoded
    special characters (@ # / ? % & : space). Easiest fix: Supabase → Project Settings → Database →
    Reset database password using only letters and digits, then update DATABASE_URL in Vercel and redeploy.
  • The user must look like postgres.<project-ref> and the host like aws-…pooler.supabase.com — copy both
    exactly from Supabase → Connect → ORMs → Prisma (Transaction pooler).
  If it is "Tenant or user not found": the region/host (aws-0 vs aws-1, eu-west-1 …) doesn't match your project.
`)
  process.exit(1)
}
run('tsx prisma/seed.ts')
run('next build')
