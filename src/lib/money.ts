const formatterCache = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number, currency?: string | null): string {
  const code = currency && currency.length === 3 ? currency : 'INR'
  let formatter = formatterCache.get(code)
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    formatterCache.set(code, formatter)
  }
  return formatter.format(amount)
}
