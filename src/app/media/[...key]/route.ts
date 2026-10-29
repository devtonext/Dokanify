import { storage } from '@/lib/storage'

type Ctx = { params: Promise<{ key: string[] }> }

/** Serves uploaded media when no CDN (S3_PUBLIC_URL) is configured. */
export async function GET(_req: Request, { params }: Ctx) {
  const { key } = await params
  const path = ['media', ...key.slice(key[0] === 'media' ? 1 : 0)].join('/')
  let file
  try {
    file = await storage.get(path)
  } catch {
    file = null
  }
  if (!file || !file.contentType.startsWith('image/')) return new Response('Not found', { status: 404 })
  return new Response(file.body as BodyInit, {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  })
}
