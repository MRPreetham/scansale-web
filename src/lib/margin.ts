export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function marginFromSelling(cost: number, selling: number): number | null {
  if (!isFinite(selling) || cost <= 0) return null
  return round2(((selling - cost) / cost) * 100)
}

export function sellingFromMargin(cost: number, margin: number): number | null {
  if (!isFinite(margin) || cost <= 0) return null
  return round2(cost * (1 + margin / 100))
}
