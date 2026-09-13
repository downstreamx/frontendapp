import type { CommercialInvoiceFormValues, CommercialInvoiceItem } from './types'

type InvoiceTotals = {
  subtotal: number
  discountAmount?: number
  discount_amount?: number
  taxAmount?: number
  tax_amount?: number
  total?: number
  total_amount?: number
}

export function buildPurchaseInvoicePayload(
  values: CommercialInvoiceFormValues,
  totals: InvoiceTotals,
) {
  const discount_amount = totals.discount_amount ?? totals.discountAmount ?? 0
  const tax_amount = totals.tax_amount ?? totals.taxAmount ?? 0
  const total_amount = totals.total_amount ?? totals.total ?? 0
  const items = values.items
    .filter((item) => item.product_id > 0)
    .map((item: CommercialInvoiceItem) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage ?? 0,
      discount_amount: item.discount_amount ?? 0,
      tax_percentage: item.tax_percentage ?? 0,
      tax_amount: item.tax_amount ?? 0,
      total_amount: item.total_amount ?? 0,
    }))

  return {
    invoice_date: values.invoice_date,
    due_date: values.due_date,
    supplier_id: Number(values.supplier_id),
    depot_id: Number(values.depot_id),
    loading_depot_id: values.loading_depot_id ? Number(values.loading_depot_id) : undefined,
    payment_terms: values.payment_terms || undefined,
    notes: values.notes || undefined,
    subtotal: totals.subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    items,
  }
}
