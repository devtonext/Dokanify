'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImage } from '@/lib/api'
import { cn } from '@/lib/utils'

/** Resolves theme-relative paths (e.g. "images/hero.jpg") against the theme's base URL for display. */
export function resolveImage(src: string, base?: string) {
  if (!src) return ''
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/') || src.startsWith('data:')) return src
  return base ? base + src : src
}

export function ImageInput({
  value,
  onChange,
  storeId,
  base,
  className,
}: {
  value: string
  onChange: (url: string) => void
  storeId?: string
  base?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function pick(file?: File) {
    if (!file) return
    setBusy(true)
    try {
      onChange(await uploadImage(file, storeId))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveImage(value, base)} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-white/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          {value ? 'Replace' : 'Upload'}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
            Remove
          </Button>
        )}
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL" className="h-8 text-xs" />
    </div>
  )
}

export function GalleryInput({ value, onChange, storeId, base, max = 12 }: { value: string[]; onChange: (v: string[]) => void; storeId?: string; base?: string; max?: number }) {
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function pick(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files).slice(0, max - value.length)) urls.push(await uploadImage(file, storeId))
      onChange([...value, ...urls])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((src, i) => (
        <div key={src + i} className="group relative h-20 w-20 overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveImage(src, base)} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {value.length < max && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="grid h-20 w-20 place-items-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50"
          aria-label="Add images"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        </button>
      )}
      <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(e) => pick(e.target.files)} />
    </div>
  )
}
