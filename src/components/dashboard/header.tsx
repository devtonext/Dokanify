'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { signOut, useSession } from 'next-auth/react'
import { Menu, Store } from 'lucide-react'
import { IconBell, IconSearch, IconUser } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { useIsDesktop } from '@/hooks/use-media-query'
import { useStoreScope } from '@/hooks/use-store-scope'
import { api } from '@/lib/api'
import { isDemoEmail } from '@/lib/demo'
import { timeAgo } from '@/lib/format'
import type { NotificationItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDesktop = useIsDesktop()
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/40 bg-white/40 px-4 backdrop-blur-xl md:gap-4 md:px-6 dark:border-white/10 dark:bg-slate-950/40">
      {!isDesktop && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
          className="shrink-0 rounded-xl"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[17rem] gap-0 border-white/60 bg-white/95 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav />
          <SheetClose asChild>
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground hover:bg-white/60 hover:text-black dark:hover:bg-white/40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </SheetClose>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <StoreSwitcher />
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1">
        {isDemoEmail(session?.user?.email) && (
          <span
            className="mr-1 hidden rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 sm:inline"
            title="Shared demo account: password and team changes are disabled"
          >
            Demo account
          </span>
        )}
        <Notifications />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              <IconUser className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block">{session?.user?.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">{session?.user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=security">Account security</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => signOut({ callbackUrl: '/login' })}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function StoreSwitcher() {
  const { storeId, setStoreId, stores } = useStoreScope()
  return (
    <Select value={storeId || 'all'} onValueChange={(v) => setStoreId(v === 'all' ? '' : v)}>
      <SelectTrigger className="w-[150px] shrink-0 bg-white/70 sm:w-[210px]" aria-label="Store scope">
        <Store className="h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All stores</SelectItem>
        <SelectSeparator />
        {stores.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type SearchResult = { type: string; label: string; hint: string; href: string }

function GlobalSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
  })

  return (
    <Popover open={open && debounced.length >= 2} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative hidden max-w-md flex-1 md:block">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search orders, products, customers, themes..."
            className="pl-9"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        {isFetching && !data ? (
          <p className="p-3 text-sm text-muted-foreground">Searching…</p>
        ) : data?.results.length ? (
          data.results.map((r) => (
            <button
              key={r.type + r.href}
              type="button"
              onClick={() => {
                setOpen(false)
                setQ('')
                router.push(r.href)
              }}
              className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="truncate">{r.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {r.type} · {r.hint}
              </span>
            </button>
          ))
        ) : (
          <p className="p-3 text-sm text-muted-foreground">No results for “{debounced}”</p>
        )}
      </PopoverContent>
    </Popover>
  )
}

function Notifications() {
  const qc = useQueryClient()
  const router = useRouter()
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<{ notifications: NotificationItem[]; unread: number }>('/api/notifications'),
    refetchInterval: 60_000,
  })
  const markRead = useMutation({
    mutationFn: () => api('/api/notifications', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <Popover onOpenChange={(open) => !open && data?.unread && markRead.mutate()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <IconBell className="h-5 w-5" />
          {!!data?.unread && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Notifications</div>
        <div className="max-h-96 overflow-y-auto">
          {data?.notifications.length ? (
            data.notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => n.href && router.push(n.href)}
                className={cn('block w-full border-b px-4 py-3 text-left last:border-0 hover:bg-muted/60', !n.read && 'bg-indigo-50/60')}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
              </button>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">You are all caught up.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
