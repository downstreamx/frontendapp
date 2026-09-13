import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAppContext } from '@/contexts/app-context'
import { getActiveSettings } from '@/lib/page-props-bridge'
import { getPosSale } from '../pos-api'
import { PosSaleReceiptLayout } from '../components/PosSaleReceiptLayout'

export function PosPrintPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const settings = getActiveSettings(useAppContext())
  const saleId = Number(id)

  const { data, isLoading, error } = useQuery({
    queryKey: ['pos', 'print', saleId],
    queryFn: () => getPosSale(saleId),
    enabled: Number.isFinite(saleId),
  })

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !data) {
    return <p className="p-8 text-sm text-destructive">{t('Sale not found.')}</p>
  }

  return <PosSaleReceiptLayout sale={data} companySettings={settings} autoPrint />
}
