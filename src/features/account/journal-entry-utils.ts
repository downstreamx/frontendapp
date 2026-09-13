export const JOURNAL_ENTRY_STATUS_OPTIONS = ['draft', 'posted', 'reversed'] as const

export function getJournalEntryStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    posted: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    reversed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`
}

export function formatJournalEntryStatusLabel(status: string, t: (key: string) => string): string {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return t(label)
}

export function canUnpostJournalEntry(entry: {
  status: string
  entry_type?: string
  reference_type?: string
}): boolean {
  if (entry.status !== 'posted') return false
  return entry.entry_type === 'manual' || entry.reference_type === 'manual'
}
