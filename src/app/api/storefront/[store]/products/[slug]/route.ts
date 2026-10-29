import { db } from '@/lib/db'
import { notFound, ok } from '@/lib/http'
import { cors, CORS, publicRoute, getActiveStore } from '@/server/storefront'

type Ctx = { params: Promise<{ store: string; slug: string }> }

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })

export const GET = publicRoute<Ctx>(async (_req, { params }) => {
  const { store: storeSlug, slug } = await params
  const store = await getActiveStore(storeSlug)
  const product = await db.product.findFirst({
    where: { storeId: store.id, status: 'ACTIVE', OR: [{ slug }, { id: slug }] },
    select: { id: true, name: true, slug: true, description: true, price: true, comparePrice: true, images: true, category: true, tags: true, quantity: true, sku: true },
  })
  if (!product) throw notFound('Product')
  const { quantity, ...rest } = product
  return cors(ok({ product: { ...rest, inStock: quantity > 0, stock: Math.min(quantity, 99) } }))
})
