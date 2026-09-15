import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAccountPageChrome } from '@/features/account/hooks/use-account-page-chrome'
import { DashboardBarChart } from '../components/DashboardBarChart'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { fetchAccountDashboard } from '../dashboard-api'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'

const quickLinks = [
  { label: 'Bank accounts', href: '/account/bank-accounts' },
  { label: 'Customer payments', href: paths.account.customerPayments.index },
  { label: 'Supplier payments', href: paths.account.supplierPayments.index },
  { label: 'Revenues', href: '/account/revenues' },
  { label: 'Expenses', href: '/account/expenses' },
  { label: 'Reports', href: paths.account.reports },
]

export function AccountDashboardPage() {
  const { t } = useTranslation()
  useAccountPageChrome(t('Account Dashboard'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'account'],
    queryFn: fetchAccountDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load account dashboard.')} />

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Total Customers')}
          value={data.stats.total_clients}
          subtitle={t('Active Customers')}
          variant="orange"
          icon={UserCheck}
          href={paths.account.customers}
        />
        <DashboardMetricCard
          title={t('Total Suppliers')}
          value={data.stats.total_suppliers}
          subtitle={t('Active suppliers')}
          variant="teal"
          icon={Building2}
          href={paths.account.suppliers}
        />
        <DashboardMetricCard
          title={t('Total Customer Payment')}
          value={formatCurrency(data.stats.total_customer_payment)}
          subtitle={t('Received payments')}
          variant="green"
          icon={ArrowDownCircle}
          href={paths.account.customerPayments.index}
        />
        <DashboardMetricCard
          title={t('Total Supplier Payment')}
          value={formatCurrency(data.stats.total_supplier_payment)}
          subtitle={t('Paid to suppliers')}
          variant="red"
          icon={ArrowUpCircle}
          href={paths.account.supplierPayments.index}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardMetricCard
          title={t('Total Revenue')}
          value={formatCurrency(data.stats.total_revenue)}
          variant="green"
          icon={TrendingUp}
        />
        <DashboardMetricCard
          title={t('Total Expense')}
          value={formatCurrency(data.stats.total_expense)}
          variant="red"
          icon={TrendingDown}
        />
        <DashboardMetricCard
          title={t('Net Profit')}
          value={formatCurrency(data.stats.net_profit)}
          variant="blue"
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Monthly Customer Payments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardBarChart
              data={data.monthly_customer_payments}
              xAxisKey="month"
              series={[
                { dataKey: 'customer_payments', color: '#10b981', name: t('Customer payments') },
              ]}
              valueFormat="currency"
              height={300}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Monthly Supplier Payments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardBarChart
              data={data.monthly_supplier_payments}
              xAxisKey="month"
              series={[
                { dataKey: 'supplier_payments', color: '#ef4444', name: t('Supplier payments') },
              ]}
              valueFormat="currency"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      <DashboardQuickLinks links={quickLinks.map((l) => ({ ...l, label: t(l.label) }))} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Recent revenues')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {data.recent_revenues.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{row.title}</p>
                    {row.description ? (
                      <p className="text-xs text-muted-foreground">{row.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{formatDate(row.date)}</p>
                  </div>
                  <span className="font-semibold text-emerald-600 tabular-nums">
                    {formatCurrency(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Recent expenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {data.recent_expenses.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{row.title}</p>
                    {row.description ? (
                      <p className="text-xs text-muted-foreground">{row.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{formatDate(row.date)}</p>
                  </div>
                  <span className="font-semibold text-rose-600 tabular-nums">
                    {formatCurrency(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
