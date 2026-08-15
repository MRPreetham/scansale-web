import { describe, expect, it } from 'vitest'
import { detectMapping, readCsvColumns, readCsvHeader } from './csvMapping'

describe('detectMapping', () => {
  it('detects common columns from supplier headers', () => {
    const m = detectMapping(['Item Code', 'Product Name', 'Rate', 'Stock Qty'])
    expect(m).toEqual({
      barcode: 'Item Code',
      name: 'Product Name',
      price: 'Rate',
      qty: 'Stock Qty',
    })
  })

  it('handles case, underscores and dashes', () => {
    const m = detectMapping(['BAR-CODE', 'product_name', 'Unit', 'Price', 'Quantity'])
    expect(m).toEqual({
      barcode: 'BAR-CODE',
      name: 'product_name',
      unit: 'Unit',
      price: 'Price',
      qty: 'Quantity',
    })
  })

  it('leaves fields unmapped when no matching column exists', () => {
    const m = detectMapping(['Name', 'Rate'])
    expect(m.barcode).toBeUndefined()
    expect(m.name).toBe('Name')
    expect(m.price).toBe('Rate')
    expect(m.qty).toBeUndefined()
  })

  it('does not reuse a column for two fields', () => {
    const m = detectMapping(['Product Code', 'Rate'])
    expect(m.barcode).toBe('Product Code')
    expect(m.name).toBeUndefined()
  })
})

describe('readCsvHeader', () => {
  it('returns the header row as trimmed columns', async () => {
    const file = new File(['Item Code,Product Name,Rate\n1,2,3\n'], 'x.csv', { type: 'text/csv' })
    expect(await readCsvHeader(file)).toEqual(['Item Code', 'Product Name', 'Rate'])
  })
})

describe('readCsvColumns', () => {
  it('returns headers plus the first data row as a sample', async () => {
    const file = new File(['Item Code,Product Name,Rate\n890123,Coke,40\n'], 'x.csv', {
      type: 'text/csv',
    })
    expect(await readCsvColumns(file)).toEqual({
      headers: ['Item Code', 'Product Name', 'Rate'],
      sample: ['890123', 'Coke', '40'],
    })
  })

  it('skips blank lines', async () => {
    const file = new File(['\nItem Code,Product Name\nA,B\n\n'], 'x.csv', { type: 'text/csv' })
    const result = await readCsvColumns(file)
    expect(result.headers).toEqual(['Item Code', 'Product Name'])
    expect(result.sample).toEqual(['A', 'B'])
  })
})
