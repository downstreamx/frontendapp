import type { TFunction } from 'i18next'
import { formatQuantity } from '@/lib/format-quantity'
import type { CommercialInvoiceItem, CommercialProduct } from './types'

/**
 * Validates line item quantities against depot stock on loaded product options.
 * Aggregates quantity per product when the same product appears on multiple lines.
 */
export function validateDepotStockQuantities(
  items: CommercialInvoiceItem[],
  products: CommercialProduct[],
  t: TFunction,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const productById = new Map(products.map((product) => [product.id, product]))
  const usage = new Map<number, { total: number; indexes: number[] }>()

  items.forEach((item, index) => {
    if (item.product_id <= 0) return
    const entry = usage.get(item.product_id) ?? { total: 0, indexes: [] }
    entry.total += Number(item.quantity) || 0
    entry.indexes.push(index)
    usage.set(item.product_id, entry)
  })

  for (const [productId, { total, indexes }] of usage) {
    const available = Number(productById.get(productId)?.stock_quantity ?? 0)
    if (total > available) {
      const message = `${t('The quantity entered is more than the available quantity in depot.')} ${t('Available quantity in depot: {{available}}', { available: formatQuantity(available) })}`
      for (const index of indexes) {
        errors[`items.${index}.quantity`] = message
      }
    }
  }

  return errors
}
