export function getSalesOrderStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    expired: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    overdue: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`
}

export const SALES_ORDER_STATUS_OPTIONS = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
] as const
