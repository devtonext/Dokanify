import 'server-only'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  meta?: Prisma.InputJsonValue
) {
  try {
    await db.auditLog.create({ data: { actorId, action, entity, entityId: entityId ?? null, meta } })
  } catch (error) {
    // Auditing must never break the request that triggered it.
    console.error('[audit]', action, error)
  }
}

export async function notify(title: string, body: string, href?: string) {
  try {
    await db.notification.create({ data: { title, body, href } })
  } catch (error) {
    console.error('[notify]', error)
  }
}
