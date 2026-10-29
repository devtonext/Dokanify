import { useEffect, useState } from 'react'
import { Link, matchPath, navigate, useAsset, useCart, useLocale, useProduct, useRoute, useThemeSettings, type Localized } from '@nexdrop/theme-sdk'
import { Icon } from '../components/Icons'
import { whatsappUrl, type Settings } from '../types'

type S = { showStock: boolean; deliveryNote: Localized; showWhatsapp: boolean; sizeGuide: string }

export function ProductMain({ settings }: { settings: S }) {
  const { path } = useRoute()
  const slug = matchPath('/product/:slug', path)?.slug
  const { product, loading, error } = useProduct(slug)
  const { t, locale, formatPrice } = useLocale()
  const { whatsapp } = useThemeSettings<Settings>()
  const asset = useAsset()
  const cart = useCart()
  const [image, setImage] = useState(0)
  const [qty, setQty] = useState(1)
  const bn = locale === 'bn'
  useEffect(() => {
    setImage(0)
    setQty(1)
  }, [slug])

  if (loading) return <div className="container page-pad skeleton" style={{ height: 480 }} />
  if (error || !product) return <div className="container empty-state">{bn ? 'পণ্যটি পাওয়া যায়নি' : 'Product not found'}</div>

  return (
    <section className="container page-pad product-page">
      <div className="gallery">
        <div className="gallery-main">{product.images[image] ? <img src={asset(product.images[image])} alt={product.name} /> : <div className="placeholder" />}</div>
        {product.images.length > 1 && (
          <div className="thumbs">
            {product.images.map((src, i) => (
              <button key={src} className={i === image ? 'active' : ''} onClick={() => setImage(i)}>
                <img src={asset(src)} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="product-detail">
        <nav className="crumbs muted">
          <Link to="/">{bn ? 'হোম' : 'Home'}</Link> /{' '}
          {product.category && <Link to={`/collection/${encodeURIComponent(product.category)}`}>{product.category}</Link>}
        </nav>
        <h1>{product.name}</h1>
        <div className="price-row big">
          <span className="price">{formatPrice(product.price)}</span>
          {product.comparePrice && <span className="compare">{formatPrice(product.comparePrice)}</span>}
        </div>
        {settings.showStock && (
          <p className={product.inStock ? 'in-stock' : 'error'}>
            {product.inStock ? (bn ? '✓ স্টকে আছে' : `✓ In stock${product.stock && product.stock < 10 ? ` — only ${product.stock} left` : ''}`) : bn ? 'স্টক শেষ' : 'Sold out'}
          </p>
        )}
        <div className="qty-row">
          <div className="qty">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}>+</button>
          </div>
          <button className="btn" disabled={!product.inStock} onClick={() => cart.add(product, qty)}>
            {bn ? 'কার্টে যোগ করুন' : 'Add to cart'}
          </button>
          <button
            className="btn btn-outline"
            disabled={!product.inStock}
            onClick={() => {
              cart.add(product, qty)
              navigate('/checkout')
            }}
          >
            {bn ? 'এখনই কিনুন' : 'Buy now'}
          </button>
        </div>
        {settings.showWhatsapp && whatsapp && (
          <a className="btn btn-whatsapp full" href={whatsappUrl(whatsapp, `${product.name} — ${formatPrice(product.price)}`)} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" size={18} filled /> {bn ? 'হোয়াটসঅ্যাপে অর্ডার করুন' : 'Order on WhatsApp'}
          </a>
        )}
        {t(settings.deliveryNote) && (
          <p className="delivery-note">
            <Icon name="truck" size={18} /> {t(settings.deliveryNote)}
          </p>
        )}
        {product.description && <p className="description">{product.description}</p>}
        {settings.sizeGuide && (
          <details className="size-guide">
            <summary>{bn ? 'সাইজ গাইড' : 'Size guide'}</summary>
            <img src={asset(settings.sizeGuide)} alt="Size guide" />
          </details>
        )}
      </div>
    </section>
  )
}
