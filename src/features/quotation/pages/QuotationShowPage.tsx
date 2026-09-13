import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { advanceQuotationStatus, getQuotation, quotationAdvanceLabels } from '../quotations-api'
import { paths } from '@/lib/paths'

export function QuotationShowPage() {
  const { id } = useParams()
  const quotationId = Number(id)
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', quotationId],
    queryFn: () => getQuotation(quotationId),
    enabled: Number.isFinite(quotationId),
  })

  const advanceMutation = useMutation({
    mutationFn: () => advanceQuotationStatus(quotationId),
    onSuccess: () => {
      toast.success('Quotation updated')
      void queryClient.invalidateQueries({ queryKey: ['quotation', 'quotations'] })
      void queryClient.invalidateQueries({ queryKey: ['quotations', quotationId] })
    },
    onError: () => toast.error('Could not update quotation status'),
  })

  const advanceLabel = data?.status ? quotationAdvanceLabels[data.status] : undefined

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{data?.quotation_number ?? `Quotation #${id}`}</CardTitle>
        <div className="flex items-center gap-2">
          {data?.status ? <Badge variant="secondary" className="capitalize">{data.status}</Badge> : null}
          {data?.status === 'draft' ? (
            <Button asChild size="sm" variant="outline">
              <Link to={paths.quotation.edit(quotationId)}>{t('Edit')}</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link to={paths.quotation.print(quotationId)}>{t('Print')}</Link>
          </Button>
          {advanceLabel ? (
            <Button type="button" size="sm" disabled={advanceMutation.isPending} onClick={() => advanceMutation.mutate()}>
              {advanceLabel}
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link to={paths.quotation.index}>{t('Back')}</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data && (
          <>
            <p className="text-sm">
              {data.quotation_date} → due {data.due_date} · Total {data.total_amount} ·{' '}
              <span className="capitalize">{data.status}</span>
            </p>
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-2">Product</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items ?? []).map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.product?.name ?? `#${item.product_id}`}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">{item.unit_price}</td>
                      <td className="p-2 text-right">{item.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
