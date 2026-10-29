import { ArrowDownRight, ArrowUpRight, LucideIcon, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type MetricTone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'indigo'

interface MetricCardProps {
  title: string
  value: string
  change?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  tone?: MetricTone
}

const trendConfig = {
  up: {
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    TrendIcon: ArrowUpRight,
  },
  down: {
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
    TrendIcon: ArrowDownRight,
  },
  neutral: {
    badge: 'bg-muted text-muted-foreground',
    TrendIcon: Minus,
  },
}

const toneConfig: Record<MetricTone, { wash: string; orb: string; icon: string }> = {
  emerald: {
    wash: 'from-emerald-400/35 via-teal-300/15 to-transparent',
    orb: 'bg-emerald-400/50',
    icon: 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30',
  },
  sky: {
    wash: 'from-sky-400/35 via-cyan-300/15 to-transparent',
    orb: 'bg-sky-400/50',
    icon: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30',
  },
  violet: {
    wash: 'from-violet-400/35 via-fuchsia-300/15 to-transparent',
    orb: 'bg-violet-400/50',
    icon: 'bg-gradient-to-br from-violet-400 to-indigo-600 text-white shadow-lg shadow-violet-500/30',
  },
  amber: {
    wash: 'from-amber-400/40 via-orange-300/15 to-transparent',
    orb: 'bg-amber-400/50',
    icon: 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/30',
  },
  rose: {
    wash: 'from-rose-400/35 via-pink-300/15 to-transparent',
    orb: 'bg-rose-400/50',
    icon: 'bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-lg shadow-rose-500/30',
  },
  indigo: {
    wash: 'from-indigo-400/35 via-blue-300/15 to-transparent',
    orb: 'bg-indigo-400/50',
    icon: 'bg-gradient-to-br from-indigo-400 to-blue-700 text-white shadow-lg shadow-indigo-500/30',
  },
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  tone = 'sky',
}: MetricCardProps) {
  const config = trendConfig[trend]
  const palette = toneConfig[tone]
  const TrendIcon = config.TrendIcon

  return (
    <Card className="group relative gap-4 overflow-hidden py-5">
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90',
          palette.wash
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl',
          palette.orb
        )}
      />
      <div className="pointer-events-none absolute -bottom-16 left-8 h-28 w-28 rounded-full bg-white/40 blur-2xl dark:bg-white/5" />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 px-5 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105',
            palette.icon
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="relative z-10 px-5">
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        {change && (
          <p
            className={cn(
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              config.badge
            )}
          >
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
