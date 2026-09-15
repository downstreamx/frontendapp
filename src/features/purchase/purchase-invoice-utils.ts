export function getPurchaseInvoiceStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-secondary text-secondary-foreground',
    posted: 'bg-accent text-accent-foreground',
    partial: 'bg-[var(--brand-orange-soft)] text-[color:var(--brand-orange)]',
    paid: 'bg-[var(--brand-green-soft)] text-accent-foreground',
    overdue: 'bg-destructive/10 text-destructive',
    cancelled: 'bg-destructive/10 text-destructive',
  }
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`
}

export const PURCHASE_INVOICE_STATUS_OPTIONS = [
  'draft',
  'posted',
  'partial',
  'paid',
  'overdue',
  'cancelled',
] as const
