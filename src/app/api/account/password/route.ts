import { z } from 'zod'
import { audit } from '@/lib/audit'
import { assertNotDemo, hashPassword, requireAdmin, verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { badRequest, ok, route } from '@/lib/http'

const input = z
  .object({
    current: z.string().min(1),
    next: z.string().min(10, 'New password must be at least 10 characters').max(128),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: 'Passwords do not match', path: ['confirm'] })

export const POST = route(async (req) => {
  const session = await requireAdmin()
  assertNotDemo(session, 'Changing the password')
  const { current, next } = input.parse(await req.json())
  const admin = await db.adminUser.findUniqueOrThrow({ where: { id: session.id } })
  if (!(await verifyPassword(current, admin.passwordHash))) throw badRequest('Current password is incorrect')
  await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } })
  await audit(admin.id, 'admin.password', 'admin', admin.id)
  return ok({ ok: true })
})
