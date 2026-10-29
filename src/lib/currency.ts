const whole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })
const fractional = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 })

/** ৳12,50,000 — Bangladeshi lakh grouping. */
export function formatBDT(amount: number | null | undefined): string {
  const value = Number(amount) || 0
  return (Number.isInteger(value) ? whole : fractional).format(value).replace('BDT', '৳').replace(/\s/g, '')
}

export function formatBDTCompact(amount: number): string {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}K`
  return `৳${amount.toFixed(0)}`
}
