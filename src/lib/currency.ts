export function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatBDTCompact(amount: number): string {
  if (amount >= 100000) {
    return `৳${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `৳${(amount / 1000).toFixed(1)}K`
  }
  return `৳${amount.toFixed(0)}`
}
