import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Banknote, FileText, Package, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardMetricCard } from '@/features/dashboard/components/DashboardMetricCard'
import { DashboardQuickLinks } from '@/features/dashboard/components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '@/features/dashboard/components/DashboardLoading'
import { fetchPortalDashboard } from '../portal-api'
import { usePortalPageChrome } from '../hooks/use-portal-page-chrome'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import { truckLoadPhaseLabel } from '@/features/bridging/bridging-status-ui'

export function PortalDashboardPage() {
  const { t } = useTranslation()
  usePortalPageChrome(t('Dashboard'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal', 'dashboard'],
    queryFn: fetchPortalDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load portal dashboard.')} />

  const distributedQty = data.total_distributed_qty ?? data.total_bridged_qty

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Open invoices')}
          value={data.open_invoices}
          variant="orange"
          icon={FileText}
          href={paths.portal.invoices}
        />
        <DashboardMetricCard
          title={t('Undistributed qty')}
          value={data.undistributed_qty}
          variant="purple"
          icon={Package}
        />
        <DashboardMetricCard
          title={t('Paid qty')}
          value={data.total_paid_qty}
          variant="green"
          icon={Banknote}
        />
        <DashboardMetricCard
          title={t('Distributed qty')}
          value={distributedQty}
          variant="teal"
          icon={Truck}
        />
      </div>

      <DashboardQuickLinks
        links={[
          { label: t('My invoices'), href: paths.portal.invoices },
          { label: t('Distribution report'), href: paths.portal.distributionReport },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Recent truck loads')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_loads.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('No recent truck loads.')}</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {data.recent_loads.map((load) => (
                <li
                  key={load.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{load.load_number}</p>
                    {load.invoice_number ? (
                      <p className="text-xs text-muted-foreground">{load.invoice_number}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(load.loading_date)}
                      {load.truck ? ` · ${load.truck}` : ''}
                      {load.phase
                        ? ` · ${truckLoadPhaseLabel(load.phase, t)}`
                        : ''}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{load.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link to={paths.portal.invoices} className="font-medium text-primary hover:underline">
          {t('View all invoices')}
        </Link>
      </p>
    </div>
  )
}
