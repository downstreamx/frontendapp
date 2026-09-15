import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Boxes,
  Building2,
  FileWarning,
  GitBranch,
  Package,
  PackageOpen,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardBarChart } from '../components/DashboardBarChart'
import { DashboardChartLegend } from '../components/DashboardChartLegend'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchCompanyOverviewDashboard } from '../dashboard-api'
import { paths } from '@/lib/paths'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency } from '@/utils/helpers'

export function CompanyOverviewDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('Company Overview'), t('Overview'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchCompanyOverviewDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) {
    return <DashboardError message={t('Could not load company overview dashboard.')} />
  }

  const inventory = data.inventory_summary
  const account = data.account_summary
  const metrics = data.key_metrics

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Total products')}
          value={inventory.total_products}
          subtitle={t('{{count}} active', { count: inventory.active_products })}
          variant="blue"
          icon={Package}
          href={paths.inventory.products}
        />
        <DashboardMetricCard
          title={t('Low stock items')}
          value={inventory.low_stock_items}
          variant="red"
          icon={Boxes}
          href={paths.inventory.reorderLevels}
        />
        <DashboardMetricCard
          title={t('Total stock quantity')}
          value={inventory.total_stock_quantity}
          variant="teal"
          icon={Package}
          href={paths.inventory.stock}
        />
        <DashboardMetricCard
          title={t('Open transits')}
          value={metrics.open_transits}
          variant="orange"
          icon={Truck}
          href={paths.distribution.transit}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">{t('Monthly inventory')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <DashboardBarChart
              data={data.monthly_inventory_chart}
              xAxisKey="month"
              chartType="bar"
              connectBarTops
              height={420}
              series={[
                { dataKey: 'stock_quantity', color: '#1b703a', name: t('Stock quantity') },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">
              {t('Monthly sales volume by product')}
              {data.sales_volume_month ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({data.sales_volume_month})
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <DashboardChartLegend
              items={data.monthly_sales_by_product}
              height={320}
              innerRadius={72}
              outerRadius={108}
              showSliceLabels
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Total Customers')}
          value={account.total_clients}
          subtitle={t('Active Customers')}
          variant="orange"
          icon={UserCheck}
          href={paths.account.customers}
        />
        <DashboardMetricCard
          title={t('Total Suppliers')}
          value={account.total_suppliers}
          variant="teal"
          icon={Building2}
          href={paths.account.suppliers}
        />
        <DashboardMetricCard
          title={t('Total Revenue')}
          value={formatCurrency(account.total_revenue)}
          variant="green"
          icon={TrendingUp}
        />
        <DashboardMetricCard
          title={t('Net Profit')}
          value={formatCurrency(account.net_profit)}
          variant="blue"
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <DashboardMetricCard
          title={t('Pending bridging')}
          value={metrics.pending_bridging_approvals}
          variant="orange"
          icon={GitBranch}
          href={paths.bridging.index}
        />
        <DashboardMetricCard
          title={t('Undistributed qty')}
          value={metrics.undistributed_qty}
          variant="purple"
          icon={PackageOpen}
          href={paths.sales.undistributed}
        />
        <DashboardMetricCard
          title={t('Unbridged purchase qty')}
          value={metrics.unbridged_purchase_qty}
          variant="red"
          icon={ShoppingCart}
          href={paths.purchase.unbridged}
        />
        <DashboardMetricCard
          title={t('Overdue invoices')}
          value={metrics.overdue_invoices}
          variant="red"
          icon={FileWarning}
          href={paths.sales.invoices}
        />
        <DashboardMetricCard
          title={t('Trucks out today')}
          value={metrics.trucks_out_today}
          variant="teal"
          icon={Truck}
          href={paths.reports.operational('trucks-out-today')}
        />
        <DashboardMetricCard
          title={t('Total Expense')}
          value={formatCurrency(account.total_expense)}
          variant="slate"
          icon={TrendingDown}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Pending actions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.pending_actions.map((action) => (
              <li key={action.key}>
                <Link
                  to={action.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white p-3 transition-colors hover:bg-[#fff3e0]/70"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {t(action.label)}
                  </span>
                  <Badge variant={action.count > 0 ? 'destructive' : 'secondary'}>
                    {action.count}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <DashboardQuickLinks
        title={t('Quick actions')}
        links={data.quick_actions.map((link) => ({ ...link, label: t(link.label) }))}
      />

      {data.low_stock.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Low stock')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.low_stock.slice(0, 8).map((row, index) => (
                <li
                  key={`${row.product}-${row.depot}-${index}`}
                  className="flex justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <span>
                    {row.product}
                    {row.depot ? ` · ${row.depot}` : ''}
                    {row.sku ? ` (${row.sku})` : ''}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatQuantity(row.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
