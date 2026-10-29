import {
  contentSchema,
  isUnlocked,
  type ThemeContent,
  type ThemeField,
  type ThemeSectionSchema,
  type ThemeSettingsSchema,
} from './spec'

export interface VersionSchemas {
  settingsSchema: ThemeSettingsSchema
  sectionSchemas: Record<string, ThemeSectionSchema>
  defaults: ThemeContent
  manifest: { pages: string[] }
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

/**
 * Validates editor content against a theme version and the store's plan:
 *  - unknown pages / section types are dropped
 *  - fields locked by plan keep their default value
 *  - unknown setting keys are dropped
 */
export function sanitizeContent(input: unknown, version: VersionSchemas, planKey: string): ThemeContent {
  const content = contentSchema.parse(input)
  const out: ThemeContent = { settings: {}, pages: {} }

  const settingsDefaults = version.defaults.settings || {}
  for (const group of version.settingsSchema.groups) {
    for (const field of group.fields) {
      out.settings[field.key] = pick(field, content.settings[field.key], settingsDefaults[field.key], planKey)
    }
  }

  for (const page of version.manifest.pages) {
    const sections = content.pages[page]?.sections || []
    const seen = new Set<string>()
    out.pages[page] = {
      sections: sections
        .filter((s) => {
          const schema = version.sectionSchemas[s.type]
          if (!schema || seen.has(s.id)) return false
          if (schema.pages?.length && !schema.pages.includes(page)) return false
          seen.add(s.id)
          return true
        })
        .map((s) => {
          const schema = version.sectionSchemas[s.type]
          const defaultsFor = findDefaultSection(version.defaults, s.type)
          const settings: Record<string, unknown> = {}
          for (const field of schema.fields) {
            settings[field.key] = pick(field, s.settings[field.key], defaultsFor?.[field.key], planKey)
          }
          return { id: s.id, type: s.type, hidden: Boolean(s.hidden) || undefined, settings }
        })
        // A section whose whole type is locked by plan can't be added — keep only ones present in defaults.
        .filter((s) => isUnlocked(version.sectionSchemas[s.type].minPlan, planKey) || findDefaultSection(version.defaults, s.type)),
    }
  }
  return out
}

function pick(field: ThemeField, value: unknown, fallback: unknown, planKey: string) {
  if (!isUnlocked(field.minPlan, planKey)) return fallback ?? field.default ?? null
  return value === undefined ? (fallback ?? field.default ?? null) : value
}

function findDefaultSection(defaults: ThemeContent, type: string) {
  for (const page of Object.values(defaults.pages || {})) {
    const s = page.sections.find((x) => x.type === type)
    if (s) return s.settings
  }
  return undefined
}

export function initialContent(version: VersionSchemas): ThemeContent {
  return clone(version.defaults)
}
