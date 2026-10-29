import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, route } from '@/lib/http'

export const GET = route(async () => {
  await requireAdmin()
  const [notifications, unread] = await Promise.all([
    db.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    db.notification.count({ where: { read: false } }),
  ])
  return ok({ notifications, unread })
})

/** Marks all notifications as read. */
export const PATCH = route(async () => {
  await requireAdmin()
  await db.notification.updateMany({ where: { read: false }, data: { read: true } })
  return ok({ ok: true })
})
