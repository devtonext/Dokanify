import { db } from '@/lib/db'
import { route } from '@/lib/http'
import { publicThemePayload } from '@/server/themes'

/**
 * Public, read-only catalogue of published themes for the NexDrop marketplace.
 * Cached at the edge for 5 minutes.
 */
export const GET = route(async (req) => {
  const niche = new URL(req.url).searchParams.get('niche')
  const themes = await db.theme.findMany({
    where: { status: 'PUBLISHED', ...(niche ? { niche } : {}) },
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    include: { currentVersion: true },
  })
  return Response.json(
    { themes: themes.map(publicThemePayload) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
})
