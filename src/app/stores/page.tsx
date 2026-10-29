'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Loader2, Plus, Search, Store as StoreIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { FilterSelect, PageHeader, StatusBadge, TableState } from '@/components/dashboard/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDebounced } from '@/hooks/use-debounced'
import { useStoreScope } from '@/hooks/use-store-scope'
import { api, qs } from '@/lib/api'
import { formatBdPhone } from '@/lib/bd'
import { formatBDT } from '@/lib/currency'
import { formatDate } from '@/lib/format'
import type { Plan, StoreSummary } from '@/lib/types'

function StoresView() {
  const router = useRouter()
  const params = useSearchParams()
  const { setStoreId } = useStoreScope()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const q = useDebounced(search)

  const { data, isLoading, error } = useQuery({
    queryKey: ['stores', 'list', q, status],
    queryFn: () => api<{ stores: StoreSummary[] }>(`/api/stores${qs({ search: q, status })}`),
  })
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: () => api<{ plans: Plan[] }>('/api/plans') })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stores"
        description="Every merchant store running on NexDrop"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Store
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {plans?.plans.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{p.name} plan</p>
                <p className="text-2xl font-semibold">{p._count?.stores ?? 0} stores</p>
              </div>
              <Badge variant="outline">{p.priceMonthly ? `${formatBDT(p.priceMonthly)}/mo` : 'Free'}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[260px] flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search store name, URL or email..." className="pl-9" />
              </div>
            </div>
            <FilterSelect
              value={status}
              onChange={setStatus}
              placeholder="Status"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Stores</CardTitle>
          <CardDescription>{data?.stores.length ?? 0} stores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Live theme</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || error || !data?.stores.length ? (
                  <TableState colSpan={8} loading={isLoading} error={error} empty="No stores yet" />
                ) : (
                  data.stores.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => setOpenId(s.id)}>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{s.slug}</div>
                      </TableCell>
                      <TableCell>
                        <div>{s.ownerName}</div>
                        <div className="text-xs text-muted-foreground">{formatBdPhone(s.phone)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.plan.name}</Badge>
                      </TableCell>
                      <TableCell>{s.themeInstalls[0]?.theme.name || <span className="text-muted-foreground">None</span>}</TableCell>
                      <TableCell className="text-right tabular-nums">{s._count.products}</TableCell>
                      <TableCell className="text-right tabular-nums">{s._count.orders}</TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setStoreId(s.id)
                            router.push('/')
                          }}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateStoreDialog open={creating} onOpenChange={setCreating} plans={plans?.plans ?? []} />
      <StoreSheet id={openId} onClose={() => setOpenId(null)} plans={plans?.plans ?? []} />
    </div>
  )
}

function CreateStoreDialog({ open, onOpenChange, plans }: { open: boolean; onOpenChange: (o: boolean) => void; plans: Plan[] }) {
  const qc = useQueryClient()
  const [plan, setPlan] = useState('free')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!slugTouched)
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 40)
      )
  }, [name, slugTouched])

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/api/stores', { method: 'POST', json: body }),
    onSuccess: () => {
      toast.success('Store created')
      qc.invalidateQueries({ queryKey: ['stores'] })
      qc.invalidateQueries({ queryKey: ['plans'] })
      onOpenChange(false)
      setName('')
      setSlugTouched(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New store</DialogTitle>
          <DialogDescription>Creates the merchant workspace. Install a theme from Themes afterwards.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            const f = Object.fromEntries(new FormData(e.currentTarget))
            create.mutate({ ...f, name, slug, planKey: plan })
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-name">Store name</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-slug">Store URL</Label>
            <Input
              id="s-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value.toLowerCase())
              }}
              required
            />
            <p className="text-xs text-muted-foreground">Used for {slug || 'your-store'}.nexdrop.app</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-owner">Owner name</Label>
            <Input id="s-owner" name="ownerName" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phone">Owner mobile</Label>
            <Input id="s-phone" name="phone" placeholder="01XXXXXXXXX" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-email">Email</Label>
            <Input id="s-email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-city">City</Label>
            <Input id="s-city" name="city" defaultValue="Dhaka" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.name} — {p.priceMonthly ? `${formatBDT(p.priceMonthly)}/month` : 'Free'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create store
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StoreSheet({ id, onClose, plans }: { id: string | null; onClose: () => void; plans: Plan[] }) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['store', id],
    queryFn: () =>
      api<{
        store: Omit<StoreSummary, 'plan' | 'themeInstalls'> & {
          plan: Plan
          themeInstalls: { id: string; isLive: boolean; theme: { id: string; name: string }; version: { version: string } }[]
        }
      }>(`/api/stores/${id}`),
    enabled: Boolean(id),
  })
  const store = data?.store
  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/api/stores/${id}`, { method: 'PATCH', json: body }),
    onSuccess: () => {
      toast.success('Store updated')
      qc.invalidateQueries({ queryKey: ['stores'] })
      qc.invalidateQueries({ queryKey: ['store', id] })
      qc.invalidateQueries({ queryKey: ['plans'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Sheet open={Boolean(id)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {!store ? (
          <div className="grid h-full place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <StoreIcon className="h-4 w-4" /> {store.name}
              </SheetTitle>
              <SheetDescription>Created {formatDate(store.createdAt)}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6 text-sm">
              <div className="space-y-1">
                <p>{store.ownerName}</p>
                <p>{formatBdPhone(store.phone)}</p>
                <p>{store.email}</p>
                <p className="text-muted-foreground">{[store.address, store.city].filter(Boolean).join(', ')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Plan</Label>
                  <Select value={store.plan.key} onValueChange={(v) => patch.mutate({ planKey: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={store.status} onValueChange={(v) => patch.mutate({ status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Unlocked by plan</h4>
                <div className="flex flex-wrap gap-1">
                  {store.plan.features.map((f) => (
                    <Badge key={f} variant="secondary">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Themes</h4>
                {store.themeInstalls.length ? (
                  store.themeInstalls.map((i) => (
                    <div key={i.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{i.theme.name}</p>
                        <p className="text-xs text-muted-foreground">v{i.version.version}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {i.isLive && <Badge className="bg-green-500">Live</Badge>}
                        <Button asChild size="sm" variant="outline">
                          <a href={`/theme/editor/${i.id}`}>Customize</a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No theme installed yet.</p>
                )}
                {store.themeInstalls.some((i) => i.isLive) && (
                  <Button asChild variant="link" className="h-auto p-0">
                    <a href={`/s/${store.slug}/`} target="_blank" rel="noreferrer">
                      Open live storefront <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function StoresPage() {
  return (
    <DashboardLayout>
      <Suspense>
        <StoresView />
      </Suspense>
    </DashboardLayout>
  )
}
