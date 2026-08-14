import { describe, expect, it } from 'vitest'
import { dateISO } from './date'

function expectedISO(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

describe('dateISO', () => {
  it('returns today in yyyy-MM-dd format', () => {
    expect(dateISO()).toBe(expectedISO(0))
    expect(dateISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('applies negative offsets for past dates', () => {
    expect(dateISO(-6)).toBe(expectedISO(-6))
    expect(dateISO(-29)).toBe(expectedISO(-29))
  })

  it('applies positive offsets for future dates', () => {
    expect(dateISO(1)).toBe(expectedISO(1))
  })
})
