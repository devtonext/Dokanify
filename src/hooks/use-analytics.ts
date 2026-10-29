'use client'

import { useQuery } from '@tanstack/react-query'
import { api, qs } from '@/lib/api'
import type { OrderStatus } from '@/lib/types'

export interface Analytics {
  range: string
  metrics: {
    revenue: { value: number; change: number }
    orders: { value: number; change: number }
    customers: { value: number; change: number; new: number }
    aov: { value: number; change: number }
    stock: { units: number; products: number }
  }
  monthly: { month: string; revenue: number; orders: number; customers: number }[]
  payments: { method: string; amount: number; orders: number; percentage: number }[]
  cities: { name: string; value: number }[]
  categories: { name: string; sales: number; orders: number }[]
  recentOrders: { id: string; orderNumber: number; total: number; status: OrderStatus; createdAt: string; shippingName: string; store: { name: string } }[]
  topProducts: { name: string; sold: number; revenue: number }[]
}

export function useAnalytics(storeId: string, range: string) {
  return useQuery({
    queryKey: ['analytics', storeId, range],
    queryFn: () => api<Analytics>(`/api/analytics${qs({ store: storeId, range })}`),
  })
}
