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

/** Uploads a file straight to storage through a presigned URL. */
export async function putFile(uploadUrl: string, file: Blob, contentType: string, onProgress?: (pct: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error('Upload failed — check your connection'))
    xhr.send(file)
  })
}

export async function uploadImage(file: File, storeId?: string) {
  const { uploadUrl, url } = await api<{ uploadUrl: string; url: string }>('/api/media/uploads', {
    method: 'POST',
    json: { contentType: file.type, size: file.size, storeId },
  })
  await putFile(uploadUrl, file, file.type)
  return url
}
