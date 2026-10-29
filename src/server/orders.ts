import 'server-only'
import { Prisma, type OrderStatus, type PaymentMethod } from '@prisma/client'
import { z } from 'zod'
import { audit, notify } from '@/lib/audit'
import { normalizeBdPhone, PAYMENT_LABELS } from '@/lib/bd'
import { db } from '@/lib/db'
import { badRequest, HttpError, notFound } from '@/lib/http'
import { parseStoreSettings, resolveZone } from '@/lib/store-settings'

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().transform((v, ctx) => {
      const n = normalizeBdPhone(v)
      if (!n) ctx.addIssue({ code: 'custom', message: 'Enter a valid Bangladeshi mobile number' })
      return n || ''
    }),
    email: z.string().trim().email().max(120).optional().or(z.literal('').transform(() => undefined)),
    address: z.string().trim().min(5).max(300),
    city: z.string().trim().min(2).max(60),
    district: z.string().trim().max(60).optional(),
  }),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(100) }))
    .min(1)
    .max(50),
  paymentMethod: z.enum(['BKASH', 'NAGAD', 'ROCKET', 'SSLCOMMERZ', 'COD']),
  notes: z.string().max(500).optional(),
  discount: z.number().min(0).optional(),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export async function recalcCustomer(tx: Prisma.TransactionClient, customerId: string) {
  const agg = await tx.order.aggregate({
    where: { customerId, status: { in: ACTIVE_STATUSES } },
    _sum: { total: true },
    _count: true,
    _max: { createdAt: true },
  })
  await tx.customer.update({
    where: { id: customerId },
    data: {
      totalSpent: agg._sum.total ?? 0,
      orderCount: agg._count,
      lastOrderAt: agg._max.createdAt,
    },
  })
}

/**
 * Creates an order atomically: reserves stock, computes shipping by district,
 * applies COD rules and upserts the customer by phone.
 * `source: 'storefront'` also enforces the store's enabled payment methods.
 */
export async function createOrder(
  storeId: string,
  input: CreateOrderInput,
  opts: { source: 'admin' | 'storefront'; actorId?: string; allowedMethods?: string[] }
) {
  const store = await db.store.findUnique({ where: { id: storeId } })
  if (!store) throw notFound('Store')
  if (store.status !== 'ACTIVE') throw badRequest('Store is not accepting orders')
  const settings = parseStoreSettings(store.settings)

  const method = input.paymentMethod
  const gatewayKey = method.toLowerCase() as keyof typeof settings.payments
  if (opts.source === 'storefront') {
    if (!settings.payments[gatewayKey]?.enabled) throw badRequest(`${PAYMENT_LABELS[method]} is not available`)
    if (opts.allowedMethods && !opts.allowedMethods.includes(method)) throw badRequest(`${PAYMENT_LABELS[method]} is not supported by this theme`)
  }

  // Merge duplicate lines
  const wanted = new Map<string, number>()
  for (const item of input.items) wanted.set(item.productId, (wanted.get(item.productId) || 0) + item.quantity)

  const order = await db.$transaction(
    async (tx) => {
      const products = await tx.product.findMany({
        where: { storeId, id: { in: [...wanted.keys()] }, status: 'ACTIVE' },
      })
      if (products.length !== wanted.size) throw badRequest('One or more products are unavailable')

      for (const product of products) {
        const qty = wanted.get(product.id)!
        // Conditional decrement = no overselling under concurrency.
        const res = await tx.product.updateMany({
          where: { id: product.id, quantity: { gte: qty } },
          data: { quantity: { decrement: qty } },
        })
        if (res.count === 0) throw new HttpError(409, `Only ${product.quantity} left of "${product.name}"`)
      }

      const subtotal = products.reduce((sum, p) => sum.plus(p.price.times(wanted.get(p.id)!)), new Prisma.Decimal(0))
      const zone = resolveZone(settings, input.customer.district || input.customer.city)
      let shippingFee = new Prisma.Decimal(zone?.rate ?? 0)
      if (settings.shipping.freeShippingOver != null && subtotal.gte(settings.shipping.freeShippingOver)) {
        shippingFee = new Prisma.Decimal(0)
      }
      if (method === 'COD') {
        if (!settings.payments.cod.enabled && opts.source === 'storefront') throw badRequest('Cash on Delivery is not available')
        if (settings.payments.cod.maxAmount && subtotal.gt(settings.payments.cod.maxAmount)) {
          throw badRequest(`Cash on Delivery is limited to ৳${settings.payments.cod.maxAmount}`)
        }
        shippingFee = shippingFee.plus(settings.payments.cod.fee || 0)
      }
      const discount = new Prisma.Decimal(opts.source === 'admin' ? input.discount || 0 : 0)
      const total = Prisma.Decimal.max(subtotal.plus(shippingFee).minus(discount), 0)

      const customer = await tx.customer.upsert({
        where: { storeId_phone: { storeId, phone: input.customer.phone } },
        create: {
          storeId,
          name: input.customer.name,
          phone: input.customer.phone,
          email: input.customer.email,
          address: input.customer.address,
          city: input.customer.city,
          district: input.customer.district,
        },
        update: {
          name: input.customer.name,
          address: input.customer.address,
          city: input.customer.city,
          district: input.customer.district,
          ...(input.customer.email ? { email: input.customer.email } : {}),
        },
      })
      if (customer.isBlocked && opts.source === 'storefront') throw new HttpError(403, 'Unable to place order')

      const { orderSeq } = await tx.store.update({
        where: { id: storeId },
        data: { orderSeq: { increment: 1 } },
        select: { orderSeq: true },
      })

      const created = await tx.order.create({
        data: {
          storeId,
          orderNumber: orderSeq,
          customerId: customer.id,
          paymentMethod: method as PaymentMethod,
          subtotal,
          shippingFee,
          discount,
          total,
          shippingName: input.customer.name,
          shippingPhone: input.customer.phone,
          shippingAddress: input.customer.address,
          city: input.customer.city,
          district: input.customer.district,
          shippingZone: zone?.name,
          notes: input.notes,
          source: opts.source,
          items: {
            create: products.map((p) => ({
              productId: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              quantity: wanted.get(p.id)!,
            })),
          },
        },
        include: { items: true, customer: true },
      })
      await recalcCustomer(tx, customer.id)
      return created
    },
    { isolationLevel: 'ReadCommitted', timeout: 15000 }
  )

  if (settings.notifications.newOrder) {
    await notify('New order', `#${order.orderNumber} from ${order.shippingName} — ৳${order.total.toNumber().toLocaleString('en-IN')}`, `/orders?open=${order.id}`)
  }
  if (settings.notifications.lowStock) {
    const low = await db.product.findMany({
      where: { id: { in: [...wanted.keys()] }, quantity: { lte: settings.notifications.lowStockThreshold } },
      select: { name: true, quantity: true },
    })
    for (const p of low) await notify('Low stock', `${p.name} has ${p.quantity} left`, '/products?stock=low')
  }
  if (opts.actorId) await audit(opts.actorId, 'order.create', 'order', order.id)
  return order
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'PENDING'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: ['PENDING'],
  REFUNDED: [],
}

export const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  courier: z.string().max(40).nullable().optional(),
  trackingCode: z.string().max(80).nullable().optional(),
  transactionId: z.string().max(80).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export async function updateOrder(id: string, input: z.infer<typeof updateOrderSchema>, actorId: string) {
  const order = await db.order.findUnique({ where: { id }, include: { items: true } })
  if (!order) throw notFound('Order')
  const next = input.status
  if (next && next !== order.status && !TRANSITIONS[order.status].includes(next)) {
    throw badRequest(`Cannot change an order from ${order.status} to ${next}`)
  }

  const updated = await db.$transaction(async (tx) => {
    const releasing = next && ['CANCELLED', 'REFUNDED'].includes(next) && !['CANCELLED', 'REFUNDED'].includes(order.status)
    const reserving = next === 'PENDING' && order.status === 'CANCELLED'
    for (const item of order.items) {
      if (!item.productId) continue
      if (releasing) {
        await tx.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } })
      } else if (reserving) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        })
        if (!res.count) throw new HttpError(409, `Not enough stock to re-open (${item.name})`)
      }
    }
    let paymentStatus = input.paymentStatus
    if (next === 'DELIVERED' && order.paymentMethod === 'COD' && !paymentStatus) paymentStatus = 'PAID'
    if (next === 'REFUNDED' && !paymentStatus && order.paymentStatus === 'PAID') paymentStatus = 'REFUNDED'
    const result = await tx.order.update({
      where: { id },
      data: { ...input, paymentStatus },
      include: { items: true, customer: true },
    })
    await recalcCustomer(tx, order.customerId)
    return result
  })
  await audit(actorId, 'order.update', 'order', id, input as Prisma.InputJsonValue)
  return updated
}
