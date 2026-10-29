'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Search, Plus, EllipsisVertical, Eye } from 'lucide-react'
import { formatBDT } from '@/lib/currency'

// Mock data
const orders = [
  { 
    id: '#1001', 
    customer: 'Rahman Ahmed', 
    email: 'rahman@example.com',
    phone: '+880 1712-345678',
    amount: 12500, 
    status: 'Delivered',
    paymentMethod: 'bKash',
    paymentStatus: 'Paid',
    date: '2024-01-15',
    items: 3
  },
  { 
    id: '#1000', 
    customer: 'Fatima Begum', 
    email: 'fatima@example.com',
    phone: '+880 1812-345678',
    amount: 8700, 
    status: 'Processing',
    paymentMethod: 'Nagad',
    paymentStatus: 'Paid',
    date: '2024-01-15',
    items: 2
  },
  { 
    id: '#999', 
    customer: 'Karim Hossain', 
    email: 'karim@example.com',
    phone: '+880 1912-345678',
    amount: 24500, 
    status: 'Pending',
    paymentMethod: 'Rocket',
    paymentStatus: 'Pending',
    date: '2024-01-14',
    items: 5
  },
  { 
    id: '#998', 
    customer: 'Nasreen Akter', 
    email: 'nasreen@example.com',
    phone: '+880 1612-345678',
    amount: 5200, 
    status: 'Shipped',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    date: '2024-01-14',
    items: 1
  },
  { 
    id: '#997', 
    customer: 'Jamil Uddin', 
    email: 'jamil@example.com',
    phone: '+880 1512-345678',
    amount: 18200, 
    status: 'Cancelled',
    paymentMethod: 'bKash',
    paymentStatus: 'Refunded',
    date: '2024-01-13',
    items: 4
  },
  { 
    id: '#996', 
    customer: 'Salma Khan', 
    email: 'salma@example.com',
    phone: '+880 1312-345678',
    amount: 9800, 
    status: 'Delivered',
    paymentMethod: 'Nagad',
    paymentStatus: 'Paid',
    date: '2024-01-13',
    items: 2
  },
  { 
    id: '#995', 
    customer: 'Habib Rahman', 
    email: 'habib@example.com',
    phone: '+880 1712-345679',
    amount: 31500, 
    status: 'Delivered',
    paymentMethod: 'bKash',
    paymentStatus: 'Paid',
    date: '2024-01-12',
    items: 6
  },
  { 
    id: '#994', 
    customer: 'Rashida Begum', 
    email: 'rashida@example.com',
    phone: '+880 1812-345679',
    amount: 6700, 
    status: 'Processing',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    date: '2024-01-12',
    items: 1
  },
]

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'shipped': return 'bg-purple-100 text-purple-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getPaymentStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'failed': return 'bg-red-100 text-red-800'
    case 'refunded': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">
              Manage and track all customer orders
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search orders..." className="pl-9" />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>
              {orders.length} orders found
            </CardDescription>
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
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-xs text-muted-foreground">{order.date}</div>
                      </TableCell>
                      <TableCell>
                        <div>{order.customer}</div>
                        <div className="text-xs text-muted-foreground">{order.email}</div>
                      </TableCell>
                      <TableCell>{order.phone}</TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell className="font-medium">{formatBDT(order.amount)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-xs font-medium">{order.paymentMethod}</div>
                          <Badge variant="secondary" className={`mt-1 ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Print Invoice</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Mark as Shipped</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Delivered</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
