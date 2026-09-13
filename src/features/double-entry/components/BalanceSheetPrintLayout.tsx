import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@/contexts/app-context'
import type { BalanceSheet } from '../balance-sheets-api'
import { BalanceSheetSectionTable } from './BalanceSheetSectionTable'
import {
  SECTION_LABELS,
  groupBalanceSheetItems,
  orderedSectionKeys,
} from '../balance-sheet-utils'
import { formatCurrency, formatDate } from '@/utils/helpers'

type Props = {
  sheet: BalanceSheet
  companySettings: AppSettings
  autoPrint?: boolean
}

function setting(settings: AppSettings, key: string) {
  return settings[key] || ''
}

export function BalanceSheetPrintLayout({ sheet, companySettings, autoPrint = false }: Props) {
  const { t } = useTranslation()
  const grouped = groupBalanceSheetItems(sheet.items ?? [])

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  return (
    <div className="min-h-screen bg-white text-gray-900 print:min-h-0">
      <div className="balance-sheet-container mx-auto max-w-4xl p-8 print:p-0">
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
            <h2 className="mb-2 text-2xl font-bold">{t('BALANCE SHEET')}</h2>
            <p className="text-sm">{formatDate(sheet.balance_sheet_date)}</p>
            <p className="text-sm">
              {t('Financial year')}: {sheet.financial_year}
            </p>
          </div>
        </div>

        {orderedSectionKeys(grouped).map((sectionType) => (
          <BalanceSheetSectionTable
            key={sectionType}
            sectionType={sectionType}
            sectionTitle={t(SECTION_LABELS[sectionType] ?? sectionType)}
            sectionItems={grouped[sectionType]}
          />
        ))}

        <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-4 text-sm font-semibold">
          <div>
            <p className="text-muted-foreground">{t('Total assets')}</p>
            <p className="tabular-nums">{formatCurrency(Number(sheet.total_assets))}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('Total liabilities')}</p>
            <p className="tabular-nums">{formatCurrency(Number(sheet.total_liabilities))}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('Total equity')}</p>
            <p className="tabular-nums">{formatCurrency(Number(sheet.total_equity))}</p>
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
