import { z } from 'zod'

const gateway = z.object({
  enabled: z.boolean().default(false),
  merchant: z.string().max(40).default(''),
  apiKey: z.string().max(400).default(''),
  secret: z.string().max(400).default(''),
  username: z.string().max(80).default(''),
  password: z.string().max(400).default(''),
  sandbox: z.boolean().default(true),
})

const zone = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  enabled: z.boolean().default(true),
  rate: z.number().min(0).max(100000),
  time: z.string().max(60).default(''),
  /** Districts covered. Empty on the "outside" zone means "everything else". */
  districts: z.array(z.string()).default([]),
})

export const storeSettingsSchema = z.object({
  taxIncluded: z.boolean().default(true),
  payments: z
    .object({
      bkash: gateway.prefault({}),
      nagad: gateway.prefault({}),
      rocket: gateway.prefault({}),
      sslcommerz: gateway.prefault({}),
      cod: z
        .object({
          enabled: z.boolean().default(true),
          fee: z.number().min(0).default(0),
          maxAmount: z.number().min(0).default(20000),
        })
        .prefault({}),
    })
    .prefault({}),
  shipping: z
    .object({
      zones: z.array(zone).default([
        { id: 'dhaka', name: 'Inside Dhaka', enabled: true, rate: 60, time: '1-2 days', districts: ['Dhaka'] },
        { id: 'outside', name: 'Outside Dhaka', enabled: true, rate: 120, time: '3-5 days', districts: [] },
      ]),
      freeShippingOver: z.number().min(0).nullable().default(null),
      courier: z.string().default(''),
    })
    .prefault({}),
  notifications: z
    .object({
      newOrder: z.boolean().default(true),
      statusUpdate: z.boolean().default(true),
      lowStock: z.boolean().default(true),
      lowStockThreshold: z.number().int().min(0).default(10),
      customerSms: z.boolean().default(false),
      customerEmail: z.boolean().default(true),
    })
    .prefault({}),
})

export type StoreSettings = z.infer<typeof storeSettingsSchema>

export const SECRET_FIELDS = ['apiKey', 'secret', 'password'] as const
export const GATEWAYS = ['bkash', 'nagad', 'rocket', 'sslcommerz'] as const

export function parseStoreSettings(raw: unknown): StoreSettings {
  return storeSettingsSchema.parse(raw ?? {})
}

/** Picks the shipping zone for a district (explicit match first, then the catch-all zone). */
export function resolveZone(settings: StoreSettings, district?: string | null) {
  const zones = settings.shipping.zones.filter((z) => z.enabled)
  const d = (district || '').toLowerCase()
  return (
    zones.find((z) => z.districts.some((x) => x.toLowerCase() === d)) ||
    zones.find((z) => z.districts.length === 0) ||
    zones[0] ||
    null
  )
}
