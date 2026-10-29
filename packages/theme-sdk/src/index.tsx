/**
 * @nexdrop/theme-sdk — the runtime every NexDrop theme uses.
 *
 * It connects a theme (any React app) to:
 *  - its editable content (sections + global settings) — live-updated by the admin editor
 *  - the store's catalogue, cart, shipping zones and checkout (Bangladesh payment methods)
 *  - bilingual (English / বাংলা) text
 *
 * See docs/THEME_SPEC.md in the admin repository for the full contract.
 */
import {
  type AnchorHTMLAttributes,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'

// Marker the admin's upload validator looks for in built bundles.
;(globalThis as any).__NEXDROP_SDK__ = '1'
export const SDK_VERSION = '1.0.0'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Locale = 'en' | 'bn'
export type Localized = string | { en?: string; bn?: string }

export interface SectionInstance<S = Record<string, any>> {
  id: string
  type: string
  hidden?: boolean
  settings: S
}

export interface ThemeContent {
  settings: Record<string, any>
  pages: Record<string, { sections: SectionInstance[] }>
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  images: string[]
  category: string | null
  tags: string[]
  inStock: boolean
  stock?: number
}

export interface Bootstrap {
  store: { name: string; slug: string; phone: string; email: string; address: string | null; city: string | null; language: string; currency: 'BDT' }
  theme: { features: string[]; version: string }
  plan: { key: string; features: string[] }
  content: ThemeContent
  payments: { method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'SSLCOMMERZ' | 'COD'; label: string }[]
  cod: { fee: number; maxAmount: number } | null
  shipping: { zones: { name: string; rate: number; time: string; districts: string[] }[]; freeShippingOver: number | null }
  districts: string[]
  categories: { name: string; count: number }[]
}

export interface NexdropConfig {
  mode: 'live' | 'preview' | 'editor'
  store: string
  apiBase: string
  bootstrapUrl: string
  assetBase: string
  installId?: string | null
}

declare global {
  interface Window {
    __NEXDROP_CONFIG__?: NexdropConfig
  }
}

// ─── Safe storage (sandboxed previews have no localStorage) ─────────────────

const memory = new Map<string, string>()
const storage = {
  get(key: string) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return memory.get(key) ?? null
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      memory.set(key, value)
    }
  },
}

// ─── Core context ────────────────────────────────────────────────────────────

interface Ctx {
  config: NexdropConfig
  data: Bootstrap | null
  content: ThemeContent
  error: string | null
  locale: Locale
  setLocale: (l: Locale) => void
  selectedSection: string | null
  pagePaths: Record<string, string>
}

const NexdropContext = createContext<Ctx | null>(null)

function useCtx() {
  const ctx = useContext(NexdropContext)
  if (!ctx) throw new Error('Wrap your theme in <NexdropProvider>')
  return ctx
}

const EMPTY: ThemeContent = { settings: {}, pages: {} }

function post(message: Record<string, unknown>) {
  if (window.parent !== window) window.parent.postMessage({ source: 'nexdrop-theme', ...message }, '*')
}

export interface ProviderProps {
  children: ReactNode
  /** Your defaults/content.json — used during local `vite dev` if the API is unreachable. */
  fallbackContent?: ThemeContent
  /** Local development: which admin + store to load data from. Ignored when served by NexDrop. */
  devConfig?: Partial<NexdropConfig>
  /** Hash path for each page template, so the editor's page switcher can navigate. ":first" = first product. */
  pagePaths?: Record<string, string>
  /** Rendered while bootstrap data loads. */
  loading?: ReactNode
}

export function NexdropProvider({ children, fallbackContent, devConfig, pagePaths = {}, loading = null }: ProviderProps) {
  const config = useMemo<NexdropConfig>(() => {
    const injected = typeof window !== 'undefined' ? window.__NEXDROP_CONFIG__ : undefined
    if (injected) return injected
    const store = devConfig?.store || 'demo'
    const apiBase = devConfig?.apiBase || `http://localhost:3000/api/storefront/${store}`
    return {
      mode: 'preview',
      store,
      apiBase,
      bootstrapUrl: devConfig?.bootstrapUrl || `${apiBase}/bootstrap?mode=preview`,
      assetBase: './',
      ...devConfig,
    }
  }, [devConfig])

  const [data, setData] = useState<Bootstrap | null>(null)
  const [content, setContent] = useState<ThemeContent>(fallbackContent || EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [locale, setLocaleState] = useState<Locale>(() => (storage.get('nx.locale') as Locale) || 'en')
  const [selectedSection, setSelected] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(config.bootstrapUrl)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || `Failed to load store (${res.status})`)
        return body as Bootstrap
      })
      .then((b) => {
        if (cancelled) return
        setData(b)
        setContent(b.content ?? fallbackContent ?? EMPTY)
        if (!storage.get('nx.locale') && b.store.language === 'bn') setLocaleState('bn')
      })
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [config.bootstrapUrl, fallbackContent])

  // Editor bridge
  useEffect(() => {
    if (config.mode !== 'editor') return
    function onMessage(e: MessageEvent) {
      const msg = e.data
      if (e.source !== window.parent || msg?.source !== 'nexdrop-editor') return
      if (msg.type === 'ping') post({ type: 'ready' })
      if (msg.type === 'content' && msg.content) {
        setContent(msg.content)
        if (msg.locale) setLocaleState(msg.locale)
      }
      if (msg.type === 'select') {
        setSelected(msg.id)
        document.querySelector(`[data-nx-section="${CSS.escape(msg.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      if (msg.type === 'navigate' && typeof msg.page === 'string') navigateToPage(msg.page, pagePaths, config)
    }
    window.addEventListener('message', onMessage)
    post({ type: 'ready' })

    const style = document.createElement('style')
    style.textContent =
      '[data-nx-section]{position:relative}[data-nx-section]:hover{outline:2px dashed #6366f1;outline-offset:-2px;cursor:pointer}[data-nx-selected]{outline:2px solid #6366f1!important;outline-offset:-2px}'
    document.head.appendChild(style)
    return () => {
      window.removeEventListener('message', onMessage)
      style.remove()
    }
  }, [config, pagePaths])

  const setLocale = useCallback((l: Locale) => {
    storage.set('nx.locale', l)
    setLocaleState(l)
  }, [])

  const value = useMemo(
    () => ({ config, data, content, error, locale, setLocale, selectedSection, pagePaths }),
    [config, data, content, error, locale, setLocale, selectedSection, pagePaths]
  )

  if (!data && !error && !fallbackContent) return <>{loading}</>
  return <NexdropContext.Provider value={value}>{children}</NexdropContext.Provider>
}

async function navigateToPage(page: string, paths: Record<string, string>, config: NexdropConfig) {
  let path = paths[page] ?? (page === 'home' ? '/' : `/${page}`)
  if (path.includes(':first')) {
    const res = await fetch(`${config.apiBase}/products?limit=1`).then((r) => r.json()).catch(() => null)
    path = path.replace(':first', res?.products?.[0]?.slug || '')
  }
  navigate(path)
}

// ─── Store, settings, locale ─────────────────────────────────────────────────

/** Bootstrap data: store info, payments, shipping zones, districts, categories. null while loading. */
export function useStore() {
  const { data, error, config } = useCtx()
  return { store: data?.store ?? null, data, error, mode: config.mode, isEditor: config.mode === 'editor', isLive: config.mode === 'live' }
}

/** Global theme settings (schema/settings.json), with editor changes applied live. */
export function useThemeSettings<T = Record<string, any>>(): T {
  return useCtx().content.settings as T
}

/** Does the theme + plan support a feature (e.g. "bilingual", "wishlist")? */
export function useFeature(feature: string) {
  const { data } = useCtx()
  if (!data) return false
  const planGated = ['bkash', 'nagad', 'rocket', 'sslcommerz', 'bilingual', 'blog', 'wishlist', 'reviews', 'order-tracking']
  return data.theme.features.includes(feature) && (!planGated.includes(feature) || data.plan.features.includes(feature))
}

export function useLocale() {
  const { locale, setLocale } = useCtx()
  const t = useCallback(
    (value: Localized | null | undefined, fallback = '') => {
      if (value == null) return fallback
      if (typeof value === 'string') return value
      return value[locale] || value.en || value.bn || fallback
    },
    [locale]
  )
  return { locale, setLocale, t, formatPrice: (n: number) => formatPrice(n, locale) }
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
export function formatPrice(amount: number, locale: Locale = 'en') {
  const s = Math.round(amount).toLocaleString('en-IN')
  return '৳' + (locale === 'bn' ? s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : s)
}

/** Resolves theme-relative image paths ("images/hero.jpg") and uploaded media URLs. */
export function useAsset() {
  const { config } = useCtx()
  return useCallback(
    (src?: string | null) => {
      if (!src) return ''
      if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src
      if (src.startsWith('/')) {
        // Media uploaded in the admin lives on the admin origin.
        const origin = /^https?:/.test(config.apiBase) ? new URL(config.apiBase).origin : ''
        return origin + src
      }
      return config.assetBase + src
    },
    [config]
  )
}

// ─── Sections ────────────────────────────────────────────────────────────────

export type SectionComponent<S = any> = ComponentType<{ settings: S; section: SectionInstance<S> }>

/**
 * Renders the editable sections of a page template in order.
 *   <Sections page="home" components={{ hero: Hero, 'featured-products': FeaturedProducts }} />
 */
export function Sections({ page, components }: { page: string; components: Record<string, SectionComponent> }) {
  const { content, config, selectedSection } = useCtx()
  const sections = content.pages[page]?.sections ?? []
  const editor = config.mode === 'editor'

  useEffect(() => {
    if (editor) post({ type: 'navigate', page })
  }, [editor, page])

  return (
    <>
      {sections.map((section) => {
        if (section.hidden) return null
        const Component = components[section.type]
        if (!Component) {
          return editor ? (
            <div key={section.id} data-nx-section={section.id} style={{ padding: 16, background: '#fef3c7', fontSize: 12 }}>
              No component registered for section “{section.type}”
            </div>
          ) : null
        }
        return (
          <div
            key={section.id}
            data-nx-section={section.id}
            data-nx-selected={editor && selectedSection === section.id ? '' : undefined}
            onClickCapture={editor ? () => post({ type: 'section-click', id: section.id }) : undefined}
          >
            <Component settings={section.settings} section={section} />
          </div>
        )
      })}
    </>
  )
}

// ─── Hash router (works under any base path and inside the editor iframe) ────

function currentPath() {
  return window.location.hash.replace(/^#/, '') || '/'
}

export function navigate(path: string) {
  if (/^https?:/.test(path)) {
    window.open(path, '_blank', 'noopener')
    return
  }
  window.location.hash = path.replace(/^#/, '')
  window.scrollTo({ top: 0 })
}

export function useRoute() {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const [pathname, search = ''] = path.split('?')
  return {
    path: pathname,
    segments: pathname.split('/').filter(Boolean),
    query: new URLSearchParams(search),
    navigate,
  }
}

/** Matches "/product/:slug" style patterns. Returns params or null. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean)
  const s = path.split('/').filter(Boolean)
  if (p.length !== s.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i])
    else if (p[i] !== s[i]) return null
  }
  return params
}

export function Link({ to, children, onClick, ...props }: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const external = /^https?:/.test(to)
  const href = external ? to : '#' + to.replace(/^#/, '')
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      onClick={(e) => {
        onClick?.(e)
        if (!external && !e.defaultPrevented) {
          e.preventDefault()
          navigate(to)
        }
      }}
      {...props}
    >
      {children}
    </a>
  )
}

// ─── Catalogue ───────────────────────────────────────────────────────────────

const cache = new Map<string, Promise<any>>()
function getJson<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok) {
          cache.delete(url)
          throw new Error(body.error || `Request failed (${r.status})`)
        }
        return body
      })
    )
  }
  return cache.get(url)!
}

function useFetch<T>(url: string | null) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: Boolean(url), error: null })
  useEffect(() => {
    if (!url) return
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    getJson<T>(url)
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((e: Error) => alive && setState({ data: null, loading: false, error: e.message }))
    return () => {
      alive = false
    }
  }, [url])
  return state
}

export interface ProductQuery {
  category?: string
  tag?: string
  search?: string
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name'
  onSale?: boolean
  ids?: string[]
  limit?: number
  page?: number
}

export function useProducts(query: ProductQuery = {}) {
  const { config } = useCtx()
  const params = new URLSearchParams()
  if (query.category && query.category !== 'all') params.set('category', query.category)
  if (query.tag) params.set('tag', query.tag)
  if (query.search) params.set('search', query.search)
  if (query.sort) params.set('sort', query.sort)
  if (query.onSale) params.set('onSale', '1')
  if (query.ids?.length) params.set('ids', query.ids.join(','))
  params.set('limit', String(query.limit ?? 12))
  if (query.page) params.set('page', String(query.page))
  const { data, loading, error } = useFetch<{ products: Product[]; total: number }>(`${config.apiBase}/products?${params}`)
  return { products: data?.products ?? [], total: data?.total ?? 0, loading, error }
}

export function useProduct(slug: string | undefined) {
  const { config } = useCtx()
  const { data, loading, error } = useFetch<{ product: Product }>(slug ? `${config.apiBase}/products/${encodeURIComponent(slug)}` : null)
  return { product: data?.product ?? null, loading, error }
}

export function useCategories() {
  return useCtx().data?.categories ?? []
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  image: string | null
  quantity: number
}

type CartListener = (items: CartItem[]) => void
const cartListeners = new Set<CartListener>()

function cartKey(store: string) {
  return `nx.cart.${store}`
}

export function useCart() {
  const { config } = useCtx()
  const key = cartKey(config.store)
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(storage.get(key) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    const l: CartListener = (next) => setItems(next)
    cartListeners.add(l)
    return () => {
      cartListeners.delete(l)
    }
  }, [])

  const write = useCallback(
    (next: CartItem[]) => {
      storage.set(key, JSON.stringify(next))
      cartListeners.forEach((l) => l(next))
    },
    [key]
  )

  const add = useCallback(
    (product: Product, quantity = 1) => {
      const existing = items.find((i) => i.productId === product.id)
      write(
        existing
          ? items.map((i) => (i.productId === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, 100) } : i))
          : [...items, { productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.images[0] ?? null, quantity }]
      )
    },
    [items, write]
  )
  const update = useCallback((productId: string, quantity: number) => write(items.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, 100)) } : i))), [items, write])
  const remove = useCallback((productId: string) => write(items.filter((i) => i.productId !== productId)), [items, write])
  const clear = useCallback(() => write([]), [write])

  return {
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
    add,
    update,
    remove,
    clear,
  }
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface CheckoutForm {
  name: string
  phone: string
  email?: string
  address: string
  city: string
  district: string
  paymentMethod: Bootstrap['payments'][number]['method']
  notes?: string
}

export interface PlacedOrder {
  order: { number: number; total: number; subtotal: number; shippingFee: number; paymentMethod: string; paymentStatus: string; status: string }
  payment: { status: string; redirectUrl: string | null } | null
}

export function useCheckout() {
  const { config, data } = useCtx()
  const cart = useCart()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastOrder = useRef<PlacedOrder | null>(null)

  /** Client-side estimate only — the server recalculates the real fee. */
  const shippingFor = useCallback(
    (district: string, method?: string) => {
      if (!data) return 0
      const zones = data.shipping.zones
      const zone = zones.find((z) => z.districts.some((d) => d.toLowerCase() === district.toLowerCase())) || zones.find((z) => z.districts.length === 0) || zones[0]
      if (data.shipping.freeShippingOver != null && cart.subtotal >= data.shipping.freeShippingOver) return method === 'COD' ? data.cod?.fee ?? 0 : 0
      return (zone?.rate ?? 0) + (method === 'COD' ? data.cod?.fee ?? 0 : 0)
    },
    [data, cart.subtotal]
  )

  const placeOrder = useCallback(
    async (form: CheckoutForm): Promise<PlacedOrder> => {
      if (config.mode !== 'live') throw new Error('Checkout is disabled in preview mode')
      setPlacing(true)
      setError(null)
      try {
        const res = await fetch(`${config.apiBase}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: form.name, phone: form.phone, email: form.email, address: form.address, city: form.city, district: form.district },
            items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            paymentMethod: form.paymentMethod,
            notes: form.notes,
          }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || 'Could not place order')
        cart.clear()
        lastOrder.current = body
        if (body.payment?.redirectUrl) window.location.href = body.payment.redirectUrl
        return body
      } catch (e) {
        setError((e as Error).message)
        throw e
      } finally {
        setPlacing(false)
      }
    },
    [config, cart]
  )

  return {
    paymentMethods: data?.payments ?? [],
    districts: data?.districts ?? [],
    cod: data?.cod ?? null,
    shippingFor,
    placeOrder,
    placing,
    error,
    enabled: config.mode === 'live',
  }
}

/** Order tracking (requires the phone number used at checkout). */
export async function trackOrder(apiBase: string, orderNumber: number, phone: string) {
  const res = await fetch(`${apiBase}/orders/${orderNumber}?phone=${encodeURIComponent(phone)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Order not found')
  return body.order
}

export function useApiBase() {
  return useCtx().config.apiBase
}
