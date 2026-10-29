import 'server-only'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found`)
export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details)

/** Deep-convert Prisma Decimals to numbers and Dates to ISO strings. */
export function serialize<T>(value: T): any {
  if (value === null || value === undefined) return value
  if (Prisma.Decimal.isDecimal(value)) return (value as Prisma.Decimal).toNumber()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serialize)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = serialize(v)
    return out
  }
  return value
}

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(serialize(data), init)
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>

/** Wraps a route handler with consistent error → JSON mapping. */
export function route<C = { params: Promise<Record<string, string>> }>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx)
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message, details: error.details }, { status: error.status })
      }
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: error.issues[0] ? `${error.issues[0].path.join('.') || 'input'}: ${error.issues[0].message}` : 'Invalid input',
            details: error.issues,
          },
          { status: 400 }
        )
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[] | undefined)?.join(', ')
          return NextResponse.json({ error: `Already exists${target ? ` (${target})` : ''}` }, { status: 409 })
        }
        if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      console.error('[api]', req.method, new URL(req.url).pathname, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

export function searchParams(req: Request) {
  return new URL(req.url).searchParams
}

export function pagination(params: URLSearchParams, maxLimit = 100) {
  const limit = Math.min(Math.max(Number(params.get('limit')) || 20, 1), maxLimit)
  const page = Math.max(Number(params.get('page')) || 1, 1)
  return { take: limit, skip: (page - 1) * limit, page, limit }
}
