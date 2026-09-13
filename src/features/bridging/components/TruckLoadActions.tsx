import { useTranslation } from 'react-i18next'
import {
  isTruckLoadArrivedAtDepot,
  isTruckLoadInDistribution,
} from '../bridging-phase-helpers'
import type { TruckLoad } from '../bridging-api'
import { PurchaseTruckLoadActions } from './PurchaseTruckLoadActions'
import { SalesTruckLoadActions } from './SalesTruckLoadActions'

type Props = {
  load: TruckLoad
  onUpdated?: () => void
  size?: 'sm' | 'default'
}

export function TruckLoadActions({ load, onUpdated, size = 'sm' }: Props) {
  const { t } = useTranslation()

  if (load.phase === 'cancelled') {
    return null
  }

  if (load.phase === 'awaiting_load' && load.purchase_invoice_id) {
    return (
      <PurchaseTruckLoadActions
        load={load}
        purchaseInvoiceId={load.purchase_invoice_id}
        onUpdated={onUpdated}
        size={size}
      />
    )
  }

  if (
    load.sales_invoice_id &&
    (isTruckLoadInDistribution(load.phase) || load.phase === 'delivered')
  ) {
    return (
      <SalesTruckLoadActions
        load={load}
        salesInvoiceId={load.sales_invoice_id}
        onUpdated={onUpdated}
        size={size}
      />
    )
  }

  if (isTruckLoadArrivedAtDepot(load.phase)) {
    return (
      <span className="text-xs text-muted-foreground">{t('Ready to assign to sales invoice')}</span>
    )
  }

  return null
}
