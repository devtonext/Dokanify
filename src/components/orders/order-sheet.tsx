'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/dashboard/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { api } from '@/lib/api'
import { COURIERS, formatBdPhone } from '@/lib/bd'
import { formatBDT } from '@/lib/currency'
import { formatDateTime, paymentLabel } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'

const NEXT: Record<OrderStatus, { status: OrderStatus; label: string; variant?: 'outline' | 'destructive' }[]> = {
  PENDING: [
    { status: 'PROCESSING', label: 'Confirm order' },
    { status: 'CANCELLED', label: 'Cancel', variant: 'destructive' },
  ],
  PROCESSING: [
    { status: 'SHIPPED', label: 'Mark as shipped' },
    { status: 'CANCELLED', label: 'Cancel', variant: 'destructive' },
  ],
  SHIPPED: [
    { status: 'DELIVERED', label: 'Mark as delivered' },
    { status: 'CANCELLED', label: 'Returned / cancel', variant: 'destructive' },
  ],
  DELIVERED: [{ status: 'REFUNDED', label: 'Refund', variant: 'outline' }],
  CANCELLED: [{ status: 'PENDING', label: 'Re-open', variant: 'outline' }],
  REFUNDED: [],
}

export function useOrderUpdate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      api<{ order: Order }>(`/api/orders/${id}`, { method: 'PATCH', json: input }),
    onSuccess: ({ order }) => {
      toast.success(`Order #${order.orderNumber} updated`)
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', order.id] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function OrderSheet({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const update = useOrderUpdate()
  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api<{ order: Order }>(`/api/orders/${orderId}`),
    enabled: Boolean(orderId),
  })
  const order = data?.order
  const [courier, setCourier] = useState('')
  const [tracking, setTracking] = useState('')
  const [txn, setTxn] = useState('')

  useEffect(() => {
    setCourier(order?.courier || '')
    setTracking(order?.trackingCode || '')
    setTxn(order?.transactionId || '')
  }, [order])

  return (
    <Sheet open={Boolean(orderId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {isLoading || !order ? (
          <div className="grid h-full place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                Order #{order.orderNumber} <StatusBadge status={order.status} />
              </SheetTitle>
              <SheetDescription>
                {order.store?.name} · {formatDateTime(order.createdAt)} · via {order.source}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-6">
              <div className="flex flex-wrap gap-2">
                {NEXT[order.status].map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant={a.variant || 'default'}
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: order.id, input: { status: a.status } })}
                  >
                    {a.label}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={() => window.open(`/orders/${order.id}/invoice`, '_blank')}>
                  <Printer className="mr-2 h-4 w-4" />
                  Invoice
                </Button>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold">Items</h4>
                <div className="divide-y rounded-lg border">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku} · {formatBDT(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium">{formatBDT(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <dl className="space-y-1 text-sm">
                  <Row label="Subtotal" value={formatBDT(order.subtotal)} />
                  <Row label={`Shipping${order.shippingZone ? ` (${order.shippingZone})` : ''}`} value={formatBDT(order.shippingFee)} />
                  {order.discount > 0 && <Row label="Discount" value={`−${formatBDT(order.discount)}`} />}
                  <Row label="Total" value={formatBDT(order.total)} strong />
                </dl>
              </section>

              <Separator />

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <h4 className="font-semibold">Ship to</h4>
                  <p>{order.shippingName}</p>
                  <p>{formatBdPhone(order.shippingPhone)}</p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress}, {order.city}
                    {order.district && order.district !== order.city ? `, ${order.district}` : ''}
                  </p>
                  {order.notes && <p className="pt-1 text-xs italic text-muted-foreground">“{order.notes}”</p>}
                </div>
                <div className="space-y-1 text-sm">
                  <h4 className="font-semibold">Payment</h4>
                  <p>{paymentLabel(order.paymentMethod)}</p>
                  <StatusBadge status={order.paymentStatus} />
                  {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                    <div>
                      <Button variant="link" className="h-auto p-0 text-xs" onClick={() => update.mutate({ id: order.id, input: { paymentStatus: 'PAID' } })}>
                        Mark as paid
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h4 className="text-sm font-semibold">Fulfilment</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Courier</Label>
                    <Select value={courier || 'none'} onValueChange={(v) => setCourier(v === 'none' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not assigned</SelectItem>
                        {COURIERS.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tracking">Tracking / consignment ID</Label>
                    <Input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                  </div>
                  {order.paymentMethod !== 'COD' && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="txn">{paymentLabel(order.paymentMethod)} transaction ID</Label>
                      <Input id="txn" value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="e.g. 9A7B6C5D4E" />
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate({ id: order.id, input: { courier: courier || null, trackingCode: tracking || null, transactionId: txn || null } })
                  }
                >
                  Save fulfilment details
                </Button>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'border-t pt-2 font-semibold' : 'text-muted-foreground'}`}>
      <dt>{label}</dt>
      <dd className={strong ? '' : 'text-foreground'}>{value}</dd>
    </div>
  )
}
