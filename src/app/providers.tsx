'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { StoreScopeProvider } from '@/hooks/use-store-scope'

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      })
  )
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <StoreScopeProvider>{children}</StoreScopeProvider>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </SessionProvider>
  )
}
