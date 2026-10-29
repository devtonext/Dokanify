'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { formatBDT } from '@/lib/currency'
import { Wallet, ShoppingBag, UsersRound, BadgeDollarSign } from 'lucide-react'

import { useState } from 'react'
import { useAnalytics } from '@/hooks/use-analytics'
import { useStoreScope } from '@/hooks/use-store-scope'
import { PAYMENT_COLORS, type PaymentMethodKey } from '@/lib/bd'
import { chartTooltip, CHART_COLORS } from '@/lib/chart'
import { formatBDTCompact } from '@/lib/currency'
import { formatChange, paymentLabel, trendOf } from '@/lib/format'

export default function AnalyticsPage() {
  const { storeId, store } = useStoreScope()
  const [range, setRange] = useState('year')
  const { data } = useAnalytics(storeId, range)
  const m = data?.metrics
  const cityData = (data?.cities ?? []).map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length] }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              {store ? `Performance of ${store.name}` : 'Performance across all stores'}
            </p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 3 months</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={m ? formatBDT(m.revenue.value) : '—'}
            change={m && formatChange(m.revenue.change)}
            icon={Wallet}
            trend={m ? trendOf(m.revenue.change) : 'neutral'}
            tone="emerald"
          />
          <MetricCard
            title="Total Orders"
            value={m ? m.orders.value.toLocaleString() : '—'}
            change={m && formatChange(m.orders.change)}
            icon={ShoppingBag}
            trend={m ? trendOf(m.orders.change) : 'neutral'}
            tone="sky"
          />
          <MetricCard
            title="Total Customers"
            value={m ? m.customers.value.toLocaleString() : '—'}
            change={m && `+${m.customers.new} new in this period`}
            icon={UsersRound}
            trend={m?.customers.new ? 'up' : 'neutral'}
            tone="violet"
          />
          <MetricCard
            title="Average Order Value"
            value={m ? formatBDT(Math.round(m.aov.value)) : '—'}
            change={m && formatChange(m.aov.change)}
            icon={BadgeDollarSign}
            trend={m ? trendOf(m.aov.change) : 'neutral'}
            tone="amber"
          />
        </div>

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Revenue Chart */}
              <Card className="relative col-span-2 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-sky-300/10 to-transparent" />
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/30 blur-3xl" />
                <CardHeader className="relative z-10">
                  <CardTitle>Revenue & Orders Trend</CardTitle>
                  <CardDescription>Monthly revenue, last 12 months</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={data?.monthly}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => formatBDTCompact(value)}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatBDT(value), 'Revenue']}
                        contentStyle={chartTooltip}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales by City */}
              <Card className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-400/20 via-fuchsia-300/10 to-transparent" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl" />
                <CardHeader className="relative z-10">
                  <CardTitle>Sales by City</CardTitle>
                  <CardDescription>Top cities by revenue in this period</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={cityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {cityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatBDT(value), 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-400/20 via-indigo-300/10 to-transparent" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-400/30 blur-3xl" />
                <CardHeader className="relative z-10">
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Revenue by payment gateway</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {data?.payments.map((method) => (
                      <div key={method.method}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{paymentLabel(method.method)}</span>
                          <span className="text-sm text-muted-foreground">{method.percentage}% · {method.orders} orders</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{ width: `${method.percentage}%`, background: PAYMENT_COLORS[method.method as PaymentMethodKey] }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBDT(method.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/20 via-orange-300/10 to-transparent" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/30 blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle>Monthly Sales Breakdown</CardTitle>
                <CardDescription>Detailed monthly revenue and order analysis</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data?.monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => formatBDTCompact(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatBDT(value), 'Revenue']}
                      contentStyle={chartTooltip}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-400/25 via-fuchsia-300/10 to-transparent" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/30 blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle>Active Customers</CardTitle>
                <CardDescription>Unique customers ordering each month</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={data?.monthly}>
                    <defs>
                      <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Customers']}
                      contentStyle={chartTooltip}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fill="url(#colorCustomers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-400/20 via-orange-300/10 to-transparent" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-400/30 blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue and order distribution across product categories</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data?.categories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis 
                      type="number" 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => formatBDTCompact(value)}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      width={100}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatBDT(value), 'Revenue']}
                      contentStyle={chartTooltip}
                    />
                    <Bar dataKey="sales" fill="#6366f1" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
