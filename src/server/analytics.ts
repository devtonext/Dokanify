import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export type Range = 'today' | 'week' | 'month' | 'quarter' | 'year'

function rangeStart(range: Range, from = new Date()) {
  const d = new Date(from)
  switch (range) {
    case 'today':
      d.setHours(0, 0, 0, 0)
      return d
    case 'week':
      d.setDate(d.getDate() - 7)
      return d
    case 'month':
      d.setMonth(d.getMonth() - 1)
      return d
    case 'quarter':
      d.setMonth(d.getMonth() - 3)
      return d
    case 'year':
      d.setFullYear(d.getFullYear() - 1)
      return d
  }
}

const REVENUE_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const

function pctChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0
  return ((current - previous) / previous) * 100
}

export async function getAnalytics(storeId: string | undefined, range: Range = 'month') {
  const now = new Date()
  const start = rangeStart(range, now)
  const prevStart = new Date(start.getTime() - (now.getTime() - start.getTime()))
  const store = storeId ? { storeId } : {}
  const revenueWhere = (from: Date, to: Date): Prisma.OrderWhereInput => ({
    ...store,
    status: { in: [...REVENUE_STATUSES] },
    createdAt: { gte: from, lt: to },
  })

  const storeFilter = storeId ? Prisma.sql`AND o."storeId" = ${storeId}` : Prisma.empty

  const [cur, prev, customers, prevCustomers, newCustomers, stock, byPayment, byCity, monthly, byCategory, recent, top] =
    await Promise.all([
      db.order.aggregate({ where: revenueWhere(start, now), _sum: { total: true }, _count: true }),
      db.order.aggregate({ where: revenueWhere(prevStart, start), _sum: { total: true }, _count: true }),
      db.customer.count({ where: store }),
      db.customer.count({ where: { ...store, createdAt: { lt: start } } }),
      db.customer.count({ where: { ...store, createdAt: { gte: start } } }),
      db.product.aggregate({ where: { ...store, status: 'ACTIVE' }, _sum: { quantity: true }, _count: true }),
      db.order.groupBy({ by: ['paymentMethod'], where: revenueWhere(start, now), _sum: { total: true }, _count: true }),
      db.order.groupBy({
        by: ['city'],
        where: revenueWhere(start, now),
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 6,
      }),
      db.$queryRaw<{ month: Date; revenue: Prisma.Decimal; orders: bigint; customers: bigint }[]>`
        SELECT date_trunc('month', m) AS month,
               COALESCE(SUM(o.total) FILTER (WHERE o.id IS NOT NULL), 0) AS revenue,
               COUNT(o.id) AS orders,
               COUNT(DISTINCT o."customerId") AS customers
        FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m
        LEFT JOIN "Order" o ON date_trunc('month', o."createdAt") = m
          AND o.status IN ('PENDING','PROCESSING','SHIPPED','DELIVERED') ${storeFilter}
        GROUP BY m ORDER BY m`,
      db.$queryRaw<{ name: string; sales: Prisma.Decimal; orders: bigint }[]>`
        SELECT COALESCE(p.category, 'Uncategorised') AS name,
               SUM(i.price * i.quantity) AS sales,
               COUNT(DISTINCT o.id) AS orders
        FROM "OrderItem" i
        JOIN "Order" o ON o.id = i."orderId"
        LEFT JOIN "Product" p ON p.id = i."productId"
        WHERE o.status IN ('PENDING','PROCESSING','SHIPPED','DELIVERED') AND o."createdAt" >= ${start} ${storeFilter}
        GROUP BY 1 ORDER BY 2 DESC LIMIT 8`,
      db.order.findMany({
        where: store,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, shippingName: true, store: { select: { name: true } } },
      }),
      db.$queryRaw<{ name: string; sold: bigint; revenue: Prisma.Decimal }[]>`
        SELECT i.name, SUM(i.quantity) AS sold, SUM(i.price * i.quantity) AS revenue
        FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
        WHERE o.status IN ('PENDING','PROCESSING','SHIPPED','DELIVERED') AND o."createdAt" >= ${start} ${storeFilter}
        GROUP BY i.name ORDER BY revenue DESC LIMIT 5`,
    ])

  const revenue = cur._sum.total?.toNumber() ?? 0
  const prevRevenue = prev._sum.total?.toNumber() ?? 0
  const aov = cur._count ? revenue / cur._count : 0
  const prevAov = prev._count ? prevRevenue / prev._count : 0
  const paymentTotal = byPayment.reduce((s, p) => s + (p._sum.total?.toNumber() ?? 0), 0)

  return {
    range,
    metrics: {
      revenue: { value: revenue, change: pctChange(revenue, prevRevenue) },
      orders: { value: cur._count, change: pctChange(cur._count, prev._count) },
      customers: { value: customers, change: pctChange(customers, prevCustomers), new: newCustomers },
      aov: { value: aov, change: pctChange(aov, prevAov) },
      stock: { units: stock._sum.quantity ?? 0, products: stock._count },
    },
    monthly: monthly.map((m) => ({
      month: m.month.toLocaleString('en-US', { month: 'short' }),
      revenue: Number(m.revenue),
      orders: Number(m.orders),
      customers: Number(m.customers),
    })),
    payments: byPayment
      .map((p) => {
        const amount = p._sum.total?.toNumber() ?? 0
        return { method: p.paymentMethod, amount, orders: p._count, percentage: paymentTotal ? Math.round((amount / paymentTotal) * 100) : 0 }
      })
      .sort((a, b) => b.amount - a.amount),
    cities: byCity.map((c) => ({ name: c.city, value: c._sum.total?.toNumber() ?? 0 })),
    categories: byCategory.map((c) => ({ name: c.name, sales: Number(c.sales), orders: Number(c.orders) })),
    recentOrders: recent,
    topProducts: top.map((t) => ({ name: t.name, sold: Number(t.sold), revenue: Number(t.revenue) })),
  }
}
