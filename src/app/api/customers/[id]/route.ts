import { z } from 'zod'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { normalizeBdPhone } from '@/lib/bd'
import { db } from '@/lib/db'
import { badRequest, notFound, ok, route } from '@/lib/http'

type Ctx = { params: Promise<{ id: string }> }

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin()
  const { id } = await params
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      store: { select: { name: true } },
      orders: { orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, orderNumber: true, total: true, status: true, paymentMethod: true, createdAt: true } },
    },
  })
  if (!customer) throw notFound('Customer')
  return ok({ customer })
})

const patch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().optional(),
  email: z.string().trim().toLowerCase().email().nullable().optional().or(z.literal('').transform(() => null)),
  address: z.string().trim().max(300).nullable().optional(),
  city: z.string().trim().max(60).nullable().optional(),
  district: z.string().trim().max(60).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  isBlocked: z.boolean().optional(),
})

export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const { id } = await params
  const { phone, ...input } = patch.parse(await req.json())
  let normalized: string | undefined
  if (phone !== undefined) {
    normalized = normalizeBdPhone(phone) ?? undefined
    if (!normalized) throw badRequest('Enter a valid Bangladeshi mobile number')
  }
  const customer = await db.customer.update({ where: { id }, data: { ...input, ...(normalized ? { phone: normalized } : {}) } })
  await audit(admin.id, 'customer.update', 'customer', id, input as any)
  return ok({ customer })
})

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin('SUPER_ADMIN')
  const { id } = await params
  const orders = await db.order.count({ where: { customerId: id } })
  if (orders) throw badRequest('Customers with orders cannot be deleted — block them instead')
  await db.customer.delete({ where: { id } })
  await audit(admin.id, 'customer.delete', 'customer', id)
  return ok({ ok: true })
})
