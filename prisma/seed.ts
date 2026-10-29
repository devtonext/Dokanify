/**
 * Seeds plans, the first super admin and (unless SEED_DEMO=false) demo stores with
 * products, customers and 12 months of orders.  Run: npm run db:seed
 * Idempotent for plans/admin; demo data is only created when the demo store does not exist.
 */
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma, PrismaClient, type Customer, type Product } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEMO_ACCOUNTS } from '../src/lib/demo'

const db = new PrismaClient()

const PLANS = [
  { key: 'free', name: 'Starter', rank: 0, priceMonthly: 0, features: ['catalog', 'cart', 'checkout', 'search', 'cod'], maxProducts: 50 },
  {
    key: 'pro',
    name: 'Pro',
    rank: 1,
    priceMonthly: 1490,
    features: ['catalog', 'cart', 'checkout', 'search', 'cod', 'bkash', 'nagad', 'rocket', 'bilingual', 'wishlist', 'reviews', 'order-tracking'],
    maxProducts: 1000,
  },
  {
    key: 'business',
    name: 'Business',
    rank: 2,
    priceMonthly: 3990,
    features: ['catalog', 'cart', 'checkout', 'search', 'cod', 'bkash', 'nagad', 'rocket', 'sslcommerz', 'bilingual', 'blog', 'wishlist', 'reviews', 'order-tracking', 'custom-domain'],
    maxProducts: null,
  },
]

const defaultSettings = (overrides: Record<string, boolean> = {}) => ({
  taxIncluded: true,
  payments: {
    bkash: { enabled: overrides.bkash ?? true, merchant: '01712345678', apiKey: '', secret: '', username: '', password: '', sandbox: true },
    nagad: { enabled: overrides.nagad ?? true, merchant: '01812345678', apiKey: '', secret: '', username: '', password: '', sandbox: true },
    rocket: { enabled: false, merchant: '', apiKey: '', secret: '', username: '', password: '', sandbox: true },
    sslcommerz: { enabled: false, merchant: '', apiKey: '', secret: '', username: '', password: '', sandbox: true },
    cod: { enabled: true, fee: 0, maxAmount: 20000 },
  },
  shipping: {
    zones: [
      { id: 'dhaka', name: 'Inside Dhaka', enabled: true, rate: 60, time: '1-2 days', districts: ['Dhaka'] },
      { id: 'suburb', name: 'Dhaka suburbs', enabled: true, rate: 100, time: '2-3 days', districts: ['Gazipur', 'Narayanganj', 'Savar'] },
      { id: 'outside', name: 'Outside Dhaka', enabled: true, rate: 130, time: '3-5 days', districts: [] },
    ],
    freeShippingOver: 5000,
    courier: 'steadfast',
  },
  notifications: { newOrder: true, statusUpdate: true, lowStock: true, lowStockThreshold: 10, customerSms: false, customerEmail: true },
})

const STORES = [
  {
    slug: 'demo',
    name: 'Dokanio Fashion House',
    ownerName: 'Rahman Ahmed',
    email: 'rahman@dokanio.store',
    phone: '+8801712345678',
    address: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
    city: 'Dhaka',
    plan: 'pro',
    products: [
      ['Traditional Panjabi - Premium Cotton', "Men's Wear", 2500, 3200, 45, ['cotton', 'traditional', 'eid']],
      ['Handloom Cotton Saree', "Women's Wear", 2500, null, 23, ['handloom', 'traditional', 'festival']],
      ['Embroidered Kurta Set', "Men's Wear", 3200, 4000, 18, ['embroidered', 'formal']],
      ['Kids Cotton Shirt', 'Kids Wear', 850, null, 67, ['kids', 'cotton']],
      ['Jamdani Wedding Saree', "Women's Wear", 12500, 15000, 5, ['wedding', 'jamdani', 'premium']],
      ['Cotton T-Shirt', "Men's Wear", 650, null, 0, ['t-shirt', 'casual']],
      ['Salwar Kameez Set', "Women's Wear", 2800, 3500, 34, ['salwar', 'kameez']],
      ['Denim Jeans', "Men's Wear", 2200, null, 52, ['denim', 'casual']],
      ['Nakshi Kantha Scarf', 'Accessories', 1200, 1500, 8, ['handmade', 'nakshi']],
      ['Leather Sandals', 'Accessories', 1650, null, 29, ['leather', 'footwear']],
      ['Silk Three-Piece', "Women's Wear", 4200, 5200, 14, ['silk', 'festival']],
      ['Kids Panjabi Set', 'Kids Wear', 1350, 1600, 3, ['kids', 'eid']],
    ],
  },
  {
    slug: 'gadget-ghor',
    name: 'Gadget Ghor',
    ownerName: 'Tanvir Hasan',
    email: 'hello@gadgetghor.com.bd',
    phone: '+8801911223344',
    address: 'Level 4, Bashundhara City, Panthapath',
    city: 'Dhaka',
    plan: 'business',
    products: [
      ['Wireless Earbuds Pro', 'Audio', 3490, 4500, 60, ['bluetooth', 'earbuds']],
      ['20000mAh Power Bank', 'Accessories', 2290, 2800, 85, ['powerbank']],
      ['Smart Watch S8', 'Wearables', 5990, 7500, 22, ['watch', 'fitness']],
      ['65W GaN Charger', 'Accessories', 1890, null, 40, ['charger', 'fast-charge']],
      ['Mechanical Keyboard', 'Computer', 4590, 5200, 12, ['keyboard', 'gaming']],
      ['1080p Webcam', 'Computer', 2790, null, 7, ['webcam']],
    ],
  },
  {
    slug: 'bazar-fresh',
    name: 'Bazar Fresh',
    ownerName: 'Nusrat Jahan',
    email: 'orders@bazarfresh.bd',
    phone: '+8801511998877',
    address: 'Agrabad C/A',
    city: 'Chattogram',
    plan: 'free',
    products: [
      ['Miniket Rice 5kg', 'Rice & Grains', 420, null, 200, ['rice']],
      ['Mustard Oil 1L', 'Oil', 280, 310, 150, ['oil']],
      ['Hilsa Fish (1kg)', 'Fish', 1600, null, 15, ['fish', 'ilish']],
      ['Red Lentils 1kg', 'Rice & Grains', 135, null, 120, ['dal']],
      ['Sundarbans Honey 500g', 'Grocery', 650, 750, 30, ['honey', 'organic']],
    ],
  },
] as const

const PEOPLE = [
  ['Rashida Begum', 'Khulna'], ['Karim Hossain', 'Dhaka'], ['Fatima Akter', 'Dhaka'], ['Jamil Uddin', 'Chattogram'],
  ['Nasreen Sultana', 'Sylhet'], ['Habib Rahman', 'Dhaka'], ['Salma Khatun', 'Gazipur'], ['Arif Chowdhury', 'Rajshahi'],
  ['Tahmina Islam', 'Dhaka'], ['Mizanur Rahman', 'Cumilla'], ['Sharmin Nahar', 'Narayanganj'], ['Rafiq Mia', 'Bogura'],
  ['Shirin Akhter', 'Dhaka'], ['Imran Kabir', 'Barishal'], ['Lipi Das', 'Mymensingh'], ['Sohel Rana', 'Rangpur'],
  ['Mahmuda Haque', 'Dhaka'], ['Anwar Hossain', 'Jashore'], ['Ruma Begum', 'Chattogram'], ['Faisal Ahmed', 'Dhaka'],
] as const

// Deterministic pseudo-random so the seed is reproducible.
let seed = 42
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function main() {
  for (const plan of PLANS) {
    await db.plan.upsert({ where: { key: plan.key }, create: plan, update: { features: plan.features, rank: plan.rank } })
  }
  const plans = Object.fromEntries((await db.plan.findMany()).map((p) => [p.key, p]))

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@nexdrop.app').toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!password || password.length < 10) throw new Error('Set SEED_ADMIN_PASSWORD (min 10 chars) before seeding')
  await db.adminUser.upsert({
    where: { email },
    create: { email, name: 'Super Admin', role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(password, 12) },
    update: {},
  })
  console.log(`✔ super admin: ${email}`)

  // Demo logins (one per role). They can only sign in while DEMO_MODE=true.
  if (process.env.SEED_DEMO !== 'false' || process.env.DEMO_MODE === 'true') {
    for (const a of DEMO_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(a.password, 12)
      // Always reset: testers can't permanently break a demo account.
      await db.adminUser.upsert({
        where: { email: a.email },
        create: { email: a.email, name: a.name, role: a.role, passwordHash },
        update: { name: a.name, role: a.role, passwordHash, isActive: true },
      })
    }
    console.log(`✔ demo logins: ${DEMO_ACCOUNTS.map((a) => a.email).join(', ')} (password ${DEMO_ACCOUNTS[0].password})`)
  }

  if (process.env.SEED_DEMO === 'false') return
  if (await db.store.findUnique({ where: { slug: 'demo' } })) {
    console.log('✔ demo data already present')
    return
  }

  for (const s of STORES) {
    const store = await db.store.create({
      data: {
        slug: s.slug,
        name: s.name,
        ownerName: s.ownerName,
        email: s.email,
        phone: s.phone,
        address: s.address,
        city: s.city,
        planId: plans[s.plan].id,
        settings: defaultSettings(s.plan === 'free' ? { bkash: false, nagad: false } : {}),
      },
    })
    const products: Product[] = []
    for (const [i, [name, category, price, compare, qty, tags]] of s.products.entries()) {
      products.push(
        await db.product.create({
          data: {
            storeId: store.id,
            name,
            slug: slugify(name),
            description: `${name} — quality you can trust, delivered across Bangladesh.`,
            price,
            comparePrice: compare,
            sku: `${s.slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
            quantity: qty,
            category,
            tags: [...tags],
            images: [`https://picsum.photos/seed/${s.slug}-${i}/800/800`],
          },
        })
      )
    }

    const people = s.slug === 'demo' ? PEOPLE : PEOPLE.slice(0, 10)
    const customers: Customer[] = []
    for (const [i, [name, city]] of people.entries()) {
      const phone = `+88017${String(10000000 + i * 7919 + s.slug.length * 131).slice(0, 8)}`
      customers.push(
        await db.customer.create({
          data: {
            storeId: store.id,
            name,
            phone,
            email: `${slugify(name).replace('-', '.')}@example.com`,
            address: `House ${i + 3}, Road ${(i % 9) + 1}, ${city}`,
            city,
            district: city,
            createdAt: new Date(Date.now() - (360 - i * 15) * 86400_000),
          },
        })
      )
    }

    const orderCount = s.slug === 'demo' ? 220 : s.slug === 'gadget-ghor' ? 120 : 60
    let number = 1000
    for (let n = 0; n < orderCount; n++) {
      // More orders in recent months → visible growth trend
      const daysAgo = Math.floor(Math.pow(rand(), 1.6) * 360)
      const createdAt = new Date(Date.now() - daysAgo * 86400_000 - Math.floor(rand() * 86400_000))
      const customer = pick(customers)
      const lines = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => pick(products))
      const unique = [...new Map(lines.map((p) => [p.id, p])).values()]
      const items = unique.map((p) => ({ productId: p.id, name: p.name, sku: p.sku, price: p.price, quantity: 1 + Math.floor(rand() * 2) }))
      const subtotal = items.reduce((sum, i) => sum.plus(i.price.times(i.quantity)), new Prisma.Decimal(0))
      const shippingFee = new Prisma.Decimal(customer.city === 'Dhaka' ? 60 : 130)
      const method: PaymentMethod = s.plan === 'free' ? 'COD' : pick(['BKASH', 'BKASH', 'NAGAD', 'COD', 'COD', 'ROCKET'] as const)
      const status: OrderStatus =
        daysAgo < 2 ? pick(['PENDING', 'PROCESSING'] as const) : daysAgo < 6 ? pick(['PROCESSING', 'SHIPPED'] as const) : rand() < 0.08 ? 'CANCELLED' : 'DELIVERED'
      const paymentStatus: PaymentStatus =
        status === 'CANCELLED' ? (method === 'COD' ? 'PENDING' : 'REFUNDED') : method !== 'COD' || status === 'DELIVERED' ? 'PAID' : 'PENDING'
      await db.order.create({
        data: {
          storeId: store.id,
          orderNumber: ++number,
          customerId: customer.id,
          status,
          paymentMethod: method,
          paymentStatus,
          subtotal,
          shippingFee,
          total: subtotal.plus(shippingFee),
          shippingName: customer.name,
          shippingPhone: customer.phone,
          shippingAddress: customer.address || '',
          city: customer.city || 'Dhaka',
          district: customer.district,
          courier: status === 'SHIPPED' || status === 'DELIVERED' ? 'steadfast' : null,
          createdAt,
          updatedAt: createdAt,
          items: { create: items },
        },
      })
    }
    await db.store.update({ where: { id: store.id }, data: { orderSeq: number } })
    console.log(`✔ store ${s.slug}: ${products.length} products, ${customers.length} customers, ${orderCount} orders`)
  }

  await db.$executeRaw`
    UPDATE "Customer" c SET
      "totalSpent" = COALESCE(x.spent, 0), "orderCount" = COALESCE(x.cnt, 0), "lastOrderAt" = x.last
    FROM (
      SELECT "customerId", SUM(total) spent, COUNT(*) cnt, MAX("createdAt") last
      FROM "Order" WHERE status NOT IN ('CANCELLED', 'REFUNDED') GROUP BY "customerId"
    ) x WHERE x."customerId" = c.id`

  await db.notification.createMany({
    data: [
      { title: 'Welcome to NexDrop Admin', body: 'Upload your first theme from Themes → Upload theme', href: '/theme' },
      { title: 'Low stock', body: 'Jamdani Wedding Saree has 5 left', href: '/products?stock=low' },
    ],
  })
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
