import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Printer } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import type { PosCartItem } from '../pos-terminal-utils'

export type CompletedPosSale = {
  id: number
  sale_number: string
  items: PosCartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  customer?: { name: string } | null
  depot?: { name: string } | null
}

type Props = {
  open: boolean
  sale: CompletedPosSale | null
  companyName?: string
  onNewSale: () => void
}

export function PosReceiptModal({ open, sale, companyName, onNewSale }: Props) {
  const { t } = useTranslation()

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onNewSale()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            {t('Sale Completed Successfully!')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-center text-muted-foreground">
            {t('Receipt Number')}: <span className="font-semibold text-foreground">{sale.sale_number}</span>
          </p>

          <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs">
            <p className="mb-2 text-center font-bold">{companyName || t('Company')}</p>
            <p className="text-center text-muted-foreground">{formatDate(new Date().toISOString())}</p>
            <p className="mt-2">
              {t('Customer')}: {sale.customer?.name ?? t('Walk-in Customer')}
            </p>
            {sale.depot?.name ? (
              <p>
                {t('Depot')}: {sale.depot.name}
              </p>
            ) : null}
            <div className="my-3 border-t border-dashed" />
            {sale.items.map((item) => (
              <div key={item.id} className="mb-2 flex justify-between gap-2">
                <span className="truncate">
                  {item.name} × {item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="my-2 border-t border-dashed" />
            <div className="flex justify-between">
              <span>{t('Subtotal')}</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('Tax')}</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
            {sale.discount > 0 ? (
              <div className="flex justify-between text-red-600">
                <span>{t('Discount')}</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            ) : null}
            <div className="mt-1 flex justify-between font-bold">
              <span>{t('Total')}</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link to={paths.pos.print(sale.id)} target="_blank" rel="noreferrer">
                <Printer className="mr-2 h-4 w-4" />
                {t('Print receipt')}
              </Link>
            </Button>
            <Button className="flex-1" onClick={onNewSale}>
              {t('New sale')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
