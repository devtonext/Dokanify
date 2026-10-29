import { Link, useAsset, useCart, useLocale, type Product } from '@nexdrop/theme-sdk'

export function ProductCard({ product }: { product: Product }) {
  const { formatPrice, locale } = useLocale()
  const asset = useAsset()
  const cart = useCart()
  const off = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0

  return (
    <article className="product-card">
      <Link to={`/product/${product.slug}`} className="product-image">
        {product.images[0] ? <img src={asset(product.images[0])} alt={product.name} loading="lazy" /> : <div className="placeholder" />}
        {off > 0 && <span className="sale-badge">-{off}%</span>}
        {!product.inStock && <span className="soldout">{locale === 'bn' ? 'স্টক শেষ' : 'Sold out'}</span>}
      </Link>
      <div className="product-info">
        <Link to={`/product/${product.slug}`} className="product-name">
          {product.name}
        </Link>
        <div className="price-row">
          <span className="price">{formatPrice(product.price)}</span>
          {product.comparePrice && <span className="compare">{formatPrice(product.comparePrice)}</span>}
        </div>
        <button className="btn btn-outline btn-sm" disabled={!product.inStock} onClick={() => cart.add(product)}>
          {locale === 'bn' ? 'কার্টে যোগ করুন' : 'Add to cart'}
        </button>
      </div>
    </article>
  )
}

export function ProductGrid({ products, loading, columns = 4 }: { products: Product[]; loading?: boolean; columns?: number }) {
  if (loading && !products.length) {
    return (
      <div className="product-grid" style={{ ['--cols' as string]: columns }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="product-card skeleton" />
        ))}
      </div>
    )
  }
  return (
    <div className="product-grid" style={{ ['--cols' as string]: columns }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
