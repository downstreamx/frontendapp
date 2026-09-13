import { PurchaseInvoiceViewPage } from '@/features/purchase/pages/PurchaseInvoiceViewPage'
import { SalesInvoiceViewPage } from '@/features/sales/pages/SalesInvoiceViewPage'
import type { CommercialKind } from '../api'

type Props = { kind: CommercialKind; indexPath: string }

export function CommercialInvoiceViewPage({ kind }: Props) {
  if (kind === 'sales') {
    return <SalesInvoiceViewPage />
  }

  return <PurchaseInvoiceViewPage />
}
