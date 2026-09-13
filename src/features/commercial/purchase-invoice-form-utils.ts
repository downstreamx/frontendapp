import { mapSalesInvoiceItemFromApi } from './sales-invoice-form-utils'
import type { CommercialInvoiceFormValues } from './types'

export type PurchaseInvoiceApiRow = {
  id?: number
  invoice_number?: string
  status?: string
  invoice_date?: string
  due_date?: string
  supplier_id?: number
  depot_id?: number | null
  loading_depot_id?: number | null
  payment_terms?: string | null
  notes?: string | null
  items?: Array<Record<string, unknown>>
}

export function mapPurchaseInvoiceToFormValues(
  row: PurchaseInvoiceApiRow,
): CommercialInvoiceFormValues {
  const items =
    Array.isArray(row.items) && row.items.length > 0
      ? row.items.map((item) => mapSalesInvoiceItemFromApi(item))
      : [
          {
            product_id: 0,
            quantity: 1,
            unit_price: 0,
            discount_percentage: 0,
            discount_amount: 0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 0,
          },
        ]

  return {
    invoice_date: String(row.invoice_date ?? '').slice(0, 10),
    due_date: String(row.due_date ?? '').slice(0, 10),
    customer_id: '',
    supplier_id: row.supplier_id ? String(row.supplier_id) : '',
    depot_id: row.depot_id ? String(row.depot_id) : '',
    loading_depot_id: row.loading_depot_id ? String(row.loading_depot_id) : '',
    type: 'product',
    payment_terms: String(row.payment_terms ?? ''),
    notes: String(row.notes ?? ''),
    items,
  }
}
