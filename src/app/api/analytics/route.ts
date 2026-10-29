import { requireAdmin } from '@/lib/auth'
import { ok, route, searchParams } from '@/lib/http'
import { getAnalytics, type Range } from '@/server/analytics'

const RANGES = new Set(['today', 'week', 'month', 'quarter', 'year'])

export const GET = route(async (req) => {
  await requireAdmin()
  const params = searchParams(req)
  const range = (RANGES.has(params.get('range') || '') ? params.get('range') : 'month') as Range
  return ok(await getAnalytics(params.get('store') || undefined, range))
})
