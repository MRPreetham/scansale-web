import { useState } from 'react'
import { useAsync } from '@/lib/useAsync'
import { reportApi } from '@/api/endpoints'
import { useAuth } from '@/auth/context'
import { formatMoney } from '@/lib/money'
import type { DailyReport } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ReportsPage() {
  const { user } = useAuth()
  const [date, setDate] = useState(today())
  const { data: report, loading, reload } = useAsync<DailyReport>(
    () => reportApi.daily(date),
    [date],
  )

  const breakdown = report ? Object.entries(report.paymentBreakdown) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        <Button variant="outline" onClick={reload} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Total sales</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {formatMoney(report.totalSalesAmount, user?.currency)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Units sold</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {report.totalUnitsSold}
              </CardContent>
            </Card>
            {breakdown.map(([mode, amount]) => (
              <Card key={mode}>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{mode}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold tabular-nums">
                  {formatMoney(amount, user?.currency)}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Placed</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">End quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                        No activity on this day
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.rows.map((row) => (
                      <TableRow key={row.productId}>
                        <TableCell>
                          <p className="font-medium">{row.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{row.barcode}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.openingQty}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.placedQty}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.soldQty}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.endQty}</TableCell>
                        <TableCell>{row.lowStock ? 'Low' : 'OK'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
