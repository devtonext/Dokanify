import { useLocale, type Localized } from '@nexdrop/theme-sdk'

export function RichText({ settings }: { settings: { heading: Localized; body: Localized; width: 'narrow' | 'wide' } }) {
  const { t } = useLocale()
  return (
    <section className={`container section ${settings.width === 'narrow' ? 'narrow' : ''}`}>
      {t(settings.heading) && <h2 className="section-title">{t(settings.heading)}</h2>}
      {/* Plain text with line breaks — never inject merchant HTML */}
      <div className="rich-text">
        {t(settings.body)
          .split(/\n{2,}/)
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </div>
    </section>
  )
}
