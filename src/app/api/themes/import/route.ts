import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { ok, route } from '@/lib/http'
import { importThemeFromUpload } from '@/server/themes'

export const maxDuration = 60

/** Step 2: validate the uploaded zip and import it as a theme version. */
export const POST = route(async (req) => {
  const admin = await requireAdmin('THEME_MANAGER')
  const { key } = z.object({ key: z.string() }).parse(await req.json())
  const report = await importThemeFromUpload(key, admin.id)
  return ok({ report }, { status: report.ok ? 201 : 422 })
})
