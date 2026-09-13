/** Past-due indicator for list due-date styling (status badge uses `status` / `display_status`). */
export function isCommercialInvoicePastDue(row: {
  is_overdue?: boolean
  status?: string
  due_date?: string
  balance_amount?: number
}): boolean {
  if (typeof row.is_overdue === 'boolean') {
    return row.is_overdue
  }
  return (
    ['posted', 'partial'].includes(String(row.status ?? '')) &&
    Boolean(row.due_date && new Date(row.due_date) < new Date()) &&
    Number(row.balance_amount ?? 0) > 0
  )
}
