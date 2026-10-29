import { PrismaClient } from '@prisma/client'
import { applyDatabaseUrls } from './db-url'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient() {
  // Only when a URL exists: `next build` may load this module without a database.
  if (process.env.DATABASE_URL) applyDatabaseUrls()
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
