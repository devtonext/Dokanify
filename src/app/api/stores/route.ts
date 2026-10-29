import { z } from 'zod'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { normalizeBdPhone } from '@/lib/bd'
import { db } from '@/lib/db'
import { badRequest, ok, route, searchParams } from '@/lib/http'
import { parseStoreSettings } from '@/lib/store-settings'

export const GET = route(async (req) => {
  await requireAdmin()
  const params = searchParams(req)
  const search = params.get('search')?.trim()
  const status = params.get('status')
  const stores = await db.store.findMany({
    where: {
      ...(status && status !== 'all' ? { status: status as any } : {}),
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { slug: { contains: search } }, { email: { contains: search, mode: 'insensitive' } }] }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: { select: { key: true, name: true } },
      _count: { select: { products: true, orders: true, customers: true } },
      themeInstalls: { where: { isLive: true }, select: { theme: { select: { name: true } } } },
    },
  })
  return ok({ stores })
})

const storeInput = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, 'Use 3-40 lowercase letters, numbers or dashes'),
  ownerName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(60).optional(),
  planKey: z.string().default('free'),
  language: z.enum(['en', 'bn']).default('en'),
})

const RESERVED = new Set(['www', 'admin', 'api', 'app', 'cdn', 'media', 'static', 'mail'])

export const POST = route(async (req) => {
  const admin = await requireAdmin('SUPPORT')
  const input = storeInput.parse(await req.json())
  if (RESERVED.has(input.slug)) throw badRequest('That store URL is reserved')
  const phone = normalizeBdPhone(input.phone)
  if (!phone) throw badRequest('Enter a valid Bangladeshi mobile number')
  const plan = await db.plan.findUnique({ where: { key: input.planKey } })
  if (!plan) throw badRequest('Unknown plan')
  const { planKey, ...data } = input
  const store = await db.store.create({
    data: { ...data, phone, planId: plan.id, settings: parseStoreSettings({}) as any },
  })
  await audit(admin.id, 'store.create', 'store', store.id)
  return ok({ store }, { status: 201 })
})
