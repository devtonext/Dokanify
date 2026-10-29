import { normalizeBdPhone } from '@/lib/bd'
import { db } from '@/lib/db'
import { notFound, ok, searchParams } from '@/lib/http'
import { rateLimit } from '@/server/rate-limit'
import { cors, CORS, publicRoute, getActiveStore } from '@/server/storefront'

type Ctx = { params: Promise<{ store: string; number: string }> }

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })

/** Order tracking: requires the phone number used at checkout. */
export const GET = publicRoute<Ctx>(async (req, { params }) => {
  const { store: slug, number } = await params
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  rateLimit(`track:${ip}`, 30, 10 * 60_000)
  const store = await getActiveStore(slug)
  const phone = normalizeBdPhone(searchParams(req).get('phone') || '')
  const orderNumber = Number(number.replace(/^#/, ''))
  if (!phone || !Number.isInteger(orderNumber)) throw notFound('Order')
  const order = await db.order.findFirst({
    where: { storeId: store.id, orderNumber, shippingPhone: phone },
    select: {
      orderNumber: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      total: true,
      courier: true,
      trackingCode: true,
      createdAt: true,
      items: { select: { name: true, quantity: true, price: true } },
    },
  })
  if (!order) throw notFound('Order')
  return cors(ok({ order }))
})
