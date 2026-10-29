'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wallet, 
  ShoppingBag, 
  UsersRound, 
  Boxes, 
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Sparkles
} from 'lucide-react'
import { formatBDT } from '@/lib/currency'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

// Mock data - in production this would come from API
const salesData = [
  { month: 'Jan', revenue: 450000, orders: 45 },
  { month: 'Feb', revenue: 520000, orders: 52 },
  { month: 'Mar', revenue: 480000, orders: 48 },
  { month: 'Apr', revenue: 610000, orders: 61 },
  { month: 'May', revenue: 580000, orders: 58 },
  { month: 'Jun', revenue: 720000, orders: 72 },
]

const recentOrders = [
  { id: '#1001', customer: 'Rahman Ahmed', amount: 12500, status: 'completed', date: '2 min ago' },
  { id: '#1000', customer: 'Fatima Begum', amount: 8700, status: 'processing', date: '15 min ago' },
  { id: '#999', customer: 'Karim Hossain', amount: 24500, status: 'pending', date: '1 hour ago' },
  { id: '#998', customer: 'Nasreen Akter', amount: 5200, status: 'completed', date: '2 hours ago' },
  { id: '#997', customer: 'Jamil Uddin', amount: 18200, status: 'shipped', date: '3 hours ago' },
]

const topProducts = [
  { name: 'Traditional Panjabi', sold: 234, revenue: 585000 },
  { name: 'Cotton Saree', sold: 187, revenue: 467500 },
  { name: 'Men\'s Kurta', sold: 156, revenue: 390000 },
  { name: 'Embroidered Kameez', sold: 134, revenue: 335000 },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={formatBDT(3360000)}
            change="+20.1% from last month"
            icon={Wallet}
            trend="up"
            tone="emerald"
          />
          <MetricCard
            title="Total Orders"
            value="336"
            change="+12.5% from last month"
            icon={ShoppingBag}
            trend="up"
            tone="sky"
          />
          <MetricCard
            title="Total Customers"
            value="1,234"
            change="+8.2% from last month"
            icon={UsersRound}
            trend="up"
            tone="violet"
          />
          <MetricCard
            title="Products in Stock"
            value="2,450"
            change="-3.1% from last month"
            icon={Boxes}
            trend="down"
            tone="amber"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Revenue Chart */}
          <Card className="relative col-span-4 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-sky-300/10 to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/30 blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `৳${(value / 1000)}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="relative col-span-3 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-400/20 via-violet-300/10 to-transparent" />
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-fuchsia-400/30 blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Revenue by payment method</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-pink-500" />
                    <span className="text-sm font-medium">bKash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">৳1,450,000</span>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium">Nagad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">৳890,000</span>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                    <span className="text-sm font-medium">Rocket</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">৳620,000</span>
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Cash on Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">৳400,000</span>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold">{formatBDT(3360000)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders & Top Products */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Orders */}
          <Card className="relative col-span-4 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-400/20 via-indigo-300/10 to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/30 blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest 5 orders from customers</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-md shadow-sky-500/25">
                        <Receipt className="h-4 w-4" strokeWidth={2.25} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">{order.id} • {order.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatBDT(order.amount)}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="relative col-span-3 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/25 via-orange-300/10 to-transparent" />
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/35 blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products this month</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {topProducts.map((product, index) => (
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
