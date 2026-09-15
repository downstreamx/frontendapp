import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Eye, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useDoubleEntryPageChrome } from '../hooks/use-double-entry-page-chrome'
import { getBalanceSheetComparison } from '../balance-sheets-api'
import { buildComparisonRows } from '../balance-sheet-utils'
import { BalanceSheetComparisonSections } from '../components/BalanceSheetComparisonSections'
import { PageContentLoader } from '@/components/ui/page-content-loader'

function periodLabel(date: string, year: string) {
  return `${formatDate(date)} — FY ${year}`
}

export function BalanceSheetComparisonShowPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { auth } = useAppContext()
  const comparisonId = Number(id)

  const canPrint = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'print-balance-sheets',
  )

  const comparisonQuery = useQuery({
    queryKey: ['balance-sheet-comparison', comparisonId],
    queryFn: () => getBalanceSheetComparison(comparisonId),
    enabled: Number.isFinite(comparisonId),
  })

  const comparison = comparisonQuery.data
  useDoubleEntryPageChrome(t('Balance sheet comparison'), t('Reports'))

  if (comparisonQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (!comparison?.current_period || !comparison?.previous_period) {
    return <p className="text-sm text-destructive">{t('Comparison not found.')}</p>
  }

  const current = comparison.current_period
  const previous = comparison.previous_period
  const rows = buildComparisonRows(current.items ?? [], previous.items ?? [])

  const openPrint = (autoPrint: boolean) => {
    const query = autoPrint ? '?print=1' : ''
    window.open(`${paths.doubleEntry.balanceSheetComparisonPrint(comparison.id)}${query}`, '_blank')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap gap-2">
        {canPrint ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => openPrint(true)}>
              <Printer className="mr-2 h-4 w-4" />
              {t('Print')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => openPrint(false)}>
              <Printer className="mr-2 h-4 w-4" />
              {t('Download PDF')}
            </Button>
          </>
        ) : null}
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={paths.doubleEntry.balanceSheetComparisons}>
            <FileText className="mr-2 h-4 w-4" />
            {t('All comparisons')}
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={paths.doubleEntry.balanceSheets}>{t('Balance sheets')}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Period comparison')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('Compared on')} {formatDate(comparison.comparison_date)}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{t('Current period')}</p>
            <p>{periodLabel(current.balance_sheet_date, current.financial_year)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('Total assets')}</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(Number(current.total_assets))}</p>
            <Button type="button" variant="link" size="sm" className="mt-2 h-auto p-0" asChild>
              <Link to={paths.doubleEntry.balanceSheetShow(current.id)}>
                <Eye className="mr-1 h-4 w-4" />
                {t('View balance sheet')}
              </Link>
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{t('Previous period')}</p>
            <p>{periodLabel(previous.balance_sheet_date, previous.financial_year)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('Total assets')}</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(Number(previous.total_assets))}</p>
            <Button type="button" variant="link" size="sm" className="mt-2 h-auto p-0" asChild>
              <Link to={paths.doubleEntry.balanceSheetShow(previous.id)}>
                <Eye className="mr-1 h-4 w-4" />
                {t('View balance sheet')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('COMPARATIVE BALANCE SHEET')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceSheetComparisonSections
            rows={rows}
            currentPeriodDate={current.balance_sheet_date}
            previousPeriodDate={previous.balance_sheet_date}
          />
        </CardContent>
      </Card>
    </div>
  )
}
