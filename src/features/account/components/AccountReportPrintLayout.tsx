import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import { formatCurrency, formatDate } from '@/utils/helpers'
import type {
  AccountReportKey,
  AgingSummary,
  BillAgingReport,
  InvoiceAgingReport,
  SupplierBalanceReport,
  TaxSummaryReport,
} from '../account-reports-api'
import { AGING_BUCKET_LABELS, getAccountReportDefinition } from '../account-reports-config'

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

type Props = {
  reportKey: AccountReportKey
  companySettings: AppSettings
  autoPrint?: boolean
  invoiceAging?: InvoiceAgingReport
  billAging?: BillAgingReport
  taxSummary?: TaxSummaryReport
  supplierBalance?: SupplierBalanceReport
}

export function AccountReportPrintLayout({
  reportKey,
  companySettings,
  autoPrint,
  invoiceAging,
  billAging,
  taxSummary,
  supplierBalance,
}: Props) {
  const { t } = useTranslation()
  const definition = getAccountReportDefinition(reportKey)

  useEffect(() => {
    if (!autoPrint) return
    const id = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(id)
  }, [autoPrint])

  const companyName = setting(companySettings, 'company_name') || setting(companySettings, 'title_text')

  return (
    <div className="min-h-screen bg-white p-8 text-gray-900 print:min-h-0 print:p-4">
      <header className="mb-8 border-b pb-4 text-center">
        {companyName ? <h1 className="text-2xl font-bold">{companyName}</h1> : null}
        <h2 className="mt-2 text-xl font-semibold">{definition ? t(definition.titleKey) : ''}</h2>
      </header>

      {reportKey === 'invoice-aging' && invoiceAging ? (
        <PrintAging data={invoiceAging.aging_summary} parties={invoiceAging.customers} nameKey="customer_name" />
      ) : null}

      {reportKey === 'bill-aging' && billAging ? (
        <PrintAging data={billAging.aging_summary} parties={billAging.suppliers} nameKey="supplier_name" />
      ) : null}

      {reportKey === 'tax-summary' && taxSummary ? (
        <div className="space-y-6 text-sm">
          <p>
            {formatDate(taxSummary.from_date)} – {formatDate(taxSummary.to_date)}
          </p>
          <div>
            <h3 className="font-bold">{t('Tax collected')}</h3>
            {taxSummary.tax_collected.items.map((item, idx) => (
              <div key={idx} className="flex justify-between border-b py-1">
                <span>{item.tax_name}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <p className="mt-2 font-bold">
              {t('Total')}: {formatCurrency(taxSummary.tax_collected.total)}
            </p>
          </div>
          <div>
            <h3 className="font-bold">{t('Tax paid')}</h3>
            {taxSummary.tax_paid.items.map((item, idx) => (
              <div key={idx} className="flex justify-between border-b py-1">
                <span>{item.tax_name}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <p className="mt-2 font-bold">
              {t('Total')}: {formatCurrency(taxSummary.tax_paid.total)}
            </p>
          </div>
          <p className="text-lg font-bold">
            {t('Net tax liability')}: {formatCurrency(taxSummary.net_tax_liability)}
          </p>
        </div>
      ) : null}

      {reportKey === 'supplier-balance' && supplierBalance ? (
        <div className="text-sm">
          <p className="mb-4">
            {t('As of')} {formatDate(supplierBalance.as_of_date)} · {t('Total')}:{' '}
            {formatCurrency(supplierBalance.total_balance)}
          </p>
          {supplierBalance.suppliers.map((row) => (
            <div key={row.supplier_id} className="flex justify-between border-b py-1">
              <span>{row.supplier_name}</span>
              <span>{formatCurrency(row.balance)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PrintAging({
  data,
  parties,
  nameKey,
}: {
  data: AgingSummary
  parties: Array<Record<string, string | number>>
  nameKey: string
}) {
  const { t } = useTranslation()
  const keys = ['current', '1_30_days', '31_60_days', '61_90_days', 'over_90_days', 'total'] as const

  return (
    <div className="text-sm">
      <div className="mb-4 grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <div key={key}>
            <span className="text-gray-600">{key === 'total' ? t('Total') : AGING_BUCKET_LABELS[key]}</span>
            <p className="font-semibold">{formatCurrency(data[key])}</p>
          </div>
        ))}
      </div>
      {parties.map((row, idx) => (
        <div key={idx} className="border-b py-1">
          <p className="font-medium">{String(row[nameKey] ?? '')}</p>
          <p className="text-gray-600">{formatCurrency(Number(row.total))}</p>
        </div>
      ))}
    </div>
  )
}
