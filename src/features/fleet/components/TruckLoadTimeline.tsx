import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listTruckLoads } from '@/features/bridging/bridging-api'
import { truckLoadPhaseLabel } from '@/features/bridging/bridging-status-ui'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  truckId: number | string
  limit?: number
}

export function TruckLoadTimeline({ truckId, limit = 10 }: Props) {
  const { t } = useTranslation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['truck-loads', 'timeline', truckId, limit],
    queryFn: () =>
      listTruckLoads({
        truck_id: String(truckId),
        per_page: String(limit),
      }),
  })

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{t('Failed to load truck load history.')}</p>
  }

  const loads = data?.rows ?? []
  if (loads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('No truck loads recorded for this vehicle yet.')}
      </p>
    )
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-4">
      {loads.map((load) => (
        <li key={load.id} className="relative">
          <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">
              {load.load_number || `#${load.id}`}
              <span className="ml-2 font-normal text-muted-foreground">
                {truckLoadPhaseLabel(load.phase, t)}
              </span>
            </p>
            <p className="text-muted-foreground">
              {load.loading_date ? formatDate(load.loading_date) : '—'}
              {' · '}
              {Number(load.quantity).toLocaleString()} L
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {load.purchase_invoice?.id ? (
                <Link
                  to={`${paths.purchase.invoices}/${load.purchase_invoice.id}`}
                  className="text-primary hover:underline"
                >
                  {t('PI')}: {load.purchase_invoice.invoice_number ?? load.purchase_invoice.id}
                </Link>
              ) : null}
              {load.sales_invoice?.id ? (
                <Link
                  to={`${paths.sales.invoices}/${load.sales_invoice.id}`}
                  className="text-primary hover:underline"
                >
                  {t('SI')}: {load.sales_invoice.invoice_number ?? load.sales_invoice.id}
                </Link>
              ) : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
