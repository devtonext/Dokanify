import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { ok, route } from '@/lib/http'
import { installTheme } from '@/server/themes'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const { storeId } = z.object({ storeId: z.string() }).parse(await req.json())
  const install = await installTheme(storeId, (await params).id, admin.id)
  return ok({ install }, { status: 201 })
})
