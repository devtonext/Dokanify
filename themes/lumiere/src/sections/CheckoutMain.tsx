import { useState } from 'react'
import { Link, useCart, useCheckout, useLocale, type CheckoutForm, type Localized, type PlacedOrder } from '@nexdrop/theme-sdk'

type S = { heading: Localized; requireEmail: boolean; successMessage: Localized }

export function CheckoutMain({ settings }: { settings: S }) {
  const { t, formatPrice, locale } = useLocale()
  const cart = useCart()
  const checkout = useCheckout()
  const [district, setDistrict] = useState('Dhaka')
  const [method, setMethod] = useState<CheckoutForm['paymentMethod'] | ''>('')
  const [placed, setPlaced] = useState<PlacedOrder | null>(null)
  const bn = locale === 'bn'
  const chosen = method || checkout.paymentMethods[0]?.method || 'COD'
  const shipping = checkout.shippingFor(district, chosen)

  if (placed) {
    return (
      <section className="container narrow page-pad center">
        <h1 className="page-title">{bn ? 'অর্ডার সম্পন্ন হয়েছে!' : 'Order placed!'}</h1>
        <p>
          {bn ? 'অর্ডার নম্বর' : 'Order number'}: <strong>#{placed.order.number}</strong> · {formatPrice(placed.order.total)}
        </p>
        <p className="muted">{t(settings.successMessage)}</p>
        <Link to="/track" className="btn btn-outline">
          {bn ? 'অর্ডার ট্র্যাক করুন' : 'Track order'}
        </Link>
      </section>
    )
  }

  if (!cart.items.length) {
    return (
      <section className="container narrow page-pad empty-state">
        <p>{bn ? 'আপনার কার্ট খালি।' : 'Your cart is empty.'}</p>
        <Link to="/collection/all" className="btn">
          {bn ? 'কেনাকাটা করুন' : 'Shop now'}
        </Link>
      </section>
    )
  }

  return (
    <section className="container page-pad checkout">
      <form
        className="checkout-form"
        onSubmit={async (e) => {
          e.preventDefault()
          const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
          try {
            setPlaced(
              await checkout.placeOrder({
                name: f.name,
                phone: f.phone,
                email: f.email || undefined,
                address: f.address,
                city: f.city || district,
                district,
                paymentMethod: chosen,
                notes: f.notes || undefined,
              })
            )
          } catch {
            /* error shown below */
          }
        }}
      >
        <h1 className="page-title">{t(settings.heading)}</h1>
        {!checkout.enabled && <p className="notice">{bn ? 'প্রিভিউ মোডে অর্ডার করা যাবে না।' : 'Checkout is disabled in preview mode.'}</p>}
        <div className="form-grid">
          <label>
            {bn ? 'নাম' : 'Full name'}
            <input name="name" required autoComplete="name" />
          </label>
          <label>
            {bn ? 'মোবাইল নম্বর' : 'Mobile number'}
            <input name="phone" required inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" />
          </label>
          {settings.requireEmail && (
            <label className="span-2">
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
          )}
          <label>
            {bn ? 'জেলা' : 'District'}
            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
              {checkout.districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            {bn ? 'থানা / এলাকা' : 'Thana / area'}
            <input name="city" placeholder={district} />
          </label>
          <label className="span-2">
            {bn ? 'পূর্ণ ঠিকানা' : 'Full address'}
            <textarea name="address" required rows={2} placeholder={bn ? 'বাসা, রোড, এলাকা' : 'House, road, area'} />
          </label>
          <label className="span-2">
            {bn ? 'নোট (ঐচ্ছিক)' : 'Notes (optional)'}
            <input name="notes" />
          </label>
        </div>

        <h3>{bn ? 'পেমেন্ট পদ্ধতি' : 'Payment method'}</h3>
        <div className="pay-options">
          {checkout.paymentMethods.map((p) => (
            <label key={p.method} className={`pay-option ${chosen === p.method ? 'active' : ''}`}>
              <input type="radio" name="payment" checked={chosen === p.method} onChange={() => setMethod(p.method)} />
              <span className={`pay pay-${p.method.toLowerCase()}`}>{p.label}</span>
            </label>
          ))}
        </div>
        {checkout.error && <p className="error">{checkout.error}</p>}
        <button className="btn full" disabled={checkout.placing || !checkout.enabled}>
          {checkout.placing ? '…' : `${bn ? 'অর্ডার নিশ্চিত করুন' : 'Place order'} · ${formatPrice(cart.subtotal + shipping)}`}
        </button>
      </form>

      <aside className="order-summary">
        {cart.items.map((i) => (
          <div key={i.productId} className="row">
            <span>
              {i.name} × {i.quantity}
            </span>
            <span>{formatPrice(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="row">
          <span>{bn ? 'ডেলিভারি' : 'Delivery'}</span>
          <span>{formatPrice(shipping)}</span>
        </div>
        <div className="row total">
          <span>{bn ? 'মোট' : 'Total'}</span>
          <span>{formatPrice(cart.subtotal + shipping)}</span>
        </div>
      </aside>
    </section>
  )
}
