import type { Product } from '@/types/api'

export interface CartLine {
  product: Product
  qty: number
}

export function addByBarcode(lines: CartLine[], product: Product): CartLine[] {
  const existing = lines.find((l) => l.product.id === product.id)
  if (existing) {
    const max = product.availableQty ?? Number.MAX_SAFE_INTEGER
    const qty = Math.min(existing.qty + 1, max)
    return lines.map((l) => (l.product.id === product.id ? { ...l, qty } : l))
  }
  return [...lines, { product, qty: 1 }]
}

export function changeQty(lines: CartLine[], productId: string, delta: number): CartLine[] {
  return lines.flatMap((l) => {
    if (l.product.id !== productId) return [l]
    const max = l.product.availableQty ?? Number.MAX_SAFE_INTEGER
    const qty = Math.min(l.qty + delta, max)
    if (qty <= 0) return []
    return [{ ...l, qty }]
  })
}

export function totals(lines: CartLine[]) {
  return {
    qty: lines.reduce((sum, l) => sum + l.qty, 0),
    amount: lines.reduce((sum, l) => sum + l.qty * (l.product.sellingPrice ?? 0), 0),
  }
}
