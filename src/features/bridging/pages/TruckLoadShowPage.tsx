import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { DetailFieldGrid } from '@/features/shared/components/detail-info-tile'
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
    return <PageContentLoader className="min-h-[16rem]" />
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
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl tracking-tight">
            {load.load_number || `#${load.id}`}
            <span className="text-sm font-normal text-muted-foreground">
              {truckLoadPhaseLabel(load.phase, t)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <DetailFieldGrid
            fields={[
              {
                label: t('Quantity'),
                value: formatQuantity(load.quantity, { unit: 'L' }),
              },
              {
                label: t('Loading date'),
                value: load.loading_date ? formatDate(load.loading_date) : '—',
              },
              {
                label: t('Truck'),
                value: load.truck_id ? (
                  <Link
                    to={paths.fleet.truckShow(load.truck_id)}
                    className="text-primary hover:underline"
                  >
                    {load.truck?.plate_number ?? `#${load.truck_id}`}
                  </Link>
                ) : (
                  '—'
                ),
              },
              {
                label: t('Truck operational status'),
                value: <TruckOperationalStatusBadge status={load.truck?.operational_status} />,
              },
              { label: t('Driver'), value: driverName },
              { label: t('Loading depot'), value: load.loading_depot?.name ?? '—' },
              { label: t('Destination'), value: load.destination ?? '—' },
              { label: t('Assigned qty'), value: formatQuantity(load.assigned_qty) },
              { label: t('Delivered qty'), value: formatQuantity(load.delivered_qty) },
              {
                label: t('Purchase invoice'),
                value: load.purchase_invoice?.id ? (
                  <Link
                    to={`${paths.purchase.invoices}/${load.purchase_invoice.id}`}
                    className="text-primary hover:underline"
                  >
                    {load.purchase_invoice.invoice_number ?? `#${load.purchase_invoice.id}`}
                  </Link>
                ) : (
                  '—'
                ),
              },
              {
                label: t('Sales invoice'),
                value: load.sales_invoice?.id ? (
                  <Link
                    to={`${paths.sales.invoices}/${load.sales_invoice.id}`}
                    className="text-primary hover:underline"
                  >
                    {load.sales_invoice.invoice_number ?? `#${load.sales_invoice.id}`}
                  </Link>
                ) : (
                  '—'
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
