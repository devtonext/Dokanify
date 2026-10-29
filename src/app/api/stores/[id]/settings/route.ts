import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { encryptSecret, SECRET_MASK } from '@/lib/crypto'
import { db } from '@/lib/db'
import { notFound, ok, route } from '@/lib/http'
import { GATEWAYS, parseStoreSettings, SECRET_FIELDS, storeSettingsSchema, type StoreSettings } from '@/lib/store-settings'

type Ctx = { params: Promise<{ id: string }> }

/** Secrets never leave the server: they are returned masked. */
function mask(settings: StoreSettings) {
  const copy = structuredClone(settings)
  for (const g of GATEWAYS) {
    for (const f of SECRET_FIELDS) {
      if (copy.payments[g][f]) copy.payments[g][f] = SECRET_MASK
    }
  }
  return copy
}

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin()
  const { id } = await params
  const store = await db.store.findUnique({ where: { id }, select: { settings: true } })
  if (!store) throw notFound('Store')
  return ok({ settings: mask(parseStoreSettings(store.settings)) })
})

export const PUT = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const { id } = await params
  const store = await db.store.findUnique({ where: { id }, select: { settings: true } })
  if (!store) throw notFound('Store')
  const current = parseStoreSettings(store.settings)
  const next = storeSettingsSchema.parse(await req.json())

  for (const g of GATEWAYS) {
    for (const f of SECRET_FIELDS) {
      const value = next.payments[g][f]
      // Unchanged mask → keep stored ciphertext; empty → cleared; anything else → encrypt.
      next.payments[g][f] = value === SECRET_MASK ? current.payments[g][f] : value ? encryptSecret(value) : ''
    }
  }
  await db.store.update({ where: { id }, data: { settings: next as any } })
  await audit(admin.id, 'store.settings', 'store', id)
  return ok({ settings: mask(next) })
})
