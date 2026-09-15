import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { getQuotation } from '../quotations-api'
import { QuotationPrintLayout } from '../components/quotation-print-layout'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function QuotationPrintPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { settings } = useAppContext()

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', id],
    queryFn: () => getQuotation(Number(id)),
    enabled: Boolean(id),
  })

  if (isLoading) return <PageContentLoader className="min-h-[16rem]" />
  if (!data) return <p className="p-8 text-sm text-destructive">{t('Quotation not found.')}</p>

  return <QuotationPrintLayout quotation={data} companySettings={settings} autoPrint />
}
