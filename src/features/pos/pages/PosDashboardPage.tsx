import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  DollarSign,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardBarChart } from '@/features/dashboard/components/DashboardBarChart'
import {
  DashboardChartLegend,
  type DashboardChartSlice,
} from '@/features/dashboard/components/DashboardChartLegend'
import { DashboardMetricCard } from '@/features/dashboard/components/DashboardMetricCard'
import { DashboardQuickLinks } from '@/features/dashboard/components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '@/features/dashboard/components/DashboardLoading'
import { useDashboardPageChrome } from '@/features/dashboard/hooks/use-dashboard-page-chrome'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { fetchPosDashboard } from '../pos-api'

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  pending: '#f59e0b',
  cancelled: '#ef4444',
}

function statusChartItems(salesByStatus: Record<string, number>): DashboardChartSlice[] {
  return Object.entries(salesByStatus).map(([status, value]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value,
    color: STATUS_COLORS[status.toLowerCase()] ?? '#64748b',
  }))
}

export function PosDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('POS Dashboard'), t('POS'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['pos', 'dashboard'],
    queryFn: fetchPosDashboard,
  })

  const statusItems = useMemo(
    () => (data ? statusChartItems(data.sales_by_status) : []),
    [data],
  )

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load POS dashboard.')} />

  const { stats } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardQuickLinks
          links={[
            { label: t('Add POS'), href: paths.pos.create },
            { label: t('POS Orders'), href: paths.pos.orders },
            { label: t('Sales report'), href: paths.pos.reportsSales },
          ]}
        />
        <Button asChild>
          <Link to={paths.pos.create}>
            <Plus className="mr-2 h-4 w-4" />
            {t('Add POS')}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Today Revenue')}
          value={formatCurrency(stats.today_sales)}
          subtitle={t('Current day revenue')}
          variant="green"
          icon={DollarSign}
        />
        <DashboardMetricCard
          title={t('Week Revenue')}
          value={formatCurrency(stats.week_sales)}
          subtitle={t('This week')}
          variant="blue"
          icon={TrendingUp}
        />
        <DashboardMetricCard
          title={t('Month Revenue')}
          value={formatCurrency(stats.month_sales)}
          subtitle={t('This month')}
          variant="purple"
          icon={DollarSign}
        />
        <DashboardMetricCard
          title={t('Total Sales')}
          value={stats.total_sales}
          subtitle={`${formatCurrency(stats.total_revenue)} ${t('revenue')}`}
          variant="blue"
          icon={ShoppingCart}
          href={paths.pos.orders}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title={t('Avg Transaction')}
          value={formatCurrency(stats.avg_transaction)}
          subtitle={`${stats.total_customers} ${t('customers')}`}
          variant="purple"
          icon={Users}
        />
        <DashboardMetricCard
          title={t('Total Products')}
          value={stats.total_products}
          variant="orange"
          icon={Package}
        />
        <DashboardMetricCard
          title={t('Low stock alerts')}
          value={stats.low_stock_products}
          subtitle={t('Depot SKUs at zero')}
          variant="red"
          icon={AlertTriangle}
        />
        <DashboardMetricCard
          title={t('Walk-in sales')}
          value={stats.walk_in_sales}
          subtitle={t('No customer on file')}
          variant="teal"
          icon={ShoppingCart}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t('Last 10 Days Sales')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardBarChart
              data={data.last_10_days_sales}
              xAxisKey="date"
              series={[{ dataKey: 'sales', color: '#3b82f6', name: t('Daily sales') }]}
              valueFormat="currency"
              height={280}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('Sales by status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChartLegend items={statusItems} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('Out of Stock Products (Depot Wise)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.out_of_stock_products.length > 0 ? (
            <div className="space-y-3">
              {data.out_of_stock_products.map((item, index) => (
                <div
                  key={`${item.product_name}-${item.depot_name}-${index}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {item.product_name} ({item.sku})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('Depot')}: {item.depot_name}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {item.stock} {t('units')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('No out of stock products')}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              {t('Top Selling Products')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_products.length > 0 ? (
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {data.top_products.map((product, index) => (
                  <div
                    key={`${product.name}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-muted/40 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.total_quantity} {t('units sold')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(product.total_revenue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('No product data')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {t('Recent Transactions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent_sales.length > 0 ? (
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {data.recent_sales.map((sale) => (
                  <Link
                    key={sale.id}
                    to={paths.pos.show(sale.id)}
                    className="flex items-center justify-between rounded-lg bg-muted/40 p-3 transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium">{sale.sale_number ?? `#${sale.id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.customer?.name ?? t('Walk-in')}
                        {sale.depot?.name ? ` · ${sale.depot.name}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(sale.total)}</p>
                      {sale.created_at ? (
                        <p className="text-xs text-muted-foreground">{formatDate(sale.created_at)}</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('No recent sales')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
