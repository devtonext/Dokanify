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

// Mock data
const salesData = [
  { month: 'Jan', revenue: 450000, orders: 45, customers: 32 },
  { month: 'Feb', revenue: 520000, orders: 52, customers: 38 },
  { month: 'Mar', revenue: 480000, orders: 48, customers: 35 },
  { month: 'Apr', revenue: 610000, orders: 61, customers: 45 },
  { month: 'May', revenue: 580000, orders: 58, customers: 42 },
  { month: 'Jun', revenue: 720000, orders: 72, customers: 52 },
  { month: 'Jul', revenue: 680000, orders: 68, customers: 48 },
  { month: 'Aug', revenue: 750000, orders: 75, customers: 55 },
  { month: 'Sep', revenue: 820000, orders: 82, customers: 60 },
  { month: 'Oct', revenue: 780000, orders: 78, customers: 56 },
  { month: 'Nov', revenue: 950000, orders: 95, customers: 70 },
  { month: 'Dec', revenue: 1100000, orders: 110, customers: 82 },
]

const cityData = [
  { name: 'Dhaka', value: 850000, color: '#3b82f6' },
  { name: 'Chittagong', value: 320000, color: '#8b5cf6' },
  { name: 'Sylhet', value: 180000, color: '#ec4899' },
  { name: 'Khulna', value: 120000, color: '#f97316' },
  { name: 'Rajshahi', value: 95000, color: '#14b8a6' },
  { name: 'Others', value: 155000, color: '#6b7280' },
]

const categoryData = [
  { name: "Men's Wear", sales: 1250000, orders: 285 },
  { name: "Women's Wear", sales: 980000, orders: 245 },
  { name: "Kids Wear", sales: 450000, orders: 135 },
  { name: "Accessories", sales: 275000, orders: 95 },
  { name: "Home Decor", sales: 195000, orders: 65 },
]

const paymentMethodData = [
  { name: 'bKash', amount: 1450000, percentage: 43 },
  { name: 'Nagad', amount: 890000, percentage: 26 },
  { name: 'Rocket', amount: 620000, percentage: 18 },
  { name: 'Cash on Delivery', amount: 420000, percentage: 13 },
]

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Detailed insights into your store performance
            </p>
          </div>
          <Select defaultValue="year">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={formatBDT(3380000)}
            change="+24.5% from last year"
            icon={Wallet}
            trend="up"
            tone="emerald"
          />
          <MetricCard
            title="Total Orders"
            value="825"
            change="+18.2% from last year"
            icon={ShoppingBag}
            trend="up"
            tone="sky"
          />
          <MetricCard
            title="Total Customers"
            value="583"
            change="+32.1% from last year"
            icon={UsersRound}
            trend="up"
            tone="violet"
          />
          <MetricCard
            title="Average Order Value"
            value={formatBDT(4097)}
            change="+5.3% from last year"
            icon={BadgeDollarSign}
            trend="up"
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
                  <CardDescription>Monthly performance over the year</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ResponsiveContainer width="100%" height={400}>
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

              {/* Sales by City */}
              <Card className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-400/20 via-fuchsia-300/10 to-transparent" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl" />
                <CardHeader className="relative z-10">
                  <CardTitle>Sales by City</CardTitle>
                  <CardDescription>Revenue distribution across cities</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={cityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {cityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']} />
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
                    {paymentMethodData.map((method) => (
                      <div key={method.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{method.name}</span>
                          <span className="text-sm text-muted-foreground">{method.percentage}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${method.percentage}%` }}
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
                  <BarChart data={salesData}>
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
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
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
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>New customers acquired over time</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={salesData}>
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
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
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
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis 
                      type="number" 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => `৳${(value / 1000)}K`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      width={100}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
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
