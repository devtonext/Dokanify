'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, MoreVertical, Mail, Phone, MapPin, UsersRound, UserCheck, UserPlus, BadgeDollarSign, Loader2, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MetricCard } from '@/components/dashboard/metric-card'
import { FilterSelect, PageHeader, Pager, StatusBadge, TableState } from '@/components/dashboard/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
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
import { DISTRICTS, formatBdPhone } from '@/lib/bd'
import { formatBDT } from '@/lib/currency'
import { formatDate, initials, paymentLabel } from '@/lib/format'
import type { Customer, Order } from '@/lib/types'

function CustomersView() {
  const qc = useQueryClient()
  const router = useRouter()
  const params = useSearchParams()
  const { storeId, store } = useStoreScope()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('all')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const [editing, setEditing] = useState<Customer | null | undefined>(undefined)
  const q = useDebounced(search)

  useEffect(() => setPage(1), [q, city, type, sort, storeId])
  useEffect(() => setOpenId(params.get('open')), [params])

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { storeId, q, city, type, sort, page }],
    queryFn: () =>
      api<{ customers: Customer[]; total: number; page: number; limit: number; cities: string[]; stats: { total: number; active: number; new: number; avgOrderValue: number } }>(
        `/api/customers${qs({ store: storeId, search: q, city, type, sort, page, limit: 20 })}`
      ),
    placeholderData: keepPreviousData,
  })

  const block = useMutation({
    mutationFn: (c: Customer) => api(`/api/customers/${c.id}`, { method: 'PATCH', json: { isBlocked: !c.isBlocked } }),
    onSuccess: () => {
      toast.success('Customer updated')
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const open = (id: string | null) => {
    setOpenId(id)
    router.replace(id ? `/customers?open=${id}` : '/customers', { scroll: false })
  }
  const s = data?.stats

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={store ? `Customers of ${store.name}` : 'Customers across all stores'}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Customers" value={s ? s.total.toLocaleString() : '—'} icon={UsersRound} trend="neutral" tone="violet" />
        <MetricCard
          title="Active (90 days)"
          value={s ? s.active.toLocaleString() : '—'}
          change={s?.total ? `${Math.round((s.active / s.total) * 100)}% of total` : undefined}
          icon={UserCheck}
          trend="up"
          tone="emerald"
        />
        <MetricCard title="New (30 days)" value={s ? String(s.new) : '—'} icon={UserPlus} trend={s?.new ? 'up' : 'neutral'} tone="sky" />
        <MetricCard title="Avg Order Value" value={s ? formatBDT(Math.round(s.avgOrderValue)) : '—'} icon={BadgeDollarSign} trend="neutral" tone="amber" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[260px] flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or phone..." className="pl-9" />
              </div>
            </div>
            <FilterSelect value={city} onChange={setCity} placeholder="City" options={[{ value: 'all', label: 'All Cities' }, ...(data?.cities ?? []).map((c) => ({ value: c, label: c }))]} />
            <FilterSelect
              value={type}
              onChange={setType}
              placeholder="Customer Type"
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'new', label: 'New (0-30 days)' },
                { value: 'active', label: 'Ordered in 90 days' },
                { value: 'loyal', label: 'Loyal (5+ orders)' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
            <FilterSelect
              value={sort}
              onChange={setSort}
              placeholder="Sort By"
              options={[
                { value: 'recent', label: 'Most Recent' },
                { value: 'orders', label: 'Most Orders' },
                { value: 'spent', label: 'Highest Spent' },
                { value: 'name', label: 'Name (A-Z)' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>{data?.total ?? 0} customers found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || error || !data?.customers.length ? (
                  <TableState colSpan={7} loading={isLoading} error={error} empty="No customers match these filters" />
                ) : (
                  data.customers.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => open(c.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{initials(c.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 font-medium">
                              {c.name}
                              {c.isBlocked && <Badge variant="destructive">Blocked</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">{store ? `Joined ${formatDate(c.createdAt)}` : c.store?.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {c.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{c.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{formatBdPhone(c.phone)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{c.city || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatBDT(c.totalSpent)}</TableCell>
                      <TableCell>{c.orderCount}</TableCell>
                      <TableCell>{formatDate(c.lastOrderAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Customer actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => open(c.id)}>View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditing(c)}>Edit</DropdownMenuItem>
                            {c.email && <DropdownMenuItem onClick={() => (window.location.href = `mailto:${c.email}`)}>Send Email</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => window.open(`https://wa.me/${c.phone.replace('+', '')}`, '_blank')}>WhatsApp</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => block.mutate(c)}>
                              <Ban className="mr-2 h-4 w-4" />
                              {c.isBlocked ? 'Unblock Customer' : 'Block Customer'}
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

      <CustomerSheet id={openId} onClose={() => open(null)} onEdit={setEditing} />
      <CustomerDialog customer={editing} onClose={() => setEditing(undefined)} />
    </div>
  )
}

function CustomerSheet({ id, onClose, onEdit }: { id: string | null; onClose: () => void; onEdit: (c: Customer) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api<{ customer: Customer & { orders: Order[] } }>(`/api/customers/${id}`),
    enabled: Boolean(id),
  })
  const c = data?.customer
  return (
    <Sheet open={Boolean(id)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {isLoading || !c ? (
          <div className="grid h-full place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {c.name} {c.isBlocked && <Badge variant="destructive">Blocked</Badge>}
              </SheetTitle>
              <SheetDescription>
                {c.store?.name} · customer since {formatDate(c.createdAt)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Total spent" value={formatBDT(c.totalSpent)} />
                <Stat label="Orders" value={String(c.orderCount)} />
                <Stat label="Avg order" value={c.orderCount ? formatBDT(Math.round(c.totalSpent / c.orderCount)) : '—'} />
              </div>
              <div className="space-y-1">
                <p>{formatBdPhone(c.phone)}</p>
                {c.email && <p>{c.email}</p>}
                <p className="text-muted-foreground">{[c.address, c.city, c.district !== c.city ? c.district : null].filter(Boolean).join(', ')}</p>
                {c.notes && <p className="rounded-md bg-muted p-2 text-xs">{c.notes}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => onEdit(c)}>
                Edit customer
              </Button>
              <div className="space-y-2">
                <h4 className="font-semibold">Order history</h4>
                <div className="divide-y rounded-lg border">
                  {c.orders.length ? (
                    c.orders.map((o) => (
                      <Link key={o.id} href={`/orders?open=${o.id}`} className="flex items-center justify-between p-3 hover:bg-muted/50">
                        <div>
                          <p className="font-medium">#{o.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(o.createdAt)} · {paymentLabel(o.paymentMethod)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatBDT(o.total)}</p>
                          <StatusBadge status={o.status} />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="p-3 text-muted-foreground">No orders yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function CustomerDialog({ customer, onClose }: { customer: Customer | null | undefined; onClose: () => void }) {
  const qc = useQueryClient()
  const { storeId, stores } = useStoreScope()
  const [targetStore, setTargetStore] = useState(storeId)
  const [district, setDistrict] = useState('Dhaka')
  useEffect(() => {
    setTargetStore(storeId)
    setDistrict(customer?.district || 'Dhaka')
  }, [customer, storeId])

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      customer ? api(`/api/customers/${customer.id}`, { method: 'PATCH', json: body }) : api('/api/customers', { method: 'POST', json: { ...body, storeId: targetStore } }),
    onSuccess: () => {
      toast.success(customer ? 'Customer updated' : 'Customer added')
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer'] })
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={customer !== undefined} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit customer' : 'Add customer'}</DialogTitle>
        </DialogHeader>
        <form
          key={customer?.id || 'new'}
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
            save.mutate({ ...f, district })
          }}
        >
          {!customer && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Store</Label>
              <Select value={targetStore} onValueChange={setTargetStore}>
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
          <Field name="name" label="Name" defaultValue={customer?.name} required />
          <Field name="phone" label="Mobile" defaultValue={customer?.phone} placeholder="01XXXXXXXXX" required />
          <Field name="email" label="Email" type="email" defaultValue={customer?.email || ''} />
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
          <Field name="address" label="Address" defaultValue={customer?.address || ''} />
          <Field name="city" label="City / Thana" defaultValue={customer?.city || ''} />
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={customer?.notes || ''} rows={2} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending || (!customer && !targetStore)}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
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
      <Label htmlFor={`c-${name}`}>{label}</Label>
      <Input id={`c-${name}`} name={name} {...props} />
    </div>
  )
}

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <Suspense>
        <CustomersView />
      </Suspense>
    </DashboardLayout>
  )
}
