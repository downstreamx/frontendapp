import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { fetchProfitLoss } from '../double-entry-api'
import { ProfitLossPrintLayout } from '../components/ProfitLossPrintLayout'

export function ProfitLossPrintPage() {
  const { t } = useTranslation()
  const { settings } = useAppContext()
  const [params] = useSearchParams()

  const fromDate = params.get('from_date') ?? ''
  const toDate = params.get('to_date') ?? ''
  const autoPrint = params.get('print') === '1'

  const { data, isLoading, error } = useQuery({
    queryKey: ['profit-loss-print', fromDate, toDate],
    queryFn: () => fetchProfitLoss({ from_date: fromDate, to_date: toDate }),
    enabled: Boolean(fromDate && toDate),
  })

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !data) {
    return <p className="p-8 text-sm text-destructive">{t('Failed to load report.')}</p>
  }

  return <ProfitLossPrintLayout report={data} companySettings={settings} autoPrint={autoPrint} />
}
