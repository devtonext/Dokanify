'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, FileArchive, Loader2, UploadCloud, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { api, ApiError, putFile } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import type { ImportReport } from '@/lib/types'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'uploading' | 'validating' | 'done'

export function UploadThemeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  function reset() {
    setPhase('idle')
    setProgress(0)
    setFile(null)
    setReport(null)
    setError('')
  }

  async function start(f: File) {
    reset()
    setFile(f)
    if (!f.name.toLowerCase().endsWith('.zip')) {
      setError('Please choose a .zip file')
      return
    }
    try {
      setPhase('uploading')
      const { key, uploadUrl } = await api<{ key: string; uploadUrl: string }>('/api/themes/uploads', {
        method: 'POST',
        json: { filename: f.name, size: f.size },
      })
      await putFile(uploadUrl, f, 'application/zip', setProgress)
      setPhase('validating')
      try {
        const { report } = await api<{ report: ImportReport }>('/api/themes/import', { method: 'POST', json: { key } })
        setReport(report)
        qc.invalidateQueries({ queryKey: ['themes'] })
      } catch (e) {
        // 422 = validation failed: the report lists every problem
        if (e instanceof ApiError && e.status === 422) setReport((e.details as ImportReport) || null)
        else throw e
      }
      setPhase('done')
    } catch (e) {
      setError((e as Error).message)
      setPhase('idle')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (phase === 'uploading' || phase === 'validating') return
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload theme</DialogTitle>
          <DialogDescription>
            A zip that follows the NexDrop Theme Spec (theme.json, schema/, defaults/, dist/). Uploading a higher version of an existing theme adds a new version.
          </DialogDescription>
        </DialogHeader>

        {phase === 'idle' && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files[0]
              if (f) start(f)
            }}
            className={cn(
              'flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition',
              dragging ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-muted/50'
            )}
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop theme .zip here or click to browse</p>
              <p className="text-xs text-muted-foreground">Validated for structure, safety and plan features before import</p>
            </div>
          </button>
        )}
        <input ref={input} type="file" accept=".zip,application/zip" hidden onChange={(e) => e.target.files?.[0] && start(e.target.files[0])} />
        {error && <p className="text-sm text-destructive">{error}</p>}

        {file && phase !== 'idle' && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <FileArchive className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            {phase !== 'done' && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        )}
        {phase === 'uploading' && <Progress value={progress} />}
        {phase === 'validating' && <p className="text-sm text-muted-foreground">Validating and importing…</p>}

        {phase === 'done' && report && (
          <div className="space-y-4">
            {report.ok ? (
              <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {report.manifest?.name} v{report.manifest?.version} imported
                  </p>
                  <p>
                    {report.isNewTheme ? 'New theme created as Draft.' : report.becameCurrent ? 'Now the current version.' : 'Added as a new version — release it from the theme page.'}{' '}
                    {report.stats.files} files, {formatBytes(report.stats.bytes)}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <XCircle className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">Theme rejected — fix these and upload again</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {report.errors.map((e) => (
                      <li key={e} className="break-words">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {report.warnings.length > 0 && (
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <ul className="list-disc space-y-0.5 pl-4">
                  {report.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.manifest && (
              <div className="flex flex-wrap gap-1 text-xs">
                {report.manifest.features.map((f) => (
                  <span key={f} className="rounded-full bg-muted px-2 py-0.5">
                    {f}
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Upload another
              </Button>
              {report.ok && report.themeId && (
                <Button asChild onClick={() => onOpenChange(false)}>
                  <Link href={`/theme/${report.themeId}`}>Open theme</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
