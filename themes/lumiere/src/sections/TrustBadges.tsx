import { useLocale, type Localized } from '@nexdrop/theme-sdk'
import { Icon } from '../components/Icons'

export function TrustBadges({ settings }: { settings: { items: { icon: string; title: Localized; text: Localized }[] } }) {
  const { t } = useLocale()
  return (
    <section className="container trust">
      {(settings.items || []).map((item, i) => (
        <div key={i} className="trust-item">
          <span className="trust-icon">
            <Icon name={item.icon} size={22} />
          </span>
          <div>
            <strong>{t(item.title)}</strong>
            <p className="muted">{t(item.text)}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
