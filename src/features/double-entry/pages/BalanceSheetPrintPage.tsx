import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { getBalanceSheet } from '../balance-sheets-api'
import { BalanceSheetPrintLayout } from '../components/BalanceSheetPrintLayout'

export function BalanceSheetPrintPage() {
  const { t } = useTranslation()
  const { settings } = useAppContext()
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const autoPrint = params.get('print') === '1'
  const sheetId = Number(id)

  const { data, isLoading, error } = useQuery({
    queryKey: ['balance-sheet-print', sheetId],
    queryFn: () => getBalanceSheet(sheetId),
    enabled: Number.isFinite(sheetId),
  })

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !data) {
    return <p className="p-8 text-sm text-destructive">{t('Failed to load balance sheet.')}</p>
  }

  return <BalanceSheetPrintLayout sheet={data} companySettings={settings} autoPrint={autoPrint} />
}
