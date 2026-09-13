import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { fetchTrialBalance } from '../double-entry-api'
import { TrialBalancePrintLayout } from '../components/TrialBalancePrintLayout'

export function TrialBalancePrintPage() {
  const { t } = useTranslation()
  const { settings } = useAppContext()
  const [params] = useSearchParams()

  const fromDate = params.get('from_date') ?? ''
  const toDate = params.get('to_date') ?? ''
  const autoPrint = params.get('print') === '1'

  const { data, isLoading, error } = useQuery({
    queryKey: ['trial-balance-print', fromDate, toDate],
    queryFn: () => fetchTrialBalance({ from_date: fromDate, to_date: toDate }),
    enabled: Boolean(fromDate && toDate),
  })

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !data) {
    return <p className="p-8 text-sm text-destructive">{t('Failed to load report.')}</p>
  }

  return (
    <TrialBalancePrintLayout report={data} companySettings={settings} autoPrint={autoPrint} />
  )
}
