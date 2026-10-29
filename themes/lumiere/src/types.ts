import type { Localized } from '@nexdrop/theme-sdk'

/** Shape of schema/settings.json values. */
export interface Settings {
  colorPrimary: string
  colorAccent: string
  colorBackground: string
  colorText: string
  fontHeading: string
  fontBody: string
  fontBangla: string
  radius: number
  logo: string
  logoWidth: number
  menu: { label: Localized; link: string }[]
  stickyHeader: boolean
  announcementEnabled: boolean
  announcementText: Localized
  announcementLink: string
  announcementBg: string
  footerAbout: Localized
  footerLinks: { label: Localized; link: string }[]
  showPaymentIcons: boolean
  copyright: Localized
  facebook: string
  instagram: string
  youtube: string
  whatsapp: string
}

export function whatsappUrl(number: string, message = '') {
  const digits = number.replace(/\D/g, '').replace(/^0/, '880')
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
