'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDebounced } from '@/hooks/use-debounced'
import { useStoreScope } from '@/hooks/use-store-scope'
import { api, qs } from '@/lib/api'
import { DISTRICTS, PAYMENT_LABELS, PAYMENT_METHODS } from '@/lib/bd'
import { formatBDT } from '@/lib/currency'
import type { Order, Product } from '@/lib/types'

type Line = { product: Product; quantity: number }

export function NewOrderDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const qc = useQueryClient()
  const scope = useStoreScope()
  const [storeId, setStoreId] = useState(scope.storeId)
  const [lines, setLines] = useState<Line[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [method, setMethod] = useState('COD')
  const [district, setDistrict] = useState('Dhaka')
  const q = useDebounced(productSearch)

  useEffect(() => {
    if (open) {
      setStoreId(scope.storeId)
      setLines([])
      setProductSearch('')
    }
  }, [open, scope.storeId])

  const { data: products } = useQuery({
    queryKey: ['products', 'picker', storeId, q],
    queryFn: () => api<{ products: Product[] }>(`/api/products${qs({ store: storeId, search: q, status: 'ACTIVE', limit: 8, stock: '' })}`),
    enabled: open && Boolean(storeId),
  })

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.product.price * l.quantity, 0), [lines])

  const create = useMutation({
    mutationFn: (body: unknown) => api<{ order: Order }>('/api/orders', { method: 'POST', json: body }),
    onSuccess: ({ order }) => {
      toast.success(`Order #${order.orderNumber} created`)
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      onOpenChange(false)
      onCreated(order.id)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function add(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: Math.min(l.quantity + 1, product.quantity) } : l))
      return [...prev, { product, quantity: 1 }]
    })
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!lines.length) return toast.error('Add at least one product')
    const f = new FormData(e.currentTarget)
    create.mutate({
      storeId,
      paymentMethod: method,
      discount: Number(f.get('discount')) || 0,
      notes: String(f.get('notes') || '') || undefined,
      customer: {
        name: f.get('name'),
        phone: f.get('phone'),
        email: f.get('email') || undefined,
        address: f.get('address'),
        city: f.get('city') || district,
        district,
      },
      items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New order</DialogTitle>
          <DialogDescription>Phone and WhatsApp orders. Shipping and stock are calculated by the store’s rules.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Store</Label>
            <Select value={storeId} onValueChange={(v) => { setStoreId(v); setLines([]) }}>
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {scope.stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {storeId && (
            <>
              <div className="space-y-2">
                <Label>Products</Label>
                <Input placeholder="Search products by name or SKU…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {products?.products.map((p) => (
                    <Button key={p.id} type="button" size="sm" variant="outline" disabled={p.quantity === 0} onClick={() => add(p)}>
                      <Plus className="mr-1 h-3 w-3" />
                      {p.name} · {formatBDT(p.price)} {p.quantity === 0 && '(out)'}
                    </Button>
                  ))}
                </div>
                {lines.length > 0 && (
                  <div className="divide-y rounded-lg border">
                    {lines.map((l) => (
                      <div key={l.product.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                        <span className="min-w-0 flex-1 truncate">{l.product.name}</span>
                        <div className="flex items-center gap-1">
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLines((p) => p.map((x) => (x === l ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center tabular-nums">{l.quantity}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={l.quantity >= l.product.quantity}
                            onClick={() => setLines((p) => p.map((x) => (x === l ? { ...x, quantity: x.quantity + 1 } : x)))}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="w-24 text-right font-medium">{formatBDT(l.product.price * l.quantity)}</span>
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLines((p) => p.filter((x) => x !== l))} aria-label="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-between p-2 text-sm font-semibold">
                      <span>Subtotal (before shipping)</span>
                      <span>{formatBDT(subtotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="name" label="Customer name" required />
                <Field name="phone" label="Mobile number" placeholder="01XXXXXXXXX" required />
                <Field name="email" label="Email (optional)" type="email" />
                <div className="space-y-1.5">
                  <Label>District</Label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Field name="address" label="Address" placeholder="House, road, area" required />
                </div>
                <Field name="city" label="City / Thana" placeholder={district} />
                <div className="space-y-1.5">
                  <Label>Payment method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {PAYMENT_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Field name="discount" label="Discount (৳)" type="number" placeholder="0" />
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!storeId || create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ name, label, ...props }: { name: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  )
}
