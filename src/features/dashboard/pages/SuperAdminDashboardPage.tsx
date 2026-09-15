import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Building2,
  CreditCard,
  Crown,
  LogIn,
  ShoppingCart,
  Timer,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { paths } from '@/lib/paths'
import { formatCurrency } from '@/utils/helpers'
import { DashboardBarChart } from '../components/DashboardBarChart'
import { DashboardChartLegend } from '../components/DashboardChartLegend'
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

  const { stats, engagement } = data
  const engagementStats = engagement.stats

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Total Companies')}
          value={stats.total_companies}
          subtitle={t('Registered companies')}
          variant="orange"
          icon={Building2}
          href={paths.users.index}
        />
        <DashboardMetricCard
          title={t('Total Subscription Orders')}
          value={stats.total_orders}
          subtitle={t('All subscription orders')}
          variant="green"
          icon={ShoppingCart}
          href={paths.orders}
        />
        <DashboardMetricCard
          title={t('Subscription Payments')}
          value={formatCurrency(stats.order_payments)}
          subtitle={t('Total subscription payments')}
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
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('Company engagement')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('Subscription health, growth, and platform activity across companies.')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            title={t('Active subscriptions')}
            value={engagementStats.active_subscriptions}
            subtitle={t('{{count}} inactive', { count: engagementStats.inactive_subscriptions })}
            variant="green"
            icon={Activity}
            href={paths.users.index}
          />
          <DashboardMetricCard
            title={t('On trial')}
            value={engagementStats.trial_companies}
            subtitle={t('{{count}} expiring within 30 days', { count: engagementStats.expiring_soon })}
            variant="teal"
            icon={Timer}
          />
          <DashboardMetricCard
            title={t('New this month')}
            value={engagementStats.new_companies_this_month}
            subtitle={t('Company registrations')}
            variant="blue"
            icon={UserPlus}
            href={paths.users.index}
          />
          <DashboardMetricCard
            title={t('Logged in this month')}
            value={engagementStats.logged_in_this_month}
            subtitle={t('{{count}} companies with orders', {
              count: engagementStats.companies_with_orders,
            })}
            variant="orange"
            icon={LogIn}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{t('Subscription status')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <DashboardChartLegend
                items={engagement.subscription_status}
                height={240}
                innerRadius={64}
                outerRadius={96}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{t('Companies by plan')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <DashboardChartLegend
                items={engagement.plan_distribution}
                height={240}
                innerRadius={64}
                outerRadius={96}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{t('Company registrations (Monthly)')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <DashboardBarChart
                data={engagement.company_registrations}
                xAxisKey="month"
                chartType="bar"
                height={280}
                series={[
                  { dataKey: 'companies', color: '#1b703a', name: t('Companies') },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{t('Company logins (Monthly)')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <DashboardBarChart
                data={engagement.company_logins}
                xAxisKey="month"
                chartType="area"
                height={280}
                series={[{ dataKey: 'logins', color: '#0ea5e9', name: t('Logins') }]}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Recent Subscription Orders (Monthly)')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardBarChart
            data={data.chart_data}
            xAxisKey="month"
            series={[
              { dataKey: 'orders', color: '#1b703a', name: t('Orders') },
              { dataKey: 'payments', color: '#f08c00', name: t('Payments') },
            ]}
            height={300}
            showLegend
          />
        </CardContent>
      </Card>
    </div>
  )
}
