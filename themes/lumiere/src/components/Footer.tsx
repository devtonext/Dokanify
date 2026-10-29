import { Link, useLocale, useStore, useThemeSettings } from '@nexdrop/theme-sdk'
import { whatsappUrl, type Settings } from '../types'
import { Icon } from './Icons'

export function Footer() {
  const s = useThemeSettings<Settings>()
  const { t, locale } = useLocale()
  const { store, data } = useStore()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3 className="footer-brand">{store?.name}</h3>
          <p className="muted">{t(s.footerAbout)}</p>
          <div className="socials">
            {s.facebook && (
              <a href={s.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                <Icon name="facebook" />
              </a>
            )}
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <Icon name="instagram" />
              </a>
            )}
            {s.youtube && (
              <a href={s.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                <Icon name="youtube" />
              </a>
            )}
            {s.whatsapp && (
              <a href={whatsappUrl(s.whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <Icon name="whatsapp" />
              </a>
            )}
          </div>
        </div>
        <div>
          <h4>{locale === 'bn' ? 'লিংক' : 'Links'}</h4>
          <ul className="footer-links">
            {(s.footerLinks || []).map((l, i) => (
              <li key={i}>
                <Link to={l.link || '/'}>{t(l.label)}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{locale === 'bn' ? 'যোগাযোগ' : 'Contact'}</h4>
          <p className="muted">{store?.phone}</p>
          <p className="muted">{store?.email}</p>
          <p className="muted">{[store?.address, store?.city].filter(Boolean).join(', ')}</p>
          {s.showPaymentIcons && data && (
            <div className="pay-icons">
              {data.payments.map((p) => (
                <span key={p.method} className={`pay pay-${p.method.toLowerCase()}`}>
                  {p.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="container copyright">
        © {year} {store?.name}. {t(s.copyright)}
      </div>
    </footer>
  )
}
