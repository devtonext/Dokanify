import { Link, useLocale, useProducts, type Localized } from '@nexdrop/theme-sdk'
import { ProductGrid } from '../components/ProductCard'

type S = { heading: Localized; collection: string; sort: 'newest' | 'price-asc' | 'price-desc'; onSaleOnly: boolean; limit: number; showViewAll: boolean }

export function FeaturedProducts({ settings }: { settings: S }) {
  const { t, locale } = useLocale()
  const { products, loading } = useProducts({
    category: settings.collection,
    sort: settings.sort,
    onSale: settings.onSaleOnly,
    limit: settings.limit || 8,
  })
  if (!loading && !products.length) return null
  return (
    <section className="container section">
      <div className="section-head">
        {t(settings.heading) && <h2 className="section-title">{t(settings.heading)}</h2>}
        {settings.showViewAll && (
          <Link to={`/collection/${encodeURIComponent(settings.collection || 'all')}`} className="link">
            {locale === 'bn' ? 'সব দেখুন →' : 'View all →'}
          </Link>
        )}
      </div>
      <ProductGrid products={products} loading={loading} />
    </section>
  )
}
