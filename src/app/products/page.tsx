'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, EllipsisVertical, Pencil, Trash2, Boxes, Images, PackageCheck, TriangleAlert, CircleOff } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ConfirmDialog, FilterSelect, PageHeader, Pager, StatusBadge, TableState } from '@/components/dashboard/shared'
import { ProductDialog } from '@/components/products/product-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDebounced } from '@/hooks/use-debounced'
import { useStoreScope } from '@/hooks/use-store-scope'
import { api, qs } from '@/lib/api'
import { formatBDT } from '@/lib/currency'
import type { Product } from '@/lib/types'

const stockColor = (q: number) => (q === 0 ? 'bg-red-100 text-red-800' : q <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800')
const stockText = (q: number) => (q === 0 ? 'Out of Stock' : q <= 10 ? 'Low Stock' : 'In Stock')

function ProductsView() {
  const qc = useQueryClient()
  const params = useSearchParams()
  const { storeId, store } = useStoreScope()
  const [search, setSearch] = useState(params.get('search') || '')
  const [category, setCategory] = useState('all')
  const [stock, setStock] = useState(params.get('stock') || 'all')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Product | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const q = useDebounced(search)

  useEffect(() => setPage(1), [q, category, stock, sort, storeId])

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { storeId, q, category, stock, sort, page }],
    queryFn: () =>
      api<{ products: Product[]; total: number; page: number; limit: number; stats: { total: number; inStock: number; lowStock: number; outOfStock: number } }>(
        `/api/products${qs({ store: storeId, search: q, category, stock, sort, page, limit: 20 })}`
      ),
    placeholderData: keepPreviousData,
  })
  const { data: cats } = useQuery({
    queryKey: ['products', 'categories', storeId],
    queryFn: () => api<{ categories: { name: string; count: number }[] }>(`/api/products/categories${qs({ store: storeId })}`),
  })
  const categories = cats?.categories.map((c) => c.name) ?? []

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Product> }) => api(`/api/products/${id}`, { method: 'PATCH', json: body }),
    onSuccess: () => {
      toast.success('Product updated')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const s = data?.stats
  const pct = (n?: number) => (s?.total ? `${Math.round(((n ?? 0) / s.total) * 100)}% of total` : '')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description={store ? `Inventory and pricing for ${store.name}` : 'Inventory and pricing across all stores'}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Products" value={s ? String(s.total) : '—'} change={categories.length ? `${categories.length} categories` : undefined} icon={Boxes} trend="neutral" tone="sky" />
        <MetricCard title="In Stock" value={s ? String(s.inStock) : '—'} change={pct(s?.inStock)} icon={PackageCheck} trend="up" tone="emerald" />
        <MetricCard title="Low Stock" value={s ? String(s.lowStock) : '—'} change="10 or fewer left" icon={TriangleAlert} trend="neutral" tone="amber" />
        <MetricCard title="Out of Stock" value={s ? String(s.outOfStock) : '—'} change="Restock needed" icon={CircleOff} trend={s?.outOfStock ? 'down' : 'neutral'} tone="rose" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[260px] flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU or tag..." className="pl-9" />
              </div>
            </div>
            <FilterSelect
              value={category}
              onChange={setCategory}
              placeholder="Category"
              options={[{ value: 'all', label: 'All Categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
            <FilterSelect
              value={stock}
              onChange={setStock}
              placeholder="Stock Status"
              options={[
                { value: 'all', label: 'All Stock' },
                { value: 'in', label: 'In Stock' },
                { value: 'low', label: 'Low Stock' },
                { value: 'out', label: 'Out of Stock' },
              ]}
            />
            <FilterSelect
              value={sort}
              onChange={setSort}
              placeholder="Sort By"
              options={[
                { value: 'recent', label: 'Newest' },
                { value: 'name-asc', label: 'Name (A-Z)' },
                { value: 'name-desc', label: 'Name (Z-A)' },
                { value: 'price-asc', label: 'Price (Low to High)' },
                { value: 'price-desc', label: 'Price (High to Low)' },
                { value: 'stock-asc', label: 'Stock (Low to High)' },
                { value: 'stock-desc', label: 'Stock (High to Low)' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>{data?.total ?? 0} products found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || error || !data?.products.length ? (
                  <TableState colSpan={7} loading={isLoading} error={error} empty="No products match these filters" />
                ) : (
                  data.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {product.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Images className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{product.name}</div>
                            <div className="flex gap-1">
                              {!store && <span className="text-xs text-muted-foreground">{product.store?.name}</span>}
                              {store &&
                                product.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>{product.category || '—'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{formatBDT(product.price)}</div>
                        {product.comparePrice && <div className="text-xs text-muted-foreground line-through">{formatBDT(product.comparePrice)}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`border-transparent ${stockColor(product.quantity)}`}>
                          {product.quantity} - {stockText(product.quantity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Product actions">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditing(product)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const value = window.prompt(`New stock for ${product.name}`, String(product.quantity))
                                if (value !== null && !Number.isNaN(Number(value))) patch.mutate({ id: product.id, body: { quantity: Number(value) } })
                              }}
                            >
                              Update Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => patch.mutate({ id: product.id, body: { status: product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE' } })}
                            >
                              {product.status === 'ACTIVE' ? 'Hide from store' : 'Make active'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(product)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {data && <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />}
        </CardContent>
      </Card>

      <ProductDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} product={editing} categories={categories} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="Past orders keep their copy of this product. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await api(`/api/products/${deleting!.id}`, { method: 'DELETE' })
          toast.success('Product deleted')
          qc.invalidateQueries({ queryKey: ['products'] })
        }}
      />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <Suspense>
        <ProductsView />
      </Suspense>
    </DashboardLayout>
  )
}
