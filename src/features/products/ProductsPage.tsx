import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, PackageSearch } from 'lucide-react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { productApi } from '@/api/endpoints'
import { useAuth } from '@/auth/context'
import { formatMoney } from '@/lib/money'
import { marginFromSelling, sellingFromMargin } from '@/lib/margin'
import type { Product, ProductInput } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Mode = 'create' | 'edit' | 'adjust'

const UNITS = ['ml']
const SIZE_UNITS = ['ml']

const EMPTY_FORM: ProductInput = {
  name: '',
  barcode: '',
  unit: 'pcs',
  costPrice: 0,
  sellingPrice: 0,
  profitMargin: 0,
  notes: '',
}

export function ProductsPage() {
  const { user } = useAuth()
  const canWrite = user?.role === 'ADMIN' || user?.role === 'INVENTORY'
  const canDelete = user?.role === 'ADMIN'

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [dialog, setDialog] = useState<{ mode: Mode; product: Product | null } | null>(null)
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM)
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustQtyText, setAdjustQtyText] = useState('')
  const [numText, setNumText] = useState({ costPrice: '', sellingPrice: '', profitMargin: '', size: '', qty: '' })
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState<Product | null>(null)
  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const pageResult = await productApi.list({
        q: query || undefined,
        low: lowOnly || undefined,
        page,
        size: PAGE_SIZE,
      })
      setProducts(pageResult.items)
      setTotal(pageResult.total)
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setLoading(false)
    }
  }, [query, lowOnly, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(0)
  }, [query, lowOnly])

  // In Add mode, check the entered barcode against the DB and show what already exists.
  useEffect(() => {
    if (dialog?.mode !== 'create') {
      setExisting(null)
      return
    }
    const barcode = form.barcode.trim()
    if (!barcode) {
      setExisting(null)
      return
    }
    const timer = setTimeout(() => {
      productApi
        .getByBarcode(barcode)
        .then((p) => setExisting(p))
        .catch(() => setExisting(null))
    }, 400)
    return () => clearTimeout(timer)
  }, [dialog?.mode, form.barcode])

  function openDialog(mode: Mode, product: Product | null) {
    if (mode === 'adjust' && product) {
      setAdjustQty(product.availableQty ?? 0)
      setAdjustQtyText(String(product.availableQty ?? 0))
    } else if (mode === 'edit' && product) {
      const cost = product.costPrice ?? 0
      const selling = product.sellingPrice ?? 0
      const margin = marginFromSelling(cost, selling)
      setForm({
        name: product.name,
        barcode: product.barcode,
        unit: product.unit ?? 'pcs',
        costPrice: cost,
        sellingPrice: selling,
        profitMargin: margin === null ? product.profitMargin ?? 0 : margin,
        size: product.size,
        quantity: product.availableQty ?? 0,
        notes: product.notes ?? '',
      })
      setNumText({
        costPrice: String(cost),
        sellingPrice: String(selling),
        profitMargin: String(marginFromSelling(cost, selling) ?? ''),
        size: product.size == null ? '' : String(product.size),
        qty: product.availableQty == null ? '' : String(product.availableQty),
      })
    } else {
      setForm(EMPTY_FORM)
      setNumText({ costPrice: '', sellingPrice: '', profitMargin: '', size: '', qty: '' })
    }
    setDialog({ mode, product })
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!dialog) return
    setSaving(true)
    try {
      if (dialog.mode === 'create') {
        await productApi.create(form)
        toast.success('Product created')
      } else if (dialog.mode === 'edit' && dialog.product) {
        await productApi.update(dialog.product.id, form)
        toast.success('Product updated')
      } else if (dialog.mode === 'adjust' && dialog.product) {
        await productApi.adjustStock(dialog.product.id, adjustQty)
        toast.success('Stock adjusted')
      }
      setDialog(null)
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product: Product) {
    try {
      await productApi.remove(product.id)
      toast.success(`"${product.name}" deleted`)
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    }
  }

  function onCostChange(text: string) {
    const cost = text === '' ? 0 : Number(text)
    const selling = numText.sellingPrice === '' ? null : Number(numText.sellingPrice)
    const margin = numText.profitMargin === '' ? null : Number(numText.profitMargin)
    let sellingText = numText.sellingPrice
    let marginText = numText.profitMargin
    if (selling !== null && !isNaN(selling)) {
      const m = marginFromSelling(cost, selling)
      marginText = m === null ? '' : String(m)
    } else if (margin !== null && !isNaN(margin)) {
      const s = sellingFromMargin(cost, margin)
      sellingText = s === null ? '' : String(s)
    }
    setNumText({ ...numText, costPrice: text, sellingPrice: sellingText, profitMargin: marginText })
    setForm({
      ...form,
      costPrice: cost,
      sellingPrice: sellingText === '' ? 0 : Number(sellingText),
      profitMargin: marginText === '' ? 0 : Number(marginText),
    })
  }

  function onSellingChange(text: string) {
    const selling = text === '' ? 0 : Number(text)
    const cost = numText.costPrice === '' ? 0 : Number(numText.costPrice)
    const m = text === '' ? null : marginFromSelling(cost, selling)
    const marginText = m === null ? '' : String(m)
    setNumText({ ...numText, sellingPrice: text, profitMargin: marginText })
    setForm({ ...form, sellingPrice: selling, profitMargin: marginText === '' ? 0 : Number(marginText) })
  }

  function onMarginChange(text: string) {
    const margin = text === '' ? 0 : Number(text)
    const cost = numText.costPrice === '' ? 0 : Number(numText.costPrice)
    const s = text === '' ? null : sellingFromMargin(cost, margin)
    const sellingText = s === null ? '' : String(s)
    setNumText({ ...numText, profitMargin: text, sellingPrice: sellingText })
    setForm({ ...form, profitMargin: margin, sellingPrice: sellingText === '' ? 0 : Number(sellingText) })
  }

  function onSizeChange(text: string) {
    setNumText((prev) => ({ ...prev, size: text }))
    setForm((f) => ({ ...f, size: text === '' ? undefined : Number(text) }))
  }

  function onQtyChange(text: string) {
    setNumText((prev) => ({ ...prev, qty: text }))
    setForm((f) => ({ ...f, quantity: text === '' ? 0 : Number(text) }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search by name, barcode or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setLowOnly((v) => !v)}>
          <PackageSearch className="size-4" />
          {lowOnly ? 'All' : 'Low stock'}
        </Button>
        {canWrite && (
          <Button onClick={() => openDialog('create', null)}>
            <Plus className="size-4" />
            Add product
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Selling</TableHead>
                <TableHead className="text-right">Profit margin</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Stock</TableHead>
                {canWrite && <TableHead className="w-32 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.name}</p>
                      {p.unit && <p className="text-xs text-muted-foreground">{p.unit}</p>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(p.costPrice ?? 0, user?.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(p.sellingPrice ?? 0, user?.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.profitMargin ?? 0}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.size == null ? '—' : `${p.size} ${p.unit ?? ''}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.availableQty ?? 0}</TableCell>
                    <TableCell>
                      {p.lowStock ? (
                        <Badge variant="destructive">Low stock</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" title="Adjust stock" onClick={() => openDialog('adjust', p)}>
                            <PackageSearch className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" title="Edit" onClick={() => openDialog('edit', p)}>
                            <Pencil className="size-4" />
                          </Button>
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="size-8 text-destructive" title="Delete" onClick={() => void handleDelete(p)}>
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} product{total === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="tabular-nums">
            Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * PAGE_SIZE >= total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === 'create'
                ? 'Add product'
                : dialog?.mode === 'edit'
                  ? 'Edit product'
                  : 'Adjust stock'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.mode === 'adjust'
                ? `Set a new available quantity for "${dialog?.product?.name}".`
                : 'Fill in the product details.'}
            </DialogDescription>
          </DialogHeader>
          {dialog?.mode === 'adjust' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New available quantity</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={adjustQtyText}
                  onChange={(e) => {
                    setAdjustQtyText(e.target.value)
                    setAdjustQty(Number(e.target.value))
                  }}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Barcode *</Label>
                  <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit *</Label>
                  <Select value={form.unit ?? 'pcs'} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Cost price (per unit) *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={numText.costPrice}
                    onChange={(e) => onCostChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Selling price (per unit) *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={numText.sellingPrice}
                    onChange={(e) => onSellingChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Profit margin (%) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={numText.profitMargin}
                    onChange={(e) => onMarginChange(e.target.value)}
                  />
                </div>
                {SIZE_UNITS.includes(form.unit ?? 'pcs') && (
                  <div className="space-y-1.5">
                    <Label>Size (in {form.unit}) *</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.001"
                      placeholder="e.g. 750"
                      required
                      value={numText.size}
                      onChange={(e) => onSizeChange(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Stock *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.001"
                    placeholder="e.g. 100"
                    required
                    value={numText.qty}
                    onChange={(e) => onQtyChange(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Notes</Label>
                  <Input value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                {dialog?.mode === 'create' && existing && (
                  <div className="col-span-2 space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive">This barcode already exists in your inventory</p>
                    <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                      <li>Name: {existing.name}</li>
                      <li>Quantity: {existing.availableQty ?? 0}</li>
                      <li>Cost: {formatMoney(existing.costPrice ?? 0, user?.currency)}</li>
                      <li>Selling: {formatMoney(existing.sellingPrice ?? 0, user?.currency)}</li>
                      <li>Profit margin: {existing.profitMargin ?? 0}%</li>
                      <li>Size: {existing.size == null ? '—' : `${existing.size} ${existing.unit ?? ''}`}</li>
                    </ul>
                    <p>Edit that product instead of adding a duplicate.</p>
                    <Button type="button" size="sm" className="mt-1" onClick={() => openDialog('edit', existing)}>
                      Edit this product instead
                    </Button>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || (dialog?.mode === 'create' && !!existing)}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
