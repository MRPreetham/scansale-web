import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, PackageSearch } from 'lucide-react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { productApi } from '@/api/endpoints'
import { useAuth } from '@/auth/context'
import { formatMoney } from '@/lib/money'
import type { Product, ProductInput } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

const EMPTY_FORM: ProductInput = {
  name: '',
  barcode: '',
  unit: 'pcs',
  sellingPrice: 0,
  reorderLevel: 0,
  openingQty: 0,
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
  const [saving, setSaving] = useState(false)
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

  function openDialog(mode: Mode, product: Product | null) {
    if (mode === 'adjust' && product) {
      setAdjustQty(product.availableQty ?? 0)
    } else if (mode === 'edit' && product) {
      setForm({
        name: product.name,
        barcode: product.barcode,
        unit: product.unit ?? 'pcs',
        sellingPrice: product.sellingPrice ?? 0,
        reorderLevel: product.reorderLevel ?? 0,
        openingQty: product.openingQty ?? 0,
        notes: product.notes ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
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
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Stock</TableHead>
                {canWrite && <TableHead className="w-32 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                      {formatMoney(p.sellingPrice ?? 0, user?.currency)}
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
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
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
                  <Label>Unit</Label>
                  <Input value={form.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Selling price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sellingPrice ?? 0}
                    onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reorder level</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.reorderLevel ?? 0}
                    onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                  />
                </div>
                {dialog?.mode === 'create' && (
                  <div className="space-y-1.5">
                    <Label>Opening quantity</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.openingQty ?? 0}
                      onChange={(e) => setForm({ ...form, openingQty: Number(e.target.value) })}
                    />
                  </div>
                )}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
