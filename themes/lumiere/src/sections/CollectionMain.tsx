import { useEffect, useState } from 'react'
import { Link, matchPath, useCategories, useLocale, useProducts, useRoute, type Localized } from '@nexdrop/theme-sdk'
import { ProductGrid } from '../components/ProductCard'

type S = { heading: Localized; perPage: number; showCategoryFilter: boolean }

export function CollectionMain({ settings }: { settings: S }) {
  const { t, locale } = useLocale()
  const { path, query } = useRoute()
  const categories = useCategories()
  const category = matchPath('/collection/:category', path)?.category || 'all'
  const search = path === '/search' ? query.get('q') || '' : ''
  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [category, search, sort])
  const { products, total, loading } = useProducts({ category, search, sort, limit: settings.perPage || 16, page })
  const pages = Math.ceil(total / (settings.perPage || 16))
  const bn = locale === 'bn'

  const title = search ? `${bn ? 'অনুসন্ধান' : 'Search'}: “${search}”` : category !== 'all' ? category : t(settings.heading)

  return (
    <section className="container page-pad">
      <div className="collection-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="muted">
            {total} {bn ? 'টি পণ্য' : 'products'}
          </p>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
          <option value="newest">{bn ? 'নতুন আগে' : 'Newest'}</option>
          <option value="price-asc">{bn ? 'দাম: কম থেকে বেশি' : 'Price: low to high'}</option>
          <option value="price-desc">{bn ? 'দাম: বেশি থেকে কম' : 'Price: high to low'}</option>
        </select>
      </div>
      {settings.showCategoryFilter && (
        <div className="chips">
          <Link to="/collection/all" className={`chip ${category === 'all' && !search ? 'active' : ''}`}>
            {bn ? 'সব' : 'All'}
          </Link>
          {categories.map((c) => (
            <Link key={c.name} to={`/collection/${encodeURIComponent(c.name)}`} className={`chip ${category === c.name ? 'active' : ''}`}>
              {c.name} <span className="muted">{c.count}</span>
            </Link>
          ))}
        </div>
      )}
      <ProductGrid products={products} loading={loading} />
      {!loading && !products.length && <p className="empty-state">{bn ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</p>}
      {pages > 1 && (
        <div className="pager">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ←
          </button>
          <span>
            {page} / {pages}
          </span>
          <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            →
          </button>
        </div>
      )}
    </section>
  )
}
