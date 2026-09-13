export const EXPENSE_STATUS_OPTIONS = ['draft', 'approved', 'posted'] as const

export function getExpenseStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    posted: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`
}

export function formatExpenseStatusLabel(status: string, t: (key: string) => string): string {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return t(label)
}
