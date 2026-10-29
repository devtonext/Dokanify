import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, pagination, route, searchParams } from '@/lib/http'

export const GET = route(async (req) => {
  await requireAdmin('SUPER_ADMIN')
  const params = searchParams(req)
  const { take, skip } = pagination(params)
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    skip,
    include: { actor: { select: { name: true, email: true } } },
  })
  return ok({ logs })
})
