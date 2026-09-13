import { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { DateRangeReportForm } from '@/features/double-entry/components/DateRangeReportForm'
import { defaultReportDateRange } from '@/features/double-entry/utils/default-date-range'
import { DashboardError, DashboardLoading } from '@/features/dashboard/components/DashboardLoading'
import {
  fetchOperationalReport,
  type BankBalancesEodReport,
  type BridgingReportResponse,
  type BridgingReportRow,
  type GoodsInTransitReport,
  type GoodsInTransitRow,
  type OperationalReportData,
  type PurchaseBridgingReportResponse,
  type PurchaseBridgingReportRow,
  type StockBalancesReport,
  type TrucksOutTodayReport,
  type TrucksOutTodayRow,
} from '../reports-api'
import {
  isOperationalReportKey,
  OPERATIONAL_REPORT_KEYS,
  OPERATIONAL_REPORT_META,
  type OperationalReportKey,
} from '../operational-reports-config'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function ReportNav({ activeKey }: { activeKey: OperationalReportKey }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap gap-2 border-b pb-4">
      {OPERATIONAL_REPORT_KEYS.map((key) => (
        <Link
          key={key}
          to={paths.reports.operational(key)}
          className={
            key === activeKey
              ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
              : 'rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/80'
          }
        >
          {t(OPERATIONAL_REPORT_META[key].titleKey)}
        </Link>
      ))}
    </div>
  )
}

function SummaryCards({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-sm font-bold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function BridgingReportView({
  rows,
  meta,
  onPageChange,
  invoicePathPrefix,
}: {
  rows: BridgingReportRow[]
  meta?: { current_page: number; last_page: number; total: number }
  onPageChange: (page: number) => void
  invoicePathPrefix: string
}) {
  const { t } = useTranslation()
  const columns: Column<BridgingReportRow>[] = [
    {
      key: 'invoice_number',
      header: t('Invoice #'),
      render: (value, row) => (
        <Link
          to={`${invoicePathPrefix}/${row.invoice_id}`}
          className="text-primary hover:underline"
        >
          {String(value)}
        </Link>
      ),
    },
    {
      key: 'invoice_date',
      header: t('Date'),
      render: (value) => (value ? formatDate(String(value)) : '—'),
    },
    { key: 'customer_name', header: t('Customer') },
    {
      key: 'total_amount',
      header: t('Amount'),
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    { key: 'load_count', header: t('Loads') },
    { key: 'total_loaded_qty', header: t('Loaded qty') },
    { key: 'status', header: t('Status') },
  ]

  return (
    <div className="space-y-4">
      <DataTable embedded data={rows} columns={columns} searchable />
      {meta && meta.last_page > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('Page {{current}} of {{last}}', {
              current: meta.current_page,
              last: meta.last_page,
            })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => onPageChange(meta.current_page - 1)}
            >
              {t('Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => onPageChange(meta.current_page + 1)}
            >
              {t('Next')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PurchaseBridgingReportView({
  rows,
  meta,
  onPageChange,
}: {
  rows: PurchaseBridgingReportRow[]
  meta?: { current_page: number; last_page: number; total: number }
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  const columns: Column<PurchaseBridgingReportRow>[] = [
    {
      key: 'invoice_number',
      header: t('Invoice #'),
      render: (value, row) => (
        <Link
          to={`${paths.purchase.invoices}/${row.invoice_id}`}
          className="text-primary hover:underline"
        >
          {String(value)}
        </Link>
      ),
    },
    {
      key: 'invoice_date',
      header: t('Date'),
      render: (value) => (value ? formatDate(String(value)) : '—'),
    },
    { key: 'supplier_name', header: t('Supplier') },
    {
      key: 'total_amount',
      header: t('Amount'),
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    { key: 'load_count', header: t('Loads') },
    { key: 'total_loaded_qty', header: t('Loaded qty') },
    { key: 'total_delivered_qty', header: t('Delivered qty') },
    { key: 'status', header: t('Status') },
  ]

  return (
    <div className="space-y-4">
      <DataTable embedded data={rows} columns={columns} searchable />
      {meta && meta.last_page > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('Page {{current}} of {{last}}', {
              current: meta.current_page,
              last: meta.last_page,
            })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => onPageChange(meta.current_page - 1)}
            >
              {t('Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => onPageChange(meta.current_page + 1)}
            >
              {t('Next')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StockBalancesReportView({ data }: { data: StockBalancesReport }) {
  const { t } = useTranslation()

  const customerColumns: Column<StockBalancesReport['customer_stock_balances'][number]>[] = [
    { key: 'customer_name', header: t('Customer') },
    { key: 'product_name', header: t('Product') },
    { key: 'sku', header: t('SKU') },
    { key: 'depot_name', header: t('Depot') },
    {
      key: 'invoice_number',
      header: t('Invoice'),
      render: (value, row) =>
        row.sales_invoice_id ? (
          <Link
            to={`${paths.sales.invoices}/${row.sales_invoice_id}`}
            className="text-primary hover:underline"
          >
            {String(value ?? row.sales_invoice_id)}
          </Link>
        ) : (
          String(value ?? '—')
        ),
    },
    { key: 'paid_qty', header: t('Paid qty') },
    { key: 'distributed_qty', header: t('Distributed qty') },
    { key: 'balance_qty', header: t('Balance qty') },
  ]

  const supplierColumns: Column<NonNullable<StockBalancesReport['supplier_stock_balances']>[number]>[] =
    [
      { key: 'product_name', header: t('Product') },
      { key: 'sku', header: t('SKU') },
      { key: 'depot_name', header: t('Depot') },
      {
        key: 'invoice_number',
        header: t('Invoice'),
        render: (value, row) =>
          row.purchase_invoice_id ? (
            <Link
              to={`${paths.purchase.invoices}/${row.purchase_invoice_id}`}
              className="text-primary hover:underline"
            >
              {String(value ?? row.purchase_invoice_id)}
            </Link>
          ) : (
            String(value ?? '—')
          ),
      },
      { key: 'paid_qty', header: t('Paid qty') },
      { key: 'bridged_qty', header: t('Bridged qty') },
      { key: 'balance_qty', header: t('Balance qty') },
    ]

  const depotColumns: Column<StockBalancesReport['depot_stock_balances'][number]>[] = [
    { key: 'depot_name', header: t('Depot') },
    { key: 'product_name', header: t('Product') },
    { key: 'sku', header: t('SKU') },
    { key: 'quantity', header: t('Quantity') },
    {
      key: 'inventory_value',
      header: t('Value'),
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
  ]

  const stageColumns: Column<NonNullable<StockBalancesReport['inventory_by_stage']>[number]>[] = [
    { key: 'product_name', header: t('Product') },
    { key: 'sku', header: t('SKU') },
    { key: 'bridged_qty', header: t('Bridged qty') },
    { key: 'distributed_qty', header: t('Distributed qty') },
  ]

  return (
    <div className="space-y-6">
      <SummaryCards
        items={[
          {
            label: t('Customer balance qty'),
            value: data.summary.customer_balance_qty_total,
          },
          { label: t('Depot quantity'), value: data.summary.depot_quantity_total },
          {
            label: t('Depot inventory value'),
            value: formatCurrency(data.summary.depot_inventory_value_total),
          },
        ]}
      />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t('Customer stock balances')}</h3>
        <DataTable embedded data={data.customer_stock_balances} columns={customerColumns} searchable />
      </div>
      {(data.supplier_stock_balances?.length ?? 0) > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t('Supplier bridging balances')}</h3>
          <DataTable
            embedded
            data={data.supplier_stock_balances ?? []}
            columns={supplierColumns}
            searchable
          />
        </div>
      ) : null}
      {(data.inventory_by_stage?.length ?? 0) > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t('Inventory by stage')}</h3>
          <DataTable
            embedded
            data={data.inventory_by_stage ?? []}
            columns={stageColumns}
            searchable
          />
        </div>
      ) : null}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t('Depot stock balances')}</h3>
        <DataTable embedded data={data.depot_stock_balances} columns={depotColumns} searchable />
      </div>
    </div>
  )
}

function GoodsInTransitReportView({
  rows,
  summary,
}: {
  rows: GoodsInTransitRow[]
  summary: { open_count: number; open_quantity: number }
}) {
  const { t } = useTranslation()
  const columns: Column<GoodsInTransitRow>[] = [
    { key: 'type', header: t('Type') },
    {
      key: 'reference',
      header: t('Reference'),
      render: (value, row) =>
        row.type === 'truck_load' ? (
          <span className="inline-flex flex-col gap-0.5">
            <Link
              to={paths.bridging.truckLoadShow(row.id)}
              className="text-primary hover:underline"
            >
              {String(value)}
            </Link>
            <Link
              to={paths.distribution.informationWithTruckLoad(row.id)}
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              {t('Distribution trail')}
            </Link>
          </span>
        ) : (
          String(value)
        ),
    },
    { key: 'status', header: t('Status') },
    { key: 'quantity', header: t('Quantity') },
    { key: 'truck', header: t('Truck') },
    { key: 'from', header: t('From') },
    { key: 'to', header: t('To') },
    {
      key: 'departed_at',
      header: t('Departed'),
      render: (value) => (value ? formatDate(String(value)) : '—'),
    },
  ]

  return (
    <div className="space-y-4">
      <SummaryCards
        items={[
          { label: t('Open count'), value: summary.open_count },
          { label: t('Open quantity'), value: summary.open_quantity },
        ]}
      />
      <DataTable embedded data={rows} columns={columns} searchable />
    </div>
  )
}

function TrucksOutTodayReportView({
  rows,
  summary,
  date,
}: {
  rows: TrucksOutTodayRow[]
  summary: { truck_count: number; total_quantity: number }
  date: string
}) {
  const { t } = useTranslation()
  const columns: Column<TrucksOutTodayRow>[] = [
    { key: 'source', header: t('Source') },
    { key: 'truck', header: t('Truck') },
    { key: 'product', header: t('Product') },
    { key: 'customer', header: t('Customer') },
    { key: 'depot', header: t('Depot') },
    { key: 'quantity', header: t('Quantity') },
    { key: 'destination', header: t('Destination') },
    { key: 'status', header: t('Status') },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('Report date')}: {formatDate(date)}
      </p>
      <SummaryCards
        items={[
          { label: t('Trucks'), value: summary.truck_count },
          { label: t('Total quantity'), value: summary.total_quantity },
        ]}
      />
      <DataTable embedded data={rows} columns={columns} searchable />
    </div>
  )
}

function BankBalancesEodReportView({ data }: { data: BankBalancesEodReport }) {
  const { t } = useTranslation()
  const columns: Column<BankBalancesEodReport['accounts'][number]>[] = [
    { key: 'bank_name', header: t('Bank') },
    { key: 'account_name', header: t('Account') },
    { key: 'account_number', header: t('Account #') },
    {
      key: 'balance',
      header: t('Balance'),
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      key: 'opening_balance',
      header: t('Opening'),
      render: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      key: 'is_active',
      header: t('Active'),
      render: (value) => (value ? t('Yes') : t('No')),
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('As of')}: {formatDate(data.as_of_date)}
      </p>
      <SummaryCards
        items={[
          { label: t('Total balance'), value: formatCurrency(data.summary.total_balance) },
          { label: t('Active accounts'), value: data.summary.active_accounts },
        ]}
      />
      <DataTable embedded data={data.accounts} columns={columns} searchable />
    </div>
  )
}

export function OperationalReportPage() {
  const { t } = useTranslation()
  const { reportKey } = useParams<{ reportKey: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const defaults = defaultReportDateRange()

  if (!isOperationalReportKey(reportKey)) {
    return <Navigate to={paths.reports.operational('sales-distribution')} replace />
  }

  const meta = OPERATIONAL_REPORT_META[reportKey]
  const pageTitle = t(meta.titleKey)

  usePageChrome({
    pageTitle,
    breadcrumbs: [
      { label: t('Reports and Analytics'), url: paths.reports.analytics },
      { label: pageTitle },
    ],
  })

  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? defaults.from)
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? defaults.to)
  const [reportDate, setReportDate] = useState(searchParams.get('date') ?? todayIso())
  const [asOfDate, setAsOfDate] = useState(searchParams.get('as_of_date') ?? todayIso())

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (meta.hasDateRange) {
      params.date_from = dateFrom
      params.date_to = dateTo
    }
    if (meta.hasReportDate) {
      params.date = reportDate
    }
    if (meta.hasAsOfDate) {
      params.as_of_date = asOfDate
    }
    if (
      reportKey === 'bridging' ||
      reportKey === 'sales-distribution' ||
      reportKey === 'purchase-bridging'
    ) {
      const page = searchParams.get('page')
      if (page) params.page = page
      params.per_page = searchParams.get('per_page') ?? '15'
    }
    return params
  }, [asOfDate, dateFrom, dateTo, meta, reportDate, reportKey, searchParams])

  const { data, isLoading, error } = useQuery<OperationalReportData>({
    queryKey: ['reports', 'operational', reportKey, queryParams],
    queryFn: () => fetchOperationalReport(reportKey, queryParams),
  })

  const applyDateRange = () => {
    const next = new URLSearchParams(searchParams)
    if (meta.hasDateRange) {
      next.set('date_from', dateFrom)
      next.set('date_to', dateTo)
    }
    if (meta.hasReportDate) {
      next.set('date', reportDate)
    }
    if (meta.hasAsOfDate) {
      next.set('as_of_date', asOfDate)
    }
    next.delete('page')
    setSearchParams(next)
  }

  const goToPage = (page: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
        <CardDescription>{t(meta.descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ReportNav activeKey={reportKey} />

        {meta.hasDateRange ? (
          <DateRangeReportForm
            fromDate={dateFrom}
            toDate={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onRun={applyDateRange}
            isLoading={isLoading}
          />
        ) : null}

        {meta.hasReportDate ? (
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-date">{t('Date')}</Label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
            <Button type="button" onClick={applyDateRange}>
              {t('Apply')}
            </Button>
          </div>
        ) : null}

        {meta.hasAsOfDate ? (
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="as-of-date">{t('As of date')}</Label>
              <Input
                id="as-of-date"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </div>
            <Button type="button" onClick={applyDateRange}>
              {t('Apply')}
            </Button>
          </div>
        ) : null}

        {isLoading ? <DashboardLoading /> : null}
        {error ? <DashboardError message={t('Failed to load report.')} /> : null}

        {!isLoading && !error && data ? (
          <>
            {reportKey === 'purchase-bridging' ? (
              <PurchaseBridgingReportView
                rows={(data as PurchaseBridgingReportResponse).data}
                meta={(data as PurchaseBridgingReportResponse).meta}
                onPageChange={goToPage}
              />
            ) : null}
            {reportKey === 'bridging' || reportKey === 'sales-distribution' ? (
              <BridgingReportView
                rows={(data as BridgingReportResponse).data}
                meta={(data as BridgingReportResponse).meta}
                onPageChange={goToPage}
                invoicePathPrefix={paths.sales.invoices}
              />
            ) : null}
            {reportKey === 'stock-balances' ? (
              <StockBalancesReportView data={data as StockBalancesReport} />
            ) : null}
            {reportKey === 'goods-in-transit' ? (
              <GoodsInTransitReportView
                rows={(data as GoodsInTransitReport).data}
                summary={(data as GoodsInTransitReport).summary}
              />
            ) : null}
            {reportKey === 'trucks-out-today' ? (
              <TrucksOutTodayReportView
                rows={(data as TrucksOutTodayReport).data}
                summary={(data as TrucksOutTodayReport).summary}
                date={(data as TrucksOutTodayReport).date}
              />
            ) : null}
            {reportKey === 'bank-balances-eod' ? (
              <BankBalancesEodReportView data={data as BankBalancesEodReport} />
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
