import { NextResponse } from 'next/server'
import { route, searchParams } from '@/lib/http'
import { isLocalStorage, storage, verifyLocalUploadToken } from '@/lib/storage'
import { mimeFor } from '@/lib/themes/validate'

/**
 * Local-storage stand-in for an S3 presigned PUT (development only).
 * Authorised by the HMAC token minted in storage.presignPut.
 */
export const PUT = route(async (req) => {
  if (!isLocalStorage) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const params = searchParams(req)
  const key = params.get('key') || ''
  if (!verifyLocalUploadToken(key, Number(params.get('expires')), params.get('sig') || '')) {
    return NextResponse.json({ error: 'Upload link expired' }, { status: 403 })
  }
  const max = Number(process.env.THEME_MAX_ZIP_MB || 80) * 1024 * 1024
  const body = new Uint8Array(await req.arrayBuffer())
  if (body.byteLength > max) return NextResponse.json({ error: 'File too large' }, { status: 413 })
  await storage.put(key, body, req.headers.get('content-type') || mimeFor(key))
  return new Response(null, { status: 200 })
})
