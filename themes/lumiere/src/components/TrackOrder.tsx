import { useState } from 'react'
import { trackOrder, useApiBase, useLocale } from '@nexdrop/theme-sdk'

const STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export function TrackOrder() {
  const apiBase = useApiBase()
  const { locale, formatPrice } = useLocale()
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')
  const bn = locale === 'bn'

  return (
    <section className="container narrow page-pad">
      <h1 className="page-title">{bn ? 'অর্ডার ট্র্যাক করুন' : 'Track your order'}</h1>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault()
          const f = new FormData(e.currentTarget)
          setError('')
          try {
            setOrder(await trackOrder(apiBase, Number(f.get('number')), String(f.get('phone'))))
          } catch (err) {
            setOrder(null)
            setError((err as Error).message)
          }
        }}
      >
        <input name="number" placeholder={bn ? 'অর্ডার নম্বর' : 'Order number'} required />
        <input name="phone" placeholder={bn ? 'মোবাইল নম্বর' : 'Mobile number'} required />
        <button className="btn">{bn ? 'খুঁজুন' : 'Track'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {order && (
        <div className="card">
          <p>
            <strong>#{order.orderNumber}</strong> · {formatPrice(order.total)}
          </p>
          {order.status === 'CANCELLED' ? (
            <p className="error">Cancelled</p>
          ) : (
            <ol className="steps">
              {STEPS.map((s) => (
                <li key={s} className={STEPS.indexOf(s) <= STEPS.indexOf(order.status) ? 'done' : ''}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </li>
              ))}
            </ol>
          )}
          {order.trackingCode && (
            <p className="muted">
              {order.courier} · {order.trackingCode}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
