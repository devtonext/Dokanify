'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Store, CreditCard, Truck, BellRing, ShieldCheck, Save, Loader2, Plus, Trash2, Layers, Users, History } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { PageHeader, StoreRequired } from '@/components/dashboard/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useStoreScope } from '@/hooks/use-store-scope'
import { api } from '@/lib/api'
import { COURIERS, DISTRICTS } from '@/lib/bd'
import { formatBDT } from '@/lib/currency'
import { formatDateTime } from '@/lib/format'
import type { StoreSettings } from '@/lib/store-settings'
import { KNOWN_FEATURES } from '@/lib/themes/spec'
import type { AdminRole, Plan, StoreSummary } from '@/lib/types'

function SettingsView() {
  const params = useSearchParams()
  const { data: session } = useSession()
  const isSuper = (session?.user as { role?: string })?.role === 'SUPER_ADMIN'
  const [tab, setTab] = useState(params.get('tab') || 'general')

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Store configuration and platform administration" />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isSuper && <TabsTrigger value="plans">Plans</TabsTrigger>}
          {isSuper && <TabsTrigger value="team">Team</TabsTrigger>}
          <TabsTrigger value="security">Security</TabsTrigger>
          {isSuper && <TabsTrigger value="audit">Audit log</TabsTrigger>}
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>
        <StoreSettingsTabs />
        {isSuper && (
          <>
            <TabsContent value="plans">
              <PlansTab />
            </TabsContent>
            <TabsContent value="team">
              <TeamTab />
            </TabsContent>
            <TabsContent value="audit">
              <AuditTab />
            </TabsContent>
          </>
        )}
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Store: general ──────────────────────────────────────────────────────────

function GeneralTab() {
  const qc = useQueryClient()
  const { storeId, store } = useStoreScope()
  const [form, setForm] = useState<Partial<StoreSummary> & { timezone?: string }>({})
  useEffect(() => setForm(store ? { ...store } : {}), [store])

  const save = useMutation({
    mutationFn: () =>
      api(`/api/stores/${storeId}`, {
        method: 'PATCH',
        json: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, language: form.language },
      }),
    onSuccess: () => {
      toast.success('Store information saved')
      qc.invalidateQueries({ queryKey: ['stores'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!storeId) return <StoreRequired action="configure" />
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Information
          </CardTitle>
          <CardDescription>Basic information about {store?.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email">Store Email</Label>
              <Input id="store-email" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Phone Number</Label>
              <Input id="store-phone" placeholder="+880 1XXX-XXXXXX" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-currency">Currency</Label>
              <Input id="store-currency" value="BDT - Bangladeshi Taka" disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-address">Address</Label>
            <Textarea id="store-address" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-city">City</Label>
              <Input id="store-city" value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Default storefront language</Label>
              <Select value={form.language || 'en'} onValueChange={(v) => set('language', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <SaveBar busy={save.isPending} onSave={() => save.mutate()} />
    </div>
  )
}

// ─── Store: payments / shipping / notifications (one settings document) ─────

function StoreSettingsTabs() {
  const qc = useQueryClient()
  const { storeId, store } = useStoreScope()
  const { data } = useQuery({
    queryKey: ['store-settings', storeId],
    queryFn: () => api<{ settings: StoreSettings }>(`/api/stores/${storeId}/settings`),
    enabled: Boolean(storeId),
  })
  const [s, setS] = useState<StoreSettings | null>(null)
  useEffect(() => setS(data?.settings ?? null), [data])

  const save = useMutation({
    mutationFn: () => api<{ settings: StoreSettings }>(`/api/stores/${storeId}/settings`, { method: 'PUT', json: s }),
    onSuccess: (res) => {
      toast.success('Settings saved')
      qc.setQueryData(['store-settings', storeId], res)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = (fn: (draft: StoreSettings) => void) =>
    setS((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      fn(next)
      return next
    })

  const body = (content: React.ReactNode) =>
    !storeId ? <StoreRequired action="configure" /> : !s ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : content

  const gateways = [
    { key: 'bkash', name: 'bKash', desc: "Bangladesh's largest mobile financial service", placeholder: '017XXXXXXXX', fields: ['merchant', 'username', 'password', 'apiKey', 'secret'] },
    { key: 'nagad', name: 'Nagad', desc: 'Mobile financial service by Bangladesh Post Office', placeholder: '018XXXXXXXX', fields: ['merchant', 'apiKey', 'secret'] },
    { key: 'rocket', name: 'Rocket', desc: "Dutch-Bangla Bank's mobile financial service", placeholder: '019XXXXXXXX', fields: ['merchant', 'apiKey'] },
    { key: 'sslcommerz', name: 'SSLCommerz', desc: 'Cards, internet banking and wallets', placeholder: 'Store ID', fields: ['merchant', 'secret'] },
  ] as const
  const FIELD_LABEL: Record<string, string> = { merchant: 'Merchant account / Store ID', username: 'Username', password: 'Password', apiKey: 'App key', secret: 'App secret' }
  const SECRET = new Set(['password', 'apiKey', 'secret'])

  return (
    <>
      <TabsContent value="payments">
        {body(
          s && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Gateways
                  </CardTitle>
                  <CardDescription>
                    Secrets are encrypted at rest and never sent back to the browser. A method appears at checkout only if it is enabled here, the
                    store’s plan ({store?.plan.name}) unlocks it, and the live theme supports it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {gateways.map((g) => {
                    const cfg = s.payments[g.key]
                    return (
                      <div key={g.key} className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{g.name}</h4>
                            <p className="text-sm text-muted-foreground">{g.desc}</p>
                          </div>
                          <Switch checked={cfg.enabled} onCheckedChange={(v) => update((d) => void (d.payments[g.key].enabled = v))} />
                        </div>
                        {cfg.enabled && (
                          <>
                            <Separator />
                            <div className="grid gap-4 md:grid-cols-2">
                              {g.fields.map((f) => (
                                <div key={f} className="space-y-2">
                                  <Label>{FIELD_LABEL[f]}</Label>
                                  <Input
                                    type={SECRET.has(f) ? 'password' : 'text'}
                                    autoComplete="off"
                                    placeholder={f === 'merchant' ? g.placeholder : ''}
                                    value={cfg[f]}
                                    onChange={(e) => update((d) => void (d.payments[g.key][f] = e.target.value))}
                                  />
                                </div>
                              ))}
                              <div className="flex items-center gap-3">
                                <Switch checked={cfg.sandbox} onCheckedChange={(v) => update((d) => void (d.payments[g.key].sandbox = v))} />
                                <Label>Sandbox mode</Label>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Cash on Delivery (COD)</h4>
                        <p className="text-sm text-muted-foreground">Customers pay the rider on delivery</p>
                      </div>
                      <Switch checked={s.payments.cod.enabled} onCheckedChange={(v) => update((d) => void (d.payments.cod.enabled = v))} />
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Additional COD fee (BDT)</Label>
                        <Input type="number" min="0" value={s.payments.cod.fee} onChange={(e) => update((d) => void (d.payments.cod.fee = Number(e.target.value)))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum COD order (BDT)</Label>
                        <Input type="number" min="0" value={s.payments.cod.maxAmount} onChange={(e) => update((d) => void (d.payments.cod.maxAmount = Number(e.target.value)))} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <SaveBar busy={save.isPending} onSave={() => save.mutate()} />
            </div>
          )
        )}
      </TabsContent>

      <TabsContent value="shipping">
        {body(
          s && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Zones
                  </CardTitle>
                  <CardDescription>
                    Orders are matched to the first zone listing their district. A zone with no districts catches everything else.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {s.shipping.zones.map((z, i) => (
                    <div key={z.id} className="space-y-4 rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Input className="max-w-xs font-semibold" value={z.name} onChange={(e) => update((d) => void (d.shipping.zones[i].name = e.target.value))} />
                        <div className="flex items-center gap-2">
                          <Switch checked={z.enabled} onCheckedChange={(v) => update((d) => void (d.shipping.zones[i].enabled = v))} />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remove zone"
                            disabled={s.shipping.zones.length <= 1}
                            onClick={() => update((d) => void d.shipping.zones.splice(i, 1))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Rate (BDT)</Label>
                          <Input type="number" min="0" value={z.rate} onChange={(e) => update((d) => void (d.shipping.zones[i].rate = Number(e.target.value)))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Delivery time</Label>
                          <Input value={z.time} onChange={(e) => update((d) => void (d.shipping.zones[i].time = e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Districts</Label>
                          <Input
                            list="districts"
                            placeholder="Empty = all other districts"
                            value={z.districts.join(', ')}
                            onChange={(e) =>
                              update(
                                (d) =>
                                  void (d.shipping.zones[i].districts = e.target.value
                                    .split(',')
                                    .map((x) => x.trim())
                                    .filter(Boolean))
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <datalist id="districts">
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      update((d) => void d.shipping.zones.push({ id: `zone-${Date.now().toString(36)}`, name: 'New zone', enabled: true, rate: 100, time: '2-4 days', districts: [] }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add New Shipping Zone
                  </Button>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Free shipping over (BDT)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Disabled"
                        value={s.shipping.freeShippingOver ?? ''}
                        onChange={(e) => update((d) => void (d.shipping.freeShippingOver = e.target.value === '' ? null : Number(e.target.value)))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Default courier</Label>
                      <Select value={s.shipping.courier || 'none'} onValueChange={(v) => update((d) => void (d.shipping.courier = v === 'none' ? '' : v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {COURIERS.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <SaveBar busy={save.isPending} onSave={() => save.mutate()} />
            </div>
          )
        )}
      </TabsContent>

      <TabsContent value="notifications">
        {body(
          s && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Admin alerts and customer messages for {store?.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(
                    [
                      ['newOrder', 'New order received', 'Notify admins when an order is placed'],
                      ['statusUpdate', 'Order status update', 'Notify admins when order status changes'],
                      ['lowStock', 'Low stock alert', 'Notify admins when products run low'],
                      ['customerEmail', 'Customer email updates', 'Order confirmation and shipping emails'],
                      ['customerSms', 'Customer SMS updates', 'Order SMS via your SMS gateway (BDT ~0.35/SMS)'],
                    ] as const
                  ).map(([key, label, help]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label>{label}</Label>
                        <p className="text-xs text-muted-foreground">{help}</p>
                      </div>
                      <Switch checked={s.notifications[key]} onCheckedChange={(v) => update((d) => void (d.notifications[key] = v))} />
                    </div>
                  ))}
                  <div className="max-w-xs space-y-2 pt-2">
                    <Label>Low stock threshold</Label>
                    <Input
                      type="number"
                      min="0"
                      value={s.notifications.lowStockThreshold}
                      onChange={(e) => update((d) => void (d.notifications.lowStockThreshold = Number(e.target.value)))}
                    />
                  </div>
                </CardContent>
              </Card>
              <SaveBar busy={save.isPending} onSave={() => save.mutate()} />
            </div>
          )
        )}
      </TabsContent>
    </>
  )
}

// ─── Platform: plans ─────────────────────────────────────────────────────────

function PlansTab() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['plans'], queryFn: () => api<{ plans: Plan[] }>('/api/plans') })
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Plan> }) => api(`/api/plans/${id}`, { method: 'PATCH', json: body }),
    onSuccess: () => {
      toast.success('Plan updated')
      qc.invalidateQueries({ queryKey: ['plans'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {data?.plans.map((p) => (
        <Card key={p.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {p.name}
            </CardTitle>
            <CardDescription>
              {p._count?.stores ?? 0} stores · {p.priceMonthly ? `${formatBDT(p.priceMonthly)}/month` : 'Free'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price / month</Label>
                <Input type="number" defaultValue={p.priceMonthly} onBlur={(e) => Number(e.target.value) !== p.priceMonthly && patch.mutate({ id: p.id, body: { priceMonthly: Number(e.target.value) } })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max products</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  defaultValue={p.maxProducts ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value === '' ? null : Number(e.target.value)
                    if (v !== p.maxProducts) patch.mutate({ id: p.id, body: { maxProducts: v } })
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unlocked features</Label>
              <p className="text-xs text-muted-foreground">Theme fields, sections and payment methods marked with these features unlock on this plan.</p>
              <div className="flex flex-wrap gap-1.5">
                {KNOWN_FEATURES.map((f) => {
                  const on = p.features.includes(f)
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => patch.mutate({ id: p.id, body: { features: on ? p.features.filter((x) => x !== f) : [...p.features, f] } })}
                    >
                      <Badge variant={on ? 'default' : 'outline'} className="cursor-pointer">
                        {f}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Platform: team ──────────────────────────────────────────────────────────

type Admin = { id: string; email: string; name: string; role: AdminRole; isActive: boolean; lastLoginAt: string | null }

function TeamTab() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admins'], queryFn: () => api<{ admins: Admin[] }>('/api/admins') })
  const [role, setRole] = useState<AdminRole>('SUPPORT')
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admins'] })
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/api/admins', { method: 'POST', json: body }),
    onSuccess: () => {
      toast.success('Team member added')
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Admin> }) => api(`/api/admins/${id}`, { method: 'PATCH', json: body }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin team
          </CardTitle>
          <CardDescription>Super admins: everything. Theme managers: upload and publish themes. Support: stores, orders, products and customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </TableCell>
                  <TableCell>
                    <Select value={a.role} onValueChange={(v) => patch.mutate({ id: a.id, body: { role: v as AdminRole } })}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
                        <SelectItem value="THEME_MANAGER">Theme manager</SelectItem>
                        <SelectItem value="SUPPORT">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatDateTime(a.lastLoginAt)}</TableCell>
                  <TableCell className="text-right">
                    <Switch checked={a.isActive} onCheckedChange={(v) => patch.mutate({ id: a.id, body: { isActive: v } })} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add team member</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              create.mutate({ ...Object.fromEntries(new FormData(form)), role }, { onSuccess: () => form.reset() })
            }}
          >
            <Input name="name" placeholder="Full name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Temporary password (10+ chars)" required minLength={10} />
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPPORT">Support</SelectItem>
                <SelectItem value="THEME_MANAGER">Theme manager</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="md:col-span-4 md:w-fit" disabled={create.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Add member
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Security / audit ────────────────────────────────────────────────────────

function SecurityTab() {
  const change = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/api/account/password', { method: 'POST', json: body }),
    onSuccess: () => toast.success('Password updated'),
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Password
        </CardTitle>
        <CardDescription>Use at least 10 characters. Sessions expire after 12 hours.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            change.mutate(Object.fromEntries(new FormData(form)), { onSuccess: () => form.reset() })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" name="current" type="password" autoComplete="current-password" required />
          </div>
          <div />
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" name="next" type="password" autoComplete="new-password" required minLength={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required />
          </div>
          <Button type="submit" variant="outline" className="w-fit" disabled={change.isPending}>
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function AuditTab() {
  const { data } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api<{ logs: { id: string; action: string; entity: string; entityId: string | null; createdAt: string; actor: { name: string } | null }[] }>('/api/audit?limit=100'),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit log
        </CardTitle>
        <CardDescription>Last 100 admin actions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(l.createdAt)}</TableCell>
                <TableCell>{l.actor?.name || 'System'}</TableCell>
                <TableCell className="font-mono text-xs">{l.action}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {l.entity}:{l.entityId?.slice(-8)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SaveBar({ busy, onSave }: { busy: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end">
      <Button onClick={onSave} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Changes
      </Button>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Suspense>
        <SettingsView />
      </Suspense>
    </DashboardLayout>
  )
}
