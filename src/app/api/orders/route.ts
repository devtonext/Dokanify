import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { badRequest, ok, pagination, route, searchParams } from '@/lib/http'
import { createOrder, createOrderSchema } from '@/server/orders'

const day = 86400_000

function since(range: string | null) {
  const now = new Date()
  switch (range) {
    case 'today':
      now.setHours(0, 0, 0, 0)
      return now
    case 'week':
      return new Date(Date.now() - 7 * day)
    case 'month':
      return new Date(Date.now() - 30 * day)
    case 'year':
      return new Date(Date.now() - 365 * day)
    default:
      return undefined
  }
}

export const GET = route(async (req) => {
  await requireAdmin()
  const params = searchParams(req)
  const { take, skip, page, limit } = pagination(params)
  const storeId = params.get('store') || undefined
  const status = params.get('status')
  const method = params.get('payment')
  const search = params.get('search')?.trim().replace(/^#/, '')
  const from = since(params.get('range'))
  const customerId = params.get('customer') || undefined

  const where: Prisma.OrderWhereInput = {
    storeId,
    customerId,
    ...(status && status !== 'all' ? { status: status as any } : {}),
    ...(method && method !== 'all' ? { paymentMethod: method as any } : {}),
    ...(from ? { createdAt: { gte: from } } : {}),
    ...(search
      ? {
          OR: [
            ...(/^\d+$/.test(search) ? [{ orderNumber: Number(search) }, { shippingPhone: { contains: search.replace(/^0/, '') } }] : []),
            { shippingName: { contains: search, mode: 'insensitive' } },
            { trackingCode: { contains: search } },
          ],
        }
      : {}),
  }
  const [orders, total, counts] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        customer: { select: { name: true, email: true } },
        store: { select: { name: true, slug: true } },
        _count: { select: { items: true } },
      },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ['status'], where: { storeId }, _count: true }),
  ])
  return ok({
    orders,
    total,
    page,
    limit,
    statusCounts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
  })
})

export const POST = route(async (req) => {
  const admin = await requireAdmin('SUPPORT')
  const body = await req.json()
  if (!body.storeId) throw badRequest('storeId is required')
  const input = createOrderSchema.parse(body)
  const order = await createOrder(body.storeId, input, { source: 'admin', actorId: admin.id })
  return ok({ order }, { status: 201 })
})
