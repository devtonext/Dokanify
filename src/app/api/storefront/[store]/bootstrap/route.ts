import { ok, searchParams } from '@/lib/http'
import { cors, CORS, publicRoute, storefrontBootstrap } from '@/server/storefront'

type Ctx = { params: Promise<{ store: string }> }

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })

/** Everything a theme needs on first load: store info, content, payments, shipping. */
export const GET = publicRoute<Ctx>(async (req, { params }) => {
  const q = searchParams(req)
  const mode = q.get('mode') === 'editor' ? 'editor' : q.get('mode') === 'preview' ? 'preview' : 'live'
  const data = await storefrontBootstrap((await params).store, {
    mode,
    installId: q.get('install'),
    theme: q.get('theme'),
    version: q.get('version'),
  })
  const { allowedMethods, ...body } = data
  const res = ok(body, { headers: { 'Cache-Control': mode === 'live' ? 'public, s-maxage=30, stale-while-revalidate=120' : 'no-store' } })
  return cors(res)
})
