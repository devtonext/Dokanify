import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound, ok, route } from '@/lib/http'
import { productInput } from '@/server/products'

type Ctx = { params: Promise<{ id: string }> }

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin()
  const { id } = await params
  const product = await db.product.findUnique({ where: { id }, include: { store: { select: { name: true } } } })
  if (!product) throw notFound('Product')
  return ok({ product })
})

export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const { id } = await params
  const body = await req.json()
  // Partial updates (e.g. stock only) are validated against the merged record.
  const current = await db.product.findUnique({ where: { id } })
  if (!current) throw notFound('Product')
  const merged = productInput.parse({
    ...current,
    price: current.price.toNumber(),
    comparePrice: current.comparePrice?.toNumber() ?? null,
    ...body,
  })
  const product = await db.product.update({ where: { id }, data: { ...merged, slug: merged.slug || current.slug } })
  await audit(admin.id, 'product.update', 'product', id, body)
  return ok({ product })
})

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const { id } = await params
  // Order history keeps its own copy of name/sku/price, so deleting is safe.
  await db.product.delete({ where: { id } })
  await audit(admin.id, 'product.delete', 'product', id)
  return ok({ ok: true })
})
