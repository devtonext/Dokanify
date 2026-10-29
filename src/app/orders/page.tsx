'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search, Plus, EllipsisVertical, Eye, Printer } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { FilterSelect, PageHeader, Pager, StatusBadge, TableState } from '@/components/dashboard/shared'
import { NewOrderDialog } from '@/components/orders/new-order-dialog'
import { OrderSheet, useOrderUpdate } from '@/components/orders/order-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDebounced } from '@/hooks/use-debounced'
import { useStoreScope } from '@/hooks/use-store-scope'
import { api, qs } from '@/lib/api'
import { formatBdPhone, PAYMENT_LABELS } from '@/lib/bd'
import { formatBDT } from '@/lib/currency'
import { formatDate, paymentLabel } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  ...['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() })),
]
const PAYMENT_OPTIONS = [{ value: 'all', label: 'All Methods' }, ...Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }))]
const RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'year', label: 'Last 12 months' },
]

function OrdersView() {
  const router = useRouter()
  const params = useSearchParams()
  const { storeId, store } = useStoreScope()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [payment, setPayment] = useState('all')
  const [range, setRange] = useState('all')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const [creating, setCreating] = useState(false)
  const q = useDebounced(search)
  const update = useOrderUpdate()

  useEffect(() => setPage(1), [q, status, payment, range, storeId])
  useEffect(() => setOpenId(params.get('open')), [params])

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', { storeId, q, status, payment, range, page }],
    queryFn: () =>
      api<{ orders: Order[]; total: number; page: number; limit: number; statusCounts: Record<string, number> }>(
        `/api/orders${qs({ store: storeId, search: q, status, payment, range, page, limit: 20 })}`
      ),
    placeholderData: keepPreviousData,
  })

  const open = (id: string | null) => {
    setOpenId(id)
    router.replace(id ? `/orders?open=${id}` : '/orders', { scroll: false })
  }
  const quick = (id: string, next: OrderStatus) => update.mutate({ id, input: { status: next } })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={store ? `Orders for ${store.name}` : 'Orders across all stores'}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {['PENDING', 'PROCESSING', 'SHIPPED'].map((s) => (
          <button key={s} type="button" onClick={() => setStatus(status === s ? 'all' : s)}>
            <Badge variant={status === s ? 'default' : 'outline'} className="cursor-pointer px-3 py-1">
              {s[0] + s.slice(1).toLowerCase()} · {data?.statusCounts[s] ?? 0}
            </Badge>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[260px] flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order #, name, phone or tracking code..." className="pl-9" />
              </div>
            </div>
            <FilterSelect value={status} onChange={setStatus} placeholder="Status" options={STATUS_OPTIONS} />
            <FilterSelect value={payment} onChange={setPayment} placeholder="Payment Method" options={PAYMENT_OPTIONS} />
            <FilterSelect value={range} onChange={setRange} placeholder="Date Range" options={RANGE_OPTIONS} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>{data?.total ?? 0} orders found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || error || !data?.orders.length ? (
                  <TableState colSpan={8} loading={isLoading} error={error} empty="No orders match these filters" />
                ) : (
                  data.orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => open(order.id)}>
                      <TableCell>
                        <div className="font-medium">#{order.orderNumber}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div>{order.shippingName}</div>
                        <div className="text-xs text-muted-foreground">{store ? order.city : order.store?.name}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatBdPhone(order.shippingPhone)}</TableCell>
                      <TableCell>{order._count?.items}</TableCell>
                      <TableCell className="font-medium">{formatBDT(order.total)}</TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{paymentLabel(order.paymentMethod)}</div>
                        <StatusBadge status={order.paymentStatus} className="mt-1" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Order actions">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => open(order.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/orders/${order.id}/invoice`, '_blank')}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={!['PENDING', 'PROCESSING'].includes(order.status)} onClick={() => quick(order.id, 'SHIPPED')}>
                              Mark as Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={order.status !== 'SHIPPED'} onClick={() => quick(order.id, 'DELIVERED')}>
                              Mark as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={!['PENDING', 'PROCESSING', 'SHIPPED'].includes(order.status)}
                              onClick={() => quick(order.id, 'CANCELLED')}
                            >
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {data && <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />}
        </CardContent>
      </Card>

      <OrderSheet orderId={openId} onClose={() => open(null)} />
      <NewOrderDialog open={creating} onOpenChange={setCreating} onCreated={(id) => open(id)} />
    </div>
  )
}

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <Suspense>
        <OrdersView />
      </Suspense>
    </DashboardLayout>
  )
}
