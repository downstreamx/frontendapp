export const BANK_ACCOUNT_TYPE_OPTIONS = [
  { value: '0', labelKey: 'Current' },
  { value: '1', labelKey: 'savings' },
  { value: '2', labelKey: 'credit' },
  { value: '3', labelKey: 'loan' },
] as const

const TYPE_LABEL_KEYS: Record<string, string> = {
  '0': 'Current',
  '1': 'savings',
  '2': 'credit',
  '3': 'loan',
  checking: 'Current',
  savings: 'savings',
  credit: 'credit',
  loan: 'loan',
  credit_card: 'credit_card',
  cash: 'cash',
  other: 'other',
}

export function formatBankAccountType(
  accountType: string,
  t: (key: string) => string,
): string {
  const key = TYPE_LABEL_KEYS[accountType] ?? accountType
  return t(key.charAt(0).toUpperCase() + key.slice(1))
}

export function getBankAccountActiveBadgeClasses(isActive: boolean): string {
  return isActive
    ? 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
    : 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
}
