/**
 * Pure theme-zip validator & Universal React + Vite Auto-Adapter.
 *
 * Supports two kinds of uploads seamlessly:
 *  1. Native `@nexdrop/theme-sdk` packages with `theme.json`, `schema/`, `defaults/`, and `dist/`.
 *  2. Standard / unmodified React + Vite build zips (`dist/index.html` or root `index.html`):
 *     The Auto-Adapter automatically normalises root `index.html` into `dist/`, rewrites
 *     absolute `/assets/...` paths to relative `./assets/...` paths, and synthesises
 *     `theme.json`, `schema/settings.json`, `schema/sections/universal-stage.json`, and
 *     `defaults/content.json` so the theme works out of the box without code modifications.
 */
import { unzipSync, type UnzipFileInfo } from 'fflate'
import { posix } from 'path'
import { ZodError, type ZodType } from 'zod'
import {
  contentSchema,
  manifestSchema,
  sectionSchema,
  settingsSchema,
  type ThemeContent,
  type ThemeManifest,
  type ThemeSectionSchema,
  type ThemeSettingsSchema,
} from './spec'

export const LIMITS = {
  maxFiles: 3000,
  maxUncompressedBytes: 400 * 1024 * 1024,
  maxFileBytes: 30 * 1024 * 1024,
  maxRatio: 200, // zip-bomb guard: uncompressed / compressed per entry
}

/** Files that may be served from dist/ (anything else is rejected). */
const DIST_EXTENSIONS = new Set([
  'html', 'css', 'js', 'mjs', 'json', 'map', 'txt', 'xml', 'webmanifest',
  'svg', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'ico',
  'woff', 'woff2', 'ttf', 'otf', 'mp4', 'webm', 'mp3',
])

/** Never allowed anywhere in the package. */
const BLOCKED_EXTENSIONS = new Set([
  'php', 'phtml', 'sh', 'bash', 'exe', 'dll', 'so', 'bat', 'cmd', 'ps1', 'jar', 'py', 'rb', 'pl', 'cgi', 'htaccess',
])

const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json',
  map: 'application/json',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml',
  webmanifest: 'application/manifest+json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  zip: 'application/zip',
}

export function mimeFor(path: string) {
  return MIME[ext(path)] || 'application/octet-stream'
}

function ext(path: string) {
  const base = path.split('/').pop() || ''
  const i = base.lastIndexOf('.')
  return i > 0 ? base.slice(i + 1).toLowerCase() : base.startsWith('.') ? base.slice(1).toLowerCase() : ''
}

export interface ValidationResult {
  ok: boolean
  autoAdapted?: boolean
  errors: string[]
  warnings: string[]
  manifest?: ThemeManifest
  settingsSchema?: ThemeSettingsSchema
  sectionSchemas?: Record<string, ThemeSectionSchema>
  defaults?: ThemeContent
  /** Normalised path → bytes (only when ok). */
  files?: Map<string, Uint8Array>
  stats: { files: number; bytes: number; distFiles: number }
  cover?: string
  screenshots: string[]
  hasSource: boolean
}

function safePath(raw: string): string | null {
  const name = raw.replace(/\\/g, '/')
  if (name.includes('\0') || name.startsWith('/') || /^[a-zA-Z]:/.test(name)) return null
  const norm = posix.normalize(name)
  if (norm.startsWith('..') || norm.split('/').includes('..')) return null
  return norm
}

function isJunk(path: string) {
  return path.startsWith('__MACOSX/') || path.split('/').some((p) => p === '.DS_Store' || p === 'Thumbs.db' || p === 'node_modules' || p === '.git')
}

function formatZod(file: string, error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.slice(0, 5).map((i) => `${file}: ${i.path.join('.') || '(root)'} — ${i.message}`)
  }
  if (error instanceof SyntaxError) return [`${file}: invalid JSON — ${error.message}`]
  return [`${file}: ${(error as Error).message}`]
}

const encodeJson = (obj: unknown) => new TextEncoder().encode(JSON.stringify(obj, null, 2))

/**
 * Synthesises NexDrop manifest, settings schema, section schema, and default content
 * when a merchant or developer uploads an unmodified React + Vite zip without NexDrop schemas.
 */
function synthesizeUniversalThemeFiles(files: Map<string, Uint8Array>, htmlTitle?: string) {
  const cleanTitle = (htmlTitle || 'Custom React Vite Theme').trim().slice(0, 50)
  const slugBase = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36) || 'react-vite-theme'

  if (!files.has('theme.json')) {
    const manifest: ThemeManifest = {
      id: `${slugBase}-${Date.now().toString(36).slice(-4)}`,
      name: cleanTitle,
      version: '1.0.0',
      niche: 'general',
      description: 'Auto-adapted React + Vite storefront powered by the NexDrop Universal Runtime Bridge.',
      author: 'Merchant Custom Upload',
      sdkVersion: '1',
      features: ['catalog', 'cart', 'checkout', 'search', 'cod', 'bkash', 'nagad', 'bilingual', 'order-tracking'],
      pages: ['home', 'collection', 'product', 'cart', 'checkout'],
      sections: ['universal-stage'],
      minPlan: 'free',
      changelog: 'Auto-adapted from standard React + Vite bundle.',
    }
    files.set('theme.json', encodeJson(manifest))
  }

  if (!files.has('schema/settings.json')) {
    const settings: ThemeSettingsSchema = {
      groups: [
        {
          id: 'colors',
          label: 'Brand Colors & CSS Variables',
          fields: [
            { key: 'colorPrimary', type: 'color', label: 'Primary Brand Color (--primary)', default: '#1f2937' },
            { key: 'colorAccent', type: 'color', label: 'Accent / CTA Color (--accent)', default: '#4f46e5' },
            { key: 'colorBackground', type: 'color', label: 'Background Surface (--bg)', default: '#ffffff' },
            { key: 'colorText', type: 'color', label: 'Body Text Color (--text)', default: '#0f172a' },
          ],
        },
        {
          id: 'bridge',
          label: 'Universal Storefront Bridge',
          fields: [
            { key: 'autoHydrateProducts', type: 'toggle', label: 'Auto-hydrate product cards with store catalog', default: true },
            { key: 'enableUniversalCheckout', type: 'toggle', label: 'Enable slide-over Bangladesh Checkout drawer', default: true },
            { key: 'announcementEnabled', type: 'toggle', label: 'Show top announcement bar', default: true },
            { key: 'announcementText', type: 'text', label: 'Announcement text', localized: true, default: { en: 'Nationwide delivery across 64 districts · Cash on delivery & bKash available', bn: 'সারা বাংলাদেশে ৬৪ জেলায় ডেলিভারি · ক্যাশ অন ডেলিভারি ও বিকাশ সুবিধা' } },
            { key: 'whatsapp', type: 'text', label: 'WhatsApp quick-order number', default: '01712345678' },
          ],
        },
      ],
    }
    files.set('schema/settings.json', encodeJson(settings))
  }

  if (!files.has('schema/sections/universal-stage.json')) {
    const sec: ThemeSectionSchema = {
      type: 'universal-stage',
      label: 'React + Vite App Stage (Auto-Adapted)',
      description: 'Binds your React + Vite storefront components to live products, BDT pricing, and point-and-click DOM overrides.',
      fields: [
        { key: 'heading', type: 'text', label: 'Primary Hero Heading Override', localized: true },
        { key: 'subheading', type: 'textarea', label: 'Hero Subheading Override', localized: true },
        { key: 'buttonLabel', type: 'text', label: 'Primary CTA Button Label', localized: true },
      ],
    }
    files.set('schema/sections/universal-stage.json', encodeJson(sec))
  }

  if (!files.has('defaults/content.json')) {
    const defaults: ThemeContent = {
      settings: {
        colorPrimary: '#1f2937',
        colorAccent: '#4f46e5',
        colorBackground: '#ffffff',
        colorText: '#0f172a',
        autoHydrateProducts: true,
        enableUniversalCheckout: true,
        announcementEnabled: true,
        announcementText: {
          en: 'Nationwide delivery across 64 districts · Cash on delivery & bKash available',
          bn: 'সারা বাংলাদেশে ৬৪ জেলায় ডেলিভারি · ক্যাশ অন ডেলিভারি ও বিকাশ সুবিধা',
        },
        whatsapp: '01712345678',
      },
      pages: {
        home: {
          sections: [
            {
              id: 'universal-main',
              type: 'universal-stage',
              settings: {
                heading: { en: cleanTitle, bn: cleanTitle },
                subheading: { en: 'Powered by NexDrop Universal React + Vite Bridge', bn: 'নেক্সড্রপ ইউনিভার্সাল ব্রিজ দ্বারা চালিত' },
                buttonLabel: { en: 'Shop Now', bn: 'এখনই কিনুন' },
              },
            },
          ],
        },
        collection: { sections: [] },
        product: { sections: [] },
        cart: { sections: [] },
        checkout: { sections: [] },
      },
    }
    files.set('defaults/content.json', encodeJson(defaults))
  }
}

export function validateThemeZip(zip: Uint8Array): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const result: ValidationResult = {
    ok: false,
    autoAdapted: false,
    errors,
    warnings,
    stats: { files: 0, bytes: 0, distFiles: 0 },
    screenshots: [],
    hasSource: false,
  }

  // ── 1. Unpack with zip-slip / zip-bomb protection ──
  let count = 0
  let total = 0
  let raw: Record<string, Uint8Array>
  try {
    raw = unzipSync(zip, {
      filter(file: UnzipFileInfo) {
        if (file.name.endsWith('/')) return false
        const path = safePath(file.name)
        if (!path) {
          errors.push(`Unsafe path in zip: ${file.name}`)
          return false
        }
        if (isJunk(path)) return false
        count++
        total += file.originalSize
        if (file.originalSize > LIMITS.maxFileBytes) {
          errors.push(`${path} is larger than ${LIMITS.maxFileBytes / 1024 / 1024} MB`)
          return false
        }
        if (file.size > 0 && file.originalSize / file.size > LIMITS.maxRatio && file.originalSize > 1024 * 1024) {
          errors.push(`${path} has a suspicious compression ratio`)
          return false
        }
        if (count > LIMITS.maxFiles || total > LIMITS.maxUncompressedBytes) return false
        return true
      },
    })
  } catch (error) {
    errors.push(`Could not read zip: ${(error as Error).message}`)
    return result
  }
  if (count > LIMITS.maxFiles) errors.push(`Too many files (${count} > ${LIMITS.maxFiles})`)
  if (total > LIMITS.maxUncompressedBytes) errors.push('Package is too large once extracted')
  if (errors.length) return result

  // ── 2. Strip a single wrapping folder (my-theme/theme.json or my-theme/index.html) ──
  let entries = Object.entries(raw).map(([name, data]) => [safePath(name)!, data] as const)
  if (!entries.some(([p]) => p === 'theme.json' || p === 'dist/index.html' || p === 'index.html')) {
    const roots = new Set(entries.map(([p]) => p.split('/')[0]))
    if (roots.size === 1) {
      const root = [...roots][0] + '/'
      entries = entries.filter(([p]) => p.startsWith(root)).map(([p, d]) => [p.slice(root.length), d] as const)
    }
  }
  const files = new Map(entries)

  // ── 2b. Auto-Adapt plain Vite build zips (root index.html or build/index.html → dist/) ──
  if (!files.has('dist/index.html')) {
    if (files.has('build/index.html')) {
      for (const [p, d] of [...files.entries()]) {
        if (p.startsWith('build/')) {
          files.set('dist/' + p.slice('build/'.length), d)
        }
      }
      result.autoAdapted = true
    } else if (files.has('index.html')) {
      for (const [p, d] of [...files.entries()]) {
        if (!p.startsWith('schema/') && !p.startsWith('defaults/') && !p.startsWith('preview/') && !p.startsWith('source/') && p !== 'theme.json') {
          if (DIST_EXTENSIONS.has(ext(p))) {
            files.set('dist/' + p, d)
          }
        }
      }
      result.autoAdapted = true
    }
  }

  // ── 2c. Auto-Rewrite absolute asset paths (/assets/... → ./assets/...) in dist/index.html ──
  const rawIndexBytes = files.get('dist/index.html')
  let extractedTitle: string | undefined
  if (rawIndexBytes) {
    let indexHtml = new TextDecoder().decode(rawIndexBytes)
    const titleMatch = indexHtml.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) extractedTitle = titleMatch[1]

    if (/\s(?:src|href)=["']\/(?!\/)/.test(indexHtml)) {
      indexHtml = indexHtml.replace(/(\s(?:src|href)=["'])\/(?!\/)/g, '$1./')
      files.set('dist/index.html', new TextEncoder().encode(indexHtml))
      warnings.push('Auto-Adapter: rewrote absolute "/assets/…" paths in dist/index.html to relative "./assets/…" paths.')
      result.autoAdapted = true
    }
  }

  // ── 2d. Auto-Synthesize missing NexDrop manifest & schemas for unmodified React + Vite zips ──
  if (files.has('dist/index.html') && !files.has('theme.json')) {
    synthesizeUniversalThemeFiles(files, extractedTitle)
    result.autoAdapted = true
    warnings.push('Auto-Adapter: generated theme.json, schema/settings.json, and defaults/content.json for unmodified React + Vite package.')
  }

  result.stats.files = files.size
  result.stats.bytes = [...files.values()].reduce((s, d) => s + d.byteLength, 0)

  for (const path of files.keys()) {
    const e = ext(path)
    if (BLOCKED_EXTENSIONS.has(e)) errors.push(`File type not allowed: ${path}`)
    else if (path.startsWith('dist/') && !DIST_EXTENSIONS.has(e)) errors.push(`File type not allowed in dist/: ${path}`)
  }

  const text = (path: string) => {
    const data = files.get(path)
    return data ? new TextDecoder().decode(data) : null
  }
  function readJson<T>(path: string, schema: ZodType<T>, required = true): T | undefined {
    const body = text(path)
    if (body === null) {
      if (required) errors.push(`Missing required file: ${path}`)
      return undefined
    }
    try {
      return schema.parse(JSON.parse(body))
    } catch (error) {
      errors.push(...formatZod(path, error))
      return undefined
    }
  }

  // ── 3. Manifest & schemas ──
  const manifest = readJson('theme.json', manifestSchema)
  const settings = readJson('schema/settings.json', settingsSchema)
  const defaults = readJson('defaults/content.json', contentSchema)
  const sections: Record<string, ThemeSectionSchema> = {}

  if (manifest) {
    for (const type of manifest.sections) {
      const schema = readJson(`schema/sections/${type}.json`, sectionSchema)
      if (!schema) continue
      if (schema.type !== type) errors.push(`schema/sections/${type}.json: "type" must be "${type}"`)
      for (const page of schema.pages || []) {
        if (!manifest.pages.includes(page)) errors.push(`Section "${type}" targets unknown page "${page}"`)
      }
      sections[type] = schema
    }
    for (const path of files.keys()) {
      const m = path.match(/^schema\/sections\/([^/]+)\.json$/)
      if (m && !manifest.sections.includes(m[1])) warnings.push(`schema/sections/${m[1]}.json is not listed in theme.json "sections" and will be ignored`)
    }
    if (manifest.features.includes('checkout') && !manifest.features.includes('cart')) {
      warnings.push('Feature "checkout" usually requires "cart"')
    }
    const paymentFeatures = ['cod', 'bkash', 'nagad', 'rocket', 'sslcommerz']
    if (manifest.features.includes('checkout') && !manifest.features.some((f) => paymentFeatures.includes(f))) {
      errors.push('A theme with "checkout" must declare at least one payment feature (cod, bkash, nagad, rocket, sslcommerz)')
    }
  }

  // Unique keys inside every field list
  const checkKeys = (where: string, fields: { key: string; fields?: any[] }[]) => {
    const seen = new Set<string>()
    for (const f of fields) {
      if (seen.has(f.key)) errors.push(`${where}: duplicate field key "${f.key}"`)
      seen.add(f.key)
      if (f.fields) checkKeys(`${where}.${f.key}`, f.fields)
    }
  }
  settings?.groups.forEach((g) => checkKeys(`settings.${g.id}`, g.fields))
  Object.values(sections).forEach((s) => checkKeys(`section ${s.type}`, s.fields))

  // ── 4. Default content must reference known pages/sections ──
  if (manifest && defaults) {
    for (const page of manifest.pages) {
      if (!defaults.pages[page]) warnings.push(`defaults/content.json has no content for page "${page}"`)
    }
    for (const [page, data] of Object.entries(defaults.pages)) {
      if (!manifest.pages.includes(page)) errors.push(`defaults/content.json: unknown page "${page}"`)
      const ids = new Set<string>()
      for (const s of data.sections) {
        if (!sections[s.type] && manifest.sections.includes(s.type)) continue
        if (!sections[s.type]) errors.push(`defaults/content.json: page "${page}" uses unknown section "${s.type}"`)
        if (ids.has(s.id)) errors.push(`defaults/content.json: duplicate section id "${s.id}" on page "${page}"`)
        ids.add(s.id)
      }
    }
  }

  // ── 5. Built frontend ──
  const index = text('dist/index.html')
  if (index === null) {
    errors.push('Missing dist/index.html (or root index.html) — run `vite build` before zipping.')
  } else {
    const usesSdk = [...files.entries()].some(
      ([p, d]) => p.startsWith('dist/') && p.endsWith('.js') && new TextDecoder().decode(d).includes('__NEXDROP_SDK__')
    )
    if (!usesSdk) {
      warnings.push('Universal Bridge Mode: bundle does not import @nexdrop/theme-sdk directly; NexDrop will inject the Universal Runtime Bridge for products, cart, Bangladesh checkout, and DOM editing.')
    }
  }
  result.stats.distFiles = [...files.keys()].filter((p) => p.startsWith('dist/')).length

  // ── 6. Previews & source ──
  result.cover = ['preview/cover.png', 'preview/cover.jpg', 'preview/cover.webp'].find((p) => files.has(p))
  if (!result.cover) warnings.push('No preview/cover.(png|jpg|webp) — a default cover will be shown')
  result.screenshots = [...files.keys()].filter((p) => /^preview\/screenshots\/[^/]+\.(png|jpe?g|webp)$/i.test(p)).sort()
  result.hasSource = [...files.keys()].some((p) => p.startsWith('source/'))

  result.manifest = manifest
  result.settingsSchema = settings
  result.sectionSchemas = sections
  result.defaults = defaults
  result.ok = errors.length === 0
  if (result.ok) result.files = files
  return result
}
