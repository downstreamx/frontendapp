import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { fetchLedgerSummaryExport } from '../double-entry-api'
import { LedgerSummaryPrintLayout } from '../components/LedgerSummaryPrintLayout'

export function LedgerSummaryPrintPage() {
  const { t } = useTranslation()
  const { settings } = useAppContext()
  const [params] = useSearchParams()

  const fromDate = params.get('from_date') ?? ''
  const toDate = params.get('to_date') ?? ''
  const accountId = params.get('account_id') ?? ''
  const search = params.get('search') ?? ''
  const sort = params.get('sort') ?? ''
  const direction = params.get('direction') ?? 'desc'
  const autoPrint = params.get('print') === '1'

  const { data, isLoading, error } = useQuery({
    queryKey: ['ledger-summary-export', fromDate, toDate, accountId, search, sort, direction],
    queryFn: () =>
      fetchLedgerSummaryExport({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        account_id: accountId || undefined,
        search: search || undefined,
        sort: sort || undefined,
        direction,
      }),
  })

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !data) {
    return <p className="p-8 text-sm text-destructive">{t('Failed to load report.')}</p>
  }

  return (
    <LedgerSummaryPrintLayout
      rows={data.rows}
      companySettings={settings}
      filters={{
        from_date: data.filters.from_date ?? fromDate,
        to_date: data.filters.to_date ?? toDate,
      }}
      selectedAccount={data.selected_account}
      autoPrint={autoPrint}
    />
  )
}
