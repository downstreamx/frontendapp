import type { SalesOrderFormItem, SalesOrderFormValues } from './sales-order-form-utils'

type ProposalTotals = {
  subtotal: number
  discount_amount?: number
  tax_amount?: number
  total_amount?: number
}

export function buildSalesOrderPayload(values: SalesOrderFormValues, totals: ProposalTotals) {
  const items = values.items
    .filter((item) => item.product_id > 0)
    .map((item: SalesOrderFormItem) => ({
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
    proposal_date: values.proposal_date,
    due_date: values.due_date || undefined,
    customer_id: Number(values.customer_id),
    depot_id: values.depot_id ? Number(values.depot_id) : null,
    payment_terms: values.payment_terms || undefined,
    notes: values.notes || undefined,
    subtotal: totals.subtotal,
    tax_amount: totals.tax_amount ?? 0,
    discount_amount: totals.discount_amount ?? 0,
    total_amount: totals.total_amount ?? 0,
    items,
  }
}
