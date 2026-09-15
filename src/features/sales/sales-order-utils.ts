export function getSalesOrderStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-secondary text-secondary-foreground',
    sent: 'bg-accent text-accent-foreground',
    accepted: 'bg-[var(--brand-green-soft)] text-accent-foreground',
    rejected: 'bg-destructive/10 text-destructive',
    expired: 'bg-[var(--brand-orange-soft)] text-[color:var(--brand-orange)]',
    overdue: 'bg-[var(--brand-orange-soft)] text-[color:var(--brand-orange)]',
  }
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`
}

export const SALES_ORDER_STATUS_OPTIONS = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
] as const
