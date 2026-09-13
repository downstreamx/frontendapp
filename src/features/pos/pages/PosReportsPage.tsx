import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { paths } from '@/lib/paths'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { DashboardBarChart } from '@/features/dashboard/components/DashboardBarChart'
import { formatCurrency } from '@/utils/helpers'
import {
  PosReportSummaryCards,
  usePosCustomerSummaryCards,
  usePosProductSummaryCards,
} from '../components/PosReportSummaryCards'
import {
  fetchPosCustomerReport,
  fetchPosProductReport,
  fetchPosSalesReport,
  type PosCustomerReportRow,
  type PosProductReportRow,
} from '../pos-api'

const CHART_COLORS = {
  sales: '#6366f1',
  revenue: '#10b981',
  spent: '#f59e0b',
}

function truncateLabel(value: string, max = 12): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

type ReportTab = 'sales' | 'products' | 'customers'

function reportTabFromPath(pathname: string): ReportTab {
  if (pathname.startsWith(paths.pos.reportsProducts)) return 'products'
  if (pathname.startsWith(paths.pos.reportsCustomers)) return 'customers'
  return 'sales'
}

function reportPathForTab(tab: ReportTab): string {
  if (tab === 'products') return paths.pos.reportsProducts
  if (tab === 'customers') return paths.pos.reportsCustomers
  return paths.pos.reportsSales
}

const REPORT_PAGE_TITLES: Record<ReportTab, string> = {
  sales: 'Sales Report',
  products: 'Product Report',
  customers: 'Customer Report',
}

export function PosReportsPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()
  const tab = reportTabFromPath(location.pathname)
  const [salesChartTab, setSalesChartTab] = useState('daily')

  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-pos-reports',
  )

  const handleTabChange = (value: string) => {
    const next = value as ReportTab
    navigate(reportPathForTab(next))
  }

  const pageTitle = t(REPORT_PAGE_TITLES[tab])

  usePageChrome({
    pageTitle,
    breadcrumbs: [
      { label: t('POS'), url: paths.pos.index },
      { label: t('Reports'), url: paths.pos.reportsSales },
      { label: pageTitle },
    ],
  })

  if (!canView) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('You do not have permission to view POS reports.')}
      </p>
    )
  }

  const salesQuery = useQuery({
    queryKey: ['pos', 'reports', 'sales'],
    queryFn: fetchPosSalesReport,
    enabled: tab === 'sales',
  })

  const productsQuery = useQuery({
    queryKey: ['pos', 'reports', 'products'],
    queryFn: fetchPosProductReport,
    enabled: tab === 'products',
  })

  const customersQuery = useQuery({
    queryKey: ['pos', 'reports', 'customers'],
    queryFn: fetchPosCustomerReport,
    enabled: tab === 'customers',
  })

  const productRows = productsQuery.data ?? []
  const customerRows = customersQuery.data ?? []
  const productSummaryCards = usePosProductSummaryCards(productRows)
  const customerSummaryCards = usePosCustomerSummaryCards(customerRows)

  const salesKpis = useMemo(() => {
    const daily = salesQuery.data?.daily_sales ?? []
    const totalSales = daily.reduce((sum, d) => sum + Number(d.sales ?? 0), 0)
    const totalOrders = daily.reduce((sum, d) => sum + Number(d.count ?? 0), 0)
    return {
      totalSales,
      totalOrders,
      avgDaily: daily.length > 0 ? totalSales / daily.length : 0,
    }
  }, [salesQuery.data?.daily_sales])

  const productChartData = useMemo(
    () =>
      productRows.slice(0, 10).map((row) => ({
        label: truncateLabel(row.name),
        revenue: Number(row.total_revenue ?? 0),
      })),
    [productRows],
  )

  const customerChartData = useMemo(
    () =>
      customerRows.slice(0, 10).map((row) => ({
        label: truncateLabel(row.name),
        spent: Number(row.total_spent ?? 0),
      })),
    [customerRows],
  )

  const productColumns: Column<PosProductReportRow>[] = [
    { key: 'name', header: t('Product') },
    { key: 'sku', header: t('SKU') },
    { key: 'total_quantity', header: t('Qty'), className: 'text-right' },
    {
      key: 'total_revenue',
      header: t('Revenue'),
      className: 'text-right',
      render: (_, row) => formatCurrency(row.total_revenue),
    },
    { key: 'total_orders', header: t('Orders'), className: 'text-right' },
  ]

  const customerColumns: Column<PosCustomerReportRow>[] = [
    { key: 'name', header: t('Customer') },
    {
      key: 'total_spent',
      header: t('Total spent'),
      className: 'text-right',
      render: (_, row) => formatCurrency(row.total_spent),
    },
    { key: 'order_count', header: t('Orders'), className: 'text-right' },
    {
      key: 'average_order',
      header: t('Avg order'),
      className: 'text-right',
      render: (_, row) => formatCurrency(row.average_order),
    },
  ]

  const sales = salesQuery.data

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList className="grid w-full max-w-xl grid-cols-3">
        <TabsTrigger value="sales">{t('Sales Report')}</TabsTrigger>
        <TabsTrigger value="products">{t('Product Report')}</TabsTrigger>
        <TabsTrigger value="customers">{t('Customer Report')}</TabsTrigger>
      </TabsList>

      <TabsContent value="sales" className="space-y-6 pt-4">
        {salesQuery.isLoading ? <p className="text-sm text-muted-foreground">{t('Loading…')}</p> : null}
        {salesQuery.isError ? (
          <p className="text-sm text-destructive">{t('Could not load sales report.')}</p>
        ) : null}
        {sales ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t('7-day sales')}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{formatCurrency(salesKpis.totalSales)}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t('7-day orders')}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{salesKpis.totalOrders}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t('Avg daily sales')}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{formatCurrency(salesKpis.avgDaily)}</CardContent>
              </Card>
            </div>

            <Tabs value={salesChartTab} onValueChange={setSalesChartTab}>
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="daily">{t('Daily')}</TabsTrigger>
                <TabsTrigger value="monthly">{t('Monthly')}</TabsTrigger>
                <TabsTrigger value="depot">{t('By depot')}</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Daily sales performance')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardBarChart
                      data={(sales.daily_sales ?? []).map((d) => ({
                        date: d.date,
                        sales: Number(d.sales ?? 0),
                      }))}
                      series={[{ dataKey: 'sales', color: CHART_COLORS.sales, name: t('Sales') }]}
                      xAxisKey="date"
                      valueFormat="currency"
                      height={280}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Monthly sales performance')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardBarChart
                      data={(sales.monthly_sales ?? []).map((m) => ({
                        month: m.month,
                        sales: Number(m.sales ?? 0),
                      }))}
                      series={[{ dataKey: 'sales', color: CHART_COLORS.revenue, name: t('Sales') }]}
                      xAxisKey="month"
                      valueFormat="currency"
                      height={280}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="depot" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Depot sales comparison')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardBarChart
                      data={(sales.depot_sales ?? []).map((d) => ({
                        name: truncateLabel(d.name, 10),
                        sales: Number(d.sales ?? 0),
                      }))}
                      series={[{ dataKey: 'sales', color: CHART_COLORS.spent, name: t('Sales') }]}
                      xAxisKey="name"
                      chartType="bar"
                      valueFormat="currency"
                      height={280}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>{t('Recent POS sales')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(sales.sales?.data ?? []).length === 0 ? (
                  <p className="text-muted-foreground">{t('No POS sales yet.')}</p>
                ) : (
                  (sales.sales?.data ?? []).map((row) => (
                    <div key={row.id} className="flex justify-between border-b py-2">
                      <Link
                        to={paths.pos.show(row.id)}
                        className="text-primary hover:underline"
                      >
                        {row.sale_number} · {row.customer?.name ?? t('Walk-in')}
                        {row.depot?.name ? ` · ${row.depot.name}` : ''}
                      </Link>
                      <span>{formatCurrency(Number(row.items_total ?? 0))}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </TabsContent>

      <TabsContent value="products" className="space-y-6 pt-4">
        {productsQuery.isLoading ? <p className="text-sm text-muted-foreground">{t('Loading…')}</p> : null}
        {productsQuery.isError ? (
          <p className="text-sm text-destructive">{t('Could not load product report.')}</p>
        ) : null}
        {!productsQuery.isLoading && productRows.length > 0 ? (
          <>
            <PosReportSummaryCards cards={productSummaryCards} />
            <Card>
              <CardHeader>
                <CardTitle>{t('Top products by revenue')}</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardBarChart
                  data={productChartData}
                  series={[{ dataKey: 'revenue', color: CHART_COLORS.revenue, name: t('Revenue') }]}
                  xAxisKey="label"
                  chartType="bar"
                  valueFormat="currency"
                  height={280}
                />
              </CardContent>
            </Card>
          </>
        ) : !productsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('No product sales data yet.')}</p>
        ) : null}
        {productRows.length > 0 ? <DataTable columns={productColumns} data={productRows} /> : null}
      </TabsContent>

      <TabsContent value="customers" className="space-y-6 pt-4">
        {customersQuery.isLoading ? <p className="text-sm text-muted-foreground">{t('Loading…')}</p> : null}
        {customersQuery.isError ? (
          <p className="text-sm text-destructive">{t('Could not load customer report.')}</p>
        ) : null}
        {!customersQuery.isLoading && customerRows.length > 0 ? (
          <>
            <PosReportSummaryCards cards={customerSummaryCards} />
            <Card>
              <CardHeader>
                <CardTitle>{t('Top customers by spend')}</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardBarChart
                  data={customerChartData}
                  series={[{ dataKey: 'spent', color: CHART_COLORS.spent, name: t('Total spent') }]}
                  xAxisKey="label"
                  chartType="bar"
                  valueFormat="currency"
                  height={280}
                />
              </CardContent>
            </Card>
          </>
        ) : !customersQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('No customer sales data yet.')}</p>
        ) : null}
        {customerRows.length > 0 ? (
          <DataTable columns={customerColumns} data={customerRows} />
        ) : null}
      </TabsContent>
    </Tabs>
  )
}
