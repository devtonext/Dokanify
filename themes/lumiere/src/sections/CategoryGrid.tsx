import { Link, useAsset, useLocale, type Localized } from '@nexdrop/theme-sdk'

type S = { heading: Localized; columns: string; categories: { title: Localized; image: string; collection: string }[] }

export function CategoryGrid({ settings }: { settings: S }) {
  const { t } = useLocale()
  const asset = useAsset()
  return (
    <section className="container section">
      {t(settings.heading) && <h2 className="section-title">{t(settings.heading)}</h2>}
      <div className="category-grid" style={{ ['--cols' as string]: Number(settings.columns) || 4 }}>
        {(settings.categories || []).map((c, i) => (
          <Link key={i} to={`/collection/${encodeURIComponent(c.collection || 'all')}`} className="category-card">
            {c.image && <img src={asset(c.image)} alt="" loading="lazy" />}
            <span>{t(c.title)}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
