'use client'

import { cn } from '@/lib/utils'
import { useSidebarState } from '@/components/dashboard/sidebar-state'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'

function CaretLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
      <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
    </svg>
  )
}

function CaretRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
      <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
    </svg>
  )
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebarState()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden p-3 lg:block',
        'transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        collapsed ? 'w-20' : 'w-[17rem]',
        'bg-transparent dark:bg-transparent'
      )}
    >
      <div className="relative h-full">
        <div className="h-full overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-xl transition-shadow duration-700 dark:border-white/15 dark:bg-slate-900/80 dark:shadow-black/40">
          <SidebarNav />
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="sidebar-collapse-arrow"
          style={{
            position: 'absolute',
            top: '50%',
            right: 0,
            zIndex: 50,
            display: 'flex',
            height: 24,
            width: 16,
            transform: 'translate(100%, -50%)',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0,
            border: 'none',
            borderRadius: 0,
            background: 'transparent',
            boxShadow: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          {collapsed ? <CaretRightIcon /> : <CaretLeftIcon />}
        </button>
      </div>
    </aside>
  )
}
