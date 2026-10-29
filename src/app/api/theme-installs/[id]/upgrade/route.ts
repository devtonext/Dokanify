import { requireAdmin } from '@/lib/auth'
import { ok, route } from '@/lib/http'
import { getInstall, upgradeInstall } from '@/server/themes'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const { id } = await params
  await upgradeInstall(id, admin.id)
  return ok({ install: await getInstall(id) })
})
