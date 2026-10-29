import { ok } from '@/lib/http'
import { createOrder, createOrderSchema } from '@/server/orders'
import { rateLimit } from '@/server/rate-limit'
import { cors, CORS, publicRoute, getActiveStore, storefrontBootstrap } from '@/server/storefront'

type Ctx = { params: Promise<{ store: string }> }

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })

/** Checkout from a theme. Prices, shipping and stock are always computed server-side. */
export const POST = publicRoute<Ctx>(async (req, { params }) => {
  const slug = (await params).store
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  rateLimit(`order:${slug}:${ip}`, 10, 10 * 60_000)

  const store = await getActiveStore(slug)
  const { allowedMethods } = await storefrontBootstrap(slug, { mode: 'live' })
  const input = createOrderSchema.parse(await req.json())
  const order = await createOrder(store.id, { ...input, discount: undefined }, { source: 'storefront', allowedMethods })
  return cors(
    ok(
      {
        order: {
          number: order.orderNumber,
          total: order.total,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          status: order.status,
        },
        // Online gateways (bKash/Nagad/SSLCommerz) plug in here: return a redirect URL to the gateway.
        payment: order.paymentMethod === 'COD' ? null : { status: 'PENDING', redirectUrl: null },
      },
      { status: 201 }
    )
  )
})
