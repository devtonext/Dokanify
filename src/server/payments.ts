import 'server-only'
import { decryptSecret } from '@/lib/crypto'
import { GATEWAYS, type StoreSettings } from '@/lib/store-settings'

/** Decrypted gateway credentials for payment integrations (bKash, Nagad, …). Never send to the client. */
export function gatewayCredentials(settings: StoreSettings, gateway: (typeof GATEWAYS)[number]) {
  const g = settings.payments[gateway]
  return { ...g, apiKey: decryptSecret(g.apiKey), secret: decryptSecret(g.secret), password: decryptSecret(g.password) }
}
