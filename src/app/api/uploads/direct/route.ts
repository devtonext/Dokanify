import { NextResponse } from 'next/server'
import { route, searchParams } from '@/lib/http'
import { storage, usesDirectUploads, verifyLocalUploadToken } from '@/lib/storage'
import { mimeFor } from '@/lib/themes/validate'

export const maxDuration = 60

/** Max bytes per request — below Vercel's 4.5 MB function body limit. */
const MAX_CHUNK = 4 * 1024 * 1024

/**
 * Stand-in for an S3 presigned PUT when files live on local disk or in Postgres.
 * Authorised by the HMAC token minted in storage.presignPut.
 * Large files arrive in chunks (?part=0..parts-1) and are assembled after the last one.
 */
export const PUT = route(async (req) => {
  if (!usesDirectUploads) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const params = searchParams(req)
  const key = params.get('key') || ''
  if (!verifyLocalUploadToken(key, Number(params.get('expires')), params.get('sig') || '')) {
    return NextResponse.json({ error: 'Upload link expired' }, { status: 403 })
  }
  const max = Number(process.env.THEME_MAX_ZIP_MB || 80) * 1024 * 1024
  const contentType = req.headers.get('content-type') || mimeFor(key)
  const body = new Uint8Array(await req.arrayBuffer())
  if (body.byteLength > MAX_CHUNK + 1024) return NextResponse.json({ error: 'Chunk too large' }, { status: 413 })

  const parts = Number(params.get('parts') || 1)
  const part = Number(params.get('part') || 0)
  if (!Number.isInteger(parts) || !Number.isInteger(part) || parts < 1 || parts > 64 || part < 0 || part >= parts) {
    return NextResponse.json({ error: 'Bad chunk index' }, { status: 400 })
  }
  if (parts === 1) {
    await storage.put(key, body, contentType)
    return new Response(null, { status: 200 })
  }

  const partKey = (i: number) => `${key}.part-${i}`
  await storage.put(partKey(part), body, 'application/octet-stream')
  if (part < parts - 1) return new Response(null, { status: 202 })

  // Last chunk: assemble (client sends chunks sequentially)
  const chunks: Uint8Array[] = []
  for (let i = 0; i < parts; i++) {
    const chunk = await storage.get(partKey(i))
    if (!chunk) return NextResponse.json({ error: `Missing chunk ${i}` }, { status: 400 })
    chunks.push(chunk.body)
  }
  const total = chunks.reduce((n, c) => n + c.byteLength, 0)
  if (total > max) return NextResponse.json({ error: 'File too large' }, { status: 413 })
  const file = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    file.set(c, offset)
    offset += c.byteLength
  }
  await storage.put(key, file, contentType)
  await Promise.all(chunks.map((_, i) => storage.delete(partKey(i))))
  return new Response(null, { status: 200 })
})
