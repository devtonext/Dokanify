import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { applyDatabaseUrls } from '../src/lib/db-url'
import { MOCK_STORES, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_ORDERS } from '../src/lib/mock-data'

applyDatabaseUrls()
const db = new PrismaClient()

const PLANS = [
  { key: 'free', name: 'Starter', rank: 0, priceMonthly: 0, features: ['catalog', 'cart', 'checkout', 'search', 'cod'], maxProducts: 50 },
  { key: 'pro', name: 'Pro', rank: 1, priceMonthly: 1490, features: ['catalog', 'cart', 'checkout', 'search', 'cod', 'bkash', 'nagad', 'rocket', 'bilingual', 'wishlist', 'reviews', 'order-tracking'], maxProducts: 1000 },
  { key: 'business', name: 'Business', rank: 2, priceMonthly: 3990, features: ['catalog', 'cart', 'checkout', 'search', 'cod', 'bkash', 'nagad', 'rocket', 'sslcommerz', 'bilingual', 'blog', 'wishlist', 'reviews', 'order-tracking', 'custom-domain'], maxProducts: null },
]

async function main() {
  for (const plan of PLANS) {
    await db.plan.upsert({ where: { key: plan.key }, create: plan, update: {} })
  }
  console.log('✔ plans seeded')

  // Seed default merchant admin user
  const adminEmail = 'merchant@dokanify.com'
  const passwordHash = await bcrypt.hash('merchant12345', 12)
  await db.adminUser.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: 'Nazmul Hossen', role: 'SUPER_ADMIN', passwordHash },
    update: { name: 'Nazmul Hossen' },
  })
  console.log('✔ default merchant user seeded:', adminEmail)

  // Seed default merchant store: Aarong Heritage
  const freePlan = await db.plan.findUnique({ where: { key: 'business' } }) || await db.plan.findFirst()
  if (freePlan) {
    const store = await db.store.upsert({
      where: { slug: 'aarong-heritage' },
      create: {
        slug: 'aarong-heritage',
        name: 'Aarong Heritage',
        ownerName: 'Nazmul Hossen',
        email: 'hello@aarongheritage.bd',
        phone: '+8801712345678',
        address: 'House 42, Road 27, Dhanmondi',
        city: 'Dhaka',
        planId: freePlan.id,
        settings: {
          payments: { cod: true, bkash: true, nagad: true, sslcommerz: true, rocket: true },
          shipping: { defaultFee: 60, insideDhaka: 60, outsideDhaka: 120 }
        }
      },
      update: {}
    })
    console.log('✔ merchant store seeded:', store.name)

    // Seed products
    for (const p of MOCK_PRODUCTS) {
      await db.product.upsert({
        where: { storeId_sku: { storeId: store.id, sku: p.sku } },
        create: {
          storeId: store.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          price: p.price,
          comparePrice: p.comparePrice,
          quantity: p.quantity,
          category: p.category,
          images: p.images,
          tags: p.tags,
          description: p.description,
          status: 'ACTIVE'
        },
        update: {}
      })
    }
    console.log('✔ seeded 8 merchant products')
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
