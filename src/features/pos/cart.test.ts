import { describe, expect, it } from 'vitest'
import { addByBarcode, addQty, changeQty, totals, type CartLine } from './cart'
import type { Product } from '@/types/api'

function product(id: string, price = 10, availableQty?: number): Product {
  return { id, name: `P${id}`, barcode: id, lowStock: false, sellingPrice: price, availableQty }
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

  it('addByBarcode caps qty at available stock', () => {
    const p = product('a', 10, 2)
    let lines = addByBarcode(addByBarcode([], p), p)
    expect(lines[0].qty).toBe(2)
    lines = addByBarcode(lines, p)
    expect(lines[0].qty).toBe(2)
  })

  it('changeQty caps qty at available stock', () => {
    let lines = addByBarcode([], product('a', 10, 2))
    lines = changeQty(lines, 'a', 10)
    expect(lines[0].qty).toBe(2)
  })

  it('changeQty ignores unknown products', () => {
    const lines = addByBarcode([], product('a'))
    expect(changeQty(lines, 'zzz', 1)).toHaveLength(1)
  })

  it('addQty adds a new product with the given qty', () => {
    const lines = addQty([], product('a', 5), 3)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ qty: 3, product: { id: 'a' } })
  })

  it('addQty adds to an existing line', () => {
    const one = addQty([], product('a'), 2)
    const two = addQty(one, product('a'), 3)
    expect(two[0].qty).toBe(5)
  })

  it('addQty caps qty at available stock', () => {
    const p = product('a', 10, 4)
    const lines = addQty(addQty([], p, 3), p, 5)
    expect(lines[0].qty).toBe(4)
  })

  it('addQty ignores non-positive qty', () => {
    expect(addQty([], product('a'), 0)).toHaveLength(0)
    expect(addQty([], product('a'), -1)).toHaveLength(0)
  })

  it('computes totals', () => {
    const lines: CartLine[] = [
      { product: product('a', 10), qty: 2 },
      { product: product('b', 5.5), qty: 1 },
    ]
    expect(totals(lines)).toEqual({ qty: 3, amount: 25.5 })
  })
})
