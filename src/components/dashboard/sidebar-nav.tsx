'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, LogOut, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebarState } from '@/components/dashboard/sidebar-state'
import {
  IconAnalytics,
  IconCustomers,
  IconLogo,
  IconOrders,
  IconOverview,
  IconProducts,
  IconSettings,
  IconTheme,
} from '@/components/icons'

const navigation = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', href: '/', icon: IconOverview },
      { name: 'Orders', href: '/orders', icon: IconOrders, badge: '12' },
      { name: 'Products', href: '/products', icon: IconProducts },
      { name: 'Customers', href: '/customers', icon: IconCustomers },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Analytics', href: '/analytics', icon: IconAnalytics },
      { name: 'Theme', href: '/theme', icon: IconTheme },
    ],
  },
  {
    label: 'System',
    items: [{ name: 'Settings', href: '/settings', icon: IconSettings }],
  },
]

const itemBase =
  'group relative flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset'

export function SidebarNav() {
  const { collapsed } = useSidebarState()
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-3 px-5',
          collapsed ? 'justify-center px-2' : ''
        )}
      >
        <Link
          href="/"
          prefetch={true}
          aria-label="Dokanio home"
          className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg ring-1 ring-white/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
        >
          <IconLogo className="size-5" />
        </Link>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-semibold tracking-tight text-foreground">Dokanio</span>
            <span className="block text-[11px] text-muted-foreground">Commerce OS</span>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <nav aria-label="Main">
          {navigation.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && <div className="mx-auto mb-3 h-px w-8 bg-border/60" />}

              {!collapsed && (
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {group.label}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  const badge = 'badge' in item ? item.badge : undefined
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={collapsed ? item.name : undefined}
                      className={cn(
                        itemBase,
                        collapsed
                          ? 'justify-center px-2.5 py-1.5'
                          : 'gap-3 px-3 py-2',
                        isActive
                          ? 'bg-white text-black shadow-md ring-1 ring-white/50 dark:bg-slate-900 dark:text-white dark:ring-slate-800 dark:shadow-slate-900/50'
                          : 'text-muted-foreground hover:bg-white/70 hover:text-black dark:text-white dark:hover:bg-slate-800/70 dark:hover:text-white'
                      )}
                    >
                      <span className="relative grid size-8 place-items-center rounded-lg">
                        <Icon
                          className={cn(
                            'size-[18px] transition-colors',
                            isActive
                              ? 'text-slate-900'
                              : 'text-muted-foreground group-hover:text-black dark:text-muted-foreground dark:group-hover:text-white'
                          )}
                        />
                        {collapsed && badge && (
                          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-indigo-500 ring-2 ring-white" />
                        )}
                      </span>

                      {!collapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {badge ? (
                            <span
                              className={cn(
                                'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                isActive
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                              )}
                            >
                              {badge}
                            </span>
                          ) : (
                            <ChevronRight
                              className={cn(
                                'ml-auto size-4 shrink-0 transition-all duration-200',
                                isActive
                                  ? 'translate-x-0 opacity-100'
                                  : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
                              )}
                            />
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className={cn('shrink-0 border-t border-white/50 dark:border-white/10', collapsed ? 'p-2' : 'p-3')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center rounded-xl border border-white/60 bg-white/60 text-left shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
                collapsed ? 'justify-center p-2' : 'gap-3 p-2.5'
              )}
              aria-label="Rahman Ahmed"
            >
              <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-xs font-semibold text-white dark:from-slate-200 dark:to-slate-400 dark:text-slate-900">
                RA
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1">
                    <span className="block text-xs font-semibold">Rahman Ahmed</span>
                    <span className="block text-[11px] text-muted-foreground">Store Owner</span>
                  </div>
                  <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              rahman@dokanio.store
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              Store settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
