import { useCallback, useRef, useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { productApi, saleApi } from '@/api/endpoints'
import { useAuth } from '@/auth/context'
import { formatMoney } from '@/lib/money'
import { addByBarcode as addToCart, changeQty as changeCartQty, totals, type CartLine } from '@/features/pos/cart'
import type { PaymentMode } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'CARD', 'CREDIT']

export function POSPage() {
  const { user } = useAuth()
  const currency = user?.currency
  const [lines, setLines] = useState<CartLine[]>([])
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH')
  const [saving, setSaving] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)

  const addByCode = useCallback(
    async (barcode: string) => {
      const code = barcode.trim()
      if (!code) return
      setLookupError('')
      try {
        const product = await productApi.getByBarcode(code)
        if (product.availableQty !== undefined && product.availableQty <= 0) {
          toast.error(`"${product.name}" is out of stock`)
          return
        }
        setLines((prev) => addToCart(prev, product))
      } catch (error) {
        setLookupError(messageFromError(error))
      } finally {
        barcodeRef.current?.focus()
      }
    },
    [],
  )

  function changeQty(id: string, delta: number) {
    setLines((prev) => changeCartQty(prev, id, delta))
  }

  async function saveSale() {
    if (lines.length === 0) return
    setSaving(true)
    try {
      const sale = await saleApi.create(
        lines.map((l) => ({ barcode: l.product.barcode, qty: l.qty })),
        paymentMode,
      )
      toast.success(`Sale ${sale.saleNumber} saved`)
      setLines([])
      setPaymentMode('CASH')
      barcodeRef.current?.focus()
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setSaving(false)
    }
  }

  const { qty: totalQty, amount: totalAmount } = totals(lines)

  return (
    <div className="flex h-full flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Input
              ref={barcodeRef}
              placeholder="Scan or type barcode…"
              className="h-12 text-lg"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void addByCode((e.target as HTMLInputElement).value)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />
            <Button size="lg" className="h-12" onClick={() => {
              const input = barcodeRef.current
              if (input) {
                void addByCode(input.value)
                input.value = ''
              }
            }}>
              Add
            </Button>
          </div>
          {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-24 text-right">Price</TableHead>
                <TableHead className="w-40 text-right">Quantity</TableHead>
                <TableHead className="w-28 text-right">Amount</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No items — scan a product to begin
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((l) => (
                  <TableRow key={l.product.id}>
                    <TableCell>
                      <p className="font-medium">{l.product.name}</p>
                      <p className="text-xs text-muted-foreground">{l.product.barcode}</p>
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(l.product.sellingPrice ?? 0, currency)}</TableCell>
                    <TableCell className="text-right">
                      <div className="ml-auto flex w-fit items-center gap-1">
                        <Button variant="outline" size="icon" className="size-7" onClick={() => changeQty(l.product.id, -1)}>
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center tabular-nums">{l.qty}</span>
                        <Button variant="outline" size="icon" className="size-7" onClick={() => changeQty(l.product.id, 1)}>
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(l.qty * (l.product.sellingPrice ?? 0), currency)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => changeQty(l.product.id, -l.qty)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t p-4">
          <div className="flex w-full items-center justify-between text-lg">
            <span>Total</span>
            <span className="tabular-nums">
              {totalQty} items · {formatMoney(totalAmount, currency)}
            </span>
          </div>
          <div className="flex w-full items-center gap-3">
            <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => void saveSale()}
              disabled={saving || lines.length === 0}
            >
              {saving ? 'Saving…' : `Save Sale · ${formatMoney(totalAmount, currency)}`}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
