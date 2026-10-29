/**
 * Object storage abstraction.
 *  - local: ./storage on disk (development only — serverless disks are ephemeral)
 *  - s3:    Cloudflare R2 / AWS S3 / MinIO
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

export interface StoredObject {
  body: Uint8Array
  contentType: string
}

interface StorageDriver {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>
  get(key: string): Promise<StoredObject | null>
  deletePrefix(prefix: string): Promise<void>
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
  return createHmac('sha256', process.env.NEXTAUTH_SECRET || 'dev').update(`${key}:${expires}`).digest('hex')
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

export const storage: StorageDriver = process.env.STORAGE_DRIVER === 's3' ? s3Driver : localDriver
export const isLocalStorage = process.env.STORAGE_DRIVER !== 's3'
