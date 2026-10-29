import { requireAdmin } from '@/lib/auth'
import { ok, route } from '@/lib/http'
import { publishInstall } from '@/server/themes'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const install = await publishInstall((await params).id, admin.id)
  return ok({ install: { id: install.id, isLive: install.isLive, publishedAt: install.publishedAt } })
})
