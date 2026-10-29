import { Link, useAsset, useCart, useLocale, type Localized } from '@nexdrop/theme-sdk'

export function CartMain({ settings }: { settings: { heading: Localized; emptyText: Localized; note: Localized } }) {
  const { t, formatPrice, locale } = useLocale()
  const cart = useCart()
  const asset = useAsset()
  const bn = locale === 'bn'

  return (
    <section className="container narrow page-pad">
      <h1 className="page-title">{t(settings.heading)}</h1>
      {!cart.items.length ? (
        <div className="empty-state">
          <p>{t(settings.emptyText)}</p>
          <Link to="/collection/all" className="btn">
            {bn ? 'কেনাকাটা করুন' : 'Continue shopping'}
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-lines">
            {cart.items.map((item) => (
              <div key={item.productId} className="cart-line">
                {item.image ? <img src={asset(item.image)} alt="" /> : <div className="placeholder" />}
                <div className="grow">
                  <Link to={`/product/${item.slug}`}>{item.name}</Link>
                  <p className="muted">{formatPrice(item.price)}</p>
                </div>
                <div className="qty">
                  <button onClick={() => cart.update(item.productId, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => cart.update(item.productId, item.quantity + 1)}>+</button>
                </div>
                <strong className="line-total">{formatPrice(item.price * item.quantity)}</strong>
                <button className="link muted" onClick={() => cart.remove(item.productId)}>
                  {bn ? 'বাদ দিন' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <div className="row">
              <span>{bn ? 'সাবটোটাল' : 'Subtotal'}</span>
              <strong>{formatPrice(cart.subtotal)}</strong>
            </div>
            <p className="muted">{t(settings.note)}</p>
            <Link to="/checkout" className="btn full">
              {bn ? 'চেকআউট' : 'Checkout'}
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
