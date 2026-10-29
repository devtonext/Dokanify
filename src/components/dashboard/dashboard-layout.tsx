'use client'

import { cn } from '@/lib/utils'
import { Header } from './header'
import { useSidebarState, SidebarStateProvider } from './sidebar-state'
import { Sidebar } from './sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarStateProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarStateProvider>
  )
}

function DashboardShell({ children }: DashboardLayoutProps) {
  const { collapsed } = useSidebarState()

  return (
    <div className="relative h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-[-8%] h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute right-[-6%] top-24 h-[32rem] w-[32rem] rounded-full bg-violet-300/35 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute bottom-[-12%] left-1/3 h-[26rem] w-[26rem] rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgb(248_250_252_/_0.55)_70%)] dark:bg-[radial-gradient(ellipse_at_top,transparent_0%,rgb(2_6_23_/_0.55)_70%)]" />
      </div>

      <Sidebar />

      <div
        className={cn(
          'relative flex h-screen min-w-0 flex-col overflow-hidden transition-[padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          collapsed ? 'lg:pl-20' : 'lg:pl-[17rem]'
        )}
      >
        <Header />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
