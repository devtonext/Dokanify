import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, route, searchParams } from '@/lib/http'

export const GET = route(async (req) => {
  await requireAdmin()
  const storeId = searchParams(req).get('store') || undefined
  const rows = await db.product.groupBy({
    by: ['category'],
    where: { storeId, category: { not: null } },
    _count: true,
    orderBy: { category: 'asc' },
  })
  return ok({ categories: rows.map((r) => ({ name: r.category, count: r._count })) })
})
