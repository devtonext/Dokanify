import { z } from 'zod'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { badRequest, ok, route } from '@/lib/http'

type Ctx = { params: Promise<{ id: string }> }

const patch = z.object({
  role: z.enum(['SUPER_ADMIN', 'THEME_MANAGER', 'SUPPORT']).optional(),
  isActive: z.boolean().optional(),
  name: z.string().trim().min(2).max(80).optional(),
})

export const PATCH = route<Ctx>(async (req, { params }) => {
  const actor = await requireAdmin('SUPER_ADMIN')
  const { id } = await params
  const input = patch.parse(await req.json())
  if (id === actor.id && (input.isActive === false || (input.role && input.role !== 'SUPER_ADMIN'))) {
    throw badRequest('You cannot demote or deactivate yourself')
  }
  const admin = await db.adminUser.update({
    where: { id },
    data: input,
    select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  })
  await audit(actor.id, 'admin.update', 'admin', id, input)
  return ok({ admin })
})
