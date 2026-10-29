'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Monitor, Smartphone, MoreHorizontal, Store, Search, ExternalLink, Palette, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ConfirmDialog, FilterSelect, StatusBadge } from '@/components/dashboard/shared'
import { PreviewDialog } from '@/components/themes/preview-dialog'
import { UploadThemeDialog } from '@/components/themes/upload-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounced } from '@/hooks/use-debounced'
import { useStoreScope } from '@/hooks/use-store-scope'
import { api, qs } from '@/lib/api'
import { formatDateTime, timeAgo } from '@/lib/format'
import { NICHES, PLAN_RANK } from '@/lib/themes/spec'
import type { ThemeInstallSummary, ThemeSummary } from '@/lib/types'

const niceNiche = (n: string) => n.charAt(0).toUpperCase() + n.slice(1)

function ThemesView() {
  const qc = useQueryClient()
  const router = useRouter()
  const { storeId, store } = useStoreScope()
  const [tab, setTab] = useState('library')
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [niche, setNiche] = useState('all')
  const [preview, setPreview] = useState<{ url: string; title: string; device: 'desktop' | 'mobile' } | null>(null)
  const [removing, setRemoving] = useState<ThemeInstallSummary | null>(null)
  const q = useDebounced(search)

  useEffect(() => setTab(storeId ? 'store' : 'library'), [storeId])

  const { data: lib, isLoading } = useQuery({
    queryKey: ['themes', q, status, niche],
    queryFn: () => api<{ themes: ThemeSummary[] }>(`/api/themes${qs({ search: q, status, niche })}`),
  })
  const { data: inst } = useQuery({
    queryKey: ['theme-installs', storeId],
    queryFn: () => api<{ installs: ThemeInstallSummary[] }>(`/api/theme-installs${qs({ store: storeId })}`),
    enabled: Boolean(storeId),
  })
  const installs = inst?.installs ?? []
  const live = installs.find((i) => i.isLive)
  const others = installs.filter((i) => !i.isLive)

  const install = useMutation({
    mutationFn: (themeId: string) => api<{ install: { id: string } }>(`/api/themes/${themeId}/install`, { method: 'POST', json: { storeId } }),
    onSuccess: ({ install }) => {
      toast.success('Theme added to store — opening editor')
      qc.invalidateQueries({ queryKey: ['theme-installs'] })
      router.push(`/theme/editor/${install.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const publish = useMutation({
    mutationFn: (id: string) => api(`/api/theme-installs/${id}/publish`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Theme is now live')
      qc.invalidateQueries({ queryKey: ['theme-installs'] })
      qc.invalidateQueries({ queryKey: ['stores'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const planRank = PLAN_RANK[store?.plan.key || 'business'] ?? 2

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Themes</h1>
          <p className="text-sm text-muted-foreground">Upload, review and publish storefront themes, and customize them per store.</p>
        </div>
        <Button className="gap-2" onClick={() => setUploading(true)}>
          <Plus className="h-4 w-4" />
          Upload theme
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex border-b">
          <TabsList className="h-auto rounded-none border-b-0 bg-transparent">
            <TabsTrigger value="store" className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
              {store ? `${store.name}'s themes` : 'Store themes'}
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Theme library
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="store" className="space-y-10 pt-6">
          {!store ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">Pick a store in the header to manage its themes.</CardContent>
            </Card>
          ) : (
            <>
              <section>
                <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Store className="h-4 w-4" />
                  Current theme
                </div>
                {live ? (
                  <Card className="overflow-hidden">
                    <CardContent className="p-2">
                      <div className="relative">
                        <div className="absolute right-6 top-6 z-10 flex gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="bg-white/90 shadow-sm hover:bg-white"
                            title="Desktop preview"
                            onClick={() => setPreview({ url: live.liveUrl, title: live.theme.name, device: 'desktop' })}
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="bg-white/90 shadow-sm hover:bg-white"
                            title="Mobile preview"
                            onClick={() => setPreview({ url: live.liveUrl, title: live.theme.name, device: 'mobile' })}
                          >
                            <Smartphone className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-muted">
                          {live.theme.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt={`${live.theme.name} preview`} className="h-full w-full object-cover" src={live.theme.coverUrl} />
                          ) : (
                            <div className="grid h-full place-items-center text-muted-foreground">
                              <Palette className="h-8 w-8" />
                            </div>
                          )}
                          <div className="absolute left-4 top-4">
                            <Badge className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Live</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-between gap-6 border-t p-6 md:flex-row">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-lg font-bold">{live.theme.name}</h3>
                            <span className="text-xs text-muted-foreground">v{live.version.version}</span>
                            {live.updateAvailable && <Badge variant="outline">Update available</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">Last published: {formatDateTime(live.publishedAt)}</p>
                        </div>
                        <div className="flex w-full items-center gap-2 md:w-auto">
                          <Button asChild variant="outline" className="flex-1 md:flex-none">
                            <a href={live.liveUrl} target="_blank" rel="noreferrer">
                              View store <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <Button asChild className="flex-1 md:flex-none">
                            <Link href={`/theme/editor/${live.id}`}>Customize</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      {store.name} has no live theme. Add one from the library, customize it and publish.
                    </CardContent>
                  </Card>
                )}
              </section>

              {others.length > 0 && (
                <section>
                  <h3 className="mb-4 text-lg font-bold">Installed, not live</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {others.map((i) => (
                      <Card key={i.id} className="overflow-hidden">
                        <Cover url={i.theme.coverUrl} name={i.theme.name} />
                        <CardContent className="flex items-center justify-between border-t p-4">
                          <div>
                            <h4 className="text-sm font-semibold">{i.theme.name}</h4>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              v{i.version.version} · edited {timeAgo(i.updatedAt)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Theme actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/theme/editor/${i.id}`}>Customize</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => publish.mutate(i.id)}>Publish (make live)</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setRemoving(i)}>
                                Remove from store
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-6 pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search themes" className="pl-9" />
            </div>
            <FilterSelect
              value={status}
              onChange={setStatus}
              placeholder="Status"
              options={[
                { value: 'all', label: 'All status' },
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'IN_REVIEW', label: 'In review' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
            />
            <FilterSelect value={niche} onChange={setNiche} placeholder="Niche" options={[{ value: 'all', label: 'All niches' }, ...NICHES.map((n) => ({ value: n, label: niceNiche(n) }))]} />
          </div>

          {isLoading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          ) : !lib?.themes.length ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No themes yet. Upload your first theme zip to get started.</p>
                <Button onClick={() => setUploading(true)}>Upload theme</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {lib.themes.map((theme) => {
                const installed = installs.find((i) => i.theme.id === theme.id)
                const locked = store && (PLAN_RANK[theme.minPlanKey] ?? 0) > planRank
                return (
                  <Card key={theme.id} className="group overflow-hidden transition-shadow hover:shadow-md">
                    <div className="relative">
                      <Cover url={theme.coverUrl} name={theme.name} />
                      <div className="absolute left-3 top-3 flex gap-1">
                        <StatusBadge status={theme.status} />
                        {theme.featured && <Badge className="bg-amber-500">Featured</Badge>}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        {theme.previewUrl && (
                          <Button size="sm" variant="secondary" onClick={() => setPreview({ url: theme.previewUrl!, title: theme.name, device: 'desktop' })}>
                            Preview
                          </Button>
                        )}
                        <Button size="sm" asChild>
                          <Link href={`/theme/${theme.id}`}>Details</Link>
                        </Button>
                      </div>
                    </div>
                    <CardContent className="flex items-center justify-between border-t p-4">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold">{theme.name}</h4>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {niceNiche(theme.niche)} · v{theme.currentVersion?.version} · {theme._count?.installs ?? 0} stores
                          {theme.minPlanKey !== 'free' && ` · ${theme.minPlanKey}+`}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Theme actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/theme/${theme.id}`}>Details & versions</Link>
                          </DropdownMenuItem>
                          {store &&
                            (installed ? (
                              <DropdownMenuItem asChild>
                                <Link href={`/theme/editor/${installed.id}`}>Customize for {store.name}</Link>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled={Boolean(locked) || theme.status === 'ARCHIVED'} onClick={() => install.mutate(theme.id)}>
                                {locked ? `Needs ${theme.minPlanKey} plan` : `Add to ${store.name}`}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UploadThemeDialog open={uploading} onOpenChange={setUploading} />
      <PreviewDialog preview={preview} onClose={() => setPreview(null)} onDevice={(device) => preview && setPreview({ ...preview, device })} />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.theme.name}?`}
        description="The store’s customizations for this theme will be deleted."
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          await api(`/api/theme-installs/${removing!.id}`, { method: 'DELETE' })
          qc.invalidateQueries({ queryKey: ['theme-installs'] })
          toast.success('Theme removed')
        }}
      />
    </div>
  )
}

function Cover({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="relative aspect-square overflow-hidden bg-muted">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={url} />
      ) : (
        <div className="grid h-full place-items-center bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-indigo-400">
          <Palette className="h-10 w-10" />
        </div>
      )}
    </div>
  )
}

export default function ThemePage() {
  return (
    <DashboardLayout>
      <Suspense>
        <ThemesView />
      </Suspense>
    </DashboardLayout>
  )
}
