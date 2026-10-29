import 'server-only'
import type { Prisma, ThemeStatus } from '@prisma/client'
import semver from 'semver'
import { audit, notify } from '@/lib/audit'
import { db } from '@/lib/db'
import { badRequest, HttpError, notFound } from '@/lib/http'
import { storage } from '@/lib/storage'
import { initialContent, sanitizeContent, type VersionSchemas } from '@/lib/themes/content'
import { isUnlocked } from '@/lib/themes/spec'
import { mimeFor, validateThemeZip, type ValidationResult } from '@/lib/themes/validate'
import { emitMarketplaceEvent } from '@/server/marketplace'

export const themePrefix = (slug: string, version: string) => `themes/${slug}/${version}`
export const themeBaseUrl = (slug: string, version: string) => `/t/${slug}/${version}/`

export function assetUrl(slug: string, version: string, path?: string | null) {
  return path ? `${themeBaseUrl(slug, version)}_pkg/${path}` : null
}

async function putAll(prefix: string, files: [string, Uint8Array][]) {
  const queue = [...files]
  const workers = Array.from({ length: 12 }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      await storage.put(`${prefix}/${item[0]}`, item[1], mimeFor(item[0]))
    }
  })
  await Promise.all(workers)
}

export type ImportReport = Omit<ValidationResult, 'files' | 'defaults' | 'settingsSchema' | 'sectionSchemas'> & {
  themeId?: string
  versionId?: string
  isNewTheme?: boolean
  becameCurrent?: boolean
}

/** Validates an uploaded zip (already in storage at `uploadKey`) and imports it as a theme version. */
export async function importThemeFromUpload(uploadKey: string, actorId: string): Promise<ImportReport> {
  if (!/^uploads\/themes\/[\w-]+\.zip$/.test(uploadKey)) throw badRequest('Invalid upload key')
  const object = await storage.get(uploadKey)
  if (!object) throw badRequest('Upload not found or expired — please upload again')

  const maxBytes = Number(process.env.THEME_MAX_ZIP_MB || 80) * 1024 * 1024
  if (object.body.byteLength > maxBytes) {
    await storage.deletePrefix(uploadKey)
    throw badRequest(`Zip is larger than ${process.env.THEME_MAX_ZIP_MB || 80} MB`)
  }

  const result = validateThemeZip(object.body)
  const { files, defaults, settingsSchema, sectionSchemas, ...report } = result
  if (!result.ok || !files || !result.manifest) {
    await storage.deletePrefix(uploadKey)
    return report
  }
  const manifest = result.manifest

  const existing = await db.theme.findUnique({
    where: { slug: manifest.id },
    include: { versions: { select: { version: true } }, currentVersion: { select: { version: true } } },
  })
  if (existing?.versions.some((v) => v.version === manifest.version)) {
    await storage.deletePrefix(uploadKey)
    return {
      ...report,
      ok: false,
      errors: [`Version ${manifest.version} of "${manifest.id}" already exists. Bump "version" in theme.json.`],
    }
  }
  const latest = existing?.versions.map((v) => v.version).sort(semver.rcompare)[0]
  if (latest && semver.lt(manifest.version, latest)) {
    report.warnings.push(`Version ${manifest.version} is older than the latest uploaded version ${latest}`)
  }

  // Store: dist/ is served, preview/ + schema/ + defaults/ under _pkg, original zip for marketplace download.
  const prefix = themePrefix(manifest.id, manifest.version)
  const servable = [...files.entries()].filter(([p]) => p.startsWith('dist/') || p.startsWith('preview/'))
  await putAll(prefix, servable)
  await storage.put(`${prefix}/package.zip`, object.body, 'application/zip')
  await storage.deletePrefix(uploadKey)

  const versionData = {
    version: manifest.version,
    manifest: manifest as unknown as Prisma.InputJsonValue,
    settingsSchema: settingsSchema as unknown as Prisma.InputJsonValue,
    sectionSchemas: sectionSchemas as unknown as Prisma.InputJsonValue,
    defaults: defaults as unknown as Prisma.InputJsonValue,
    features: manifest.features,
    storagePrefix: prefix,
    coverPath: result.cover || null,
    screenshots: result.screenshots,
    sourceKey: `${prefix}/package.zip`,
    sizeBytes: result.stats.bytes,
    fileCount: result.stats.files,
    changelog: manifest.changelog || null,
    report: { warnings: report.warnings } as Prisma.InputJsonValue,
    uploadedById: actorId,
  }

  const outcome = await db.$transaction(async (tx) => {
    const theme =
      existing ??
      (await tx.theme.create({
        data: {
          slug: manifest.id,
          name: manifest.name,
          niche: manifest.niche,
          description: manifest.description,
          minPlanKey: manifest.minPlan,
        },
      }))
    const version = await tx.themeVersion.create({ data: { ...versionData, themeId: theme.id } })
    // Unpublished themes always track the newest upload; published ones change only on explicit release.
    const becameCurrent = !existing || existing.status !== 'PUBLISHED' || !existing.currentVersionId
    if (becameCurrent) {
      await tx.theme.update({
        where: { id: theme.id },
        data: {
          currentVersionId: version.id,
          name: manifest.name,
          niche: manifest.niche,
          description: manifest.description,
          minPlanKey: manifest.minPlan,
        },
      })
    }
    return { theme, version, becameCurrent }
  })

  await audit(actorId, 'theme.upload', 'theme', outcome.theme.id, { version: manifest.version })
  await notify('Theme uploaded', `${manifest.name} v${manifest.version} is ready for review`, `/theme/${outcome.theme.id}`)

  return {
    ...report,
    themeId: outcome.theme.id,
    versionId: outcome.version.id,
    isNewTheme: !existing,
    becameCurrent: outcome.becameCurrent,
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const versionSummary = {
  id: true,
  version: true,
  features: true,
  coverPath: true,
  screenshots: true,
  sizeBytes: true,
  fileCount: true,
  changelog: true,
  report: true,
  createdAt: true,
  uploadedBy: { select: { name: true } },
} satisfies Prisma.ThemeVersionSelect

export function presentTheme<
  T extends { slug: string; currentVersion: { version: string; coverPath: string | null; screenshots?: string[] } | null },
>(theme: T) {
  const v = theme.currentVersion
  return {
    ...theme,
    coverUrl: v ? assetUrl(theme.slug, v.version, v.coverPath) : null,
    previewUrl: v ? themeBaseUrl(theme.slug, v.version) : null,
  }
}

export async function listThemes(filter: { status?: ThemeStatus; niche?: string; search?: string }) {
  const themes = await db.theme.findMany({
    where: {
      status: filter.status,
      niche: filter.niche,
      ...(filter.search ? { name: { contains: filter.search, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    include: {
      currentVersion: { select: versionSummary },
      _count: { select: { installs: true, versions: true } },
    },
  })
  return themes.map(presentTheme)
}

export async function getTheme(id: string) {
  const theme = await db.theme.findUnique({
    where: { id },
    include: {
      currentVersion: { select: { ...versionSummary, manifest: true, sectionSchemas: true, settingsSchema: true } },
      versions: { select: versionSummary, orderBy: { createdAt: 'desc' } },
      installs: {
        select: { id: true, isLive: true, publishedAt: true, updatedAt: true, store: { select: { id: true, name: true, slug: true } }, version: { select: { version: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      },
    },
  })
  if (!theme) throw notFound('Theme')
  return {
    ...presentTheme(theme),
    versions: theme.versions.map((v) => ({
      ...v,
      coverUrl: assetUrl(theme.slug, v.version, v.coverPath),
      screenshotUrls: v.screenshots.map((s) => assetUrl(theme.slug, v.version, s)),
      previewUrl: themeBaseUrl(theme.slug, v.version),
      downloadUrl: `/api/themes/${theme.id}/versions/${v.id}/download`,
    })),
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

const TRANSITIONS: Record<ThemeStatus, ThemeStatus[]> = {
  DRAFT: ['IN_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  IN_REVIEW: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: ['DRAFT', 'PUBLISHED'],
}

export async function updateTheme(
  id: string,
  input: { status?: ThemeStatus; price?: number; featured?: boolean; minPlanKey?: string; description?: string; name?: string },
  actorId: string
) {
  const theme = await db.theme.findUnique({ where: { id }, include: { currentVersion: true } })
  if (!theme) throw notFound('Theme')
  if (input.status && input.status !== theme.status) {
    if (!TRANSITIONS[theme.status].includes(input.status)) {
      throw badRequest(`Cannot move a theme from ${theme.status} to ${input.status}`)
    }
    if (input.status === 'PUBLISHED' && !theme.currentVersion) throw badRequest('Upload a version before publishing')
  }
  if (input.minPlanKey && !(await db.plan.findUnique({ where: { key: input.minPlanKey } }))) {
    throw badRequest('Unknown plan')
  }
  const updated = await db.theme.update({ where: { id }, data: input, include: { currentVersion: true } })
  await audit(actorId, 'theme.update', 'theme', id, input as Prisma.InputJsonValue)

  if (updated.status === 'PUBLISHED' || theme.status === 'PUBLISHED') {
    const event = updated.status === 'ARCHIVED' ? 'theme.archived' : updated.status === 'PUBLISHED' && theme.status !== 'PUBLISHED' ? 'theme.published' : 'theme.updated'
    await emitMarketplaceEvent(event, publicThemePayload(updated))
  }
  return updated
}

export async function setCurrentVersion(themeId: string, versionId: string, actorId: string) {
  const version = await db.themeVersion.findFirst({ where: { id: versionId, themeId } })
  if (!version) throw notFound('Version')
  const theme = await db.theme.update({
    where: { id: themeId },
    data: { currentVersionId: versionId },
    include: { currentVersion: true },
  })
  await audit(actorId, 'theme.release', 'theme', themeId, { version: version.version })
  if (theme.status === 'PUBLISHED') await emitMarketplaceEvent('theme.updated', publicThemePayload(theme))
  return theme
}

export async function deleteVersion(themeId: string, versionId: string, actorId: string) {
  const version = await db.themeVersion.findFirst({
    where: { id: versionId, themeId },
    include: { currentOf: true, _count: { select: { installs: true, publishedInstalls: true } } },
  })
  if (!version) throw notFound('Version')
  if (version.currentOf) throw badRequest('Release another version before deleting the current one')
  const inUse = version._count.installs + version._count.publishedInstalls
  if (inUse) throw badRequest(`${inUse} store install(s) still use this version`)
  await db.themeVersion.delete({ where: { id: versionId } })
  await storage.deletePrefix(version.storagePrefix + '/')
  await audit(actorId, 'theme.version.delete', 'theme', themeId, { version: version.version })
}

export async function deleteTheme(themeId: string, actorId: string) {
  const theme = await db.theme.findUnique({ where: { id: themeId }, include: { _count: { select: { installs: true } } } })
  if (!theme) throw notFound('Theme')
  if (theme._count.installs) throw badRequest('Theme is installed on stores — archive it instead')
  await db.theme.delete({ where: { id: themeId } })
  await storage.deletePrefix(`themes/${theme.slug}/`)
  await audit(actorId, 'theme.delete', 'theme', themeId, { slug: theme.slug })
}

export function publicThemePayload(theme: {
  id: string
  slug: string
  name: string
  niche: string
  description: string | null
  status: ThemeStatus
  price: Prisma.Decimal
  minPlanKey: string
  featured: boolean
  currentVersion: { version: string; coverPath: string | null; screenshots: string[]; features: string[] } | null
}) {
  const v = theme.currentVersion
  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || ''
  return {
    id: theme.id,
    slug: theme.slug,
    name: theme.name,
    niche: theme.niche,
    description: theme.description,
    status: theme.status,
    price: theme.price.toNumber(),
    currency: 'BDT',
    minPlan: theme.minPlanKey,
    featured: theme.featured,
    version: v?.version ?? null,
    features: v?.features ?? [],
    coverUrl: v?.coverPath ? origin + assetUrl(theme.slug, v.version, v.coverPath) : null,
    screenshots: v ? v.screenshots.map((s) => origin + assetUrl(theme.slug, v.version, s)) : [],
    previewUrl: v ? `${origin}${themeBaseUrl(theme.slug, v.version)}` : null,
  }
}

// ─── Installs (a store's copy of a theme + its content) ──────────────────────

export function versionSchemas(version: {
  settingsSchema: Prisma.JsonValue
  sectionSchemas: Prisma.JsonValue
  defaults: Prisma.JsonValue
  manifest: Prisma.JsonValue
}): VersionSchemas {
  return {
    settingsSchema: version.settingsSchema as any,
    sectionSchemas: version.sectionSchemas as any,
    defaults: version.defaults as any,
    manifest: version.manifest as any,
  }
}

export async function installTheme(storeId: string, themeId: string, actorId: string) {
  const [store, theme] = await Promise.all([
    db.store.findUnique({ where: { id: storeId }, include: { plan: true } }),
    db.theme.findUnique({ where: { id: themeId }, include: { currentVersion: true } }),
  ])
  if (!store) throw notFound('Store')
  if (!theme?.currentVersion) throw notFound('Theme')
  if (theme.status === 'ARCHIVED') throw badRequest('Archived themes cannot be installed')
  if (!isUnlocked(theme.minPlanKey, store.plan.key)) {
    throw new HttpError(402, `${theme.name} requires the ${theme.minPlanKey} plan (store is on ${store.plan.key})`)
  }
  const existing = await db.themeInstall.findUnique({ where: { storeId_themeId: { storeId, themeId } } })
  if (existing) return existing
  const content = initialContent(versionSchemas(theme.currentVersion))
  const install = await db.themeInstall.create({
    data: {
      storeId,
      themeId,
      versionId: theme.currentVersion.id,
      draftContent: content as Prisma.InputJsonValue,
    },
  })
  await audit(actorId, 'theme.install', 'store', storeId, { themeId })
  return install
}

export async function getInstall(id: string) {
  const install = await db.themeInstall.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, slug: true, plan: { select: { key: true, name: true, features: true } } } },
      theme: { select: { id: true, name: true, slug: true, currentVersionId: true } },
      version: true,
    },
  })
  if (!install) throw notFound('Theme install')
  return {
    ...install,
    previewUrl: `${themeBaseUrl(install.theme.slug, install.version.version)}?store=${install.store.slug}&install=${install.id}&mode=editor`,
    themeBase: themeBaseUrl(install.theme.slug, install.version.version),
    updateAvailable: install.theme.currentVersionId !== install.versionId,
  }
}

export async function saveDraft(id: string, content: unknown, actorId: string) {
  const install = await db.themeInstall.findUnique({ where: { id }, include: { version: true, store: { include: { plan: true } } } })
  if (!install) throw notFound('Theme install')
  const clean = sanitizeContent(content, versionSchemas(install.version), install.store.plan.key)
  const updated = await db.themeInstall.update({ where: { id }, data: { draftContent: clean as Prisma.InputJsonValue } })
  await audit(actorId, 'theme.draft.save', 'themeInstall', id)
  return updated
}

export async function publishInstall(id: string, actorId: string, makeLive = true) {
  const install = await db.themeInstall.findUnique({ where: { id } })
  if (!install) throw notFound('Theme install')
  const updated = await db.$transaction(async (tx) => {
    if (makeLive) {
      await tx.themeInstall.updateMany({ where: { storeId: install.storeId, isLive: true, NOT: { id } }, data: { isLive: false } })
    }
    return tx.themeInstall.update({
      where: { id },
      data: {
        publishedContent: install.draftContent as Prisma.InputJsonValue,
        publishedVersionId: install.versionId,
        publishedAt: new Date(),
        ...(makeLive ? { isLive: true } : {}),
      },
    })
  })
  await audit(actorId, 'theme.publish', 'themeInstall', id)
  return updated
}

/** Moves an install to the theme's current version, keeping content that is still valid. */
export async function upgradeInstall(id: string, actorId: string) {
  const install = await db.themeInstall.findUnique({
    where: { id },
    include: { theme: { include: { currentVersion: true } }, store: { include: { plan: true } } },
  })
  if (!install) throw notFound('Theme install')
  const target = install.theme.currentVersion
  if (!target || target.id === install.versionId) return install
  const schemas = versionSchemas(target)
  const draft = sanitizeContent(install.draftContent, schemas, install.store.plan.key)
  // Pages that became empty fall back to the new version's defaults.
  for (const page of schemas.manifest.pages) {
    if (!draft.pages[page]?.sections.length && schemas.defaults.pages[page]) draft.pages[page] = schemas.defaults.pages[page]
  }
  const updated = await db.themeInstall.update({
    where: { id },
    data: { versionId: target.id, draftContent: draft as Prisma.InputJsonValue },
  })
  await audit(actorId, 'theme.install.upgrade', 'themeInstall', id, { version: target.version })
  return updated
}
