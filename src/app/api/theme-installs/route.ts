import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, route, searchParams } from '@/lib/http'
import { presentTheme } from '@/server/themes'

export const GET = route(async (req) => {
  await requireAdmin()
  const storeId = searchParams(req).get('store') || undefined
  const installs = await db.themeInstall.findMany({
    where: { storeId },
    orderBy: [{ isLive: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      isLive: true,
      publishedAt: true,
      updatedAt: true,
      versionId: true,
      store: { select: { id: true, name: true, slug: true } },
      version: { select: { version: true } },
      theme: {
        select: {
          id: true,
          name: true,
          slug: true,
          niche: true,
          currentVersionId: true,
          currentVersion: { select: { version: true, coverPath: true } },
        },
      },
    },
  })
  return ok({
    installs: installs.map((i) => ({
      ...i,
      theme: presentTheme(i.theme),
      updateAvailable: i.theme.currentVersionId !== i.versionId,
      liveUrl: `/s/${i.store.slug}/`,
    })),
  })
})
