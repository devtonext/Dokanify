import { useLocale, useThemeSettings, type Localized } from '@nexdrop/theme-sdk'
import { Icon } from '../components/Icons'
import { whatsappUrl, type Settings } from '../types'

export function WhatsappCta({ settings }: { settings: { heading: Localized; text: Localized; buttonLabel: Localized; message: Localized } }) {
  const { t } = useLocale()
  const { whatsapp } = useThemeSettings<Settings>()
  if (!whatsapp) return null
  return (
    <section className="container section">
      <div className="whatsapp-cta">
        <div>
          <h2>{t(settings.heading)}</h2>
          <p>{t(settings.text)}</p>
        </div>
        <a className="btn btn-whatsapp" href={whatsappUrl(whatsapp, t(settings.message))} target="_blank" rel="noreferrer">
          <Icon name="whatsapp" size={18} filled /> {t(settings.buttonLabel)}
        </a>
      </div>
    </section>
  )
}
