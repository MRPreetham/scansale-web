import { describe, expect, it } from 'vitest'
import { marginFromSelling, sellingFromMargin } from './margin'

describe('marginFromSelling', () => {
  it('computes margin on cost', () => {
    expect(marginFromSelling(100, 150)).toBe(50)
    expect(marginFromSelling(200, 250)).toBe(25)
    expect(marginFromSelling(80, 100)).toBe(25)
  })

  it('handles loss (selling below cost)', () => {
    expect(marginFromSelling(100, 80)).toBe(-20)
  })

  it('rounds to 2 decimals', () => {
    expect(marginFromSelling(3, 4)).toBe(33.33)
  })

  it('returns null when cost is zero or selling is invalid', () => {
    expect(marginFromSelling(0, 150)).toBeNull()
    expect(marginFromSelling(100, Number.NaN)).toBeNull()
  })
})

describe('sellingFromMargin', () => {
  it('computes selling price from margin on cost', () => {
    expect(sellingFromMargin(100, 50)).toBe(150)
    expect(sellingFromMargin(200, 25)).toBe(250)
  })

  it('rounds to 2 decimals', () => {
    expect(sellingFromMargin(3, 10)).toBe(3.3)
  })

  it('returns null when cost is zero or margin is invalid', () => {
    expect(sellingFromMargin(0, 50)).toBeNull()
    expect(sellingFromMargin(100, Number.NaN)).toBeNull()
  })
})
