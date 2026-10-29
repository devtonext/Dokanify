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
  const store = await db.store.findUnique({
    where: { id },
    include: {
      plan: true,
      _count: { select: { products: true, orders: true, customers: true } },
      themeInstalls: { include: { theme: { select: { id: true, name: true, slug: true } }, version: { select: { version: true } } } },
    },
  })
  if (!store) throw notFound('Store')
  const { settings, ...rest } = store
  return ok({ store: rest })
})

const patch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  ownerName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  city: z.string().trim().max(60).nullable().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
  planKey: z.string().optional(),
  timezone: z.string().optional(),
  language: z.enum(['en', 'bn']).optional(),
})

export const PATCH = route<Ctx>(async (req, { params }) => {
  const { id } = await params
  const input = patch.parse(await req.json())
  // Plan and status changes are billing decisions.
  const admin = input.planKey || input.status ? await requireAdmin() : await requireAdmin('SUPPORT')
  if ((input.planKey || input.status) && admin.role !== 'SUPER_ADMIN') throw badRequest('Only super admins can change plan or status')
  const { planKey, phone, ...data } = input
  let planId: string | undefined
  if (planKey) {
    const plan = await db.plan.findUnique({ where: { key: planKey } })
    if (!plan) throw badRequest('Unknown plan')
    planId = plan.id
  }
  let normalizedPhone: string | undefined
  if (phone !== undefined) {
    normalizedPhone = normalizeBdPhone(phone) ?? undefined
    if (!normalizedPhone) throw badRequest('Enter a valid Bangladeshi mobile number')
  }
  const store = await db.store.update({
    where: { id },
    data: { ...data, ...(planId ? { planId } : {}), ...(normalizedPhone ? { phone: normalizedPhone } : {}) },
    include: { plan: true },
  })
  await audit(admin.id, 'store.update', 'store', id, input as any)
  const { settings, ...rest } = store
  return ok({ store: rest })
})
