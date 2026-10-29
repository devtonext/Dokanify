import { z } from 'zod'
import { assertNotDemo, requireAdmin } from '@/lib/auth'
import { ok, route } from '@/lib/http'
import { deleteTheme, getTheme, updateTheme } from '@/server/themes'

type Ctx = { params: Promise<{ id: string }> }

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin()
  return ok({ theme: await getTheme((await params).id) })
})

const patch = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  price: z.number().min(0).max(1_000_000).optional(),
  featured: z.boolean().optional(),
  minPlanKey: z.string().optional(),
})

export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin('THEME_MANAGER')
  const input = patch.parse(await req.json())
  await updateTheme((await params).id, input, admin.id)
  return ok({ theme: await getTheme((await params).id) })
})

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin('SUPER_ADMIN')
  assertNotDemo(admin, 'Deleting themes')
  await deleteTheme((await params).id, admin.id)
  return ok({ ok: true })
})
