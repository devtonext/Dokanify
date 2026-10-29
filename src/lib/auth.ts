import 'server-only'
import type { AdminRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getServerSession, type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import { db } from '@/lib/db'
import { HttpError } from '@/lib/http'
import { authSecret } from '@/lib/secrets'

export const authOptions: NextAuthOptions = {
  secret: authSecret(),
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(raw) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(raw)
        if (!parsed.success) return null
        const user = await db.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
        if (!user || !user.isActive) return null
        if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null
        await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.uid
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
}

export type SessionAdmin = { id: string; email: string; name: string; role: AdminRole }

/**
 * Throws 401/403 unless the caller is a signed-in admin with one of `roles`.
 * SUPER_ADMIN always passes.
 */
export async function requireAdmin(...roles: AdminRole[]): Promise<SessionAdmin> {
  const session = await getServerSession(authOptions)
  const user = session?.user as Partial<SessionAdmin> | undefined
  if (!user?.id || !user.role) throw new HttpError(401, 'Not signed in')
  if (roles.length && user.role !== 'SUPER_ADMIN' && !roles.includes(user.role)) {
    throw new HttpError(403, 'You do not have permission for this action')
  }
  return user as SessionAdmin
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12)
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash)
