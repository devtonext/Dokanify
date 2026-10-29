import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { ok, pagination, searchParams } from '@/lib/http'
import { cors, CORS, publicRoute, getActiveStore } from '@/server/storefront'

type Ctx = { params: Promise<{ store: string }> }

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })

const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  name: { name: 'asc' },
}

const publicProduct = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  comparePrice: true,
  images: true,
  category: true,
  tags: true,
  quantity: true,
} satisfies Prisma.ProductSelect

export const GET = publicRoute<Ctx>(async (req, { params }) => {
  const store = await getActiveStore((await params).store)
  const q = searchParams(req)
  const { take, skip, page, limit } = pagination(q, 48)
  const search = q.get('search')?.trim()
  const ids = q.get('ids')?.split(',').filter(Boolean).slice(0, 48)
  const where: Prisma.ProductWhereInput = {
    storeId: store.id,
    status: 'ACTIVE',
    ...(ids?.length ? { id: { in: ids } } : {}),
    ...(q.get('category') ? { category: q.get('category') } : {}),
    ...(q.get('tag') ? { tags: { has: q.get('tag')!.toLowerCase() } } : {}),
    ...(q.get('onSale') === '1' ? { comparePrice: { not: null } } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { tags: { has: search.toLowerCase() } }] } : {}),
  }
  const [products, total] = await Promise.all([
    db.product.findMany({ where, select: publicProduct, orderBy: SORTS[q.get('sort') || 'newest'] || SORTS.newest, take, skip }),
    db.product.count({ where }),
  ])
  return cors(ok({ products: products.map(({ quantity, ...p }) => ({ ...p, inStock: quantity > 0 })), total, page, limit }, { headers: { 'Cache-Control': 'public, s-maxage=30' } }))
})
