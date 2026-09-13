import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import type { TrialBalanceReport } from '../double-entry-api'
import { formatCurrency, formatDate } from '@/utils/helpers'

type Props = {
  report: TrialBalanceReport
  companySettings: AppSettings
  autoPrint?: boolean
}

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

export function TrialBalancePrintLayout({ report, companySettings, autoPrint = false }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  const fromDate = report.from_date ?? ''
  const toDate = report.to_date ?? ''

  return (
    <div className="min-h-screen bg-white text-gray-900 print:min-h-0">
      <div className="trial-balance-container mx-auto max-w-4xl p-8 print:p-0">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-4 text-2xl font-bold">
              {setting(companySettings, 'company_name') || 'YOUR COMPANY'}
            </h1>
            <div className="space-y-1 text-sm">
              {setting(companySettings, 'company_address') ? (
                <p>{setting(companySettings, 'company_address')}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <h2 className="mb-2 text-2xl font-bold">{t('TRIAL BALANCE')}</h2>
            {fromDate && toDate ? (
              <p className="text-sm">
                {t('Period')}: {formatDate(fromDate)} — {formatDate(toDate)}
              </p>
            ) : null}
            {!report.is_balanced ? (
              <p className="mt-2 text-sm font-medium text-red-700">
                {t('Warning: Trial balance is not balanced!')}
              </p>
            ) : null}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-2 text-left font-bold">{t('Account Code')}</th>
              <th className="py-2 text-left font-bold">{t('Account Name')}</th>
              <th className="py-2 text-right font-bold">{t('Debit')}</th>
              <th className="py-2 text-right font-bold">{t('Credit')}</th>
            </tr>
          </thead>
          <tbody>
            {report.accounts.map((account) => {
              const debit = Number(account.debit ?? 0)
              const credit = Number(account.credit ?? 0)
              return (
                <tr
                  key={account.id ?? account.account_code}
                  className="border-b border-gray-100"
                >
                  <td className="py-1.5">{account.account_code}</td>
                  <td className="py-1.5">{account.account_name}</td>
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
          <tfoot>
            <tr className="border-t-2 border-gray-800 font-bold">
              <td colSpan={2} className="py-2">
                {t('TOTAL')}
              </td>
              <td className="py-2 text-right tabular-nums">
                {formatCurrency(report.total_debit)}
              </td>
              <td className="py-2 text-right tabular-nums">
                {formatCurrency(report.total_credit)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-12 border-t pt-6 text-center text-sm text-gray-600">
          <p>
            {t('Generated on')} {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  )
}
