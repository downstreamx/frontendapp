import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import type { ProfitLossReport } from '../double-entry-api'
import { formatCurrency, formatDate } from '@/utils/helpers'

type Props = {
  report: ProfitLossReport
  companySettings: AppSettings
  autoPrint?: boolean
}

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

export function ProfitLossPrintLayout({ report, companySettings, autoPrint = false }: Props) {
  const { t } = useTranslation()
  const isProfit = report.net_profit >= 0
  const fromDate = report.from_date ?? ''
  const toDate = report.to_date ?? ''

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  return (
    <div className="min-h-screen bg-white text-gray-900 print:min-h-0">
      <div className="profit-loss-container mx-auto max-w-4xl p-8 print:p-0">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-4 text-2xl font-bold">
              {setting(companySettings, 'company_name') || 'YOUR COMPANY'}
            </h1>
            {setting(companySettings, 'company_address') ? (
              <p className="text-sm">{setting(companySettings, 'company_address')}</p>
            ) : null}
          </div>
          <div className="text-right">
            <h2 className="mb-2 text-2xl font-bold">{t('PROFIT & LOSS STATEMENT')}</h2>
            {fromDate && toDate ? (
              <p className="text-sm">
                {t('Period')}: {formatDate(fromDate)} — {formatDate(toDate)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-3 border-b-2 border-gray-800 pb-2 text-base font-bold">{t('Revenue')}</h3>
            {report.revenue.length > 0 ? (
              report.revenue.map((account) => (
                <div key={account.id ?? account.account_code} className="flex justify-between py-1.5 text-sm">
                  <span>
                    {account.account_code} — {account.account_name}
                  </span>
                  <span className="tabular-nums">{formatCurrency(account.balance)}</span>
                </div>
              ))
            ) : (
              <p className="py-2 text-sm text-gray-600">{t('No revenue accounts')}</p>
            )}
            <div className="mt-2 flex justify-between border-t py-2 text-sm font-semibold">
              <span>{t('Total revenue')}</span>
              <span className="tabular-nums">{formatCurrency(report.total_revenue)}</span>
            </div>
          </div>

          <div>
            <h3 className="mb-3 border-b-2 border-gray-800 pb-2 text-base font-bold">{t('Expenses')}</h3>
            {report.expenses.length > 0 ? (
              report.expenses.map((account) => (
                <div key={account.id ?? account.account_code} className="flex justify-between py-1.5 text-sm">
                  <span>
                    {account.account_code} — {account.account_name}
                  </span>
                  <span className="tabular-nums">{formatCurrency(account.balance)}</span>
                </div>
              ))
            ) : (
              <p className="py-2 text-sm text-gray-600">{t('No expense accounts')}</p>
            )}
            <div className="mt-2 flex justify-between border-t py-2 text-sm font-semibold">
              <span>{t('Total expenses')}</span>
              <span className="tabular-nums">{formatCurrency(report.total_expenses)}</span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-800 pt-4">
          <div className="flex justify-between text-base font-bold">
            <span>{isProfit ? t('Net profit') : t('Net loss')}</span>
            <span className="tabular-nums">{formatCurrency(Math.abs(report.net_profit))}</span>
          </div>
        </div>

        <div className="mt-12 border-t pt-6 text-center text-sm text-gray-600">
          <p>
            {t('Generated on')} {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  )
}
