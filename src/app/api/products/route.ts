import { Prisma } from '@prisma/client'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { badRequest, ok, pagination, route, searchParams } from '@/lib/http'
import { productInput, slugify } from '@/server/products'

const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  recent: { createdAt: 'desc' },
  'name-asc': { name: 'asc' },
  'name-desc': { name: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  'stock-asc': { quantity: 'asc' },
  'stock-desc': { quantity: 'desc' },
}

export const GET = route(async (req) => {
  await requireAdmin()
  const params = searchParams(req)
  const { take, skip, page, limit } = pagination(params)
  const storeId = params.get('store') || undefined
  const search = params.get('search')?.trim()
  const category = params.get('category')
  const stock = params.get('stock')
  const status = params.get('status')
  const lowThreshold = 10

  const where: Prisma.ProductWhereInput = {
    storeId,
    ...(category && category !== 'all' ? { category } : {}),
    ...(status && status !== 'all' ? { status: status as any } : {}),
    ...(stock === 'out' ? { quantity: 0 } : stock === 'low' ? { quantity: { gt: 0, lte: lowThreshold } } : stock === 'in' ? { quantity: { gt: lowThreshold } } : {}),
    ...(search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }, { tags: { has: search.toLowerCase() } }] }
      : {}),
  }
  const base: Prisma.ProductWhereInput = { storeId }

  const [products, total, all, out, low] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: SORTS[params.get('sort') || 'recent'] || SORTS.recent,
      take,
      skip,
      include: { store: { select: { name: true, slug: true } } },
    }),
    db.product.count({ where }),
    db.product.count({ where: base }),
    db.product.count({ where: { ...base, quantity: 0 } }),
    db.product.count({ where: { ...base, quantity: { gt: 0, lte: lowThreshold } } }),
  ])
  return ok({
    products,
    total,
    page,
    limit,
    stats: { total: all, outOfStock: out, lowStock: low, inStock: all - out - low },
  })
})

export const POST = route(async (req) => {
  const admin = await requireAdmin('SUPPORT')
  const body = await req.json()
  const input = productInput.parse(body)
  if (!body.storeId) throw badRequest('storeId is required')
  const store = await db.store.findUnique({ where: { id: body.storeId }, include: { plan: true, _count: { select: { products: true } } } })
  if (!store) throw badRequest('Unknown store')
  if (store.plan.maxProducts && store._count.products >= store.plan.maxProducts) {
    throw badRequest(`The ${store.plan.name} plan allows ${store.plan.maxProducts} products`)
  }
  const product = await db.product.create({
    data: { ...input, storeId: store.id, slug: input.slug || slugify(input.name) + '-' + Date.now().toString(36).slice(-4) },
  })
  await audit(admin.id, 'product.create', 'product', product.id)
  return ok({ product }, { status: 201 })
})
