import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, route } from '@/lib/http'

export const GET = route(async () => {
  await requireAdmin()
  const plans = await db.plan.findMany({ orderBy: { rank: 'asc' }, include: { _count: { select: { stores: true } } } })
  return ok({ plans })
})
