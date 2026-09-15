import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { getBalanceSheetComparison } from '../balance-sheets-api'
import { BalanceSheetComparisonPrintLayout } from '../components/BalanceSheetComparisonPrintLayout'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function BalanceSheetComparisonPrintPage() {
  const { t } = useTranslation()
  const { settings } = useAppContext()
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const autoPrint = params.get('print') === '1'
  const comparisonId = Number(id)

  const { data, isLoading, error } = useQuery({
    queryKey: ['balance-sheet-comparison-print', comparisonId],
    queryFn: () => getBalanceSheetComparison(comparisonId),
    enabled: Number.isFinite(comparisonId),
  })

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (error || !data) {
    return <p className="p-8 text-sm text-destructive">{t('Failed to load comparison.')}</p>
  }

  return (
    <BalanceSheetComparisonPrintLayout
      comparison={data}
      companySettings={settings}
      autoPrint={autoPrint}
    />
  )
}
