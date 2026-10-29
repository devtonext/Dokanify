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
run('prisma migrate deploy')
run('tsx prisma/seed.ts')
run('next build')
