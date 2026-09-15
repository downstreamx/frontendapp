import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { paths } from '@/lib/paths'
import { AccountReportPrintLayout } from '../components/AccountReportPrintLayout'
import {
  fetchBillAging,
  fetchInvoiceAging,
  fetchSupplierBalanceReport,
  fetchTaxSummary,
  type AccountReportKey,
} from '../account-reports-api'
import { isAccountReportKey } from '../account-reports-config'
import { defaultReportDateRange } from '@/features/double-entry/utils/default-date-range'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function AccountReportPrintPage() {
  const { t } = useTranslation()
  const { settings } = useAppContext()
  const { reportKey: rawKey } = useParams<{ reportKey: string }>()
  const [params] = useSearchParams()

  if (!rawKey || !isAccountReportKey(rawKey)) {
    return <Navigate to={paths.account.reports} replace />
  }

  const reportKey = rawKey as AccountReportKey
  const defaults = defaultReportDateRange()
  const fromDate = params.get('from_date') ?? defaults.from
  const toDate = params.get('to_date') ?? defaults.to
  const asOfDate = params.get('as_of_date') ?? defaults.to
  const showZero = params.get('show_zero_balances') === '1'
  const autoPrint = params.get('print') === '1'

  const invoiceQuery = useQuery({
    queryKey: ['invoice-aging-print', asOfDate],
    queryFn: () => fetchInvoiceAging({ as_of_date: asOfDate }),
    enabled: reportKey === 'invoice-aging',
  })

  const billQuery = useQuery({
    queryKey: ['bill-aging-print', asOfDate],
    queryFn: () => fetchBillAging({ as_of_date: asOfDate }),
    enabled: reportKey === 'bill-aging',
  })

  const taxQuery = useQuery({
    queryKey: ['tax-summary-print', fromDate, toDate],
    queryFn: () => fetchTaxSummary({ from_date: fromDate, to_date: toDate }),
    enabled: reportKey === 'tax-summary',
  })

  const supplierQuery = useQuery({
    queryKey: ['supplier-balance-print', asOfDate, showZero],
    queryFn: () =>
      fetchSupplierBalanceReport({
        as_of_date: asOfDate,
        show_zero_balances: showZero,
      }),
    enabled: reportKey === 'supplier-balance',
  })

  const loading =
    invoiceQuery.isLoading ||
    billQuery.isLoading ||
    taxQuery.isLoading ||
    supplierQuery.isLoading

  const error =
    invoiceQuery.error || billQuery.error || taxQuery.error || supplierQuery.error

  if (loading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (error) {
    return <p className="p-8 text-sm text-destructive">{t('Failed to load report.')}</p>
  }

  return (
    <AccountReportPrintLayout
      reportKey={reportKey}
      companySettings={settings}
      autoPrint={autoPrint}
      invoiceAging={invoiceQuery.data}
      billAging={billQuery.data}
      taxSummary={taxQuery.data}
      supplierBalance={supplierQuery.data}
    />
  )
}
