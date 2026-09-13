export const BANK_TRANSFER_STATUS_OPTIONS = ['pending', 'completed', 'failed'] as const

export function getBankTransferStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.pending}`
}

export function formatBankTransferStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return t(label)
}
