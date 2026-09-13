import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBridgingPageChrome } from '../hooks/use-bridging-page-chrome'
import { getTruckLoad } from '../bridging-api'
import { truckLoadPhaseLabel } from '../bridging-status-ui'
import { TruckOperationalStatusBadge } from '@/features/fleet/components/TruckOperationalStatusBadge'
import { TruckLoadActions } from '../components/TruckLoadActions'
import { TruckLoadDistributionPanel } from '../components/TruckLoadDistributionPanel'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import { formatQuantity } from '@/lib/format-quantity'
import { formatDate } from '@/utils/helpers'

export function TruckLoadShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: load, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.bridging.truckLoads.detail(id!),
    queryFn: () => getTruckLoad(id!),
    enabled: Boolean(id),
  })

  useBridgingPageChrome(
    load ? load.load_number ?? t('Distributed truck') : t('Distributed truck'),
    t('Distributed Trucks'),
  )

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (error || !load) {
    return (
      <p className="text-sm text-destructive">
        {t('Failed to load truck load.')}
        <Button asChild variant="link" className="ml-2 h-auto p-0">
          <Link to={paths.bridging.index}>{t('Back to list')}</Link>
        </Button>
      </p>
    )
  }

  const driverName = load.driver
    ? [load.driver.first_name, load.driver.last_name].filter(Boolean).join(' ')
    : '—'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to={paths.bridging.index}>{t('Back to distributed trucks')}</Link>
        </Button>
        <TruckLoadActions load={load} onUpdated={() => void refetch()} />
      </div>

      <TruckLoadDistributionPanel load={load} />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            {load.load_number || `#${load.id}`}
            <span className="text-sm font-normal text-muted-foreground">
              {truckLoadPhaseLabel(load.phase, t)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('Quantity')}</dt>
              <dd className="font-medium">{formatQuantity(load.quantity, { unit: 'L' })}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Loading date')}</dt>
              <dd>{load.loading_date ? formatDate(load.loading_date) : '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Truck')}</dt>
              <dd>
                {load.truck_id ? (
                  <Link
                    to={paths.fleet.truckShow(load.truck_id)}
                    className="text-primary hover:underline"
                  >
                    {load.truck?.plate_number ?? `#${load.truck_id}`}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Truck operational status')}</dt>
              <dd>
                <TruckOperationalStatusBadge status={load.truck?.operational_status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Driver')}</dt>
              <dd>{driverName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Loading depot')}</dt>
              <dd>{load.loading_depot?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Destination')}</dt>
              <dd>{load.destination ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Assigned qty')}</dt>
              <dd>{formatQuantity(load.assigned_qty)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Delivered qty')}</dt>
              <dd>{formatQuantity(load.delivered_qty)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Purchase invoice')}</dt>
              <dd>
                {load.purchase_invoice?.id ? (
                  <Link
                    to={`${paths.purchase.invoices}/${load.purchase_invoice.id}`}
                    className="text-primary hover:underline"
                  >
                    {load.purchase_invoice.invoice_number ?? `#${load.purchase_invoice.id}`}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('Sales invoice')}</dt>
              <dd>
                {load.sales_invoice?.id ? (
                  <Link
                    to={`${paths.sales.invoices}/${load.sales_invoice.id}`}
                    className="text-primary hover:underline"
                  >
                    {load.sales_invoice.invoice_number ?? `#${load.sales_invoice.id}`}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
