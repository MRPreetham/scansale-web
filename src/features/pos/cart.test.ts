import { describe, expect, it } from 'vitest'
import { addByBarcode, changeQty, totals, type CartLine } from './cart'
import type { Product } from '@/types/api'

function product(id: string, price = 10): Product {
  return { id, name: `P${id}`, barcode: id, lowStock: false, sellingPrice: price }
}

describe('cart', () => {
  it('adds a new product with qty 1', () => {
    const lines = addByBarcode([], product('a', 5))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ qty: 1, product: { id: 'a' } })
  })

  it('merges a repeated barcode into the existing line', () => {
    const one = addByBarcode([], product('a'))
    const two = addByBarcode(one, product('a'))
    expect(two).toHaveLength(1)
    expect(two[0].qty).toBe(2)
  })

  it('keeps two different products as separate lines', () => {
    const lines = addByBarcode(addByBarcode([], product('a')), product('b'))
    expect(lines).toHaveLength(2)
  })

  it('changeQty adds and removes quantities', () => {
    let lines = addByBarcode([], product('a'))
    lines = changeQty(lines, 'a', 2)
    expect(lines[0].qty).toBe(3)
    lines = changeQty(lines, 'a', -3)
    expect(lines).toHaveLength(0)
  })

  it('changeQty does not go below zero', () => {
    let lines = addByBarcode([], product('a'))
    lines = changeQty(lines, 'a', -5)
    expect(lines).toHaveLength(0)
  })

  it('changeQty ignores unknown products', () => {
    const lines = addByBarcode([], product('a'))
    expect(changeQty(lines, 'zzz', 1)).toHaveLength(1)
  })

  it('computes totals', () => {
    const lines: CartLine[] = [
      { product: product('a', 10), qty: 2 },
      { product: product('b', 5.5), qty: 1 },
    ]
    expect(totals(lines)).toEqual({ qty: 3, amount: 25.5 })
  })
})
