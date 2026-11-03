'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import type { StoreSummary } from '@/lib/types'

interface StoreScope {
  /** '' = all stores */
  storeId: string
  setStoreId: (id: string) => void
  stores: StoreSummary[]
  store: StoreSummary | undefined
  isLoading: boolean
}

const Ctx = createContext<StoreScope | null>(null)
const KEY = 'nexdrop.storeScope'

export function StoreScopeProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [storeId, setState] = useState('')

  useEffect(() => {
    try {
      setState(window.localStorage.getItem(KEY) || '')
    } catch {
      /* storage unavailable */
    }
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api<{ stores: StoreSummary[] }>('/api/stores'),
    enabled: true,
  })
  const stores = useMemo(() => data?.stores ?? [], [data])

  // Auto-scope to the first available merchant store if none is selected
  useEffect(() => {
    if (stores.length > 0) {
      if (!storeId || !stores.some((s) => s.id === storeId)) {
        const first = stores[0].id
        setState(first)
        try {
          window.localStorage.setItem(KEY, first)
        } catch {}
      }
    }
  }, [stores, storeId])

  const setStoreId = useCallback((id: string) => {
    setState(id)
    try {
      window.localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ storeId, setStoreId, stores, store: stores.find((s) => s.id === storeId), isLoading }),
    [storeId, setStoreId, stores, isLoading]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStoreScope() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStoreScope must be used within StoreScopeProvider')
  return ctx
}
