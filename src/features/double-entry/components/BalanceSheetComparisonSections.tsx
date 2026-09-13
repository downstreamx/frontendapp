import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate } from '@/utils/helpers'
import {
  SECTION_LABELS,
  comparisonRowsForSection,
  orderedSectionKeys,
  type ComparisonRow,
} from '../balance-sheet-utils'

type Props = {
  rows: ComparisonRow[]
  currentPeriodDate: string
  previousPeriodDate: string
  variant?: 'screen' | 'print'
}

function varianceClass(variance: number) {
  if (variance === 0) return ''
  return variance > 0 ? 'text-green-700' : 'text-red-700'
}

function ComparisonSection({
  sectionType,
  sectionTitle,
  rows,
  variant,
}: {
  sectionType: string
  sectionTitle: string
  rows: ComparisonRow[]
  variant: 'screen' | 'print'
}) {
  const { t } = useTranslation()
  const sectionRows = comparisonRowsForSection(rows, sectionType)
  if (sectionRows.length === 0) return null

  let currentTotal = 0
  let previousTotal = 0

  const rowClass =
    variant === 'print'
      ? 'grid grid-cols-5 gap-4 border-b py-2 text-sm'
      : 'grid grid-cols-5 gap-4 border-b py-2 text-sm last:border-0'

  return (
    <div className={variant === 'print' ? 'mb-6' : 'mb-8'}>
      <h3
        className={
          variant === 'print'
            ? 'mb-3 border-b pb-2 text-base font-semibold'
            : 'mb-3 border-b pb-2 text-lg font-semibold'
        }
      >
        {sectionTitle}
      </h3>
      <div className="space-y-0">
        {sectionRows.map((row) => {
          currentTotal += row.currentAmount
          previousTotal += row.previousAmount
          return (
            <div key={row.accountCode} className={rowClass}>
              <div className="col-span-2">
                <span className="font-medium">{row.name}</span>
                <span className="ml-2 text-muted-foreground">({row.accountCode})</span>
              </div>
              <div className="text-right tabular-nums">{formatCurrency(row.currentAmount)}</div>
              <div className="text-right tabular-nums">{formatCurrency(row.previousAmount)}</div>
              <div
                className={`text-right font-medium tabular-nums ${varianceClass(row.variance)}`}
              >
                {row.variance >= 0 ? '+' : ''}
                {formatCurrency(row.variance)}
              </div>
            </div>
          )
        })}
        <div
          className={`grid grid-cols-5 gap-4 py-3 font-bold ${
            variant === 'print' ? 'border-t-2 border-gray-300' : 'rounded-md border-2 border-blue-200 bg-blue-50'
          }`}
        >
          <div className="col-span-2">
            {t('Total')} {sectionTitle}
          </div>
          <div className="text-right tabular-nums">{formatCurrency(currentTotal)}</div>
          <div className="text-right tabular-nums">{formatCurrency(previousTotal)}</div>
          <div
            className={`text-right tabular-nums ${varianceClass(currentTotal - previousTotal)}`}
          >
            {currentTotal - previousTotal >= 0 ? '+' : ''}
            {formatCurrency(currentTotal - previousTotal)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BalanceSheetComparisonSections({
  rows,
  currentPeriodDate,
  previousPeriodDate,
  variant = 'screen',
}: Props) {
  const { t } = useTranslation()
  const sectionTypes = orderedSectionKeys(
    rows.reduce(
      (acc, row) => {
        if (!acc[row.sectionType]) acc[row.sectionType] = {}
        return acc
      },
      {} as Record<string, Record<string, never>>,
    ),
  )

  const headerClass =
    variant === 'print'
      ? 'mb-4 grid grid-cols-5 gap-4 border-b-2 border-gray-300 py-3 text-sm font-semibold'
      : 'mb-4 grid grid-cols-5 gap-4 rounded-md bg-muted/50 py-3 text-sm font-semibold'

  return (
    <div>
      <div className={headerClass}>
        <div className="col-span-2">{t('Account')}</div>
        <div className="text-right">{formatDate(currentPeriodDate)}</div>
        <div className="text-right">{formatDate(previousPeriodDate)}</div>
        <div className="text-right">{t('Variance')}</div>
      </div>

      {sectionTypes.map((sectionType) => (
        <ComparisonSection
          key={sectionType}
          sectionType={sectionType}
          sectionTitle={t(SECTION_LABELS[sectionType] ?? sectionType)}
          rows={rows}
          variant={variant}
        />
      ))}
    </div>
  )
}
