'use client'

import { useId, useState } from 'react'
import { ChevronDown, ChevronUp, Lock, Plus, Trash2 } from 'lucide-react'
import { GalleryInput, ImageInput } from '@/components/dashboard/image-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { emptyValue, isUnlocked, type Localized, type ThemeField } from '@/lib/themes/spec'
import { cn } from '@/lib/utils'

export const FONTS = [
  'Inter',
  'Poppins',
  'DM Sans',
  'Montserrat',
  'Playfair Display',
  'Lora',
  'Cormorant Garamond',
  'Hind Siliguri',
  'Noto Sans Bengali',
  'Noto Serif Bengali',
  'Tiro Bangla',
  'Baloo Da 2',
  'Anek Bangla',
]

export interface FieldContext {
  locale: 'en' | 'bn'
  planKey: string
  storeId: string
  themeBase: string
  products: { slug: string; name: string }[]
  categories: string[]
}

function readLocalized(value: unknown, locale: 'en' | 'bn') {
  if (typeof value === 'string') return locale === 'en' ? value : ''
  return ((value as Localized | null)?.[locale] as string) ?? ''
}

function writeLocalized(value: unknown, locale: 'en' | 'bn', next: string): Localized {
  const base: Localized = typeof value === 'string' ? { en: value } : { ...((value as Localized) || {}) }
  base[locale] = next
  return base
}

export function FieldInput({ field, value, onChange, ctx }: { field: ThemeField; value: unknown; onChange: (v: unknown) => void; ctx: FieldContext }) {
  const locked = !isUnlocked(field.minPlan, ctx.planKey)
  const id = useId()

  const label = (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-xs font-medium">
        {field.label}
        {field.localized && <span className="ml-1 text-[10px] font-normal uppercase text-muted-foreground">{ctx.locale === 'bn' ? 'বাংলা' : 'EN'}</span>}
      </Label>
      {locked && (
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Lock className="h-3 w-3" /> {field.minPlan}
        </Badge>
      )}
    </div>
  )
  const help = field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>

  if (field.type === 'toggle') {
    return (
      <div className={cn('flex items-center justify-between gap-3', locked && 'opacity-60')}>
        <div>
          {label}
          {help}
        </div>
        <Switch id={id} checked={Boolean(value)} disabled={locked} onCheckedChange={onChange} />
      </div>
    )
  }

  let control: React.ReactNode
  switch (field.type) {
    case 'text':
    case 'link': {
      const v = field.localized ? readLocalized(value, ctx.locale) : String(value ?? '')
      control = (
        <Input
          id={id}
          disabled={locked}
          value={v}
          placeholder={field.type === 'link' ? '#/collection/all or https://…' : ctx.locale === 'bn' && field.localized ? readLocalized(value, 'en') : undefined}
          onChange={(e) => onChange(field.localized ? writeLocalized(value, ctx.locale, e.target.value) : e.target.value)}
        />
      )
      break
    }
    case 'textarea':
    case 'richtext': {
      const v = field.localized ? readLocalized(value, ctx.locale) : String(value ?? '')
      control = (
        <Textarea
          id={id}
          rows={field.type === 'richtext' ? 6 : 3}
          disabled={locked}
          value={v}
          placeholder={ctx.locale === 'bn' && field.localized ? readLocalized(value, 'en') : undefined}
          onChange={(e) => onChange(field.localized ? writeLocalized(value, ctx.locale, e.target.value) : e.target.value)}
        />
      )
      break
    }
    case 'image':
      control = locked ? <Input disabled value={String(value ?? '')} /> : <ImageInput value={String(value ?? '')} onChange={onChange} storeId={ctx.storeId} base={ctx.themeBase} />
      break
    case 'gallery':
      control = <GalleryInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} storeId={ctx.storeId} base={ctx.themeBase} max={field.maxItems || 12} />
      break
    case 'color':
      control = (
        <div className="flex items-center gap-2">
          <input
            type="color"
            disabled={locked}
            value={/^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-10 cursor-pointer rounded border"
            aria-label={field.label}
          />
          <Input id={id} disabled={locked} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
        </div>
      )
      break
    case 'font':
    case 'select':
    case 'collection':
    case 'product': {
      const options =
        field.type === 'font'
          ? FONTS.map((f) => ({ value: f, label: f }))
          : field.type === 'collection'
            ? [{ value: 'all', label: 'All products' }, ...ctx.categories.map((c) => ({ value: c, label: c }))]
            : field.type === 'product'
              ? ctx.products.map((p) => ({ value: p.slug, label: p.name }))
              : field.options || []
      control = (
        <Select value={String(value ?? '') || undefined} onValueChange={onChange} disabled={locked}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
      break
    }
    case 'number':
      control = (
        <Input id={id} type="number" disabled={locked} min={field.min} max={field.max} step={field.step} value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} />
      )
      break
    case 'range':
      control = (
        <div className="flex items-center gap-3">
          <Slider
            disabled={locked}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={[Number(value ?? field.min ?? 0)]}
            onValueChange={([v]) => onChange(v)}
          />
          <span className="w-10 text-right text-xs tabular-nums">{String(value ?? '')}</span>
        </div>
      )
      break
    case 'list':
      control = <ListInput field={field} value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []} onChange={onChange} ctx={ctx} locked={locked} />
      break
  }

  return (
    <div className={cn('space-y-1.5', locked && 'opacity-70')}>
      {label}
      {control}
      {help}
    </div>
  )
}

function singular(label: string) {
  if (label.endsWith('ies')) return label.slice(0, -3) + 'y'
  if (label.endsWith('s') && !label.endsWith('ss')) return label.slice(0, -1)
  return label
}

function ListInput({
  field,
  value,
  onChange,
  ctx,
  locked,
}: {
  field: ThemeField
  value: Record<string, unknown>[]
  onChange: (v: unknown) => void
  ctx: FieldContext
  locked: boolean
}) {
  const [open, setOpen] = useState<number | null>(null)
  const fields = field.fields || []
  const titleKey = fields.find((f) => f.type === 'text')?.key
  const max = field.maxItems || 20

  const move = (i: number, d: number) => {
    const next = [...value]
    const [item] = next.splice(i, 1)
    next.splice(i + d, 0, item)
    onChange(next)
    setOpen(i + d)
  }

  return (
    <div className="space-y-2">
      {value.map((item, i) => {
        const title = titleKey ? readLocalized(item[titleKey], 'en') || readLocalized(item[titleKey], 'bn') : ''
        return (
          <div key={i} className="rounded-lg border">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" className="min-w-0 flex-1 truncate text-left text-xs font-medium" onClick={() => setOpen(open === i ? null : i)}>
                {title || `${field.label} ${i + 1}`}
              </button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={i === 0 || locked} onClick={() => move(i, -1)} aria-label="Move up">
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={i === value.length - 1 || locked} onClick={() => move(i, 1)} aria-label="Move down">
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={locked} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            {open === i && (
              <div className="space-y-3 border-t p-3">
                {fields.map((f) => (
                  <FieldInput key={f.key} field={f} value={item[f.key]} ctx={ctx} onChange={(v) => onChange(value.map((x, j) => (j === i ? { ...x, [f.key]: v } : x)))} />
                ))}
              </div>
            )}
          </div>
        )
      })}
      {value.length < max && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full"
          disabled={locked}
          onClick={() => {
            onChange([...value, Object.fromEntries(fields.map((f) => [f.key, emptyValue(f)]))])
            setOpen(value.length)
          }}
        >
          <Plus className="mr-1 h-3 w-3" /> Add {singular(field.label.toLowerCase())}
        </Button>
      )}
    </div>
  )
}
