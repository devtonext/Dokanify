'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { IconBell, IconHelp, IconSearch, IconUser } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { useIsDesktop } from '@/hooks/use-media-query'
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
        <SheetContent
          side="left"
          className="w-[17rem] gap-0 border-white/60 bg-white/95 p-0"
        >
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

      <div className="flex-1">
        <div className="relative max-w-md">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders, products, customers..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Help">
          <IconHelp className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <IconBell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              <IconUser className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}