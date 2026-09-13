import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ArrowLeftRight,
  ClipboardList,
  Package,
  Scale,
  Truck,
  Warehouse,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { DashboardBarChart } from '../components/DashboardBarChart'
import { DashboardChartLegend } from '../components/DashboardChartLegend'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchDistributionDashboard, type DistributionActivityRow } from '../dashboard-api'
import { paths } from '@/lib/paths'

function ActivityList({
  rows,
  linkForRow,
  emptyMessage,
}: {
  rows: DistributionActivityRow[]
  linkForRow: (row: DistributionActivityRow) => string
  emptyMessage: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="divide-y text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-2 py-2">
          <Link to={linkForRow(row)} className="font-medium text-primary hover:underline">
            {row.label}
          </Link>
          <div className="flex items-center gap-2">
            {row.quantity > 0 ? (
              <span className="tabular-nums text-muted-foreground">{row.quantity}</span>
            ) : null}
            {row.status ? <FleetStatusBadge status={row.status} /> : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function DistributionDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('Distribution Dashboard'), t('Distribution'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'distribution'],
    queryFn: fetchDistributionDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) {
    return <DashboardError message={t('Could not load distribution dashboard.')} />
  }

  const stats = data.stats

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardMetricCard
          title={t('Loading scheduled')}
          value={stats.loading_scheduled ?? 0}
          variant="blue"
          icon={ClipboardList}
          href={paths.distribution.loadingSchedules}
        />
        <DashboardMetricCard
          title={t('Loading in progress')}
          value={stats.loading_in_progress ?? 0}
          variant="teal"
          icon={Warehouse}
        />
        <DashboardMetricCard
          title={t('Transits active')}
          value={stats.transits_active ?? 0}
          variant="orange"
          icon={Truck}
          href={paths.distribution.transit}
        />
        <DashboardMetricCard
          title={t('Deliveries pending')}
          value={stats.deliveries_pending ?? 0}
          variant="purple"
          icon={Package}
          href={paths.distribution.deliverySchedules}
        />
        <DashboardMetricCard
          title={t('Open shortages')}
          value={stats.open_shortages ?? 0}
          variant="red"
          icon={AlertTriangle}
          href={paths.distribution.shortages}
        />
        <DashboardMetricCard
          title={t('Open overages')}
          value={stats.open_overages ?? 0}
          variant="orange"
          icon={Scale}
          href={paths.distribution.overages}
        />
        <DashboardMetricCard
          title={t('Posted inventory movements')}
          value={stats.inventory_movements_posted ?? 0}
          variant="slate"
          icon={ArrowLeftRight}
          href={paths.distribution.inventoryMovements}
        />
      </div>

      <DashboardQuickLinks
        links={[
          { label: t('Loading schedules'), href: paths.distribution.loadingSchedules },
          { label: t('Transits'), href: paths.distribution.transit },
          { label: t('Delivery schedules'), href: paths.distribution.deliverySchedules },
          { label: t('Shortages'), href: paths.distribution.shortages },
          { label: t('Overages'), href: paths.distribution.overages },
          { label: t('Inventory movements'), href: paths.distribution.inventoryMovements },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Monthly transit activity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardBarChart
              data={data.monthly_transits}
              xAxisKey="month"
              series={[
                { dataKey: 'departed', color: '#3b82f6', name: t('Departed') },
                { dataKey: 'completed', color: '#10b981', name: t('Completed') },
              ]}
              height={300}
              showLegend
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Transit status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChartLegend items={data.transit_status} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Recent transits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList
              rows={data.recent_transits}
              linkForRow={(row) => paths.distribution.transitShow(row.id)}
              emptyMessage={t('No recent transits.')}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Recent loading schedules')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList
              rows={data.recent_loading_schedules}
              linkForRow={(row) => paths.distribution.loadingScheduleShow(row.id)}
              emptyMessage={t('No loading schedules.')}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Open shortages')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList
              rows={data.recent_shortages}
              linkForRow={(row) => paths.distribution.shortageShow(row.id)}
              emptyMessage={t('No open shortages.')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
