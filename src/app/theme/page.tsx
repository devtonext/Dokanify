'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Store, Palette, Sparkles, ExternalLink, Globe, Layers, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MetricCard } from '@/components/dashboard/metric-card'
import { UploadThemeDialog } from '@/components/themes/upload-dialog'
import { Button } from '@/components/ui/button'
import { useStoreScope } from '@/hooks/use-store-scope'
import { MOCK_THEME_INSTALLS } from '@/lib/mock-data'

export default function ThemesPage() {
  const { store } = useStoreScope()
  const [uploading, setUploading] = useState(false)
  const [installs, setInstalls] = useState(MOCK_THEME_INSTALLS)
  const [activeTab, setActiveTab] = useState<'all' | 'free' | 'paid'>('all')

  const live = installs.find(i => i.isLive) || installs[0]
  const others = installs.filter(i => !i.isLive)

  const publishTheme = (id: string) => {
    setInstalls(prev => prev.map(i => ({ ...i, isLive: i.id === id })))
    toast.success('Theme published! Live storefront updated.')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Universal Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Themes</h1>
            <p className="text-sm text-slate-500">Manage storefront themes and visual customization for {store?.name || 'Aarong Heritage'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/preview/nexdrop-admin.html"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <span>View Storefront ↗</span>
            </Link>
            <Button
              onClick={() => setUploading(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Theme</span>
            </Button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Live Theme"
            value={live ? live.theme.name : 'Verdantra Climate Template'}
            change="v1.0.0 · Active"
            icon={Store}
            trend="up"
            tone="emerald"
          />
          <MetricCard
            title="Installed Themes"
            value={String(installs.length)}
            change={`${others.length} draft in library`}
            icon={Layers}
            trend="neutral"
            tone="sky"
          />
          <MetricCard
            title="Theme Store"
            value="4"
            change="3 free themes"
            icon={Palette}
            trend="up"
            tone="violet"
          />
          <MetricCard
            title="Languages"
            value="EN & বাংলা"
            change="Bilingual storefront"
            icon={Globe}
            trend="neutral"
            tone="amber"
          />
        </div>

        {/* Active Live Theme Card */}
        {live && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-white/95 p-6 shadow-sm dark:bg-slate-900/90">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-teal-400/5" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs">
                  <img
                    src={live.theme.coverUrl || '/images/hero-basin.jpg'}
                    alt={live.theme.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                    Live
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Active on storefront
                    </span>
                    <span className="text-xs text-slate-400">v{live.version}</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{live.theme.name}</h2>
                  <p className="text-xs text-slate-500 line-clamp-2 max-w-xl">{live.theme.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {live.theme.currentVersion?.features.map((f: string) => (
                      <span key={f} className="rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/preview/nexdrop-admin.html"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Live Preview ↗</span>
                </Link>
                <Link
                  href="/preview/nexdrop-admin.html"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Customize in Visual Editor</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Installed Themes Library Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Theme Library</h2>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded px-3 py-1 font-medium transition ${activeTab === 'all' ? 'bg-slate-900 text-white font-semibold dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}
              >
                All ({installs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('free')}
                className={`rounded px-3 py-1 font-medium transition ${activeTab === 'free' ? 'bg-slate-900 text-white font-semibold dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Free Themes
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {installs.map(i => {
              const isCurrent = i.isLive
              return (
                <div
                  key={i.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <img
                        src={i.theme.coverUrl || '/images/hero-basin.jpg'}
                        alt={i.theme.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-2.5 left-2.5 rounded-lg bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white">
                        {isCurrent ? 'Active' : 'Installed'}
                      </span>
                      <span className="absolute top-2.5 right-2.5 rounded-lg bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-800">
                        v{i.version}
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{i.theme.name}</h3>
                        <span className="text-[10px] font-medium text-slate-500 uppercase">{i.theme.niche}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{i.theme.description}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <Link
                      href="/preview/nexdrop-admin.html"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-300"
                    >
                      <span>Customize</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>

                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => publishTheme(i.id)}
                        className="rounded-xl text-xs font-medium"
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {uploading && (
          <UploadThemeDialog open={uploading} onOpenChange={setUploading} />
        )}
      </div>
    </DashboardLayout>
  )
}
