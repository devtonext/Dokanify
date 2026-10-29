import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { AppData, Customer, NotificationItem, Order, Product } from './types'
import { seedData } from './seed'

const DATA_DIR = join(process.cwd(), 'db')
const DATA_FILE = join(DATA_DIR, 'store.json')

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function load(): AppData {
  try {
    if (!existsSync(DATA_FILE)) return clone(seedData)
    return JSON.parse(readFileSync(DATA_FILE, 'utf8')) as AppData
  } catch {
    return clone(seedData)
  }
}

function save(data: AppData) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function nextOrderNumber(orders: Order[]) {
  const nums = orders.map((order) => Number(String(order.orderNumber).replace(/\D/g, ''))).filter(Boolean)
  const max = nums.length ? Math.max(...nums) : 1000
  return `#${max + 1}`
}

function addNotification(data: AppData, title: string, body: string, href: string) {
  data.notifications.unshift({
    id: nextId('n'),
    title,
    body,
    href,
    read: false,
    createdAt: new Date().toISOString(),
  })
  data.notifications = data.notifications.slice(0, 30)
}

function recalcCustomer(data: AppData, customerId: string) {
  const customer = data.customers.find((item) => item.id === customerId)
  if (!customer) return
  const orders = data.orders.filter((order) => order.customerId === customerId && order.status !== 'CANCELLED')
  customer.orderCount = orders.length
  customer.totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  customer.lastOrder = orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt || null
}

export function getData(): AppData {
  return load()
}

export function getProducts() {
  return load().products
}

export function createProduct(input: Partial<Product>) {
  const data = load()
  const now = new Date().toISOString()
  const sku = (input.sku || `SKU-${Date.now().toString(36).toUpperCase()}`).trim()
  if (data.products.some((product) => product.sku.toLowerCase() === sku.toLowerCase())) {
    throw new Error('SKU already exists')
  }
  const product: Product = {
    id: nextId('p'),
    name: input.name?.trim() || 'Untitled product',
    description: input.description || '',
    price: Number(input.price) || 0,
    comparePrice: input.comparePrice ? Number(input.comparePrice) : null,
    sku,
    quantity: Number(input.quantity) || 0,
    category: input.category || "Men's Wear",
    tags: input.tags || [],
    isActive: input.isActive !== false,
    createdAt: now,
    updatedAt: now,
  }
  data.products.unshift(product)
  save(data)
  return product
}

export function updateProduct(id: string, patch: Partial<Product>) {
  const data = load()
  const product = data.products.find((item) => item.id === id)
  if (!product) throw new Error('Product not found')
  if (patch.sku && patch.sku !== product.sku && data.products.some((item) => item.sku === patch.sku && item.id !== id)) {
    throw new Error('SKU already exists')
  }
  Object.assign(product, {
    ...patch,
    price: patch.price !== undefined ? Number(patch.price) : product.price,
    comparePrice: patch.comparePrice !== undefined ? (patch.comparePrice ? Number(patch.comparePrice) : null) : product.comparePrice,
    quantity: patch.quantity !== undefined ? Number(patch.quantity) : product.quantity,
    updatedAt: new Date().toISOString(),
  })
  save(data)
  return product
}

export function duplicateProduct(id: string) {
  const data = load()
  const product = data.products.find((item) => item.id === id)
  if (!product) throw new Error('Product not found')
  const now = new Date().toISOString()
  const copy: Product = {
    ...clone(product),
    id: nextId('p'),
    name: `${product.name} Copy`,
    sku: `${product.sku}-COPY`,
    createdAt: now,
    updatedAt: now,
  }
  data.products.unshift(copy)
  save(data)
  return copy
}

export function deleteProduct(id: string) {
  const data = load()
  const before = data.products.length
  data.products = data.products.filter((item) => item.id !== id)
  if (data.products.length === before) throw new Error('Product not found')
  save(data)
  return { ok: true }
}

export function getCustomers() {
  return load().customers
}

export function createCustomer(input: Partial<Customer>) {
  const data = load()
  const email = (input.email || '').trim().toLowerCase()
  if (!input.name?.trim() || !email || !input.phone?.trim()) {
    throw new Error('Name, email, and phone are required')
  }
  if (data.customers.some((item) => item.email.toLowerCase() === email)) {
    throw new Error('Customer email already exists')
  }
  const customer: Customer = {
    id: nextId('c'),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    address: input.address || '',
    city: input.city || 'Dhaka',
    totalSpent: 0,
    orderCount: 0,
    notes: input.notes || '',
    lastOrder: null,
    createdAt: new Date().toISOString(),
  }
  data.customers.unshift(customer)
  save(data)
  return customer
}

export function updateCustomer(id: string, patch: Partial<Customer>) {
  const data = load()
  const customer = data.customers.find((item) => item.id === id)
  if (!customer) throw new Error('Customer not found')
  Object.assign(customer, patch, {
    email: patch.email ? patch.email.trim().toLowerCase() : customer.email,
  })
  save(data)
  return customer
}

export function getOrders() {
  return load().orders
}

export function createOrder(input: {
  customerId: string
  items: { productId: string; quantity: number }[]
  paymentMethod?: string
  notes?: string
}) {
  const data = load()
  const customer = data.customers.find((item) => item.id === input.customerId)
  if (!customer) throw new Error('Customer not found')
  if (!input.items?.length) throw new Error('Add at least one item')

  const items = input.items.map((entry) => {
    const product = data.products.find((item) => item.id === entry.productId)
    if (!product) throw new Error('Product not found')
    const quantity = Math.max(1, Number(entry.quantity) || 1)
    if (product.quantity < quantity) throw new Error(`${product.name} does not have enough stock`)
    product.quantity -= quantity
    product.updatedAt = new Date().toISOString()
    return { productId: product.id, name: product.name, quantity, price: product.price }
  })

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const city = customer.city || 'Dhaka'
  const shipping = city.toLowerCase() === 'dhaka' ? data.settings.shipping.dhaka.rate : data.settings.shipping.outside.rate
  const now = new Date().toISOString()
  const order: Order = {
    id: nextId('o'),
    orderNumber: nextOrderNumber(data.orders),
    customerId: customer.id,
    customerName: customer.name,
    email: customer.email,
    phone: customer.phone,
    status: 'PENDING',
    subtotal,
    shipping,
    discount: 0,
    total: subtotal + shipping,
    paymentMethod: input.paymentMethod || 'bkash',
    paymentStatus: input.paymentMethod === 'cod' ? 'PENDING' : 'PAID',
    shippingAddress: customer.address || city,
    city,
    notes: input.notes || '',
    items,
    createdAt: now,
    updatedAt: now,
  }
  data.orders.unshift(order)
  recalcCustomer(data, customer.id)
  addNotification(data, `New order ${order.orderNumber}`, `${customer.name} placed an order.`, '/orders')
  save(data)
  return order
}

export function updateOrder(id: string, patch: Partial<Pick<Order, 'status' | 'paymentStatus' | 'notes'>>) {
  const data = load()
  const order = data.orders.find((item) => item.id === id)
  if (!order) throw new Error('Order not found')
  const prevStatus = order.status
  if (patch.status) order.status = patch.status
  if (patch.paymentStatus) order.paymentStatus = patch.paymentStatus
  if (patch.notes !== undefined) order.notes = patch.notes
  if (patch.status === 'DELIVERED' && order.paymentMethod === 'cod') order.paymentStatus = 'PAID'
  if (patch.status === 'CANCELLED') order.paymentStatus = order.paymentStatus === 'PAID' ? 'REFUNDED' : 'FAILED'
  order.updatedAt = new Date().toISOString()
  recalcCustomer(data, order.customerId)
  if (patch.status && patch.status !== prevStatus) {
    addNotification(data, `Order ${order.orderNumber} updated`, `Status changed to ${patch.status.toLowerCase()}.`, '/orders')
  }
  save(data)
  return order
}

export function getNotifications() {
  return load().notifications
}

export function markNotificationsRead() {
  const data = load()
  data.notifications = data.notifications.map((item) => ({ ...item, read: true }))
  save(data)
  return data.notifications
}

export function getSettings() {
  return load().settings
}

export function updateSettings(patch: Partial<AppData['settings']>) {
  const data = load()
  data.settings = {
    ...data.settings,
    ...patch,
    payments: { ...data.settings.payments, ...(patch.payments || {}) },
    shipping: {
      ...data.settings.shipping,
      ...(patch.shipping || {}),
      extraZones: patch.shipping?.extraZones || data.settings.shipping.extraZones,
    },
    notifications: { ...data.settings.notifications, ...(patch.notifications || {}) },
    security: { ...data.settings.security, ...(patch.security || {}) },
  }
  save(data)
  return data.settings
}

export function getThemeState() {
  const data = load()
  return { theme: data.theme, themes: data.themes }
}

export function updateTheme(patch: Partial<AppData['theme']> & { currentId?: string }) {
  const data = load()
  if (patch.currentId) {
    const found = data.themes.find((item) => item.id === patch.currentId)
    if (!found) throw new Error('Theme not found')
    data.theme.currentId = found.id
    data.theme.name = found.name
  }
  if (patch.name) data.theme.name = patch.name
  if (patch.description) data.theme.description = patch.description
  if (patch.primaryColor) data.theme.primaryColor = patch.primaryColor
  if (patch.publishedAt) data.theme.publishedAt = patch.publishedAt
  save(data)
  return { theme: data.theme, themes: data.themes }
}

export function addTheme(input: { name: string; category?: string; image?: string }) {
  const data = load()
  const theme = {
    id: nextId('t'),
    name: input.name.trim() || 'Custom Theme',
    category: input.category || 'Custom',
    image: input.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop',
    version: '1.0.0',
  }
  data.themes.unshift(theme)
  save(data)
  return { theme: data.theme, themes: data.themes }
}

export function getAnalytics(period = 'month') {
  const data = load()
  const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'quarter' ? 90 : period === 'year' ? 365 : 30
  const since = Date.now() - days * 86400000
  const orders = data.orders.filter((order) => order.status !== 'CANCELLED')
  const periodOrders = orders.filter((order) => new Date(order.createdAt).getTime() >= since)
  const prevOrders = orders.filter((order) => {
    const time = new Date(order.createdAt).getTime()
    return time < since && time >= since - days * 86400000
  })
  const revenue = periodOrders.reduce((sum, order) => sum + order.total, 0)
  const prevRevenue = prevOrders.reduce((sum, order) => sum + order.total, 0)
  const change = (current: number, previous: number) => {
    if (!previous) return current ? 100 : 0
    return Number((((current - previous) / previous) * 100).toFixed(1))
  }
  const customers = data.customers
  const newCustomers = customers.filter((item) => new Date(item.createdAt).getTime() >= since).length
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const salesByMonth = monthNames.map((month, index) => {
    const monthOrders = orders.filter((order) => new Date(order.createdAt).getMonth() === index)
    const monthCustomers = customers.filter((item) => new Date(item.createdAt).getMonth() === index)
    return {
      month,
      revenue: monthOrders.reduce((sum, order) => sum + order.total, 0),
      orders: monthOrders.length,
      customers: monthCustomers.length,
    }
  })
  const paymentMethods: Record<string, number> = {}
  const cities: Record<string, number> = {}
  const categories: Record<string, { sales: number; orders: number }> = {}
  for (const order of periodOrders) {
    paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + order.total
    cities[order.city] = (cities[order.city] || 0) + order.total
    for (const item of order.items) {
      const product = data.products.find((entry) => entry.id === item.productId)
      const category = product?.category || 'Other'
      if (!categories[category]) categories[category] = { sales: 0, orders: 0 }
      categories[category].sales += item.price * item.quantity
      categories[category].orders += item.quantity
    }
  }
  const recentOrders = [...data.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  const sold: Record<string, { name: string; sold: number; revenue: number }> = {}
  for (const order of orders) {
    for (const item of order.items) {
      if (!sold[item.productId]) sold[item.productId] = { name: item.name, sold: 0, revenue: 0 }
      sold[item.productId].sold += item.quantity
      sold[item.productId].revenue += item.price * item.quantity
    }
  }
  return {
    revenue,
    orders: periodOrders.length,
    customers: customers.length,
    avgOrderValue: periodOrders.length ? revenue / periodOrders.length : 0,
    changes: {
      revenue: change(revenue, prevRevenue),
      orders: change(periodOrders.length, prevOrders.length),
      customers: change(newCustomers, Math.max(customers.length - newCustomers, 0) ? newCustomers : 0),
    },
    products: {
      total: data.products.length,
      inStock: data.products.filter((item) => item.quantity > 0).length,
      lowStock: data.products.filter((item) => item.quantity > 0 && item.quantity < 10).length,
      outOfStock: data.products.filter((item) => item.quantity === 0).length,
    },
    paymentMethods,
    cities,
    salesByMonth,
    categoryData: Object.entries(categories).map(([name, value]) => ({ name, ...value })),
    recentOrders,
    topProducts: Object.values(sold).sort((a, b) => b.revenue - a.revenue).slice(0, 4),
    newCustomers,
  }
}

export type { NotificationItem }
