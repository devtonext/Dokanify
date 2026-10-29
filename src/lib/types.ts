export type Product = {
  id: string
  name: string
  description: string
  price: number
  comparePrice: number | null
  sku: string
  quantity: number
  category: string
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  totalSpent: number
  orderCount: number
  notes: string
  lastOrder: string | null
  createdAt: string
}

export type OrderItem = {
  productId: string
  name: string
  quantity: number
  price: number
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type Order = {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  email: string
  phone: string
  status: OrderStatus
  subtotal: number
  shipping: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: PaymentStatus
  shippingAddress: string
  city: string
  notes: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export type NotificationItem = {
  id: string
  title: string
  body: string
  href: string
  read: boolean
  createdAt: string
}

export type StoreSettings = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  currency: string
  timezone: string
  language: string
  taxIncluded: boolean
  payments: {
    bkash: { enabled: boolean; merchant: string; apiKey: string; secret: string; username: string }
    nagad: { enabled: boolean; merchant: string; apiKey: string }
    rocket: { enabled: boolean; merchant: string; apiKey: string }
    cod: { enabled: boolean; fee: number; maxAmount: number }
  }
  shipping: {
    dhaka: { enabled: boolean; rate: number; time: string }
    outside: { enabled: boolean; rate: number; time: string }
    extraZones: { id: string; name: string; rate: number; time: string; enabled: boolean }[]
  }
  notifications: {
    newOrder: boolean
    statusUpdate: boolean
    lowStock: boolean
    orderConfirmation: boolean
    shippingUpdate: boolean
    deliveryConfirmation: boolean
    email: boolean
    sms: boolean
  }
  security: {
    twoFactor: boolean
  }
}

export type ThemeItem = {
  id: string
  name: string
  category: string
  image: string
  version: string
}

export type ThemeState = {
  currentId: string
  publishedAt: string
  name: string
  description: string
  primaryColor: string
}

export type AppData = {
  products: Product[]
  customers: Customer[]
  orders: Order[]
  notifications: NotificationItem[]
  settings: StoreSettings
  themes: ThemeItem[]
  theme: ThemeState
}
