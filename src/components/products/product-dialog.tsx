'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { GalleryInput } from '@/components/dashboard/image-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useStoreScope } from '@/hooks/use-store-scope'
import { api } from '@/lib/api'
import type { Product } from '@/lib/types'

type Form = {
  storeId: string
  name: string
  sku: string
  price: string
  comparePrice: string
  quantity: string
  category: string
  tags: string
  description: string
  status: Product['status']
  images: string[]
}

const empty = (storeId: string): Form => ({
  storeId,
  name: '',
  sku: '',
  price: '',
  comparePrice: '',
  quantity: '0',
  category: '',
  tags: '',
  description: '',
  status: 'ACTIVE',
  images: [],
})

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  product?: Product | null
  categories: string[]
}) {
  const qc = useQueryClient()
  const { storeId, stores } = useStoreScope()
  const [form, setForm] = useState<Form>(empty(storeId))
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!open) return
    setForm(
      product
        ? {
            storeId: product.storeId,
            name: product.name,
            sku: product.sku,
            price: String(product.price),
            comparePrice: product.comparePrice ? String(product.comparePrice) : '',
            quantity: String(product.quantity),
            category: product.category || '',
            tags: product.tags.join(', '),
            description: product.description || '',
            status: product.status,
            images: product.images,
          }
        : empty(storeId)
    )
  }, [open, product, storeId])

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        quantity: Number(form.quantity),
        category: form.category || null,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }
      return product ? api(`/api/products/${product.id}`, { method: 'PATCH', json: body }) : api('/api/products', { method: 'POST', json: body })
    },
    onSuccess: () => {
      toast.success(product ? 'Product updated' : 'Product created')
      qc.invalidateQueries({ queryKey: ['products'] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>Prices are in BDT (৳).</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          {!product && (
            <div className="space-y-1.5">
              <Label>Store</Label>
              <Select value={form.storeId} onValueChange={(v) => set('storeId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-sku">SKU</Label>
              <Input id="p-sku" value={form.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Category</Label>
              <Input id="p-cat" list="categories" value={form.category} onChange={(e) => set('category', e.target.value)} />
              <datalist id="categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Price (৳)</Label>
              <Input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-compare">Compare-at price (৳)</Label>
              <Input id="p-compare" type="number" min="0" step="0.01" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-qty">Stock quantity</Label>
              <Input id="p-qty" type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v as Form['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-tags">Tags (comma separated)</Label>
              <Input id="p-tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="cotton, eid, summer" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Images</Label>
              <GalleryInput value={form.images} onChange={(v) => set('images', v)} storeId={form.storeId} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending || !form.storeId}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
