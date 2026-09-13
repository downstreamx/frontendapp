import { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, Printer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { DateRangeReportForm } from '@/features/double-entry/components/DateRangeReportForm'
import { defaultReportDateRange } from '@/features/double-entry/utils/default-date-range'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import {
  fetchBillAging,
  fetchInvoiceAging,
  fetchSupplierBalanceReport,
  fetchTaxSummary,
  type AgingPartyRow,
  type AgingSummary,
} from '../account-reports-api'
import {
  ACCOUNT_REPORTS,
  AGING_BUCKET_LABELS,
  getAccountReportDefinition,
  isAccountReportKey,
} from '../account-reports-config'

const AGING_KEYS = ['current', '1_30_days', '31_60_days', '61_90_days', 'over_90_days', 'total'] as const

function ReportTabs({ activeKey }: { activeKey: string }) {
  const { t } = useTranslation()
  const { auth } = useAppContext()

  const visible = ACCOUNT_REPORTS.filter((r) =>
    hasPermission(auth.permissions, auth.roles, auth.user?.type, r.viewPermission),
  )

  return (
    <div className="flex flex-wrap gap-2 border-b pb-4">
      <Link
        to={paths.account.creditBalance}
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          activeKey === 'customer-balance'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
        )}
      >
        {t('Customer balance')}
      </Link>
      {visible.map((report) => (
        <Link
          key={report.key}
          to={paths.account.accountReport(report.key)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            report.key === activeKey
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {t(report.titleKey)}
        </Link>
      ))}
    </div>
  )
}

function AgingSummaryCards({ summary }: { summary: AgingSummary }) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {AGING_KEYS.map((key) => (
        <div key={key} className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            {key === 'total' ? t('Total') : t(AGING_BUCKET_LABELS[key] ?? key)}
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums">{formatCurrency(summary[key])}</p>
        </div>
      ))}
    </div>
  )
}

function AgingPartyTable({
  rows,
  nameKey,
}: {
  rows: AgingPartyRow[]
  nameKey: 'customer_name' | 'supplier_name'
}) {
  const { t } = useTranslation()

  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t('No records found')}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left font-semibold">{t('Name')}</th>
            {AGING_KEYS.filter((k) => k !== 'total').map((key) => (
              <th key={key} className="px-3 py-2 text-right font-semibold">
                {t(AGING_BUCKET_LABELS[key] ?? key)}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold">{t('Total')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b">
              <td className="px-3 py-2 font-medium">{row[nameKey] ?? '—'}</td>
              {AGING_KEYS.filter((k) => k !== 'total').map((key) => (
                <td key={key} className="px-3 py-2 text-right tabular-nums">
                  {row[key] > 0 ? formatCurrency(row[key]) : '—'}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatCurrency(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AccountReportPage() {
  const { t } = useTranslation()
  const { reportKey } = useParams<{ reportKey: string }>()
  const { auth } = useAppContext()

  if (!reportKey || !isAccountReportKey(reportKey)) {
    return <Navigate to={paths.account.reports} replace />
  }

  const definition = getAccountReportDefinition(reportKey)!
  const canView = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    definition.viewPermission,
  )
  const canPrint = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    definition.printPermission,
  )

  useAccountPageChrome(t(definition.titleKey), t('Reports'))

  if (!canView) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {t('You do not have permission to view this report.')}
      </p>
    )
  }

  const defaults = defaultReportDateRange()
  const [params, setParams] = useSearchParams()
  const fromDate = params.get('from_date') ?? defaults.from
  const toDate = params.get('to_date') ?? defaults.to
  const asOfDate = params.get('as_of_date') ?? defaults.to
  const showZero = params.get('show_zero_balances') === '1'
  const [runToken, setRunToken] = useState(0)

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    })
    setParams(next, { replace: true })
  }

  const openPrint = () => {
    const qs = new URLSearchParams(params)
    qs.set('print', '1')
    window.open(`${paths.account.accountReportPrint(reportKey)}?${qs.toString()}`, '_blank')
  }

  const invoiceAgingQuery = useQuery({
    queryKey: ['invoice-aging', asOfDate, runToken],
    queryFn: () => fetchInvoiceAging({ as_of_date: asOfDate }),
    enabled: reportKey === 'invoice-aging' && runToken > 0,
  })

  const billAgingQuery = useQuery({
    queryKey: ['bill-aging', asOfDate, runToken],
    queryFn: () => fetchBillAging({ as_of_date: asOfDate }),
    enabled: reportKey === 'bill-aging' && runToken > 0,
  })

  const taxQuery = useQuery({
    queryKey: ['tax-summary', fromDate, toDate, runToken],
    queryFn: () => fetchTaxSummary({ from_date: fromDate, to_date: toDate }),
    enabled: reportKey === 'tax-summary' && runToken > 0,
  })

  const supplierQuery = useQuery({
    queryKey: ['supplier-balance', asOfDate, showZero, runToken],
    queryFn: () =>
      fetchSupplierBalanceReport({
        as_of_date: asOfDate,
        show_zero_balances: showZero,
      }),
    enabled: reportKey === 'supplier-balance' && runToken > 0,
  })

  const isLoading =
    invoiceAgingQuery.isFetching ||
    billAgingQuery.isFetching ||
    taxQuery.isFetching ||
    supplierQuery.isFetching

  const body = useMemo(() => {
    if (reportKey === 'invoice-aging') {
      const data = invoiceAgingQuery.data
      if (!data && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select a date and run the report.')}
          </p>
        )
      }
      if (invoiceAgingQuery.isError || !data) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      return (
        <div className="space-y-6">
          <AgingSummaryCards summary={data.aging_summary} />
          <AgingPartyTable rows={data.customers} nameKey="customer_name" />
        </div>
      )
    }

    if (reportKey === 'bill-aging') {
      const data = billAgingQuery.data
      if (!data && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select a date and run the report.')}
          </p>
        )
      }
      if (billAgingQuery.isError || !data) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      return (
        <div className="space-y-6">
          <AgingSummaryCards summary={data.aging_summary} />
          <AgingPartyTable rows={data.suppliers} nameKey="supplier_name" />
        </div>
      )
    }

    if (reportKey === 'tax-summary') {
      const data = taxQuery.data
      if (!data && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select a date range and run the report.')}
          </p>
        )
      }
      if (taxQuery.isError || !data) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      return (
        <div className="grid gap-8 md:grid-cols-2">
          {(['tax_collected', 'tax_paid'] as const).map((section) => {
            const block = data[section]
            const title = section === 'tax_collected' ? t('Tax collected') : t('Tax paid')
            return (
              <div key={section}>
                <h3 className="mb-3 text-lg font-bold">{title}</h3>
                <div className="space-y-1">
                  {block.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b py-1.5 text-sm">
                      <span>{item.tax_name}</span>
                      <span className="tabular-nums">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {!block.items.length ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t('No records found')}
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 flex justify-between border-t-2 pt-2 font-bold">
                  <span>{t('Total')}</span>
                  <span className="tabular-nums">{formatCurrency(block.total)}</span>
                </div>
              </div>
            )
          })}
          <div className="md:col-span-2 rounded-lg border bg-muted/30 p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>{t('Net tax liability')}</span>
              <span className="tabular-nums">{formatCurrency(data.net_tax_liability)}</span>
            </div>
          </div>
        </div>
      )
    }

    if (reportKey === 'supplier-balance') {
      const data = supplierQuery.data
      if (!data && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select a date and run the report.')}
          </p>
        )
      }
      if (supplierQuery.isError || !data) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      if (!data.suppliers.length) {
        return <p className="py-8 text-center text-sm text-muted-foreground">{t('No records found')}</p>
      }
      return (
        <div>
          <p className="mb-4 text-sm font-semibold">
            {t('Total outstanding')}: {formatCurrency(data.total_balance)}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left">{t('Supplier')}</th>
                  <th className="px-3 py-2 text-left">{t('Email')}</th>
                  <th className="px-3 py-2 text-right">{t('Total billed')}</th>
                  <th className="px-3 py-2 text-right">{t('Returns')}</th>
                  <th className="px-3 py-2 text-right">{t('Paid')}</th>
                  <th className="px-3 py-2 text-right">{t('Balance')}</th>
                </tr>
              </thead>
              <tbody>
                {data.suppliers.map((row) => (
                  <tr key={row.supplier_id} className="border-b">
                    <td className="px-3 py-2">
                      <Link
                        to={paths.account.supplierShow(row.supplier_id)}
                        className="text-primary hover:underline"
                      >
                        {row.supplier_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.supplier_email ?? '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(row.total_billed)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-destructive">
                      {formatCurrency(row.total_returns)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(row.total_paid)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    return null
  }, [
    reportKey,
    invoiceAgingQuery.data,
    invoiceAgingQuery.isError,
    billAgingQuery.data,
    billAgingQuery.isError,
    taxQuery.data,
    taxQuery.isError,
    supplierQuery.data,
    supplierQuery.isError,
    runToken,
    t,
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <ReportTabs activeKey={reportKey} />

      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>{t(definition.titleKey)}</CardTitle>
                <CardDescription>
                  {definition.usesDateRange
                    ? t('{{from}} – {{to}}', {
                        from: formatDate(fromDate),
                        to: formatDate(toDate),
                      })
                    : t('As of {{date}}', { date: formatDate(asOfDate) })}
                </CardDescription>
              </div>
            </div>
            {canPrint ? (
              <Button type="button" variant="outline" size="sm" onClick={openPrint} disabled={runToken === 0}>
                <Printer className="mr-2 h-4 w-4" />
                {t('Print')}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap items-end gap-4">
            {definition.usesDateRange ? (
              <DateRangeReportForm
                fromDate={fromDate}
                toDate={toDate}
                onFromChange={(v) => updateParams({ from_date: v })}
                onToChange={(v) => updateParams({ to_date: v })}
                onRun={() => setRunToken((n) => n + 1)}
                isLoading={isLoading}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="as_of_date">{t('As of date')}</Label>
                  <Input
                    id="as_of_date"
                    type="date"
                    value={asOfDate}
                    onChange={(e) => updateParams({ as_of_date: e.target.value })}
                  />
                </div>
                {reportKey === 'supplier-balance' ? (
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <Checkbox
                      checked={showZero}
                      onCheckedChange={(checked) =>
                        updateParams({ show_zero_balances: checked === true ? '1' : null })
                      }
                    />
                    {t('Show zero balances')}
                  </label>
                ) : null}
                <Button
                  type="button"
                  onClick={() => setRunToken((n) => n + 1)}
                  disabled={isLoading || !asOfDate}
                >
                  {isLoading ? t('Loading…') : t('Run report')}
                </Button>
              </>
            )}
          </div>
          {body}
        </CardContent>
      </Card>
    </div>
  )
}
