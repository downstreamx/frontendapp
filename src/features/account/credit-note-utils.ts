export function getCreditNoteStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    applied: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`
}

export const CREDIT_NOTE_STATUS_OPTIONS = ['draft', 'partial', 'approved', 'applied'] as const

export function formatCreditNoteStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return t(label)
}
