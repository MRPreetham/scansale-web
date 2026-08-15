import type { ColumnMapping } from '@/types/api'

export const MAPPING_FIELDS = ['barcode', 'name', 'unit', 'price', 'qty'] as const
export type MappingField = (typeof MAPPING_FIELDS)[number]

export const FIELD_LABELS: Record<MappingField, string> = {
  barcode: 'Barcode',
  name: 'Name',
  unit: 'Unit',
  price: 'Price',
  qty: 'Qty',
}

const PATTERNS: Record<MappingField, string[]> = {
  barcode: ['barcode', 'code'],
  name: ['name', 'product'],
  unit: ['unit'],
  price: ['price', 'rate'],
  qty: ['qty', 'quantity', 'stock', 'opening'],
}

function normalize(header: string): string {
  return header.trim().toLowerCase().replace(/[_-]+/g, ' ')
}

export function detectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const used = new Set<string>()
  for (const field of MAPPING_FIELDS) {
    const header = headers.find(
      (h) => !used.has(h) && PATTERNS[field].some((p) => normalize(h).includes(p)),
    )
    if (header) {
      mapping[field] = header
      used.add(header)
    }
  }
  return mapping
}

export interface CsvColumns {
  headers: string[]
  sample: string[]
}

export async function readCsvColumns(file: File): Promise<CsvColumns> {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  return {
    headers: (lines[0] ?? '').split(',').map((s) => s.trim()),
    sample: (lines[1] ?? '').split(',').map((s) => s.trim()),
  }
}

export async function readCsvHeader(file: File): Promise<string[]> {
  return (await readCsvColumns(file)).headers
}
