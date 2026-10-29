import { useState } from 'react'
import { Link, navigate, useAsset, useCart, useFeature, useLocale, useStore, useThemeSettings } from '@nexdrop/theme-sdk'
import type { Settings } from '../types'
import { Icon } from './Icons'

export function Header() {
  const s = useThemeSettings<Settings>()
  const { t, locale, setLocale } = useLocale()
  const { store } = useStore()
  const { count } = useCart()
  const asset = useAsset()
  const bilingual = useFeature('bilingual')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <>
      {s.announcementEnabled && t(s.announcementText) && (
        <Link to={s.announcementLink || '/'} className="announcement" style={{ background: s.announcementBg }}>
          {t(s.announcementText)}
        </Link>
      )}
      <header className={`site-header ${s.stickyHeader ? 'sticky' : ''}`}>
        <div className="container header-inner">
          <button className="icon-btn mobile-only" onClick={() => setOpen(!open)} aria-label="Menu">
            <Icon name={open ? 'close' : 'menu'} />
          </button>
          <Link to="/" className="logo">
            {s.logo ? <img src={asset(s.logo)} alt={store?.name} style={{ width: s.logoWidth || 120 }} /> : <span>{store?.name || 'Lumière'}</span>}
          </Link>
          <nav className={`main-nav ${open ? 'open' : ''}`}>
            {(s.menu || []).map((item, i) => (
              <Link key={i} to={item.link || '/'} onClick={() => setOpen(false)}>
                {t(item.label)}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <form
              className="search desktop-only"
              onSubmit={(e) => {
                e.preventDefault()
                if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
              }}
            >
              <Icon name="search" size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={locale === 'bn' ? 'খুঁজুন…' : 'Search…'} aria-label="Search" />
            </form>
            {bilingual && (
              <button className="lang" onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}>
                {locale === 'en' ? 'বাংলা' : 'EN'}
              </button>
            )}
            <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart">
              <Icon name="cart" />
              {count > 0 && <span className="badge">{count}</span>}
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
