import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { normalizeBdPhone } from '@/lib/bd'
import { db } from '@/lib/db'
import { badRequest, ok, pagination, route, searchParams } from '@/lib/http'

const SORTS: Record<string, Prisma.CustomerOrderByWithRelationInput> = {
  recent: { createdAt: 'desc' },
  orders: { orderCount: 'desc' },
  spent: { totalSpent: 'desc' },
  name: { name: 'asc' },
}

export const GET = route(async (req) => {
  await requireAdmin()
  const params = searchParams(req)
  const { take, skip, page, limit } = pagination(params)
  const storeId = params.get('store') || undefined
  const search = params.get('search')?.trim()
  const city = params.get('city')
  const type = params.get('type')
  const day = 86400_000
  const now = Date.now()

  const typeFilter: Prisma.CustomerWhereInput =
    type === 'new'
      ? { createdAt: { gte: new Date(now - 30 * day) } }
      : type === 'active'
        ? { lastOrderAt: { gte: new Date(now - 90 * day) } }
        : type === 'loyal'
          ? { orderCount: { gte: 5 } }
          : type === 'inactive'
            ? { OR: [{ lastOrderAt: null }, { lastOrderAt: { lt: new Date(now - 90 * day) } }] }
            : type === 'blocked'
              ? { isBlocked: true }
              : {}

  const digits = search?.replace(/\D/g, '')
  const where: Prisma.CustomerWhereInput = {
    storeId,
    ...(city && city !== 'all' ? { city: { equals: city, mode: 'insensitive' } } : {}),
    ...typeFilter,
    ...(search
      ? {
          AND: [
            {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                ...(digits && digits.length >= 4 ? [{ phone: { contains: digits.replace(/^0/, '') } }] : []),
              ],
            },
          ],
        }
      : {}),
  }
  const base = { storeId }
  const [customers, total, all, active, fresh, aov, cities] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: SORTS[params.get('sort') || 'recent'] || SORTS.recent,
      take,
      skip,
      include: { store: { select: { name: true } } },
    }),
    db.customer.count({ where }),
    db.customer.count({ where: base }),
    db.customer.count({ where: { ...base, lastOrderAt: { gte: new Date(now - 90 * day) } } }),
    db.customer.count({ where: { ...base, createdAt: { gte: new Date(now - 30 * day) } } }),
    db.order.aggregate({ where: { ...base, status: { notIn: ['CANCELLED', 'REFUNDED'] } }, _avg: { total: true } }),
    db.customer.groupBy({ by: ['city'], where: { ...base, city: { not: null } }, _count: true, orderBy: { _count: { city: 'desc' } }, take: 12 }),
  ])
  return ok({
    customers,
    total,
    page,
    limit,
    cities: cities.map((c) => c.city),
    stats: { total: all, active, new: fresh, avgOrderValue: aov._avg.total ?? 0 },
  })
})

const customerInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string(),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('').transform(() => undefined)),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  notes: z.string().max(2000).optional(),
})

export const POST = route(async (req) => {
  const admin = await requireAdmin('SUPPORT')
  const body = await req.json()
  const input = customerInput.parse(body)
  const phone = normalizeBdPhone(input.phone)
  if (!phone) throw badRequest('Enter a valid Bangladeshi mobile number')
  if (!body.storeId) throw badRequest('storeId is required')
  const customer = await db.customer.create({ data: { ...input, phone, storeId: body.storeId } })
  await audit(admin.id, 'customer.create', 'customer', customer.id)
  return ok({ customer }, { status: 201 })
})
