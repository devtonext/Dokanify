/**
 * System data only — safe to run on every deploy (idempotent):
 *  - subscription plans (Starter / Pro / Business); existing plans are never overwritten
 *  - optional: a super admin from SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD (for automated VPS setups)
 * Without SEED_ADMIN_*, the first admin is created on the /setup page.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { applyDatabaseUrls } from '../src/lib/db-url'

applyDatabaseUrls()
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

async function main() {
  for (const plan of PLANS) {
    // Create missing plans only — prices/features edited in Settings → Plans are kept.
    await db.plan.upsert({ where: { key: plan.key }, create: plan, update: {} })
  }
  console.log('✔ plans: Starter, Pro, Business')

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (email && password) {
    if (password.length < 10) throw new Error('SEED_ADMIN_PASSWORD must be at least 10 characters')
    await db.adminUser.upsert({
      where: { email },
      create: { email, name: 'Super Admin', role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(password, 12) },
      update: {},
    })
    console.log(`✔ super admin: ${email}`)
  } else if ((await db.adminUser.count()) === 0) {
    console.log('… no admin yet — open the site and create the first super admin on /setup')
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
