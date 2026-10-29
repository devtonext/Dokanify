/**
 * NexDrop Theme Spec v1 — the contract every uploaded theme zip must follow.
 * Shared by the upload validator, the editor (form generation) and the SDK.
 * Human-readable version: docs/THEME_SPEC.md
 */
import { z } from 'zod'

export const SPEC_VERSION = '1'

export const KNOWN_FEATURES = [
  'catalog',
  'cart',
  'checkout',
  'search',
  'cod',
  'bkash',
  'nagad',
  'rocket',
  'sslcommerz',
  'bilingual',
  'blog',
  'wishlist',
  'reviews',
  'order-tracking',
  'custom-domain',
] as const
export type ThemeFeature = (typeof KNOWN_FEATURES)[number]

export const NICHES = [
  'fashion',
  'electronics',
  'grocery',
  'food',
  'beauty',
  'furniture',
  'kids',
  'sports',
  'books',
  'handmade',
  'jewellery',
  'pharmacy',
  'general',
] as const

export const FIELD_TYPES = [
  'text',
  'textarea',
  'richtext',
  'image',
  'gallery',
  'color',
  'font',
  'select',
  'toggle',
  'number',
  'range',
  'link',
  'product',
  'collection',
  'list',
] as const
export type FieldType = (typeof FIELD_TYPES)[number]

const keyRegex = /^[a-z][a-zA-Z0-9_]*$/
const planKey = z.enum(['free', 'pro', 'business'])

type FieldInput = {
  key: string
  type: FieldType
  label: string
  help?: string
  default?: unknown
  localized?: boolean
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  maxItems?: number
  fields?: FieldInput[]
  minPlan?: 'free' | 'pro' | 'business'
}

export const fieldSchema: z.ZodType<FieldInput> = z.lazy(() =>
  z
    .object({
      key: z.string().regex(keyRegex, 'keys must be camelCase, start with a letter'),
      type: z.enum(FIELD_TYPES),
      label: z.string().min(1).max(80),
      help: z.string().max(240).optional(),
      default: z.unknown().optional(),
      localized: z.boolean().optional(),
      options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().optional(),
      maxItems: z.number().int().positive().max(50).optional(),
      fields: z.array(fieldSchema).optional(),
      minPlan: planKey.optional(),
    })
    .superRefine((f, ctx) => {
      if (f.type === 'select' && !f.options?.length) {
        ctx.addIssue({ code: 'custom', message: `select field "${f.key}" needs options` })
      }
      if (f.type === 'list' && !f.fields?.length) {
        ctx.addIssue({ code: 'custom', message: `list field "${f.key}" needs fields` })
      }
      if (f.type !== 'list' && f.fields) {
        ctx.addIssue({ code: 'custom', message: `only list fields may have nested fields ("${f.key}")` })
      }
    })
)
export type ThemeField = z.infer<typeof fieldSchema>

export const sectionSchema = z.object({
  type: z.string().regex(/^[a-z][a-z0-9-]*$/, 'section type must be kebab-case'),
  label: z.string().min(1).max(80),
  description: z.string().max(240).optional(),
  minPlan: planKey.optional(),
  /** Which page templates this section may be added to. Empty = all. */
  pages: z.array(z.string()).optional(),
  /** Only one instance allowed per page (e.g. header/footer). */
  unique: z.boolean().optional(),
  fields: z.array(fieldSchema).max(60),
})
export type ThemeSectionSchema = z.infer<typeof sectionSchema>

export const settingsSchema = z.object({
  groups: z
    .array(
      z.object({
        id: z.string().regex(keyRegex),
        label: z.string(),
        fields: z.array(fieldSchema),
      })
    )
    .min(1),
})
export type ThemeSettingsSchema = z.infer<typeof settingsSchema>

export const manifestSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, 'id must be lowercase kebab-case, 3-50 chars'),
  name: z.string().min(2).max(60),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'version must be semver, e.g. 1.0.0'),
  niche: z.enum(NICHES),
  description: z.string().max(500).optional(),
  author: z.string().max(80).optional(),
  sdkVersion: z.literal(SPEC_VERSION),
  features: z.array(z.enum(KNOWN_FEATURES)).min(1),
  pages: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).min(1),
  sections: z.array(z.string()).min(1),
  minPlan: planKey.default('free'),
  changelog: z.string().max(2000).optional(),
})
export type ThemeManifest = z.infer<typeof manifestSchema>

// ─── Content (what the editor saves and the SDK reads) ───────────────────────

export type Localized = { en?: string; bn?: string }

export const sectionInstanceSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.string(),
  hidden: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()),
})
export type SectionInstance = z.infer<typeof sectionInstanceSchema>

export const contentSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
  pages: z.record(z.string(), z.object({ sections: z.array(sectionInstanceSchema).max(40) })),
})
export type ThemeContent = z.infer<typeof contentSchema>

// ─── Plan gating ─────────────────────────────────────────────────────────────

export const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2 }

export function isUnlocked(minPlan: string | undefined, planKey: string) {
  return (PLAN_RANK[planKey] ?? 0) >= (PLAN_RANK[minPlan || 'free'] ?? 0)
}

/** Default value for a field when neither content nor defaults provide one. */
export function emptyValue(field: ThemeField): unknown {
  if (field.default !== undefined) return field.default
  switch (field.type) {
    case 'toggle':
      return false
    case 'number':
    case 'range':
      return field.min ?? 0
    case 'gallery':
    case 'list':
      return []
    case 'select':
      return field.options?.[0]?.value ?? ''
    default:
      return field.localized ? { en: '', bn: '' } : ''
  }
}
