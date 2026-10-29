'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MetricCard } from '@/components/dashboard/metric-card'
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
import { Search, Plus, EllipsisVertical, Pencil, Trash2, Boxes, Images, PackageCheck, TriangleAlert, CircleOff } from 'lucide-react'
import { formatBDT } from '@/lib/currency'

// Mock products data
const products = [
  {
    id: '1',
    name: 'Traditional Panjabi - Premium Cotton',
    sku: 'PANJ-001',
    category: 'Men\'s Wear',
    price: 2500,
    comparePrice: 3200,
    quantity: 45,
    status: 'Active',
    image: null,
    tags: ['cotton', 'traditional', 'summer']
  },
  {
    id: '2',
    name: 'Handloom Cotton Saree',
    sku: 'SARE-001',
    category: 'Women\'s Wear',
    price: 2500,
    comparePrice: null,
    quantity: 23,
    status: 'Active',
    image: null,
    tags: ['handloom', 'traditional', 'festival']
  },
  {
    id: '3',
    name: 'Embroidered Kurta Set',
    sku: 'KURT-001',
    category: 'Men\'s Wear',
    price: 3200,
    comparePrice: 4000,
    quantity: 18,
    status: 'Active',
    image: null,
    tags: ['embroidered', 'formal', 'premium']
  },
  {
    id: '4',
    name: 'Kids Cotton Shirt',
    sku: 'KIDS-001',
    category: 'Kids Wear',
    price: 850,
    comparePrice: null,
    quantity: 67,
    status: 'Active',
    image: null,
    tags: ['kids', 'cotton', 'casual']
  },
  {
    id: '5',
    name: 'Wedding Saree - Premium',
    sku: 'WEDD-001',
    category: 'Women\'s Wear',
    price: 12500,
    comparePrice: 15000,
    quantity: 5,
    status: 'Active',
    image: null,
    tags: ['wedding', 'premium', 'traditional']
  },
  {
    id: '6',
    name: 'Cotton T-Shirt',
    sku: 'TSHI-001',
    category: 'Men\'s Wear',
    price: 650,
    comparePrice: null,
    quantity: 0,
    status: 'Out of Stock',
    image: null,
    tags: ['t-shirt', 'cotton', 'casual']
  },
  {
    id: '7',
    name: 'Salwar Kameez Set',
    sku: 'SALW-001',
    category: 'Women\'s Wear',
    price: 2800,
    comparePrice: 3500,
    quantity: 34,
    status: 'Active',
    image: null,
    tags: ['salwar', 'kameez', 'traditional']
  },
  {
    id: '8',
    name: 'Denim Jeans',
    sku: 'JEAN-001',
    category: 'Men\'s Wear',
    price: 2200,
    comparePrice: null,
    quantity: 52,
    status: 'Active',
    image: null,
    tags: ['denim', 'jeans', 'casual']
  },
]

const getStockStatusColor = (quantity: number) => {
  if (quantity === 0) return 'bg-red-100 text-red-800'
  if (quantity < 10) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

const getStockStatusText = (quantity: number) => {
  if (quantity === 0) return 'Out of Stock'
  if (quantity < 10) return 'Low Stock'
  return 'In Stock'
}

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your product inventory and pricing
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Products"
            value="244"
            change="+12 this month"
            icon={Boxes}
            trend="up"
            tone="sky"
          />
          <MetricCard
            title="In Stock"
            value="218"
            change="89% of total"
            icon={PackageCheck}
            trend="up"
            tone="emerald"
          />
          <MetricCard
            title="Low Stock"
            value="18"
            change="Needs attention"
            icon={TriangleAlert}
            trend="neutral"
            tone="amber"
          />
          <MetricCard
            title="Out of Stock"
            value="8"
            change="Restock needed"
            icon={CircleOff}
            trend="down"
            tone="rose"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search products..." className="pl-9" />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="mens">Men's Wear</SelectItem>
                  <SelectItem value="womens">Women's Wear</SelectItem>
                  <SelectItem value="kids">Kids Wear</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="instock">In Stock</SelectItem>
                  <SelectItem value="lowstock">Low Stock</SelectItem>
                  <SelectItem value="outofstock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                  <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
            <CardDescription>
              {products.length} products found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                            <Images className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="flex gap-1">
                              {product.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatBDT(product.price)}</div>
                          {product.comparePrice && (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatBDT(product.comparePrice)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStockStatusColor(product.quantity)}>
                          {product.quantity} - {getStockStatusText(product.quantity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                          {product.status}
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
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>View Analytics</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Update Stock</DropdownMenuItem>
                            <DropdownMenuItem>Change Price</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Product
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
