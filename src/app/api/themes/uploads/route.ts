import { randomUUID } from 'crypto'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { badRequest, ok, route } from '@/lib/http'
import { storage } from '@/lib/storage'

/**
 * Step 1 of a theme upload: returns a short-lived URL the browser PUTs the zip to
 * directly (R2/S3 presigned URL, or a signed local endpoint in development).
 */
export const POST = route(async (req) => {
  await requireAdmin('THEME_MANAGER')
  const { filename, size } = z.object({ filename: z.string(), size: z.number().int().positive() }).parse(await req.json())
  const maxMb = Number(process.env.THEME_MAX_ZIP_MB || 80)
  if (!filename.toLowerCase().endsWith('.zip')) throw badRequest('Theme must be a .zip file')
  if (size > maxMb * 1024 * 1024) throw badRequest(`Zip must be under ${maxMb} MB`)
  const key = `uploads/themes/${randomUUID()}.zip`
  const uploadUrl = await storage.presignPut(key, 'application/zip')
  return ok({ key, uploadUrl, contentType: 'application/zip' })
})
