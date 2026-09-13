import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import type { LedgerSummaryAccountOption, LedgerSummaryRow } from '../double-entry-api'
import { formatCurrency, formatDate } from '@/utils/helpers'

type Props = {
  rows: LedgerSummaryRow[]
  companySettings: AppSettings
  filters: { from_date?: string; to_date?: string }
  selectedAccount?: LedgerSummaryAccountOption | null
  autoPrint?: boolean
}

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

export function LedgerSummaryPrintLayout({
  rows,
  companySettings,
  filters,
  selectedAccount,
  autoPrint = false,
}: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  return (
    <div className="min-h-screen bg-white text-gray-900 print:min-h-0">
      <div className="ledger-summary-container mx-auto max-w-4xl p-8 print:p-0">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-4 text-2xl font-bold">
              {setting(companySettings, 'company_name') || 'YOUR COMPANY'}
            </h1>
            <div className="space-y-1 text-sm">
              {setting(companySettings, 'company_address') ? (
                <p>{setting(companySettings, 'company_address')}</p>
              ) : null}
              {(setting(companySettings, 'company_city') ||
                setting(companySettings, 'company_state') ||
                setting(companySettings, 'company_zipcode')) && (
                <p>
                  {setting(companySettings, 'company_city')}
                  {setting(companySettings, 'company_state')
                    ? `, ${setting(companySettings, 'company_state')}`
                    : ''}{' '}
                  {setting(companySettings, 'company_zipcode')}
                </p>
              )}
              {setting(companySettings, 'company_country') ? (
                <p>{setting(companySettings, 'company_country')}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <h2 className="mb-2 text-2xl font-bold">{t('LEDGER SUMMARY')}</h2>
            <div className="space-y-1 text-sm">
              {filters.from_date && filters.to_date ? (
                <p>
                  {t('Period')}: {formatDate(filters.from_date)} — {formatDate(filters.to_date)}
                </p>
              ) : null}
              {selectedAccount ? (
                <p>
                  {t('Account')}: {selectedAccount.account_code} — {selectedAccount.account_name}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-2 text-left font-bold">{t('Date')}</th>
              <th className="py-2 text-left font-bold">{t('Account')}</th>
              <th className="py-2 text-left font-bold">{t('Description')}</th>
              <th className="py-2 text-right font-bold">{t('Debit')}</th>
              <th className="py-2 text-right font-bold">{t('Credit')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const debit = Number(row.debit_amount ?? 0)
              const credit = Number(row.credit_amount ?? 0)
              return (
                <tr key={row.id ?? `${row.journal_date}-${row.account_code}`} className="border-b border-gray-100">
                  <td className="py-1.5">{formatDate(row.journal_date)}</td>
                  <td className="py-1.5">
                    {row.account_code} {row.account_name}
                  </td>
                  <td className="py-1.5">{row.description ?? row.journal_description ?? '—'}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {debit > 0 ? formatCurrency(debit) : '—'}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {credit > 0 ? formatCurrency(credit) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-12 border-t pt-6 text-center text-sm text-gray-600">
          <p>{setting(companySettings, 'company_name')}</p>
          <p>
            {t('Generated on')} {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  )
}
