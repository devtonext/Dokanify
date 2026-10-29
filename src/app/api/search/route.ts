import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, route, searchParams } from '@/lib/http'

/** Global header search across orders, products, customers, stores and themes. */
export const GET = route(async (req) => {
  await requireAdmin()
  const q = searchParams(req).get('q')?.trim() || ''
  if (q.length < 2) return ok({ results: [] })
  const num = Number(q.replace(/^#/, ''))
  const text = { contains: q, mode: 'insensitive' as const }
  const [orders, products, customers, stores, themes] = await Promise.all([
    Number.isInteger(num) && num > 0
      ? db.order.findMany({ where: { orderNumber: num }, take: 5, select: { id: true, orderNumber: true, shippingName: true, store: { select: { name: true } } } })
      : db.order.findMany({ where: { shippingName: text }, take: 5, select: { id: true, orderNumber: true, shippingName: true, store: { select: { name: true } } } }),
    db.product.findMany({ where: { OR: [{ name: text }, { sku: text }] }, take: 5, select: { id: true, name: true, sku: true } }),
    db.customer.findMany({ where: { OR: [{ name: text }, { email: text }] }, take: 5, select: { id: true, name: true, phone: true } }),
    db.store.findMany({ where: { OR: [{ name: text }, { slug: text }] }, take: 5, select: { id: true, name: true, slug: true } }),
    db.theme.findMany({ where: { name: text }, take: 5, select: { id: true, name: true, niche: true } }),
  ])
  return ok({
    results: [
      ...orders.map((o) => ({ type: 'Order', label: `#${o.orderNumber} · ${o.shippingName}`, hint: o.store.name, href: `/orders?open=${o.id}` })),
      ...products.map((p) => ({ type: 'Product', label: p.name, hint: p.sku, href: `/products?search=${encodeURIComponent(p.sku)}` })),
      ...customers.map((c) => ({ type: 'Customer', label: c.name, hint: c.phone, href: `/customers?open=${c.id}` })),
      ...stores.map((s) => ({ type: 'Store', label: s.name, hint: s.slug, href: `/stores?open=${s.id}` })),
      ...themes.map((t) => ({ type: 'Theme', label: t.name, hint: t.niche, href: `/theme/${t.id}` })),
    ],
  })
})
