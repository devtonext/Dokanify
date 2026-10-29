import { z } from 'zod'

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'product'
  )
}

export const productInput = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/)
      .max(80)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    description: z.string().max(10000).optional().nullable(),
    price: z.coerce.number().min(0).max(10_000_000),
    comparePrice: z.coerce.number().min(0).max(10_000_000).nullable().optional(),
    sku: z.string().trim().min(1).max(60),
    quantity: z.coerce.number().int().min(0).max(1_000_000),
    images: z.array(z.string().max(1000)).max(12).default([]),
    category: z.string().trim().max(60).optional().nullable(),
    tags: z
      .array(z.string().trim().toLowerCase().max(30))
      .max(20)
      .default([]),
    status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  })
  .refine((p) => p.comparePrice == null || p.comparePrice === 0 || p.comparePrice > p.price, {
    message: 'Compare-at price must be higher than the price',
    path: ['comparePrice'],
  })
