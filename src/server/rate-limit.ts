import 'server-only'
import { HttpError } from '@/lib/http'

// Fixed-window limiter. Per-instance only: on serverless, put Upstash Redis /
// Vercel WAF rate limiting in front for a global limit.
const hits = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs })
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
    return
  }
  entry.count++
  if (entry.count > limit) throw new HttpError(429, 'Too many requests, please try again later')
}
