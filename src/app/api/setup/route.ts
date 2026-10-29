import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { audit } from '@/lib/audit'
import { hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { HttpError, ok, route } from '@/lib/http'
import { rateLimit } from '@/server/rate-limit'

const input = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10, 'Password must be at least 10 characters').max(128),
})

/** Creates the first super admin. Refuses once any admin exists. */
export const POST = route(async (req) => {
  rateLimit(`setup:${req.headers.get('x-forwarded-for') || 'local'}`, 10, 10 * 60_000)
  const data = input.parse(await req.json())
  const passwordHash = await hashPassword(data.password)
  const admin = await db.$transaction(
    async (tx) => {
      if ((await tx.adminUser.count()) > 0) throw new HttpError(409, 'Setup is already complete — please sign in')
      return tx.adminUser.create({
        data: { name: data.name, email: data.email, passwordHash, role: 'SUPER_ADMIN' },
        select: { id: true, email: true },
      })
    },
    // Serializable: two simultaneous setups can't both create a "first" admin.
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
  await audit(admin.id, 'setup.complete', 'admin', admin.id)
  return ok({ ok: true }, { status: 201 })
})
