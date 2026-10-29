import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound, route } from '@/lib/http'
import { storage } from '@/lib/storage'

type Ctx = { params: Promise<{ id: string; versionId: string }> }

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin()
  const { id, versionId } = await params
  const version = await db.themeVersion.findFirst({ where: { id: versionId, themeId: id }, include: { theme: true } })
  if (!version?.sourceKey) throw notFound('Package')
  const file = await storage.get(version.sourceKey)
  if (!file) throw notFound('Package')
  return new Response(file.body as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${version.theme.slug}-${version.version}.zip"`,
    },
  })
})
