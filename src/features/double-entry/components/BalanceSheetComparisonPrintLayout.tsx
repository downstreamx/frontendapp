import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import type { BalanceSheetComparison } from '../balance-sheets-api'
import { buildComparisonRows } from '../balance-sheet-utils'
import { BalanceSheetComparisonSections } from './BalanceSheetComparisonSections'
import { formatCurrency, formatDate } from '@/utils/helpers'

type Props = {
  comparison: BalanceSheetComparison
  companySettings: AppSettings
  autoPrint?: boolean
}

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

export function BalanceSheetComparisonPrintLayout({
  comparison,
  companySettings,
  autoPrint = false,
}: Props) {
  const { t } = useTranslation()
  const current = comparison.current_period
  const previous = comparison.previous_period
  const rows = buildComparisonRows(current.items ?? [], previous.items ?? [])

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  return (
    <div className="min-h-screen bg-white text-gray-900 print:min-h-0">
      <div className="report-container mx-auto max-w-5xl p-8 print:p-0">
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
            <h2 className="mb-2 text-2xl font-bold">{t('COMPARATIVE BALANCE SHEET')}</h2>
            <p className="text-sm">
              {formatDate(current.balance_sheet_date)} vs {formatDate(previous.balance_sheet_date)}
            </p>
            <p className="text-sm">
              {t('Compared on')} {formatDate(comparison.comparison_date)}
            </p>
          </div>
        </div>

        <BalanceSheetComparisonSections
          rows={rows}
          currentPeriodDate={current.balance_sheet_date}
          previousPeriodDate={previous.balance_sheet_date}
          variant="print"
        />

        <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-4 text-sm font-semibold">
          <div>
            <p className="text-muted-foreground">{t('Total assets')}</p>
            <p className="tabular-nums">{formatCurrency(Number(current.total_assets))}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('Previous')}: {formatCurrency(Number(previous.total_assets))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('Total liabilities')}</p>
            <p className="tabular-nums">{formatCurrency(Number(current.total_liabilities))}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('Previous')}: {formatCurrency(Number(previous.total_liabilities))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('Total equity')}</p>
            <p className="tabular-nums">{formatCurrency(Number(current.total_equity))}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('Previous')}: {formatCurrency(Number(previous.total_equity))}
            </p>
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
