import { Link, useAsset, useLocale, type Localized } from '@nexdrop/theme-sdk'

type S = { image: string; eyebrow: Localized; heading: Localized; text: Localized; buttonLabel: Localized; buttonLink: string; layout: 'left' | 'right'; background: string }

export function PromoBanner({ settings }: { settings: S }) {
  const { t } = useLocale()
  const asset = useAsset()
  return (
    <section className="section">
      <div className={`container promo ${settings.layout === 'right' ? 'reverse' : ''}`} style={{ background: settings.background }}>
        {settings.image && <img src={asset(settings.image)} alt="" loading="lazy" />}
        <div className="promo-body">
          {t(settings.eyebrow) && <span className="eyebrow">{t(settings.eyebrow)}</span>}
          <h2>{t(settings.heading)}</h2>
          {t(settings.text) && <p>{t(settings.text)}</p>}
          {t(settings.buttonLabel) && (
            <Link to={settings.buttonLink || '/collection/all'} className="btn">
              {t(settings.buttonLabel)}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
