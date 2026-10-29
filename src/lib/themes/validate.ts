/**
 * Pure theme-zip validator (no DB / storage access) — used by the upload API
 * and by `npm run theme:validate <zip>` for theme developers.
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

export function validateThemeZip(zip: Uint8Array): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const result: ValidationResult = {
    ok: false,
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

  // ── 2. Strip a single wrapping folder (my-theme/theme.json → theme.json) ──
  let entries = Object.entries(raw).map(([name, data]) => [safePath(name)!, data] as const)
  if (!entries.some(([p]) => p === 'theme.json')) {
    const roots = new Set(entries.map(([p]) => p.split('/')[0]))
    if (roots.size === 1) {
      const root = [...roots][0] + '/'
      entries = entries.filter(([p]) => p.startsWith(root)).map(([p, d]) => [p.slice(root.length), d] as const)
    }
  }
  const files = new Map(entries)
  result.stats.files = files.size
  result.stats.bytes = entries.reduce((s, [, d]) => s + d.byteLength, 0)

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
        if (!sections[s.type] && manifest.sections.includes(s.type)) continue // schema error already reported
        if (!sections[s.type]) errors.push(`defaults/content.json: page "${page}" uses unknown section "${s.type}"`)
        if (ids.has(s.id)) errors.push(`defaults/content.json: duplicate section id "${s.id}" on page "${page}"`)
        ids.add(s.id)
      }
    }
  }

  // ── 5. Built frontend ──
  const index = text('dist/index.html')
  if (index === null) {
    errors.push('Missing dist/index.html — run `vite build` and include the dist/ folder')
  } else {
    if (/\s(?:src|href)=["']\/(?!\/)/.test(index)) {
      errors.push('dist/index.html uses absolute asset paths ("/assets/…"). Set `base: "./"` in vite.config and rebuild.')
    }
    const usesSdk = [...files.entries()].some(
      ([p, d]) => p.startsWith('dist/') && p.endsWith('.js') && new TextDecoder().decode(d).includes('__NEXDROP_SDK__')
    )
    if (!usesSdk) {
      warnings.push('No bundle references @nexdrop/theme-sdk — content edits from the editor will not appear in this theme.')
    }
  }
  result.stats.distFiles = [...files.keys()].filter((p) => p.startsWith('dist/')).length

  // ── 6. Previews & source ──
  result.cover = ['preview/cover.png', 'preview/cover.jpg', 'preview/cover.webp'].find((p) => files.has(p))
  if (!result.cover) warnings.push('No preview/cover.(png|jpg|webp) — the marketplace card will have no image')
  result.screenshots = [...files.keys()].filter((p) => /^preview\/screenshots\/[^/]+\.(png|jpe?g|webp)$/i.test(p)).sort()
  result.hasSource = [...files.keys()].some((p) => p.startsWith('source/'))
  if (!result.hasSource) warnings.push('No source/ folder — buyers will only be able to download the built files')

  result.manifest = manifest
  result.settingsSchema = settings
  result.sectionSchemas = sections
  result.defaults = defaults
  result.ok = errors.length === 0
  if (result.ok) result.files = files
  return result
}
