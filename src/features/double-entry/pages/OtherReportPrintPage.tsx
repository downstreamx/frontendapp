import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { paths } from '@/lib/paths'
import {
  fetchAccountBalanceReport,
  fetchCashFlowReport,
  fetchExpenseReport,
  fetchGeneralLedger,
  fetchJournalEntryReport,
  type OtherReportKey,
} from '../other-reports-api'
import { isOtherReportKey } from '../other-reports-config'
import { OtherReportPrintLayout } from '../components/OtherReportPrintLayout'
import { defaultReportDateRange } from '../utils/default-date-range'

export function OtherReportPrintPage() {
  const { t } = useTranslation()
  const { settings } = useAppContext()
  const { reportKey: rawKey } = useParams<{ reportKey: string }>()
  const [params] = useSearchParams()

  if (!rawKey || !isOtherReportKey(rawKey)) {
    return <Navigate to={paths.doubleEntry.reports} replace />
  }

  const reportKey = rawKey as OtherReportKey
  const defaults = defaultReportDateRange()
  const fromDate = params.get('from_date') ?? defaults.from
  const toDate = params.get('to_date') ?? defaults.to
  const asOfDate = params.get('as_of_date') ?? defaults.to
  const accountId = params.get('account_id') ?? ''
  const accountType = params.get('account_type') ?? ''
  const status = params.get('status') ?? ''
  const showZero = params.get('show_zero_balances') === '1'
  const autoPrint = params.get('print') === '1'

  const journalQuery = useQuery({
    queryKey: ['journal-entry-print', fromDate, toDate, status],
    queryFn: () =>
      fetchJournalEntryReport({
        from_date: fromDate,
        to_date: toDate,
        status: status || undefined,
      }),
    enabled: reportKey === 'journal-entry',
  })

  const ledgerQuery = useQuery({
    queryKey: ['ledger-print', accountId, fromDate, toDate],
    queryFn: () =>
      fetchGeneralLedger({
        account_id: accountId,
        from_date: fromDate,
        to_date: toDate,
      }),
    enabled:
      (reportKey === 'general-ledger' || reportKey === 'account-statement') && Boolean(accountId),
  })

  const balanceQuery = useQuery({
    queryKey: ['account-balance-print', asOfDate, accountType, showZero],
    queryFn: () =>
      fetchAccountBalanceReport({
        as_of_date: asOfDate,
        account_type: accountType || undefined,
        show_zero_balances: showZero,
      }),
    enabled: reportKey === 'account-balance',
  })

  const cashFlowQuery = useQuery({
    queryKey: ['cash-flow-print', fromDate, toDate],
    queryFn: () => fetchCashFlowReport({ from_date: fromDate, to_date: toDate }),
    enabled: reportKey === 'cash-flow',
  })

  const expenseQuery = useQuery({
    queryKey: ['expense-print', fromDate, toDate],
    queryFn: () => fetchExpenseReport({ from_date: fromDate, to_date: toDate }),
    enabled: reportKey === 'expense-report',
  })

  const loading =
    journalQuery.isLoading ||
    ledgerQuery.isLoading ||
    balanceQuery.isLoading ||
    cashFlowQuery.isLoading ||
    expenseQuery.isLoading

  const error =
    journalQuery.error ||
    ledgerQuery.error ||
    balanceQuery.error ||
    cashFlowQuery.error ||
    expenseQuery.error

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error) {
    return <p className="p-8 text-sm text-destructive">{t('Failed to load report.')}</p>
  }

  if (
    (reportKey === 'general-ledger' || reportKey === 'account-statement') &&
    !accountId
  ) {
    return <p className="p-8 text-sm text-muted-foreground">{t('Account is required.')}</p>
  }

  return (
    <OtherReportPrintLayout
      reportKey={reportKey}
      companySettings={settings}
      autoPrint={autoPrint}
      journal={journalQuery.data}
      ledger={ledgerQuery.data?.report}
      selectedAccount={ledgerQuery.data?.selected_account}
      accountBalance={balanceQuery.data}
      cashFlow={cashFlowQuery.data}
      expense={expenseQuery.data}
    />
  )
}
