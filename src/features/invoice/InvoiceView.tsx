import { formatMoney } from '@/lib/money'
import type { Sale } from '@/types/api'

export function InvoiceView({ sale }: { sale: Sale }) {
  const currency = sale.shop?.currency

  return (
    <div id="invoice-print">
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{sale.shop?.name ?? ''}</h1>
          {sale.shop?.address && <p className="mt-1 text-sm text-muted-foreground">{sale.shop.address}</p>}
          {sale.shop?.phone && <p className="text-sm text-muted-foreground">Phone: {sale.shop.phone}</p>}
          {sale.shop?.email && <p className="text-sm text-muted-foreground">{sale.shop.email}</p>}
          {sale.shop?.gstin && <p className="text-sm text-muted-foreground">GSTIN: {sale.shop.gstin}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">INVOICE</p>
          <p className="text-sm">No: {sale.saleNumber}</p>
          <p className="text-sm">{new Date(sale.soldAt).toLocaleString()}</p>
        </div>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">#</th>
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.lines.map((line, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">
                {line.name}
                {line.size != null && (
                  <span className="text-muted-foreground">
                    {' · '}
                    {line.size} {line.unit ?? ''}
                  </span>
                )}
              </td>
              <td className="py-2 text-right tabular-nums">{line.qty}</td>
              <td className="py-2 text-right tabular-nums">{formatMoney(line.unitPrice, currency)}</td>
              <td className="py-2 text-right tabular-nums">{formatMoney(line.amount, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total quantity</span>
            <span className="tabular-nums">{sale.totalQty}</span>
          </div>
          <div className="flex justify-between border-t pt-1 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(sale.totalAmount, currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between border-t pt-3 text-sm text-muted-foreground">
        <span>Payment: {sale.paymentMode}</span>
        <span>Cashier: {sale.cashierName}</span>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">Thank you for your purchase!</p>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; inset: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
