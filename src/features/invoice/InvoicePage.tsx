import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { saleApi } from '@/api/endpoints'
import type { Sale } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InvoiceView } from '@/features/invoice/InvoiceView'

export function InvoicePage() {
  const { saleId } = useParams<{ saleId: string }>()
  const navigate = useNavigate()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!saleId) return
    saleApi
      .get(saleId)
      .then((s) => setSale(s))
      .catch((error) => toast.error(messageFromError(error)))
      .finally(() => setLoading(false))
  }, [saleId])

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading invoice…</div>
  }
  if (!sale) {
    return (
      <div className="p-8 text-muted-foreground">
        Invoice not found.
        <Button variant="outline" className="ml-3" onClick={() => navigate('/pos')}>
          Back to POS
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="no-print flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={() => window.print()}>Print invoice</Button>
      </div>

      <Card>
        <CardContent className="p-8">
          <InvoiceView sale={sale} />
        </CardContent>
      </Card>
    </div>
  )
}
