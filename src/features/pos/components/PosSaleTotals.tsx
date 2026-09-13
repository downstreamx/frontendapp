import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/utils/helpers'
import type { PosSale } from '../pos-api'

type Props = {
  sale: PosSale
  className?: string
  bordered?: boolean
}

export function PosSaleTotals({ sale, className = '', bordered = false }: Props) {
  const { t } = useTranslation()

  const subtotal =
    sale.subtotal ??
    (sale.items ?? []).reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0)
  const taxAmount =
    sale.tax_amount ??
    (sale.items ?? []).reduce((sum, item) => sum + Number(item.tax_amount ?? 0), 0)
  const discount = sale.discount_amount ?? sale.payment?.discount ?? 0
  const total =
    sale.total_amount ??
    sale.payment?.final_amount ??
    (sale.items ?? []).reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0)

  const wrapperClass = bordered
    ? 'w-80 space-y-2 rounded border border-gray-300 p-4'
    : 'w-full max-w-xs space-y-3'

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t('Subtotal')}</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t('Discount')}</span>
        <span className="font-medium text-red-600">-{formatCurrency(discount)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t('Tax')}</span>
        <span className="font-medium">{formatCurrency(taxAmount)}</span>
      </div>
      <div className={bordered ? 'border-t border-gray-300 pt-2' : 'border-t pt-3'}>
        <div className="flex justify-between">
          <span className="font-semibold">{t('Total Amount')}</span>
          <span className="text-lg font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
