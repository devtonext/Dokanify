import { requireAdmin } from '@/lib/auth'
import { ok, route } from '@/lib/http'
import { deleteVersion, getTheme, setCurrentVersion } from '@/server/themes'

type Ctx = { params: Promise<{ id: string; versionId: string }> }

/** Release: make this version the theme's current version. */
export const POST = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin('THEME_MANAGER')
  const { id, versionId } = await params
  await setCurrentVersion(id, versionId, admin.id)
  return ok({ theme: await getTheme(id) })
})

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin('THEME_MANAGER')
  const { id, versionId } = await params
  await deleteVersion(id, versionId, admin.id)
  return ok({ theme: await getTheme(id) })
})
