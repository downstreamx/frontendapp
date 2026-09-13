import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, Printer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NoRecordsFound } from '@/components/no-records-found'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { fetchTrialBalance } from '../double-entry-api'
import { DateRangeReportForm } from '../components/DateRangeReportForm'
import { useDoubleEntryPageChrome } from '../hooks/use-double-entry-page-chrome'
import { defaultReportDateRange } from '../utils/default-date-range'
import { formatCurrency, formatDate } from '@/utils/helpers'

export function TrialBalanceReportPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  useDoubleEntryPageChrome(t('Trial balance'), t('Reports'))

  const canPrint = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'print-trial-balance',
  )

  const defaults = defaultReportDateRange()
  const [params, setParams] = useSearchParams()
  const fromDate = params.get('from_date') ?? defaults.from
  const toDate = params.get('to_date') ?? defaults.to

  const reportQuery = useQuery({
    queryKey: ['trial-balance', fromDate, toDate],
    queryFn: () => fetchTrialBalance({ from_date: fromDate, to_date: toDate }),
    enabled: Boolean(fromDate && toDate),
  })

  const report = reportQuery.data
  const displayFrom = report?.from_date ?? fromDate
  const displayTo = report?.to_date ?? toDate

  const openPrint = () => {
    const qs = new URLSearchParams()
    if (fromDate) qs.set('from_date', fromDate)
    if (toDate) qs.set('to_date', toDate)
    qs.set('print', '1')
    window.open(`${paths.doubleEntry.trialBalancePrint}?${qs.toString()}`, '_blank')
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
                <CardTitle className="text-xl">{t('Trial balance')}</CardTitle>
                <CardDescription>
                  {displayFrom && displayTo
                    ? `${formatDate(displayFrom)} — ${formatDate(displayTo)}`
                    : t('Debit and credit totals by account for the selected period.')}
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6 text-center shadow-sm">
                <h4 className="mb-2 font-semibold text-green-700">{t('Total debit')}</h4>
                <p className="text-3xl font-bold tabular-nums text-green-900">
                  {formatCurrency(report.total_debit)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center shadow-sm">
                <h4 className="mb-2 font-semibold text-blue-700">{t('Total credit')}</h4>
                <p className="text-3xl font-bold tabular-nums text-blue-900">
                  {formatCurrency(report.total_credit)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={report.is_balanced ? 'default' : 'destructive'}>
                {report.is_balanced ? t('Balanced') : t('Out of balance')}
              </Badge>
            </div>

            {!report.is_balanced ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-800">
                  {t('Warning: Trial balance is not balanced!')}
                </p>
              </div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 md:p-8">
          {reportQuery.isLoading || reportQuery.isFetching ? (
            <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
          ) : report && report.accounts.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-4 border-b-2 border-gray-300 py-2 text-sm font-bold">
                <div className="col-span-2">{t('Account code')}</div>
                <div className="col-span-6">{t('Account name')}</div>
                <div className="col-span-2 text-right">{t('Debit')}</div>
                <div className="col-span-2 text-right">{t('Credit')}</div>
              </div>
              {report.accounts.map((account) => {
                const debit = Number(account.debit ?? 0)
                const credit = Number(account.credit ?? 0)
                return (
                  <div
                    key={account.id ?? account.account_code}
                    className="grid grid-cols-12 gap-4 border-b border-gray-100 py-1.5 text-sm"
                  >
                    <div className="col-span-2 font-mono text-green-600">{account.account_code}</div>
                    <div className="col-span-6 font-medium">{account.account_name}</div>
                    <div className="col-span-2 text-right font-semibold tabular-nums">
                      {debit > 0 ? formatCurrency(debit) : '—'}
                    </div>
                    <div className="col-span-2 text-right font-semibold tabular-nums">
                      {credit > 0 ? formatCurrency(credit) : '—'}
                    </div>
                  </div>
                )
              })}
              <div className="mt-3 grid grid-cols-12 gap-4 border-t-2 border-gray-400 pt-3 font-bold">
                <div className="col-span-8">{t('TOTAL')}</div>
                <div className="col-span-2 text-right tabular-nums">
                  {formatCurrency(report.total_debit)}
                </div>
                <div className="col-span-2 text-right tabular-nums">
                  {formatCurrency(report.total_credit)}
                </div>
              </div>
            </div>
          ) : (
            <NoRecordsFound
              icon={FileText}
              title={t('No accounts found')}
              description={t('No account transactions found for the selected date range.')}
              className="h-auto py-12"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
