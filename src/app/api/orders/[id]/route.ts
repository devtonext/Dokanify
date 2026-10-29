import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound, ok, route } from '@/lib/http'
import { updateOrder, updateOrderSchema } from '@/server/orders'

type Ctx = { params: Promise<{ id: string }> }

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin()
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, customer: true, store: { select: { name: true, slug: true, phone: true, address: true } } },
  })
  if (!order) throw notFound('Order')
  return ok({ order })
})

export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin('SUPPORT')
  const { id } = await params
  const order = await updateOrder(id, updateOrderSchema.parse(await req.json()), admin.id)
  return ok({ order })
})
