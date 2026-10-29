'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Search, Plus, MoreVertical, Mail, Phone, MapPin, UsersRound, UserCheck, UserPlus, BadgeDollarSign } from 'lucide-react'
import { formatBDT } from '@/lib/currency'

// Mock customers data
const customers = [
  {
    id: '1',
    name: 'Rahman Ahmed',
    email: 'rahman@example.com',
    phone: '+880 1712-345678',
    address: 'Dhanmondi, Dhaka',
    city: 'Dhaka',
    totalSpent: 125000,
    orderCount: 15,
    lastOrder: '2024-01-15',
    joined: '2023-06-15'
  },
  {
    id: '2',
    name: 'Fatima Begum',
    email: 'fatima@example.com',
    phone: '+880 1812-345678',
    address: 'Uttara, Dhaka',
    city: 'Dhaka',
    totalSpent: 87000,
    orderCount: 12,
    lastOrder: '2024-01-15',
    joined: '2023-07-20'
  },
  {
    id: '3',
    name: 'Karim Hossain',
    email: 'karim@example.com',
    phone: '+880 1912-345678',
    address: 'Sylhet Sadar',
    city: 'Sylhet',
    totalSpent: 245000,
    orderCount: 28,
    lastOrder: '2024-01-14',
    joined: '2023-05-10'
  },
  {
    id: '4',
    name: 'Nasreen Akter',
    email: 'nasreen@example.com',
    phone: '+880 1612-345678',
    address: 'Chittagong Port',
    city: 'Chittagong',
    totalSpent: 52000,
    orderCount: 8,
    lastOrder: '2024-01-14',
    joined: '2023-08-05'
  },
  {
    id: '5',
    name: 'Jamil Uddin',
    email: 'jamil@example.com',
    phone: '+880 1512-345678',
    address: 'Banani, Dhaka',
    city: 'Dhaka',
    totalSpent: 182000,
    orderCount: 20,
    lastOrder: '2024-01-13',
    joined: '2023-04-12'
  },
  {
    id: '6',
    name: 'Salma Khan',
    email: 'salma@example.com',
    phone: '+880 1312-345678',
    address: 'Gazipur City',
    city: 'Gazipur',
    totalSpent: 98000,
    orderCount: 14,
    lastOrder: '2024-01-13',
    joined: '2023-06-28'
  },
  {
    id: '7',
    name: 'Habib Rahman',
    email: 'habib@example.com',
    phone: '+880 1712-345679',
    address: 'Mirpur, Dhaka',
    city: 'Dhaka',
    totalSpent: 315000,
    orderCount: 35,
    lastOrder: '2024-01-12',
    joined: '2023-03-18'
  },
  {
    id: '8',
    name: 'Rashida Begum',
    email: 'rashida@example.com',
    phone: '+880 1812-345679',
    address: 'Khulna City',
    city: 'Khulna',
    totalSpent: 67000,
    orderCount: 9,
    lastOrder: '2024-01-12',
    joined: '2023-09-02'
  },
]

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage customer relationships and view their order history
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Customers"
            value="1,234"
            change="+45 this month"
            icon={UsersRound}
            trend="up"
            tone="violet"
          />
          <MetricCard
            title="Active Customers"
            value="892"
            change="72% of total"
            icon={UserCheck}
            trend="up"
            tone="emerald"
          />
          <MetricCard
            title="New This Month"
            value="45"
            change="From 8 cities"
            icon={UserPlus}
            trend="up"
            tone="sky"
          />
          <MetricCard
            title="Avg Order Value"
            value="৳4,850"
            change="+8.2% from last month"
            icon={BadgeDollarSign}
            trend="up"
            tone="amber"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search customers..." className="pl-9" />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="dhaka">Dhaka</SelectItem>
                  <SelectItem value="chittagong">Chittagong</SelectItem>
                  <SelectItem value="sylhet">Sylhet</SelectItem>
                  <SelectItem value="khulna">Khulna</SelectItem>
                  <SelectItem value="gazipur">Gazipur</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Customer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="new">New (0-30 days)</SelectItem>
                  <SelectItem value="active">Active (31-90 days)</SelectItem>
                  <SelectItem value="loyal">Loyal (90+ days)</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="orders">Most Orders</SelectItem>
                  <SelectItem value="spent">Highest Spent</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              {customers.length} customers found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Joined {customer.joined}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.city}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatBDT(customer.totalSpent)}</TableCell>
                      <TableCell>{customer.orderCount}</TableCell>
                      <TableCell>{customer.lastOrder}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>View Order History</DropdownMenuItem>
                            <DropdownMenuItem>Send Email</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Add Note</DropdownMenuItem>
                            <DropdownMenuItem>Apply Discount</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Block Customer
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
