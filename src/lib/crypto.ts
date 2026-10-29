import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { encryptionKey } from '@/lib/secrets'

const PREFIX = 'enc:v1:'

const key = encryptionKey

export function encryptSecret(plain: string) {
  if (!plain) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')
}

export function decryptSecret(value: string) {
  if (!value?.startsWith(PREFIX)) return value || ''
  const buf = Buffer.from(value.slice(PREFIX.length), 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12))
  decipher.setAuthTag(buf.subarray(12, 28))
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8')
}

export const SECRET_MASK = '••••••••'
