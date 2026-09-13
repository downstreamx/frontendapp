import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { DashboardError, DashboardLoading } from '@/features/dashboard/components/DashboardLoading'
import { fetchPortalInvoiceTruckLoadTimeline } from '../portal-api'
import { usePortalPageChrome } from '../hooks/use-portal-page-chrome'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import {
  salesDistributionStatusBadgeClass,
  salesDistributionStatusLabel,
  truckLoadPhaseLabel,
} from '@/features/bridging/bridging-status-ui'

export function PortalInvoiceViewPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal', 'invoice-timeline', id],
    queryFn: () => fetchPortalInvoiceTruckLoadTimeline(id!),
    enabled: Boolean(id),
  })

  usePortalPageChrome(
    data?.invoice.invoice_number ?? t('Invoice'),
    t('Invoices'),
  )

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load invoice.')} />

  const columns: Column<(typeof data.timeline)[number]>[] = [
    { key: 'load_number', header: t('Load #') },
    {
      key: 'loading_date',
      header: t('Loading date'),
      render: (value) => formatDate(String(value)),
    },
    { key: 'quantity', header: t('Quantity') },
    { key: 'assigned_qty', header: t('Assigned') },
    { key: 'delivered_qty', header: t('Delivered') },
    { key: 'truck', header: t('Truck') },
    { key: 'depot', header: t('Depot') },
    { key: 'driver', header: t('Driver') },
    { key: 'destination', header: t('Destination') },
    { key: 'waybill_number', header: t('Waybill') },
    {
      key: 'phase',
      header: t('Phase'),
      render: (_, row) => truckLoadPhaseLabel(row.phase, t),
    },
  ]

  const distributionStatus = data.invoice.distribution_status

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={paths.portal.invoices}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Back to invoices')}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{data.invoice.invoice_number}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-muted-foreground">{t('Invoice date')}</p>
            <p className="font-medium">{formatDate(data.invoice.invoice_date)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('Financial status')}</p>
            <p className="font-medium">{data.invoice.status}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('Distribution status')}</p>
            <span
              className={salesDistributionStatusBadgeClass(distributionStatus)}
            >
              {salesDistributionStatusLabel(distributionStatus, t)}
            </span>
          </div>
          <div>
            <p className="text-muted-foreground">{t('Undistributed qty')}</p>
            <p className="font-medium tabular-nums">{data.invoice.undistributed_qty}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Truck load timeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('No truck loads assigned to this invoice yet.')}
            </p>
          ) : (
            <DataTable embedded data={data.timeline} columns={columns} searchable />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
