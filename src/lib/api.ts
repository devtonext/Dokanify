export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
  }
}

export async function api<T = any>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init || {}
  const res = await fetch(path, {
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(rest.headers || {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
    }
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.details ?? data.report)
  }
  return data as T
}

/** Builds a query string, dropping empty values. */
export function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') search.set(k, String(v))
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}

const CHUNK = 3 * 1024 * 1024

function putOnce(url: string, body: Blob, contentType: string, onProgress?: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded)
    xhr.onload = () => {
      if (xhr.status < 300) return resolve()
      let message = `Upload failed (${xhr.status})`
      try {
        message = JSON.parse(xhr.responseText).error || message
      } catch {
        /* not JSON */
      }
      reject(new Error(message))
    }
    xhr.onerror = () => reject(new Error('Upload failed — check your connection'))
    xhr.send(body)
  })
}

/**
 * Uploads a file straight to storage. S3/R2 presigned URLs take the whole file;
 * our own /api/uploads/direct endpoint takes 3 MB chunks (serverless body limits).
 */
export async function putFile(uploadUrl: string, file: Blob, contentType: string, onProgress?: (pct: number) => void) {
  const direct = uploadUrl.startsWith('/api/uploads/direct')
  if (!direct || file.size <= CHUNK) {
    await putOnce(uploadUrl, file, contentType, (loaded) => onProgress?.(Math.round((loaded / file.size) * 100)))
    onProgress?.(100)
    return
  }
  const parts = Math.ceil(file.size / CHUNK)
  for (let i = 0; i < parts; i++) {
    const chunk = file.slice(i * CHUNK, Math.min(file.size, (i + 1) * CHUNK))
    await putOnce(`${uploadUrl}&part=${i}&parts=${parts}`, chunk, contentType, (loaded) =>
      onProgress?.(Math.round(((i * CHUNK + loaded) / file.size) * 100))
    )
  }
  onProgress?.(100)
}

export async function uploadImage(file: File, storeId?: string) {
  const { uploadUrl, url } = await api<{ uploadUrl: string; url: string }>('/api/media/uploads', {
    method: 'POST',
    json: { contentType: file.type, size: file.size, storeId },
  })
  await putFile(uploadUrl, file, file.type)
  return url
}
