'use client'

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Eye, EyeOff, GripVertical, Loader2, Lock, Monitor, Plus, Settings2, Smartphone, Trash2, ArrowUpCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/dashboard/shared'
import { FieldInput, type FieldContext } from '@/components/editor/field-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, qs } from '@/lib/api'
import { emptyValue, isUnlocked, type SectionInstance, type ThemeContent, type ThemeSectionSchema } from '@/lib/themes/spec'
import type { Product, ThemeInstallDetail } from '@/lib/types'
import { cn } from '@/lib/utils'

type Selection = { kind: 'section'; id: string } | { kind: 'group'; id: string } | null

const newId = (type: string) => `${type}-${Math.random().toString(36).slice(2, 7)}`

export default function ThemeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['theme-install', id],
    queryFn: () => api<{ install: ThemeInstallDetail }>(`/api/theme-installs/${id}`),
  })
  const install = data?.install

  if (error) return <p className="p-8 text-destructive">{(error as Error).message}</p>
  if (isLoading || !install) {
    return (
      <div className="grid h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <Editor key={install.version.id} install={install} onReload={() => qc.invalidateQueries({ queryKey: ['theme-install', id] })} />
}

function Editor({ install, onReload }: { install: ThemeInstallDetail; onReload: () => void }) {
  const qc = useQueryClient()
  const iframe = useRef<HTMLIFrameElement>(null)
  const { manifest, sectionSchemas, settingsSchema, defaults } = install.version
  const planKey = install.store.plan.key

  const [content, setContent] = useState<ThemeContent>(install.draftContent)
  const [dirty, setDirty] = useState(false)
  const [page, setPage] = useState(manifest.pages[0])
  const [selection, setSelection] = useState<Selection>(null)
  const [tab, setTab] = useState('sections')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [locale, setLocale] = useState<'en' | 'bn'>('en')
  const [ready, setReady] = useState(false)
  const [confirmUpgrade, setConfirmUpgrade] = useState(false)
  const bilingual = install.version.features.includes('bilingual')

  // Data for product/collection pickers
  const { data: productData } = useQuery({
    queryKey: ['products', 'editor', install.store.id],
    queryFn: () => api<{ products: Product[] }>(`/api/products${qs({ store: install.store.id, status: 'ACTIVE', limit: 100 })}`),
  })
  const { data: catData } = useQuery({
    queryKey: ['products', 'categories', install.store.id],
    queryFn: () => api<{ categories: { name: string }[] }>(`/api/products/categories${qs({ store: install.store.id })}`),
  })
  const ctx: FieldContext = {
    locale,
    planKey,
    storeId: install.store.id,
    themeBase: install.themeBase,
    products: productData?.products.map((p) => ({ slug: p.slug, name: p.name })) ?? [],
    categories: catData?.categories.map((c) => c.name) ?? [],
  }

  const sections = content.pages[page]?.sections ?? []
  const selectedSection = selection?.kind === 'section' ? sections.find((s) => s.id === selection.id) : undefined
  const selectedGroup = selection?.kind === 'group' ? settingsSchema.groups.find((g) => g.id === selection.id) : undefined

  // ── Preview bridge ──
  const post = useCallback((message: Record<string, unknown>) => {
    iframe.current?.contentWindow?.postMessage({ source: 'nexdrop-editor', ...message }, '*')
  }, [])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframe.current?.contentWindow || e.data?.source !== 'nexdrop-theme') return
      if (e.data.type === 'ready') setReady(true)
      if (e.data.type === 'section-click' && typeof e.data.id === 'string') {
        setTab('sections')
        setSelection({ kind: 'section', id: e.data.id })
      }
      if (e.data.type === 'navigate' && manifest.pages.includes(e.data.page)) setPage(e.data.page)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [manifest.pages])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => post({ type: 'content', content, locale }), 80)
    return () => clearTimeout(t)
  }, [content, locale, ready, post])

  useEffect(() => {
    if (ready && selection?.kind === 'section') post({ type: 'select', id: selection.id })
  }, [selection, ready, post])

  // ── Mutations ──
  const updateSections = (fn: (s: SectionInstance[]) => SectionInstance[]) => {
    setContent((c) => ({ ...c, pages: { ...c.pages, [page]: { sections: fn(c.pages[page]?.sections ?? []) } } }))
    setDirty(true)
  }
  const updateSection = (sid: string, key: string, value: unknown) =>
    updateSections((list) => list.map((s) => (s.id === sid ? { ...s, settings: { ...s.settings, [key]: value } } : s)))
  const updateSetting = (key: string, value: unknown) => {
    setContent((c) => ({ ...c, settings: { ...c.settings, [key]: value } }))
    setDirty(true)
  }

  const addable = Object.values(sectionSchemas).filter((s) => !s.pages?.length || s.pages.includes(page))
  function addSection(schema: ThemeSectionSchema) {
    const preset = Object.values(defaults.pages)
      .flatMap((p) => p.sections)
      .find((s) => s.type === schema.type)?.settings
    const settings = preset ? structuredClone(preset) : Object.fromEntries(schema.fields.map((f) => [f.key, emptyValue(f)]))
    const section = { id: newId(schema.type), type: schema.type, settings }
    updateSections((list) => [...list, section])
    setSelection({ kind: 'section', id: section.id })
  }

  const save = useMutation({
    mutationFn: () => api<{ install: { draftContent: ThemeContent } }>(`/api/theme-installs/${install.id}`, { method: 'PUT', json: { content } }),
    onSuccess: (res) => {
      setContent(res.install.draftContent)
      setDirty(false)
      toast.success('Draft saved')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const publish = useMutation({
    mutationFn: async () => {
      if (dirty) await save.mutateAsync()
      return api(`/api/theme-installs/${install.id}/publish`, { method: 'POST' })
    },
    onSuccess: () => {
      toast.success(`Published — ${install.store.name} is now live with ${install.theme.name}`)
      qc.invalidateQueries({ queryKey: ['theme-installs'] })
      onReload()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Ctrl/Cmd+S saves; warn before leaving with unsaved changes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (dirty && !save.isPending) save.mutate()
      }
    }
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [dirty, save])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    updateSections((list) => {
      const from = list.findIndex((s) => s.id === e.active.id)
      const to = list.findIndex((s) => s.id === e.over!.id)
      return arrayMove(list, from, to)
    })
  }

  const previewSrc = useMemo(() => install.previewUrl, [install.previewUrl])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/theme">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {install.theme.name} <span className="font-normal text-muted-foreground">· {install.store.name}</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">
              v{install.version.version} · {install.isLive ? 'Live theme' : 'Not live'} · {install.store.plan.name} plan
            </p>
          </div>
          {install.updateAvailable && (
            <Button size="sm" variant="outline" className="h-7" onClick={() => setConfirmUpgrade(true)}>
              <ArrowUpCircle className="mr-1 h-3.5 w-3.5" /> Update theme
            </Button>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Select value={page} onValueChange={(p) => { setPage(p); setSelection(null); post({ type: 'navigate', page: p }) }}>
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {manifest.pages.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)} page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex rounded-md border p-0.5">
            <Button size="icon" variant={device === 'desktop' ? 'secondary' : 'ghost'} className="h-7 w-7" onClick={() => setDevice('desktop')} aria-label="Desktop preview">
              <Monitor className="h-4 w-4" />
            </Button>
            <Button size="icon" variant={device === 'mobile' ? 'secondary' : 'ghost'} className="h-7 w-7" onClick={() => setDevice('mobile')} aria-label="Mobile preview">
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          {bilingual && (
            <div className="flex rounded-md border p-0.5 text-xs">
              {(['en', 'bn'] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLocale(l)} className={cn('rounded px-2 py-1', locale === l ? 'bg-secondary font-semibold' : 'text-muted-foreground')}>
                  {l === 'en' ? 'EN' : 'বাংলা'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          {install.isLive && (
            <Button size="icon" variant="ghost" asChild aria-label="Open live store">
              <a href={`/s/${install.store.slug}/`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save Draft
          </Button>
          <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate()}>
            {publish.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {install.isLive ? 'Publish Changes' : 'Publish & make live'}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left: structure */}
        <aside className="flex w-72 shrink-0 flex-col border-r bg-card">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="m-3 grid grid-cols-2">
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="settings">Theme settings</TabsTrigger>
            </TabsList>
            <TabsContent value="sections" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {sections.map((s) => (
                      <SectionRow
                        key={s.id}
                        section={s}
                        schema={sectionSchemas[s.type]}
                        selected={selection?.kind === 'section' && selection.id === s.id}
                        onSelect={() => setSelection({ kind: 'section', id: s.id })}
                        onToggle={() => updateSections((list) => list.map((x) => (x.id === s.id ? { ...x, hidden: !x.hidden } : x)))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {!sections.length && <p className="px-1 py-4 text-xs text-muted-foreground">This page has no sections yet.</p>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Plus className="mr-1 h-4 w-4" /> Add section
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel>Sections for this page</DropdownMenuLabel>
                  {addable.map((schema) => {
                    const locked = !isUnlocked(schema.minPlan, planKey)
                    const taken = schema.unique && sections.some((s) => s.type === schema.type)
                    return (
                      <DropdownMenuItem key={schema.type} disabled={locked || Boolean(taken)} onClick={() => addSection(schema)}>
                        <div className="flex w-full items-center justify-between gap-2">
                          <span>{schema.label}</span>
                          {locked && (
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <Lock className="h-3 w-3" />
                              {schema.minPlan}
                            </Badge>
                          )}
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsContent>
            <TabsContent value="settings" className="mt-0 min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
              {settingsSchema.groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelection({ kind: 'group', id: g.id })}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted',
                    selection?.kind === 'group' && selection.id === g.id && 'bg-muted font-medium'
                  )}
                >
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  {g.label}
                </button>
              ))}
            </TabsContent>
          </Tabs>
          <div className="border-t p-3 text-[11px] text-muted-foreground">
            Features: {install.version.features.join(', ')}
          </div>
        </aside>

        {/* Center: live preview */}
        <main className="relative flex min-w-0 flex-1 justify-center bg-muted p-3">
          <iframe
            ref={iframe}
            src={previewSrc}
            title="Theme preview"
            sandbox="allow-scripts allow-forms allow-popups"
            onLoad={() => post({ type: 'ping' })}
            className={cn('h-full rounded-lg border-0 bg-white shadow-sm transition-all duration-300', device === 'mobile' ? 'w-[390px]' : 'w-full')}
          />
          {!ready && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
              Connecting to theme… (themes must use @nexdrop/theme-sdk for live editing)
            </div>
          )}
        </main>

        {/* Right: inspector */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l bg-card">
          {selectedSection && sectionSchemas[selectedSection.type] ? (
            <div className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">{sectionSchemas[selectedSection.type].label}</h2>
                  {sectionSchemas[selectedSection.type].description && (
                    <p className="text-xs text-muted-foreground">{sectionSchemas[selectedSection.type].description}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  aria-label="Remove section"
                  onClick={() => {
                    updateSections((list) => list.filter((s) => s.id !== selectedSection.id))
                    setSelection(null)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {sectionSchemas[selectedSection.type].fields.map((f) => (
                <FieldInput key={f.key} field={f} value={selectedSection.settings[f.key]} ctx={ctx} onChange={(v) => updateSection(selectedSection.id, f.key, v)} />
              ))}
            </div>
          ) : selectedGroup ? (
            <div className="space-y-4 p-4">
              <h2 className="text-sm font-semibold">{selectedGroup.label}</h2>
              {selectedGroup.fields.map((f) => (
                <FieldInput key={f.key} field={f} value={content.settings[f.key]} ctx={ctx} onChange={(v) => updateSetting(f.key, v)} />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Select a section on the left — or click it in the preview — to edit its content, images and colors.
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmUpgrade}
        onOpenChange={setConfirmUpgrade}
        title="Update to the latest theme version?"
        description="Your draft content is carried over where the new version still supports it. The live store keeps its published version until you publish again."
        confirmLabel="Update draft"
        onConfirm={async () => {
          if (dirty) await save.mutateAsync()
          await api(`/api/theme-installs/${install.id}/upgrade`, { method: 'POST' })
          toast.success('Draft moved to the latest version')
          onReload()
        }}
      />
    </div>
  )
}

function SectionRow({
  section,
  schema,
  selected,
  onSelect,
  onToggle,
}: {
  section: SectionInstance
  schema?: ThemeSectionSchema
  selected: boolean
  onSelect: () => void
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-1 rounded-lg border border-transparent px-1 py-1.5 text-sm',
        selected ? 'border-indigo-200 bg-indigo-50' : 'hover:bg-muted',
        isDragging && 'z-10 bg-white shadow-md',
        section.hidden && 'opacity-50'
      )}
    >
      <button type="button" className="cursor-grab p-1 text-muted-foreground active:cursor-grabbing" aria-label="Drag to reorder" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left">
        {schema?.label || section.type}
      </button>
      <button type="button" onClick={onToggle} className="p-1 text-muted-foreground opacity-0 group-hover:opacity-100" aria-label={section.hidden ? 'Show section' : 'Hide section'}>
        {section.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
