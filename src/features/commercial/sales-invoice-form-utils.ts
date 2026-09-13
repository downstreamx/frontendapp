import { calculateLineItemAmounts } from '@/components/commercial/tax-calculator'
import type { CommercialInvoiceFormValues, CommercialInvoiceItem } from './types'

export type SalesInvoiceApiRow = {
  id?: number
  invoice_number?: string
  status?: string
  invoice_date?: string
  due_date?: string
  customer_id?: number
  depot_id?: number | null
  type?: 'product' | 'service'
  payment_terms?: string | null
  notes?: string | null
  items?: Array<Record<string, unknown>>
}

export function mapSalesInvoiceItemFromApi(raw: Record<string, unknown>): CommercialInvoiceItem {
  const quantity = Number(raw.quantity ?? 1)
  const unitPrice = Number(raw.unit_price ?? 0)
  const discountPercentage = Number(raw.discount_percentage ?? 0)
  const taxPercentage = Number(raw.tax_percentage ?? 0)
  const calculated = calculateLineItemAmounts(
    quantity,
    unitPrice,
    discountPercentage,
    taxPercentage,
  )

  return {
    id: raw.id != null ? Number(raw.id) : undefined,
    product_id: Number(raw.product_id ?? 0),
    quantity,
    unit_price: unitPrice,
    discount_percentage: discountPercentage,
    discount_amount: Number(raw.discount_amount ?? calculated.discountAmount),
    tax_percentage: taxPercentage,
    tax_amount: Number(raw.tax_amount ?? calculated.taxAmount),
    total_amount: Number(raw.total_amount ?? calculated.totalAmount),
    taxes: Array.isArray(raw.taxes) ? (raw.taxes as CommercialInvoiceItem['taxes']) : [],
  }
}

export function mapSalesInvoiceToFormValues(row: SalesInvoiceApiRow): CommercialInvoiceFormValues {
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
    customer_id: row.customer_id ? String(row.customer_id) : '',
    supplier_id: '',
    depot_id: row.depot_id ? String(row.depot_id) : '',
    type: row.type === 'service' ? 'service' : 'product',
    payment_terms: String(row.payment_terms ?? ''),
    notes: String(row.notes ?? ''),
    items,
  }
}
