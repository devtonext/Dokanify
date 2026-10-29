'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, Download, Loader2, Lock, Monitor, Smartphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ConfirmDialog, StatusBadge } from '@/components/dashboard/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { formatBDT } from '@/lib/currency'
import { formatBytes, formatDate, formatDateTime } from '@/lib/format'
import type { ThemeDetail, ThemeStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const ACTIONS: Record<ThemeStatus, { to: ThemeStatus; label: string; variant?: 'outline' | 'destructive' }[]> = {
  DRAFT: [
    { to: 'IN_REVIEW', label: 'Submit for review', variant: 'outline' },
    { to: 'PUBLISHED', label: 'Publish to marketplace' },
  ],
  IN_REVIEW: [
    { to: 'DRAFT', label: 'Back to draft', variant: 'outline' },
    { to: 'PUBLISHED', label: 'Approve & publish' },
  ],
  PUBLISHED: [
    { to: 'DRAFT', label: 'Unpublish', variant: 'outline' },
    { to: 'ARCHIVED', label: 'Archive', variant: 'destructive' },
  ],
  ARCHIVED: [{ to: 'DRAFT', label: 'Restore as draft', variant: 'outline' }],
}

export default function ThemeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const router = useRouter()
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [deletingTheme, setDeletingTheme] = useState(false)

  const { data, isLoading, error } = useQuery({ queryKey: ['theme', id], queryFn: () => api<{ theme: ThemeDetail }>(`/api/themes/${id}`) })
  const theme = data?.theme

  const onSaved = (res: { theme: ThemeDetail }) => {
    qc.setQueryData(['theme', id], res)
    qc.invalidateQueries({ queryKey: ['themes'] })
  }
  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) => api<{ theme: ThemeDetail }>(`/api/themes/${id}`, { method: 'PATCH', json: body }),
    onSuccess: (res) => {
      toast.success('Theme updated')
      onSaved(res)
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const release = useMutation({
    mutationFn: (versionId: string) => api<{ theme: ThemeDetail }>(`/api/themes/${id}/versions/${versionId}`, { method: 'POST' }),
    onSuccess: (res) => {
      toast.success('Version released')
      onSaved(res)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading || !theme) {
    return (
      <DashboardLayout>
        <div className="grid h-64 place-items-center">{error ? <p className="text-destructive">{(error as Error).message}</p> : <Loader2 className="h-5 w-5 animate-spin" />}</div>
      </DashboardLayout>
    )
  }

  const current = theme.currentVersion
  const sections = Object.values(current?.sectionSchemas || {})
  const warnings = theme.versions.find((v) => v.id === theme.currentVersionId)?.report?.warnings || []

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1100px] space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/theme">
            <ArrowLeft className="mr-2 h-4 w-4" /> Themes
          </Link>
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{theme.name}</h1>
              <StatusBadge status={theme.status} />
              {theme.featured && <Badge className="bg-amber-500">Featured</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {theme.slug} · v{current?.version} · {theme.niche} · updated {formatDate(theme.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTIONS[theme.status].map((a) => (
              <Button key={a.to} variant={a.variant || 'default'} disabled={patch.isPending} onClick={() => patch.mutate({ status: a.to })}>
                {a.label}
              </Button>
            ))}
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <ul className="list-disc space-y-0.5 pl-4">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardContent className="space-y-2 p-2">
            <div className="flex justify-end gap-1 px-2 pt-1">
              <Button size="icon" variant={device === 'desktop' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => setDevice('desktop')} aria-label="Desktop">
                <Monitor className="h-4 w-4" />
              </Button>
              <Button size="icon" variant={device === 'mobile' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => setDevice('mobile')} aria-label="Mobile">
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex h-[560px] justify-center overflow-hidden rounded-lg bg-muted">
              {theme.previewUrl && (
                <iframe
                  src={theme.previewUrl}
                  title={`${theme.name} preview`}
                  sandbox="allow-scripts allow-forms allow-popups"
                  className={cn('h-full border-0 bg-white', device === 'mobile' ? 'w-[390px]' : 'w-full')}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="versions">Versions ({theme.versions.length})</TabsTrigger>
            <TabsTrigger value="stores">Stores ({theme.installs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>Declared in theme.json — they decide which store options unlock</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {current?.features.map((f) => (
                  <Badge key={f} variant="secondary">
                    {f}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pages</CardTitle>
                <CardDescription>Page templates the editor can customize</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {current?.manifest?.pages.map((p) => (
                  <Badge key={p} variant="outline">
                    {p}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Editable sections</CardTitle>
                <CardDescription>
                  {sections.length} sections · {current?.settingsSchema?.groups.reduce((n, g) => n + g.fields.length, 0) ?? 0} global settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Fields</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Plan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections.map((s) => {
                      const locked = s.fields.filter((f) => f.minPlan && f.minPlan !== 'free').length
                      return (
                        <TableRow key={s.type}>
                          <TableCell>
                            <div className="font-medium">{s.label}</div>
                            <div className="font-mono text-xs text-muted-foreground">{s.type}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {s.fields.map((f) => f.type).filter((t, i, a) => a.indexOf(t) === i).join(', ')}
                            <span className="text-muted-foreground"> ({s.fields.length})</span>
                          </TableCell>
                          <TableCell className="text-sm">{s.pages?.join(', ') || 'any'}</TableCell>
                          <TableCell>
                            {s.minPlan && s.minPlan !== 'free' ? (
                              <Badge variant="outline">
                                <Lock className="mr-1 h-3 w-3" />
                                {s.minPlan}
                              </Badge>
                            ) : locked ? (
                              <span className="text-xs text-muted-foreground">{locked} pro fields</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">all plans</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace">
            <MarketplaceForm theme={theme} busy={patch.isPending} onSave={(body) => patch.mutate(body)} />
          </TabsContent>

          <TabsContent value="versions">
            <Card>
              <CardHeader>
                <CardTitle>Versions</CardTitle>
                <CardDescription>
                  Upload a zip with a higher version in theme.json to add a version. Stores move to a new version from the editor (“Update available”).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Changelog</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {theme.versions.map((v) => {
                      const isCurrent = v.id === theme.currentVersionId
                      return (
                        <TableRow key={v.id}>
                          <TableCell>
                            <span className="font-mono font-medium">v{v.version}</span> {isCurrent && <Badge className="ml-1">Current</Badge>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(v.createdAt)}
                            <div className="text-xs text-muted-foreground">{v.uploadedBy?.name}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatBytes(v.sizeBytes)} · {v.fileCount} files
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{v.changelog || '—'}</TableCell>
                          <TableCell className="space-x-1 text-right">
                            {!isCurrent && (
                              <Button size="sm" variant="outline" disabled={release.isPending} onClick={() => release.mutate(v.id)}>
                                Release
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" asChild aria-label="Download package">
                              <a href={v.downloadUrl}>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            {!isCurrent && (
                              <Button size="icon" variant="ghost" aria-label="Delete version" onClick={() => setDeletingVersion(v.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores">
            <Card>
              <CardHeader>
                <CardTitle>Stores using this theme</CardTitle>
              </CardHeader>
              <CardContent>
                {theme.installs.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {theme.installs.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">
                            {i.store.name} {i.isLive && <Badge className="ml-1 bg-green-500">Live</Badge>}
                          </TableCell>
                          <TableCell className="font-mono text-sm">v{i.version.version}</TableCell>
                          <TableCell className="text-sm">{formatDateTime(i.publishedAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/theme/editor/${i.id}`}>Customize</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No store has installed this theme yet.</p>
                )}
                {theme.installs.length === 0 && (
                  <Button variant="outline" className="mt-4 text-destructive" onClick={() => setDeletingTheme(true)}>
                    Delete theme permanently
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={Boolean(deletingVersion)}
        onOpenChange={(o) => !o && setDeletingVersion(null)}
        title="Delete this version?"
        description="Its files are removed from storage. Versions in use by a store cannot be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          try {
            onSaved(await api(`/api/themes/${id}/versions/${deletingVersion}`, { method: 'DELETE' }))
            toast.success('Version deleted')
          } catch (e) {
            toast.error((e as Error).message)
          }
        }}
      />
      <ConfirmDialog
        open={deletingTheme}
        onOpenChange={setDeletingTheme}
        title={`Delete ${theme.name}?`}
        description="All versions and files are removed. This cannot be undone."
        confirmLabel="Delete theme"
        destructive
        onConfirm={async () => {
          try {
            await api(`/api/themes/${id}`, { method: 'DELETE' })
            qc.invalidateQueries({ queryKey: ['themes'] })
            toast.success('Theme deleted')
            router.push('/theme')
          } catch (e) {
            toast.error((e as Error).message)
          }
        }}
      />
    </DashboardLayout>
  )
}

function MarketplaceForm({ theme, busy, onSave }: { theme: ThemeDetail; busy: boolean; onSave: (b: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ name: theme.name, description: theme.description || '', price: String(theme.price), minPlanKey: theme.minPlanKey, featured: theme.featured })
  useEffect(
    () => setForm({ name: theme.name, description: theme.description || '', price: String(theme.price), minPlanKey: theme.minPlanKey, featured: theme.featured }),
    [theme]
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace listing</CardTitle>
        <CardDescription>
          Published themes are listed at <code className="text-xs">/api/public/themes</code> and pushed to the NexDrop marketplace webhook.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Display name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Price (BDT, 0 = free)</Label>
          <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <p className="text-xs text-muted-foreground">{Number(form.price) ? formatBDT(Number(form.price)) : 'Free'}</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Minimum plan to install</Label>
          <Select value={form.minPlanKey} onValueChange={(v) => setForm({ ...form, minPlanKey: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Starter (free)</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
          <Label>Featured on marketplace</Label>
        </div>
        <div className="md:col-span-2">
          <Button disabled={busy} onClick={() => onSave({ ...form, price: Number(form.price) || 0 })}>
            Save listing
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
