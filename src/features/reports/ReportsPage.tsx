import { useState } from 'react'
import { useAsync } from '@/lib/useAsync'
import { dateISO } from '@/lib/date'
import { reportApi } from '@/api/endpoints'
import { useAuth } from '@/auth/context'
import { formatMoney } from '@/lib/money'
import type { DailyReport } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ReportsPage() {
  const { user } = useAuth()
  const [preset, setPreset] = useState<'today' | '7d' | '30d' | 'custom'>('today')
  const [from, setFrom] = useState(dateISO())
  const [to, setTo] = useState(dateISO())
  const [range, setRange] = useState<{ from: string; to: string }>({ from: dateISO(), to: dateISO() })
  const { data: report, loading } = useAsync<DailyReport>(
    () => reportApi.period(range.from, range.to),
    [range],
  )

  const breakdown = report ? Object.entries(report.paymentBreakdown) : []

  function applyRange(fromDate: string, toDate: string, nextPreset: typeof preset) {
    setFrom(fromDate)
    setTo(toDate)
    setPreset(nextPreset)
    setRange({ from: fromDate, to: toDate })
  }

  const presets: { key: typeof preset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <Button
            key={p.key}
            variant={preset === p.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (p.key === 'today') applyRange(dateISO(), dateISO(), 'today')
              else if (p.key === '7d') applyRange(dateISO(-6), dateISO(), '7d')
              else if (p.key === '30d') applyRange(dateISO(-29), dateISO(), '30d')
              else setPreset('custom')
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </div>
          <Button onClick={() => setRange({ from, to })} disabled={loading}>
            {loading ? 'Generating…' : 'Generate report'}
          </Button>
        </div>
      )}

      {report && (
        <span className="text-sm text-muted-foreground">
          Showing: {report.date}
        </span>
      )}

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
                        No activity in this period
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
