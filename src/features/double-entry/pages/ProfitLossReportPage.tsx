import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, Printer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { fetchProfitLoss, type ProfitLossAccount } from '../double-entry-api'
import { DateRangeReportForm } from '../components/DateRangeReportForm'
import { useDoubleEntryPageChrome } from '../hooks/use-double-entry-page-chrome'
import { defaultReportDateRange } from '../utils/default-date-range'
import { formatCurrency, formatDate } from '@/utils/helpers'

function AccountLines({
  title,
  rows,
  emptyLabel,
  totalLabel,
  total,
}: {
  title: string
  rows: ProfitLossAccount[]
  emptyLabel: string
  totalLabel: string
  total: number
}) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-bold text-gray-800">{title}</h3>
      <div className="space-y-1">
        {rows.length > 0 ? (
          rows.map((account) => (
            <div
              key={account.id ?? account.account_code}
              className="flex items-center justify-between border-b border-gray-100 py-1.5 text-sm"
            >
              <p className="font-medium">
                <span className="text-green-600">{account.account_code}</span> — {account.account_name}
              </p>
              <p className="font-semibold tabular-nums">{formatCurrency(account.balance)}</p>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
      <div className="mt-3 flex justify-between border-t-2 border-gray-300 pt-3 font-bold">
        <p>{totalLabel}</p>
        <p className="tabular-nums">{formatCurrency(total)}</p>
      </div>
    </div>
  )
}

export function ProfitLossReportPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  useDoubleEntryPageChrome(t('Profit & loss'), t('Reports'))

  const canPrint = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'print-profit-loss',
  )

  const defaults = defaultReportDateRange()
  const [params, setParams] = useSearchParams()
  const fromDate = params.get('from_date') ?? defaults.from
  const toDate = params.get('to_date') ?? defaults.to

  const reportQuery = useQuery({
    queryKey: ['profit-loss', fromDate, toDate],
    queryFn: () => fetchProfitLoss({ from_date: fromDate, to_date: toDate }),
    enabled: Boolean(fromDate && toDate),
  })

  const report = reportQuery.data
  const displayFrom = report?.from_date ?? fromDate
  const displayTo = report?.to_date ?? toDate
  const isProfit = (report?.net_profit ?? 0) >= 0

  const openPrint = () => {
    const qs = new URLSearchParams()
    if (fromDate) qs.set('from_date', fromDate)
    if (toDate) qs.set('to_date', toDate)
    qs.set('print', '1')
    window.open(`${paths.doubleEntry.profitLossPrint}?${qs.toString()}`, '_blank')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{t('Profit & loss statement')}</CardTitle>
                <CardDescription>
                  {displayFrom && displayTo
                    ? `${formatDate(displayFrom)} — ${formatDate(displayTo)}`
                    : t('Revenue and expense accounts for the selected period.')}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <DateRangeReportForm
                fromDate={fromDate}
                toDate={toDate}
                onFromChange={(v) =>
                  setParams((p) => {
                    p.set('from_date', v)
                    return p
                  })
                }
                onToChange={(v) =>
                  setParams((p) => {
                    p.set('to_date', v)
                    return p
                  })
                }
                onRun={() => reportQuery.refetch()}
                isLoading={reportQuery.isFetching}
              />
              {canPrint ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openPrint}
                  disabled={!fromDate || !toDate || reportQuery.isFetching}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {t('Print')}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        {report ? (
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6 text-center shadow-sm">
                <h4 className="mb-2 font-semibold text-green-700">{t('Total revenue')}</h4>
                <p className="text-3xl font-bold tabular-nums text-green-900">
                  {formatCurrency(report.total_revenue)}
                </p>
              </div>
              <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-6 text-center shadow-sm">
                <h4 className="mb-2 font-semibold text-red-700">{t('Total expenses')}</h4>
                <p className="text-3xl font-bold tabular-nums text-red-900">
                  {formatCurrency(report.total_expenses)}
                </p>
              </div>
              <div
                className={`rounded-xl border p-6 text-center shadow-sm ${
                  isProfit
                    ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100'
                    : 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100'
                }`}
              >
                <h4
                  className={`mb-2 font-semibold ${isProfit ? 'text-blue-700' : 'text-orange-700'}`}
                >
                  {isProfit ? t('Net profit') : t('Net loss')}
                </h4>
                <p
                  className={`text-3xl font-bold tabular-nums ${isProfit ? 'text-blue-900' : 'text-orange-900'}`}
                >
                  {formatCurrency(Math.abs(report.net_profit))}
                </p>
              </div>
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 md:p-8">
          {reportQuery.isLoading || reportQuery.isFetching ? (
            <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
          ) : report ? (
            <>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <AccountLines
                  title={t('Revenue')}
                  rows={report.revenue}
                  emptyLabel={t('No revenue accounts')}
                  totalLabel={t('Total revenue')}
                  total={report.total_revenue}
                />
                <AccountLines
                  title={t('Expenses')}
                  rows={report.expenses}
                  emptyLabel={t('No expense accounts')}
                  totalLabel={t('Total expenses')}
                  total={report.total_expenses}
                />
              </div>
              <div className="mt-8 border-t-2 border-gray-400 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">
                    {isProfit ? t('Net profit') : t('Net loss')}
                  </h3>
                  <p
                    className={`text-base font-bold tabular-nums ${isProfit ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(Math.abs(report.net_profit))}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
