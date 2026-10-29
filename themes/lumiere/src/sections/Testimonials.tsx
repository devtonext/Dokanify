import { useLocale, type Localized } from '@nexdrop/theme-sdk'
import { Icon } from '../components/Icons'

type S = { heading: Localized; items: { quote: Localized; name: string; location: string; rating: number }[] }

export function Testimonials({ settings }: { settings: S }) {
  const { t } = useLocale()
  return (
    <section className="container section">
      {t(settings.heading) && <h2 className="section-title center">{t(settings.heading)}</h2>}
      <div className="reviews">
        {(settings.items || []).map((r, i) => (
          <figure key={i} className="review">
            <div className="stars">
              {Array.from({ length: 5 }).map((_, s) => (
                <span key={s} className={s < (r.rating || 5) ? 'on' : ''}>
                  <Icon name="star" size={14} filled />
                </span>
              ))}
            </div>
            <blockquote>“{t(r.quote)}”</blockquote>
            <figcaption>
              {r.name} {r.location && <span className="muted">· {r.location}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
