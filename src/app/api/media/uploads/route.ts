import { randomUUID } from 'crypto'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, route } from '@/lib/http'
import { storage } from '@/lib/storage'

// SVG is excluded on purpose: it can carry scripts.
const TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

/** Presigns an image upload for the theme editor / product images and records the asset. */
export const POST = route(async (req) => {
  await requireAdmin('SUPPORT')
  const input = z
    .object({
      contentType: z.string().refine((t) => t in TYPES, 'Only PNG, JPG, WEBP, GIF or AVIF images'),
      size: z.number().int().positive().max(10 * 1024 * 1024, 'Images must be under 10 MB'),
      storeId: z.string().optional(),
    })
    .parse(await req.json())
  const key = `media/${input.storeId || 'platform'}/${randomUUID()}.${TYPES[input.contentType]}`
  const [uploadUrl] = await Promise.all([
    storage.presignPut(key, input.contentType),
    db.mediaAsset.create({
      data: { key, url: storage.publicUrl(key), mime: input.contentType, size: input.size, storeId: input.storeId },
    }),
  ])
  return ok({ key, uploadUrl, url: storage.publicUrl(key) })
})
