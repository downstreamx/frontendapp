export const BANK_TRANSACTION_TYPE_OPTIONS = ['debit', 'credit'] as const

export function getBankTransactionTypeBadgeClasses(type: string): string {
  const colors: Record<string, string> = {
    debit: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    credit: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] ?? ''}`
}

export function formatBankTransactionTypeLabel(type: string, t: (key: string) => string): string {
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return t(label)
}

export function getBankTransactionStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    cleared: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.pending}`
}

export function formatBankTransactionStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return t(label)
}
