/**
 * Vercel build: prisma generate → migrate deploy (if DB available) → seed → next build.
 * Works seamlessly with Supabase integration or standard DATABASE_URL.
 */
import { execSync } from 'child_process'
import { applyDatabaseUrls, hasDatabaseUrl } from '../src/lib/db-url'

function run(cmd: string) {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', env: process.env })
}

console.log('\n🚀 Running Vercel build script for NexDrop...')
run('prisma generate')

if (hasDatabaseUrl()) {
  try {
    const { databaseUrl, directUrl, source } = applyDatabaseUrls()
    console.log(`Database source: ${source === 'supabase-integration' ? 'Supabase integration' : source}`)
    const mask = (u: string) => u.replace(/\/\/([^:]+):[^@]*@/, '//$1:****@')
    console.log(`DATABASE_URL → ${mask(databaseUrl)}`)
    console.log(`DIRECT_URL   → ${mask(directUrl)}`)
    run('prisma migrate deploy')
    run('tsx prisma/seed.ts')
  } catch (error: any) {
    console.warn(`\n⚠️ Database migrations skipped: ${error.message || error}`)
    console.warn('Ensure your Supabase or PostgreSQL credentials are set in Vercel Settings → Environment Variables.')
  }
} else {
  console.log('\nℹ️ No DATABASE_URL or Supabase integration detected at build time. Proceeding with next build.')
}

run('next build')
