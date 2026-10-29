import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { badRequest, ok, route } from '@/lib/http'
import { getInstall, saveDraft } from '@/server/themes'

type Ctx = { params: Promise<{ id: string }> }

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin()
  return ok({ install: await getInstall((await params).id) })
})

/** Save draft content from the editor. */
export const PUT = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const body = await req.json()
  const install = await saveDraft((await params).id, body.content, admin.id)
  return ok({ install: { id: install.id, draftContent: install.draftContent, updatedAt: install.updatedAt } })
})

export const DELETE = route<Ctx>(async (_req, { params }) => {
  await requireAdmin('SUPPORT')
  const { id } = await params
  const install = await db.themeInstall.findUnique({ where: { id } })
  if (install?.isLive) throw badRequest('Publish another theme before removing the live one')
  await db.themeInstall.delete({ where: { id } })
  return ok({ ok: true })
})
