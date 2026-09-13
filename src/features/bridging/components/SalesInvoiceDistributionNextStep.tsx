import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Package } from 'lucide-react'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import { fetchSalesDistributionProgress } from '../bridging-api'
import type { SalesDistributionStatus } from '../types'

type Props = {
  invoiceId: string | number
  paidAmount?: number
  enabled?: boolean
}

export function SalesInvoiceDistributionNextStep({
  invoiceId,
  paidAmount = 0,
  enabled = true,
}: Props) {
  const { t } = useTranslation()

  const { data: progress } = useQuery({
    queryKey: queryKeys.bridging.salesProgress(invoiceId),
    queryFn: () => fetchSalesDistributionProgress(invoiceId),
    enabled,
  })

  if (!progress) return null

  const status = progress.distribution_status as SalesDistributionStatus
  if (status === 'fully_distributed') return null

  let message = ''
  let action: { label: string; href: string } | null = null

  if (status === 'not_eligible') {
    message =
      paidAmount <= 0
        ? t('Record customer payment or credit to unlock distribution entitlements.')
        : t('Provision loading on this invoice to create distribution entitlements.')
  } else if (progress.bridged_trucks_available_count > 0) {
    message = t('{{count}} bridged truck(s) are ready to assign to this invoice.', {
      count: progress.bridged_trucks_available_count,
    })
    action = { label: t('View undistributed sales'), href: paths.sales.undistributed }
  } else {
    message = t(
      'No loaded trucks are available. Bridge and approve truck loads on purchase invoices first.',
    )
    action = { label: t('View unbridged purchases'), href: paths.purchase.unbridged }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <Package className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">{t('Next step')}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      {action ? (
        <Link
          to={action.href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}
