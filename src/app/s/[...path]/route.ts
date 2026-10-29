import { db } from '@/lib/db'
import { isStorefrontHost, serveThemeFile, trailingSlashRedirect } from '@/server/storefront'

type Ctx = { params: Promise<{ path: string[] }> }

/**
 * Live storefront: /s/{store}/… (or {store}.STOREFRONT_ROOT_DOMAIN via proxy.ts).
 * Renders the store's live install with its *published* version and content.
 */
export async function GET(req: Request, { params }: Ctx) {
  const [storeSlug, ...rest] = (await params).path
  const store = await db.store.findUnique({
    where: { slug: storeSlug || '' },
    select: {
      id: true,
      status: true,
      themeInstalls: {
        where: { isLive: true },
        select: { id: true, theme: { select: { slug: true } }, publishedVersion: { select: { version: true } } },
      },
    },
  })
  if (!store || store.status !== 'ACTIVE') return new Response('Store not found', { status: 404 })
  const live = store.themeInstalls[0]
  if (!live?.publishedVersion) {
    return new Response('<h1 style="font-family:sans-serif">Coming soon</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  const onStoreHost = isStorefrontHost(req.headers.get('host'))
  if (!onStoreHost) {
    const redirect = trailingSlashRedirect(req, rest.length === 0)
    if (redirect) return redirect
  }
  const base = onStoreHost ? '/' : `/s/${storeSlug}/`
  return serveThemeFile({
    slug: live.theme.slug,
    version: live.publishedVersion.version,
    path: rest.join('/'),
    sandboxed: !onStoreHost,
    config: {
      mode: 'live',
      store: storeSlug,
      apiBase: `/api/storefront/${storeSlug}`,
      bootstrapUrl: `/api/storefront/${storeSlug}/bootstrap?mode=live`,
      assetBase: base,
      installId: null,
    },
  })
}
