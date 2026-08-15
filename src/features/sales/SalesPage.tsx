import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { saleApi } from '@/api/endpoints'
import { useAuth } from '@/auth/context'
import { formatMoney } from '@/lib/money'
import type { Sale } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PAGE_SIZE = 50

export function SalesPage() {
  const { user } = useAuth()
  const currency = user?.currency
  const navigate = useNavigate()
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await saleApi.list({ page, size: PAGE_SIZE })
      setSales(result.items)
      setTotal(result.total)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Sales history</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/pos')}>
          Back to POS
        </Button>
      </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale #</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                  No sales yet
                </TableCell>
              </TableRow>
            ) : (
              sales.map((s) => (
                <TableRow key={s.id} className="border-foreground/20">
                  <TableCell className="font-medium whitespace-nowrap">{s.saleNumber}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {s.lines.map((l) => (
                        <span
                          key={l.productId}
                          className="rounded-sm bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {l.qty}× {l.name}
                          {l.size ? ` (${l.size} ml)` : ''}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(s.soldAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{s.cashierName}</TableCell>
                  <TableCell>{s.paymentMode}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(s.totalAmount, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/invoice/${s.id}`)}>
                      <Printer className="size-3.5" />
                      Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
        <span>{total} sale{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="tabular-nums">
            Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
    </div>
  )
}
