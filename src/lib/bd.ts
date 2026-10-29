/** Bangladesh-specific helpers shared by the admin UI, APIs and storefront API. */

/** Accepts 01XXXXXXXXX, 8801XXXXXXXXX, +880 1XXX-XXXXXX … returns +8801XXXXXXXXX or null. */
export function normalizeBdPhone(input: string): string | null {
  const digits = (input || '').replace(/\D/g, '')
  const local = digits.startsWith('880') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits
  return /^1[3-9]\d{8}$/.test(local) ? `+880${local}` : null
}

export function formatBdPhone(phone: string) {
  const n = normalizeBdPhone(phone)
  if (!n) return phone
  return `+880 ${n.slice(4, 8)}-${n.slice(8)}`
}

export const DIVISIONS: Record<string, string[]> = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Manikganj', 'Munshiganj', 'Tangail', 'Kishoreganj', 'Faridpur', 'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur'],
  Chattogram: ['Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Noakhali', 'Lakshmipur', 'Chandpur', 'Brahmanbaria', 'Rangamati', 'Khagrachhari', 'Bandarban'],
  Rajshahi: ['Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Natore', 'Naogaon', 'Chapainawabganj', 'Joypurhat'],
  Khulna: ['Khulna', 'Jashore', 'Satkhira', 'Bagerhat', 'Kushtia', 'Jhenaidah', 'Magura', 'Narail', 'Chuadanga', 'Meherpur'],
  Barishal: ['Barishal', 'Bhola', 'Patuakhali', 'Pirojpur', 'Jhalokati', 'Barguna'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari', 'Lalmonirhat', 'Thakurgaon', 'Panchagarh'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
}

export const DISTRICTS = Object.values(DIVISIONS).flat().sort()

export const PAYMENT_METHODS = ['BKASH', 'NAGAD', 'ROCKET', 'SSLCOMMERZ', 'COD'] as const
export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_LABELS: Record<PaymentMethodKey, string> = {
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  ROCKET: 'Rocket',
  SSLCOMMERZ: 'Card / SSLCommerz',
  COD: 'Cash on Delivery',
}

export const PAYMENT_COLORS: Record<PaymentMethodKey, string> = {
  BKASH: '#e2136e',
  NAGAD: '#f6921e',
  ROCKET: '#8c3494',
  SSLCOMMERZ: '#2563eb',
  COD: '#0ea5e9',
}

/** Theme feature flag that a payment method needs. */
export const PAYMENT_FEATURE: Record<PaymentMethodKey, string> = {
  BKASH: 'bkash',
  NAGAD: 'nagad',
  ROCKET: 'rocket',
  SSLCOMMERZ: 'sslcommerz',
  COD: 'cod',
}

export const COURIERS = [
  { id: 'pathao', name: 'Pathao Courier' },
  { id: 'steadfast', name: 'Steadfast' },
  { id: 'redx', name: 'RedX' },
  { id: 'paperfly', name: 'Paperfly' },
] as const
