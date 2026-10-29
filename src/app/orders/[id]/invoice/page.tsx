'use client'

import { use, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatBdPhone } from '@/lib/bd'
import { formatBDT } from '@/lib/currency'
import { formatDateTime, paymentLabel } from '@/lib/format'
import type { Order } from '@/lib/types'

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data } = useQuery({ queryKey: ['order', id], queryFn: () => api<{ order: Order }>(`/api/orders/${id}`) })
  const order = data?.order

  useEffect(() => {
    if (order) setTimeout(() => window.print(), 300)
  }, [order])

  if (!order) return <p className="p-8 text-sm text-muted-foreground">Loading invoice…</p>

  return (
    <div className="h-screen overflow-y-auto bg-white text-slate-900">
      <div className="mx-auto max-w-2xl p-8 text-sm print:p-0">
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold">{order.store?.name}</h1>
            {order.store?.address && <p className="text-slate-500">{order.store.address}</p>}
            {order.store?.phone && <p className="text-slate-500">{formatBdPhone(order.store.phone)}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">INVOICE</p>
            <p>#{order.orderNumber}</p>
            <p className="text-slate-500">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="font-semibold">Bill / ship to</p>
            <p>{order.shippingName}</p>
            <p>{formatBdPhone(order.shippingPhone)}</p>
            <p className="text-slate-500">
              {order.shippingAddress}, {order.city}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Payment</p>
            <p>{paymentLabel(order.paymentMethod)}</p>
            <p className="text-slate-500">{order.paymentStatus}</p>
            {order.trackingCode && <p className="text-slate-500">Tracking: {order.trackingCode}</p>}
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y text-left">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="py-2">
                  {i.name}
                  <span className="block text-xs text-slate-500">{i.sku}</span>
                </td>
                <td className="py-2 text-right">{formatBDT(i.price)}</td>
                <td className="py-2 text-right">{i.quantity}</td>
                <td className="py-2 text-right">{formatBDT(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-4 w-64 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatBDT(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{formatBDT(order.shippingFee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>−{formatBDT(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 text-base font-bold">
            <span>{order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID' ? 'Collect on delivery' : 'Total'}</span>
            <span>{formatBDT(order.total)}</span>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-slate-500">Thank you for shopping with {order.store?.name}!</p>
      </div>
    </div>
  )
}
