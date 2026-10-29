import { z } from 'zod'
import { audit } from '@/lib/audit'
import { hashPassword, requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, route } from '@/lib/http'

const select = { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true }

export const GET = route(async () => {
  await requireAdmin('SUPER_ADMIN')
  const admins = await db.adminUser.findMany({ orderBy: { createdAt: 'asc' }, select })
  return ok({ admins })
})

const input = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['SUPER_ADMIN', 'THEME_MANAGER', 'SUPPORT']),
  password: z.string().min(10, 'Password must be at least 10 characters').max(128),
})

export const POST = route(async (req) => {
  const actor = await requireAdmin('SUPER_ADMIN')
  const { password, ...data } = input.parse(await req.json())
  const admin = await db.adminUser.create({ data: { ...data, passwordHash: await hashPassword(password) }, select })
  await audit(actor.id, 'admin.create', 'admin', admin.id, { role: admin.role })
  return ok({ admin }, { status: 201 })
})
