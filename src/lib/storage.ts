/**
 * Object storage abstraction.
 *  - local: ./storage on disk — development, or a VPS with a persistent volume (not serverless)
 *  - s3:    Supabase Storage (S3 protocol) / MinIO / Cloudflare R2 / AWS S3
 *  - db:    rows in Postgres (StorageObject) — zero-config, default on Vercel. Fine for testing and
 *           small catalogues; move to s3 for heavy traffic.
 */
import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import { dirname, join, normalize } from 'path'
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db } from '@/lib/db'
import { authSecret } from '@/lib/secrets'

export interface StoredObject {
  body: Uint8Array
  contentType: string
}

interface StorageDriver {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>
  get(key: string): Promise<StoredObject | null>
  deletePrefix(prefix: string): Promise<void>
  delete(key: string): Promise<void>
  /** URL the browser can PUT a file to directly (bypasses serverless body limits). */
  presignPut(key: string, contentType: string): Promise<string>
  /** Public URL for media (images uploaded in the editor). */
  publicUrl(key: string): string
}

export function assertSafeKey(key: string) {
  if (!key || key.startsWith('/') || key.includes('..') || key.includes('\\') || key.includes('\0')) {
    throw new Error(`Unsafe storage key: ${key}`)
  }
}

// ─── local ───────────────────────────────────────────────────────────────────

const LOCAL_ROOT = join(process.cwd(), 'storage')

function localSignature(key: string, expires: number) {
  return createHmac('sha256', authSecret() || 'dev').update(`${key}:${expires}`).digest('hex')
}

export function verifyLocalUploadToken(key: string, expires: number, sig: string) {
  if (Date.now() > expires) return false
  const expected = Buffer.from(localSignature(key, expires))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

function contentTypeFile(path: string) {
  return `${path}.__type`
}

const localDriver: StorageDriver = {
  async put(key, body, contentType) {
    assertSafeKey(key)
    const path = normalize(join(LOCAL_ROOT, key))
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, body)
    await writeFile(contentTypeFile(path), contentType)
  },
  async get(key) {
    assertSafeKey(key)
    const path = normalize(join(LOCAL_ROOT, key))
    try {
      const [body, type] = await Promise.all([
        readFile(path),
        readFile(contentTypeFile(path), 'utf8').catch(() => 'application/octet-stream'),
      ])
      return { body: new Uint8Array(body), contentType: type }
    } catch {
      return null
    }
  },
  async deletePrefix(prefix) {
    assertSafeKey(prefix)
    await rm(join(LOCAL_ROOT, prefix), { recursive: true, force: true })
  },
  async delete(key) {
    assertSafeKey(key)
    const path = normalize(join(LOCAL_ROOT, key))
    await Promise.all([rm(path, { force: true }), rm(contentTypeFile(path), { force: true })])
  },
  async presignPut(key) {
    assertSafeKey(key)
    const expires = Date.now() + 15 * 60_000
    const params = new URLSearchParams({ key, expires: String(expires), sig: localSignature(key, expires) })
    return `/api/uploads/direct?${params}`
  },
  publicUrl(key) {
    return `/${key}`
  },
}

// ─── s3 / R2 ─────────────────────────────────────────────────────────────────

let s3: S3Client | null = null
function client() {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    })
  }
  return s3
}
const bucket = () => {
  const name = process.env.S3_BUCKET
  if (!name) throw new Error('S3_BUCKET is not configured')
  return name
}

const s3Driver: StorageDriver = {
  async put(key, body, contentType) {
    assertSafeKey(key)
    await client().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }))
  },
  async get(key) {
    assertSafeKey(key)
    try {
      const res = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }))
      if (!res.Body) return null
      return {
        body: await res.Body.transformToByteArray(),
        contentType: res.ContentType || 'application/octet-stream',
      }
    } catch (error: any) {
      if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) return null
      throw error
    }
  },
  async deletePrefix(prefix) {
    assertSafeKey(prefix)
    let token: string | undefined
    do {
      const page = await client().send(
        new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token })
      )
      const keys = (page.Contents || []).map((o) => ({ Key: o.Key! }))
      if (keys.length) {
        await client().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys } }))
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined
    } while (token)
  },
  async delete(key) {
    assertSafeKey(key)
    await client().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: [{ Key: key }] } }))
  },
  async presignPut(key, contentType) {
    assertSafeKey(key)
    return getSignedUrl(client(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), {
      expiresIn: 900,
    })
  },
  publicUrl(key) {
    const base = process.env.S3_PUBLIC_URL
    return base ? `${base.replace(/\/$/, '')}/${key}` : `/${key}`
  },
}

// ─── db (Postgres) ───────────────────────────────────────────────────────────

const dbDriver: StorageDriver = {
  async put(key, body, contentType) {
    assertSafeKey(key)
    const data = new Uint8Array(body)
    await db.storageObject.upsert({
      where: { key },
      create: { key, contentType, size: data.byteLength, data },
      update: { contentType, size: data.byteLength, data },
    })
  },
  async get(key) {
    assertSafeKey(key)
    const row = await db.storageObject.findUnique({ where: { key } })
    return row ? { body: new Uint8Array(row.data), contentType: row.contentType } : null
  },
  async deletePrefix(prefix) {
    assertSafeKey(prefix)
    await db.storageObject.deleteMany({ where: { key: { startsWith: prefix } } })
  },
  async delete(key) {
    assertSafeKey(key)
    await db.storageObject.deleteMany({ where: { key } })
  },
  presignPut: localDriver.presignPut,
  publicUrl: localDriver.publicUrl,
}

/** STORAGE_DRIVER=local|s3|db. Default: db on Vercel (no persistent disk), local elsewhere. */
export const storageDriver = process.env.STORAGE_DRIVER || (process.env.VERCEL ? 'db' : 'local')
export const storage: StorageDriver = storageDriver === 's3' ? s3Driver : storageDriver === 'db' ? dbDriver : localDriver
/** Uploads go through /api/uploads/direct (signed, chunked) instead of an S3 presigned URL. */
export const usesDirectUploads = storageDriver !== 's3'
