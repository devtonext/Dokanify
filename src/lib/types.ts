// Client-side shapes of API responses (Decimals arrive as numbers, Dates as ISO strings).
import type { PaymentMethodKey } from './bd'
import type { ThemeContent, ThemeManifest, ThemeSectionSchema, ThemeSettingsSchema } from './themes/spec'

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type ThemeStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
export type AdminRole = 'SUPER_ADMIN' | 'THEME_MANAGER' | 'SUPPORT'

export interface Plan {
  id: string
  key: string
  name: string
  rank: number
  priceMonthly: number
  features: string[]
  maxProducts: number | null
  isActive: boolean
  _count?: { stores: number }
}

export interface StoreSummary {
  id: string
  slug: string
  name: string
  ownerName: string
  email: string
  phone: string
  address: string | null
  city: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
  language: string
  createdAt: string
  plan: { key: string; name: string }
  _count: { products: number; orders: number; customers: number }
  themeInstalls: { theme: { name: string } }[]
}

export interface Product {
  id: string
  storeId: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  sku: string
  quantity: number
  images: string[]
  category: string | null
  tags: string[]
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  createdAt: string
  store?: { name: string; slug?: string }
}

export interface Customer {
  id: string
  storeId: string
  name: string
  email: string | null
  phone: string
  address: string | null
  city: string | null
  district: string | null
  notes: string | null
  isBlocked: boolean
  totalSpent: number
  orderCount: number
  lastOrderAt: string | null
  createdAt: string
  store?: { name: string }
}

export interface OrderItem {
  id: string
  productId: string | null
  name: string
  sku: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  storeId: string
  orderNumber: number
  status: OrderStatus
  paymentMethod: PaymentMethodKey
  paymentStatus: PaymentStatus
  transactionId: string | null
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  city: string
  district: string | null
  shippingZone: string | null
  courier: string | null
  trackingCode: string | null
  notes: string | null
  source: string
  createdAt: string
  customer?: { name: string; email: string | null }
  store?: { name: string; slug: string; phone?: string; address?: string | null }
  items?: OrderItem[]
  _count?: { items: number }
}

export interface Paged<T> {
  total: number
  page: number
  limit: number
  items?: T[]
}

export interface ThemeVersionSummary {
  id: string
  version: string
  features: string[]
  coverPath: string | null
  screenshots: string[]
  sizeBytes: number
  fileCount: number
  changelog: string | null
  report: { warnings?: string[] } | null
  createdAt: string
  uploadedBy: { name: string } | null
  coverUrl?: string | null
  screenshotUrls?: (string | null)[]
  previewUrl?: string
  downloadUrl?: string
}

export interface ThemeSummary {
  id: string
  slug: string
  name: string
  niche: string
  description: string | null
  status: ThemeStatus
  price: number
  minPlanKey: string
  featured: boolean
  currentVersionId: string | null
  updatedAt: string
  coverUrl: string | null
  previewUrl: string | null
  currentVersion: (ThemeVersionSummary & { manifest?: ThemeManifest; sectionSchemas?: Record<string, ThemeSectionSchema>; settingsSchema?: ThemeSettingsSchema }) | null
  _count?: { installs: number; versions: number }
}

export interface ThemeDetail extends ThemeSummary {
  versions: ThemeVersionSummary[]
  installs: {
    id: string
    isLive: boolean
    publishedAt: string | null
    updatedAt: string
    store: { id: string; name: string; slug: string }
    version: { version: string }
  }[]
}

export interface ThemeInstallSummary {
  id: string
  isLive: boolean
  publishedAt: string | null
  updatedAt: string
  updateAvailable: boolean
  liveUrl: string
  store: { id: string; name: string; slug: string }
  version: { version: string }
  theme: { id: string; name: string; slug: string; niche: string; coverUrl: string | null; previewUrl: string | null }
}

export interface ThemeInstallDetail {
  id: string
  isLive: boolean
  publishedAt: string | null
  updatedAt: string
  draftContent: ThemeContent
  previewUrl: string
  themeBase: string
  updateAvailable: boolean
  store: { id: string; name: string; slug: string; plan: { key: string; name: string; features: string[] } }
  theme: { id: string; name: string; slug: string }
  version: {
    id: string
    version: string
    features: string[]
    manifest: ThemeManifest
    settingsSchema: ThemeSettingsSchema
    sectionSchemas: Record<string, ThemeSectionSchema>
    defaults: ThemeContent
  }
}

export interface ImportReport {
  ok: boolean
  errors: string[]
  warnings: string[]
  manifest?: ThemeManifest
  stats: { files: number; bytes: number; distFiles: number }
  themeId?: string
  isNewTheme?: boolean
  becameCurrent?: boolean
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  href: string | null
  read: boolean
  createdAt: string
}
