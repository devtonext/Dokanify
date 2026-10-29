import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { isStorefrontHost, serveThemeFile, themeBaseUrl } from '@/server/storefront'

type Ctx = { params: Promise<{ path: string[] }> }

const DEMO_STORE = process.env.DEMO_STORE_SLUG || 'demo'

/**
 * Theme preview: /t/{theme}/{version}/…
 *   ?store=<slug>&install=<id>&mode=editor  → editor preview of a store's draft
 *   (no params)                             → demo preview with the theme's default content
 * Unpublished themes are only previewable by signed-in admins.
 */
export async function GET(req: Request, { params }: Ctx) {
  const [slug, version, ...rest] = (await params).path
  if (!slug || !version) return new Response('Not found', { status: 404 })
  const path = rest.join('/')
  const url = new URL(req.url)
  const isDocument = !path || path === 'index.html' || !/\.[a-z0-9]+$/i.test(path)

  if (isDocument) {
    const theme = await db.theme.findUnique({ where: { slug }, select: { status: true } })
    if (!theme) return new Response('Not found', { status: 404 })
    if (theme.status !== 'PUBLISHED' && !(await getServerSession(authOptions))) {
      return new Response('This theme is not published', { status: 403 })
    }
  }

  const mode = url.searchParams.get('mode') === 'editor' ? 'editor' : 'preview'
  const store = url.searchParams.get('store') || DEMO_STORE
  const install = url.searchParams.get('install')
  const base = themeBaseUrl(slug, version)
  const query = new URLSearchParams({ mode, ...(install ? { install } : { theme: slug, version }) })

  return serveThemeFile({
    slug,
    version,
    path,
    basePath: base,
    sandboxed: !isStorefrontHost(req.headers.get('host')),
    config: {
      mode,
      store,
      apiBase: `/api/storefront/${store}`,
      bootstrapUrl: `/api/storefront/${store}/bootstrap?${query}`,
      assetBase: base,
      installId: install,
    },
  })
}
