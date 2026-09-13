import { calculateLineItemAmounts } from '@/components/commercial/tax-calculator'

export type SalesOrderFormItem = {
  id?: number
  product_id: number
  quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
  taxes?: Array<{ tax_name: string; tax_rate: number; rate?: number }>
}

export type SalesOrderFormValues = {
  proposal_date: string
  due_date: string
  customer_id: string
  depot_id: string
  payment_terms: string
  notes: string
  items: SalesOrderFormItem[]
}

export type SalesOrderApiRow = {
  id?: number
  proposal_number?: string
  status?: string
  converted_to_invoice?: boolean
  proposal_date?: string
  due_date?: string
  customer_id?: number
  depot_id?: number | null
  payment_terms?: string | null
  notes?: string | null
  items?: Array<Record<string, unknown>>
}

export function mapSalesOrderItemFromApi(raw: Record<string, unknown>): SalesOrderFormItem {
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
    taxes: Array.isArray(raw.taxes) ? (raw.taxes as SalesOrderFormItem['taxes']) : [],
  }
}

export function mapSalesOrderToFormValues(row: SalesOrderApiRow): SalesOrderFormValues {
  const items =
    Array.isArray(row.items) && row.items.length > 0
      ? row.items.map((item) => mapSalesOrderItemFromApi(item))
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
    proposal_date: String(row.proposal_date ?? new Date().toISOString().slice(0, 10)).slice(0, 10),
    due_date: row.due_date ? String(row.due_date).slice(0, 10) : '',
    customer_id: row.customer_id != null ? String(row.customer_id) : '',
    depot_id: row.depot_id != null ? String(row.depot_id) : '',
    payment_terms: row.payment_terms ?? '',
    notes: row.notes ?? '',
    items,
  }
}
