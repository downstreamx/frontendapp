import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeftRight, Package, Warehouse } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchDepotDashboard } from '../dashboard-api'
import { paths } from '@/lib/paths'

export function DepotDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('Depot Dashboard'), t('Depot'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'depot'],
    queryFn: fetchDepotDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load depot dashboard.')} />

  const stats = data.stats

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardMetricCard
          title={t('Total depots')}
          value={stats.total_depots ?? 0}
          variant="blue"
          icon={Warehouse}
          href={paths.depots.index}
        />
        <DashboardMetricCard
          title={t('Active depots')}
          value={stats.active_depots ?? 0}
          variant="green"
          icon={Warehouse}
        />
        <DashboardMetricCard
          title={t('Products tracked')}
          value={stats.products_tracked ?? 0}
          variant="teal"
          icon={Package}
          href={paths.inventory.products}
        />
        <DashboardMetricCard
          title={t('Pending transfers')}
          value={stats.pending_transfers ?? 0}
          variant="orange"
          icon={ArrowLeftRight}
          href={paths.transfers.index}
        />
        <DashboardMetricCard
          title={t('Posted transfers')}
          value={stats.posted_transfers ?? 0}
          variant="purple"
          href={paths.transfers.index}
        />
        <DashboardMetricCard
          title={t('Total stock quantity')}
          value={stats.total_stock_quantity ?? 0}
          variant="slate"
          href={paths.inventory.stock}
        />
      </div>

      <DashboardQuickLinks
        links={[
          { label: t('Depots'), href: paths.depots.index },
          { label: t('Transfers'), href: paths.transfers.index },
          { label: t('Stock levels'), href: paths.inventory.stock },
          { label: t('Products'), href: paths.inventory.products },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Low stock alerts')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.low_stock.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('No low stock items.')}</p>
          ) : (
            <ul className="divide-y text-sm">
              {data.low_stock.map((row, i) => (
                <li key={i} className="flex justify-between gap-2 py-2">
                  <span>
                    {row.product} {row.sku ? `(${row.sku})` : ''} @ {row.depot}
                  </span>
                  <span className="tabular-nums font-medium">{row.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Recent transfers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {data.recent_transfers.map((transfer) => (
              <li key={transfer.id} className="flex items-center justify-between gap-2 py-2">
                <Link to={paths.transfers.show(transfer.id)} className="font-medium text-primary hover:underline">
                  {t('Transfer #{{id}}', { id: transfer.id })}
                </Link>
                {transfer.status ? <FleetStatusBadge status={transfer.status} /> : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
