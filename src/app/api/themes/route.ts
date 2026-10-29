import { requireAdmin } from '@/lib/auth'
import { ok, route, searchParams } from '@/lib/http'
import { listThemes } from '@/server/themes'

export const GET = route(async (req) => {
  await requireAdmin()
  const params = searchParams(req)
  const status = params.get('status')
  const niche = params.get('niche')
  const themes = await listThemes({
    status: status && status !== 'all' ? (status as any) : undefined,
    niche: niche && niche !== 'all' ? niche : undefined,
    search: params.get('search') || undefined,
  })
  return ok({ themes })
})
