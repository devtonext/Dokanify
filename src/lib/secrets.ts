import { createHash } from 'crypto'

/**
 * Secrets with a safe fallback for quick test deployments: when NEXTAUTH_SECRET / ENCRYPTION_KEY
 * are not set, they are derived from DATABASE_URL (itself a secret only the server knows).
 * Set real values before going to production — rotating DATABASE_URL would otherwise sign
 * everyone out and make encrypted payment secrets unreadable.
 */
function derive(label: string) {
  // Query params are ignored: src/lib/db-url.ts may add some (schema, pgbouncer) at runtime.
  const seed = process.env.DATABASE_URL?.split('?')[0]
  if (!seed) throw new Error(`${label} is not configured`)
  return createHash('sha256').update(`nexdrop:${label}:${seed}`).digest()
}

export function authSecret(): string | undefined {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET
  // undefined only while building without a database (next build page-data collection)
  return process.env.DATABASE_URL ? derive('NEXTAUTH_SECRET').toString('base64') : undefined
}

export function encryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) return derive('ENCRYPTION_KEY')
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes, base64 encoded')
  return buf
}

/** Demo logins are ON unless DEMO_MODE=false (test phase default). */
export function isDemoMode() {
  return process.env.DEMO_MODE !== 'false'
}
