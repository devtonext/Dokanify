import 'server-only'
import { DISTRICTS, PAYMENT_FEATURE, PAYMENT_LABELS, PAYMENT_METHODS, type PaymentMethodKey } from '@/lib/bd'
import { db } from '@/lib/db'
import { HttpError, notFound, route } from '@/lib/http'
import { storage } from '@/lib/storage'
import { parseStoreSettings } from '@/lib/store-settings'
import { mimeFor } from '@/lib/themes/validate'
import { themeBaseUrl, themePrefix } from '@/server/themes'

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export function cors(response: Response) {
  for (const [k, v] of Object.entries(CORS)) response.headers.set(k, v)
  return response
}

export async function getActiveStore(slug: string) {
  const store = await db.store.findUnique({ where: { slug }, include: { plan: true } })
  if (!store || store.status !== 'ACTIVE') throw notFound('Store')
  return store
}

type Mode = 'live' | 'preview' | 'editor'

/** Resolves which theme version + content a storefront request should render. */
export async function resolveThemeContext(
  storeId: string,
  opts: { mode: Mode; installId?: string | null; theme?: string | null; version?: string | null }
) {
  if (opts.installId) {
    const install = await db.themeInstall.findFirst({
      where: { id: opts.installId, storeId },
      include: { version: true, publishedVersion: true },
    })
    if (!install) throw notFound('Theme install')
    if (opts.mode === 'live') {
      if (!install.publishedVersion || !install.publishedContent) throw notFound('Published theme')
      return { version: install.publishedVersion, content: install.publishedContent }
    }
    return { version: install.version, content: install.draftContent }
  }
  if (opts.theme && opts.version) {
    const version = await db.themeVersion.findFirst({ where: { version: opts.version, theme: { slug: opts.theme } } })
    if (!version) throw notFound('Theme version')
    // A store's own install of this theme wins over the theme's demo content.
    const install = await db.themeInstall.findFirst({ where: { storeId, themeId: version.themeId } })
    if (install && install.versionId === version.id) return { version, content: install.draftContent }
    return { version, content: version.defaults }
  }
  const live = await db.themeInstall.findFirst({
    where: { storeId, isLive: true },
    include: { publishedVersion: true },
  })
  if (!live?.publishedVersion || !live.publishedContent) throw notFound('This store has not published a theme yet')
  return { version: live.publishedVersion, content: live.publishedContent }
}

export async function storefrontBootstrap(
  slug: string,
  opts: { mode: Mode; installId?: string | null; theme?: string | null; version?: string | null }
) {
  const store = await getActiveStore(slug)
  const settings = parseStoreSettings(store.settings)
  const { version, content } = await resolveThemeContext(store.id, opts)
  const themeFeatures = new Set(version.features)
  const planFeatures = new Set(store.plan.features)

  // A payment method is offered only if the store enabled it, the theme supports it and the plan unlocks it.
  const payments = PAYMENT_METHODS.filter((m) => {
    const key = m.toLowerCase() as keyof typeof settings.payments
    const feature = PAYMENT_FEATURE[m]
    return settings.payments[key]?.enabled && themeFeatures.has(feature) && (feature === 'cod' || planFeatures.has(feature))
  }).map((m) => ({ method: m, label: PAYMENT_LABELS[m as PaymentMethodKey] }))

  const categories = await db.product.groupBy({
    by: ['category'],
    where: { storeId: store.id, status: 'ACTIVE', category: { not: null } },
    _count: true,
    orderBy: { category: 'asc' },
  })

  return {
    store: {
      name: store.name,
      slug: store.slug,
      phone: store.phone,
      email: store.email,
      address: store.address,
      city: store.city,
      language: store.language,
      currency: 'BDT',
    },
    theme: { features: version.features, version: version.version },
    plan: { key: store.plan.key, features: store.plan.features },
    content,
    payments,
    cod: payments.some((p) => p.method === 'COD') ? { fee: settings.payments.cod.fee, maxAmount: settings.payments.cod.maxAmount } : null,
    shipping: {
      zones: settings.shipping.zones.filter((z) => z.enabled).map(({ name, rate, time, districts }) => ({ name, rate, time, districts })),
      freeShippingOver: settings.shipping.freeShippingOver,
    },
    districts: DISTRICTS,
    categories: categories.map((c) => ({ name: c.category, count: c._count })),
    allowedMethods: payments.map((p) => p.method),
  }
}

// ─── Serving theme files ─────────────────────────────────────────────────────

const ADMIN_SANDBOX = 'sandbox allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox'

function escapeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => (c === '\u2028' ? '\\u2028' : '\\u2029'))
}

/**
 * Serves a file from a theme version's dist/. index.html gets the runtime config injected
 * so the SDK knows which store / mode / install to load.
 * `sandboxed` (admin host) makes the page an opaque origin: theme JS can never read admin cookies.
 */
export async function serveThemeFile(opts: {
  slug: string
  version: string
  path: string
  basePath: string
  config: Record<string, unknown>
  sandboxed: boolean
}) {
  const prefix = themePrefix(opts.slug, opts.version)
  const clean = opts.path.replace(/^\/+/, '')
  if (clean.split('/').some((p) => p === '..' || p.startsWith('.'))) throw new HttpError(400, 'Bad path')

  let key: string
  if (clean.startsWith('_pkg/')) {
    const rest = clean.slice(5)
    if (!rest.startsWith('preview/')) throw notFound('File')
    key = `${prefix}/${rest}`
  } else {
    key = `${prefix}/dist/${clean || 'index.html'}`
  }

  let file = await storage.get(key)
  let isIndex = key.endsWith('/dist/index.html')
  // SPA fallback for extension-less paths
  if (!file && !clean.startsWith('_pkg/') && !/\.[a-z0-9]+$/i.test(clean)) {
    file = await storage.get(`${prefix}/dist/index.html`)
    isIndex = true
  }
  if (!file) return new Response('Not found', { status: 404 })

  const headers: Record<string, string> = {
    'Content-Type': file.contentType || mimeFor(key),
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  }

  if (isIndex) {
    const html = new TextDecoder().decode(file.body)
    const inject =
      `<base href="${opts.basePath}">` +
      `<script>window.__NEXDROP_CONFIG__=${escapeJson(opts.config)}</script>`
    const body = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + inject) : inject + html
    headers['Content-Type'] = 'text/html; charset=utf-8'
    headers['Cache-Control'] = 'no-store'
    if (opts.sandboxed) headers['Content-Security-Policy'] = ADMIN_SANDBOX
    return new Response(body, { headers })
  }

  // Versions are immutable → cache forever.
  headers['Cache-Control'] = 'public, max-age=31536000, immutable'
  if (opts.sandboxed && headers['Content-Type'].startsWith('text/html')) headers['Content-Security-Policy'] = ADMIN_SANDBOX
  return new Response(file.body as BodyInit, { headers })
}

export function isStorefrontHost(host: string | null) {
  const root = process.env.STOREFRONT_ROOT_DOMAIN
  return Boolean(root && host && host.split(':')[0].endsWith('.' + root))
}

export { themeBaseUrl }

/** `route()` + CORS on every response (including errors) for the public storefront API. */
export function publicRoute<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  const handler = route<C>(fn)
  return async (req: Request, ctx: C) => cors(await handler(req, ctx))
}
