import 'server-only'
import { createHmac } from 'crypto'

export type MarketplaceEvent = 'theme.published' | 'theme.updated' | 'theme.archived'

/**
 * Pushes theme lifecycle events to the NexDrop marketplace.
 * Receivers verify `X-NexDrop-Signature: sha256=<hex HMAC of raw body>`.
 * The marketplace can also pull the full catalogue from GET /api/public/themes.
 */
export async function emitMarketplaceEvent(event: MarketplaceEvent, payload: Record<string, unknown>) {
  const url = process.env.MARKETPLACE_WEBHOOK_URL
  if (!url) return { skipped: true }
  const body = JSON.stringify({ event, sentAt: new Date().toISOString(), data: payload })
  const signature = createHmac('sha256', process.env.MARKETPLACE_WEBHOOK_SECRET || '').update(body).digest('hex')
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NexDrop-Event': event,
        'X-NexDrop-Signature': `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) console.error('[marketplace] webhook responded', res.status)
    return { delivered: res.ok, status: res.status }
  } catch (error) {
    console.error('[marketplace] webhook failed', error)
    return { delivered: false }
  }
}
