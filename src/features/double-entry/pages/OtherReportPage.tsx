import { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, FileText, Printer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { DateRangeReportForm } from '../components/DateRangeReportForm'
import { useDoubleEntryPageChrome } from '../hooks/use-double-entry-page-chrome'
import { defaultReportDateRange } from '../utils/default-date-range'
import {
  fetchAccountBalanceReport,
  fetchCashFlowReport,
  fetchExpenseReport,
  fetchGeneralLedger,
  fetchJournalEntryReport,
  fetchOtherReportsMeta,
} from '../other-reports-api'
import {
  getOtherReportDefinition,
  isOtherReportKey,
  OTHER_REPORTS,
} from '../other-reports-config'

function ReportTabs({ activeKey }: { activeKey: string }) {
  const { t } = useTranslation()
  const { auth } = useAppContext()

  const visible = OTHER_REPORTS.filter((r) =>
    hasPermission(auth.permissions, auth.roles, auth.user?.type, r.viewPermission),
  )

  return (
    <div className="flex flex-wrap gap-2 border-b pb-4">
      {visible.map((report) => (
        <Link
          key={report.key}
          to={paths.doubleEntry.otherReport(report.key)}
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

function LedgerTable({
  openingBalance,
  transactions,
  closingBalance,
}: {
  openingBalance: number
  transactions: Array<{
    id: number
    date: string
    description: string | null
    reference_type: string | null
    debit: number
    credit: number
    balance: number
  }>
  closingBalance: number
}) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left font-semibold">{t('Date')}</th>
            <th className="px-3 py-2 text-left font-semibold">{t('Description')}</th>
            <th className="px-3 py-2 text-left font-semibold">{t('Reference')}</th>
            <th className="px-3 py-2 text-right font-semibold">{t('Debit')}</th>
            <th className="px-3 py-2 text-right font-semibold">{t('Credit')}</th>
            <th className="px-3 py-2 text-right font-semibold">{t('Balance')}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b bg-muted/20 font-medium">
            <td colSpan={5} className="px-3 py-2">
              {t('Opening balance')}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(openingBalance)}</td>
          </tr>
          {transactions.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.date)}</td>
              <td className="px-3 py-2">{row.description ?? '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.reference_type ?? '—'}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {row.debit > 0 ? formatCurrency(row.debit) : '—'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {row.credit > 0 ? formatCurrency(row.credit) : '—'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.balance)}</td>
            </tr>
          ))}
          <tr className="bg-muted/20 font-bold">
            <td colSpan={5} className="px-3 py-2">
              {t('Closing balance')}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(closingBalance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function OtherReportPage() {
  const { t } = useTranslation()
  const { reportKey } = useParams<{ reportKey: string }>()
  const { auth } = useAppContext()

  if (!reportKey || !isOtherReportKey(reportKey)) {
    return <Navigate to={paths.doubleEntry.reports} replace />
  }

  const definition = getOtherReportDefinition(reportKey)!
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

  useDoubleEntryPageChrome(t(definition.titleKey), t('Reports'))

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
  const accountId = params.get('account_id') ?? ''
  const accountType = params.get('account_type') ?? ''
  const status = params.get('status') ?? ''
  const showZero = params.get('show_zero_balances') === '1'
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [runToken, setRunToken] = useState(0)

  const metaQuery = useQuery({
    queryKey: ['other-reports-meta'],
    queryFn: fetchOtherReportsMeta,
  })

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
    window.open(`${paths.doubleEntry.otherReportPrint(reportKey)}?${qs.toString()}`, '_blank')
  }

  const journalQuery = useQuery({
    queryKey: ['journal-entry-report', fromDate, toDate, status, runToken],
    queryFn: () =>
      fetchJournalEntryReport({
        from_date: fromDate,
        to_date: toDate,
        status: status || undefined,
      }),
    enabled: reportKey === 'journal-entry' && runToken > 0,
  })

  const ledgerQuery = useQuery({
    queryKey: ['general-ledger-report', accountId, fromDate, toDate, runToken],
    queryFn: () =>
      fetchGeneralLedger({
        account_id: accountId,
        from_date: fromDate,
        to_date: toDate,
      }),
    enabled:
      (reportKey === 'general-ledger' || reportKey === 'account-statement') &&
      Boolean(accountId) &&
      runToken > 0,
  })

  const balanceQuery = useQuery({
    queryKey: ['account-balance-report', asOfDate, accountType, showZero, runToken],
    queryFn: () =>
      fetchAccountBalanceReport({
        as_of_date: asOfDate,
        account_type: accountType || undefined,
        show_zero_balances: showZero,
      }),
    enabled: reportKey === 'account-balance' && runToken > 0,
  })

  const cashFlowQuery = useQuery({
    queryKey: ['cash-flow-report', fromDate, toDate, runToken],
    queryFn: () => fetchCashFlowReport({ from_date: fromDate, to_date: toDate }),
    enabled: reportKey === 'cash-flow' && runToken > 0,
  })

  const expenseQuery = useQuery({
    queryKey: ['expense-report', fromDate, toDate, runToken],
    queryFn: () => fetchExpenseReport({ from_date: fromDate, to_date: toDate }),
    enabled: reportKey === 'expense-report' && runToken > 0,
  })

  const isLoading =
    journalQuery.isFetching ||
    ledgerQuery.isFetching ||
    balanceQuery.isFetching ||
    cashFlowQuery.isFetching ||
    expenseQuery.isFetching

  const selectedAccount = ledgerQuery.data?.selected_account

  const body = useMemo(() => {
    if (reportKey === 'journal-entry') {
      const data = journalQuery.data
      if (!data && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select a date range and run the report.')}
          </p>
        )
      }
      if (journalQuery.isError) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      if (!data?.entries.length) {
        return <p className="py-8 text-center text-sm text-muted-foreground">{t('No records found')}</p>
      }
      return (
        <div className="space-y-2">
          {data.entries.map((entry) => {
            const open = expanded.has(entry.id)
            return (
              <div key={entry.id} className="rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/40"
                  onClick={() => {
                    const next = new Set(expanded)
                    if (open) next.delete(entry.id)
                    else next.add(entry.id)
                    setExpanded(next)
                  }}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{entry.journal_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.date)} · {entry.status}
                      </p>
                    </div>
                    <div className="text-right text-sm tabular-nums">
                      <p>
                        {t('Debit')}: {formatCurrency(entry.total_debit)} · {t('Credit')}:{' '}
                        {formatCurrency(entry.total_credit)}
                      </p>
                    </div>
                  </div>
                </button>
                {open ? (
                  <div className="border-t px-4 py-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="py-1 text-left">{t('Account')}</th>
                          <th className="py-1 text-left">{t('Description')}</th>
                          <th className="py-1 text-right">{t('Debit')}</th>
                          <th className="py-1 text-right">{t('Credit')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.items.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-1.5">
                              <span className="text-green-600">{item.account_code}</span> —{' '}
                              {item.account_name}
                            </td>
                            <td className="py-1.5">{item.description ?? '—'}</td>
                            <td className="py-1.5 text-right tabular-nums">
                              {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                            </td>
                            <td className="py-1.5 text-right tabular-nums">
                              {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )
    }

    if (reportKey === 'general-ledger' || reportKey === 'account-statement') {
      if (!accountId) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select an account and run the report.')}
          </p>
        )
      }
      const report = ledgerQuery.data?.report
      if (!report && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select an account and run the report.')}
          </p>
        )
      }
      if (ledgerQuery.isError || !report) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      if (!report.transactions.length) {
        return <p className="py-8 text-center text-sm text-muted-foreground">{t('No records found')}</p>
      }
      return (
        <LedgerTable
          openingBalance={report.opening_balance}
          transactions={report.transactions}
          closingBalance={report.closing_balance}
        />
      )
    }

    if (reportKey === 'account-balance') {
      const data = balanceQuery.data
      if (!data && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select a date and run the report.')}
          </p>
        )
      }
      if (balanceQuery.isError || !data) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      const groups = Object.entries(data.grouped)
      if (!groups.length) {
        return <p className="py-8 text-center text-sm text-muted-foreground">{t('No records found')}</p>
      }
      return (
        <div className="space-y-6">
          {groups.map(([type, group]) => (
            <div key={type}>
              <h3 className="mb-2 text-lg font-bold">{type}</h3>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left">{t('Code')}</th>
                    <th className="px-3 py-2 text-left">{t('Account')}</th>
                    <th className="px-3 py-2 text-right">{t('Debit')}</th>
                    <th className="px-3 py-2 text-right">{t('Credit')}</th>
                    <th className="px-3 py-2 text-right">{t('Net')}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.accounts.map((row) => (
                    <tr key={row.account_code} className="border-b">
                      <td className="px-3 py-2">{row.account_code}</td>
                      <td className="px-3 py-2">{row.account_name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.debit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(row.credit)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(row.net_balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 font-semibold">
                    <td colSpan={2} className="px-3 py-2">
                      {t('Subtotal')}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(group.subtotal_debit)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(group.subtotal_credit)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(group.subtotal_net)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
          <div className="flex justify-between border-t-2 pt-3 text-lg font-bold">
            <span>{t('Grand total')}</span>
            <span className="tabular-nums">{formatCurrency(data.totals.net)}</span>
          </div>
        </div>
      )
    }

    if (reportKey === 'cash-flow') {
      const data = cashFlowQuery.data
      if (!data && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select a date range and run the report.')}
          </p>
        )
      }
      if (cashFlowQuery.isError || !data) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      const rows = [
        { label: t('Beginning cash'), value: data.beginning_cash },
        { label: t('Operating activities'), value: data.operating },
        { label: t('Investing activities'), value: data.investing },
        { label: t('Financing activities'), value: data.financing },
        { label: t('Net cash flow'), value: data.net_cash_flow, bold: true },
        { label: t('Ending cash'), value: data.ending_cash, bold: true },
      ]
      return (
        <div className="mx-auto max-w-lg space-y-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className={cn(
                'flex justify-between border-b py-2 text-sm',
                row.bold && 'border-t-2 font-bold text-base',
              )}
            >
              <span>{row.label}</span>
              <span className="tabular-nums">{formatCurrency(row.value)}</span>
            </div>
          ))}
        </div>
      )
    }

    if (reportKey === 'expense-report') {
      const data = expenseQuery.data
      if (!data && runToken === 0) {
        return (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Select a date range and run the report.')}
          </p>
        )
      }
      if (expenseQuery.isError || !data) {
        return <p className="text-sm text-destructive">{t('Failed to load report.')}</p>
      }
      if (!data.expenses.length) {
        return <p className="py-8 text-center text-sm text-muted-foreground">{t('No records found')}</p>
      }
      return (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2 text-left">{t('Code')}</th>
              <th className="px-3 py-2 text-left">{t('Account')}</th>
              <th className="px-3 py-2 text-right">{t('Amount')}</th>
            </tr>
          </thead>
          <tbody>
            {data.expenses.map((row) => (
              <tr key={row.account_code} className="border-b">
                <td className="px-3 py-2">{row.account_code}</td>
                <td className="px-3 py-2">{row.account_name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.amount)}</td>
              </tr>
            ))}
            <tr className="bg-muted/20 font-bold">
              <td colSpan={2} className="px-3 py-2">
                {t('Total expenses')}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(data.total_expenses)}
              </td>
            </tr>
          </tbody>
        </table>
      )
    }

    return null
  }, [
    reportKey,
    journalQuery.data,
    journalQuery.isError,
    ledgerQuery.data,
    ledgerQuery.isError,
    balanceQuery.data,
    balanceQuery.isError,
    cashFlowQuery.data,
    cashFlowQuery.isError,
    expenseQuery.data,
    expenseQuery.isError,
    accountId,
    runToken,
    expanded,
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
                  {definition.usesAsOfDate
                    ? t('As of {{date}}', { date: formatDate(asOfDate) })
                    : t('{{from}} – {{to}}', {
                        from: formatDate(fromDate),
                        to: formatDate(toDate),
                      })}
                </CardDescription>
                {selectedAccount ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedAccount.account_code} — {selectedAccount.account_name}
                  </p>
                ) : null}
              </div>
            </div>
            {canPrint ? (
              <Button type="button" variant="outline" size="sm" onClick={openPrint}>
                <Printer className="mr-2 h-4 w-4" />
                {t('Print')}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            {definition.needsAccount ? (
              <div className="space-y-2 min-w-[220px]">
                <Label>{t('Account')}</Label>
                <Select
                  value={accountId}
                  onValueChange={(v) => updateParams({ account_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select account')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(metaQuery.data?.accounts ?? []).map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.account_code} — {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {definition.usesAsOfDate ? (
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
                <div className="space-y-2 min-w-[180px]">
                  <Label>{t('Account type')}</Label>
                  <Select
                    value={accountType || 'all'}
                    onValueChange={(v) =>
                      updateParams({ account_type: v === 'all' ? null : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All types')}</SelectItem>
                      {(metaQuery.data?.account_types ?? []).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showZero}
                    onChange={(e) =>
                      updateParams({ show_zero_balances: e.target.checked ? '1' : null })
                    }
                  />
                  {t('Show zero balances')}
                </label>
              </>
            ) : (
              <>
                <DateRangeReportForm
                  fromDate={fromDate}
                  toDate={toDate}
                  onFromChange={(v) => updateParams({ from_date: v })}
                  onToChange={(v) => updateParams({ to_date: v })}
                  onRun={() => setRunToken((n) => n + 1)}
                  isLoading={isLoading}
                />
                {reportKey === 'journal-entry' ? (
                  <div className="space-y-2 min-w-[160px]">
                    <Label>{t('Status')}</Label>
                    <Select
                      value={status || 'all'}
                      onValueChange={(v) => updateParams({ status: v === 'all' ? null : v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('All')}</SelectItem>
                        <SelectItem value="posted">{t('Posted')}</SelectItem>
                        <SelectItem value="draft">{t('Draft')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </>
            )}

            {definition.usesAsOfDate || definition.needsAccount ? (
              <Button
                type="button"
                onClick={() => setRunToken((n) => n + 1)}
                disabled={
                  isLoading ||
                  (definition.needsAccount && !accountId) ||
                  (definition.usesAsOfDate && !asOfDate)
                }
              >
                {isLoading ? t('Loading…') : t('Run report')}
              </Button>
            ) : null}
          </div>

          {body}
        </CardContent>
      </Card>
    </div>
  )
}
