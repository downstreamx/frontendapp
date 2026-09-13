export function getPurchaseInvoiceStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    posted: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`
}

export const PURCHASE_INVOICE_STATUS_OPTIONS = [
  'draft',
  'posted',
  'partial',
  'paid',
  'overdue',
  'cancelled',
] as const
