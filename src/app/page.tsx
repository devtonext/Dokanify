'use client'

import Link from 'next/link'
import { Wallet, ShoppingBag, UsersRound, Boxes, Receipt, Sparkles } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MetricCard } from '@/components/dashboard/metric-card'
import { CardGlow, PageHeader, StatusBadge } from '@/components/dashboard/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics } from '@/hooks/use-analytics'
import { useStoreScope } from '@/hooks/use-store-scope'
import { PAYMENT_COLORS, type PaymentMethodKey } from '@/lib/bd'
import { formatBDT, formatBDTCompact } from '@/lib/currency'
import { chartTooltip } from '@/lib/chart'
import { formatChange, paymentLabel, timeAgo, trendOf } from '@/lib/format'

export default function DashboardPage() {
  const { storeId, store } = useStoreScope()
  const { data, isLoading } = useAnalytics(storeId, 'month')
  const m = data?.metrics

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description={store ? `How ${store.name} is doing over the last 30 days.` : 'Platform-wide performance over the last 30 days.'}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Revenue"
            value={m ? formatBDT(m.revenue.value) : '—'}
            change={m && formatChange(m.revenue.change)}
            icon={Wallet}
            trend={m ? trendOf(m.revenue.change) : 'neutral'}
            tone="emerald"
          />
          <MetricCard
            title="Orders"
            value={m ? m.orders.value.toLocaleString() : '—'}
            change={m && formatChange(m.orders.change)}
            icon={ShoppingBag}
            trend={m ? trendOf(m.orders.change) : 'neutral'}
            tone="sky"
          />
          <MetricCard
            title="Customers"
            value={m ? m.customers.value.toLocaleString() : '—'}
            change={m && `+${m.customers.new} new this period`}
            icon={UsersRound}
            trend={m?.customers.new ? 'up' : 'neutral'}
            tone="violet"
          />
          <MetricCard
            title="Units in stock"
            value={m ? m.stock.units.toLocaleString() : '—'}
            change={m && `${m.stock.products} active products`}
            icon={Boxes}
            trend="neutral"
            tone="amber"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="relative overflow-hidden md:col-span-2 lg:col-span-4">
            <CardGlow from="from-emerald-400/20" orb="bg-emerald-400/30" />
            <CardHeader className="relative z-10">
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the last 12 months</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pl-2">
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={data?.monthly}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatBDTCompact(v)} width={60} />
                    <Tooltip formatter={(v: number) => [formatBDT(v), 'Revenue']} contentStyle={chartTooltip} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden md:col-span-2 lg:col-span-3">
            <CardGlow from="from-fuchsia-400/20" orb="bg-fuchsia-400/30" />
            <CardHeader className="relative z-10">
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Revenue by payment method, last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {data?.payments.map((p) => (
                  <div key={p.method}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: PAYMENT_COLORS[p.method as PaymentMethodKey] }} />
                        <span className="text-sm font-medium">{paymentLabel(p.method)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground tabular-nums">{formatBDT(p.amount)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${p.percentage}%`, background: PAYMENT_COLORS[p.method as PaymentMethodKey] }} />
                    </div>
                  </div>
                ))}
                {data && !data.payments.length && <p className="text-sm text-muted-foreground">No orders in this period.</p>}
              </div>
              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold">{m ? formatBDT(m.revenue.value) : '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="relative overflow-hidden md:col-span-2 lg:col-span-4">
            <CardGlow from="from-sky-400/20" orb="bg-sky-400/30" />
            <CardHeader className="relative z-10 flex flex-row items-start justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest 5 orders{store ? '' : ' across all stores'}</CardDescription>
              </div>
              <Link href="/orders" className="text-sm font-medium text-indigo-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {data?.recentOrders.map((order) => (
                  <Link key={order.id} href={`/orders?open=${order.id}`} className="flex items-center justify-between rounded-xl p-1 hover:bg-white/50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-md shadow-sky-500/25">
                        <Receipt className="h-4 w-4" strokeWidth={2.25} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.shippingName}</p>
                        <p className="text-xs text-muted-foreground">
                          #{order.orderNumber} • {store ? '' : `${order.store.name} • `}
                          {timeAgo(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatBDT(order.total)}</p>
                      <StatusBadge status={order.status} className="mt-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden md:col-span-2 lg:col-span-3">
            <CardGlow from="from-amber-400/25" orb="bg-amber-400/35" />
            <CardHeader className="relative z-10">
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best sellers in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {data?.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-semibold text-white shadow-md shadow-amber-500/25">
                        {index === 0 ? <Sparkles className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sold} sold</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatBDT(product.revenue)}</p>
                  </div>
                ))}
                {data && !data.topProducts.length && <p className="text-sm text-muted-foreground">No sales yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
