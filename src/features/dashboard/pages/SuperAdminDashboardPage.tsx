import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Building2, CreditCard, Crown, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { paths } from '@/lib/paths'
import { formatCurrency } from '@/utils/helpers'
import { DashboardBarChart } from '../components/DashboardBarChart'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchSuperAdminDashboard } from '../dashboard-api'

export function SuperAdminDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('Dashboard'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'platform'],
    queryFn: fetchSuperAdminDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) {
    return <DashboardError message={t('Could not load dashboard.')} />
  }

  const { stats } = data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Total Orders')}
          value={stats.total_orders}
          subtitle={t('All orders')}
          variant="green"
          icon={ShoppingCart}
          href={paths.orders}
        />
        <DashboardMetricCard
          title={t('Order Payments')}
          value={formatCurrency(stats.order_payments)}
          subtitle={t('Total payments')}
          variant="blue"
          icon={CreditCard}
        />
        <DashboardMetricCard
          title={t('Total Plans')}
          value={stats.total_plans}
          subtitle={t('Available plans')}
          variant="purple"
          icon={Crown}
          href={paths.plans}
        />
        <DashboardMetricCard
          title={t('Total Companies')}
          value={stats.total_companies}
          subtitle={t('Registered companies')}
          variant="orange"
          icon={Building2}
          href={paths.users.index}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Recent Orders (Monthly)')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardBarChart
            data={data.chart_data}
            xAxisKey="month"
            series={[
              { dataKey: 'orders', color: '#3b82f6', name: t('Orders') },
              { dataKey: 'payments', color: '#10b981', name: t('Payments') },
            ]}
            height={300}
            showLegend
          />
        </CardContent>
      </Card>
    </div>
  )
}
