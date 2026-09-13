/** Highlight open balance on posted / partial commercial invoices. */
export function shouldHighlightBalanceDue(row: {
  status?: string
  balance_amount?: number
}): boolean {
  const status = String(row.status ?? '')
  const balance = Number(row.balance_amount ?? 0)

  return ['posted', 'partial'].includes(status) && balance > 0
}

export function balanceDueAmountClassName(row: {
  status?: string
  balance_amount?: number
}): string {
  return shouldHighlightBalanceDue(row) ? 'text-destructive' : ''
}
