import { z } from 'zod'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, route } from '@/lib/http'
import { KNOWN_FEATURES } from '@/lib/themes/spec'

type Ctx = { params: Promise<{ id: string }> }

const patch = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  priceMonthly: z.number().min(0).optional(),
  features: z.array(z.enum(KNOWN_FEATURES)).optional(),
  maxProducts: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
})

export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin('SUPER_ADMIN')
  const { id } = await params
  const input = patch.parse(await req.json())
  const plan = await db.plan.update({ where: { id }, data: input })
  await audit(admin.id, 'plan.update', 'plan', id, input as any)
  return ok({ plan })
})
