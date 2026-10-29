import { useEffect } from 'react'
import { matchPath, Sections, useLocale, useRoute, useStore, useThemeSettings } from '@nexdrop/theme-sdk'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { TrackOrder } from './components/TrackOrder'
import type { Settings } from './types'
import { CartMain } from './sections/CartMain'
import { CategoryGrid } from './sections/CategoryGrid'
import { CheckoutMain } from './sections/CheckoutMain'
import { CollectionMain } from './sections/CollectionMain'
import { FeaturedProducts } from './sections/FeaturedProducts'
import { Hero } from './sections/Hero'
import { ProductMain } from './sections/ProductMain'
import { PromoBanner } from './sections/PromoBanner'
import { RichText } from './sections/RichText'
import { Testimonials } from './sections/Testimonials'
import { TrustBadges } from './sections/TrustBadges'
import { WhatsappCta } from './sections/WhatsappCta'

// Every section type declared in theme.json → its component.
const SECTIONS = {
  hero: Hero,
  'trust-badges': TrustBadges,
  'category-grid': CategoryGrid,
  'featured-products': FeaturedProducts,
  'promo-banner': PromoBanner,
  testimonials: Testimonials,
  'whatsapp-cta': WhatsappCta,
  'rich-text': RichText,
  'collection-main': CollectionMain,
  'product-main': ProductMain,
  'cart-main': CartMain,
  'checkout-main': CheckoutMain,
}

// Hash path → page template (from theme.json "pages").
function pageFor(path: string) {
  if (path === '/') return 'home'
  if (matchPath('/collection/:category', path) || path === '/search') return 'collection'
  if (matchPath('/product/:slug', path)) return 'product'
  if (path === '/cart') return 'cart'
  if (path === '/checkout') return 'checkout'
  return null
}

export function App() {
  const s = useThemeSettings<Settings>()
  const { locale } = useLocale()
  const { store, error } = useStore()
  const { path } = useRoute()
  const page = pageFor(path)

  // Theme settings → CSS variables + Google Fonts
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', s.colorPrimary || '#1f2937')
    root.style.setProperty('--accent', s.colorAccent || '#b45309')
    root.style.setProperty('--bg', s.colorBackground || '#fbf8f4')
    root.style.setProperty('--text', s.colorText || '#1c1917')
    root.style.setProperty('--radius', `${s.radius ?? 8}px`)
    const body = locale === 'bn' ? s.fontBangla || 'Hind Siliguri' : s.fontBody || 'Inter'
    const heading = locale === 'bn' ? s.fontBangla || 'Hind Siliguri' : s.fontHeading || 'Playfair Display'
    root.style.setProperty('--font-body', `'${body}', system-ui, sans-serif`)
    root.style.setProperty('--font-heading', `'${heading}', Georgia, serif`)
    root.lang = locale
    const families = [...new Set([body, heading])].map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')
    let link = document.getElementById('nx-fonts') as HTMLLinkElement | null
    if (!link) {
      link = Object.assign(document.createElement('link'), { id: 'nx-fonts', rel: 'stylesheet' })
      document.head.appendChild(link)
    }
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  }, [s.colorPrimary, s.colorAccent, s.colorBackground, s.colorText, s.radius, s.fontBody, s.fontHeading, s.fontBangla, locale])

  useEffect(() => {
    if (store) document.title = store.name
  }, [store])

  if (error && !store) {
    return <div className="container empty-state">{error}</div>
  }

  return (
    <>
      <Header />
      <main>
        {page ? (
          <Sections page={page} components={SECTIONS} />
        ) : path === '/track' ? (
          <TrackOrder />
        ) : (
          <div className="container empty-state">Page not found</div>
        )}
      </main>
      <Footer />
    </>
  )
}
