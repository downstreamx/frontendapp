export function getPurchaseReturnStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    approved: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`
}

export const PURCHASE_RETURN_STATUS_OPTIONS = ['draft', 'approved', 'completed', 'cancelled'] as const

export const PURCHASE_RETURN_REASON_OPTIONS = [
  'defective',
  'wrong_item',
  'damaged',
  'excess_quantity',
  'other',
] as const
