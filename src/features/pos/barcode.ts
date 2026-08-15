export interface BarcodeKeyResult {
  buffer: string
  submit: string | null
}

export function barcodeKey(buffer: string, key: string, editableTarget: boolean): BarcodeKeyResult {
  if (editableTarget) return { buffer, submit: null }
  if (key === 'Enter') return { buffer: '', submit: buffer || null }
  if (key.length === 1) return { buffer: buffer + key, submit: null }
  return { buffer, submit: null }
}
