export function getChartOfAccountNormalBalanceBadgeClasses(balance: string): string {
  const colors: Record<string, string> = {
    debit: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    credit: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  }
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[balance] ?? ''}`
}

export function formatChartOfAccountNormalBalanceLabel(
  balance: string,
  t: (key: string) => string,
): string {
  const label = balance.charAt(0).toUpperCase() + balance.slice(1)
  return t(label)
}

export function getChartOfAccountActiveBadgeClasses(isActive: boolean): string {
  return isActive
    ? 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
    : 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
}

export function getAccountNameIndent(level?: number): number {
  return Math.max(0, ((level ?? 1) - 1) * 16)
}
