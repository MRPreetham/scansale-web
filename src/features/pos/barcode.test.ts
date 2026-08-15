import { describe, expect, it } from 'vitest'
import { barcodeKey } from './barcode'

describe('barcodeKey', () => {
  it('accumulates printable characters into the buffer', () => {
    let r = barcodeKey('', '8', false)
    r = barcodeKey(r.buffer, '9', false)
    expect(r).toMatchObject({ buffer: '89', submit: null })
  })

  it('submits the buffer on Enter and clears it', () => {
    const r = barcodeKey('890123', 'Enter', false)
    expect(r).toEqual({ buffer: '', submit: '890123' })
  })

  it('does not submit an empty buffer on Enter', () => {
    const r = barcodeKey('', 'Enter', false)
    expect(r).toEqual({ buffer: '', submit: null })
  })

  it('ignores non-printable keys (e.g. Shift)', () => {
    expect(barcodeKey('12', 'Shift', false)).toMatchObject({ buffer: '12', submit: null })
  })

  it('ignores keystrokes aimed at an editable field', () => {
    const r = barcodeKey('', '5', true)
    expect(r).toEqual({ buffer: '', submit: null })
  })
})
